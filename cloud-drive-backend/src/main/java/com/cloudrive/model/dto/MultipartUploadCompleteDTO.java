package com.cloudrive.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class MultipartUploadCompleteDTO {
    private String uploadId;
    private String objectKey;

    // 每个已上传分片的 partNumber 和对应的 ETag（前端上传成功后从 OSS Response Header 拿）
    private List<PartETagDTO> parts;

    @Data
    public static class PartETagDTO {
        private int partNumber;
        private String eTag;
    }
}