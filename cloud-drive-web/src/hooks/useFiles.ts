import { useState, useCallback, useEffect } from "react";
import { FileInfo, PaginationState, PaginationHandlers } from "../types/file";
import {
  fetchFiles as fetchFilesApi,
  uploadFile as uploadFileApi,
  downloadFile as downloadFileApi,
  deleteFile as deleteFileApi,
  renameFile as renameFileApi,
  searchFiles as searchFilesApi,
  shareFile as shareFileApi,
  cancelShare as cancelShareApi,
} from "../services/fileApi";
import { handleApiResponse } from "../utils/apiClient";

/**
 * 自定义 Hook，用于管理文件列表的状态和操作。
 * 提供了文件的获取、上传、下载、删除、重命名、搜索和分享等功能，同时管理分页状态。
 * @returns 包含文件列表、加载状态、错误信息、分页信息以及各种文件操作函数的对象。
 */
export function useFiles() {
  // 存储文件列表，初始为空数组
  const [files, setFiles] = useState<FileInfo[]>([]);
  // 表示是否正在加载数据，初始为 false
  const [loading, setLoading] = useState(false);
  // 存储错误信息，初始为 null
  const [error, setError] = useState<string | null>(null);
  // 当前页码，初始为 0
  const [page, setPage] = useState(0);
  // 每页显示的行数，初始为 10
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /**
   * 异步获取文件列表的函数。
   * 调用 API 获取文件列表，并更新文件状态和错误状态。
   */
  const fetchFiles = useCallback(async (parentId?: number) => {
    try {
      setLoading(true);
      const data = await fetchFilesApi(parentId);
      console.log('Fetched files:', data);
      setFiles(data || []);
      setError(null);
    } catch (err: any) {
      // 如果未登录或未授权，跳转登录
      if (err.message === '未登录' || err.message === '未授权') {
        window.location.href = '/login';
        return;
      }
      setError(err.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 异步上传文件的函数。
   * 调用 API 上传文件，上传成功后不自动刷新文件列表，由调用者决定何时刷新。
   * @param file - 要上传的文件对象。
   * @param onProgress - 上传进度回调函数
   * @param parentId - 父目录ID（可选）
   * @returns 上传成功返回响应对象，失败抛出错误。
   */
  const uploadFile = useCallback(
    async (file: File, onProgress?: (progress: number) => void, parentId?: number) => {
      try {
        // 不设置全局loading状态，避免影响文件列表刷新
        // 上传进度已由上传进度组件显示
        const response = await uploadFileApi(file, onProgress, parentId);
        console.log(response);
        
        if (response.code !== 200) {
          setError(response.message || '上传失败');
        }
        
        return response;
      } catch (err: any) {
        console.error('Upload error:', err);
        // 如果是业务错误，显示后端返回的消息，否则显示网络错误提示
        const errorMessage = err instanceof Error ? err.message : '上传失败：网络连接错误或服务器无响应';
        setError(errorMessage);
        throw err; // 将错误往上抛出，让调用者处理
      }
    },
    [setError]
  );

  /**
   * 异步下载文件的函数。
   * 调用 API 下载指定文件。
   * @param file - 要下载的文件信息对象。
   * @returns 下载成功返回 true，失败返回 false。
   */
  const downloadFile = useCallback(async (file: FileInfo) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || undefined;
      const response = await downloadFileApi(String(file.id), file.filename, token);
      
      return handleApiResponse(response, setError);
    } catch (err: any) {
      console.error('Download network error:', err);
      setError("下载失败：网络连接错误或服务器无响应");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 异步删除文件的函数。
   * 调用 API 删除指定文件，删除成功后重新获取文件列表。
   * @param fileId - 要删除的文件的 ID。
   * @returns 删除成功返回 true，失败返回 false。
   */
  const deleteFile = useCallback(
    async (fileId: number) => {
      try {
        setLoading(true);
        const response = await deleteFileApi(fileId);
        const success = handleApiResponse(response, setError);
        if (success) {
          await fetchFiles();
        }
        return success;
      } catch (err: any) {
        console.error('Delete network error:', err);
        setError("删除失败：网络连接错误或服务器无响应");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchFiles]
  );

  /**
   * 异步重命名文件的函数。
   * 调用 API 重命名指定文件，重命名成功后重新获取文件列表。
   * @param fileId - 要重命名的文件的 ID。
   * @param newFilename - 新的文件名。
   * @returns 重命名成功返回 true，失败返回 false。
   */
  const renameFile = useCallback(
    async (fileId: number, newFilename: string) => {
      try {
        setLoading(true);
        await renameFileApi(fileId, newFilename);
        await fetchFiles();
        setError(null);
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchFiles]
  );

  /**
   * 异步搜索文件的函数。
   * 调用 API 根据关键词搜索文件，并更新文件列表和页码。
   * @param keyword - 搜索关键词。
   */
  const searchFiles = useCallback(async (keyword: string) => {
    try {
      setLoading(true);
      const data = await searchFilesApi(keyword);
      setFiles(data || []);
      setPage(0);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 异步分享文件的函数。
   * 调用 API 分享指定文件，并返回分享结果。
   * @param fileId - 要分享的文件的 ID。
   * @param expireTime - 分享链接的过期时间。
   * @param password - 可选参数，分享链接的密码。
   * @returns 分享成功返回分享结果，失败返回 null。
   */
  const shareFile = useCallback(
    async (fileId: number, expireTime: string, password?: string) => {
      try {
        setLoading(true);
        const response = await shareFileApi(fileId, expireTime, password);
        const success = handleApiResponse(response, setError);
        return success ? response.data : null;
      } catch (err: any) {
        console.error('Share network error:', err);
        setError("分享失败：网络连接错误或服务器无响应");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 异步取消分享的函数。
   * 调用 API 取消指定文件的分享。
   * @param shareCode - 分享码。
   * @returns 取消成功返回 true，失败返回 false。
   */
  const cancelShare = useCallback(
    async (shareCode: string) => {
      try {
        setLoading(true);
        const response = await cancelShareApi(shareCode);
        return handleApiResponse(response, setError);
      } catch (error) {
        console.error('Cancel share network error:', error);
        setError("取消分享失败：网络连接错误或服务器无响应");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  /**
   * 处理页码变化的函数。
   * @param event - 事件对象，未使用。
   * @param newPage - 新的页码。
   */
  const handlePageChange = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  /**
   * 处理每页显示行数变化的函数。
   * @param event - 输入元素的变化事件。
   */
  const handleRowsPerPageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  // 组件挂载或 fetchFiles 依赖项变化时，获取文件列表
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // 分页状态和处理函数的对象
  const pagination: PaginationState & PaginationHandlers = {
    page,
    rowsPerPage,
    count: files.length,
    handlePageChange,
    handleRowsPerPageChange,
  };

  return {
    files,
    loading,
    error,
    pagination,
    fetchFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    renameFile,
    searchFiles,
    shareFile,
    cancelShare,
    setError,
  };
}
