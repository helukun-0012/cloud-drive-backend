import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  LinearProgress, 
  Collapse, 
  Badge
} from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  Close as CloseIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadProgressListProps {
  uploads: UploadItem[];
  onRemove: (id: string) => void;
}

const UploadProgressList: React.FC<UploadProgressListProps> = ({ uploads, onRemove }) => {
  const [open, setOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  // 自动展开列表当有新上传任务时
  useEffect(() => {
    if (uploads.length > 0) {
      setOpen(true);
    }
  }, [uploads.length]);

  // 如果没有上传任务，不显示组件
  if (uploads.length === 0) {
    return null;
  }

  const activeUploads = uploads.filter(upload => upload.status === 'uploading').length;
  const completedUploads = uploads.filter(upload => upload.status === 'completed').length;
  const failedUploads = uploads.filter(upload => upload.status === 'error').length;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 80,
        right: 24,
        width: isHovered || open ? 320 : 'auto',
        zIndex: 1000,
        transition: 'width 0.3s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            bgcolor: 'primary.main',
            color: 'white',
            cursor: 'pointer',
          }}
          onClick={() => setOpen(!open)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              badgeContent={activeUploads}
              color="error"
              sx={{ mr: 1 }}
            >
              <UploadIcon />
            </Badge>
            <Typography variant="subtitle1">
              文件上传 {completedUploads > 0 && `(${completedUploads} 已完成)`}
              {failedUploads > 0 && ` (${failedUploads} 失败)`}
            </Typography>
          </Box>
          <Box>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
        </Box>

        <Collapse in={open}>
          <List sx={{ maxHeight: '300px', overflowY: 'auto', p: 0 }}>
            {uploads.map((upload) => (
              <ListItem
                key={upload.id}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    aria-label="删除" 
                    onClick={() => onRemove(upload.id)}
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
                sx={{ 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: upload.status === 'error' ? 'error.light' : 
                           upload.status === 'completed' ? 'success.light' : 'background.paper',
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                  py: 0.5
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {upload.status === 'completed' && <CheckCircleIcon color="success" fontSize="small" />}
                      {upload.status === 'error' && <ErrorIcon color="error" fontSize="small" />}
                      <Typography variant="body2" noWrap title={upload.file.name}>
                        {upload.file.name}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      {upload.status === 'uploading' && (
                        <Box component="span" sx={{ display: 'block', width: '100%', mt: 0.5 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={upload.progress} 
                            sx={{ height: 5, borderRadius: 5 }}
                          />
                        </Box>
                      )}
                      <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {upload.status === 'uploading' 
                            ? `${Math.round(upload.progress)}%` 
                            : upload.status === 'completed'
                              ? '已完成'
                              : '上传失败'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(upload.file.size)}
                        </Typography>
                      </Box>
                      {upload.error && (
                        <Typography variant="caption" color="error">
                          {upload.error}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Paper>
    </Box>
  );
};

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default UploadProgressList;
