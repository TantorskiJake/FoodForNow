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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import MealPlanGrid from '../components/MealPlanGrid';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [mealPlan, setMealPlan] = useState([]);
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [error, setError] = useState('');
  const [openMealDialog, setOpenMealDialog] = useState(false);
  const [mealFormData, setMealFormData] = useState({
    _id: '',
    weekStart: '',
    day: '',
    meal: '',
    recipeId: '',
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        await api.get('/auth/me');
        fetchRecipes();
        fetchMealPlan();
        fetchPopularRecipes();
      } catch {
        navigate('/login');
      }
    };
    checkAuthAndFetch();
  }, [navigate]);

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to fetch recipes. Please try again.');
    }
  };

  const fetchMealPlan = async () => {
    try {
      const response = await api.get('/mealplan');
      setMealPlan(response.data);
    } catch (err) {
      console.error('Error fetching meal plan:', err);
      setError('Failed to fetch meal plan. Please try again.');
    }
  };

  const fetchPopularRecipes = async () => {
    try {
      const response = await api.get('/recipes/popular');
      setPopularRecipes(response.data);
    } catch (err) {
      console.error('Error fetching popular recipes:', err);
      setError('Failed to fetch popular recipes. Please try again.');
    }
  };

  const handleOpenMealDialog = (day, mealType, existingMeal = null) => {
    // Set default week start to the current week's Monday
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    setMealFormData({
      _id: existingMeal?._id || '',
      weekStart: existingMeal?.weekStart || monday.toISOString().split('T')[0],
      day: day || existingMeal?.day || '',
      meal: mealType || existingMeal?.meal || '',
      recipeId: existingMeal?.recipe?._id || '',
    });
    setOpenMealDialog(true);
  };

  const handleCloseMealDialog = () => {
    setOpenMealDialog(false);
    setMealFormData({
      _id: '',
      weekStart: '',
      day: '',
      meal: '',
      recipeId: '',
    });
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    try {
      if (mealFormData._id) {
        // Update existing meal
        await api.put(`/mealplan/${mealFormData._id}`, {
          recipeId: mealFormData.recipeId
        });
      } else {
        // Add new meal
        await api.post('/mealplan', mealFormData);
      }
      handleCloseMealDialog();
      fetchMealPlan();
    } catch (err) {
      console.error('Error saving meal:', err);
      if (err.response?.data?.error === 'A meal already exists for this day and time') {
        setError('You already have a meal planned for this day and time. Please choose a different day or meal type.');
      } else if (err.response?.data?.error === 'Week start, day, meal, and recipe are required') {
        setError('Please fill in all required fields.');
      } else if (err.response?.data?.error === 'Recipe not found') {
        setError('The selected recipe could not be found. Please try again.');
      } else {
        setError('Failed to save meal. Please try again.');
      }
    }
  };

  const handleEditMeal = (day, mealType, existingMeal) => {
    handleOpenMealDialog(day, mealType, existingMeal);
  };

  const handleDeleteMeal = async (id) => {
    try {
      await api.delete(`/mealplan/${id}`);
      fetchMealPlan();
    } catch (err) {
      console.error('Error deleting meal:', err);
      if (err.response?.data?.error === 'Meal plan item not found') {
        setError('The meal could not be found. It may have already been deleted.');
      } else {
        setError('Failed to delete meal. Please try again.');
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1">
                Dashboard
              </Typography>
            </Box>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5">Meal Plan</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenMealDialog('', '')}
                  >
                    Add Meal
                  </Button>
                </Box>
                <MealPlanGrid
                  mealPlan={mealPlan}
                  onAddMeal={handleOpenMealDialog}
                  onDeleteMeal={handleDeleteMeal}
                  onEditMeal={handleEditMeal}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Popular Recipes
                </Typography>
                <List>
                  {popularRecipes.map((recipe) => (
                    <ListItem key={recipe._id}>
                      <ListItemText
                        primary={recipe.name}
                        secondary={`${recipe.ingredients.length} ingredients`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={openMealDialog} onClose={handleCloseMealDialog}>
        <DialogTitle>
          {mealFormData._id 
            ? `Edit ${mealFormData.meal} for ${mealFormData.day}`
            : mealFormData.day && mealFormData.meal 
              ? `Add ${mealFormData.meal} for ${mealFormData.day}`
              : 'Add Meal to Plan'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddMeal} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Day</InputLabel>
                  <Select
                    value={mealFormData.day}
                    onChange={(e) => setMealFormData({ ...mealFormData, day: e.target.value })}
                    required
                  >
                    <MenuItem value="Monday">Monday</MenuItem>
                    <MenuItem value="Tuesday">Tuesday</MenuItem>
                    <MenuItem value="Wednesday">Wednesday</MenuItem>
                    <MenuItem value="Thursday">Thursday</MenuItem>
                    <MenuItem value="Friday">Friday</MenuItem>
                    <MenuItem value="Saturday">Saturday</MenuItem>
                    <MenuItem value="Sunday">Sunday</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Meal Type</InputLabel>
                  <Select
                    value={mealFormData.meal}
                    onChange={(e) => setMealFormData({ ...mealFormData, meal: e.target.value })}
                    required
                  >
                    <MenuItem value="Breakfast">Breakfast</MenuItem>
                    <MenuItem value="Lunch">Lunch</MenuItem>
                    <MenuItem value="Dinner">Dinner</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Recipe</InputLabel>
                  <Select
                    value={mealFormData.recipeId}
                    onChange={(e) => setMealFormData({ ...mealFormData, recipeId: e.target.value })}
                    required
                  >
                    {recipes.map((recipe) => (
                      <MenuItem key={recipe._id} value={recipe._id}>
                        {recipe.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMealDialog}>Cancel</Button>
          <Button 
            onClick={handleAddMeal} 
            variant="contained" 
            color="primary"
            disabled={!mealFormData.day || !mealFormData.meal || !mealFormData.recipeId}
          >
            {mealFormData._id ? 'Update Meal' : 'Add Meal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;