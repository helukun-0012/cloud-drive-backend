import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress,
  Paper,
  Avatar,
  Alert,
  Divider
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { register, sendVerificationCode } from '../services/userApi';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    code: ''
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    email: '',
    code: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  // 处理注册成功后的自动跳转
  useEffect(() => {
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (success && redirectCountdown === 0) {
      navigate('/login');
    }
  }, [success, redirectCountdown, navigate]);

  const validateForm = () => {
    const newErrors = {
      username: '',
      password: '',
      email: '',
      code: ''
    };

    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = '用户名长度必须在3到20个字符之间';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6 || formData.password.length > 20) {
      newErrors.password = '密码长度必须在6到20个字符之间';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(formData.password)) {
      newErrors.password = '密码必须包含数字和字母';
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入正确的邮箱格式';
    }

    if (!formData.code) {
      newErrors.code = '请输入验证码';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendCode = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: '请输入邮箱' }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: '请输入正确的邮箱格式' }));
      return;
    }
    try {
      await sendVerificationCode(formData.email);  
      setError('');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setError(error.message || '发送验证码失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      await register(formData);
      setSuccess(true);
      setRedirectCountdown(3); // 3秒后自动跳转
    } catch (error: any) {
      setError(error.message || '注册失败');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // 如果注册成功，显示成功界面
  if (success) {
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
                bgcolor: 'success.main', 
                width: 56, 
                height: 56, 
                mb: 2,
                boxShadow: '0 4px 12px rgba(74, 149, 175, 0.2)'
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 30 }} />
            </Avatar>
            
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                mb: 2, 
                color: 'success.dark',
                fontWeight: 600
              }}
            >
              注册成功
            </Typography>
            
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              您的账号已注册成功，{redirectCountdown}秒后自动跳转到登录页面...
            </Typography>
            
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              立即登录
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
            <PersonAddIcon sx={{ fontSize: 30 }} />
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
            注册账号
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
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="email"
              label="邮箱"
              type="email"
              id="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                required
                fullWidth
                name="code"
                label="验证码"
                id="code"
                value={formData.code}
                onChange={handleChange}
                error={!!errors.code}
                helperText={errors.code}
              />
              <Button
                variant="contained"
                onClick={handleSendCode}
                disabled={countdown > 0}
                sx={{ minWidth: 120 }}
              >
                {countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </Button>
            </Box>
            
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
              {loading ? <CircularProgress size={24} /> : '注册'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, width: '100%' }}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                已有账号?
              </Typography>
            </Divider>
            
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="outlined"
              sx={{ mt: 1 }}
            >
              返回登录
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage; 