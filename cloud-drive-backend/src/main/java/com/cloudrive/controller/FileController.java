package com.cloudrive.controller;

import com.cloudrive.common.annotation.RateLimit;
import com.cloudrive.common.annotation.RateLimit.Dimension;
import com.cloudrive.common.result.Result;
import com.cloudrive.common.util.UserContext;
import com.cloudrive.model.Response.MultipartUploadInitAndUrlResponse;
import com.cloudrive.model.Response.StsTokenResponse;
import com.cloudrive.model.dto.FileRenameDTO;
import com.cloudrive.model.dto.MultipartUploadCompleteDTO;
import com.cloudrive.model.dto.MultipartUploadInitAndUrlDTO;
import com.cloudrive.model.dto.OssCallbackRequestDTO;
import com.cloudrive.model.entity.User;
import com.cloudrive.model.vo.FileListVO;
import com.cloudrive.service.FileService;
import com.cloudrive.service.UploadProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.*;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;


/**
 * 文件管理
 */
@RestController
@Validated
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;
    private final UploadProgressService uploadProgressService;

    @Autowired
    public FileController(FileService fileService, UploadProgressService uploadProgressService) {
        this.fileService = fileService;
        this.uploadProgressService = uploadProgressService;
    }

    @Schema(name = "UploadWithProgressRequest", description = "上传文件进度请求体")
    static class UploadWithProgressRequest {

        @Schema(description = "要上传的文件", type = "string", format = "binary", required = true)
        public MultipartFile file;

        @Schema(description = "父文件夹 ID", example = "12345")
        public Long parentId;
    }

    /**
     * 上传文件
     */
    @PostMapping
    @RateLimit(dimensions = { Dimension.USER, Dimension.IP }, permitsPerSecond = 3.0, timeout = 1000)
    public Result<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "parentId", required = false) Long parentId) {
        String filePath = fileService.uploadFile(file, parentId);
        return Result.success(filePath);
    }

    /**
     * 获取文件列表
     */
    @GetMapping
    @RateLimit(dimensions = { Dimension.USER }, permitsPerSecond = 10.0, timeout = 500)
    public Result<List<FileListVO>> listFiles(@RequestParam(value = "parentId", required = false) Long parentId) {
        List<FileListVO> fileListVOs = fileService.listFiles(parentId);
        return Result.success(fileListVOs);
    }

    /**
     * 搜索文件
     */
    @GetMapping("/search")
    @RateLimit(dimensions = { Dimension.USER }, permitsPerSecond = 10.0, timeout = 500)
    public Result<List<FileListVO>> searchFiles(@RequestParam String keyword) {
        List<FileListVO> files = fileService.searchFiles(keyword);
        return Result.success(files);
    }


    @PostMapping("/multipart-upload-init-and-url")
    @Operation(summary = "初始化分片上传并生成所有分片签名 URL")
    @RateLimit(dimensions = { Dimension.IP }, permitsPerSecond = 5.0, timeout = 1000)
    public Result<MultipartUploadInitAndUrlResponse> initAndGenerateUrls(@RequestBody MultipartUploadInitAndUrlDTO multipartUploadInitAndUrlDTO) {
        System.out.println("收到请求参数: " + multipartUploadInitAndUrlDTO);
        MultipartUploadInitAndUrlResponse response = fileService.multipartUploadInitAndGetUploadUrls(multipartUploadInitAndUrlDTO);

        return Result.success(response);
    }

    /**
     * 完成分片的合并
     */
    @PostMapping("/multipart-upload-complete")
    @Operation(summary = "完成分片上传并合并 OSS 文件")
    public Result<Void> completeMultipartUpload(@RequestBody MultipartUploadCompleteDTO dto) {
        fileService.completeMultipartUpload(dto);
        return Result.success();
    }


    /**
     * 获取阿里云 OSS STS 临时凭证
     * 用户前端直传 OSS 前先调用本接口拿到临时凭证
     */
    @GetMapping("/sts")
    @Operation(summary = "获取 OSS STS 凭证")
    public Result<StsTokenResponse> getStsToken() {
        // 获取当前用户 ID，用于生成隔离目录
        Long userId = UserContext.getCurrentUserId(); // 或者你已有的登录上下文
        String dirPrefix = "user-uploads/user_" + userId + "/";

        // 调用 service 获取 token
        StsTokenResponse response = fileService.getStsToken(dirPrefix);
        return Result.success(response);
    }



    /**
     * 下载文件
     */
    @GetMapping("/{fileId}/content")
    @RateLimit(dimensions = { Dimension.USER, Dimension.IP }, permitsPerSecond = 2.0, timeout = 1000)
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileId) {
        byte[] content = fileService.downloadFile(fileId);
        // 设置响应头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename(fileService.getFilename(fileId), StandardCharsets.UTF_8)
                .build());
        headers.setContentLength(content.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(content);
    }

    /**
     * 重命名文件
     */
    @PatchMapping("/{fileId}/name")
    @RateLimit(dimensions = { Dimension.USER }, permitsPerSecond = 5.0, timeout = 500)
    public Result<Void> renameFile(@PathVariable Long fileId, @Valid @RequestBody FileRenameDTO dto) {
        fileService.renameFile(fileId, dto.getNewFilename());
        return Result.success();
    }

    /**
     * 删除文件
     */
    @DeleteMapping("/{fileId}")
    @RateLimit(dimensions = { Dimension.USER }, permitsPerSecond = 5.0, timeout = 500)
    public Result<Void> deleteFile(@PathVariable Long fileId) {
        fileService.deleteFile(fileId);
        return Result.success();
    }
    
    /**
     * 上传文件并跟踪进度
     * @param file 文件
     * @param parentId 父文件夹ID
     * @return 上传任务ID
     */
    @PostMapping("/progress")
    @RateLimit(dimensions = { Dimension.USER, Dimension.IP }, permitsPerSecond = 2.0, timeout = 1000)
    @Operation(
            summary = "上传文件并跟踪进度",
            description = "上传文件到指定目录，异步上传并记录进度",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(implementation = UploadWithProgressRequest.class)
                    )
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "上传成功，返回任务ID"),
                    @ApiResponse(responseCode = "400", description = "上传失败")
            }
    )
    public Result<String> uploadWithProgress(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "parentId", required = false) Long parentId) {
        
        try {
            // 生成唯一任务ID
            String taskId = UUID.randomUUID().toString();
            
            // 创建上传任务
            uploadProgressService.createUploadTask(taskId, file.getOriginalFilename(), file.getSize());
            
            // 在主线程中获取当前用户ID
            Long currentUserId = UserContext.getCurrentUserId();
            
            // 检查文件是否为空
            if (file.isEmpty()) {
                uploadProgressService.completeUploadTask(taskId, false, "文件为空");
                return Result.error("文件为空");
            }
            
            // 将文件保存到临时目录，以便在异步线程中使用
            File tempDir = new File(System.getProperty("java.io.tmpdir"));
            if (!tempDir.exists()) {
                tempDir.mkdirs();
            }
            
            // 创建临时文件
            File tempFile = new File(tempDir, taskId + "_" + file.getOriginalFilename());
            file.transferTo(tempFile);
            
            // 异步执行上传，避免阻塞请求
            Thread uploadThread = new Thread(() -> {
                try {
                    fileService.uploadFileWithProgressFromPath(tempFile.getAbsolutePath(), file.getOriginalFilename(), file.getSize(), parentId, taskId, currentUserId);
                }
                finally {
                    // 上传完成后删除临时文件
                    if (tempFile.exists()) {
                        tempFile.delete();
                    }
                }
            });
            uploadThread.setDaemon(true);
            uploadThread.start();
            
            return Result.success(taskId);
        } catch (Exception e) {
            return Result.error("文件上传失败: " + e.getMessage());
        }
    }

    @PostMapping("/oss/callback")
    public Result<Void> handleOssCallback(
            @RequestBody OssCallbackRequestDTO dto,
            HttpServletRequest request) {
        fileService.handleOssCallback(dto,request);
        return Result.success();

    }

} 