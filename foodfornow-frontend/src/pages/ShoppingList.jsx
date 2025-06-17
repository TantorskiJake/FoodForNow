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
  useTheme
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

  const handleToggleComplete = async (id) => {
    try {
      await api.put(`/shopping-list/${id}/toggle`);
      const response = await api.get('/shopping-list');
      setShoppingItems(response.data);
    } catch (err) {
      console.error('Error toggling item:', err);
      setError('Failed to update item');
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
    const completedItems = shoppingItems.filter(item => item.completed);
    
    if (completedItems.length === 0) {
      toast.error('No checked items to add to pantry');
      return;
    }

    try {
      setLoading(true);
      await api.post('/pantry/add-all-from-shopping-list');
      await fetchShoppingList();
      toast.success('Added checked items to pantry');
    } catch (err) {
      console.error('Error adding all to pantry:', err);
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

      <Grid container spacing={3}>
        {shoppingItems.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Your shopping list is empty
              </Typography>
            </Paper>
          </Grid>
        ) : (
          shoppingItems.map((item) => (
            <Grid item xs={12} key={item._id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <Checkbox
                        checked={item.completed}
                        onChange={() => handleToggleComplete(item._id)}
                      />
                      <Box ml={2}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {item.ingredient?.name || 'Unknown Ingredient'}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="textSecondary"
                          sx={{ 
                            textDecoration: item.completed ? 'line-through' : 'none'
                          }}
                        >
                          {item.quantity} {item.unit}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton
                        color="primary"
                        onClick={() => handleAddToPantry(item)}
                        title="Add to Pantry"
                        disabled={item.completed}
                      >
                        <AddShoppingCartIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteItem(item._id)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default ShoppingList;