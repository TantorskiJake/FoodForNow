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
  Paper
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  AddShoppingCart as AddShoppingCartIcon
} from '@mui/icons-material';
import api from '../services/api';

const ShoppingList = () => {
  const navigate = useNavigate();
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
      
      console.log('Fetching shopping list...');
      const response = await api.get('/shopping-list');
      console.log('Shopping list response:', response.data);
      
      if (Array.isArray(response.data)) {
        setShoppingItems(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
        setError(err.response.data.error || 'Failed to fetch shopping list. Please try again.');
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', err.message);
        setError('Failed to fetch shopping list. Please try again.');
      }
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
      fetchShoppingList();
    } catch (err) {
      console.error('Error toggling item:', err);
      setError('Failed to update item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      setError('');
      await api.delete(`/shopping-list/${id}`);
      fetchShoppingList();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleAddToPantry = async (item) => {
    try {
      await api.post('/pantry', {
        ingredient: item.ingredient._id,
        quantity: item.quantity,
        unit: item.unit
      });
      handleDeleteItem(item._id);
    } catch (err) {
      console.error('Error adding to pantry:', err);
      setError('Failed to add item to pantry');
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      ingredient: '',
      quantity: '',
      unit: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shopping-list', formData);
      handleCloseDialog();
      fetchShoppingList();
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item to shopping list');
    }
  };

  // Group items by recipe
  const groupedItems = shoppingItems.reduce((acc, item) => {
    const key = item.recipe ? item.recipe._id : 'manual';
    if (!acc[key]) {
      acc[key] = {
        name: item.recipe ? item.recipe.name : 'Manual Items',
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping List
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Loading...</Typography>
      ) : shoppingItems.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Your shopping list is empty
          </Typography>
          <Typography color="textSecondary">
            Add items manually or update from your meal plan
          </Typography>
        </Paper>
      ) : (
        Object.entries(groupedItems).map(([key, group]) => (
          <Paper key={key} sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              {group.name}
            </Typography>
            <List>
              {group.items.map((item) => (
                <ListItem key={item._id}>
                  <Checkbox
                    checked={item.completed}
                    onChange={() => handleToggleComplete(item._id)}
                  />
                  <ListItemText
                    primary={item.ingredient.name}
                    secondary={`${item.quantity} ${item.unit}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="add to pantry"
                      onClick={() => handleAddToPantry(item)}
                      sx={{ mr: 1 }}
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
              ))}
            </List>
          </Paper>
        ))
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add Item to Shopping List</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              select
              fullWidth
              label="Ingredient"
              name="ingredient"
              value={formData.ingredient}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            >
              {ingredients.map((ingredient) => (
                <MenuItem key={ingredient._id} value={ingredient._id}>
                  {ingredient.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              select
              fullWidth
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              required
            >
              {validUnits.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Add Item
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ShoppingList;