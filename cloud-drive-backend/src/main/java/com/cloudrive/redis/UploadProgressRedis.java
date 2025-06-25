package com.cloudrive.redis;

import com.cloudrive.common.constant.CommonConstants;
import com.cloudrive.service.UploadProgressService.UploadTask;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 上传进度 Redis 操作类
 */
@Component
public class UploadProgressRedis {
    private final RedissonClient redissonClient;
    public static final String UPLOAD_PROGRESS_PREFIX = "upload_progress:";

    public UploadProgressRedis(RedissonClient redissonClient, ObjectMapper objectMapper) {
        this.redissonClient = redissonClient;
    }

    private String getKey(String taskId) {
        return UPLOAD_PROGRESS_PREFIX + taskId;
    }

    private RBucket<UploadTask> getBucket(String taskId) {
        return redissonClient.getBucket(getKey(taskId));
    }

    /**
     * 创建上传任务
     *
     * @param task 上传任务
     */
    public void createTask(UploadTask task) {
        getBucket(task.getId()).set(task, Duration.ofMillis(CommonConstants.Time.ONE_HOUR));
    }

    /**
     * 更新上传任务
     *
     * @param task 上传任务
     */
    public void updateTask(UploadTask task) {
        RBucket<UploadTask> bucket = getBucket(task.getId());
        bucket.set(task, Duration.ofMillis(CommonConstants.Time.ONE_HOUR));
    }

    /**
     * 获取上传任务
     *
     * @param taskId 任务ID
     * @return 上传任务
     */
    public UploadTask getTask(String taskId) {
        return getBucket(taskId).get();
    }

    /**
     * 删除上传任务
     *
     * @param taskId 任务ID
     */
    public void deleteTask(String taskId) {
        getBucket(taskId).delete();
    }

    /**
     * 标记任务完成并设置过期时间
     *
     * @param task 上传任务
     */
    public void completeTask(UploadTask task) {
        // 设置任务为完成状态
        task.setCompleted(true);

        // 保存到Redis并设置5分钟的过期时间
        getBucket(task.getId()).set(task, Duration.ofMillis(CommonConstants.Time.ONE_MINUTE));
    }
} 