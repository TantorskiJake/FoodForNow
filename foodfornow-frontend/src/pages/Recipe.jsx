import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  useTheme
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  AddShoppingCart as AddShoppingCartIcon
} from '@mui/icons-material';
import api from '../services/api';
import { getCategoryColor } from '../utils/categoryColors';

// Update the IngredientItem component
const IngredientItem = ({ ingredient, onDelete }) => {
  const theme = useTheme();
  const categoryColor = getCategoryColor(ingredient.category);
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <ListItem
      sx={{
        mb: 1,
        borderRadius: 1,
        backgroundColor: isDarkMode ? 'background.paper' : 'background.default',
        '&:hover': {
          backgroundColor: isDarkMode ? 'action.hover' : 'action.hover',
        },
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {ingredient.name}
            </Typography>
            <Chip
              label={ingredient.category}
              size="small"
              sx={{
                backgroundColor: categoryColor.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: categoryColor.dark,
                },
              }}
            />
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {ingredient.quantity} {ingredient.unit}
            </Typography>
            {ingredient.notes && (
              <Typography variant="body2" color="text.secondary">
                • {ingredient.notes}
              </Typography>
            )}
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onDelete(ingredient._id)}
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// ... rest of the existing code ... 