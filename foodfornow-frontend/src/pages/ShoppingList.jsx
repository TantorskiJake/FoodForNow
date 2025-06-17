import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  CircularProgress,
  Chip,
  useTheme,
  LinearProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  AddShoppingCart as AddShoppingCartIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import api from '../services/api';
import { getCategoryColor } from '../utils/categoryColors';
import { toast } from 'react-hot-toast';

const ShoppingList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [formData, setFormData] = useState({
    ingredient: '',
    quantity: '',
    unit: ''
  });

  const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'];

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        await api.get('/auth/me');
        fetchShoppingList();
        fetchIngredients();
      } catch {
        navigate('/login');
      }
    };
    checkAuthAndFetch();
  }, [navigate]);

  const fetchShoppingList = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/shopping-list');
      if (Array.isArray(response.data)) {
        setShoppingItems(response.data);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      setError('Failed to fetch shopping list');
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
      setIngredients(response.data);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to load ingredients');
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      await api.patch(`/shopping-list/${item._id}`, { completed: !item.completed });
      fetchShoppingList();
    } catch (err) {
      toast.error('Failed to update item status');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/shopping-list/${id}`);
      fetchShoppingList();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const handleAddToPantry = async (item) => {
    if (!item.completed) {
      toast.error('Please check off the item first to indicate it has been purchased');
      return;
    }

    try {
      await api.post('/pantry', {
        ingredient: item.ingredient._id,
        quantity: item.quantity,
        unit: item.unit
      });
      await handleDeleteItem(item._id);
      toast.success('Added to pantry');
    } catch (err) {
      console.error('Error adding to pantry:', err);
      toast.error('Failed to add to pantry');
    }
  };

  const handleAddAllToPantry = async () => {
    try {
      setLoading(true);
      await api.post('/pantry/add-all-from-shopping-list');
      fetchShoppingList();
      toast.success('Checked items added to pantry!');
    } catch (err) {
      toast.error('Failed to add items to pantry');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFromMealPlan = async () => {
    try {
      await api.post('/shopping-list/update-from-meal-plan');
      fetchShoppingList();
      toast.success('Updated from meal plan');
    } catch (err) {
      console.error('Error updating from meal plan:', err);
      toast.error('Failed to update from meal plan');
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping List
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="success"
            onClick={handleAddAllToPantry}
            startIcon={<AddShoppingCartIcon />}
            sx={{ mr: 2 }}
          >
            Add All to Pantry
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateFromMealPlan}
            startIcon={<AddIcon />}
          >
            Update from Meal Plan
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : shoppingItems.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your shopping list is empty
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Click "Update from Meal Plan" to add ingredients from your meal plan
          </Typography>
        </Paper>
      ) : (
        <List>
          {shoppingItems.map((item) => (
            <React.Fragment key={item._id}>
              <ListItem>
                <Checkbox
                  checked={item.completed}
                  onChange={() => handleToggleComplete(item)}
                  color="primary"
                  sx={{ mr: 1 }}
                />
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="subtitle1" sx={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'text.disabled' : 'text.primary' }}>
                        {item.ingredient?.name || 'Unknown Ingredient'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Typography variant="body2" color="textSecondary">
                          {item.pantryQuantity > 0 ? `${item.pantryQuantity}/${item.quantity + item.pantryQuantity}` : item.quantity} {item.unit}
                        </Typography>
                        {item.pantryQuantity > 0 && (
                          <Box sx={{ width: '30px', ml: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (item.pantryQuantity / (item.quantity + item.pantryQuantity)) * 100)}
                              sx={{
                                height: 3,
                                borderRadius: 1.5,
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 1.5,
                                  backgroundColor: (theme) => {
                                    const percentage = (item.pantryQuantity / (item.quantity + item.pantryQuantity)) * 100;
                                    if (percentage >= 100) return theme.palette.success.main;
                                    if (percentage >= 50) return theme.palette.warning.main;
                                    return theme.palette.error.main;
                                  },
                                },
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="add to pantry"
                    onClick={() => handleAddToPantry(item)}
                    sx={{ mr: 1 }}
                    disabled={!item.completed}
                  >
                    <AddShoppingCartIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteItem(item._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </Container>
  );
};

export default ShoppingList;