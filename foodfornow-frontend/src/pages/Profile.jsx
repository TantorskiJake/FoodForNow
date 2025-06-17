import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Divider,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, loading: authLoading, refreshAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
    match: false
  });

  // Update password validation on password change
  useEffect(() => {
    const { newPassword, confirmPassword } = formData;
    setPasswordChecks({
      length: newPassword.length >= 8,
      lowercase: /[a-z]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
      match: newPassword === confirmPassword && newPassword !== ''
    });
  }, [formData.newPassword, formData.confirmPassword]);

  useEffect(() => {
    if (!authLoading && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
      setLoading(false);
    }
  }, [authLoading, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords if changing password
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (!formData.currentPassword) {
        setError('Current password is required to set a new password');
        return;
      }
    }

    try {
      setLoading(true);
      const updateData = {
        name: formData.name,
        email: formData.email
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await api.put('/auth/profile', updateData);
      
      // Update form data with the response
      setFormData(prev => ({
        ...prev,
        name: response.data.user.name,
        email: response.data.user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      toast.success('Profile updated successfully');
      refreshAuth();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(45deg, #f5f5f7 0%, #ffffff 100%)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(45deg, #f5f5f7 0%, #ffffff 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              letterSpacing: '-0.5px',
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
              mb: 2,
            }}
          >
            Edit Profile
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 2,
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 1,
                  '& .MuiAlert-icon': {
                    color: '#ff3b30',
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              />

              <Typography
                variant="h6"
                sx={{
                  mt: 3,
                  mb: 2,
                  fontWeight: 500,
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                }}
              >
                Change Password
              </Typography>

              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                margin="normal"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                margin="normal"
                disabled={loading}
                error={formData.newPassword !== '' && !Object.values(passwordChecks).every(Boolean)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                disabled={loading}
                error={formData.confirmPassword !== '' && !passwordChecks.match}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              />

              {(formData.newPassword || formData.confirmPassword) && (
                <List dense sx={{ mt: 1, mb: 2 }}>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {passwordChecks.length ? (
                        <CheckCircleIcon sx={{ color: '#34C759' }} />
                      ) : (
                        <CancelIcon sx={{ color: '#FF3B30' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="At least 8 characters" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {passwordChecks.lowercase ? (
                        <CheckCircleIcon sx={{ color: '#34C759' }} />
                      ) : (
                        <CancelIcon sx={{ color: '#FF3B30' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="At least one lowercase letter" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {passwordChecks.uppercase ? (
                        <CheckCircleIcon sx={{ color: '#34C759' }} />
                      ) : (
                        <CancelIcon sx={{ color: '#FF3B30' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="At least one uppercase letter" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {passwordChecks.number ? (
                        <CheckCircleIcon sx={{ color: '#34C759' }} />
                      ) : (
                        <CancelIcon sx={{ color: '#FF3B30' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="At least one number" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {passwordChecks.special ? (
                        <CheckCircleIcon sx={{ color: '#34C759' }} />
                      ) : (
                        <CancelIcon sx={{ color: '#FF3B30' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="At least one special character" />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {passwordChecks.match ? (
                        <CheckCircleIcon sx={{ color: '#34C759' }} />
                      ) : (
                        <CancelIcon sx={{ color: '#FF3B30' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="Passwords match" />
                  </ListItem>
                </List>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || (formData.newPassword && !Object.values(passwordChecks).every(Boolean))}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
                      : '#228B22',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
                        : '#1B6B1B',
                    },
                    '&.Mui-disabled': {
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(34, 139, 34, 0.5)'
                        : 'rgba(34, 139, 34, 0.5)',
                    },
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    color: theme.palette.mode === 'dark' ? '#228B22' : '#1B6B1B',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(34, 139, 34, 0.1)'
                        : 'rgba(34, 139, 34, 0.1)',
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Profile; 