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
  ListItemText
} from '@mui/material';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const Profile = () => {
  const navigate = useNavigate();
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setFormData(prev => ({
        ...prev,
        name: response.data.user.name,
        email: response.data.user.email
      }));
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Profile Information
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography>
            <strong>Name:</strong> {formData.name}
          </Typography>
          <Typography>
            <strong>Email:</strong> {formData.email}
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
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
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
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
          />
          <TextField
            fullWidth
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            margin="normal"
            error={formData.newPassword !== '' && !Object.values(passwordChecks).every(Boolean)}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            error={formData.confirmPassword !== '' && !passwordChecks.match}
          />

          {(formData.newPassword || formData.confirmPassword) && (
            <List dense sx={{ mt: 1, mb: 2 }}>
              <ListItem>
                <ListItemIcon>
                  {passwordChecks.length ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="At least 8 characters" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {passwordChecks.lowercase ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="At least one lowercase letter" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {passwordChecks.uppercase ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="At least one uppercase letter" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {passwordChecks.number ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="At least one number" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {passwordChecks.special ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="At least one special character" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {passwordChecks.match ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="Passwords match" />
              </ListItem>
            </List>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || (formData.newPassword && !Object.values(passwordChecks).every(Boolean))}
            >
              Save Changes
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile; 