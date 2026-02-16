import React from 'react';
import { Box, Typography, Button, Paper, useTheme } from '@mui/material';

/**
 * Reusable empty state component with icon, copy, and CTAs.
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {string} props.title - Main heading
 * @param {string} props.description - Supporting text
 * @param {Object} props.primaryAction - { label, onClick }
 * @param {Object} props.secondaryAction - { label, onClick } (optional)
 * @param {Object} props.tertiaryAction - { label, onClick } (optional)
 */
const EmptyState = ({ icon, title, description, primaryAction, secondaryAction, tertiaryAction }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(0, 0, 0, 0.02)',
        borderRadius: 2,
      }}
    >
      <Box sx={{ mb: 2 }}>{icon}</Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {primaryAction && (
          <Button
            variant="contained"
            color="primary"
            onClick={primaryAction.onClick}
            startIcon={primaryAction.startIcon}
            sx={{
              textTransform: 'none',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
                  : '#228B22',
              '&:hover': {
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
                    : '#1B6B1B',
              },
            }}
          >
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="contained"
            onClick={secondaryAction.onClick}
            startIcon={secondaryAction.startIcon}
            sx={{
              textTransform: 'none',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
                  : '#228B22',
              color: 'white',
              '&:hover': {
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
                    : '#1B6B1B',
              },
            }}
          >
            {secondaryAction.label}
          </Button>
        )}
        {tertiaryAction && (
          <Button
            variant="contained"
            onClick={tertiaryAction.onClick}
            startIcon={tertiaryAction.startIcon}
            sx={{
              textTransform: 'none',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
                  : '#228B22',
              color: 'white',
              '&:hover': {
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
                    : '#1B6B1B',
              },
            }}
          >
            {tertiaryAction.label}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState;
