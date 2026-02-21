import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Paper,
  useTheme,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import PasswordField from '../components/PasswordField';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';

const Register = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { setAuthFromLogin, setJustLoggedIn } = useAuth();
  const { showAchievements } = useAchievements();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const pwd = passwordInput;
      const newStrength = {
        length: pwd.length >= 8,
        uppercase: /[A-Z]/.test(pwd),
        lowercase: /[a-z]/.test(pwd),
        number: /[0-9]/.test(pwd),
        special: /[^A-Za-z0-9]/.test(pwd),
      };
      setPasswordStrength(newStrength);
    }, 300);

    return () => clearTimeout(timeout);
  }, [passwordInput]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === 'password') {
      setPasswordInput(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
    if (strengthCount < 3) {
      setError('Password does not meet minimum requirements');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Check for achievements in response
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }

      if ('PasswordCredential' in window && 'credentials' in navigator) {
        try {
          const cred = new window.PasswordCredential({
            id: formData.email,
            password: formData.password,
            name: formData.name,
          });
          await navigator.credentials.store(cred).catch((e) =>
            console.error('Credential store failed:', e)
          );
        } catch (credErr) {
          console.error('Credential store failed:', credErr);
        }
      }

      setAuthFromLogin(response.data.user);
      setJustLoggedIn();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data.error || 'Registration failed. Please try again.');
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', err.message);
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
    if (strengthCount === 5) return '#34C759';
    if (strengthCount >= 3) return '#FF9500';
    return '#FF3B30';
  };

  const getPasswordStrengthValue = () => {
    const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
    return (strengthCount / 5) * 100;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(45deg, #f5f5f7 0%, #ffffff 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xs">
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
            Create Account
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

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
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
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
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
              <PasswordField
                name="password"
                label="Password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
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
              {formData.password && (
                <Box sx={{ mt: 1, width: '100%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={getPasswordStrengthValue()}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPasswordStrengthColor(),
                      },
                    }}
                  />
                  <List dense sx={{ mt: 1 }}>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {passwordStrength.length ? (
                          <CheckCircleIcon sx={{ color: '#34C759' }} />
                        ) : (
                          <CancelIcon sx={{ color: '#FF3B30' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="At least 8 characters" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {passwordStrength.uppercase ? (
                          <CheckCircleIcon sx={{ color: '#34C759' }} />
                        ) : (
                          <CancelIcon sx={{ color: '#FF3B30' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="At least one uppercase letter" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {passwordStrength.lowercase ? (
                          <CheckCircleIcon sx={{ color: '#34C759' }} />
                        ) : (
                          <CancelIcon sx={{ color: '#FF3B30' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="At least one lowercase letter" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {passwordStrength.number ? (
                          <CheckCircleIcon sx={{ color: '#34C759' }} />
                        ) : (
                          <CancelIcon sx={{ color: '#FF3B30' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="At least one number" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {passwordStrength.special ? (
                          <CheckCircleIcon sx={{ color: '#34C759' }} />
                        ) : (
                          <CancelIcon sx={{ color: '#FF3B30' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="At least one special character" />
                    </ListItem>
                  </List>
                </Box>
              )}
              <PasswordField
                name="confirmPassword"
                label="Confirm Password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
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
                Create Account
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/login')}
                disabled={isLoading}
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
                Already have an account? Sign in
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;