/**
 * 文件分享对话框组件
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { generateRandomPassword, isValidPassword } from '../utils/formatters';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
    
interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (expireTime: string, password?: string) => Promise<{ shareCode: string } | null>;
  fileId: number;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [expireTime, setExpireTime] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareResult, setShareResult] = useState<{ shareCode: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultExpireTime = new Date();
      defaultExpireTime.setDate(defaultExpireTime.getDate() + 7);
      setExpireTime(defaultExpireTime.toISOString().slice(0, 16));
      setSharePassword(generateRandomPassword());
      setUsePassword(true);
      setShowPasswordInput(false);
      setShareResult(null);
      setCopied(false);
    }
  }, [open]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 6 && /^[A-Za-z0-9]*$/.test(value)) {
      setSharePassword(value);
    }
  };

  const handleConfirm = async () => {
    if (!expireTime || (usePassword && !isValidPassword(sharePassword))) return;
    const result = await onConfirm(expireTime, usePassword ? sharePassword : undefined);
    if (result) {
      setShareResult({
        shareCode: result.shareCode,
        password: usePassword ? sharePassword : undefined
      });
    }
  };

  const handleCopy = () => {
    if (!shareResult) return;
    const shareLink = `http://localhost:5173/share/${shareResult.shareCode}`;
    const textToCopy = shareResult.password 
      ? `链接: ${shareLink} 密码: ${shareResult.password}`
      : `链接: ${shareLink}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="share-dialog-title"
      aria-describedby="share-dialog-description"
      PaperProps={{
        sx: {
          width: '350px',
          maxWidth: '90%',
        },
      }}
    >
      <DialogTitle id="share-dialog-title">分享文件</DialogTitle>
      <DialogContent>
        {shareResult ? (
          <Box>
            <Typography variant="body1" gutterBottom>
              分享成功！
            </Typography>
            <Box sx={{ 
              bgcolor: 'background.paper', 
              p: 2, 
              borderRadius: 1,
              mb: 2
            }}>
              <Typography variant="body2" component="div">
                {shareResult.password ? (
                  <>已生成分享链接和密码，请点击下方按钮复制</>
                ) : (
                  <>已生成分享链接，请点击下方按钮复制</>
                )}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
            >
              {copied ? "已复制" : "复制分享信息"}
            </Button>
          </Box>
        ) : (
          <>
            <DialogContentText id="share-dialog-description" sx={{ mb: 2 }}>
              请设置文件分享的过期时间
            </DialogContentText>
            <TextField
              margin="dense"
              label="过期时间"
              type="datetime-local"
              fullWidth
              value={expireTime}
              onChange={(e) => setExpireTime(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={usePassword}
                    onChange={(e) => {
                      setUsePassword(e.target.checked);
                      if (e.target.checked) {
                        setSharePassword(generateRandomPassword());
                        setShowPasswordInput(false);
                      }
                    }}
                  />
                }
                label="使用密码保护"
              />
            </Box>
            {usePassword && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  默认生成6位密码：{sharePassword}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  sx={{ mr: 1 }}
                >
                  {showPasswordInput ? "使用默认密码" : "自定义密码"}
                </Button>
                <Button
                  size="small"
                  onClick={() => setSharePassword(generateRandomPassword())}
                >
                  重新生成
                </Button>
                {showPasswordInput && (
                  <TextField
                    margin="dense"
                    label="自定义密码"
                    type="text"
                    fullWidth
                    value={sharePassword}
                    onChange={handlePasswordChange}
                    placeholder="请输入6位密码"
                    helperText="密码必须是6位数字或字母的组合"
                    error={sharePassword.length > 0 && !isValidPassword(sharePassword)}
                    sx={{ mt: 2 }}
                  />
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {shareResult ? "关闭" : "取消"}
        </Button>
        {!shareResult && (
          <Button
            onClick={handleConfirm}
            color="primary"
            disabled={!expireTime || (usePassword && !isValidPassword(sharePassword))}
          >
            分享
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog; 