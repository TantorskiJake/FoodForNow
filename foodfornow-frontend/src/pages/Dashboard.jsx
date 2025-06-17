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
  Chip,
  useTheme,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import api from '../services/api';
import MealPlanGrid from '../components/MealPlanGrid';
import { getCategoryColor } from '../utils/categoryColors';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [recipes, setRecipes] = useState([]);
  const [mealPlan, setMealPlan] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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
        setLoading(true);
        await api.get('/auth/me');
        await Promise.all([
          fetchRecipes(),
          fetchMealPlan(),
          fetchIngredients()
        ]);
      } catch (err) {
        console.error('Auth error:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetch();
  }, [navigate]);

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data || []);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to fetch recipes. Please try again.');
    }
  };

  const fetchMealPlan = async () => {
    try {
      const response = await api.get('/mealplan');
      setMealPlan(response.data || []);
    } catch (err) {
      console.error('Error fetching meal plan:', err);
      setError('Failed to fetch meal plan. Please try again.');
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/mealplan/ingredients');
      console.log('Ingredients response:', response.data);
      if (response.data && typeof response.data === 'object') {
        // Convert the object to an array of ingredients
        const ingredientsArray = Object.entries(response.data).map(([key, value]) => ({
          _id: key,
          ...value
        }));
        setIngredients(ingredientsArray);
      } else {
        console.error('Invalid ingredients data format:', response.data);
        setIngredients([]);
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
      setIngredients([]);
    }
  };

  const handleAddAllToShoppingList = async () => {
    try {
      setLoading(true);
      const response = await api.post('/shopping-list/update-from-meal-plan');
      console.log('Added ingredients to shopping list:', response.data);
      setError(null);
      await fetchIngredients();
    } catch (err) {
      console.error('Error adding ingredients to shopping list:', err);
      setError('Failed to add ingredients to shopping list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMealDialog = (day, mealType, existingMeal = null) => {
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
      setLoading(true);
      let response;
      if (mealFormData._id) {
        response = await api.put(`/mealplan/${mealFormData._id}`, {
          recipeId: mealFormData.recipeId
        });
      } else {
        response = await api.post('/mealplan', mealFormData);
      }

      handleCloseMealDialog();
      await Promise.all([
        fetchMealPlan(),
        fetchIngredients()
      ]);
      
      setError('');
    } catch (err) {
      console.error('Error saving meal:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save meal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeal = (day, mealType, existingMeal) => {
    handleOpenMealDialog(day, mealType, existingMeal);
  };

  const handleDeleteMeal = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/mealplan/${id}`);
      await Promise.all([
        fetchMealPlan(),
        fetchIngredients()
      ]);
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Failed to delete meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
              <Typography variant="h6" gutterBottom>
                Meal Plan
              </Typography>
              <MealPlanGrid
                mealPlan={mealPlan}
                onAddMeal={handleOpenMealDialog}
                onEditMeal={handleEditMeal}
                onDeleteMeal={handleDeleteMeal}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Needed Ingredients
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleAddAllToShoppingList}
                  disabled={loading || ingredients.length === 0}
                  size="small"
                >
                  Add All to Shopping List
                </Button>
              </Box>
              {ingredients.length > 0 ? (
                <List>
                  {ingredients.map((item, index) => (
                    <ListItem key={item._id || index}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {item.name || 'Unknown Ingredient'}
                            </Typography>
                            {item.category && (
                              <Chip
                                label={item.category}
                                size="small"
                                sx={{
                                  backgroundColor: getCategoryColor(item.category).main,
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: getCategoryColor(item.category).dark,
                                  },
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {`${item.quantity} ${item.unit}`}
                            </Typography>
                            {item.recipeName && (
                              <Typography variant="caption" color="text.secondary">
                                From: {item.recipeName}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No ingredients needed for this week's recipes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openMealDialog} onClose={handleCloseMealDialog}>
        <DialogTitle>
          {mealFormData._id ? 'Edit Meal' : 'Add Meal'}
        </DialogTitle>
        <form onSubmit={handleAddMeal}>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Day</InputLabel>
              <Select
                value={mealFormData.day}
                onChange={(e) => setMealFormData({ ...mealFormData, day: e.target.value })}
                required
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Meal</InputLabel>
              <Select
                value={mealFormData.meal}
                onChange={(e) => setMealFormData({ ...mealFormData, meal: e.target.value })}
                required
              >
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
                  <MenuItem key={meal} value={meal}>
                    {meal}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMealDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {mealFormData._id ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Dashboard;