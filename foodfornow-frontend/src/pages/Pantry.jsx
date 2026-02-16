import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  useTheme,
  LinearProgress,
  useMediaQuery,
  Autocomplete
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AddShoppingCart as AddShoppingCartIcon,
  Sort as SortIcon,
  QrCodeScanner as QrCodeScannerIcon
} from '@mui/icons-material';
import api from '../services/api';
import { getCategoryColor } from '../utils/categoryColors';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import BarcodeScanner from '../components/BarcodeScanner';
import EmptyState from '../components/EmptyState';
import { lookupBarcode, extractBarcode } from '../services/barcodeLookup';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../components/PageLoader';
import useProgressiveLoader from '../hooks/useProgressiveLoader';

const capitalizeWords = (str) => str ? str.replace(/\b\w/g, (c) => c.toUpperCase()) : str;

const Pantry = () => {
  const navigate = useNavigate();
  const [pantryItems, setPantryItems] = useState([]);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    ingredient: '',
    ingredientName: '',
    ingredientCategory: '',
    ingredientDescription: '',
    quantity: '',
    unit: '',
    expiryDate: '',
  });
  const [ingredients, setIngredients] = useState([]);
  const [units] = useState(['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box']);
  const categories = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openClearConfirmDialog, setOpenClearConfirmDialog] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const { authenticated } = useAuth();
  const { showAchievements } = useAchievements();
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
  const invalidatePantryCache = useCallback(() => {
    api.invalidateCache((key) => key.includes('/pantry'));
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    const fetchAll = async () => {
      await runTask(async () => {
        await Promise.all([fetchPantryItems({ forceRefresh: true }), fetchIngredients({ forceRefresh: true })]);
      }, { hydrate: true });
    };

    fetchAll();
  }, [authenticated, runTask]);

  const fetchPantryItems = async ({ forceRefresh = false } = {}) => {
    try {
      const response = await api.cachedGet('/pantry', {
        cacheTtl: 60 * 1000,
        forceRefresh,
      });
      if (response.data && response.data.items) {
        setPantryItems(response.data.items);
      } else {
        setPantryItems([]);
      }
    } catch (err) {
      console.error('Error fetching pantry items:', err);
      setError('Failed to fetch pantry items. Please try again.');
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
      setError('Failed to fetch ingredients. Please try again.');
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ingredient: item.ingredient._id,
        ingredientName: '', // When editing, user can type new name to rename
        ingredientCategory: item.ingredient.category || '',
        ingredientDescription: item.ingredient.description || '',
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        ingredient: '',
        ingredientName: '',
        ingredientCategory: '',
        ingredientDescription: '',
        quantity: '',
        unit: '',
        expiryDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({
      ingredient: '',
      ingredientName: '',
      ingredientCategory: '',
      ingredientDescription: '',
      quantity: '',
      unit: '',
      expiryDate: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const hasIngredient = formData.ingredient || (formData.ingredientName && formData.ingredientName.trim());
      const isNewIngredient = formData.ingredientName && formData.ingredientName.trim();
      if (!hasIngredient || !formData.quantity || !formData.unit) {
        setError('Please fill in all required fields');
        return;
      }
      if (isNewIngredient && !formData.ingredientCategory) {
        setError('Please select a category for the new ingredient');
        return;
      }

      const submitData = {
        quantity: Number(formData.quantity),
        unit: formData.unit
      };
      if (formData.ingredient) {
        submitData.ingredient = formData.ingredient;
        if (formData.ingredientName && formData.ingredientName.trim()) {
          submitData.ingredientName = formData.ingredientName.trim();
          submitData.ingredientCategory = formData.ingredientCategory;
          submitData.ingredientDescription = formData.ingredientDescription;
        }
      } else {
        submitData.ingredientName = formData.ingredientName.trim();
        submitData.ingredientCategory = formData.ingredientCategory;
        submitData.ingredientDescription = formData.ingredientDescription;
      }

      if (formData.expiryDate) {
        submitData.expiryDate = formData.expiryDate;
      }

      let response;
      if (editingItem) {
        response = await api.patch(`/pantry/items/${editingItem._id}`, submitData);
      } else {
        response = await api.post('/pantry', submitData);
        
        // Check for achievements in response
        if (response.data.achievements && response.data.achievements.length > 0) {
          showAchievements(response.data.achievements);
        }
      }
      
      if (response && response.data) {
        handleCloseDialog();
        invalidatePantryCache();
        await Promise.all([
          fetchPantryItems({ forceRefresh: true }),
          fetchIngredients({ forceRefresh: true })
        ]);
        setFormData({
          ingredient: '',
          ingredientName: '',
          ingredientCategory: '',
          ingredientDescription: '',
          quantity: '',
          unit: '',
          expiryDate: ''
        });
      } else {
        throw new Error('No response data received');
      }
      
    } catch (err) {
      console.error('Error saving pantry item:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save pantry item. Please try again.');
      }
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/pantry/${id}`);
      invalidatePantryCache();
      await fetchPantryItems({ forceRefresh: true });
    } catch (err) {
      console.error('Error deleting pantry item:', err);
      setError('Failed to delete pantry item. Please try again.');
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    try {
      await api.put(`/pantry/${id}/quantity`, { quantity: newQuantity });
      invalidatePantryCache();
      await fetchPantryItems({ forceRefresh: true });
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity. Please try again.');
    }
  };

  const handleAddToShoppingList = async (item) => {
    try {
      const response = await api.post('/shopping-list', {
        ingredient: item.ingredient._id,
        quantity: item.quantity,
        unit: item.unit
      });
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      toast.success(`Added ${item.quantity} ${item.unit} ${item.ingredient.name} to shopping list`);
    } catch (err) {
      console.error('Error adding to shopping list:', err);
      toast.error('Failed to add to shopping list');
    }
  };

  const handleClearAll = async () => {
    try {
      await runTask(async () => {
        await api.delete('/pantry');
        invalidatePantryCache();
        setPantryItems([]);
      });
      toast.success('All pantry items cleared successfully');
    } catch (err) {
      console.error('Error clearing pantry:', err);
      toast.error('Failed to clear pantry items');
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
        expiryDate: '',
      });
      setEditingItem(null);
      setOpenDialog(true);
      toast.success(`Found: ${productName}`);
    } catch (err) {
      console.error('Barcode lookup failed:', err?.response?.status, err?.response?.data, err?.message);
      // Fallback: product not in Open Food Facts - create placeholder so user can still add
      const msg = err.response?.status === 404
        ? 'Product not in database - add manually'
        : err.response?.data?.error || err?.message || 'Lookup failed - add manually';
      toast.error(msg);
      try {
        const response = await api.post('/ingredients', {
          name: `Product (barcode: ${code})`,
          category: 'Other',
          description: `Scanned barcode - edit name as needed`,
        });
        const ingredientId = response.data._id;
        await fetchIngredients();
        setFormData({
          ingredient: ingredientId,
          quantity: '1',
          unit: 'piece',
          expiryDate: '',
        });
        setEditingItem(null);
        setOpenDialog(true);
      } catch (createErr) {
        // If duplicate (409), find existing and use it
        if (createErr.response?.status === 409) {
          const existing = ingredients.find(
            (ing) => ing.name.toLowerCase().includes(`barcode: ${code}`)
          );
          if (existing) {
            setFormData({
              ingredient: existing._id,
              quantity: '1',
              unit: 'piece',
              expiryDate: '',
            });
            setEditingItem(null);
            setOpenDialog(true);
            return;
          }
        }
        toast.error('Could not add item. Please add manually.');
        setFormData({
          ingredient: '',
          quantity: '',
          unit: '',
          expiryDate: '',
        });
        setEditingItem(null);
        setOpenDialog(true);
      }
    }
  };

  // Filter and sort pantry items
  const filteredItems = pantryItems
    .filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return item.ingredient?.name?.toLowerCase().includes(searchLower) ||
             item.ingredient?.category?.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.ingredient?.name || '').localeCompare(b.ingredient?.name || '');
        case 'name-desc':
          return (b.ingredient?.name || '').localeCompare(a.ingredient?.name || '');
        case 'category':
          return (a.ingredient?.category || '').localeCompare(b.ingredient?.category || '');
        case 'quantity':
          return parseFloat(a.quantity) - parseFloat(b.quantity);
        case 'quantity-desc':
          return parseFloat(b.quantity) - parseFloat(a.quantity);
        case 'expiry':
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        default:
          return 0;
      }
    });

  const PantryItem = ({ item, onEdit, onDelete }) => {
    const theme = useTheme();
    
    return (
      <ListItem
        sx={{
          py: 2,
          px: 3,
        }}
      >
        <ListItemText
          primary={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
              {capitalizeWords(item.ingredient.name)}
            </Typography>
          }
          secondary={
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={capitalizeWords(item.ingredient.category)}
                  size="small"
                  sx={{
                    backgroundColor: getCategoryColor(item.ingredient.category).main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: getCategoryColor(item.ingredient.category).dark,
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {item.quantity} {item.unit}
                </Typography>
              </Box>
              {item.expiryDate && (
                <Typography variant="body2" color="text.secondary">
                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          }
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            edge="end"
            aria-label="edit"
            onClick={onEdit}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.main + '20',
              },
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={onDelete}
            sx={{
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: theme.palette.error.main + '20',
              },
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </ListItem>
    );
  };

  if (showSkeleton) {
    return (
      <PageLoader
        headingWidth="30%"
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
          Pantry
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search ingredients..."
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
              <MenuItem value="category">Category (A-Z)</MenuItem>
              <MenuItem value="quantity">Quantity (Low-High)</MenuItem>
              <MenuItem value="quantity-desc">Quantity (High-Low)</MenuItem>
              <MenuItem value="expiry">Expiry (Soonest)</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenClearConfirmDialog(true)}
            startIcon={<DeleteIcon />}
            size="small"
            disabled={disablePageActions || pantryItems.length === 0}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
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

      {pantryItems.length === 0 ? (
        <EmptyState
          icon={<AddIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
          title="No items in your pantry"
          description="Add your first item manually, or add ingredients from your meal plan on the Dashboard."
          primaryAction={{ label: 'Add Item', onClick: () => handleOpenDialog() }}
          secondaryAction={{ label: 'Go to Dashboard', onClick: () => navigate('/dashboard') }}
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(280px, 1fr))',
            },
            gap: 2,
          }}
        >
          {(() => {
            // Group items by ingredient name
            const groupedItems = filteredItems.reduce((groups, item) => {
              const ingredientName = item.ingredient?.name || 'Unknown Ingredient';
              if (!groups[ingredientName]) {
                groups[ingredientName] = [];
              }
              groups[ingredientName].push(item);
              return groups;
            }, {});

            return Object.entries(groupedItems).map(([ingredientName, items]) => (
              <Box key={ingredientName}>
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
                          gap: 1,
                          mb: index < items.length - 1 ? 1 : 0,
                          p: 1,
                          borderRadius: 1,
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.03)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: '0 1 auto' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="nowrap" minWidth={0}>
                            {item.ingredient?.category && (
                              <Chip
                                label={capitalizeWords(item.ingredient.category)}
                                size="small"
                                sx={{
                                  flexShrink: 0,
                                  backgroundColor: getCategoryColor(item.ingredient.category).main,
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  height: 20,
                                  '&:hover': {
                                    backgroundColor: getCategoryColor(item.ingredient.category).dark,
                                  },
                                }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{
                                fontWeight: 500,
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.quantity} {item.unit}
                            </Typography>
                          </Box>
                          {item.expiryDate && (
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                              Expires: {new Date(item.expiryDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(item)}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(25, 118, 210, 0.1)'
                                  : 'rgba(25, 118, 210, 0.05)',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
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

                  {/* Group Summary - only show when multiple items */}
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
                  </Box>
                  )}
                </Paper>
              </Box>
            ));
          })()}
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullScreen={isMobile} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Pantry Item' : 'Add Pantry Item'}</DialogTitle>
        <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              freeSolo
              options={ingredients}
              value={
                formData.ingredientName
                  ? formData.ingredientName
                  : formData.ingredient
                    ? ingredients.find((i) => i._id === formData.ingredient) || { _id: formData.ingredient, name: editingItem?.ingredient?.name || '' }
                    : null
              }
              getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name || '')}
              isOptionEqualToValue={(option, value) =>
                typeof value === 'string' ? option?.name?.toLowerCase() === value?.toLowerCase() : option?._id === value?._id
              }
              filterOptions={(options, state) => {
                const input = (state.inputValue || '').trim();
                const inputLower = input.toLowerCase();
                const filtered = options.filter((opt) =>
                  opt.name.toLowerCase().includes(inputLower)
                );
                if (input && !filtered.some((opt) => opt.name.toLowerCase() === inputLower)) {
                  return [...filtered, { _id: '__new__', name: input, isNew: true }];
                }
                return filtered;
              }}
              onChange={(e, value) => {
                if (value?.isNew) {
                  setFormData({ ...formData, ingredient: '', ingredientName: value.name });
                } else if (value && typeof value === 'object' && value._id && value._id !== '__new__') {
                  const ing = ingredients.find((i) => i._id === value._id);
                  setFormData({
                    ...formData,
                    ingredient: value._id,
                    ingredientName: '',
                    ingredientCategory: ing?.category || '',
                    ingredientDescription: ing?.description || ''
                  });
                } else if (typeof value === 'string' && value.trim()) {
                  setFormData({ ...formData, ingredient: '', ingredientName: value.trim() });
                } else {
                  setFormData({ ...formData, ingredient: '', ingredientName: '', ingredientCategory: '', ingredientDescription: '' });
                }
              }}
              onInputChange={(e, inputValue) => {
                if (editingItem && formData.ingredient) {
                  // When editing: typing updates the name for rename, keep ingredient ID
                  setFormData((prev) => ({ ...prev, ingredientName: inputValue || '' }));
                  return;
                }
                const matchesExisting = ingredients.some(
                  (i) => i.name.toLowerCase() === (inputValue || '').trim().toLowerCase()
                );
                if (matchesExisting) return;
                setFormData((prev) => ({
                  ...prev,
                  ingredient: '',
                  ingredientName: inputValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Ingredient" required />
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
              inputProps={{ min: 0, step: 0.1 }}
            />

            <FormControl fullWidth required>
              <InputLabel id="pantry-unit-label">Unit</InputLabel>
              <Select
                labelId="pantry-unit-label"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                label="Unit"
              >
                <MenuItem value="">
                  <em>Select unit</em>
                </MenuItem>
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Expiry Date (optional)"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            {(formData.ingredientName || editingItem) && (
              <>
                <FormControl fullWidth required={!!formData.ingredientName && !formData.ingredient}>
                  <InputLabel id="pantry-category-label">Category</InputLabel>
                  <Select
                    labelId="pantry-category-label"
                    value={formData.ingredientCategory}
                    onChange={(e) => setFormData({ ...formData, ingredientCategory: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="">
                      <em>{formData.ingredientName ? (editingItem ? 'Update category (optional)' : 'Select category for new ingredient') : 'For new ingredients only'}</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Description"
                  value={formData.ingredientDescription}
                  onChange={(e) => setFormData({ ...formData, ingredientDescription: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder={editingItem ? 'Update description (optional)' : 'Optional description (saved to Ingredients when adding a new ingredient)'}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openClearConfirmDialog}
        onClose={() => setOpenClearConfirmDialog(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>Clear All Pantry Items</DialogTitle>
        <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
          <Typography>
            Are you sure you want to remove all items from your pantry? This action cannot be undone.
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

      <BarcodeScanner
        open={scannerOpen}
        onDetected={handleBarcodeDetected}
        onClose={() => setScannerOpen(false)}
      />
    </Container>
  );
};

export default Pantry;
