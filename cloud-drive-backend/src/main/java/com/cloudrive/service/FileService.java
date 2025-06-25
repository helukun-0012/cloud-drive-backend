package com.cloudrive.service;

import com.cloudrive.model.Response.MultipartUploadInitAndUrlResponse;
import com.cloudrive.model.Response.StsTokenResponse;
import com.cloudrive.model.dto.MultipartUploadCompleteDTO;
import com.cloudrive.model.dto.MultipartUploadInitAndUrlDTO;
import com.cloudrive.model.dto.OssCallbackRequestDTO;
import com.cloudrive.model.vo.FileListVO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 文件服务接口
 */
public interface FileService {
    /**
     * 上传文件
     */
    String uploadFile(MultipartFile file, Long parentId);

    /**
     * 从文件路径上传文件并跟踪进度（用于异步上传）
     *
     * @param filePath         文件路径
     * @param originalFilename 原始文件名
     * @param fileSize         文件大小
     * @param parentId         父文件夹ID
     * @param taskId           任务ID，用于跟踪进度
     * @param userId           用户ID，用于在异步线程中获取用户信息
     */
    void uploadFileWithProgressFromPath(String filePath, String originalFilename, long fileSize, Long parentId, String taskId, Long userId);

    /**
     * 下载文件
     */
    byte[] downloadFile(Long fileId);

    /**
     * 获取文件列表
     */
    List<FileListVO> listFiles(Long parentId);

    /**
     * 删除文件
     */
    void deleteFile(Long fileId);

    /**
     * 重命名文件
     */
    void renameFile(Long fileId, String newFilename);

    /**
     * 搜索文件
     */
    List<FileListVO> searchFiles(String keyword);

    /**
     * 获取文件名
     */
    String getFilename(Long fileId);

    /**
     * 获取文件内容
     * @param fileId 文件ID
     * @return 文件内容字节数组
     */
    byte[] getFileContent(Long fileId);

    StsTokenResponse getStsToken(String dirPrefix);

    MultipartUploadInitAndUrlResponse multipartUploadInitAndGetUploadUrls(MultipartUploadInitAndUrlDTO request);

    void completeMultipartUpload(MultipartUploadCompleteDTO dto);

    void handleOssCallback(OssCallbackRequestDTO dto, HttpServletRequest request);
}