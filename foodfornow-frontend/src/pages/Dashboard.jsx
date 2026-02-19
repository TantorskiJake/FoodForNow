import { useState, useEffect, useRef, useCallback } from 'react';
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
  LinearProgress,
  Paper,
  TextField,
  Autocomplete,
  Tooltip,
  Collapse,
  Skeleton,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
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
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import MealPlanGrid from '../components/MealPlanGrid';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import useProgressiveLoader from '../hooks/useProgressiveLoader';
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
  const [openMealDialog, setOpenMealDialog] = useState(false);
  const [mealFormData, setMealFormData] = useState({
    _id: '',
    weekStart: '',
    day: '',
    meal: '',
    recipeId: '',
    eatingOut: false,
    restaurant: { name: '', url: '', address: '', notes: '' },
  });
  const [resetWeekDialog, setResetWeekDialog] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState('');
  const [mealActionLoading, setMealActionLoading] = useState(false);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);

  const { authenticated, user } = useAuth();
  const { showAchievements } = useAchievements();
  const { startTask, markHydrated, showBusyBar, showSkeleton } = useProgressiveLoader();
  const cancelledOptimisticIds = useRef(new Set());
  const MEALPLAN_CACHE_KEYS = ['/mealplan', '/mealplan/ingredients'];
  const PANTRY_CACHE_KEYS = ['/pantry', '/mealplan/ingredients'];
  const SHOPPING_CACHE_KEYS = ['/shopping-list', '/mealplan/ingredients'];

  const runTask = useCallback(
    async (task, options = {}) => {
      const { hydrate = false } = options;
      const stop = startTask();
      try {
        const result = await task();
        if (hydrate) {
          markHydrated();
        }
        return result;
      } finally {
        stop();
      }
    },
    [startTask, markHydrated]
  );

  const invalidateCache = useCallback((fragments = []) => {
    if (!fragments.length) return;
    api.invalidateCache((key) => fragments.some((fragment) => key.includes(fragment)));
  }, []);

  // Initialize selected week to current week's Monday
  useEffect(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    setSelectedWeekStart(monday.toISOString().split('T')[0]);
  }, []);

  // Auto-expand Needed Ingredients only when user scrolls to the absolute bottom of the page
  const wasAtBottomRef = useRef(false);
  const userClosedManuallyRef = useRef(false);
  useEffect(() => {
    if (ingredients.length === 0) return;

    const checkScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const threshold = 80; // px from bottom to trigger
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;

      if (!atBottom) userClosedManuallyRef.current = false; // User scrolled away; allow expand next time
      if (atBottom && !wasAtBottomRef.current && !userClosedManuallyRef.current) {
        setIngredientsExpanded(true);
      }
      wasAtBottomRef.current = atBottom;
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll(); // Initial check
    return () => window.removeEventListener('scroll', checkScroll);
  }, [ingredients.length]);

  const handleIngredientsToggle = useCallback(() => {
    setIngredientsExpanded((prev) => {
      if (prev) userClosedManuallyRef.current = true; // User closed; block scroll from re-expanding
      return !prev;
    });
  }, []);

  // Refresh all dashboard data every time we land on the dashboard so needed ingredients
  // reflect the latest pantry (no manual refresh needed after adding pantry items).
  useEffect(() => {
    if (!authenticated || !selectedWeekStart) return;

    const fetchAll = async () => {
      await runTask(async () => {
        await Promise.all([
          fetchRecipes({ forceRefresh: true }),
          fetchMealPlan({ forceRefresh: true }),
          fetchIngredients({ forceRefresh: true })
        ]);
      }, { hydrate: true });
    };

    fetchAll();
  }, [authenticated, selectedWeekStart, runTask]);

  const fetchRecipes = async ({ forceRefresh = false } = {}) => {
    try {
      const response = await api.cachedGet('/recipes', {
        cacheTtl: 5 * 60 * 1000,
        forceRefresh,
      });
      setRecipes(response.data || []);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to fetch recipes. Please try again.');
    }
  };

  const fetchMealPlan = async ({ forceRefresh = false } = {}) => {
    try {
      const response = await api.cachedGet(`/mealplan?weekStart=${selectedWeekStart}`, {
        cacheTtl: 60 * 1000,
        forceRefresh,
      });
      setMealPlan(response.data || []);
    } catch (err) {
      console.error('Error fetching meal plan:', err);
      setError('Failed to fetch meal plan. Please try again.');
    }
  };

  const fetchIngredients = async ({ forceRefresh = false } = {}) => {
    try {
      const response = await api.cachedGet(`/mealplan/ingredients?weekStart=${selectedWeekStart}&aggregateByIngredient=true`, {
        cacheTtl: 45 * 1000,
        forceRefresh,
      });
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

  // Helper function to aggregate ingredients by name (backend sends one row per ingredient in standard unit when aggregateByIngredient=true)
  const aggregateIngredientsByName = (ingredients) => {
    const ingredientMap = new Map();

    ingredients.forEach(ingredient => {
      if (!ingredient || !ingredient.name) return;
      const name = ingredient.name;

      if (ingredientMap.has(name)) {
        const existing = ingredientMap.get(name);
        if (existing.unit === ingredient.unit) {
          existing.quantity += ingredient.quantity;
          existing.pantryQuantity = Math.max(existing.pantryQuantity || 0, ingredient.pantryQuantity || 0);
        } else {
          // Same name, different units: can't add quantities; keep pantry as max (same stock)
          existing.pantryQuantity = Math.max(existing.pantryQuantity || 0, ingredient.pantryQuantity || 0);
        }
      } else {
        ingredientMap.set(name, { ...ingredient });
      }
    });

    return Array.from(ingredientMap.values());
  };

  const formatIngredientQuantity = (value, unit) => {
    if (value == null || Number.isNaN(Number(value))) return String(value ?? '');
    const n = Number(value);
    const countable = ['piece', 'box'].includes(unit);
    if (countable) return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
    const rounded = Math.round(n * 100) / 100;
    return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded);
  };

  const handleAddAllToShoppingList = async () => {
    try {
      await runTask(async () => {
        await api.post('/shopping-list/update-from-meal-plan');
        invalidateCache(['/shopping-list', '/mealplan/ingredients']);
        setError(null);
        await fetchIngredients({ forceRefresh: true });
      });
    } catch (err) {
      console.error('Error adding ingredients to shopping list:', err);
      setError('Failed to add ingredients to shopping list');
    }
  };

  const handleResetWeek = async () => {
    try {
      await runTask(async () => {
        await api.delete(`/mealplan/reset-week?weekStart=${selectedWeekStart}`);
        setMealPlan([]);
        invalidateCache(['/mealplan', '/mealplan/ingredients']);
        await Promise.all([
          fetchMealPlan({ forceRefresh: true }),
          fetchIngredients({ forceRefresh: true })
        ]);
      });
      setError('');
    } catch (err) {
      console.error('Error resetting week:', err);
      setError('Failed to reset week. Please try again.');
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
      await runTask(async () => {
        const response = await api.post('/mealplan/populate-week', {
          weekStart: selectedWeekStart
        });
        if (response.data.achievements && response.data.achievements.length > 0) {
          showAchievements(response.data.achievements);
        }
        invalidateCache(['/mealplan', '/mealplan/ingredients']);
        await Promise.all([
          fetchMealPlan({ forceRefresh: true }),
          fetchIngredients({ forceRefresh: true })
        ]);
      });
      setError('');
    } catch (err) {
      console.error('Error populating week:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to populate week. Please try again.');
      }
    }
  };

  const handleOpenMealDialog = (day, mealType, existingMeal = null) => {
    const isEatingOut = !!existingMeal?.eatingOut;
    setMealFormData({
      _id: existingMeal?._id || '',
      weekStart: existingMeal?.weekStart || selectedWeekStart,
      day: day || existingMeal?.day || '',
      meal: mealType || existingMeal?.meal || '',
      recipeId: existingMeal?.recipe?._id || '',
      eatingOut: isEatingOut,
      restaurant: isEatingOut && existingMeal?.restaurant
        ? {
            name: existingMeal.restaurant.name || '',
            url: existingMeal.restaurant.url || '',
            address: existingMeal.restaurant.address || '',
            notes: existingMeal.restaurant.notes || '',
          }
        : { name: '', url: '', address: '', notes: '' },
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
      eatingOut: false,
      restaurant: { name: '', url: '', address: '', notes: '' },
    });
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (mealFormData.eatingOut && !mealFormData.restaurant?.name?.trim()) {
      toast.error('Please enter a restaurant name');
      return;
    }
    try {
      setMealActionLoading(true);
      let response;
      if (mealFormData._id) {
        response = await api.put(`/mealplan/${mealFormData._id}`, mealFormData.eatingOut
          ? { eatingOut: true, restaurant: mealFormData.restaurant }
          : { recipeId: mealFormData.recipeId, eatingOut: false });
      } else {
        response = await api.post('/mealplan', mealFormData.eatingOut
          ? {
              weekStart: mealFormData.weekStart,
              day: mealFormData.day,
              meal: mealFormData.meal,
              eatingOut: true,
              restaurant: mealFormData.restaurant,
            }
          : mealFormData);
        
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
      invalidateCache(MEALPLAN_CACHE_KEYS);
      await fetchIngredients({ forceRefresh: true });
      setError('');
      toast.success(mealFormData.eatingOut ? 'Eating out meal added' : 'Meal added');
    } catch (err) {
      console.error('Error saving meal:', err);
      const errMsg = err.response?.data?.error || 'Failed to save meal. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
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
      setMealPlan(prev => prev.map(m => m._id === editingId
        ? { ...m, recipe: { _id: recipeId, name: recipe.name }, eatingOut: false, restaurant: undefined }
        : m));
    } else {
      setMealPlan(prev => [...prev, optimisticMeal]);
    }

    try {
      let response;
      if (editingId) {
        response = await api.put(`/mealplan/${editingId}`, { recipeId, eatingOut: false });
      } else {
        response = await api.post('/mealplan', { ...mealFormData, recipeId });
        if (response.data.achievements?.length > 0) {
          showAchievements(response.data.achievements);
        }
      }

      let mealItem = response.data.mealPlanItem || response.data;
      // When we have a recipe, ensure eatingOut/restaurant are cleared (backend may return stale data)
      if (mealItem?.recipe) {
        mealItem = { ...mealItem, eatingOut: false, restaurant: undefined };
      }
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
      invalidateCache(MEALPLAN_CACHE_KEYS);
      await fetchIngredients({ forceRefresh: true });
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
      invalidateCache(MEALPLAN_CACHE_KEYS);
      await fetchIngredients({ forceRefresh: true });
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
      invalidateCache(MEALPLAN_CACHE_KEYS);
      await fetchIngredients({ forceRefresh: true });
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
      // Refresh needed ingredients whenever cook/uncook changes (both affect which meals need ingredients).
      // Uncook restocks the pantry on the backend, so invalidate pantry cache too.
      invalidateCache([...MEALPLAN_CACHE_KEYS, ...PANTRY_CACHE_KEYS]);
      await fetchIngredients({ forceRefresh: true });
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
      invalidateCache(PANTRY_CACHE_KEYS);
      await fetchIngredients({ forceRefresh: true });
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
      invalidateCache(SHOPPING_CACHE_KEYS);
      await fetchIngredients({ forceRefresh: true });
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
      const pantryRes = await api.cachedGet('/pantry', {
        cacheTtl: 45 * 1000,
      });
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
      invalidateCache(PANTRY_CACHE_KEYS);
      await fetchIngredients({ forceRefresh: true });
    } catch (err) {
      console.error('Error removing from pantry:', err);
      toast.error(err.response?.data?.error || 'Failed to remove from pantry');
    }
  };

  const disableGlobalActions = showSkeleton || showBusyBar;
  const busyIndicator = showBusyBar ? (
    <LinearProgress
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: theme.zIndex.tooltip + 1,
      }}
    />
  ) : null;

  if (showSkeleton) {
    return (
      <Container 
        maxWidth={false}
        sx={{ 
          py: { xs: 1, sm: 2 },
          px: { xs: 1, sm: 3, md: 4, lg: 6, xl: 8 }
        }}
      >
        {busyIndicator}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="text" height={48} width="40%" />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={360} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={360} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={280} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth={false}
      sx={{ 
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 3, md: 4, lg: 6, xl: 8 }
      }}
    >
      {busyIndicator}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0}>
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
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  onClick={(e) => setCalendarAnchorEl(e.currentTarget)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.85 },
                  }}
                >
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
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        borderColor: theme.palette.primary.dark,
                        color: 'white'
                      }
                    }}
                    onClick={(e) => setCalendarAnchorEl(e.currentTarget)}
                    startIcon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                  >
                    {selectedWeekStart ? (() => {
                      const [year, month, day] = selectedWeekStart.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      });
                    })() : 'Select Date'}
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

        <Popover
          open={Boolean(calendarAnchorEl)}
          anchorEl={calendarAnchorEl}
          onClose={() => setCalendarAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { mt: 1.5 } } }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={selectedWeekStart ? dayjs(selectedWeekStart) : null}
              onChange={(newValue) => {
                if (newValue) {
                  const selectedDate = newValue.toDate();
                  const dayOfWeek = selectedDate.getDay();
                  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  selectedDate.setDate(selectedDate.getDate() - daysToMonday);
                  selectedDate.setHours(0, 0, 0, 0);
                  setSelectedWeekStart(selectedDate.toISOString().split('T')[0]);
                  setCalendarAnchorEl(null);
                }
              }}
              views={['year', 'month', 'day']}
              openTo="day"
              slotProps={{
                actionBar: { actions: ['today'] },
              }}
              sx={{ p: 2, minWidth: 320 }}
            />
          </LocalizationProvider>
        </Popover>

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
                        variant="contained"
                        color="primary"
                        startIcon={<CasinoIcon />}
                        onClick={handlePopulateWeek}
                        disabled={disableGlobalActions || mealActionLoading || recipes.length === 0}
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
                    disabled={disableGlobalActions || mealActionLoading || mealPlan.length === 0}
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
                onClick={handleIngredientsToggle}
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
                <Box onClick={(e) => e.stopPropagation()} display="flex" alignItems="center" gap={0.5}>
                  <Tooltip title="Refresh needed ingredients with latest pantry data">
                    <span>
                      <IconButton
                        onClick={() => runTask(() => fetchIngredients({ forceRefresh: true }))}
                        disabled={disableGlobalActions || mealActionLoading}
                        size="small"
                        aria-label="Refresh needed ingredients"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" fontSize="small" aria-hidden="true">
                          <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Add ingredients you need that aren't in your pantry">
                    <span>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ShoppingCartIcon />}
                        onClick={handleAddAllToShoppingList}
                        disabled={disableGlobalActions || mealActionLoading || ingredients.length === 0}
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
                              p: 1.5,
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
                            
                            <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 600,
                                  mb: 0.5,
                                  color: isComplete ? 'success.main' : 'text.primary',
                                  fontSize: '0.9rem',
                                  textTransform: 'capitalize',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {ingredient.name}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 700,
                                    color: isComplete 
                                      ? 'success.main' 
                                      : isPartial 
                                        ? 'warning.main' 
                                        : 'error.main',
                                    fontSize: '0.95rem',
                                    textTransform: 'capitalize'
                                  }}
                                >
                                  {formatIngredientQuantity(ingredient.quantity, ingredient.unit)} {ingredient.unit}
                                </Typography>
                                {(ingredient.pantryQuantity ?? 0) > 0 && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                    · You have: {formatIngredientQuantity(ingredient.pantryQuantity, ingredient.unit)} {ingredient.unit}
                                  </Typography>
                                )}
                              </Box>
                              
                              {/* Progress Bar + Status inline */}
                              <Box sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                    Stock Level {Math.round(percentage)}%
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      fontWeight: 600,
                                      color: isComplete ? 'success.main' : isPartial ? 'warning.main' : 'error.main',
                                      fontSize: '0.7rem',
                                      textTransform: 'capitalize',
                                      letterSpacing: 0.3
                                    }}
                                  >
                                    {isComplete ? '✓ In Stock' : isPartial ? '⚠ Partial' : '✗ Missing'}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={percentage}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: theme.palette.mode === 'dark' 
                                      ? 'rgba(255, 255, 255, 0.1)' 
                                      : 'rgba(0, 0, 0, 0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      backgroundColor: isComplete 
                                        ? 'success.main' 
                                        : isPartial 
                                          ? 'warning.main' 
                                          : 'error.main',
                                    },
                                  }}
                                />
                              </Box>
                              
                              {/* Add to Pantry / Add to Shopping List / Remove from Pantry */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, gap: 0.5, flexWrap: 'nowrap', width: '100%' }}>
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {mealFormData._id ? 'Edit Meal' : (mealFormData.day && mealFormData.meal ? `Add Meal - ${mealFormData.day} ${mealFormData.meal}` : 'Add Meal')}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3, pb: 2, ...(isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}) }}>
          {(mealFormData._id || !mealFormData.day || !mealFormData.meal) ? (
            // Editing existing meal, or adding without a pre-selected slot - show day/meal selectors
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Day</Typography>
                <Select
                  fullWidth
                  value={mealFormData.day}
                  onChange={(e) => setMealFormData({ ...mealFormData, day: e.target.value })}
                  required
                  displayEmpty
                  renderValue={(v) => v || 'Select day'}
                  sx={{ '& .MuiSelect-select': { py: 1.5 } }}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Meal</Typography>
                <Select
                  fullWidth
                  value={mealFormData.meal}
                  onChange={(e) => setMealFormData({ ...mealFormData, meal: e.target.value })}
                  required
                  displayEmpty
                  renderValue={(v) => v || 'Select meal'}
                  sx={{ '& .MuiSelect-select': { py: 1.5 } }}
                >
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
                    <MenuItem key={meal} value={meal}>
                      {meal}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </>
          ) : (
            // Adding new meal from grid slot click - show day and meal as read-only
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ display: 'inline-block', minWidth: 56, mr: 0.5 }}>Day:</Box>
                <strong>{mealFormData.day}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ display: 'inline-block', minWidth: 56, mr: 0.5 }}>Meal:</Box>
                <strong>{mealFormData.meal}</strong>
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
              Meal type
            </Typography>
            <ToggleButtonGroup
              value={mealFormData.eatingOut ? 'eatingOut' : 'recipe'}
              exclusive
              onChange={(e, value) => {
                if (value !== null) {
                  setMealFormData({
                    ...mealFormData,
                    eatingOut: value === 'eatingOut',
                    recipeId: value === 'eatingOut' ? '' : mealFormData.recipeId,
                    restaurant: value === 'eatingOut' ? mealFormData.restaurant : { name: '', url: '', address: '', notes: '' },
                  });
                }
              }}
              fullWidth
              size="small"
            >
              <ToggleButton value="recipe" aria-label="Recipe" sx={{ whiteSpace: 'nowrap' }}>
                <MenuBookIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Recipe
              </ToggleButton>
              <ToggleButton value="eatingOut" aria-label="Eating out" sx={{ whiteSpace: 'nowrap' }}>
                <RestaurantIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Eating out
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ minHeight: 340, position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                opacity: mealFormData.eatingOut ? 0 : 1,
                visibility: mealFormData.eatingOut ? 'hidden' : 'visible',
                pointerEvents: mealFormData.eatingOut ? 'none' : 'auto',
              }}
            >
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
            </Box>
            <Box
              component="form"
              onSubmit={handleAddMeal}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                opacity: mealFormData.eatingOut ? 1 : 0,
                visibility: mealFormData.eatingOut ? 'visible' : 'hidden',
                pointerEvents: mealFormData.eatingOut ? 'auto' : 'none',
              }}
            >
              <TextField
                fullWidth
                label="Restaurant name"
                placeholder="e.g. Joe's Pizza"
                value={mealFormData.restaurant?.name || ''}
                onChange={(e) =>
                  setMealFormData({
                    ...mealFormData,
                    restaurant: { ...mealFormData.restaurant, name: e.target.value },
                  })
                }
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Website / URL"
                placeholder="https://..."
                value={mealFormData.restaurant?.url || ''}
                onChange={(e) =>
                  setMealFormData({
                    ...mealFormData,
                    restaurant: { ...mealFormData.restaurant, url: e.target.value },
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Address"
                placeholder="123 Main St, City"
                value={mealFormData.restaurant?.address || ''}
                onChange={(e) =>
                  setMealFormData({
                    ...mealFormData,
                    restaurant: { ...mealFormData.restaurant, address: e.target.value },
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Notes"
                placeholder="Reservation at 7pm, etc."
                value={mealFormData.restaurant?.notes || ''}
                onChange={(e) =>
                  setMealFormData({
                    ...mealFormData,
                    restaurant: { ...mealFormData.restaurant, notes: e.target.value },
                  })
                }
                multiline
                rows={2}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMealDialog}>Cancel</Button>
          {(mealFormData._id || mealFormData.eatingOut) && (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={mealActionLoading}
              onClick={(e) => {
                e.preventDefault();
                handleAddMeal(e);
              }}
            >
              {mealFormData._id ? 'Update' : 'Add'}
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
