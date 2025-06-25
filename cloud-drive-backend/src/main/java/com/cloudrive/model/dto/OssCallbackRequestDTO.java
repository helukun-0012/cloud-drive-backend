package com.cloudrive.model.dto;

import lombok.Data;

@Data
public class OssCallbackRequestDTO {
    private String object;             // OSS objectKey
    private String etag;
    private String bucket;
    private Long size;
    private String mimeType;
    private String originalFilename;
    private Long parentId;
    private Long userId;
    // originalFilename, uploadedPath, fileSize, currentUser, parentId, sha256Hash
}