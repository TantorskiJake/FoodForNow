import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DashboardIcon from '@mui/icons-material/Dashboard';
import KitchenIcon from '@mui/icons-material/Kitchen';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FFNLogo from '../assets/FFNLogoTrans.png';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';

// Order matches user flow: plan (Dashboard) → recipes → shopping list → pantry → ingredients (reference)
const pages = [
  { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Recipes', path: '/recipes', icon: <MenuBookIcon /> },
  { name: 'Shopping List', path: '/shopping-list', icon: <ShoppingCartIcon /> },
  { name: 'Pantry', path: '/pantry', icon: <KitchenIcon /> },
  { name: 'Ingredients', path: '/ingredients', icon: <LocalDiningIcon /> },
];

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { authenticated, loading, logout, user } = useAuth();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await api.post('/auth/logout');
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <AppBar position="sticky" sx={{ top: 0 }}>
        <Toolbar>
          <RestaurantIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FoodForNow
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }

  if (!authenticated) {
    return null;
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '';

  return (
    <AppBar position="sticky" sx={{ top: 0 }}>
      <Toolbar>
        <img 
          src={FFNLogo} 
          alt="Food For Now Logo" 
          style={{ 
            maxHeight: isMobile ? 40 : 72, // Smaller logo on mobile
            width: 'auto',
            marginRight: isMobile ? 8 : 24, // Less spacing on mobile
            display: 'block',
            objectFit: 'contain',
            verticalAlign: 'middle'
          }} 
        />
        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setDrawerOpen(true)}
              sx={{ marginLeft: 'auto' }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <Box
                sx={{ width: 250 }}
                role="presentation"
                onClick={() => setDrawerOpen(false)}
                onKeyDown={() => setDrawerOpen(false)}
              >
                <List>
                  {pages.map((page) => (
                    <ListItem button key={page.name} onClick={() => navigate(page.path)} selected={location.pathname === page.path}>
                      <ListItemIcon>{page.icon}</ListItemIcon>
                      <ListItemText primary={page.name} />
                    </ListItem>
                  ))}
                  <ListItem button onClick={() => navigate('/achievements')} selected={location.pathname === '/achievements'}>
                    <ListItemIcon><EmojiEventsIcon /></ListItemIcon>
                    <ListItemText primary="Achievements" />
                  </ListItem>
                  <ListItem button onClick={handleLogout}>
                    <ListItemIcon><AccountCircle /></ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItem>
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 'auto' }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                color="inherit"
                onClick={() => navigate(page.path)}
                startIcon={page.icon}
                sx={{
                  mx: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  backgroundColor: location.pathname === page.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                }}
              >
                {page.name}
              </Button>
            ))}

            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{
                width: 40,
                height: 40,
                '& .MuiAvatar-root': {
                  width: 40,
                  height: 40,
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
                    : '#228B22',
                },
              }}
            >
              {user?.profilePicture ? (
                <Avatar src={user.profilePicture} alt={user.name} />
              ) : userInitial ? (
                <Avatar>{userInitial}</Avatar>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                <ListItemIcon sx={{ minWidth: 36 }}><EditIcon fontSize="small" /></ListItemIcon>
                Edit Profile
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/achievements'); }}>
                <ListItemIcon sx={{ minWidth: 36 }}><EmojiEventsIcon fontSize="small" /></ListItemIcon>
                Achievements
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;