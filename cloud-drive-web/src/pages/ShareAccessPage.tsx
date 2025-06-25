import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  Divider,
  Chip,
} from '@mui/material';
import { accessShareWithPassword, accessShareWithToken, ShareAccessResponse, downloadSharedFile } from '../services/fileApi';
import { formatFileSize, formatDate } from '../utils/formatters';
import NotificationAlert from '../components/NotificationAlert';
import { getFileIcon } from '../utils/fileIcons.tsx';

const ShareAccessPage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  console.log('ShareAccessPage mounted, shareCode:', shareCode);

  const [fileInfo, setFileInfo] = useState<ShareAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [fileNotFound, setFileNotFound] = useState(false);
  const isMountedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // 获取指定分享的 token
  const getShareToken = (code: string): string => {
    const cookies = document.cookie.split('; ');
    console.log('All cookies:', cookies);
    
    // 查找匹配的 cookie
    const cookie = cookies.find(c => {
      const [name] = c.split('=');
      return name === `share_token_${code}`;
    });
    
    if (!cookie) {
      console.log('No matching cookie found');
      return '';
    }
    
    // 提取 token 值（格式：share_token_xxx=token）
    const token = cookie.split('=')[1];
    console.log('Extracted token:', token);
    return token;
  };

  // 清除指定分享的 token
  const clearShareToken = (code: string) => {
    document.cookie = `share_token_${code}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  useEffect(() => {
    console.log('useEffect triggered, shareCode:', shareCode);
    if (shareCode && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      accessWithToken();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [shareCode]);

  const accessWithToken = async () => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    
    console.log('Accessing with token');
    try {
      setLoading(true);
      setError(null);
      setFileNotFound(false);
      
      // 获取对应分享的 token
      const token = getShareToken(shareCode!);
      console.log('Using token for share:', shareCode, 'token:', token);
      
      const response = await accessShareWithToken(shareCode!, token);
      console.log('Access with token response:', response);
      
      if (response.code === 200) {
        setFileInfo(response.data);
        setShowPasswordInput(false);
      } else if (response.code === 404) {
        // 处理文件不存在的情况
        setFileNotFound(true);
        clearShareToken(shareCode!);
        setShowPasswordInput(false);
      } else {
        // 其他错误，显示密码输入框，并清除对应的 token
        clearShareToken(shareCode!);
        setShowPasswordInput(true);
        // 如果有错误消息，显示它
        if (response.message) {
          setError(response.message);
        }
      }
    } catch (err) {
      console.error('Access with token error:', err);
      // 任何错误都显示密码输入框，并清除对应的 token
      clearShareToken(shareCode!);
      setShowPasswordInput(true);
      // 显示错误消息
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      isMountedRef.current = false;
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setFileNotFound(false);
      const response = await accessShareWithPassword(shareCode!, password);
      console.log('Password access response:', response);
      
      if (response.code === 200) {
        setFileInfo(response.data);
        setShowPasswordInput(false);
      } else if (response.code === 404) {
        // 处理文件不存在的情况
        setFileNotFound(true);
        setShowPasswordInput(false);
      } else {
        // 使用后端返回的错误消息
        setError(response.message);
      }
    } catch (err) {
      console.error('Password access error:', err);
      // 使用错误对象的message属性，这包含了后端返回的消息
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileInfo) {
      setError('下载失败：缺少必要信息');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // 获取分享 token
      const token = getShareToken(shareCode!);
      if (!token) {
        setError('下载失败：缺少访问令牌');
        return;
      }

      const res = await downloadSharedFile(shareCode!, token, fileInfo.filename);
      if (res.code === 200) {
        setSuccess('文件下载成功');
      } else {
        setError(res.message);
      }

    } catch (err) {
      console.error('Download error:', err);
      if (err instanceof Error && err.message === '原文件已经被删除') {
        setFileNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : '请求失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      p: 3, 
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      ) : fileNotFound ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: 600, 
            textAlign: 'center',
            borderTop: '4px solid',
            borderColor: 'error.main',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h5" sx={{ color: 'error.main', fontWeight: 600, mb: 2 }} gutterBottom>
            文件不存在或已被删除
          </Typography>
          <Typography variant="body1" color="text.secondary">
            您访问的分享文件可能已经被删除或分享链接已失效。
          </Typography>
        </Paper>
      ) : !fileInfo && !showPasswordInput ? (
        <Box sx={{ p: 3 }}>
          <NotificationAlert
            error={error}
            success={success}
            clearError={() => setError(null)}
          />
        </Box>
      ) : (
        <>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              color: 'primary.dark', 
              mb: 4, 
              fontWeight: 600,
              textAlign: 'center' 
            }}
          >
            云盘分享文件访问
          </Typography>

          <NotificationAlert
            error={error}
            success={success}
            clearError={() => setError(null)}
          />

          <Paper 
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              width: '100%', 
              mx: 'auto',
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              bgcolor: 'background.paper'
            }}
          >
            {showPasswordInput ? (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark', fontWeight: 600, mb: 3 }}>
                  请输入访问密码
                </Typography>
                <TextField
                  fullWidth
                  label="密码"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 3 }}
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePasswordSubmit}
                  disabled={!password}
                  fullWidth
                  sx={{ py: 1.2 }}
                >
                  确认
                </Button>
              </>
            ) : fileInfo ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'primary.dark', fontWeight: 600, flexGrow: 1 }}>
                    文件信息
                  </Typography>
                  {fileInfo.isExpired && (
                    <Chip 
                      label="已过期" 
                      color="error" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </Box>
                
                <Box 
                  sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'primary.dark', 
                    p: 2, 
                    borderRadius: 2, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                    {getFileIcon(fileInfo.filename, false, { fontSize: 'large' })}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, wordBreak: 'break-all', maxWidth: '90%' }}>
                    {fileInfo.filename}
                  </Typography>
                </Box>
                
                <List sx={{ mb: 3 }}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <Box sx={{ width: '30%' }}>
                        <Typography variant="body2" color="text.secondary">文件大小</Typography>
                      </Box>
                      <Box sx={{ width: '70%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatFileSize(fileInfo.fileSize)}</Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <Box sx={{ width: '30%' }}>
                        <Typography variant="body2" color="text.secondary">访问次数</Typography>
                      </Box>
                      <Box sx={{ width: '70%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileInfo.visitCount}</Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <Box sx={{ width: '30%' }}>
                        <Typography variant="body2" color="text.secondary">创建时间</Typography>
                      </Box>
                      <Box sx={{ width: '70%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDate(fileInfo.createTime)}</Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <Box sx={{ width: '30%' }}>
                        <Typography variant="body2" color="text.secondary">过期时间</Typography>
                      </Box>
                      <Box sx={{ width: '70%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDate(fileInfo.expireTime)}</Typography>
                      </Box>
                    </Box>
                  </ListItem>
                </List>
                
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleDownload}
                  fullWidth
                  sx={{ py: 1.2 }}
                  disabled={fileInfo.isExpired}
                >
                  下载文件
                </Button>
              </>
            ) : null}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ShareAccessPage; 