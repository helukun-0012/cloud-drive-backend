import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FilesPage from './pages/FilesPage';
import SharedFilesPage from './pages/SharedFilesPage';
import ShareAccessPage from './pages/ShareAccessPage';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import './App.css';
import { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// 将路由内容移到 AppContent 组件中
const AppContent = () => {
  const navigate = useNavigate();

  // 立即设置 navigate 函数
  useEffect(() => {
    // 检查是否有 token
    const token = localStorage.getItem('token');
    if (!token && window.location.pathname !== '/login' && window.location.pathname !== '/register' && !window.location.pathname.startsWith('/share/')) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/share/:shareCode" element={<ShareAccessPage />} />
      <Route
        path="/files"
        element={
          <PrivateRoute>
            <Layout>
              <FilesPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/shared"
        element={
          <PrivateRoute>
            <Layout>
              <SharedFilesPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/files" replace />} />
    </Routes>
  );
};

// App 组件只负责提供 Router 上下文
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
