package com.cloudrive.service.impl;

import com.aliyun.oss.ClientException;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.common.auth.DefaultCredentialProvider;
import com.aliyun.oss.model.*;
import java.security.MessageDigest;

import java.io.*;
import java.util.*;
import java.util.concurrent.*;



public class OssMultipartUploadDemo {

    public static void main(String[] args) throws Exception {
        String endpoint = "https://oss-cn-hangzhou.aliyuncs.com";
        String accessKeyId = ""; // or "your-access-key-id"
        String accessKeySecret =""; // or "your-secret"
        String bucketName = "oss-bucket-helukun-001";
        String objectName = "exampleobject.zip";
        String filePath = ""; // 改成你的本地测试文件路径

        if (accessKeyId == null || accessKeySecret == null) {
            throw new IllegalArgumentException("AccessKeyId or AccessKeySecret is null. Please set environment variables.");
        }

        OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
        File sampleFile = new File(filePath);
        long fileLength = sampleFile.length();

        long partSize = calculatePartSize(fileLength);
        int partCount = (int) ((fileLength + partSize - 1) / partSize);

        InitiateMultipartUploadRequest request = new InitiateMultipartUploadRequest(bucketName, objectName);
        InitiateMultipartUploadResult initResult = null;
        String uploadId = null;

        List<PartETag> partETags = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch latch = new CountDownLatch(partCount);
        ThreadPoolExecutor executor = new ThreadPoolExecutor(5, 10, 60, TimeUnit.SECONDS, new LinkedBlockingQueue<>());

        try {
            initResult = ossClient.initiateMultipartUpload(request);
            uploadId = initResult.getUploadId();
            System.out.println("UploadId: " + uploadId);

            for (int i = 0; i < partCount; i++) {
                final int partNumber = i + 1;
                final long startPos = i * partSize;
                final long size = Math.min(partSize, fileLength - startPos);

                String finalUploadId = uploadId;
                executor.execute(() -> {
                    for (int attempt = 0; attempt < 3; attempt++) {
                        try (RandomAccessFile raf = new RandomAccessFile(sampleFile, "r")) {
                            byte[] buffer = new byte[(int) size];
                            raf.seek(startPos);
                            raf.readFully(buffer);

                            UploadPartRequest uploadPartRequest = new UploadPartRequest();
                            uploadPartRequest.setBucketName(bucketName);
                            uploadPartRequest.setKey(objectName);
                            uploadPartRequest.setUploadId(finalUploadId);
                            uploadPartRequest.setPartNumber(partNumber);
                            uploadPartRequest.setPartSize(size);
                            uploadPartRequest.setInputStream(new ByteArrayInputStream(buffer));

                            UploadPartResult uploadPartResult = ossClient.uploadPart(uploadPartRequest);
                            partETags.add(uploadPartResult.getPartETag());
                            System.out.println("Part " + partNumber + " uploaded");
                            break; // 成功就跳出重试
                        } catch (Exception e) {
                            if (attempt == 2) {
                                System.err.println("Part " + partNumber + " failed after 3 attempts: " + e.getMessage());
                            } else {
                                System.out.println("Retry part " + partNumber + " attempt " + (attempt + 1));
                            }
                        }
                    }
                    latch.countDown();
                });
            }

            latch.await();
            executor.shutdown();

            partETags.sort(Comparator.comparingInt(PartETag::getPartNumber));
            CompleteMultipartUploadRequest completeRequest = new CompleteMultipartUploadRequest(bucketName, objectName, uploadId, partETags);
            CompleteMultipartUploadResult result = ossClient.completeMultipartUpload(completeRequest);

            System.out.println("上传成功！ETag: " + result.getETag());

            // 可选：文件完整性校验（简单MD5）
            String localMd5 = calculateMd5(sampleFile);
            System.out.println("本地文件MD5: " + localMd5);

        } catch (Exception e) {
            System.err.println("上传失败，开始回滚: " + e.getMessage());
            if (uploadId != null) {
                ossClient.abortMultipartUpload(new AbortMultipartUploadRequest(bucketName, objectName, uploadId));
                System.out.println("已中止未完成上传");
            }
        } finally {
            ossClient.shutdown();
        }
    }

    private static long calculatePartSize(long fileLength) {
        if (fileLength < 100 * 1024 * 1024) return 1 * 1024 * 1024;
        if (fileLength < 500 * 1024 * 1024) return 5 * 1024 * 1024;
        if (fileLength < 2L * 1024 * 1024 * 1024) return 10 * 1024 * 1024;
        return 50 * 1024 * 1024;
    }

    private static String calculateMd5(File file) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        try (InputStream is = new FileInputStream(file)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) > 0) {
                md.update(buffer, 0, read);
            }
        }
        byte[] digest = md.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
