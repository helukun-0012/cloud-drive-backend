package com.cloudrive.mapper;

import com.cloudrive.model.entity.FileInfo;
import com.cloudrive.model.entity.User;
import com.cloudrive.model.vo.FileListVO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.web.multipart.MultipartFile;

@Mapper(componentModel = "spring")
public interface FileMapper {
    
    @Mapping(target = "id", source = "id")
    @Mapping(target = "filename", source = "filename")
    @Mapping(target = "originalFilename", source = "originalFilename")
    @Mapping(target = "path", source = "path")
    @Mapping(target = "fileSize", source = "fileSize")
    @Mapping(target = "fileType", source = "fileType")
    @Mapping(target = "parentId", source = "parentId")
    @Mapping(target = "isFolder", source = "isFolder")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    FileListVO toFileListVO(FileInfo fileInfo);

    /**
     * 从 MultipartFile 和用户信息创建 FileInfo
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "filename", source = "file.originalFilename")
    @Mapping(target = "originalFilename", source = "file.originalFilename")
    @Mapping(target = "path", source = "filePath")
    @Mapping(target = "fileSize", source = "file.size")
    @Mapping(target = "fileType", source = "file.contentType")
    @Mapping(target = "user", source = "user")
    @Mapping(target = "parentId", source = "parentId")
    @Mapping(target = "isFolder", constant = "false")
    @Mapping(target = "isDeleted", constant = "false")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "sha256Hash", expression = "java(com.cloudrive.common.util.FileHashUtil.calculateSHA256(file))")
    FileInfo toFileInfo(MultipartFile file, String filePath, User user, Long parentId);
    
    /**
     * 处理秒传逻辑，从现有文件和用户信息创建新的FileInfo
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "filename", source = "filename")
    @Mapping(target = "originalFilename", source = "filename")
    @Mapping(target = "path", source = "existingFile.path")
    @Mapping(target = "fileSize", source = "existingFile.fileSize")
    @Mapping(target = "fileType", source = "existingFile.fileType")
    @Mapping(target = "user", source = "user")
    @Mapping(target = "parentId", source = "parentId")
    @Mapping(target = "isFolder", constant = "false")
    @Mapping(target = "isDeleted", constant = "false")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "sha256Hash", source = "sha256Hash")
    FileInfo toFileInfoForFastUpload(String filename, FileInfo existingFile, User user, Long parentId, String sha256Hash);
    
    /**
     * 从文件路径创建 FileInfo，用于处理从本地路径上传的文件
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "filename", source = "filename")
    @Mapping(target = "originalFilename", source = "filename")
    @Mapping(target = "path", source = "filePath")
    @Mapping(target = "fileSize", source = "fileSize")
    @Mapping(target = "fileType", expression = "java(com.cloudrive.common.util.FileTypeUtil.getContentTypeFromFileName(filename))")
    @Mapping(target = "user", source = "user")
    @Mapping(target = "parentId", source = "parentId")
    @Mapping(target = "isFolder", constant = "false")
    @Mapping(target = "isDeleted", constant = "false")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "sha256Hash", source = "sha256Hash")
    FileInfo toFileInfoFromPath(String filename, String filePath, long fileSize, User user, Long parentId, String sha256Hash);
} 