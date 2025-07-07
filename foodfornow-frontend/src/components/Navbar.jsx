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
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const pages = [
  { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Shopping List', path: '/shopping-list', icon: <ShoppingCartIcon /> },
  { name: 'Pantry', path: '/pantry', icon: <KitchenIcon /> },
  { name: 'Recipes', path: '/recipes', icon: <MenuBookIcon /> },
  { name: 'Ingredients', path: '/ingredients', icon: <LocalDiningIcon /> }
];

const Navbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { authenticated, loading, refreshAuth, user } = useAuth();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await api.post('/auth/logout');
    refreshAuth();
    navigate('/login');
  };

  if (loading || !authenticated) {
    return null;
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '';

  return (
    <AppBar position="static">
      <Toolbar>
        <RestaurantIcon sx={{ mr: 2 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/dashboard')}
        >
          FoodForNow
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              Edit Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;