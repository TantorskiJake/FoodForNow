import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  useTheme,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import KitchenIcon from '@mui/icons-material/Kitchen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

const steps = [
  {
    label: 'Add recipes',
    description: 'Build your recipe collection so you can plan meals and generate shopping lists.',
    details: [
      'Create recipes manually with name, ingredients, and instructions.',
      'Import from a URL: paste a recipe link and we\'ll scrape the ingredients and steps.',
      'Import from an image: take a photo of a handwritten recipe or recipe card and we\'ll extract the text.',
    ],
    path: '/recipes',
    icon: <MenuBookIcon />,
  },
  {
    label: 'Plan your week',
    description: 'Decide what you\'ll cook each day using your weekly meal plan on the Dashboard.',
    details: [
      'Add meals to any day by choosing a recipe (or mark "Eating out" with optional restaurant details).',
      'Use "Auto-populate week" to randomly fill empty slots from your recipes.',
      'Mark meals as cooked when you\'ve made them, and reset or copy the week as needed.',
    ],
    path: '/dashboard',
    icon: <CalendarTodayIcon />,
  },
  {
    label: 'Get your shopping list',
    description: 'Turn your meal plan into a shopping list so you know exactly what to buy.',
    details: [
      'On the Dashboard, open "Needed ingredients" and use "Add all to Shopping list" to add missing items at once.',
      'On the Shopping list page, add items manually or use the barcode scanner to add products by scanning.',
      'On desktop, use the scanner or open /scan on your phone and scan the QR code to add items from your phone.',
    ],
    path: '/shopping-list',
    icon: <ShoppingCartIcon />,
  },
  {
    label: 'Track your pantry',
    description: 'Keep track of what you have at home so you can plan meals and avoid waste.',
    details: [
      'Add pantry items with name, quantity, and optional expiration date.',
      'Use the barcode scanner to add packaged goods (we look up product names when possible).',
      'Check off or remove items as you use them so your "needed ingredients" stay accurate.',
    ],
    path: '/pantry',
    icon: <KitchenIcon />,
  },
];

const extraSections = [
  {
    title: 'Ingredients',
    description: 'Your personal ingredient library. When you add or import recipes, ingredients are saved here so you can reuse them and keep names consistent.',
    path: '/ingredients',
    icon: <LocalDiningIcon />,
  },
  {
    title: 'Achievements',
    description: 'Earn badges for cooking meals, adding recipes, and using the app. Check your progress and celebrate milestones.',
    path: '/achievements',
    icon: <EmojiEventsIcon />,
  },
  {
    title: 'Scan (mobile)',
    description: 'Open this page on your phone to scan barcodes when you\'re at the store. The scan result is sent to your session so you can add items to your shopping list or pantry from your computer.',
    path: '/scan',
    icon: <PhoneIphoneIcon />,
  },
  {
    title: 'Profile',
    description: 'Update your name, email, and profile picture. Manage your account settings.',
    path: '/profile',
    icon: <PersonIcon />,
  },
];

const HowToUse = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const primaryButtonSx = {
    textTransform: 'none',
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
      : '#228B22',
    '&:hover': {
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
        : '#1B6B1B',
    },
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, pb: 6 }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 700,
          mb: 1,
          color: theme.palette.text.primary,
        }}
      >
        How to use FoodForNow
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        A quick walkthrough of the app so you can plan meals, shop smarter, and reduce food waste.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
        {steps.map((step, index) => (
          <Card
            key={step.label}
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Step {index + 1}. {step.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {step.description}
                  </Typography>
                  <List dense disablePadding sx={{ mb: 2 }}>
                    {step.details.map((detail, i) => (
                      <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={detail} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(step.path)}
                    endIcon={<ArrowForwardIcon />}
                    sx={primaryButtonSx}
                  >
                    Go to {step.label}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        More to explore
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {extraSections.map((section) => (
          <Card
            key={section.title}
            variant="outlined"
            sx={{
              borderRadius: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1,
                  bgcolor: theme.palette.action.selected,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {section.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate(section.path)}
                endIcon={<ArrowForwardIcon />}
                sx={{ textTransform: 'none', flexShrink: 0 }}
              >
                Open
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default HowToUse;
