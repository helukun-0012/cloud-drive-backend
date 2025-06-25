package com.cloudrive.mapper;

import com.cloudrive.model.entity.FileInfo;
import com.cloudrive.model.entity.ShareRecord;
import com.cloudrive.model.entity.User;
import com.cloudrive.model.vo.ShareFileVO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.LocalDateTime;

@Mapper(componentModel = "spring")
public interface ShareMapper {
    
    @Mapping(target = "shareCode", source = "shareCode")
    @Mapping(target = "expireTime", source = "expireTime")
    @Mapping(target = "hasPassword", expression = "java(shareRecord.getPassword() != null && !shareRecord.getPassword().isEmpty())")
    @Mapping(target = "fileId", source = "file.id")
    @Mapping(target = "filename", source = "file.filename")
    @Mapping(target = "fileSize", source = "file.fileSize")
    @Mapping(target = "visitCount", source = "visitCount")
    @Mapping(target = "createTime", source = "createTime")
    @Mapping(target = "isExpired", source = "isExpired")
    @Mapping(target = "password", source = "password")
    ShareFileVO toShareFileVO(ShareRecord shareRecord);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "file", source = "file")
    @Mapping(target = "user", source = "user")
    @Mapping(target = "shareCode", source = "shareCode")
    @Mapping(target = "password", source = "password")
    @Mapping(target = "expireTime", source = "expireTime")
    @Mapping(target = "isExpired", constant = "false")
    @Mapping(target = "visitCount", constant = "0")
    @Mapping(target = "createTime", expression = "java(java.time.LocalDateTime.now())")
    ShareRecord toShareRecord(FileInfo file, User user, String shareCode, String password, LocalDateTime expireTime);
} 