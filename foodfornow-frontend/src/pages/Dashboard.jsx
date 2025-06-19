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
import CasinoIcon from '@mui/icons-material/Casino';
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
  const [resetWeekDialog, setResetWeekDialog] = useState(false);

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

  const handleResetWeek = async () => {
    try {
      setLoading(true);
      const response = await api.delete('/mealplan/reset-week');
      console.log('Reset week:', response.data);
      
      // Clear the meal plan state
      setMealPlan([]);
      
      // Refresh ingredients since clearing meals affects needed ingredients
      await fetchIngredients();
      
      setError('');
    } catch (err) {
      console.error('Error resetting week:', err);
      setError('Failed to reset week. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetWeekDialog = () => {
    setResetWeekDialog(true);
  };

  const handleCloseResetWeekDialog = () => {
    setResetWeekDialog(false);
  };

  const handleConfirmResetWeek = async () => {
    setResetWeekDialog(false);
    await handleResetWeek();
  };

  const handlePopulateWeek = async () => {
    try {
      setLoading(true);
      const response = await api.post('/mealplan/populate-week');
      console.log('Populated week:', response.data);
      
      // Refresh meal plan and ingredients
      await Promise.all([
        fetchMealPlan(),
        fetchIngredients()
      ]);
      
      setError('');
    } catch (err) {
      console.error('Error populating week:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to populate week. Please try again.');
      }
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

  const handleRecipeSelect = async (recipeId) => {
    if (!recipeId) return;
    
    try {
      setLoading(true);
      const updatedFormData = { ...mealFormData, recipeId };
      
      let response;
      if (mealFormData._id) {
        // Editing existing meal
        response = await api.put(`/mealplan/${mealFormData._id}`, {
          recipeId: recipeId
        });
      } else {
        // Adding new meal
        response = await api.post('/mealplan', updatedFormData);
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
    <Container 
      maxWidth={false}
      sx={{ 
        py: 4,
        px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
        maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: '1400px', xl: '1600px' }
      }}
    >
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" gutterBottom>
                  Meal Plan
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CasinoIcon />}
                    onClick={handlePopulateWeek}
                    disabled={loading || recipes.length === 0}
                    size="small"
                  >
                    Populate Week
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleOpenResetWeekDialog}
                    disabled={loading || mealPlan.length === 0}
                    size="small"
                  >
                    Reset Week
                  </Button>
                </Box>
              </Box>
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
          {mealFormData._id ? 'Edit Meal' : `Add Meal - ${mealFormData.day} ${mealFormData.meal}`}
        </DialogTitle>
        <DialogContent>
          {mealFormData._id ? (
            // Editing existing meal - show all fields
            <>
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
            </>
          ) : (
            // Adding new meal - show day and meal as read-only
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Day: <strong>{mealFormData.day}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Meal: <strong>{mealFormData.meal}</strong>
              </Typography>
            </Box>
          )}

          <FormControl fullWidth>
            <InputLabel>Recipe</InputLabel>
            <Select
              value={mealFormData.recipeId}
              onChange={(e) => handleRecipeSelect(e.target.value)}
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
          {mealFormData._id && (
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              Update
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reset Week Confirmation Dialog */}
      <Dialog open={resetWeekDialog} onClose={handleCloseResetWeekDialog}>
        <DialogTitle>Reset Week</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to reset your meal plan for this week?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete all your meal plans and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetWeekDialog}>Cancel</Button>
          <Button onClick={handleConfirmResetWeek} variant="contained" color="error">
            Reset Week
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;