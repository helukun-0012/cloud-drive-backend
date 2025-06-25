import React, { useState, useCallback } from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import FileListTable from '../components/FileListTable';
import FileUploadButton from '../components/FileUploadButton';
import FileSearchBar from '../components/FileSearchBar';
import ConfirmationDialog from '../components/ConfirmationDialog';
import RenameDialog from '../components/RenameDialog';
import ShareDialog from '../components/ShareDialog';
import NotificationAlert from '../components/NotificationAlert';
import UploadProgressList from '../components/UploadProgressList';
import { useFiles } from '../hooks/useFiles';
import { useDialog } from '../hooks/useDialog';
import { useUploadProgress } from '../hooks/useUploadProgress';
import { FileInfo } from '../types/file';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FilesPage: React.FC = () => {
  const {
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
    setError,
  } = useFiles();

  const { isOpen: isDeleteOpen, openDialog: openDeleteDialog, closeDialog: closeDeleteDialog, dialogData: fileToDelete } = useDialog<FileInfo>();
  const { isOpen: isRenameOpen, openDialog: openRenameDialog, closeDialog: closeRenameDialog, dialogData: fileToRename } = useDialog<FileInfo>();
  const { isOpen: isShareOpen, openDialog: openShareDialog, closeDialog: closeShareDialog, dialogData: fileToShare } = useDialog<FileInfo>();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!fileToDelete) return;
    const success = await deleteFile(fileToDelete.id);
    if (success) {
      showSuccess('文件删除成功');
    }
    closeDeleteDialog();
  }, [deleteFile, fileToDelete, closeDeleteDialog, showSuccess]);

  const handleRenameConfirm = useCallback(async (newFilename: string) => {
    if (!fileToRename) return;
    const success = await renameFile(fileToRename.id, newFilename);
    if (success) {
      showSuccess('文件重命名成功');
    }
    closeRenameDialog();
  }, [renameFile, fileToRename, closeRenameDialog, showSuccess]);

  const handleShareConfirm = useCallback(async (expireTime: string, password?: string) => {
    if (!fileToShare) return null;
    const result = await shareFile(fileToShare.id, expireTime, password);
    if (result) {
      showSuccess(`文件分享成功${password ? '，密码：' + password : ''}`);
      return { shareCode: result.shareCode };
    }
    return null;
  }, [shareFile, fileToShare, showSuccess]);

  // 使用上传进度 Hook
  const {
    uploads,
    createUpload,
    updateProgress,
    completeUpload,
    failUpload,
    removeUpload
  } = useUploadProgress();

  const handleUploadWrapper = useCallback(async (file: File) => {
    // 创建上传任务并获取ID
    const uploadId = createUpload(file);
    
    try {
      // 调用上传API，传入进度回调函数
      const response = await uploadFile(
        file,
        (progress: number) => updateProgress(uploadId, progress)
      );
      
      if (response && response.code === 200) {
        completeUpload(uploadId);
        // 只在上传完成后刷新文件列表，不会影响上传按钮状态
        await fetchFiles();
        showSuccess('文件上传成功');
        return true;
      } else {
        const errorMessage = response ? response.message : '上传失败';
        failUpload(uploadId, errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (err: any) {
      const errorMessage = err && err.message ? err.message : '上传失败';
      failUpload(uploadId, errorMessage);
      setError(errorMessage);
      return false;
    }
  }, [uploadFile, fetchFiles, showSuccess, createUpload, updateProgress, completeUpload, failUpload, setError]);
  
  // 注意：我们已经在handleUploadWrapper中实现了上传完成后刷新文件列表的功能

  const handleDownload = useCallback(async (file: FileInfo) => {
    const success = await downloadFile(file);
    if (success) {
      showSuccess('文件下载成功');
    }
  }, [downloadFile, showSuccess]);

  return (
    <Box 
      sx={{ 
        position: "relative", 
        minHeight: "100%",
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
        borderRadius: 2
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 2
        }}
      >
        <CloudUploadIcon 
          sx={{ 
            color: 'primary.main', 
            mr: 1, 
            fontSize: 32 
          }} 
        />
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            color: 'primary.dark'
          }}
        >
          我的云盘
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3, bgcolor: 'primary.light' }} />

      <NotificationAlert
        error={error}
        success={successMessage}
        clearError={() => setError(null)}
      />

      <Paper 
        sx={{ 
          p: 2, 
          mt: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          borderRadius: 3
        }}
      >
        <FileSearchBar onSearch={searchFiles} />

        <Box sx={{ mt: 3 }}>
          <FileListTable
            files={files}
            loading={loading}
            pagination={pagination}
            onDownload={handleDownload}
            onDeleteClick={openDeleteDialog}
            onRenameClick={openRenameDialog}
            onShareClick={openShareDialog}
          />
        </Box>
      </Paper>

      <FileUploadButton
        onUpload={handleUploadWrapper}
      />

      {/* 上传进度列表组件 */}
      <UploadProgressList
        uploads={uploads}
        onRemove={removeUpload}
      />

      <ConfirmationDialog
        open={isDeleteOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="确认删除"
        contentText={`确定要删除文件 "${fileToDelete?.filename}" 吗？此操作不可撤销。`}
      />

      <RenameDialog
        open={isRenameOpen}
        onClose={closeRenameDialog}
        onConfirm={handleRenameConfirm}
        initialFilename={fileToRename?.filename || ''}
      />

      <ShareDialog
        open={isShareOpen}
        onClose={closeShareDialog}
        onConfirm={handleShareConfirm}
        fileId={fileToShare?.id || 0}
      />
    </Box>
  );
};

export default FilesPage; 
