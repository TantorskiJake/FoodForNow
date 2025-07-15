import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Chip,
  useTheme,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  AddShoppingCart as AddShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { getCategoryColor } from '../utils/categoryColors';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import useMediaQuery from '@mui/material/useMediaQuery';

const ShoppingList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { authenticated } = useAuth();
  const { showAchievements } = useAchievements();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [formData, setFormData] = useState({
    ingredient: '',
    quantity: '',
    unit: ''
  });
  const [openClearConfirmDialog, setOpenClearConfirmDialog] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');

  const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'];

  useEffect(() => {
    if (!authenticated) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchShoppingList(), fetchIngredients()]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [authenticated]);

  const fetchShoppingList = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/shopping-list');
      if (Array.isArray(response.data)) {
        setShoppingItems(response.data);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      setError('Failed to fetch shopping list');
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
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
      
      fetchShoppingList();
    } catch (err) {
      toast.error('Failed to update item status');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/shopping-list/${id}`);
      fetchShoppingList();
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
    try {
      setLoading(true);
      
      // Get all completed items
      const completedItems = shoppingItems.filter(item => item.completed);
      
      if (completedItems.length === 0) {
        toast.error('No completed items to add to pantry');
        return;
      }
      
      const response = await api.post('/pantry/add-all-from-shopping-list');
      
      // Check for achievements in response
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      
      fetchShoppingList();
      toast.success(`Added ${completedItems.length} item${completedItems.length !== 1 ? 's' : ''} to pantry!`);
    } catch (err) {
      console.error('Error adding items to pantry:', err);
      toast.error('Failed to add items to pantry');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFromMealPlan = async () => {
    try {
      const response = await api.post('/shopping-list/update-from-meal-plan');
      
      // Check for achievements in response
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      
      fetchShoppingList();
      toast.success('Updated from meal plan');
    } catch (err) {
      console.error('Error updating from meal plan:', err);
      toast.error('Failed to update from meal plan');
    }
  };

  const handleCheckAll = async () => {
    try {
      setLoading(true);
      // Check if all items are completed
      const allCompleted = shoppingItems.every(item => item.completed);
      
      // Update all items in parallel and collect responses
      const responses = await Promise.all(
        shoppingItems.map(item =>
          api.patch(`/shopping-list/${item._id}`, { completed: !allCompleted })
        )
      );
      
      // Check for achievements in any of the responses
      const allAchievements = [];
      responses.forEach(response => {
        if (response.data.achievements && response.data.achievements.length > 0) {
          allAchievements.push(...response.data.achievements);
        }
      });
      
      // Show achievements if any were unlocked
      if (allAchievements.length > 0) {
        showAchievements(allAchievements);
      }
      
      // Refresh the shopping list
      await fetchShoppingList();
      toast.success(allCompleted ? 'All items unchecked!' : 'All items checked!');
    } catch (err) {
      console.error('Error updating items:', err);
      toast.error('Failed to update items');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setLoading(true);
      await api.delete('/shopping-list');
      setShoppingItems([]); // Immediately clear the items in the state
      toast.success('All shopping list items cleared successfully');
    } catch (err) {
      console.error('Error clearing shopping list:', err);
      toast.error('Failed to clear shopping list items');
    } finally {
      setLoading(false);
      setOpenClearConfirmDialog(false);
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
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
            onClick={() => setOpenClearConfirmDialog(true)}
            startIcon={<DeleteIcon />}
            size="small"
            disabled={loading || shoppingItems.length === 0}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckAll}
            startIcon={<CheckCircleIcon />}
            size="small"
            disabled={loading || shoppingItems.length === 0}
          >
            {shoppingItems.every(item => item.completed) ? 'Uncheck All' : 'Check All'}
          </Button>
          <Button
            variant="contained"
            color="success"
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
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : shoppingItems.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your shopping list is empty
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Click "Auto Update" to add ingredients from your meal plan
          </Typography>
        </Paper>
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
                    {ingredientName}
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
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mt: 1, 
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </Typography>
                      {items.length > 1 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Total: {items.reduce((sum, item) => sum + item.quantity, 0)} units
                        </Typography>
                      )}
                    </Box>
                    {items.length > 1 && (
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
                    )}
                  </Box>
                </Paper>
              </Grid>
            ));
          })()}
        </Grid>
      )}

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
    </Container>
  );
};

export default ShoppingList;