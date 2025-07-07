import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Slide } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCustomTheme } from '../context/ThemeContext';

/**
 * AchievementNotification Component
 * 
 * Displays a notification when a user unlocks a new achievement.
 * Shows the achievement name, description, and icon with a smooth animation.
 */
const AchievementNotification = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useCustomTheme();

  useEffect(() => {
    // Show notification after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for slide animation
  };

  // Auto-hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(handleClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!achievement) return null;

  return (
    <Slide direction="left" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          minWidth: 320,
          maxWidth: 400,
          p: 2,
          background: theme === 'dark' ? '#2d3748' : '#ffffff',
          border: `2px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'}`,
          borderRadius: 2,
          boxShadow: theme === 'dark' 
            ? '0 10px 25px rgba(0, 0, 0, 0.5)' 
            : '0 10px 25px rgba(0, 0, 0, 0.15)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Achievement Icon */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: 'white',
              flexShrink: 0
            }}
          >
            {achievement.icon}
          </Box>

          {/* Achievement Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme === 'dark' ? '#f7fafc' : '#1a202c',
                mb: 0.5,
                fontSize: '1rem'
              }}
            >
              🎉 Achievement Unlocked!
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 500,
                color: theme === 'dark' ? '#e2e8f0' : '#2d3748',
                mb: 1,
                fontSize: '0.95rem'
              }}
            >
              {achievement.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme === 'dark' ? '#a0aec0' : '#4a5568',
                fontSize: '0.875rem',
                lineHeight: 1.4
              }}
            >
              {achievement.description}
            </Typography>
          </Box>

          {/* Close Button */}
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: theme === 'dark' ? '#a0aec0' : '#718096',
              '&:hover': {
                color: theme === 'dark' ? '#e2e8f0' : '#2d3748',
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Slide>
  );
};

export default AchievementNotification; 