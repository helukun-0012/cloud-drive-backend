/**
 * 确认对话框组件
 */
import React, { useState } from 'react';
import { Box, TextField, Button, InputAdornment, Paper } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface FileSearchBarProps {
  onSearch: (keyword: string) => void;
}

const FileSearchBar: React.FC<FileSearchBarProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Paper sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          fullWidth
          placeholder="搜索文件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ minWidth: "120px" }}
        >
          搜索
        </Button>
      </Box>
    </Paper>
  );
};

export default FileSearchBar; 