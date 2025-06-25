import React from 'react';
import { Alert, Box } from '@mui/material';

interface NotificationAlertProps {
  error: string | null;
  success: string | null;
  clearError: () => void;
}
/* 通知提示组件 */
const NotificationAlert: React.FC<NotificationAlertProps> = ({
  error,
  success,
  clearError,
}) => {
  if (!error && !success) return null;

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mb: 3 }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
            '& .MuiAlert-icon': {
              color: 'error.main',
            },
            fontSize: '0.95rem',
            py: 1
          }} 
          onClose={clearError}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
            '& .MuiAlert-icon': {
              color: 'secondary.main',
            },
            fontSize: '0.95rem',
            py: 1
          }}
        >
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default NotificationAlert; 