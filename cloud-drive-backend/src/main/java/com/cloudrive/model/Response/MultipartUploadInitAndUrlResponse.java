package com.cloudrive.model.Response;

import lombok.Data;
import java.util.List;

@Data
public class MultipartUploadInitAndUrlResponse {
    private String uploadId;
    private String objectKey;
    private List<PartUploadUrl> partUploadUrls;
}
