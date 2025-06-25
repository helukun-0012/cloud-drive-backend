/**
 * 重命名对话框组件
 * 用于重命名文件
 */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

interface RenameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newFilename: string) => void;
  initialFilename: string;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onClose,
  onConfirm,
  initialFilename,
}) => {
  const [newFilename, setNewFilename] = useState("");

  useEffect(() => {
    if (open) {
      setNewFilename(initialFilename);
    }
  }, [open, initialFilename]);

  const handleConfirm = () => {
    if (newFilename.trim() && newFilename !== initialFilename) {
      onConfirm(newFilename);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '35ch' } }}
      aria-labelledby="rename-dialog-title"
      aria-describedby="rename-dialog-description"
    >
      <DialogTitle id="rename-dialog-title">重命名文件</DialogTitle>
      <DialogContent>
        <DialogContentText id="rename-dialog-description" sx={{ mb: 2 }}>
          请输入新的文件名
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="文件名"
          type="text"
          fullWidth
          value={newFilename}
          onChange={(e) => setNewFilename(e.target.value)}
          inputProps={{ maxLength: 50 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          取消
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          disabled={!newFilename.trim() || newFilename === initialFilename}
        >
          确认
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
