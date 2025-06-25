package com.cloudrive.model.dto;

import lombok.Data;

@Data
public class MultipartUploadInitAndUrlDTO {
    private String filename;
    private int partCount;
    private Long parentId;
}
