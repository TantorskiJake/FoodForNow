import React, { useState, useEffect, useRef } from 'react';
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
  Avatar,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Fade,
  Zoom,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemButton,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon2,
  Security as SecurityIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as ShoppingCartIcon,
  Kitchen as KitchenIcon,
  CalendarToday as CalendarTodayIcon,
  Verified as VerifiedIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  QrCode as QrCodeIcon,
  Lock as LockIcon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import worldCities from '../utils/worldCities.json';
import { matchSorter } from 'match-sorter';
import useMediaQuery from '@mui/material/useMediaQuery';

// Add a helper to find the city object from a string
function findCityObj(locationStr) {
  if (!locationStr) return null;
  // Try to match city, subcountry, country
  const [city, rest] = locationStr.split(',').map(s => s.trim());
  if (!city || !rest) return null;
  // Try to match city and country (ignore subcountry for now)
  return worldCities.find(
    c => c.city.toLowerCase() === city.toLowerCase() && rest.toLowerCase().includes(c.country.toLowerCase())
  ) || null;
}

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, loading: authLoading, refreshAuth } = useAuth();
  const { setThemeFromPreference } = useCustomTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [stats, setStats] = useState({
    recipes: 0,
    mealPlans: 0,
    pantryItems: 0,
    shoppingItems: 0,
    daysActive: 0,
    mealsCooked: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      push: true,
      mealReminders: true,
      shoppingReminders: true,
    },
    preferences: {
      theme: 'auto',
      language: 'en',
      units: 'metric',
      timezone: 'UTC',
    },
  });

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
    match: false,
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [locationOptions, setLocationOptions] = useState([]);

  // Update password validation on password change
  useEffect(() => {
    const { newPassword, confirmPassword } = formData;
    const checks = {
      minLength: newPassword.length >= 8,
      lowercase: /[a-z]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
      match: newPassword === confirmPassword && newPassword !== '',
    };
    setPasswordChecks(checks);

    // Calculate password strength (0-100)
    const validChecks = Object.values(checks).filter(Boolean).length - 1; // -1 for match
    const strength = Math.min(100, (validChecks / 5) * 100);
    setPasswordStrength(strength);
  }, [formData.newPassword, formData.confirmPassword]);

  useEffect(() => {
    if (!authLoading && user) {
      // Try to pre-select the city object if location is a string
      let locationObj = null;
      if (typeof user.location === 'string' && user.location) {
        locationObj = findCityObj(user.location);
      }
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: typeof user.location === 'string' ? user.location : '',
        locationObj,
        website: user.website || '',
        notifications: {
          email: user.notifications?.email ?? true,
          push: user.notifications?.push ?? true,
          mealReminders: user.notifications?.mealReminders ?? true,
          shoppingReminders: user.notifications?.shoppingReminders ?? true,
        },
        preferences: {
          theme: user.preferences?.theme || 'auto',
          language: user.preferences?.language || 'en',
          units: user.preferences?.units || 'metric',
          timezone: user.preferences?.timezone || 'UTC',
        },
      }));
      
      // Set profile picture if user has one
      if (user.profilePicture) {
        setImagePreview(user.profilePicture);
      }
      
      setLoading(false);
      fetchUserStats();
      
      // Apply current theme preference when component loads
      if (user?.preferences?.theme) {
        setThemeFromPreference(user.preferences.theme);
      }
    }
  }, [authLoading, user, setThemeFromPreference]);

  const fetchUserStats = async () => {
    try {
      // Fetch user statistics
      const [recipesRes, mealPlansRes, pantryRes, shoppingRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/mealplan'),
        api.get('/pantry'),
        api.get('/shopping-list'),
      ]);

      setStats({
        recipes: recipesRes.data?.length || 0,
        mealPlans: mealPlansRes.data?.length || 0,
        pantryItems: pantryRes.data?.items?.length || 0,
        shoppingItems: shoppingRes.data?.length || 0,
        daysActive: Math.floor((Date.now() - new Date(user?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
        mealsCooked: mealPlansRes.data?.filter(meal => meal.cooked)?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLocationInputChange = (_, value) => {
    if (!value) {
      setLocationOptions([]);
      return;
    }
    // Fuzzy search cities and countries
    const matches = matchSorter(worldCities, value, {
      keys: ['city', 'country', 'subcountry'],
      threshold: matchSorter.rankings.CONTAINS,
    });
    setLocationOptions(matches.slice(0, 10));
  };

  const generateAvatar = () => {
    const name = formData.name || user?.name || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const color = colors[name.length % colors.length];
    
    return (
      <Avatar
        sx={{
          width: 120,
          height: 120,
          fontSize: '3rem',
          fontWeight: 600,
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          border: '4px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        {initials}
      </Avatar>
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (import.meta.env.DEV) console.log('Form submitted!');
    setError('');
    setSuccess('');

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
      if (passwordStrength < 60) {
        setError('Password is too weak. Please make it stronger.');
        return;
      }
    }

    try {
      setSaving(true);
      const updateData = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        preferences: formData.preferences,
        notifications: formData.notifications,
      };

      // Add profile picture if uploaded
      if (imagePreview && imagePreview.startsWith('data:')) {
        // For now, we'll store the base64 image directly
        // In production, you'd want to upload to a cloud service like AWS S3
        updateData.profilePicture = imagePreview;
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      if (import.meta.env.DEV) console.log('Sending profile update data:', updateData);
      const response = await api.put('/auth/profile', updateData);
      if (import.meta.env.DEV) console.log('Profile update response:', response.data);
      
      // Update form data with the response
      setFormData(prev => ({
        ...prev,
        name: response.data.user.name,
        email: response.data.user.email,
        bio: response.data.user.bio || '',
        location: response.data.user.location || prev.location,
        website: response.data.user.website || '',
        preferences: response.data.user.preferences || prev.preferences,
        notifications: response.data.user.notifications || prev.notifications,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully');
      
      // Apply theme changes immediately if theme preference was updated
      if (response.data.user.preferences?.theme) {
        setThemeFromPreference(response.data.user.preferences.theme);
      }
      
      refreshAuth();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#ff3b30';
    if (passwordStrength < 60) return '#ff9500';
    if (passwordStrength < 80) return '#ffcc00';
    return '#34c759';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Very Weak';
    if (passwordStrength < 60) return 'Weak';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
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
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Box>
            {/* Header Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-1px',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #ffffff 30%, #e0e0e0 90%)'
                    : 'linear-gradient(45deg, #1a1a1a 30%, #4a4a4a 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                Profile Settings
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 400, opacity: 0.8 }}
              >
                Manage your account and preferences
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {/* Left Column - Profile Overview */}
              <Grid item xs={12} md={4}>
                <Zoom in timeout={1000}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                      p: 3,
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        {imagePreview ? (
                          <Avatar
                            src={imagePreview}
                            sx={{
                              width: 120,
                              height: 120,
                              border: '4px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            }}
                          />
                        ) : (
                          generateAvatar()
                        )}
                        <IconButton
                          onClick={() => fileInputRef.current?.click()}
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            background: theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                              background: theme.palette.primary.dark,
                            },
                          }}
                        >
                          <PhotoCameraIcon />
                        </IconButton>
                      </Box>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      
                      <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                        {formData.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {formData.email}
                      </Typography>
                      
                      <Chip
                        icon={<VerifiedIcon />}
                        label="Verified Account"
                        color="success"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Stats Section */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Your Activity
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                              {stats.recipes}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Recipes
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
                              {stats.mealsCooked}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Meals Cooked
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="info" sx={{ fontWeight: 700 }}>
                              {stats.pantryItems}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Pantry Items
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning" sx={{ fontWeight: 700 }}>
                              {stats.daysActive}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Days Active
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Quick Actions */}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Quick Actions
                      </Typography>
                      <List dense>
                        <ListItemButton 
                          sx={{ borderRadius: 2, mb: 1 }}
                          onClick={() => navigate('/recipes')}
                        >
                          <ListItemIcon>
                            <RestaurantIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary="View My Recipes" />
                        </ListItemButton>
                        <ListItemButton 
                          sx={{ borderRadius: 2, mb: 1 }}
                          onClick={() => navigate('/dashboard')}
                        >
                          <ListItemIcon>
                            <CalendarTodayIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText primary="Meal Plans" />
                        </ListItemButton>
                        <ListItemButton 
                          sx={{ borderRadius: 2, mb: 1 }}
                          onClick={() => navigate('/shopping-list')}
                        >
                          <ListItemIcon>
                            <ShoppingCartIcon color="info" />
                          </ListItemIcon>
                          <ListItemText primary="Shopping List" />
                        </ListItemButton>
                        <ListItemButton 
                          sx={{ borderRadius: 2 }}
                          onClick={() => navigate('/pantry')}
                        >
                          <ListItemIcon>
                            <KitchenIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText primary="My Pantry" />
                        </ListItemButton>
                      </List>
                    </Box>
                  </Card>
                </Zoom>
              </Grid>

              {/* Right Column - Settings */}
              <Grid item xs={12} md={8}>
                <Slide direction="up" in timeout={1200}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
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
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
                          '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                          },
                        }}
                      >
                        <Tab icon={<PersonIcon />} label="Profile" />
                        <Tab icon={<SecurityIcon />} label="Security" />
                        <Tab icon={<SettingsIcon />} label="Preferences" />
                      </Tabs>
                    </Box>

                    <Box sx={{ p: 4 }}>
                      {error && (
                        <Alert 
                          severity="error" 
                          sx={{ 
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                              color: '#ff3b30',
                            },
                          }}
                          onClose={() => setError('')}
                        >
                          {error}
                        </Alert>
                      )}

                      {success && (
                        <Alert 
                          severity="success" 
                          sx={{ 
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                              color: '#34c759',
                            },
                          }}
                          onClose={() => setSuccess('')}
                        >
                          {success}
                        </Alert>
                      )}

                      {/* Profile Tab */}
                      {activeTab === 0 && (
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Full Name"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              disabled={saving}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
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
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Email Address"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              disabled={saving}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
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
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Bio"
                              name="bio"
                              value={formData.bio}
                              onChange={handleChange}
                              multiline
                              rows={3}
                              disabled={saving}
                              placeholder="Tell us about yourself..."
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
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
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Autocomplete
                              options={locationOptions}
                              getOptionLabel={(option) =>
                                option.city && option.country
                                  ? `${option.city}, ${option.subcountry ? option.subcountry + ', ' : ''}${option.country}`
                                  : ''
                              }
                              value={formData.locationObj || null}
                              onInputChange={handleLocationInputChange}
                              onChange={(_, newValue) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  locationObj: newValue,
                                  location: newValue ? `${newValue.city}, ${newValue.country}` : '', // store as string for backend
                                }));
                              }}
                              isOptionEqualToValue={(option, value) =>
                                option.city === value.city && option.country === value.country && option.subcountry === value.subcountry
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Location"
                                  placeholder="Type your city"
                                  disabled={saving}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Website"
                              name="website"
                              value={formData.website}
                              onChange={handleChange}
                              disabled={saving}
                              placeholder="https://yourwebsite.com"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
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
                          </Grid>
                        </Grid>
                      )}

                      {/* Security Tab */}
                      {activeTab === 1 && (
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Change Password
                          </Typography>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Current Password"
                                name="currentPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.currentPassword}
                                onChange={handleChange}
                                disabled={saving}
                                InputProps={{
                                  endAdornment: (
                                    <IconButton
                                      onClick={() => setShowPassword(!showPassword)}
                                      edge="end"
                                    >
                                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
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
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="New Password"
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={handleChange}
                                disabled={saving}
                                error={formData.newPassword !== '' && passwordStrength < 60}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
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
                              
                              {formData.newPassword && (
                                <Box sx={{ mt: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Password Strength
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {getPasswordStrengthText()}
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={passwordStrength}
                                    sx={{
                                      height: 8,
                                      borderRadius: 4,
                                      backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.1)' 
                                        : 'rgba(0, 0, 0, 0.1)',
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 4,
                                        backgroundColor: getPasswordStrengthColor(),
                                      },
                                    }}
                                  />
                                </Box>
                              )}
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Confirm New Password"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={saving}
                                error={formData.confirmPassword !== '' && !passwordChecks.match}
                                InputProps={{
                                  endAdornment: (
                                    <IconButton
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      edge="end"
                                    >
                                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
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
                            </Grid>
                          </Grid>

                          {/* Password Requirements */}
                          {formData.newPassword && (
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Password Requirements
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={12} sm={6}>
                                  <List dense>
                                    <ListItem sx={{ py: 0.5 }}>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        {passwordChecks.minLength ? (
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
                                  </List>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <List dense>
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
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Preferences Tab */}
                      {activeTab === 2 && (
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Notification Settings
                          </Typography>
                          
                          <List>
                            <ListItem>
                              <ListItemText
                                primary="Email Notifications"
                                secondary="Receive updates and reminders via email"
                              />
                              <Switch
                                checked={formData.notifications.email}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  notifications: {
                                    ...prev.notifications,
                                    email: e.target.checked
                                  }
                                }))}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText
                                primary="Push Notifications"
                                secondary="Get instant notifications in your browser"
                              />
                              <Switch
                                checked={formData.notifications.push}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  notifications: {
                                    ...prev.notifications,
                                    push: e.target.checked
                                  }
                                }))}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText
                                primary="Meal Reminders"
                                secondary="Remind me about planned meals"
                              />
                              <Switch
                                checked={formData.notifications.mealReminders}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  notifications: {
                                    ...prev.notifications,
                                    mealReminders: e.target.checked
                                  }
                                }))}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText
                                primary="Shopping Reminders"
                                secondary="Remind me about shopping list items"
                              />
                              <Switch
                                checked={formData.notifications.shoppingReminders}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  notifications: {
                                    ...prev.notifications,
                                    shoppingReminders: e.target.checked
                                  }
                                }))}
                              />
                            </ListItem>
                          </List>

                          <Divider sx={{ my: 3 }} />

                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Display Preferences
                          </Typography>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                select
                                fullWidth
                                label="Theme"
                                value={formData.preferences.theme}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    theme: e.target.value
                                  }
                                }))}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  },
                                }}
                              >
                                <MenuItem value="light">Light</MenuItem>
                                <MenuItem value="dark">Dark</MenuItem>
                                <MenuItem value="auto">Auto (System)</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                select
                                fullWidth
                                label="Units"
                                value={formData.preferences.units}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    units: e.target.value
                                  }
                                }))}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  },
                                }}
                              >
                                <MenuItem value="metric">Metric (g, ml)</MenuItem>
                                <MenuItem value="imperial">Imperial (oz, cups)</MenuItem>
                              </TextField>
                            </Grid>
                          </Grid>
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          onClick={() => navigate(-1)}
                          disabled={saving}
                          startIcon={<CancelIcon2 />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          variant="contained"
                          disabled={saving || (formData.newPassword && passwordStrength < 60)}
                          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            px: 4,
                            py: 1.5,
                            background: theme.palette.mode === 'dark'
                              ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
                              : 'linear-gradient(45deg, #228B22 0%, #1B6B1B 100%)',
                            '&:hover': {
                              background: theme.palette.mode === 'dark'
                                ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
                                : 'linear-gradient(45deg, #1B6B1B 0%, #145214 100%)',
                            },
                            '&.Mui-disabled': {
                              background: theme.palette.mode === 'dark'
                                ? 'rgba(34, 139, 34, 0.5)'
                                : 'rgba(34, 139, 34, 0.5)',
                            },
                          }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Slide>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Profile; 