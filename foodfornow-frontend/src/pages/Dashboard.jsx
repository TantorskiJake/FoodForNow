import { useState, useEffect } from 'react';
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
  useTheme,
  CircularProgress,
  LinearProgress,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import MealPlanGrid from '../components/MealPlanGrid';
import { getCategoryColor } from '../utils/categoryColors';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
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

  const { authenticated } = useAuth();

  useEffect(() => {
    if (!authenticated) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchRecipes(),
          fetchMealPlan(),
          fetchIngredients()
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [authenticated]);

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

  const handleMealPlanUpdate = async (updatedMeal) => {
    try {
      // Update the local meal plan state with the updated meal
      setMealPlan(prevMealPlan => 
        prevMealPlan.map(meal => 
          meal._id === updatedMeal._id ? updatedMeal : meal
        )
      );
      
      // If the meal was cooked (status changed to cooked), refresh ingredients
      if (updatedMeal.cooked) {
        console.log('Meal was cooked, refreshing ingredients...');
        await fetchIngredients();
      }
    } catch (err) {
      console.error('Error updating meal plan:', err);
      setError('Failed to update meal plan. Please try again.');
    }
  };

  const handleAddToPantry = () => {
    // Implementation of adding to pantry
  };

  const handleDeletePantryItem = (id) => {
    // Implementation of deleting pantry item
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
                onMealPlanUpdate={handleMealPlanUpdate}
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
                <Grid container spacing={2}>
                  {ingredients.map((ingredient) => (
                    <Grid item xs={12} sm={6} md={4} key={ingredient._id}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 'medium',
                              mb: 1
                            }}
                          >
                            {ingredient.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="textSecondary">
                              {ingredient.pantryQuantity > 0 ? `${ingredient.pantryQuantity}/${ingredient.quantity}` : ingredient.quantity} {ingredient.unit}
                            </Typography>
                            <Box sx={{ width: '100px', ml: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, ((ingredient.pantryQuantity || 0) / ingredient.quantity) * 100)}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    backgroundColor: (theme) => {
                                      const percentage = ((ingredient.pantryQuantity || 0) / ingredient.quantity) * 100;
                                      if (percentage >= 100) return theme.palette.success.main;
                                      if (percentage >= 50) return theme.palette.warning.main;
                                      return theme.palette.error.main;
                                    },
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No ingredients needed from your meal plan
                  </Typography>
                </Paper>
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