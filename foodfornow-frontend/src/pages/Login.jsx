import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Paper,
  useTheme,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PasswordField from '../components/PasswordField';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const LOGIN_PHASE = { FORM: 'form', SUCCESS: 'success', EXITING: 'exiting' };

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { authenticated, loading, setAuthFromLogin, setJustLoggedIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState(LOGIN_PHASE.FORM);

  // Redirect to dashboard if already signed in (and not in transition)
  useEffect(() => {
    if (!loading && authenticated && loginPhase === LOGIN_PHASE.FORM) {
      navigate('/dashboard', { replace: true });
    }
  }, [authenticated, loading, loginPhase, navigate]);

  // After success UI, move to exit phase
  useEffect(() => {
    if (loginPhase !== LOGIN_PHASE.SUCCESS) return;
    const t = setTimeout(() => setLoginPhase(LOGIN_PHASE.EXITING), 500);
    return () => clearTimeout(t);
  }, [loginPhase]);

  // Show spinner only when authenticated and still on form (e.g. redirect from refresh)
  if (authenticated && loginPhase === LOGIN_PHASE.FORM) {
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
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Safety: stop spinner after 10s no matter what (in case fetch never settles)
    const safetyTimeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Request is taking too long. Please try again.');
    }, 10000);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      clearTimeout(safetyTimeoutId);

      if (!res.ok) {
        setError(data?.error || 'Login failed. Please try again.');
        return;
      }

      const user = data?.user ?? data;
      if (!user?.id && !user?._id) {
        setError('Invalid response from server. Please try again.');
        return;
      }

      if ('PasswordCredential' in window && 'credentials' in navigator) {
        const cred = new window.PasswordCredential({
          id: email,
          password,
          name: email,
        });
        navigator.credentials.store(cred).catch(() => {});
      }

      setAuthFromLogin(user);
      setIsLoading(false);
      setLoginPhase(LOGIN_PHASE.SUCCESS);
    } catch (err) {
      clearTimeout(safetyTimeoutId);
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      clearTimeout(safetyTimeoutId);
      setIsLoading(false);
    }
  };

  const bgSx = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)'
      : 'linear-gradient(45deg, #f5f5f7 0%, #ffffff 100%)',
    py: 4,
  };

  return (
    <Box sx={bgSx}>
      <motion.div
        animate={{
          opacity: loginPhase === LOGIN_PHASE.EXITING ? 0 : 1,
          scale: loginPhase === LOGIN_PHASE.EXITING ? 0.96 : 1,
          filter: loginPhase === LOGIN_PHASE.EXITING ? 'blur(8px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => {
          if (loginPhase === LOGIN_PHASE.EXITING) {
            setJustLoggedIn(true);
            navigate('/dashboard', { replace: true });
          }
        }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
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
              {loginPhase === LOGIN_PHASE.SUCCESS || loginPhase === LOGIN_PHASE.EXITING ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ textAlign: 'center' }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 72,
                      color: theme.palette.mode === 'dark' ? '#228B22' : '#1B6B1B',
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      mt: 2,
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                    }}
                  >
                    Welcome back
                  </Typography>
                </motion.div>
              ) : (
                <>
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
                    Welcome Back
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

            <Box
              component="form"
              onSubmit={onSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                  e.target.closest('form')?.requestSubmit();
                }
              }}
              sx={{ width: '100%' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={onChange}
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
                autoComplete="current-password"
                value={password}
                onChange={onChange}
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => navigate('/forgot-password')}
                  disabled={isLoading}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    color: theme.palette.mode === 'dark' ? '#228B22' : '#1B6B1B',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(34, 139, 34, 0.1)'
                        : 'rgba(34, 139, 34, 0.1)',
                    },
                  }}
                >
                  Forgot password?
                </Button>
              </Box>
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
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Sign In'
                )}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/register')}
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
                Don't have an account? Register
              </Button>
            </Box>
          </Paper>
                </>
              )}
            </Box>
          </Container>
      </motion.div>
    </Box>
  );
};

export default Login;