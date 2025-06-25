package com.cloudrive.service.impl;

import com.cloudrive.common.enums.ErrorCode;
import com.cloudrive.common.exception.BusinessException;
import com.cloudrive.common.util.ExceptionUtil;
import com.cloudrive.common.util.UserContext;
import com.cloudrive.mapper.ShareMapper;
import com.cloudrive.model.entity.FileInfo;
import com.cloudrive.model.entity.ShareRecord;
import com.cloudrive.model.entity.User;
import com.cloudrive.model.vo.ShareFileVO;
import com.cloudrive.redis.ShareQueueRedis;
import com.cloudrive.redis.ShareTokenRedis;
import com.cloudrive.repository.FileInfoRepository;
import com.cloudrive.repository.ShareRecordRepository;
import com.cloudrive.service.FileService;
import com.cloudrive.service.ShareService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 文件分享服务实现类
 */
@Service
public class ShareServiceImpl implements ShareService {

    private static final Logger logger = LoggerFactory.getLogger(ShareServiceImpl.class);

    private final ShareRecordRepository shareRecordRepository;

    private final FileInfoRepository fileInfoRepository;

    private final ShareTokenRedis shareTokenRedis;

    private final ShareMapper shareMapper;

    private final ShareQueueRedis shareQueueRedis;

    private final FileService fileService;

    public ShareServiceImpl(ShareRecordRepository shareRecordRepository, FileInfoRepository fileInfoRepository, ShareTokenRedis shareTokenRedis, ShareMapper shareMapper, ShareQueueRedis shareQueueRedis, FileService fileService) {
        this.shareRecordRepository = shareRecordRepository;
        this.fileInfoRepository = fileInfoRepository;
        this.shareTokenRedis = shareTokenRedis;
        this.shareMapper = shareMapper;
        this.shareQueueRedis = shareQueueRedis;
        this.fileService = fileService;
    }

    @Override
    @Transactional
    public ShareFileVO createShare(Long fileId, LocalDateTime expireTime, String password) {
        // 获取当前登录用户
        User currentUser = UserContext.getCurrentUser();
        
        // 获取文件信息
        FileInfo file = fileInfoRepository.findById(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
        
        // 验证文件权限
        ExceptionUtil.throwIf(
            !file.getUser().getId().equals(currentUser.getId()),
            ErrorCode.NO_SHARE_PERMISSION
        );
        
        // 生成分享码
        String shareCode = generateShareCode();
        
        // 创建分享记录
        ShareRecord shareRecord = shareMapper.toShareRecord(file, currentUser, shareCode, password, expireTime);
        shareRecord = shareRecordRepository.save(shareRecord);
        
        // 添加到延时队列
        addToDelayedQueue(shareRecord.getId(), expireTime);
        
        // 返回分享信息
        return shareMapper.toShareFileVO(shareRecord);
    }

    @Override
    @Transactional
    public ShareFileVO accessShare(String shareCode, String password) {
        // 获取分享记录
        ShareRecord shareRecord = shareRecordRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARE_NOT_FOUND));
        
        // 检查是否过期
        ExceptionUtil.throwIf(
            shareRecord.getIsExpired() || shareRecord.getExpireTime().isBefore(LocalDateTime.now()),
            ErrorCode.SHARE_EXPIRED
        );
        
        // 验证密码
        if (shareRecord.getPassword() != null && !shareRecord.getPassword().isEmpty()) {
            // 如果没有提供密码，抛出缺少密码异常
            ExceptionUtil.throwIf(password == null || password.isEmpty(), ErrorCode.MISSING_PASSWORD);
            // 如果密码不匹配，抛出密码错误异常
            ExceptionUtil.throwIf(!shareRecord.getPassword().equals(password), ErrorCode.INVALID_PASSWORD);
        }
        
        // 检查文件是否存在且未被删除
        FileInfo fileInfo = shareRecord.getFile();
        ExceptionUtil.throwIfNull(fileInfo, ErrorCode.FILE_NOT_FOUND);
        ExceptionUtil.throwIf(fileInfo.getIsDeleted(), ErrorCode.FILE_NOT_FOUND);
        
        // 更新访问次数
        shareRecordRepository.incrementVisitCount(shareRecord.getId());
        
        // 返回分享信息
        return shareMapper.toShareFileVO(shareRecord);
    }

    @Override
    public boolean isShareExpired(String shareCode) {
        ShareRecord shareRecord = shareRecordRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARE_NOT_FOUND));
        
        return shareRecord.getIsExpired() || shareRecord.getExpireTime().isBefore(LocalDateTime.now());
    }

    @Override
    @Transactional
    public void markExpiredShares() {
        // 获取所有过期的分享记录
        List<ShareRecord> expiredShares = shareRecordRepository.findByExpireTimeBeforeAndIsExpiredFalse(LocalDateTime.now());
        
        // 标记为过期
        for (ShareRecord share : expiredShares) {
            share.setIsExpired(true);
        }
        
        // 批量保存
        shareRecordRepository.saveAll(expiredShares);
    }

    @Override
    public List<ShareFileVO> getSharedFiles() {
        // 获取当前用户ID
        Long userId = UserContext.getCurrentUserId();
        
        // 获取用户的所有分享记录
        List<ShareRecord> shareRecords = shareRecordRepository.findByUserIdOrderByCreateTimeDesc(userId);
        
        // 转换为VO对象
        return shareRecords.stream()
                .map(shareMapper::toShareFileVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelShare(String shareCode) {
        // 获取当前用户ID
        Long userId = UserContext.getCurrentUserId();
        
        // 获取分享记录
        ShareRecord shareRecord = shareRecordRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARE_NOT_FOUND));
        
        // 验证权限
        ExceptionUtil.throwIf(
            !shareRecord.getUser().getId().equals(userId),
            ErrorCode.NO_CANCEL_PERMISSION
        );
        
        // 从延时队列中移除
        shareQueueRedis.removeFromDelayedQueue(shareRecord.getId());
        
        // 删除分享记录
        shareRecordRepository.delete(shareRecord);
        
        // 删除token
        shareTokenRedis.deleteToken(shareCode);
    }

    @Override
    public String generateShareToken(String shareCode, String password) {
        ShareRecord shareRecord = shareRecordRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARE_NOT_FOUND));
        
        // 验证密码
        if (shareRecord.getPassword() != null && !shareRecord.getPassword().isEmpty()) {
            ExceptionUtil.throwIf(
                    !shareRecord.getPassword().equals(password),
                ErrorCode.INVALID_PASSWORD
            );
        }
        
        return shareTokenRedis.generateAndStoreToken(shareCode);
    }

    @Override
    public boolean validateShareToken(String shareCode, String token) {
        return shareTokenRedis.validateToken(shareCode, token);
    }

    @Override
    public ShareFileVO accessShareByToken(String shareCode, String token) {
        ExceptionUtil.throwIf(
            !validateShareToken(shareCode, token),
            ErrorCode.INVALID_TOKEN
        );
        
        ShareRecord shareRecord = shareRecordRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARE_NOT_FOUND));
                
        // 检查文件是否存在且未被删除
        FileInfo fileInfo = shareRecord.getFile();
        ExceptionUtil.throwIfNull(fileInfo, ErrorCode.FILE_NOT_FOUND);
        ExceptionUtil.throwIf(fileInfo.getIsDeleted(), ErrorCode.FILE_NOT_FOUND);
        
        shareRecord.setVisitCount(shareRecord.getVisitCount() + 1);
        shareRecordRepository.save(shareRecord);
        
        return shareMapper.toShareFileVO(shareRecord);
    }

    @Override
    public byte[] downloadSharedFile(String shareCode, String token) {
        // 验证token
        ExceptionUtil.throwIf(
            !validateShareToken(shareCode, token),
            ErrorCode.INVALID_TOKEN
        );

        // 获取分享记录
        ShareRecord shareRecord = shareRecordRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARE_NOT_FOUND));

        // 获取文件信息
        FileInfo fileInfo = shareRecord.getFile();
        ExceptionUtil.throwIfNull(fileInfo, ErrorCode.FILE_NOT_FOUND);
        
        // 检查文件是否已被删除
        ExceptionUtil.throwIf(
            fileInfo.getIsDeleted(),
            ErrorCode.FILE_NOT_FOUND
        );

        logger.debug("Downloading shared file: id={}, path={}", fileInfo.getId(), fileInfo.getPath());
        
        // 使用getFileContent获取文件内容
        byte[] content = fileService.getFileContent(fileInfo.getId());
        logger.debug("File content size: {} bytes", content.length);
        
        return content;
    }

    @Override
    public String getFilename(String shareCode) {
        ShareRecord shareRecord = shareRecordRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARE_NOT_FOUND));

        FileInfo fileInfo = shareRecord.getFile();
        ExceptionUtil.throwIfNull(fileInfo, ErrorCode.FILE_NOT_FOUND);
        
        // 检查文件是否已被删除
        ExceptionUtil.throwIf(
            fileInfo.getIsDeleted(),
            ErrorCode.FILE_NOT_FOUND
        );

        return fileInfo.getFilename();
    }

    private String generateShareCode() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private void addToDelayedQueue(Long shareId, LocalDateTime expireTime) {
        shareQueueRedis.addToDelayedQueue(shareId, expireTime);
    }
} 