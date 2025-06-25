import { FileInfo } from '../types/file';
import { getApi, postApi, deleteApi, patchApi, apiRequest, ApiResponse } from '../utils/apiClient';

/**
 * 获取文件列表
 */
export const fetchFiles = async (parentId?: number): Promise<FileInfo[]> => {
  const path = parentId !== undefined ? `/files?parentId=${parentId}` : '/files';
  const response = await getApi<FileInfo[]>(path);
  if (response.code !== 200) throw new Error(response.message);
  return response.data || [];
};

/**
 * 上传文件
 * @param file 要上传的文件
 * @param onProgress 上传进度回调函数
 * @param parentId 可选的父目录ID
 * @returns 上传响应
 */
export const uploadFile = async (
  file: File, 
  onProgress?: (progress: number) => void,
  parentId?: number
): Promise<ApiResponse<any>> => {
  // 使用带进度跟踪的上传方法
  if (onProgress) {
    return uploadFileWithProgress(file, onProgress, parentId);
  }
  
  // 如果不需要进度跟踪，使用原始方式
  const formData = new FormData();
  formData.append('file', file);
  if (parentId !== undefined) {
    formData.append('parentId', parentId.toString());
  }
  
  return apiRequest('/files', {
    method: 'POST',
    body: formData,
    headers: {} // 不设置Content-Type，让浏览器自动设置为multipart/form-data
  });
};

/**
 * 使用新的API上传文件并跟踪进度
 * @param file 要上传的文件
 * @param onProgress 上传进度回调函数
 * @param parentId 可选的父目录ID
 * @returns 上传响应
 */
export const uploadFileWithProgress = async (
  file: File, 
  onProgress: (progress: number) => void,
  parentId?: number
): Promise<ApiResponse<any>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId !== undefined) {
      formData.append('parentId', parentId.toString());
    }
    
    // 1. 发起上传请求，获取任务ID
    const response = await apiRequest<string>('/files/progress', {
      method: 'POST',
      body: formData,
      headers: {}, // 不设置Content-Type，让浏览器自动设置为multipart/form-data
    });
    
    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || '创建上传任务失败');
    }
    
    const taskId = response.data;
    // 初始进度
    onProgress(0);
    
    // 2. 轮询进度
    return await pollUploadProgress(taskId, onProgress);
  } catch (error: any) {
    console.error('上传文件错误:', error);
    return {
      code: 500,
      message: error.message || '上传文件失败',
      data: null
    };
  }
};

/**
 * 轮询上传进度
 * @param taskId 任务ID
 * @param onProgress 进度回调
 * @returns 上传结果
 */
const pollUploadProgress = async (
  taskId: string,
  onProgress: (progress: number) => void
): Promise<ApiResponse<any>> => {
  return new Promise((resolve) => {
    let lastProgress = 0;
    const checkProgress = async () => {
      try {
        const response = await getApi<any>(`/upload-progress/${taskId}`);
        
        if (response.code === 200 && response.data) {
          const { progress, completed, success, message } = response.data;
          
          // 输出调试信息
          console.log(`Upload progress for ${taskId}: ${progress}%, completed: ${completed}`);
          
          // 只在进度增加时通知
          if (progress > lastProgress) {
            lastProgress = progress;
            onProgress(progress);
          }
          
          if (completed) {
            // 确保最终进度为100%
            onProgress(100);
            
            if (success) {
              resolve({
                code: 200,
                message: '上传成功',
                data: response.data
              });
            } else {
              resolve({
                code: 500,
                message: message || '上传失败',
                data: null
              });
            }
            return;
          }
          
          // 继续轮询
          setTimeout(checkProgress, 1000);
        } else {
          console.warn('Upload progress API returned error:', response);
          // 出错了，继续轮询
          setTimeout(checkProgress, 2000);
        }
      } catch (error) {
        console.error('Error polling upload progress:', error);
        // 出错了，继续轮询
        setTimeout(checkProgress, 2000);
      }
    };
    
    // 开始轮询
    checkProgress();
  });
};

/**
 * 下载文件
 */
export const downloadFile = async (
  fileId: string,
  filename: string,
  token?: string
): Promise<any> => {
  try {
    if (!token) {
      return {
        code: 401,
        message: '未授权，请携带有效的用户令牌',
        data: null
      };
    }

    // 直接使用原生 fetch 以获取二进制 blob
    const response = await fetch(`/api/files/${fileId}/content`, {
      headers: { 'Authorization': token }
    });

    if (!response.ok) {
      // 返回错误 JSON
      const errJson = await response.json();
      return { code: errJson.code || response.status, message: errJson.message, data: null };
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl); // 及时释放资源
    
    return { 
      code: 200, 
      message: '文件下载成功', 
      data: null // 下载操作通常不返回data 
    };
  } catch (error) {
    console.error('下载文件时出错:', error);
    return { 
      code: 500, 
      message: error instanceof Error ? error.message : '下载文件时发生未知错误', 
      data: null 
    };
  }
};

/**
 * 删除文件
 */
export const deleteFile = async (fileId: number): Promise<any> => {
  const response = await deleteApi<any>(`/files/${fileId}`);
  return response;
};

/**
 * 重命名文件
 */
export const renameFile = async (fileId: number, newFilename: string): Promise<any> => {
  return patchApi<any>(`/files/${fileId}/name`, { newFilename });
};

/**
 * 搜索文件
 */
export const searchFiles = async (keyword: string): Promise<FileInfo[]> => {
  const response = await getApi<FileInfo[]>(`/files/search?keyword=${encodeURIComponent(keyword)}`);
  if (response.code !== 200) throw new Error(response.message);
  return response.data || [];
};

/**
 * 分享文件
 */
export const shareFile = async (
  fileId: number,
  expireTime: string,
  password?: string
): Promise<any> => {
  return postApi<any>('/shares', { fileId, expireTime, password });
};

/**
 * 获取当前用户的分享列表
 */
export const getSharedFiles = async (): Promise<any> => {
  return getApi<any>('/shares');
};

/**
 * 获取分享文件详情
 */
export const getShareInfo = async (shareCode: string, password?: string): Promise<any> => {
  let path = `/shares/${shareCode}`;
  if (password) path += `?password=${encodeURIComponent(password)}`;
  return getApi<any>(path);
};

/**
 * 取消分享
 */
export const cancelShare = async (shareCode: string): Promise<any> => {
  return deleteApi<any>(`/shares/${shareCode}`);
};

export interface ShareAccessResponse {
  shareCode: string;
  expireTime: string;
  hasPassword: boolean;
  fileId: number;
  filename: string;
  fileSize: number;
  createTime: string;
  visitCount: number;
  isExpired: boolean;
  token?: string;
}

/**
 * 使用 Token 访问分享文件
 * @returns ApiResponse 包含 code, message, data (ShareAccessResponse)
 */
export const accessShareWithToken = async (
  shareCode: string,
  token: string
): Promise<ApiResponse<ShareAccessResponse>> => {
  return apiRequest<ShareAccessResponse>(
    `/shares/${shareCode}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `${shareCode}:${token}` : ''
      },
      credentials: 'include'
    }
  );
};

/**
 * 使用密码访问分享文件
 * @returns ApiResponse 包含 code, message, data (ShareAccessResponse)
 */
export const accessShareWithPassword = async (
  shareCode: string,
  password: string
): Promise<ApiResponse<ShareAccessResponse>> => {
  return apiRequest<ShareAccessResponse>(
    `/shares/${shareCode}/verification`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'include'
    }
  );
};

export const downloadSharedFile = async (
  shareCode: string,
  token: string,
  originalFilename: string
): Promise<ApiResponse<null>> => {
  try {
    if (!token) {
      return { code: 401, message: '未授权，请携带有效的访问令牌', data: null };
    }
    const response = await fetch(`/api/shares/${shareCode}/content`, {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    if (!response.ok) {
      // 解析错误JSON
      let errorMessage: string;
      try {
        const errJson = await response.json();
        errorMessage = errJson.message;
      } catch {
        errorMessage = `下载失败(${response.status})`;
      }
      return { code: response.status, message: errorMessage, data: null };
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return { code: 200, message: '文件下载成功', data: null };
  } catch (error: any) {
    console.error('downloadSharedFile网络错误:', error);
    return { code: 500, message: error.message || '下载失败，网络连接错误', data: null };
  }
};