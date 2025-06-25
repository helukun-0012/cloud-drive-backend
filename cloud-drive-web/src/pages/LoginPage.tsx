import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.code === 200 && data.data) {
        localStorage.setItem('token', `${data.data}`);
        navigate('/files');
      } else {
        setError(data.message || '请求失败');
      }
    } catch (err) {
      setError('请求失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 8
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main', 
              width: 56, 
              height: 56, 
              mb: 2,
              boxShadow: '0 4px 12px rgba(74, 149, 175, 0.2)'
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 30 }} />
          </Avatar>
          
          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ 
              mb: 4, 
              color: 'primary.dark',
              fontWeight: 600
            }}
          >
            云盘登录
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="用户名"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="密码"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2, 
                  mb: 2,
                  borderRadius: 2
                }}
              >
                {error}
              </Alert>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.2,
                fontSize: '1.05rem'
              }}
            >
              {loading ? <CircularProgress size={24} /> : '登录'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, width: '100%' }}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                或者
              </Typography>
            </Divider>
            
            <Button
              component={Link}
              to="/register"
              fullWidth
              variant="outlined"
              sx={{ mt: 1, mb: 2 }}
            >
              注册新账号
            </Button>
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              测试账号: testuser / 123456
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;