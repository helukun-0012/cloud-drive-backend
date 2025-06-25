/**
 * 页面布局组件
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Share as ShareIcon,
  Logout as LogoutIcon,
  CloudCircle as CloudIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const menuItems = [
    { text: '文件列表', icon: <FolderIcon />, path: '/files' },
    { text: '我的分享', icon: <ShareIcon />, path: '/shared' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.primary.light}`,
            bgcolor: 'background.default',
          },
        }}
      >
        <Toolbar 
          sx={{ 
            px: 2, 
            py: 2, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <CloudIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 28 }} />
          <Typography 
            variant="h5" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.dark',
              flexGrow: 1
            }}
          >
            云盘系统
          </Typography>
        </Toolbar>
        <Divider sx={{ bgcolor: 'primary.light' }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List sx={{ py: 2 }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(157, 202, 224, 0.2)',
                    }
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                      minWidth: 40
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '1rem',
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      color: location.pathname === item.path ? 'primary.dark' : 'text.primary' 
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ flexGrow: 1 }} />
          <Divider sx={{ bgcolor: 'primary.light' }} />
          <List sx={{ py: 1 }}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(232, 125, 43, 0.1)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="退出登录" 
                  primaryTypographyProps={{ 
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'error.main'
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          p: { xs: 2, sm: 3 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 