import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCategoryColor } from '../utils/categoryColors';
import BarcodeScanner from '../components/BarcodeScanner';
import { lookupBarcode, extractBarcode } from '../services/barcodeLookup';
import { toast } from 'react-hot-toast';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const Ingredients = () => {
  const theme = useTheme();
  const { authenticated } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [myIngredients, setMyIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [tab, setTab] = useState('mine');
  const [sortBy, setSortBy] = useState('name');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    quantity: '',
  });
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    if (tab === 'mine') {
      fetchIngredients();
    } else {
      fetchSharedIngredients();
    }
  }, [tab, authenticated]);

  useEffect(() => {
    const filtered = ingredients.filter((ingredient) => {
      const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || ingredient.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    setFilteredIngredients(filtered);
  }, [searchTerm, ingredients, categoryFilter]);

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
      setIngredients(response.data);
      setMyIngredients(response.data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const fetchSharedIngredients = async () => {
    try {
      const response = await api.get('/ingredients/shared');
      setIngredients(response.data);
    } catch (error) {
      console.error('Error fetching shared ingredients:', error);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/ingredients/${id}/duplicate`);
      setTab('mine');
      await fetchIngredients();
    } catch (error) {
      console.error('Error duplicating ingredient:', error);
    }
  };

  const handleOpenDialog = (ingredient = null) => {
    if (ingredient) {
      setEditingIngredient({
        id: ingredient._id,
        name: ingredient.name,
        category: ingredient.category,
        description: ingredient.description || '',
      });
    } else {
      setEditingIngredient({
        name: '',
        category: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingIngredient(null);
    setFormData({
      name: '',
      category: '',
      unit: '',
      quantity: '',
    });
  };

  const handleSaveIngredient = async (e) => {
    e.preventDefault(); // Prevent form from submitting normally
    
    try {
      const ingredientData = {
        name: editingIngredient.name,
        category: editingIngredient.category,
        description: editingIngredient.description,
      };

      if (editingIngredient.id) {
        await api.put(`/ingredients/${editingIngredient.id}`, ingredientData);
      } else {
        await api.post('/ingredients', ingredientData);
      }

      setOpenDialog(false);
      fetchIngredients();
    } catch (error) {
      console.error('Error saving ingredient:', error);
    }
  };

  const handleDeleteIngredientClick = (ingredient) => {
    setIngredientToDelete(ingredient);
  };

  const handleDeleteIngredientConfirm = async () => {
    if (!ingredientToDelete) return;
    const ingredientId = String(ingredientToDelete._id);
    const previousIngredients = ingredients;
    setIngredients((prev) => prev.filter((i) => String(i._id) !== ingredientId));
    setIngredientToDelete(null);
    setDeleting(true);

    try {
      await api.delete(`/ingredients/${ingredientId}`);
      await fetchIngredients();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      setIngredients(previousIngredients);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to delete ingredient. Please try again.';
      toast.error(msg);
    } finally {
      setDeleting(false);
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
      const { productName, category } = product;

      // Find existing ingredient by name (case-insensitive)
      const existingIngredient = ingredients.find(
        (ing) => ing.name.toLowerCase() === productName.toLowerCase()
      );

      if (existingIngredient) {
        // Open dialog to edit existing ingredient
        handleOpenDialog(existingIngredient);
        toast.success(`Found existing ingredient: ${productName}`);
      } else {
        // Create new ingredient and open dialog to edit
        const response = await api.post('/ingredients', {
          name: productName,
          category: category || 'Other',
          description: `Added from barcode scan`,
        });
        await fetchIngredients();
        handleOpenDialog({ _id: response.data._id, name: productName, category: category || 'Other', description: 'Added from barcode scan' });
        toast.success(`Created new ingredient: ${productName}`);
      }
    } catch (err) {
      console.error('Barcode lookup failed:', err?.response?.status, err?.response?.data, err?.message);
      // Fallback: product not in Open Food Facts - create placeholder
      const msg = err.response?.status === 404
        ? 'Product not in database - creating placeholder'
        : err.response?.data?.error || err?.message || 'Lookup failed - creating placeholder';
      toast.error(msg);
      try {
        const response = await api.post('/ingredients', {
          name: `Product (barcode: ${code})`,
          category: 'Other',
          description: `Scanned barcode - edit name as needed`,
        });
        await fetchIngredients();
        handleOpenDialog({ _id: response.data._id, name: `Product (barcode: ${code})`, category: 'Other', description: 'Scanned barcode - edit name as needed' });
      } catch (createErr) {
        // If duplicate (409), find existing and open it
        if (createErr.response?.status === 409) {
          await fetchIngredients();
          const existing = ingredients.find(
            (ing) => ing.name.toLowerCase().includes(`barcode: ${code}`)
          );
          if (existing) {
            handleOpenDialog(existing);
            return;
          }
        }
        toast.error('Could not add ingredient. Please add manually.');
        handleOpenDialog();
      }
    }
  };

  const categories = [
    'Produce',
    'Dairy',
    'Meat',
    'Seafood',
    'Pantry',
    'Spices',
    'Beverages',
    'Other',
  ];

  const units = [
    'g',
    'kg',
    'ml',
    'l',
    'tsp',
    'tbsp',
    'cup',
    'oz',
    'lb',
    'piece',
    'pinch',
    'box',
  ];

  // Sort filtered ingredients based on current sort setting
  const sortedFilteredIngredients = [...filteredIngredients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'category-desc':
        return b.category.localeCompare(a.category);
      case 'description':
        return (a.description || '').localeCompare(b.description || '');
      case 'description-desc':
        return (b.description || '').localeCompare(a.description || '');
      default:
        return 0;
    }
  });

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ingredients
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
              <MenuItem value="category-desc">Category (Z-A)</MenuItem>
              <MenuItem value="description">Description (A-Z)</MenuItem>
              <MenuItem value="description-desc">Description (Z-A)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            Add Ingredient
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

      <Tabs
        value={tab}
        onChange={(e, newVal) => {
          setTab(newVal);
          setSearchTerm('');
        }}
        sx={{ 
          mb: 2,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
          },
        }}
      >
        <Tab label="My Ingredients" value="mine" />
        <Tab label="Shared Ingredients" value="shared" />
      </Tabs>

      <Grid container spacing={2}>
          {sortedFilteredIngredients.map((ingredient) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={ingredient._id}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                      : '0 8px 24px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                      fontSize: '1.1rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {toTitleCase(ingredient.name)}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={ingredient.category}
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        background: theme.palette.mode === 'dark'
                          ? `${getCategoryColor(ingredient.category).main}33`
                          : `${getCategoryColor(ingredient.category).main}22`,
                        color: getCategoryColor(ingredient.category).main,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {ingredient.description || 'No description'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', px: 1.5, pb: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {tab === 'mine' ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(ingredient)}
                          sx={{ 
                              color: 'primary.main',
                              '&:hover': {
                                background: theme.palette.mode === 'dark'
                                  ? 'rgba(34, 139, 34, 0.1)'
                                  : 'rgba(34, 139, 34, 0.05)',
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteIngredientClick(ingredient);
                            }}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': {
                                background: theme.palette.mode === 'dark'
                                  ? 'rgba(211, 47, 47, 0.1)'
                                  : 'rgba(211, 47, 47, 0.05)',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                        </>
                      ) : (
                        !myIngredients.some(myIng => myIng.name.toLowerCase() === ingredient.name.toLowerCase()) && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(ingredient._id);
                            }}
                            sx={{
                              textTransform: 'none',
                              background: theme.palette.mode === 'dark'
                                ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
                                : '#228B22',
                              '&:hover': {
                                background: theme.palette.mode === 'dark'
                                  ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
                                  : '#1B6B1B',
                              },
                            }}
                          >
                            Add
                          </Button>
                        )
                      )}
                    </Box>
                  </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Dialog
          open={Boolean(ingredientToDelete)}
          onClose={() => !deleting && setIngredientToDelete(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete ingredient?</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              {ingredientToDelete
                ? `Are you sure you want to delete "${ingredientToDelete.name}"? This cannot be undone.`
                : ''}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIngredientToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteIngredientConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingIngredient?.id ? 'Edit Ingredient' : 'Add New Ingredient'}
          </DialogTitle>
          <form onSubmit={handleSaveIngredient}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  value={editingIngredient?.name}
                  onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })}
                  fullWidth
                  required
                />
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editingIngredient?.category}
                    onChange={(e) => setEditingIngredient({ ...editingIngredient, category: e.target.value })}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Description"
                  value={editingIngredient?.description}
                  onChange={(e) => setEditingIngredient({ ...editingIngredient, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  textTransform: 'none',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #228B22 0%, #006400 100%)'
                    : '#228B22',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #1B6B1B 0%, #004D00 100%)'
                      : '#1B6B1B',
                  },
                }}
              >
                {editingIngredient?.id ? 'Save Changes' : 'Add Ingredient'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <BarcodeScanner
          open={scannerOpen}
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      </Container>
    );
};

export default Ingredients;
