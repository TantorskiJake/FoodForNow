import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import KitchenIcon from '@mui/icons-material/Kitchen';

const steps = [
  { label: 'Add recipes', description: 'Create recipes manually or import from a URL or handwritten recipe card.', path: '/recipes', icon: <MenuBookIcon /> },
  { label: 'Plan your week', description: 'Add meals to your weekly plan on the Dashboard.', path: '/dashboard', icon: <CalendarTodayIcon /> },
  { label: 'Get your shopping list', description: "Use 'Add All to Shopping List' to add missing ingredients.", path: '/dashboard', icon: <ShoppingCartIcon /> },
  { label: 'Track your pantry', description: 'Keep track of what you have at home.', path: '/pantry', icon: <KitchenIcon /> },
];

const getOnboardingKey = (userId) => `foodfornow_onboarding_${userId || 'anon'}`;

export const hasCompletedOnboarding = (userId) => {
  try {
    return localStorage.getItem(getOnboardingKey(userId)) === 'true';
  } catch {
    return false;
  }
};

export const setOnboardingCompleted = (userId) => {
  try {
    localStorage.setItem(getOnboardingKey(userId), 'true');
  } catch (e) {
    console.warn('Could not save onboarding state:', e);
  }
};

const OnboardingOverlay = ({ open, onClose, userId }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  const handleSkip = () => {
    setOnboardingCompleted(userId);
    onClose();
  };

  const handleGotIt = () => {
    setOnboardingCompleted(userId);
    onClose();
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((s) => s + 1);
    } else {
      handleGotIt();
    }
  };

  const step = steps[activeStep];

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        Welcome to FoodForNow
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Here's how to get started:
        </Typography>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
          {steps.map((s, i) => (
            <Step key={s.label} completed={i < activeStep}>
              <StepLabel
                optional={i === activeStep ? <Typography variant="caption" color="text.secondary">{s.description}</Typography> : null}
              >
                {s.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          {step.icon}
          <Typography variant="body2" color="text.secondary">
            {step.description}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleSkip} sx={{ textTransform: 'none' }}>
          Skip
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={handleNext}
          sx={{
            textTransform: 'none',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
              : '#228B22',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
                : '#1B6B1B',
            },
          }}
        >
          {activeStep < steps.length - 1 ? 'Next' : 'Got it'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingOverlay;
