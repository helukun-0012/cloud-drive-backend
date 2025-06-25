package com.cloudrive.service.impl;

import com.aliyun.oss.*;
import com.aliyun.oss.common.comm.SignVersion;
import com.aliyun.oss.event.ProgressEvent;
import com.aliyun.oss.event.ProgressEventType;
import com.aliyun.oss.event.ProgressListener;
import com.aliyun.oss.model.*;
import com.aliyun.oss.model.OSSObject;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.auth.sts.AssumeRoleRequest;
import com.aliyuncs.auth.sts.AssumeRoleResponse;
import com.aliyuncs.http.MethodType;
import com.aliyuncs.profile.DefaultProfile;
import com.cloudrive.common.constant.CommonConstants;
import com.cloudrive.common.enums.ErrorCode;
import com.cloudrive.common.util.ExceptionUtil;
import com.cloudrive.common.util.UserContext;
import com.cloudrive.config.properties.OssProperties;
import com.cloudrive.model.Response.MultipartUploadInitAndUrlResponse;
import com.cloudrive.model.Response.PartUploadUrl;
import com.cloudrive.model.Response.StsTokenResponse;
import com.cloudrive.model.dto.MultipartUploadCompleteDTO;
import com.cloudrive.model.dto.MultipartUploadInitAndUrlDTO;
import com.cloudrive.service.StorageService;
import com.cloudrive.service.UploadProgressService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * 基于阿里云OSS的存储服务实现
 */
@Service
public class OssStorageServiceImpl implements StorageService {

    private static final Logger logger = LoggerFactory.getLogger(OssStorageServiceImpl.class);

    private final OssProperties ossProperties;
    private final UploadProgressService uploadProgressService;

    @Autowired
    public OssStorageServiceImpl(OssProperties ossProperties, UploadProgressService uploadProgressService) {
        this.ossProperties = ossProperties;
        this.uploadProgressService = uploadProgressService;
    }

    @Override
    public String uploadFile(MultipartFile file, String path) {
        checkOssEnabled();

        String fileName = generateUniqueFileName();
        String objectName = buildObjectName(path, fileName);

        OSS ossClient = null;
        try {
            ossClient = getOssClient();
            ossClient.putObject(ossProperties.getBucketName(), objectName, file.getInputStream());
            return objectName;
        } catch (Exception e) {
            logger.error("Failed to upload file to OSS: bucket={}, objectName={}, error={}", ossProperties.getBucketName(), objectName, e.getMessage());
            ExceptionUtil.throwBizException(ErrorCode.OSS_UPLOAD_FAILED, e.getMessage());
            return null; // 不会执行到这里，为了编译通过
        } finally {
            closeOssClient(ossClient);
        }
    }

    /**
     * 多线程+分片上传
     */
    public String multipartUpload(MultipartFile file, String path) {
        checkOssEnabled();

        String fileName = generateUniqueFileName();
        String objectName = buildObjectName(path, fileName);

        OSS ossClient = null;
        //List<PartETag> partETags = new ArrayList<>();
        List<PartETag> partETags = Collections.synchronizedList(new ArrayList<>());

        // 自定义线程池
        int corePoolSize = 5;
        int maxPoolSize = 10;
        int queueCapacity = 100;
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                corePoolSize,
                maxPoolSize,
                60L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(queueCapacity),
                new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：主线程执行
        );



        try {
            ossClient = getOssClient();
            File tempFile = File.createTempFile("upload-", ".tmp");
            file.transferTo(tempFile);
            long fileSize = tempFile.length();

            // 1. 初始化分片上传
            InitiateMultipartUploadRequest request = new InitiateMultipartUploadRequest(ossProperties.getBucketName(), objectName);
            InitiateMultipartUploadResult initResult = ossClient.initiateMultipartUpload(request);
            String uploadId = initResult.getUploadId();

            // 2. 设置分片大小（5MB）
            final long partSize = 5 * 1024 * 1024L;
            //long fileSize = file.getSize();
            int partCount = (int) ((fileSize + partSize - 1) / partSize);

            CountDownLatch latch = new CountDownLatch(partCount);


            for (int i = 0; i < partCount; i++) {
                final int partNumber = i + 1;
                final long start = i * partSize;
                final long size = Math.min(partSize, fileSize - start);

                OSS finalOssClient = ossClient;
                executor.execute(() -> {
                    try (RandomAccessFile raf = new RandomAccessFile(tempFile, "r")) {
                        byte[] buffer = new byte[(int) size];
                        raf.seek(start);
                        raf.readFully(buffer);

                        UploadPartRequest uploadPartRequest = new UploadPartRequest();
                        uploadPartRequest.setBucketName(ossProperties.getBucketName());
                        uploadPartRequest.setKey(objectName);
                        uploadPartRequest.setUploadId(uploadId);
                        uploadPartRequest.setPartNumber(partNumber);
                        uploadPartRequest.setPartSize(buffer.length);
                        uploadPartRequest.setInputStream(new ByteArrayInputStream(buffer));
                        UploadPartResult result = finalOssClient.uploadPart(uploadPartRequest);

                        partETags.add(result.getPartETag());
                    } catch (Exception e) {
                        logger.error("Part {} upload failed: {}", partNumber, e.getMessage(), e);
                        throw new RuntimeException("Upload failed", e);
                    } finally {
                        latch.countDown();
                    }
                });
            }

            // 4. 按 partNumber 升序合并

            latch.await();

            partETags.sort(Comparator.comparingInt(PartETag::getPartNumber));
            CompleteMultipartUploadRequest completeMultipartUploadRequest =
                    new CompleteMultipartUploadRequest(ossProperties.getBucketName(), objectName, uploadId, partETags);

            // 完成分片上传。
            CompleteMultipartUploadResult completeMultipartUploadResult = ossClient.completeMultipartUpload(completeMultipartUploadRequest);
            System.out.println("上传成功，ETag：" + completeMultipartUploadResult.getETag());

            return objectName;
        } catch (Exception e) {
            logger.error("Failed to upload file to OSS: bucket={}, objectName={}, error={}", ossProperties.getBucketName(), objectName, e.getMessage());
            ExceptionUtil.throwBizException(ErrorCode.OSS_UPLOAD_FAILED, e.getMessage());
            return null; // 不会执行到这里，为了编译通过
        } finally {
            closeOssClient(ossClient);
        }

    }


    @Override
    public byte[] downloadFile(String path) {
        checkOssEnabled();

        OSS ossClient = null;
        try {
            ossClient = getOssClient();
            OSSObject ossObject = ossClient.getObject(ossProperties.getBucketName(), path);
            if (ossObject == null) {
                logger.error("File not found in OSS: bucket={}, path={}", ossProperties.getBucketName(), path);
                ExceptionUtil.throwBizException(ErrorCode.FILE_NOT_FOUND);
                return null;
            }
            return ossObject.getObjectContent().readAllBytes();
        } catch (Exception e) {
            logger.error("Failed to download file from OSS: bucket={}, path={}, error={}", ossProperties.getBucketName(), path, e.getMessage());
            ExceptionUtil.throwBizException(ErrorCode.OSS_DOWNLOAD_FAILED, e.getMessage());
            return null; // 不会执行到这里，为了编译通过
        } finally {
            closeOssClient(ossClient);
        }
    }

    @Override
    public String uploadFileWithProgressFromPath(File file, String path, String taskId, String originalFilename, long fileSize) {
        checkOssEnabled(taskId);

        try {
            if (!file.exists() || !file.isFile()) {
                handleUploadError(taskId, "文件不存在或不是常规文件");
            }

            // 直接使用文件输入流进行上传，而不转换为MultipartFile
            String fileName = generateUniqueFileName();
            String objectName = buildObjectName(path, fileName);

            OSS ossClient = null;
            try (FileInputStream input = new FileInputStream(file)) {
                // 创建带进度监听的请求
                PutObjectRequest putObjectRequest = new PutObjectRequest(ossProperties.getBucketName(), objectName, input);
                
                // 设置进度监听器
                logger.info("Setting up progress listener for file: {}, taskId: {}, size: {}", originalFilename, taskId, fileSize);
                putObjectRequest.withProgressListener(createProgressListener(taskId, fileSize));
                
                // 执行上传
                ossClient = getOssClient();
                ossClient.putObject(putObjectRequest);
                
                return objectName;
            } catch (Exception e) {
                logger.error("Failed to upload file to OSS with progress tracking: bucket={}, objectName={}, error={}", 
                    ossProperties.getBucketName(), objectName, e.getMessage());
                uploadProgressService.completeUploadTask(taskId, false, "OSS上传失败: " + e.getMessage());
                ExceptionUtil.throwBizException(ErrorCode.OSS_UPLOAD_FAILED, "OSS上传失败: " + e.getMessage());
                return null; // 不会执行到这里，为了编译通过
            } finally {
                closeOssClient(ossClient);
            }
        } catch (Exception e) {
            handleUploadError(taskId, "文件上传失s败: " + e.getMessage());
            throw e;
        }
    }

    @Override
    public StsTokenResponse getStsToken(String dirPrefix) {
        try {
            DefaultProfile profile = DefaultProfile.getProfile("cn-hangzhou", "", "");
            IAcsClient client = new DefaultAcsClient(profile);

            AssumeRoleRequest request = new AssumeRoleRequest();
            request.setSysMethod(MethodType.POST);
            request.setRoleArn("acs:ram::1141862157537578:role/sts-user-001");
            request.setRoleSessionName("demo-session");
            request.setDurationSeconds(3600L); // 有效期 1 小时

            // 限制只能上传到某个目录
            String policy = "{\n" +
                    "  \"Version\": \"1\",\n" +
                    "  \"Statement\": [\n" +
                    "    {\n" +
                    "      \"Effect\": \"Allow\",\n" +
                    "      \"Action\": [\"oss:PutObject\"],\n" +
                    "      \"Resource\": [\"acs:oss:*:*:" + "oss-bucket-helukun-001" + "/" + dirPrefix + "*\"]\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}";
            request.setPolicy(policy);

            AssumeRoleResponse response = null;
            try {
                response = client.getAcsResponse(request);
            } catch (com.aliyuncs.exceptions.ClientException e) {
                throw new RuntimeException(e);
            }
            AssumeRoleResponse.Credentials c = response.getCredentials();

            return new StsTokenResponse(
                    c.getAccessKeyId(),
                    c.getAccessKeySecret(),
                    c.getSecurityToken(),
                    c.getExpiration()
            );
        } catch (ClientException e) {
            throw new RuntimeException("获取 STS 凭证失败", e);
        }
    }

    /**
     * 初始化分片上传任务并返回签名URL
     */
    @Override
    public MultipartUploadInitAndUrlResponse multipartUploadInitAndGetUploadUrls(MultipartUploadInitAndUrlDTO request)  {
        ClientBuilderConfiguration config = new ClientBuilderConfiguration();
        config.setSignatureVersion(SignVersion.V4);
        OSS ossClient = new OSSClientBuilder().build(ossProperties.getEndpoint(), ossProperties.getAccessKeyId(), ossProperties.getAccessKeySecret());

        // 构建 objectKey（你也可以根据 userId 和 parentId 来构造）
        Long userId = UserContext.getCurrentUserId();  // 假设你有这个上下文工具
        String objectKey = String.format("user-uploads/user_%d/%s/%s", userId, UUID.randomUUID(), request.getFilename());
        System.out.println(request.getFilename());

        // 初始化上传任务
        InitiateMultipartUploadRequest initRequest = new InitiateMultipartUploadRequest(ossProperties.getBucketName(), objectKey);
        InitiateMultipartUploadResult initResult = ossClient.initiateMultipartUpload(initRequest);
        String uploadId = initResult.getUploadId();

        // 生成每个分片的 PUT 签名 URL
        List<PartUploadUrl> partUploadUrls = new ArrayList<>();
        for (int partNumber = 1; partNumber <= request.getPartCount(); partNumber++) {
            Date expiration = new Date(System.currentTimeMillis() + 3600 * 1000);
            GeneratePresignedUrlRequest urlRequest = new GeneratePresignedUrlRequest(ossProperties.getBucketName(), objectKey, HttpMethod.PUT);
            urlRequest.setExpiration(expiration);
            urlRequest.addQueryParameter("partNumber", String.valueOf(partNumber));
            urlRequest.addQueryParameter("uploadId", uploadId);

            URL signedUrl = ossClient.generatePresignedUrl(urlRequest);
            partUploadUrls.add(new PartUploadUrl(partNumber, signedUrl.toString()));
        }

        ossClient.shutdown();

        // 返回结构
        MultipartUploadInitAndUrlResponse response = new MultipartUploadInitAndUrlResponse();
        response.setUploadId(uploadId);
        response.setObjectKey(objectKey);
        response.setPartUploadUrls(partUploadUrls);
        return response;
    }

    /**
     * 合并上传分片
     */
    public void completeMultipartUpload(MultipartUploadCompleteDTO dto) {
        // 初始化 OSS 客户端
        OSS ossClient = new OSSClientBuilder().build(ossProperties.getEndpoint(), ossProperties.getAccessKeyId(), ossProperties.getAccessKeySecret());


        try {
            List<PartETag> partETags = dto.getParts().stream()
                    .map(p -> new PartETag(p.getPartNumber(), p.getETag()))
                    .sorted(Comparator.comparingInt(PartETag::getPartNumber)) // 必须升序
                    .collect(Collectors.toList());

            // 设置上传回调参数。
            String callbackUrl = "https://example.com:23450";
            Callback callback = new Callback();
            callback.setCallbackUrl(callbackUrl);

            // 设置回调请求的Body内容，采用JSON格式，并定义回调Body的占位符变量。
            callback.setCalbackBodyType(Callback.CalbackBodyType.JSON);
            callback.setCallbackBody(
                    "{" +
                            "\\\"bucket\\\":${bucket}," +
                            "\\\"object\\\":${object}," +
                            "\\\"etag\\\":${etag}," +
                            "\\\"mimeType\\\":${mimeType}," +
                            "\\\"size\\\":${size}," +
                            "\\\"originalFilename\\\":${x:originalFilename}," +
                            "\\\"userId\\\":${x:userId}," +
                            "\\\"parentId\\\":${x:parentId}" +
                            "}"
            );
            Long userId = UserContext.getCurrentUserId();
            callback.addCallbackVar("x:originalFilename", dto.getObjectKey().substring(dto.getObjectKey().lastIndexOf("/") + 1)); // 前端传入
            callback.addCallbackVar("x:userId", String.valueOf(userId));     // 用户上下文
            callback.addCallbackVar("x:parentId", null); // 当前目录


            CompleteMultipartUploadRequest completeRequest =
                    new CompleteMultipartUploadRequest(ossProperties.getBucketName(), dto.getObjectKey(), dto.getUploadId(), partETags);
            completeRequest.setCallback(callback);
            // 调用 OSS 完成分片合并
            ossClient.completeMultipartUpload(completeRequest);

        } finally {
            ossClient.shutdown();
        }
    }

    /**
     * 创建进度监听器
     */
    private ProgressListener createProgressListener(String taskId, long fileSize) {
        return new ProgressListener() {
            private long totalBytesTransferred = 0;

            @Override
            public void progressChanged(ProgressEvent progressEvent) {
                long bytes = progressEvent.getBytes();
                ProgressEventType eventType = progressEvent.getEventType();

                logger.info("Progress event: type={}, bytes={}, taskId={}", eventType, bytes, taskId);

                switch (eventType) {
                    case REQUEST_CONTENT_LENGTH_EVENT -> {
                        // 更新总字节数
                        uploadProgressService.updateProgress(taskId, 0, fileSize);
                    }
                    case REQUEST_BYTE_TRANSFER_EVENT -> {
                        // 更新已传输字节数，bytes是本次传输的字节数，需要累加
                        totalBytesTransferred += bytes;
                        uploadProgressService.updateBytesTransferred(taskId, bytes);

                        // 直接设置进度百分比，确保前端能看到变化
                        double percentage = (double) totalBytesTransferred / fileSize * 100;
                        logger.info("Upload percentage: {}%, taskId: {}", percentage, taskId);

                        // 更新任务进度
                        UploadProgressService.UploadTask task = uploadProgressService.getUploadTask(taskId);
                        if (task != null) {
                            task.setProgress(percentage);
                        }
                    }
                    case TRANSFER_COMPLETED_EVENT -> 
                        // 标记任务完成
                        uploadProgressService.completeUploadTask(taskId, true, "上传完成");
                    case TRANSFER_FAILED_EVENT -> 
                        // 标记任务失败
                        uploadProgressService.completeUploadTask(taskId, false, "上传失败");
                    default -> { }
                }
            }
        };
    }

    @Override
    public void deleteFile(String path) {
        checkOssEnabled();

        OSS ossClient = null;
        try {
            ossClient = getOssClient();
            ossClient.deleteObject(ossProperties.getBucketName(), path);
        } catch (Exception e) {
            ExceptionUtil.throwBizException(ErrorCode.OSS_DELETE_FAILED, e.getMessage());
        } finally {
            closeOssClient(ossClient);
        }
    }

    /**
     * 检查OSS是否启用
     */
    private void checkOssEnabled() {
        if (!ossProperties.getEnabled()) {
            logger.error("OSS storage is disabled");
            ExceptionUtil.throwBizException(ErrorCode.OSS_DISABLED);
        }
    }

    /**
     * 检查OSS是否启用，如果未启用则更新任务状态
     */
    private void checkOssEnabled(String taskId) {
        if (!ossProperties.getEnabled()) {
            logger.error("OSS storage is disabled. Please enable OSS in configuration or implement a local storage service.");
            uploadProgressService.completeUploadTask(taskId, false, "OSS存储服务未启用，请在配置中启用OSS或实现本地存储服务");
            ExceptionUtil.throwBizException(ErrorCode.OSS_DISABLED, "OSS存储服务未启用，请在配置中启用OSS或实现本地存储服务");
        }
    }

    /**
     * 处理上传错误
     */
    private void handleUploadError(String taskId, String errorMessage) {
        logger.error(errorMessage);
        uploadProgressService.completeUploadTask(taskId, false, errorMessage);
        ExceptionUtil.throwBizException(ErrorCode.FILE_UPLOAD_FAILED, errorMessage);
    }

    /**
     * 关闭OSS客户端
     */
    private void closeOssClient(OSS ossClient) {
        if (ossClient != null) {
            ossClient.shutdown();
        }
    }

    private OSS getOssClient() {
        return new OSSClientBuilder().build("https://" + ossProperties.getEndpoint(), ossProperties.getAccessKeyId(), ossProperties.getAccessKeySecret());
    }

    private String generateUniqueFileName() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String buildObjectName(String path, String fileName) {
        return path.endsWith(CommonConstants.File.SLASH) ? path + fileName : path + CommonConstants.File.SLASH + fileName;
    }
}
