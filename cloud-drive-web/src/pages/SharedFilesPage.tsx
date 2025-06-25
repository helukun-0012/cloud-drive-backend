import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { getSharedFiles as getSharedFilesApi, cancelShare as cancelShareApiHook } from '../services/fileApi';
import ConfirmationDialog from '../components/ConfirmationDialog';
import NotificationAlert from '../components/NotificationAlert';
import { getFileIcon } from '../utils/fileIcons';

interface SharedFile {
  shareCode: string;
  expireTime: string;
  hasPassword: boolean;
  password?: string;
  fileId: number;
  filename: string;
  fileSize: number;
  createTime: string;
  visitCount: number;
  isExpired: boolean;
}

const SharedFilesPage: React.FC = () => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedShare, setSelectedShare] = useState<SharedFile | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchSharedFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSharedFilesApi();
      if (response.code === 401) {
        window.location.href = '/login';
        return;
      }
      if (response.code === 200 && Array.isArray(response.data)) {
        setFiles(response.data);
      } else {
        setFiles([]);
        if (response.message) {
          setError(response.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedFiles();
  }, [fetchSharedFiles]);

  const handleCancelShare = useCallback(async (shareCode: string) => {
    setLoading(true);
    try {
      const response = await cancelShareApiHook(shareCode);
      if (response.code === 401) {
        window.location.href = '/login';
        return false;
      }
      if (response.code === 200) {
        setError(null);
        await fetchSharedFiles();
        setSuccess('分享取消成功');
        setTimeout(() => setSuccess(null), 3000);
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消分享失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSharedFiles]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleConfirmOpen = (file: SharedFile) => {
    setSelectedShare(file);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setSelectedShare(null);
  };

  const handleConfirmCancel = async () => {
    if (selectedShare) {
      const success = await handleCancelShare(selectedShare.shareCode);
      if (success) {
        handleConfirmClose();
      }
    }
  };

  const handleCopy = (file: SharedFile) => {
    const shareCode = encodeURIComponent(file.shareCode);
    const base = `${window.location.origin}/share/${shareCode}`;
    const pwdPart = file.hasPassword && file.password ? ` 密码: ${file.password}` : '';
    const text = `链接: ${base}${pwdPart}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        setSuccess('分享链接已复制');
        setTimeout(() => setSuccess(null), 3000);
      })
      .catch(() => {
        setError('复制失败');
      });
  };

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
        <ShareIcon
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
          我的分享
        </Typography>
      </Box>

      <Divider sx={{ mb: 3, bgcolor: 'primary.light' }} />

      <NotificationAlert
        error={error}
        success={success}
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
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>文件名</TableCell>
                <TableCell align="right">访问次数</TableCell>
                <TableCell align="right">分享时间</TableCell>
                <TableCell align="right">过期时间</TableCell>
                <TableCell align="center">访问密码</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress sx={{ color: 'primary.main' }} />
                  </TableCell>
                </TableRow>
              ) : files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    暂无分享文件
                  </TableCell>
                </TableRow>
              ) : (
                files
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((file) => (
                    <TableRow key={file.shareCode}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                          {getFileIcon(file.filename)}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: { xs: '100px', sm: '150px', md: '200px' },
                                color: file.isExpired ? 'text.disabled' : 'text.primary'
                              }}
                            >
                              {file.filename}
                            </Typography>
                            {file.isExpired && (
                              <Chip
                                label="已过期"
                                color="error"
                                size="small"
                                sx={{
                                  height: '20px',
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ color: file.isExpired ? 'text.disabled' : 'text.primary' }}>
                        {file.visitCount}
                      </TableCell>
                      <TableCell align="right" sx={{ color: file.isExpired ? 'text.disabled' : 'text.primary' }}>
                        {formatDate(file.createTime)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: file.isExpired ? 'text.disabled' : 'text.primary' }}>
                        {formatDate(file.expireTime)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={file.hasPassword ? "有密码" : "无密码"}
                          color={file.isExpired ? "default" : (file.hasPassword ? "primary" : "default")}
                          size="small"
                          sx={{
                            fontWeight: 500,
                            opacity: file.isExpired ? 0.6 : 1
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton
                            onClick={() => handleCopy(file)}
                            color="primary"
                            disabled={file.isExpired}
                            title="复制分享链接"
                          >
                            <FileCopyIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleConfirmOpen(file)}
                            color="error"
                            title={file.isExpired ? "删除过期分享" : "取消分享"}
                            sx={{
                              opacity: file.isExpired ? 0.7 : 1
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={files.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="每页行数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共${count}条`}
          />
        </TableContainer>
      </Paper>

      <ConfirmationDialog
        open={confirmOpen}
        title={selectedShare?.isExpired ? "确认删除过期分享" : "确认取消分享"}
        contentText={
          selectedShare?.isExpired
            ? `确定要删除过期分享文件 "${selectedShare?.filename}" 吗？此操作不可撤销。`
            : `确定要取消分享文件 "${selectedShare?.filename}" 吗？此操作不可撤销。`
        }
        onClose={handleConfirmClose}
        onConfirm={handleConfirmCancel}
      />
    </Box>
  );
};

export default SharedFilesPage; 