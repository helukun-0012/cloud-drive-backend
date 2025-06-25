package com.cloudrive.service.impl;

import com.cloudrive.common.constant.CommonConstants;
import com.cloudrive.common.enums.ErrorCode;
import com.cloudrive.common.exception.BusinessException;
import com.cloudrive.common.util.ExceptionUtil;
import com.cloudrive.common.util.FileHashUtil;
import com.cloudrive.common.util.UserContext;
import com.cloudrive.mapper.FileMapper;
import com.cloudrive.model.Response.MultipartUploadInitAndUrlResponse;
import com.cloudrive.model.Response.StsTokenResponse;
import com.cloudrive.model.dto.MultipartUploadCompleteDTO;
import com.cloudrive.model.dto.MultipartUploadInitAndUrlDTO;
import com.cloudrive.model.dto.OssCallbackRequestDTO;
import com.cloudrive.model.entity.FileInfo;
import com.cloudrive.model.entity.User;
import com.cloudrive.model.vo.FileListVO;
import com.cloudrive.repository.FileInfoRepository;
import com.cloudrive.repository.UserRepository;
import com.cloudrive.service.FileService;
import com.cloudrive.service.StorageService;
import com.cloudrive.service.StorageServiceFactory;
import com.cloudrive.service.UploadProgressService;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.codec.binary.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.URL;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 文件服务实现类
 */
@Service
public class FileServiceImpl implements FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileServiceImpl.class);

    private static final String PUB_KEY_HOST_SUFFIX = ".aliyuncs.com";

    private final StorageServiceFactory storageServiceFactory;
    private final FileInfoRepository fileInfoRepository;
    private final UserRepository userRepository;
    private final FileMapper fileMapper;
    private final UploadProgressService uploadProgressService;

    public FileServiceImpl(StorageServiceFactory storageServiceFactory, FileInfoRepository fileInfoRepository, UserRepository userRepository, FileMapper fileMapper, UploadProgressService uploadProgressService) {
        this.storageServiceFactory = storageServiceFactory;
        this.fileInfoRepository = fileInfoRepository;
        this.userRepository = userRepository;
        this.fileMapper = fileMapper;
        this.uploadProgressService = uploadProgressService;
    }

    @Override
    @Transactional
    public  StsTokenResponse getStsToken(String dirPrefix){
        StorageService storageService = storageServiceFactory.getStorageService();
        return storageService.getStsToken(dirPrefix);
    }

    @Override
    @Transactional
    public MultipartUploadInitAndUrlResponse multipartUploadInitAndGetUploadUrls(MultipartUploadInitAndUrlDTO request){
        StorageService storageService = storageServiceFactory.getStorageService();
        return storageService.multipartUploadInitAndGetUploadUrls(request);
    }

    @Override
    @Transactional
    public void completeMultipartUpload(MultipartUploadCompleteDTO dto){
        StorageService storageService = storageServiceFactory.getStorageService();
        storageService.completeMultipartUpload(dto);
    }


    @Override
    @Transactional
    public String uploadFile(MultipartFile file, Long parentId) {
        User currentUser = UserContext.getCurrentUser();

        // 1. 计算文件的SHA-256哈希值
        String sha256Hash = FileHashUtil.calculateSHA256(file);

        // 2. 检查是否存在相同哈希值的文件（秒传逻辑）
        if (sha256Hash != null && !sha256Hash.isEmpty()) {
            // 查找当前用户是否已经上传过相同哈希值的文件
            List<FileInfo> existingFiles = fileInfoRepository.findBySha256HashAndUserIdAndIsDeletedFalse(sha256Hash, currentUser.getId());

            if (!existingFiles.isEmpty()) {
                // 找到了相同哈希值的文件，实现秒传
                FileInfo existingFile = existingFiles.get(0);
                // 使用通用的秒传处理方法，传入null表示不需要进度跟踪
                FileInfo newFileInfo = handleFastUpload(file.getOriginalFilename(), file.getSize(), existingFile, sha256Hash, parentId, null, currentUser);
                return newFileInfo.getPath();
            }
        }

        // 3. 如果没有找到相同哈希值的文件，执行正常上传流程
        StorageService storageService = storageServiceFactory.getStorageService();
        String path = getUploadPath(parentId, currentUser);

        // 上传文件
        //String filePath = storageService.uploadFile(file, path);
        String filePath = storageService.multipartUpload(file, path);

        FileInfo fileInfo = fileMapper.toFileInfo(file, filePath, currentUser, parentId);
        fileInfo.setSha256Hash(sha256Hash);

        return fileInfoRepository.save(fileInfo).getPath();
    }

    @Override
    @Transactional
    public void uploadFileWithProgressFromPath(String filePath, String originalFilename, long fileSize, Long parentId, String taskId, Long userId) {
        // 使用传入的userId获取用户信息
        User currentUser = userRepository.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        try {
            // 从文件路径创建File对象
            File file = new File(filePath);
            if (!file.exists() || !file.isFile()) {
                logger.error("File not found or not a regular file: {}", filePath);
                uploadProgressService.completeUploadTask(taskId, false, "文件不存在或不是常规文件");
                throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
            }

            // 计算文件的SHA-256哈希值
            String sha256Hash = FileHashUtil.calculateSHA256(file);

            // 检查是否可以使用秒传逻辑
            if (sha256Hash != null && !sha256Hash.isEmpty()) {
                List<FileInfo> existingFiles = fileInfoRepository.findBySha256HashAndUserIdAndIsDeletedFalse(sha256Hash, currentUser.getId());

                if (!existingFiles.isEmpty()) {
                    // 处理秒传逻辑
                    FileInfo existingFile = existingFiles.get(0);
                    // 使用通用的秒传处理方法，传入taskId进行进度跟踪
                    handleFastUpload(originalFilename, fileSize, existingFile, sha256Hash, parentId, taskId, currentUser);
                    return;
                }
            }

            // 如果没有找到相同哈希值的文件，执行正常上传流程
            String uploadPath = getUploadPath(parentId, currentUser);

            // 使用带进度跟踪的上传方法
            StorageService storageService = storageServiceFactory.getStorageService();
            String uploadedPath = storageService.uploadFileWithProgressFromPath(file, uploadPath, taskId, originalFilename, fileSize);
            //String uploadedPath = storageService.multipartUpload(file, uploadPath);

            // 使用MapStruct创建文件信息记录
            // 注意：这里的originalFilename是文件名，uploadedPath是文件路径
            FileInfo fileInfo = fileMapper.toFileInfoFromPath(originalFilename, uploadedPath, fileSize, currentUser, parentId, sha256Hash);
            fileInfoRepository.save(fileInfo);
        } catch (Exception e) {
            // 标记任务失败
            logger.error("Error uploading file from path: {}, error: {}", filePath, e.getMessage());
            uploadProgressService.completeUploadTask(taskId, false, e.getMessage());
            throw e;
        }
    }

    /**
     * 处理秒传逻辑，可用于普通上传和带进度上传
     * 
     * @param filename 文件名
     * @param fileSize 文件大小
     * @param existingFile 已存在的文件
     * @param sha256Hash 文件哈希值
     * @param parentId 父目录ID
     * @param taskId 上传任务ID，如果为null则不进行进度跟踪
     * @param currentUser 当前用户
     * @return 新创建的文件信息对象
     */
    private FileInfo handleFastUpload(String filename, long fileSize, FileInfo existingFile, String sha256Hash, Long parentId, String taskId, User currentUser) {
        // 使用MapStruct创建一个新的文件记录
        FileInfo newFileInfo = fileMapper.toFileInfoForFastUpload(filename, existingFile, currentUser, parentId, sha256Hash);

        // 如果有任务ID，则进行进度跟踪
        if (taskId != null) {
            // 模拟上传进度（秒传情况下直接完成）
            uploadProgressService.updateProgress(taskId, fileSize, fileSize);
            uploadProgressService.completeUploadTask(taskId, true, "文件秒传成功");
        }

        // 保存新的文件记录
        return fileInfoRepository.save(newFileInfo);
    }

    /**
     * 获取上传路径
     */
    private String getUploadPath(Long parentId, User currentUser) {
        String path = CommonConstants.File.FILE_PATH_PREFIX + currentUser.getId();
        if (parentId != null) {
            FileInfo parent = fileInfoRepository.findById(parentId).orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
            path = parent.getPath();
        }
        return path;
    }

    @Override
    public byte[] downloadFile(Long fileId) {
        User currentUser = UserContext.getCurrentUser();
        FileInfo fileInfo = getAndValidateFile(fileId, currentUser);
        return retrieveFileContent(fileInfo);
    }

    @Override
    public List<FileListVO> listFiles(Long parentId) {
        Long userId = UserContext.getCurrentUserId();
        List<FileInfo> fileInfos = fileInfoRepository.findByUserIdAndParentIdAndIsDeletedFalse(userId, parentId);

        return fileInfos.stream().map(fileMapper::toFileListVO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteFile(Long fileId) {
        User currentUser = UserContext.getCurrentUser();
        FileInfo fileInfo = getAndValidateFile(fileId, currentUser);

        // 如果是文件夹，检查是否为空
        if (fileInfo.getIsFolder()) {
            validateFolderIsEmpty(fileId);
        } else {
            // 如果是文件，检查是否有其他引用（相同哈希值的文件）
            String filePath = fileInfo.getPath();
            long referenceCount = fileInfoRepository.countByPathAndIsDeletedFalse(filePath);
            // 如果只有当前文件引用，则从存储中删除
            if (referenceCount <= 1) {
                StorageService storageService = storageServiceFactory.getStorageService();
                storageService.deleteFile(fileInfo.getPath());
                logger.info("Deleted file from storage: {}", fileInfo.getPath());
            } else {
                logger.info("Skipped physical deletion due to references: {}, count: {}", fileInfo.getPath(), referenceCount);
            }
        }

        // 逻辑删除文件记录
        fileInfo.setIsDeleted(true);
        fileInfo.setUpdatedAt(LocalDateTime.now());
        fileInfoRepository.save(fileInfo);
    }

    @Override
    @Transactional
    public void renameFile(Long fileId, String newFilename) {
        User currentUser = UserContext.getCurrentUser();
        FileInfo fileInfo = getAndValidateFile(fileId, currentUser);

        fileInfo.setFilename(newFilename);
        fileInfo.setUpdatedAt(LocalDateTime.now());
        fileInfoRepository.save(fileInfo);
    }

    @Override
    public List<FileListVO> searchFiles(String keyword) {
        Long userId = UserContext.getCurrentUserId();
        List<FileInfo> fileInfos = fileInfoRepository.searchByFilename(userId, keyword);

        return fileInfos.stream().map(fileMapper::toFileListVO).collect(Collectors.toList());
    }

    @Override
    public String getFilename(Long fileId) {
        return fileInfoRepository.findById(fileId).orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND)).getFilename();
    }

    @Override
    public byte[] getFileContent(Long fileId) {
        FileInfo fileInfo = fileInfoRepository.findById(fileId).orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
        return retrieveFileContent(fileInfo);
    }

    @Override
    public void handleOssCallback(OssCallbackRequestDTO dto, HttpServletRequest request){
        // 1. 验签：验证请求是否来自 OSS，防止伪造
        boolean valid = verifyOSSCallbackRequest(request);
        if (!valid) {
            throw new SecurityException("OSS callback signature verification failed");
        }
        // 2. 验证必填字段
        if (dto.getUserId() == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (dto.getObject() == null || dto.getObject().isBlank()) {
            throw new IllegalArgumentException("object key must not be blank");
        }
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 4. 组装文件实体
        FileInfo fileInfo = fileMapper.toFileInfoFromPath(dto.getOriginalFilename(),
                dto.getObject(), dto.getSize(), userRepository.findById(dto.getUserId()).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND))
                        , dto.getParentId(), dto.getEtag());


        // 5. 保存文件记录
        fileInfoRepository.save(fileInfo);

        // 6. 返回保存的文件信息（可选）
    }



    private FileInfo getAndValidateFile(Long fileId, User currentUser) {
        FileInfo fileInfo = fileInfoRepository.findById(fileId).orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));

        ExceptionUtil.throwIf(!fileInfo.getUser().getId().equals(currentUser.getId()), ErrorCode.NO_PERMISSION);

        ExceptionUtil.throwIf(fileInfo.getIsDeleted(), ErrorCode.FILE_NOT_FOUND);

        return fileInfo;
    }

    private void validateFolderIsEmpty(Long folderId) {
        long childCount = fileInfoRepository.countByParentIdAndIsDeletedFalse(folderId);
        ExceptionUtil.throwIf(childCount > 0, ErrorCode.FOLDER_NOT_EMPTY);
    }

    private byte[] retrieveFileContent(FileInfo fileInfo) {
        ExceptionUtil.throwIf(fileInfo.getIsFolder(), ErrorCode.CANNOT_DOWNLOAD_FOLDER);

        String filePath = fileInfo.getPath();
        StorageService storageService = storageServiceFactory.getStorageService();

        return storageService.downloadFile(filePath);
    }


    /**
     * 验证 OSS 回调请求是否有效
     */
    public boolean verifyOSSCallbackRequest(HttpServletRequest request) {
        try {
            // 1. 读取请求头中的签名和公钥URL
            String authorizationBase64 = request.getHeader("Authorization");
            String pubKeyUrlBase64 = request.getHeader("x-oss-pub-key-url");
            if (authorizationBase64 == null || pubKeyUrlBase64 == null) {
                return false;
            }

            // 2. 解码 Base64
            byte[] signature = Base64.decodeBase64(authorizationBase64);
            String pubKeyUrl = new String(Base64.decodeBase64(pubKeyUrlBase64), "UTF-8");

            // 3. 验证公钥URL是否来自阿里云
            if (!isValidAliyunUrl(pubKeyUrl)) {
                return false;
            }

            // 4. 下载公钥证书
            PublicKey publicKey = loadPublicKeyFromUrl(pubKeyUrl);

            // 5. 读取请求体数据（原始回调内容）
            String callbackBody = readRequestBody(request);

            // 6. 生成待验签字符串
            String authString = request.getMethod() + " " + request.getRequestURI();
            String queryString = request.getQueryString();
            if (queryString != null && !queryString.isEmpty()) {
                authString += "?" + queryString;
            }
            authString += "\n" + callbackBody;

            // 7. 验证签名
            Signature sig = Signature.getInstance("SHA1withRSA");
            sig.initVerify(publicKey);
            sig.update(authString.getBytes("UTF-8"));
            return sig.verify(signature);

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // 判断公钥URL合法性，必须来自 aliyuncs.com 域名，防止钓鱼攻击
    private boolean isValidAliyunUrl(String url) {
        try {
            URL parsedUrl = new URL(url);
            return parsedUrl.getHost().endsWith(PUB_KEY_HOST_SUFFIX);
        } catch (Exception e) {
            return false;
        }
    }

    // 通过公钥URL下载公钥证书并加载 PublicKey
    private PublicKey loadPublicKeyFromUrl(String pubKeyUrl) throws Exception {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new URL(pubKeyUrl).openStream()))) {
            String pubKeyPem = br.lines().collect(Collectors.joining("\n"));
            return loadPublicKey(pubKeyPem);
        }
    }

    // 解析 PEM 格式的公钥字符串，转成 PublicKey
    private PublicKey loadPublicKey(String pem) throws Exception {
        // 移除 PEM 头尾
        pem = pem.replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");

        byte[] decoded = Base64.decodeBase64(pem);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePublic(spec);
    }

    // 读取请求体字符串
    private String readRequestBody(HttpServletRequest request) throws Exception {
        try (BufferedReader reader = request.getReader()) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }


    /// TODO：在验证过程中加入缓存避免每次都认证
}
