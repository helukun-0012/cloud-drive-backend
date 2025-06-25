/**
 * 确认对话框组件
 */
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  TablePagination,
  Box,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { FileInfo, PaginationState, PaginationHandlers } from '../types/file';
import { formatFileSize, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons.tsx';

interface FileListTableProps {
  files: FileInfo[];
  loading: boolean;
  pagination: PaginationState & PaginationHandlers;
  onDownload: (file: FileInfo) => void;
  onDeleteClick: (file: FileInfo) => void;
  onRenameClick: (file: FileInfo) => void;
  onShareClick: (file: FileInfo) => void;
}

const FileListTable: React.FC<FileListTableProps> = ({
  files,
  loading,
  pagination,
  onDownload,
  onDeleteClick,
  onRenameClick,
  onShareClick,
}) => {
  const {
    page,
    rowsPerPage,
    count,
    handlePageChange,
    handleRowsPerPageChange,
  } = pagination;

  return (
    <Paper>
      <TableContainer>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>文件名</TableCell>
              <TableCell align="right">大小</TableCell>
              <TableCell align="right">上传时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  暂无文件
                </TableCell>
              </TableRow>
            ) : (
              files
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          {getFileIcon(file.originalFilename, file.isFolder, { fontSize: 'medium' })}
                        </Box>
                        <Typography 
                          variant="body2" 
                          component="span" 
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: '100px', sm: '150px', md: '200px' },
                            display: 'inline-block'
                          }}
                        >
                          {file.filename}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => onRenameClick(file)}
                          sx={{ ml: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {formatFileSize(file.fileSize)}
                    </TableCell>
                    <TableCell align="right">
                      {formatDate(file.createdAt)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => onDownload(file)}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => onShareClick(file)}
                      >
                        <ShareIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => onDeleteClick(file)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={count}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="每页行数:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共${count}条`}
        />
      </TableContainer>
    </Paper>
  );
};

export default FileListTable;