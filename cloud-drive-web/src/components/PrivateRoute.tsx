/* 
 * 用于保护路由，只有已认证的用户才能访问。
 * 若未认证，则重定向到登录页面。
 */

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 检查 token 是否存在
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // 如果还在检查认证状态，显示加载状态
  if (isAuthenticated === null) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果已认证，渲染子组件
  return <>{children}</>;
};

export default PrivateRoute; 