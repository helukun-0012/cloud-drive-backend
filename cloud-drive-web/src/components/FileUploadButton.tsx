import React from 'react';
import { Fab } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

interface FileUploadButtonProps {
  onUpload: (file: File) => void;
  uploading?: boolean; // 设为可选，默认不禁用上传按钮
}
/* 文件上传按钮组件 */
const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onUpload }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
      event.target.value = ''; // 清除 input 的值，允许重复选择同一个文件
    }
  };

  return (
    <>
      <input
        accept="*/*"
        style={{ display: "none" }}
        id="upload-button"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="upload-button">
        <Fab
          color="primary"
          component="span"
          aria-label="upload"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
          }}
        >
          <UploadIcon />
        </Fab>
      </label>
    </>
  );
};

export default FileUploadButton; 