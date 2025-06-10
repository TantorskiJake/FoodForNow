import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
  Checkbox,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const ShoppingList = () => {
  const navigate = useNavigate();
  const [shoppingList, setShoppingList] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchShoppingList();
  }, [navigate]);

  const fetchShoppingList = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/shopping-list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShoppingList(response.data);
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to fetch shopping list. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3000/shopping-list/${id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchShoppingList();
    } catch (err) {
      console.error('Error toggling item:', err);
      setError('Failed to update item. Please try again.');
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/shopping-list/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchShoppingList();
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item. Please try again.');
    }
  };

  const handleClearCompleted = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:3000/shopping-list/clear-completed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchShoppingList();
    } catch (err) {
      console.error('Error clearing completed items:', err);
      setError('Failed to clear completed items. Please try again.');
    }
  };

  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const category = item.ingredient.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  };

  const groupedItems = groupByCategory(shoppingList);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1">
                Shopping List
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleClearCompleted}
                disabled={!shoppingList.some(item => item.completed)}
              >
                Clear Completed
              </Button>
            </Box>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </Grid>
          )}

          {loading ? (
            <Grid item xs={12}>
              <Typography>Loading shopping list...</Typography>
            </Grid>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <Grid item xs={12} key={category}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {category}
                    </Typography>
                    <List>
                      {items.map((item) => (
                        <ListItem
                          key={item._id}
                          sx={{
                            textDecoration: item.completed ? 'line-through' : 'none',
                            opacity: item.completed ? 0.7 : 1,
                          }}
                        >
                          <Checkbox
                            checked={item.completed}
                            onChange={() => handleToggleItem(item._id)}
                          />
                          <ListItemText
                            primary={item.ingredient.name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {item.notes}
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  <Chip
                                    label={`${item.quantity} ${item.unit}`}
                                    size="small"
                                    sx={{ mr: 0.5 }}
                                  />
                                  {item.recipe && (
                                    <Chip
                                      label={`For: ${item.recipe.name}`}
                                      size="small"
                                      color="secondary"
                                    />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleRemoveItem(item._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default ShoppingList; 