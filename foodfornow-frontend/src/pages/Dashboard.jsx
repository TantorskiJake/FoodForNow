import { useState, useEffect, useRef } from 'react';
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
  TextField,
  Autocomplete,
  Tooltip,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import KitchenIcon from '@mui/icons-material/Kitchen';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CasinoIcon from '@mui/icons-material/Casino';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import MealPlanGrid from '../components/MealPlanGrid';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
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
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [ingredientsExpanded, setIngredientsExpanded] = useState(true);
  const [selectedWeekStart, setSelectedWeekStart] = useState('');
  const [mealActionLoading, setMealActionLoading] = useState(false);

  const { authenticated, user } = useAuth();
  const { showAchievements } = useAchievements();
  const cancelledOptimisticIds = useRef(new Set());

  // Initialize selected week to current week's Monday
  useEffect(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    setSelectedWeekStart(monday.toISOString().split('T')[0]);
  }, []);

  // Start ingredients section collapsed when empty or when many items (only on first load)
  const ingredientsInitialized = useRef(false);
  useEffect(() => {
    if (!ingredientsInitialized.current && !loading) {
      ingredientsInitialized.current = true;
      if (ingredients.length === 0 || ingredients.length > 8) {
        setIngredientsExpanded(false);
      }
    }
  }, [loading, ingredients.length]);

  useEffect(() => {
    if (!authenticated || !selectedWeekStart) return;

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
  }, [authenticated, selectedWeekStart]);

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
      const response = await api.get(`/mealplan?weekStart=${selectedWeekStart}`);
      setMealPlan(response.data || []);
    } catch (err) {
      console.error('Error fetching meal plan:', err);
      setError('Failed to fetch meal plan. Please try again.');
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await api.get(`/mealplan/ingredients?weekStart=${selectedWeekStart}`);
      let ingredientsArray = [];

      if (Array.isArray(response.data)) {
        ingredientsArray = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Fallback for any legacy object-shaped responses
        ingredientsArray = Object.entries(response.data).map(([key, value]) => ({
          _id: key,
          ...value
        }));
      } else {
        console.error('Invalid ingredients data format:', response.data);
      }

      const aggregatedIngredients = aggregateIngredientsByName(ingredientsArray);
      setIngredients(aggregatedIngredients);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
      setIngredients([]);
    }
  };

  // Helper function to aggregate ingredients by name
  const aggregateIngredientsByName = (ingredients) => {
    const ingredientMap = new Map();
    
    ingredients.forEach(ingredient => {
      if (!ingredient || !ingredient.name) {
        return;
      }
      const name = ingredient.name;
      
      if (ingredientMap.has(name)) {
        // Combine with existing ingredient
        const existing = ingredientMap.get(name);
        
        // Try to combine quantities if units are the same
        if (existing.unit === ingredient.unit) {
          existing.quantity += ingredient.quantity;
          existing.pantryQuantity = (existing.pantryQuantity || 0) + (ingredient.pantryQuantity || 0);
        } else {
          // Different units - convert to standard unit and combine
          const convertedQuantity = convertToStandardUnit(ingredient.quantity, ingredient.unit, name);
          const convertedPantryQuantity = convertToStandardUnit(ingredient.pantryQuantity || 0, ingredient.unit, name);
          
          const existingConvertedQuantity = convertToStandardUnit(existing.quantity, existing.unit, name);
          const existingConvertedPantryQuantity = convertToStandardUnit(existing.pantryQuantity || 0, existing.unit, name);
          
          // Use the most common unit as standard, or convert to grams for most ingredients
          const standardUnit = getStandardUnit(name);
          
          // Convert back to standard unit
          const totalConvertedQuantity = existingConvertedQuantity + convertedQuantity;
          const totalConvertedPantryQuantity = existingConvertedPantryQuantity + convertedPantryQuantity;
          
          existing.quantity = convertFromStandardUnit(totalConvertedQuantity, standardUnit, name);
          existing.pantryQuantity = convertFromStandardUnit(totalConvertedPantryQuantity, standardUnit, name);
          existing.unit = standardUnit;
        }
      } else {
        // First occurrence of this ingredient
        ingredientMap.set(name, { ...ingredient });
      }
    });
    
    return Array.from(ingredientMap.values());
  };

  // Helper function to convert to standard unit (grams for most ingredients)
  const convertToStandardUnit = (quantity, unit, ingredientName) => {
    const conversions = {
      // Weight conversions (to grams)
      'g': 1,
      'kg': 1000,
      'oz': 28.35,
      'lb': 453.59,
      
      // Volume conversions (to ml)
      'ml': 1,
      'l': 1000,
      'cup': 236.59,
      'tbsp': 14.79,
      'tsp': 4.93,
      
      // Special cases
      'piece': 1, // Keep as pieces
      'pinch': 0.36, // Approximate pinch to grams
    };
    
    // For liquids and some ingredients, use volume as standard
    const liquidIngredients = ['milk', 'water', 'oil', 'juice', 'broth', 'sauce'];
    const isLiquid = liquidIngredients.some(liquid => 
      ingredientName.toLowerCase().includes(liquid)
    );
    
    if (isLiquid && ['ml', 'l', 'cup', 'tbsp', 'tsp'].includes(unit)) {
      // Convert to ml for liquids
      return quantity * (conversions[unit] || 1);
    } else if (['g', 'kg', 'oz', 'lb'].includes(unit)) {
      // Convert to grams for solids
      return quantity * (conversions[unit] || 1);
    } else if (unit === 'piece' || unit === 'pinch') {
      // Keep pieces as is, convert pinches to grams
      return unit === 'piece' ? quantity : quantity * conversions[unit];
    }
    
    return quantity; // Default fallback
  };

  // Helper function to convert from standard unit back to display unit
  const convertFromStandardUnit = (quantity, targetUnit, ingredientName) => {
    const conversions = {
      // Weight conversions (from grams)
      'g': 1,
      'kg': 1/1000,
      'oz': 1/28.35,
      'lb': 1/453.59,
      
      // Volume conversions (from ml)
      'ml': 1,
      'l': 1/1000,
      'cup': 1/236.59,
      'tbsp': 1/14.79,
      'tsp': 1/4.93,
      
      // Special cases
      'piece': 1,
      'pinch': 1/0.36,
    };
    
    return quantity * (conversions[targetUnit] || 1);
  };

  // Helper function to determine the best standard unit for an ingredient
  const getStandardUnit = (ingredientName) => {
    const name = ingredientName.toLowerCase();
    
    // Liquids
    if (['milk', 'water', 'oil', 'juice', 'broth', 'sauce', 'vinegar', 'lemon juice'].some(liquid => name.includes(liquid))) {
      return 'ml';
    }
    
    // Small quantities of spices/herbs
    if (['salt', 'pepper', 'spice', 'herb', 'garlic', 'onion powder', 'cinnamon', 'nutmeg'].some(spice => name.includes(spice))) {
      return 'g';
    }
    
    // Large quantities
    if (['flour', 'sugar', 'rice', 'pasta', 'beans'].some(bulk => name.includes(bulk))) {
      return 'g';
    }
    
    // Proteins
    if (['chicken', 'beef', 'pork', 'fish', 'meat', 'lobster', 'shrimp'].some(protein => name.includes(protein))) {
      return 'g';
    }
    
    // Fruits and vegetables
    if (['banana', 'apple', 'orange', 'tomato', 'carrot', 'lettuce', 'spinach'].some(produce => name.includes(produce))) {
      return 'piece';
    }
    
    // Default to grams for most ingredients
    return 'g';
  };

  const handleAddAllToShoppingList = async () => {
    try {
      setLoading(true);
      await api.post('/shopping-list/update-from-meal-plan');
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
      await api.delete(`/mealplan/reset-week?weekStart=${selectedWeekStart}`);
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
      const response = await api.post('/mealplan/populate-week', {
        weekStart: selectedWeekStart
      });
      // Check for achievements in response
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
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
    setMealFormData({
      _id: existingMeal?._id || '',
      weekStart: existingMeal?.weekStart || selectedWeekStart,
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
      setMealActionLoading(true);
      let response;
      if (mealFormData._id) {
        response = await api.put(`/mealplan/${mealFormData._id}`, {
          recipeId: mealFormData.recipeId
        });
      } else {
        response = await api.post('/mealplan', mealFormData);
        
        // Check for achievements in response
        if (response.data.achievements && response.data.achievements.length > 0) {
          showAchievements(response.data.achievements);
        }
      }

      const mealItem = response.data.mealPlanItem || response.data;
      handleCloseMealDialog();
      setMealPlan(prev => {
        if (mealFormData._id) {
          return prev.map(m => m._id === mealItem._id ? mealItem : m);
        }
        return [...prev, mealItem];
      });
      fetchIngredients();
      setError('');
    } catch (err) {
      console.error('Error saving meal:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save meal. Please try again.');
      }
    } finally {
      setMealActionLoading(false);
    }
  };

  const handleRecipeSelect = async (recipe) => {
    if (!recipe?._id) return;
    // When adding (not editing), require day and meal to be selected first
    if (!mealFormData._id && (!mealFormData.day || !mealFormData.meal)) {
      toast.error('Please select a day and meal first');
      return;
    }

    const recipeId = recipe._id;
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMeal = {
      _id: optimisticId,
      day: mealFormData.day,
      meal: mealFormData.meal,
      weekStart: mealFormData.weekStart,
      recipe: { _id: recipeId, name: recipe.name }
    };

    const editingId = mealFormData._id;
    const previousMeal = mealPlan.find(m => m._id === editingId);

    // Instant UI update - close dialog and show meal immediately
    handleCloseMealDialog();
    if (editingId) {
      setMealPlan(prev => prev.map(m => m._id === editingId ? { ...m, recipe: { _id: recipeId, name: recipe.name } } : m));
    } else {
      setMealPlan(prev => [...prev, optimisticMeal]);
    }

    try {
      let response;
      if (editingId) {
        response = await api.put(`/mealplan/${editingId}`, { recipeId });
      } else {
        response = await api.post('/mealplan', { ...mealFormData, recipeId });
        if (response.data.achievements?.length > 0) {
          showAchievements(response.data.achievements);
        }
      }

      const mealItem = response.data.mealPlanItem || response.data;
      if (!editingId && cancelledOptimisticIds.current.has(optimisticId)) {
        cancelledOptimisticIds.current.delete(optimisticId);
        return;
      }
      setMealPlan(prev => {
        if (editingId) {
          return prev.map(m => m._id === mealItem._id ? mealItem : m);
        }
        return prev.map(m => m._id === optimisticId ? mealItem : m);
      });
      fetchIngredients();
      setError('');
    } catch (err) {
      if (editingId && previousMeal) {
        setMealPlan(prev => prev.map(m => m._id === editingId ? previousMeal : m));
      } else {
        setMealPlan(prev => prev.filter(m => m._id !== optimisticId));
      }
      setError(err.response?.data?.error || 'Failed to save meal');
      toast.error(err.response?.data?.error || 'Failed to save meal');
    }
  };

  const handleEditMeal = (day, mealType, existingMeal) => {
    handleOpenMealDialog(day, mealType, existingMeal);
  };

  const handleDeleteMeal = async (id) => {
    const deletedMeal = mealPlan.find(m => m._id === id);
    setMealPlan(prev => prev.filter(m => m._id !== id));
    if (String(id).startsWith('temp-')) {
      cancelledOptimisticIds.current.add(id);
      return;
    }
    try {
      await api.delete(`/mealplan/${id}`);
      fetchIngredients();
    } catch (err) {
      console.error('Error deleting meal:', err);
      if (deletedMeal) setMealPlan(prev => [...prev, deletedMeal]);
      setError('Failed to delete meal. Please try again.');
      toast.error('Failed to delete meal');
    }
  };

  const handleAddRecipeToSlot = async (day, mealType, recipe, existingMealId = null) => {
    if (!recipe?._id) return;
    try {
      setMealActionLoading(true);
      let response;
      if (existingMealId) {
        response = await api.put(`/mealplan/${existingMealId}`, { recipeId: recipe._id });
      } else {
        response = await api.post('/mealplan', {
          weekStart: selectedWeekStart,
          day,
          meal: mealType,
          recipeId: recipe._id
        });
        if (response.data.achievements?.length > 0) {
          showAchievements(response.data.achievements);
        }
      }
      const mealItem = response.data.mealPlanItem || response.data;
      setMealPlan(prev => {
        if (existingMealId) {
          return prev.map(m => m._id === mealItem._id ? mealItem : m);
        }
        return [...prev, mealItem];
      });
      await fetchIngredients();
      setError('');
      toast.success(`Added ${recipe.name} to ${day} ${mealType}`);
    } catch (err) {
      console.error('Error adding recipe to slot:', err);
      const errMsg = err.response?.data?.error || 'Failed to add recipe. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setMealActionLoading(false);
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
        await fetchIngredients();
      }
    } catch (err) {
      console.error('Error updating meal plan:', err);
      setError('Failed to update meal plan. Please try again.');
    }
  };

  const handleAddToPantry = async (ingredient) => {
    if (!ingredient?._id) {
      toast.error('Cannot add to pantry: ingredient ID missing');
      return;
    }
    try {
      await api.post('/pantry', {
        ingredient: ingredient._id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      });
      toast.success(`Added ${ingredient.name} to pantry`);
      await fetchIngredients();
    } catch (err) {
      console.error('Error adding to pantry:', err);
      toast.error(err.response?.data?.error || 'Failed to add to pantry');
    }
  };

  const handleAddToShoppingList = async (ingredient) => {
    if (!ingredient?._id) {
      toast.error('Cannot add to shopping list: ingredient ID missing');
      return;
    }
    const remainingNeeded = Math.max(0, ingredient.quantity - (ingredient.pantryQuantity || 0));
    if (remainingNeeded <= 0) {
      toast.error(`${ingredient.name} is already in stock`);
      return;
    }
    try {
      await api.post('/shopping-list', {
        ingredient: ingredient._id,
        quantity: remainingNeeded,
        unit: ingredient.unit,
      });
      toast.success(`Added ${ingredient.name} to shopping list`);
    } catch (err) {
      console.error('Error adding to shopping list:', err);
      toast.error(err.response?.data?.error || 'Failed to add to shopping list');
    }
  };

  const handleRemoveFromPantry = async (ingredient) => {
    if (!ingredient?._id) {
      toast.error('Cannot remove from pantry: ingredient ID missing');
      return;
    }
    try {
      const pantryRes = await api.get('/pantry');
      const items = pantryRes.data?.items || [];
      const ingredientIdStr = String(ingredient._id);
      const matchingItem = items.find(
        (item) => {
          const itemIngredientId = item.ingredient?._id?.toString?.() ?? item.ingredient?.toString?.();
          return itemIngredientId === ingredientIdStr && item.unit === ingredient.unit;
        }
      );
      if (!matchingItem) {
        toast.error('No matching pantry item found');
        return;
      }
      await api.delete(`/pantry/${matchingItem._id}`);
      toast.success(`Removed ${ingredient.name} from pantry`);
      await fetchIngredients();
    } catch (err) {
      console.error('Error removing from pantry:', err);
      toast.error(err.response?.data?.error || 'Failed to remove from pantry');
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
    <Container 
      maxWidth={false}
      sx={{ 
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 3, md: 4, lg: 6, xl: 8 },
        maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: '1400px', xl: '1600px' }
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" component="h1">
                {user?.name ? `${user.name}'s Dashboard` : 'Dashboard'}
              </Typography>
              <Tooltip title="How it works">
                <IconButton size="small" onClick={() => setHelpDialogOpen(true)} color="inherit">
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        {/* Week Selector */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarTodayIcon color="primary" />
                  <Typography variant="h6">
                    Week of Monday, {selectedWeekStart ? (() => {
                      const [year, month, day] = selectedWeekStart.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    })() : ''}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} ml="auto">
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        borderColor: theme.palette.primary.dark,
                        color: 'white'
                      }
                    }}
                    onClick={() => {
                      const currentDate = new Date(selectedWeekStart);
                      currentDate.setDate(currentDate.getDate() - 7);
                      setSelectedWeekStart(currentDate.toISOString().split('T')[0]);
                    }}
                  >
                    Previous Week
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      position: 'relative',
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        borderColor: theme.palette.primary.dark,
                        color: 'white'
                      }
                    }}
                  >
                    <CalendarTodayIcon sx={{ fontSize: 16, mr: 1 }} />
                    {selectedWeekStart ? (() => {
                      const [year, month, day] = selectedWeekStart.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      });
                    })() : 'Select Date'}
                    <input
                      type="date"
                      value={selectedWeekStart}
                      onChange={(e) => {
                        // Parse the date string properly to avoid timezone issues
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        const selectedDate = new Date(year, month - 1, day); // month is 0-indexed
                        
                        // Adjust to Monday of that week
                        const dayOfWeek = selectedDate.getDay();
                        // Calculate days to go back to get to Monday
                        // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
                        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        
                        selectedDate.setDate(selectedDate.getDate() - daysToMonday);
                        selectedDate.setHours(0, 0, 0, 0);
                        
                        setSelectedWeekStart(selectedDate.toISOString().split('T')[0]);
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 1
                      }}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        borderColor: theme.palette.primary.dark,
                        color: 'white'
                      }
                    }}
                    onClick={() => {
                      const currentDate = new Date(selectedWeekStart);
                      currentDate.setDate(currentDate.getDate() + 7);
                      setSelectedWeekStart(currentDate.toISOString().split('T')[0]);
                    }}
                  >
                    Next Week
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        borderColor: theme.palette.primary.dark,
                        color: 'white'
                      }
                    }}
                    onClick={() => {
                      const today = new Date();
                      const monday = new Date(today);
                      monday.setDate(today.getDate() - today.getDay() + 1);
                      monday.setHours(0, 0, 0, 0);
                      setSelectedWeekStart(monday.toISOString().split('T')[0]);
                    }}
                  >
                    This Week
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
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
                  <Tooltip title="Fill your week with random recipes from your collection">
                    <span>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<CasinoIcon />}
                        onClick={handlePopulateWeek}
                        disabled={loading || mealActionLoading || recipes.length === 0}
                        size="small"
                      >
                        Populate Week
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleOpenResetWeekDialog}
                    disabled={loading || mealActionLoading || mealPlan.length === 0}
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
                onAddRecipeToSlot={handleAddRecipeToSlot}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={ingredientsExpanded ? 3 : 0}
                sx={{ cursor: 'pointer' }}
                onClick={() => setIngredientsExpanded((e) => !e)}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Needed Ingredients
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ingredients.length > 0 
                      ? `${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''} needed`
                      : 'No ingredients needed'
                    }
                  </Typography>
                  {ingredientsExpanded ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </Box>
                <Box onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Add ingredients you need that aren't in your pantry">
                    <span>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ShoppingCartIcon />}
                        onClick={handleAddAllToShoppingList}
                        disabled={loading || mealActionLoading || ingredients.length === 0}
                        size="small"
                        sx={{ 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 3
                        }}
                      >
                        Add All to Shopping List
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
              
              <Collapse in={ingredientsExpanded}>
              {ingredients.length > 0 ? (
                <Box>
                  {/* Summary Stats */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mb: 3, 
                    flexWrap: 'wrap',
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 2
                  }}>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        {ingredients.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Items
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                        {ingredients.filter(ing => (ing.pantryQuantity || 0) >= ing.quantity).length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        In Stock
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                        {ingredients.filter(ing => (ing.pantryQuantity || 0) > 0 && (ing.pantryQuantity || 0) < ing.quantity).length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Partial
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
                        {ingredients.filter(ing => (ing.pantryQuantity || 0) === 0).length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Missing
                      </Typography>
                    </Box>
                  </Box>

                  {/* Ingredients Grid */}
                  <Grid container spacing={2}>
                    {ingredients.map((ingredient) => {
                      const percentage = Math.min(100, ((ingredient.pantryQuantity || 0) / ingredient.quantity) * 100);
                      const isComplete = percentage >= 100;
                      const isPartial = percentage > 0 && percentage < 100;
                      const isMissing = percentage === 0;
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={ingredient._id || ingredient.name}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2.5,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: isComplete 
                                ? 'success.main' 
                                : isPartial 
                                  ? 'warning.main' 
                                  : 'error.main',
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.03)' 
                                : 'rgba(255, 255, 255, 0.8)',
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.08)' 
                                  : 'rgba(0, 0, 0, 0.03)',
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out',
                              },
                            }}
                          >
                            {/* Status Indicator */}
                            <Box sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: isComplete 
                                ? 'success.main' 
                                : isPartial 
                                  ? 'warning.main' 
                                  : 'error.main',
                              border: '2px solid',
                              borderColor: theme.palette.background.paper
                            }} />
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 600,
                                  mb: 1.5,
                                  color: isComplete ? 'success.main' : 'text.primary',
                                  textDecoration: isComplete ? 'none' : 'none',
                                  fontSize: '1.1rem'
                                }}
                              >
                                {ingredient.name}
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 700,
                                    color: isComplete 
                                      ? 'success.main' 
                                      : isPartial 
                                        ? 'warning.main' 
                                        : 'error.main',
                                    mb: 0.5
                                  }}
                                >
                                  {ingredient.quantity} {ingredient.unit}
                                </Typography>
                                
                                {(ingredient.pantryQuantity ?? 0) > 0 && (
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ mb: 1 }}
                                  >
                                    You have: {ingredient.pantryQuantity} {ingredient.unit}
                                  </Typography>
                                )}
                              </Box>
                              
                              {/* Progress Bar */}
                              <Box sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Stock Level
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(percentage)}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={percentage}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: theme.palette.mode === 'dark' 
                                      ? 'rgba(255, 255, 255, 0.1)' 
                                      : 'rgba(0, 0, 0, 0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 4,
                                      backgroundColor: isComplete 
                                        ? 'success.main' 
                                        : isPartial 
                                          ? 'warning.main' 
                                          : 'error.main',
                                    },
                                  }}
                                />
                              </Box>
                              
                              {/* Status Text */}
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: isComplete 
                                    ? 'success.main' 
                                    : isPartial 
                                      ? 'warning.main' 
                                      : 'error.main',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5
                                }}
                              >
                                {isComplete ? '✓ In Stock' : isPartial ? '⚠ Partial' : '✗ Missing'}
                              </Typography>
                              
                              {/* Add to Pantry / Add to Shopping List / Remove from Pantry */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, gap: 1, flexWrap: 'nowrap', width: '100%' }}>
                                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                  <Tooltip title="You have this at home – add to your pantry">
                                    <span>
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleAddToPantry(ingredient)}
                                        disabled={mealActionLoading}
                                        sx={{ border: '1px solid', borderColor: 'divider' }}
                                      >
                                        <KitchenIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  {(ingredient.pantryQuantity || 0) > 0 && (
                                    <Tooltip title="Remove from pantry – you used it or no longer have it">
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveFromPantry(ingredient)}
                                          disabled={mealActionLoading}
                                          sx={{ border: '1px solid', borderColor: 'divider' }}
                                        >
                                          <RemoveCircleOutlineIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  )}
                                </Box>
                                <Box sx={{ flexShrink: 0 }}>
                                  <Tooltip title={isComplete ? 'Already in stock – no need to buy' : 'Add this item to your shopping list'}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        color="secondary"
                                        onClick={() => handleAddToShoppingList(ingredient)}
                                        disabled={mealActionLoading || isComplete}
                                        sx={{ border: '1px solid', borderColor: 'divider' }}
                                      >
                                        <ShoppingCartIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ) : (
                <EmptyState
                  icon={<ShoppingCartIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
                  title="No ingredients needed"
                  description="Add meals to your meal plan to see required ingredients here. Then add them to your shopping list or pantry."
                  primaryAction={{
                    label: 'Add Meal',
                    onClick: () => handleOpenMealDialog(),
                  }}
                  secondaryAction={
                    mealPlan.length === 0
                      ? { label: 'Go to Recipes', onClick: () => navigate('/recipes') }
                      : undefined
                  }
                />
              )}
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={openMealDialog}
        onClose={handleCloseMealDialog}
        fullScreen={isMobile}
        disableScrollLock
      >
        <DialogTitle>
          {mealFormData._id ? 'Edit Meal' : (mealFormData.day && mealFormData.meal ? `Add Meal - ${mealFormData.day} ${mealFormData.meal}` : 'Add Meal')}
        </DialogTitle>
        <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
          {(mealFormData._id || !mealFormData.day || !mealFormData.meal) ? (
            // Editing existing meal, or adding without a pre-selected slot - show day/meal selectors
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
            // Adding new meal from grid slot click - show day and meal as read-only
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Day: <strong>{mealFormData.day}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Meal: <strong>{mealFormData.meal}</strong>
              </Typography>
            </Box>
          )}

          <Autocomplete
            fullWidth
            options={recipes}
            value={recipes.find((r) => r._id === mealFormData.recipeId) || null}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name) || ''}
            isOptionEqualToValue={(option, value) => option?._id === value?._id}
            filterOptions={(options, { inputValue }) =>
              options.filter((opt) =>
                (opt?.name || '').toLowerCase().includes((inputValue || '').toLowerCase())
              )
            }
            onChange={(e, value) => {
              if (value) {
                handleRecipeSelect(value);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Recipe"
                placeholder="Type to search recipes..."
                required={!mealFormData.recipeId}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMealDialog}>Cancel</Button>
          {mealFormData._id && (
            <Button type="submit" variant="contained" color="primary" disabled={mealActionLoading}>
              Update
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>How FoodForNow Works</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              mb: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Recipes</Typography>
            <Typography variant="body2" color="text.disabled">→</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Meal Plan</Typography>
            <Typography variant="body2" color="text.disabled">→</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Ingredients</Typography>
            <Typography variant="body2" color="text.disabled">→</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Shopping List</Typography>
            <Typography variant="body2" color="text.disabled">/</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Pantry</Typography>
          </Box>
          <Typography variant="body2" paragraph>
            <strong>1. Recipes</strong> – Add or import recipes. They are the foundation of your meal plan.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>2. Meal Plan</strong> – Add meals to each day. Use Populate Week to fill randomly from your recipes.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>3. Ingredients</strong> – Needed ingredients are shown automatically. Add to Pantry if you have them at home, or Add All to Shopping List for items to buy.
          </Typography>
          <Typography variant="body2">
            <strong>4. Shopping List</strong> – Your list of items to buy. Use Auto Update on the Shopping List page to sync from your meal plan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>Got it</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Week Confirmation Dialog */}
      <Dialog
        open={resetWeekDialog}
        onClose={handleCloseResetWeekDialog}
        fullScreen={isMobile}
      >
        <DialogTitle>Reset Meal Plan</DialogTitle>
        <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
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
