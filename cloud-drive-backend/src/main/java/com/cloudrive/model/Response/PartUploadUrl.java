package com.cloudrive.model.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PartUploadUrl {
    private Integer partNumber;
    private String url;
}