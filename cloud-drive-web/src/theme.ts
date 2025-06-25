import { createTheme } from '@mui/material';

// 创建自定义主题，使用图片中的色系
const theme = createTheme({
  palette: {
    primary: {
      main: '#4A95AF', // 中蓝色
      light: '#9DCAE0', // 浅蓝色
      dark: '#0F2231', // 深蓝色
      contrastText: '#fff',
    },
    secondary: {
      main: '#F6B93B', // 黄色
      dark: '#E87D2B', // 橙色
      contrastText: '#0F2231',
    },
    error: {
      main: '#E87D2B', // 使用橙色作为错误色
    },
    background: {
      default: '#f5f9fc', // 淡蓝色背景
      paper: '#fff',
    },
    text: {
      primary: '#0F2231', // 深蓝色文字
      secondary: '#4A95AF', // 中蓝色作为次要文字
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: '#4A95AF',
          '&:hover': {
            backgroundColor: '#0F2231',
          },
        },
        containedSecondary: {
          backgroundColor: '#F6B93B',
          '&:hover': {
            backgroundColor: '#E87D2B',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: '#9DCAE0', // 使用浅蓝色作为分隔线
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#4A95AF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4A95AF',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#9DCAE0',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f9fc',
          color: '#0F2231',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#4A95AF',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          '&.Mui-selected': {
            color: '#4A95AF',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
    },
  },
});

export default theme; 