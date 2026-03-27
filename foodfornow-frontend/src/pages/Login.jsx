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
  useMediaQuery,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import PasswordField from '../components/PasswordField';
import { useAuth } from '../context/AuthContext';
import { AUTH_TRANSITION } from '../config/authTransitionConfig';
import api from '../services/api';
import {
  clearRememberedCredentials,
  getRememberedEmail,
  setRememberedEmail,
} from '../utils/loginRememberedEmail';

const LOGIN_PHASE = { FORM: 'form', SUCCESS: 'success', EXITING: 'exiting' };

const BRAND = {
  green: '#228B22',
  greenDark: '#1B6B1B',
  greenLight: 'rgba(34, 139, 34, 0.12)',
};

const {
  easeOut: EASE_OUT,
  exitDuration: EXIT_DURATION,
  successHoldMs: SUCCESS_HOLD_MS,
  successIconDuration: SUCCESS_ICON_DURATION,
  formExit,
} = AUTH_TRANSITION;

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { authenticated, loading, setAuthFromLogin, setJustLoggedIn } = useAuth();

  const rememberedEmail = getRememberedEmail();
  const [formData, setFormData] = useState({
    email: rememberedEmail ?? '',
    password: '', // leave empty so Apple Passwords / browser can autofill
  });
  const [rememberEmail, setRememberEmail] = useState(!!rememberedEmail);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState(LOGIN_PHASE.FORM);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Redirect to dashboard if already signed in (and not in transition)
  useEffect(() => {
    if (!loading && authenticated && loginPhase === LOGIN_PHASE.FORM) {
      navigate('/dashboard', { replace: true });
    }
  }, [authenticated, loading, loginPhase, navigate]);

  // After success UI, move to exit phase
  useEffect(() => {
    if (loginPhase !== LOGIN_PHASE.SUCCESS) return;
    const t = setTimeout(() => setLoginPhase(LOGIN_PHASE.EXITING), SUCCESS_HOLD_MS);
    return () => clearTimeout(t);
  }, [loginPhase]);

  // Show spinner only when authenticated and still on form (e.g. redirect from refresh)
  if (authenticated && loginPhase === LOGIN_PHASE.FORM) {
    const isDarkSpinner = theme.palette.mode === 'dark';
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDarkSpinner
            ? 'linear-gradient(135deg, #0f1419 0%, #1a2332 40%, #15202b 100%)'
            : 'linear-gradient(135deg, #f0f7f0 0%, #e8f5e9 30%, #ffffff 70%)',
        }}
      >
        <CircularProgress sx={{ color: BRAND.green }} />
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
      const res = await api.post('/auth/login', { email, password });
      clearTimeout(safetyTimeoutId);

      const data = res.data;
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

      if (rememberEmail) {
        setRememberedEmail(email);
      } else {
        clearRememberedCredentials();
      }

      setAuthFromLogin(user);
      setIsLoading(false);
      setLoginPhase(LOGIN_PHASE.SUCCESS);
    } catch (err) {
      clearTimeout(safetyTimeoutId);
      console.error('Login error:', err);
      const message = err.response?.data?.error || err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      clearTimeout(safetyTimeoutId);
      setIsLoading(false);
    }
  };

  const isDark = theme.palette.mode === 'dark';

  const bgSx = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    overflow: 'hidden',
    background: isDark
      ? 'linear-gradient(135deg, #0f1419 0%, #1a2332 40%, #15202b 100%)'
      : 'linear-gradient(135deg, #f0f7f0 0%, #e8f5e9 30%, #ffffff 70%)',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: isDark
        ? 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(34, 139, 34, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0, 100, 0, 0.08) 0%, transparent 45%)'
        : 'radial-gradient(ellipse 70% 50% at 15% 30%, rgba(34, 139, 34, 0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 85% 70%, rgba(34, 139, 34, 0.06) 0%, transparent 45%)',
      pointerEvents: 'none',
    },
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      '& fieldset': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
      '&:hover fieldset': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
      },
      '&.Mui-focused fieldset': {
        borderWidth: 2,
        borderColor: BRAND.green,
        boxShadow: `0 0 0 3px ${BRAND.greenLight}`,
      },
    },
  };

  const formStagger = { staggerChildren: 0.06, delayChildren: 0.1 };

  return (
    <Box sx={bgSx}>
      <motion.div
        animate={{
          opacity: loginPhase === LOGIN_PHASE.EXITING ? 0 : 1,
          scale: loginPhase === LOGIN_PHASE.EXITING ? formExit.scale : 1,
          filter: loginPhase === LOGIN_PHASE.EXITING ? `blur(${formExit.blurPx}px)` : 'blur(0px)',
        }}
        transition={{ duration: EXIT_DURATION, ease: EASE_OUT }}
        onAnimationComplete={() => {
          if (loginPhase === LOGIN_PHASE.EXITING) {
            setJustLoggedIn(true);
            navigate('/dashboard', { replace: true });
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          flex: isDesktop ? undefined : 1,
          padding: isDesktop ? 0 : 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            width: '100%',
            maxWidth: isDesktop ? 960 : 440,
            minHeight: isDesktop ? 560 : undefined,
            borderRadius: isDesktop ? 3 : 0,
            overflow: 'hidden',
            boxShadow: isDesktop
              ? isDark
                ? '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)'
              : 'none',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left panel: branding (desktop) or top strip (mobile) */}
          <Box
            sx={{
              flex: isDesktop ? '0 0 42%' : '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: isDesktop ? 4 : 3,
              py: isDesktop ? 4 : 3,
              background: isDark
                ? 'linear-gradient(160deg, rgba(34, 139, 34, 0.2) 0%, rgba(0, 80, 0, 0.15) 50%, transparent 100%)'
                : 'linear-gradient(160deg, rgba(34, 139, 34, 0.12) 0%, rgba(34, 139, 34, 0.04) 100%)',
              borderRight: isDesktop ? '1px solid' : 'none',
              borderBottom: isDesktop ? 'none' : '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              style={{ textAlign: 'center', width: '100%' }}
            >
              <Box
                sx={{
                  width: isDesktop ? 56 : 48,
                  height: isDesktop ? 56 : 48,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${BRAND.green} 0%, ${BRAND.greenDark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: `0 8px 24px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(34, 139, 34, 0.25)'}`,
                }}
              >
                <RestaurantOutlinedIcon sx={{ fontSize: isDesktop ? 32 : 28, color: '#fff' }} />
              </Box>
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: isDark ? '#fff' : '#1a1a1a',
                  display: 'block',
                }}
              >
                FoodForNow
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                  fontSize: '0.8rem',
                }}
              >
                Pantry, recipes & shopping — in one place
              </Typography>
            </motion.div>
          </Box>

          {/* Right panel: form */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 3, sm: 4 },
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Container disableGutters sx={{ maxWidth: 400, width: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                {loginPhase === LOGIN_PHASE.SUCCESS || loginPhase === LOGIN_PHASE.EXITING ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: SUCCESS_ICON_DURATION, ease: EASE_OUT }}
                    style={{ textAlign: 'center' }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 72, color: BRAND.green }} />
                    <Typography variant="h5" sx={{ mt: 2, fontWeight: 600, color: isDark ? '#fff' : '#1d1d1f' }}>
                      Welcome back
                    </Typography>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={{ hidden: {}, visible: formStagger }}
                    initial="hidden"
                    animate="visible"
                    style={{ width: '100%' }}
                  >
                    <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LockOutlinedIcon sx={{ fontSize: 20, color: BRAND.green }} />
                        <Typography
                          variant="overline"
                          sx={{
                            letterSpacing: '0.12em',
                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                            fontWeight: 600,
                          }}
                        >
                          Secure sign in
                        </Typography>
                      </Box>
                      <Typography
                        variant="h5"
                        component="h1"
                        sx={{
                          fontWeight: 600,
                          letterSpacing: '-0.02em',
                          color: isDark ? '#fff' : '#1d1d1f',
                          mb: 3,
                        }}
                      >
                        Welcome back
                      </Typography>
                    </motion.div>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        width: '100%',
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'transparent',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          background: `linear-gradient(180deg, ${BRAND.green} 0%, ${BRAND.greenDark} 100%)`,
                          borderRadius: '4px 0 0 4px',
                        },
                      }}
                    >
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Alert
                            severity="error"
                            sx={{
                              mb: 2,
                              borderRadius: 1.5,
                              '& .MuiAlert-icon': { color: '#ff3b30' },
                            }}
                          >
                            {error}
                          </Alert>
                        </motion.div>
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
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                          <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email address"
                            name="email"
                            autoComplete="username"
                            autoFocus
                            value={email}
                            onChange={onChange}
                            disabled={isLoading}
                            sx={inputSx}
                          />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                          <PasswordField
                            name="password"
                            label="Password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={onChange}
                            disabled={isLoading}
                            sx={inputSx}
                          />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={rememberEmail}
                                onChange={(e) => setRememberEmail(e.target.checked)}
                                disabled={isLoading}
                                name="rememberEmail"
                                sx={{
                                  color: isDark ? 'rgba(255,255,255,0.7)' : undefined,
                                  '&.Mui-checked': { color: BRAND.green },
                                }}
                              />
                            }
                            label={
                              <Typography variant="body2" color="text.secondary">
                                Remember my email
                              </Typography>
                            }
                            sx={{ mt: 0.5 }}
                          />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => navigate('/forgot-password')}
                              disabled={isLoading}
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.8125rem',
                                color: BRAND.green,
                                '&:hover': { background: BRAND.greenLight },
                              }}
                            >
                              Forgot password?
                            </Button>
                          </Box>
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                          <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={isLoading}
                            sx={{
                              mt: 2.5,
                              mb: 1.5,
                              py: 1.5,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '1rem',
                              fontWeight: 600,
                              background: `linear-gradient(135deg, ${BRAND.green} 0%, ${BRAND.greenDark} 100%)`,
                              boxShadow: `0 4px 14px ${isDark ? 'rgba(0,0,0,0.25)' : 'rgba(34, 139, 34, 0.35)'}`,
                              '&:hover': {
                                background: `linear-gradient(135deg, ${BRAND.greenDark} 0%, #004d00 100%)`,
                                boxShadow: `0 6px 20px ${isDark ? 'rgba(0,0,0,0.35)' : 'rgba(34, 139, 34, 0.4)'}`,
                              },
                              '&.Mui-disabled': {
                                background: isDark ? 'rgba(34, 139, 34, 0.4)' : 'rgba(34, 139, 34, 0.5)',
                              },
                            }}
                          >
                            {isLoading ? (
                              <CircularProgress size={24} sx={{ color: 'white' }} />
                            ) : (
                              'Sign in'
                            )}
                          </Button>
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                          <Button
                            fullWidth
                            variant="text"
                            onClick={() => navigate('/register')}
                            disabled={isLoading}
                            sx={{
                              textTransform: 'none',
                              color: BRAND.green,
                              '&:hover': { background: BRAND.greenLight },
                            }}
                          >
                            Don't have an account? Sign up
                          </Button>
                        </motion.div>
                      </Box>
                    </Paper>
                  </motion.div>
                )}
              </Box>
            </Container>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Login;
