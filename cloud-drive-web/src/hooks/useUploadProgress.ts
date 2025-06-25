import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UploadItem } from '../components/UploadProgressList';

/**
 * 自定义Hook，用于管理文件上传进度
 */
export function useUploadProgress() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  /**
   * 创建新的上传任务
   * @param file 要上传的文件
   * @returns 上传任务的唯一ID
   */
  const createUpload = useCallback((file: File): string => {
    const id = uuidv4();
    setUploads(prev => [
      ...prev,
      {
        id,
        file,
        progress: 0,
        status: 'uploading'
      }
    ]);
    return id;
  }, []);

  /**
   * 更新上传进度
   * @param id 上传任务ID
   * @param progress 进度百分比
   */
  const updateProgress = useCallback((id: string, progress: number) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id 
          ? { ...upload, progress } 
          : upload
      )
    );
  }, []);

  /**
   * 完成上传任务
   * @param id 上传任务ID
   */
  const completeUpload = useCallback((id: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id 
          ? { ...upload, progress: 100, status: 'completed' } 
          : upload
      )
    );

    // 5秒后自动移除已完成的上传
    setTimeout(() => {
      setUploads(prev => prev.filter(upload => 
        !(upload.id === id && upload.status === 'completed')
      ));
    }, 5000);
  }, []);

  /**
   * 标记上传失败
   * @param id 上传任务ID
   * @param error 错误信息
   */
  const failUpload = useCallback((id: string, error: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id 
          ? { ...upload, status: 'error', error } 
          : upload
      )
    );
  }, []);

  /**
   * 移除上传任务
   * @param id 上传任务ID
   */
  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  }, []);

  /**
   * 清除所有已完成的上传
   */
  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
  }, []);

  return {
    uploads,
    createUpload,
    updateProgress,
    completeUpload,
    failUpload,
    removeUpload,
    clearCompleted
  };
}
