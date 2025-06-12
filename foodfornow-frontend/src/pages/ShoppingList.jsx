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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import api from '../services/api';

const ShoppingList = () => {
  const navigate = useNavigate();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShoppingList();
  }, []);

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

  const handleAddToPantry = async () => {
    try {
      setError('');
      await api.post('/shopping-list/add-to-pantry');
      fetchShoppingList();
    } catch (err) {
      console.error('Error adding items to pantry:', err);
      setError('Failed to add items to pantry. Please try again.');
    }
  };

  // Group items by recipe
  const groupedItems = shoppingItems.reduce((acc, item) => {
    const recipeName = item.recipe ? item.recipe.name : 'Other';
    if (!acc[recipeName]) {
      acc[recipeName] = [];
    }
    acc[recipeName].push(item);
    return acc;
  }, {});

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Shopping List
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddShoppingCartIcon />}
          onClick={handleAddToPantry}
          disabled={shoppingItems.length === 0}
        >
          Add All to Pantry
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Typography variant="body1" color="text.secondary" align="center">
              Loading shopping list...
            </Typography>
          ) : shoppingItems.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center">
              Your shopping list is empty. Add meals to your meal plan to see ingredients here!
            </Typography>
          ) : (
            Object.entries(groupedItems).map(([recipeName, items]) => (
              <Box key={recipeName}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  {recipeName}
                </Typography>
                <List>
                  {items.map((item) => (
                    <ListItem key={item._id}>
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.quantity} ${item.unit}`}
                      />
                      <ListItemSecondaryAction>
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
                <Divider />
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ShoppingList; 