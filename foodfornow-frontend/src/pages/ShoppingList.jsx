import React, { useState, useEffect, useCallback } from 'react';
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
  Paper,
  Chip,
  useTheme,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Menu,
  Autocomplete,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  AddShoppingCart as AddShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Sort as SortIcon,
  QrCodeScanner as QrCodeScannerIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import BarcodeScanner from '../components/BarcodeScanner';
import EmptyState from '../components/EmptyState';
import { lookupBarcode, extractBarcode } from '../services/barcodeLookup';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../components/PageLoader';
import useProgressiveLoader from '../hooks/useProgressiveLoader';

const capitalizeWords = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ShoppingList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const { showAchievements } = useAchievements();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [formData, setFormData] = useState({
    ingredient: '',
    ingredientName: '',
    category: 'Other',
    description: '',
    quantity: '',
    unit: ''
  });
  const [openClearConfirmDialog, setOpenClearConfirmDialog] = useState(false);
  const [clearMenuAnchor, setClearMenuAnchor] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanNotFoundOpen, setScanNotFoundOpen] = useState(false);
  const [scanNotFoundData, setScanNotFoundData] = useState({
    barcode: '',
    productName: '',
    quantity: '1',
    unit: 'piece',
  });
  const [newIngredientToComplete, setNewIngredientToComplete] = useState(null);

  const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];
  const ingredientCategories = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];
  const { startTask, markHydrated, showBusyBar, showSkeleton } = useProgressiveLoader();

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

  const disablePageActions = showSkeleton || showBusyBar;
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
  const invalidateShoppingCache = useCallback(() => {
    api.invalidateCache((key) => key.includes('/shopping-list'));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const fetchAll = async () => {
      await runTask(async () => {
        await Promise.all([fetchShoppingList({ forceRefresh: true }), fetchIngredients({ forceRefresh: true })]);
      }, { hydrate: true });
    };
    fetchAll();
  }, [authenticated, runTask]);

  const fetchShoppingList = async ({ forceRefresh = false } = {}) => {
    try {
      setError('');
      const response = await api.cachedGet('/shopping-list', {
        cacheTtl: 45 * 1000,
        forceRefresh,
      });
      if (Array.isArray(response.data)) {
        setShoppingItems(response.data);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      setError('Failed to fetch shopping list');
    }
  };

  const fetchIngredients = async ({ forceRefresh = false } = {}) => {
    try {
      const response = await api.cachedGet('/ingredients', {
        cacheTtl: 5 * 60 * 1000,
        forceRefresh,
      });
      setIngredients(response.data);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to load ingredients');
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      const response = await api.patch(`/shopping-list/${item._id}`, { completed: !item.completed });
      
      // Check for achievements in response
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      
      invalidateShoppingCache();
      await fetchShoppingList({ forceRefresh: true });
    } catch (err) {
      toast.error('Failed to update item status');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/shopping-list/${id}`);
      invalidateShoppingCache();
      await fetchShoppingList({ forceRefresh: true });
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const handleAddToPantry = async (item) => {
    if (!item.completed) {
      toast.error('Please check off the item first to indicate it has been purchased');
      return;
    }

    try {
      const response = await api.post('/pantry', {
        ingredient: item.ingredient._id,
        quantity: item.quantity,
        unit: item.unit
      });
      
      // Check for achievements in response
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      
      await handleDeleteItem(item._id);
      toast.success('Added to pantry');
    } catch (err) {
      console.error('Error adding to pantry:', err);
      toast.error('Failed to add to pantry');
    }
  };

  const handleAddAllToPantry = async () => {
    const completedItems = shoppingItems.filter(item => item.completed);
    if (completedItems.length === 0) {
      toast.error('No completed items to add to pantry');
      return;
    }

    try {
      await runTask(async () => {
        const response = await api.post('/pantry/add-all-from-shopping-list');
        if (response.data.achievements && response.data.achievements.length > 0) {
          showAchievements(response.data.achievements);
        }
        invalidateShoppingCache();
        await fetchShoppingList({ forceRefresh: true });
      });
      toast.success(`Added ${completedItems.length} item${completedItems.length !== 1 ? 's' : ''} to pantry!`);
    } catch (err) {
      console.error('Error adding items to pantry:', err);
      toast.error('Failed to add items to pantry');
    }
  };

  const handleUpdateFromMealPlan = async () => {
    try {
      await runTask(async () => {
        const response = await api.post('/shopping-list/update-from-meal-plan');
        if (response.data.achievements && response.data.achievements.length > 0) {
          showAchievements(response.data.achievements);
        }
        invalidateShoppingCache();
        await fetchShoppingList({ forceRefresh: true });
      });
      toast.success('Updated from meal plan');
    } catch (err) {
      console.error('Error updating from meal plan:', err);
      toast.error('Failed to update from meal plan');
    }
  };

  const handleCheckAll = async () => {
    try {
      await runTask(async () => {
        const allCompleted = shoppingItems.every(item => item.completed);
        const responses = await Promise.all(
          shoppingItems.map(item =>
            api.patch(`/shopping-list/${item._id}`, { completed: !allCompleted })
          )
        );
        const allAchievements = [];
        responses.forEach(response => {
          if (response.data.achievements && response.data.achievements.length > 0) {
            allAchievements.push(...response.data.achievements);
          }
        });
        if (allAchievements.length > 0) {
          showAchievements(allAchievements);
        }
        invalidateShoppingCache();
        await fetchShoppingList({ forceRefresh: true });
        toast.success(allCompleted ? 'All items unchecked!' : 'All items checked!');
      });
    } catch (err) {
      console.error('Error updating items:', err);
      toast.error('Failed to update items');
    }
  };

  const handleClearCompleted = async () => {
    try {
      await runTask(async () => {
        const response = await api.delete('/shopping-list/clear-completed');
        if (response.data.achievements && response.data.achievements.length > 0) {
          showAchievements(response.data.achievements);
        }
        invalidateShoppingCache();
        await fetchShoppingList({ forceRefresh: true });
      });
      toast.success('Completed items cleared');
    } catch (err) {
      console.error('Error clearing completed items:', err);
      toast.error('Failed to clear completed items');
    }
  };

  const handleClearAll = async () => {
    try {
      await runTask(async () => {
        await api.delete('/shopping-list');
        invalidateShoppingCache();
        setShoppingItems([]);
      });
      toast.success('All shopping list items cleared successfully');
    } catch (err) {
      console.error('Error clearing shopping list:', err);
      toast.error('Failed to clear shopping list items');
    } finally {
      setOpenClearConfirmDialog(false);
    }
  };

  const handleBarcodeDetected = async (barcode) => {
    setScannerOpen(false);
    const code = extractBarcode(barcode);
    if (!code) {
      toast.error('Could not read barcode. Try scanning a product barcode (not a QR code).');
      return;
    }
    try {
      const product = await lookupBarcode(barcode);
      const { productName, category, quantity, unit } = product;

      // Find existing ingredient by name (case-insensitive)
      let ingredientId = ingredients.find(
        (ing) => ing.name.toLowerCase() === productName.toLowerCase()
      )?._id;

      // If no match, create new ingredient
      if (!ingredientId) {
        const response = await api.post('/ingredients', {
          name: productName,
          category,
          description: `Added from barcode scan`,
        });
        ingredientId = response.data._id;
        await fetchIngredients();
      }

      setFormData({
        ingredient: ingredientId,
        quantity: quantity.toString(),
        unit: unit || 'piece',
      });
      setOpenDialog(true);
      toast.success(`Found: ${productName}`);
    } catch (err) {
      console.error('Barcode lookup failed:', err?.response?.status, err?.response?.data, err?.message);
      const msg = err.response?.status === 404
        ? 'Product not in database'
        : err.response?.data?.error || err?.message || 'Lookup failed';
      toast.error(msg);
      setScanNotFoundData({
        barcode: code,
        productName: '',
        quantity: '1',
        unit: 'piece',
      });
      setScanNotFoundOpen(true);
    }
  };

  const handleScanNotFoundSubmit = async (e) => {
    e.preventDefault();
    const name = (scanNotFoundData.productName || '').trim();
    if (!name) {
      toast.error('Please enter the product name');
      return;
    }
    try {
      let ingredientId = ingredients.find((ing) => ing.name.toLowerCase() === name.toLowerCase())?._id;
      let wasNewIngredient = false;
      if (!ingredientId) {
        const response = await api.post('/ingredients', {
          name: capitalizeWords(name),
          category: 'Other',
          description: scanNotFoundData.barcode ? 'Scanned barcode (not in database)' : 'Added from scan',
        });
        ingredientId = response.data._id;
        wasNewIngredient = true;
        await fetchIngredients();
      }
      const quantity = Number(scanNotFoundData.quantity) || 1;
      const unit = scanNotFoundData.unit || 'piece';
      const response = await api.post('/shopping-list', {
        ingredient: ingredientId,
        quantity,
        unit,
      });
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      setScanNotFoundOpen(false);
      setScanNotFoundData({ barcode: '', productName: '', quantity: '1', unit: 'piece' });
      invalidateShoppingCache();
      await fetchShoppingList({ forceRefresh: true });
      toast.success('Added to shopping list');
      if (wasNewIngredient) {
        setNewIngredientToComplete({ id: ingredientId, name: capitalizeWords(name), category: 'Other', description: '' });
      }
    } catch (createErr) {
      if (createErr.response?.status === 409) {
        const existing = ingredients.find((ing) => ing.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          try {
            await api.post('/shopping-list', {
              ingredient: existing._id,
              quantity: Number(scanNotFoundData.quantity) || 1,
              unit: scanNotFoundData.unit || 'piece',
            });
            setScanNotFoundOpen(false);
            setScanNotFoundData({ barcode: '', productName: '', quantity: '1', unit: 'piece' });
            invalidateShoppingCache();
            await fetchShoppingList({ forceRefresh: true });
            toast.success('Added to shopping list');
          } catch (addErr) {
            toast.error(addErr.response?.data?.error || 'Failed to add to shopping list');
          }
          return;
        }
      }
      toast.error(createErr.response?.data?.error || 'Could not add item');
    }
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    const hasIngredient = formData.ingredient && !formData.ingredientName;
    const hasNewName = (formData.ingredientName || '').trim().length > 0;
    if ((!hasIngredient && !hasNewName) || !formData.quantity || !formData.unit) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      let ingredientId = formData.ingredient;
      if (hasNewName) {
        const name = formData.ingredientName.trim();
        const existing = ingredients.find((ing) => ing.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          ingredientId = existing._id;
        } else {
          const createRes = await api.post('/ingredients', {
            name: capitalizeWords(name),
            category: 'Other',
            description: 'Added from shopping list',
          });
          ingredientId = createRes.data._id;
          await fetchIngredients();
        }
      }
      const wasNewIngredient = hasNewName && !ingredients.find((ing) => ing.name.toLowerCase() === formData.ingredientName.trim().toLowerCase());
      const response = await api.post('/shopping-list', {
        ingredient: ingredientId,
        quantity: Number(formData.quantity),
        unit: formData.unit,
      });
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      setOpenDialog(false);
      setFormData({ ingredient: '', ingredientName: '', category: 'Other', description: '', quantity: '', unit: '' });
      invalidateShoppingCache();
      await fetchShoppingList({ forceRefresh: true });
      toast.success('Added to shopping list');
      if (wasNewIngredient) {
        setNewIngredientToComplete({
          id: ingredientId,
          name: capitalizeWords(formData.ingredientName.trim()),
          category: 'Other',
          description: '',
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add item');
    }
  };

  const handleCloseAddDialog = () => {
    setOpenDialog(false);
    setFormData({ ingredient: '', ingredientName: '', category: 'Other', description: '', quantity: '', unit: '' });
  };

  const handleSaveNewIngredientDetails = async (e) => {
    e?.preventDefault?.();
    if (!newIngredientToComplete) return;
    try {
      await api.put(`/ingredients/${newIngredientToComplete.id}`, {
        category: ingredientCategories.includes(newIngredientToComplete.category) ? newIngredientToComplete.category : 'Other',
        description: (newIngredientToComplete.description || '').trim() || undefined,
      });
      await fetchIngredients();
      setNewIngredientToComplete(null);
      toast.success('Ingredient details updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update ingredient');
    }
  };

  const handleSkipNewIngredientDetails = () => {
    setNewIngredientToComplete(null);
  };

  // Sort shopping items based on current sort setting
  const sortedShoppingItems = [...shoppingItems]
    .filter((item) => 
      item.ingredient?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.ingredient?.name || '').localeCompare(b.ingredient?.name || '');
        case 'name-desc':
          return (b.ingredient?.name || '').localeCompare(a.ingredient?.name || '');
        case 'quantity':
          return a.quantity - b.quantity;
        case 'quantity-desc':
          return b.quantity - a.quantity;
        case 'completed':
          return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
        case 'completed-desc':
          return (a.completed === b.completed) ? 0 : a.completed ? -1 : 1;
        default:
          return 0;
      }
    });

  if (showSkeleton) {
    return (
      <PageLoader
        headingWidth="35%"
        maxWidth="xl"
        blocks={[
          { height: 140, xs: 12 },
          { height: 320, xs: 12 },
          { height: 320, xs: 12 },
        ]}
      />
    );
  }

  return (
    <Container 
      maxWidth={false}
      sx={{ 
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 3, md: 4, lg: 6, xl: 8 }
      }}
    >
      {busyIndicator}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping List
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort by"
              startAdornment={<SortIcon sx={{ mr: 1, fontSize: 20 }} />}
            >
              <MenuItem value="name">Name (A-Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z-A)</MenuItem>
              <MenuItem value="quantity">Quantity (Low-High)</MenuItem>
              <MenuItem value="quantity-desc">Quantity (High-Low)</MenuItem>
              <MenuItem value="completed">Completed First</MenuItem>
              <MenuItem value="completed-desc">Not Completed First</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="error"
            onClick={(e) => setClearMenuAnchor(e.currentTarget)}
            startIcon={<DeleteIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            size="small"
            disabled={disablePageActions || shoppingItems.length === 0}
          >
            Clear
          </Button>
          <Menu
            anchorEl={clearMenuAnchor}
            open={Boolean(clearMenuAnchor)}
            onClose={() => setClearMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() => {
                setClearMenuAnchor(null);
                handleClearCompleted();
              }}
              disabled={!shoppingItems.some(item => item.completed)}
            >
              Clear Completed
            </MenuItem>
            <MenuItem
              onClick={() => {
                setClearMenuAnchor(null);
                setOpenClearConfirmDialog(true);
              }}
            >
              Clear All
            </MenuItem>
          </Menu>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckAll}
            startIcon={<CheckCircleIcon />}
            size="small"
            disabled={disablePageActions || shoppingItems.length === 0}
          >
            {shoppingItems.every(item => item.completed) ? 'Uncheck All' : 'Check All'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddAllToPantry}
            startIcon={<AddShoppingCartIcon />}
            size="small"
          >
            Add to Pantry
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateFromMealPlan}
            startIcon={<AddIcon />}
            size="small"
          >
            Auto Update
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setFormData({ ingredient: '', ingredientName: '', category: 'Other', description: '', quantity: '', unit: '' });
              setOpenDialog(true);
            }}
            size="small"
          >
            Add Item
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setScannerOpen(true)}
            startIcon={<QrCodeScannerIcon />}
            size="small"
          >
            Scan Barcode
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {shoppingItems.length === 0 ? (
        <EmptyState
          icon={<AddIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
          title="Your shopping list is empty"
          description="Add items manually, scan a barcode, or use Auto Update to add ingredients from your meal plan."
          primaryAction={{ label: 'Add Item', onClick: () => { setFormData({ ingredient: '', ingredientName: '', category: 'Other', description: '', quantity: '', unit: '' }); setOpenDialog(true); } }}
          secondaryAction={{ label: 'Auto Update', onClick: handleUpdateFromMealPlan }}
          tertiaryAction={{ label: 'Scan Barcode', onClick: () => setScannerOpen(true), startIcon: <QrCodeScannerIcon /> }}
        />
      ) : (
        <Grid container spacing={2}>
          {(() => {
            // Group items by ingredient name
            const groupedItems = sortedShoppingItems.reduce((groups, item) => {
              const ingredientName = item.ingredient?.name || 'Unknown Ingredient';
              if (!groups[ingredientName]) {
                groups[ingredientName] = [];
              }
              groups[ingredientName].push(item);
              return groups;
            }, {});

            return Object.entries(groupedItems).map(([ingredientName, items]) => (
              <Grid item xs={12} sm={6} md={4} key={ingredientName}>
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
                  {/* Ingredient Name Header */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: 'text.primary',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <Box
                        component="span"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                          fontSize: '0.9rem'
                        }}
                      >
                        {capitalizeWords(ingredientName)}
                      </Box>
                    </Box>
                    {items.length > 1 && (
                      <Chip
                        label={`${items.length} units`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Typography>

                  {/* Individual Items */}
                  <Box sx={{ flex: 1 }}>
                    {items.map((item, index) => (
                      <Box
                        key={item._id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: index < items.length - 1 ? 1 : 0,
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.03)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <Checkbox
                          checked={item.completed}
                          onChange={() => handleToggleComplete(item)}
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography 
                              variant="body2" 
                              color="textSecondary"
                              sx={{
                                textDecoration: item.completed ? 'line-through' : 'none',
                                color: item.completed ? 'text.disabled' : 'text.secondary',
                              }}
                            >
                              {item.pantryQuantity > 0 
                                ? `${item.pantryQuantity}/${item.quantity + item.pantryQuantity}` 
                                : item.quantity
                              } {item.unit}
                            </Typography>
                            {item.pantryQuantity > 0 && (
                              <Box sx={{ width: '30px', ml: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(100, (item.pantryQuantity / (item.quantity + item.pantryQuantity)) * 100)}
                                  sx={{
                                    height: 3,
                                    borderRadius: 1.5,
                                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 1.5,
                                      backgroundColor: (theme) => {
                                        const percentage = (item.pantryQuantity / (item.quantity + item.pantryQuantity)) * 100;
                                        if (percentage >= 100) return theme.palette.success.main;
                                        if (percentage >= 50) return theme.palette.warning.main;
                                        return theme.palette.error.main;
                                      },
                                    },
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleAddToPantry(item)}
                            disabled={!item.completed}
                            sx={{ 
                              color: 'success.main',
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(76, 175, 80, 0.1)'
                                  : 'rgba(76, 175, 80, 0.05)',
                              },
                            }}
                          >
                            <AddShoppingCartIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteItem(item._id)}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(244, 67, 54, 0.1)'
                                  : 'rgba(244, 67, 54, 0.05)',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Group Actions */}
                  {items.length > 1 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mt: 1, 
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Total: {items.reduce((sum, item) => sum + item.quantity, 0)} units
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          items.forEach(item => {
                            if (!item.completed) handleToggleComplete(item);
                          });
                        }}
                        disabled={items.every(item => item.completed)}
                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                      >
                        Check All
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          items.forEach(item => {
                            if (item.completed) handleToggleComplete(item);
                          });
                        }}
                        disabled={items.every(item => !item.completed)}
                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                      >
                        Uncheck All
                      </Button>
                    </Box>
                  </Box>
                  )}
                </Paper>
              </Grid>
            ));
          })()}
        </Grid>
      )}

      {/* Add Item Dialog */}
      <Dialog open={openDialog} onClose={handleCloseAddDialog} fullScreen={isMobile}>
        <DialogTitle>Add to Shopping List</DialogTitle>
        <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
          <Box sx={{ mt: 2, mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<QrCodeScannerIcon />}
              onClick={() => setScannerOpen(true)}
            >
              Scan Barcode
            </Button>
          </Box>
          <Box component="form" onSubmit={handleAddItemSubmit}>
            <Autocomplete
              freeSolo
              options={ingredients}
              value={
                formData.ingredientName
                  ? formData.ingredientName
                  : formData.ingredient
                    ? ingredients.find((i) => i._id === formData.ingredient) || null
                    : null
              }
              getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
              isOptionEqualToValue={(option, value) =>
                typeof value === 'string' ? option?.name?.toLowerCase() === value?.toLowerCase() : option?._id === value?._id
              }
              filterOptions={(options, state) => {
                const input = (state.inputValue || '').trim();
                const inputLower = input.toLowerCase();
                const filtered = options.filter((opt) => opt.name.toLowerCase().includes(inputLower));
                if (input && !filtered.some((opt) => opt.name.toLowerCase() === inputLower)) {
                  return [...filtered, { _id: '__new__', name: input, isNew: true }];
                }
                return filtered;
              }}
              onChange={(e, value) => {
                if (value?.isNew || (typeof value === 'string' && value.trim())) {
                  setFormData({ ...formData, ingredient: '', ingredientName: typeof value === 'string' ? value.trim() : value.name });
                } else if (value && typeof value === 'object' && value._id && value._id !== '__new__') {
                  setFormData({ ...formData, ingredient: value._id, ingredientName: '' });
                } else {
                  setFormData({ ...formData, ingredient: '', ingredientName: '' });
                }
              }}
              onInputChange={(e, inputValue) => {
                const trimmed = (inputValue || '').trim();
                const matches = ingredients.find((i) => i.name.toLowerCase() === trimmed.toLowerCase());
                if (matches) {
                  setFormData((prev) => ({ ...prev, ingredient: matches._id, ingredientName: '' }));
                } else {
                  setFormData((prev) => ({ ...prev, ingredient: '', ingredientName: trimmed }));
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Ingredient" required sx={{ mb: 2 }} />
              )}
              fullWidth
            />
            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              fullWidth
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: 0.1 }}
            />
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Unit</InputLabel>
              <Select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                label="Unit"
              >
                {validUnits.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddItemSubmit} variant="contained" color="primary">
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={openClearConfirmDialog}
        onClose={() => setOpenClearConfirmDialog(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>Clear Shopping List</DialogTitle>
        <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
          <Typography>
            Are you sure you want to remove all items from your shopping list? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearConfirmDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClearAll} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scan: Product not found – enter name manually */}
      <Dialog open={scanNotFoundOpen} onClose={() => setScanNotFoundOpen(false)} fullScreen={isMobile}>
        <Box component="form" onSubmit={handleScanNotFoundSubmit}>
          <DialogTitle>Product not found</DialogTitle>
          <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              The barcode wasn&apos;t in our database. Enter the product name to add it to your shopping list.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Product name"
                value={scanNotFoundData.productName}
                onChange={(e) => setScanNotFoundData({ ...scanNotFoundData, productName: e.target.value })}
                required
                fullWidth
                autoFocus
                placeholder="e.g. Organic milk"
              />
              <TextField
                label="Quantity"
                type="number"
                value={scanNotFoundData.quantity}
                onChange={(e) => setScanNotFoundData({ ...scanNotFoundData, quantity: e.target.value })}
                fullWidth
                inputProps={{ min: 0.1, step: 0.1 }}
              />
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={scanNotFoundData.unit}
                  onChange={(e) => setScanNotFoundData({ ...scanNotFoundData, unit: e.target.value })}
                  label="Unit"
                >
                  {validUnits.map((unit) => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setScanNotFoundOpen(false)} color="primary">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Add to list
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* After adding a new ingredient: optional details (category, description) */}
      <Dialog
        open={Boolean(newIngredientToComplete)}
        onClose={handleSkipNewIngredientDetails}
        fullScreen={isMobile}
      >
        <DialogTitle>Add details for &quot;{newIngredientToComplete?.name}&quot;</DialogTitle>
        <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            You can set a category and description now, or skip and edit later in Ingredients.
          </Typography>
          {newIngredientToComplete && (
            <Box component="form" onSubmit={handleSaveNewIngredientDetails} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Category (tag)</InputLabel>
                <Select
                  value={newIngredientToComplete.category}
                  onChange={(e) => setNewIngredientToComplete((prev) => prev && { ...prev, category: e.target.value })}
                  label="Category (tag)"
                >
                  {ingredientCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Description (optional)"
                value={newIngredientToComplete.description}
                onChange={(e) => setNewIngredientToComplete((prev) => prev && { ...prev, description: e.target.value })}
                fullWidth
                multiline
                minRows={2}
                placeholder="e.g. Added from shopping list"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkipNewIngredientDetails} color="primary">
            Skip
          </Button>
          <Button onClick={handleSaveNewIngredientDetails} variant="contained" color="primary">
            Save details
          </Button>
        </DialogActions>
      </Dialog>

      <BarcodeScanner
        open={scannerOpen}
        onDetected={handleBarcodeDetected}
        onClose={() => setScannerOpen(false)}
      />
    </Container>
  );
};

export default ShoppingList;
