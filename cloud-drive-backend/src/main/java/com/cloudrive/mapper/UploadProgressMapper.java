package com.cloudrive.mapper;

import com.cloudrive.model.vo.UploadProgressVO;
import com.cloudrive.service.UploadProgressService.UploadTask;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * 上传进度Mapper
 */
@Mapper(componentModel = "spring")
public interface UploadProgressMapper {
    
    /**
     * 将UploadTask转换为UploadProgressVO
     */
    @Mapping(target = "taskId", source = "id")
    @Mapping(target = "filename", source = "filename")
    @Mapping(target = "totalSize", source = "totalSize")
    @Mapping(target = "bytesTransferred", source = "bytesTransferred")
    @Mapping(target = "progress", source = "progress")
    @Mapping(target = "completed", source = "completed")
    @Mapping(target = "success", source = "success")
    @Mapping(target = "message", source = "message")
    UploadProgressVO toUploadProgressVO(UploadTask task);
}
