import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [foodItems, setFoodItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    expiryDate: '',
  });
  const [error, setError] = useState('');
  const [mealPlan, setMealPlan] = useState([]);
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [openMealDialog, setOpenMealDialog] = useState(false);
  const [mealFormData, setMealFormData] = useState({
    day: '',
    meal: '',
    recipe: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    fetchFoodItems();
    fetchMealPlan();
    fetchPopularRecipes();
  }, [navigate]);

  const fetchFoodItems = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching food items with token:', token);
      const response = await axios.get('http://localhost:3000/pantry', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Food items fetched:', response.data);
      setFoodItems(response.data);
    } catch (err) {
      console.error('Error fetching food items:', err);
      if (err.response?.status === 401) {
        console.log('Unauthorized, redirecting to login');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to fetch food items. Please try again.');
      }
    }
  };

  const fetchMealPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/mealplan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMealPlan(response.data);
    } catch (err) {
      console.error('Error fetching meal plan:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to fetch meal plan. Please try again.');
      }
    }
  };

  const fetchPopularRecipes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/recipes/popular', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPopularRecipes(response.data);
    } catch (err) {
      console.error('Error fetching popular recipes:', err);
      setError('Failed to fetch popular recipes. Please try again.');
    }
  };

  const handleLogout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Adding new food item:', newItem);
      await axios.post(
        'http://localhost:3000/pantry',
        newItem,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewItem({ name: '', quantity: '', expiryDate: '' });
      fetchFoodItems();
    } catch (err) {
      console.error('Error adding food item:', err);
      setError('Failed to add food item. Please try again.');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Deleting food item:', id);
      await axios.delete(`http://localhost:3000/pantry/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFoodItems();
    } catch (err) {
      console.error('Error deleting food item:', err);
      setError('Failed to delete food item. Please try again.');
    }
  };

  const handleOpenMealDialog = () => {
    setOpenMealDialog(true);
  };

  const handleCloseMealDialog = () => {
    setOpenMealDialog(false);
    setMealFormData({ day: '', meal: '', recipe: '' });
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/mealplan',
        mealFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleCloseMealDialog();
      fetchMealPlan();
    } catch (err) {
      console.error('Error adding meal:', err);
      setError('Failed to add meal. Please try again.');
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/mealplan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMealPlan();
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Failed to delete meal. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1">
                Food Inventory
              </Typography>
              <Button variant="outlined" color="secondary" onClick={handleLogout}>
                Logout
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

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Item
                </Typography>
                <form onSubmit={handleAddItem}>
                  <TextField
                    fullWidth
                    label="Food Name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                    margin="normal"
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Add Item
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Inventory
                </Typography>
                <List>
                  {foodItems.map((item) => (
                    <ListItem key={item._id}>
                      <ListItemText
                        primary={item.name}
                        secondary={`Quantity: ${item.quantity} | Expires: ${new Date(
                          item.expiryDate
                        ).toLocaleDateString()}`}
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
              </CardContent>
            </Card>
          </Grid>

          {/* Meal Planning Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Meal Plan</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenMealDialog}
                  >
                    Add Meal
                  </Button>
                </Box>
                <List>
                  {mealPlan.map((meal) => (
                    <ListItem key={meal._id}>
                      <ListItemText
                        primary={meal.recipe}
                        secondary={`${meal.day} - ${meal.meal}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteMeal(meal._id)}
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

          {/* Popular Recipes Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Popular Recipes
                </Typography>
                <List>
                  {popularRecipes.map((recipe) => (
                    <ListItem key={recipe._id}>
                      <ListItemText
                        primary={recipe.name}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {recipe.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/recipes/${recipe._id}`)}
                      >
                        View Recipe
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Add Meal Dialog */}
      <Dialog open={openMealDialog} onClose={handleCloseMealDialog}>
        <DialogTitle>Add Meal to Plan</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddMeal} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Day"
              value={mealFormData.day}
              onChange={(e) => setMealFormData({ ...mealFormData, day: e.target.value })}
              margin="normal"
              required
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Select a day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </TextField>
            <TextField
              fullWidth
              select
              label="Meal"
              value={mealFormData.meal}
              onChange={(e) => setMealFormData({ ...mealFormData, meal: e.target.value })}
              margin="normal"
              required
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Select a meal</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </TextField>
            <TextField
              fullWidth
              label="Recipe"
              value={mealFormData.recipe}
              onChange={(e) => setMealFormData({ ...mealFormData, recipe: e.target.value })}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMealDialog}>Cancel</Button>
          <Button onClick={handleAddMeal} variant="contained" color="primary">
            Add Meal
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 