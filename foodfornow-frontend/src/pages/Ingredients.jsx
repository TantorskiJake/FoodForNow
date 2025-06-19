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
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const getCategoryColor = (category) => {
  const colors = {
    'Produce': { main: '#4CAF50', dark: '#388E3C' },
    'Dairy': { main: '#2196F3', dark: '#1976D2' },
    'Meat': { main: '#F44336', dark: '#D32F2F' },
    'Seafood': { main: '#00BCD4', dark: '#0097A7' },
    'Pantry': { main: '#FF9800', dark: '#F57C00' },
    'Spices': { main: '#9C27B0', dark: '#7B1FA2' },
    'Beverages': { main: '#795548', dark: '#5D4037' },
    'Frozen': { main: '#607D8B', dark: '#455A64' },
    'Bakery': { main: '#FFC107', dark: '#FFA000' },
    'Other': { main: '#9E9E9E', dark: '#757575' },
  };
  return colors[category] || colors['Other'];
};

const Ingredients = () => {
  const theme = useTheme();
  const { authenticated } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [myIngredients, setMyIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [tab, setTab] = useState('mine');
  const [sortBy, setSortBy] = useState('name');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    quantity: '',
  });

  useEffect(() => {
    if (!authenticated) return;
    if (tab === 'mine') {
      fetchIngredients();
    } else {
      fetchSharedIngredients();
    }
  }, [tab, authenticated]);

  useEffect(() => {
    const filtered = ingredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [searchTerm, ingredients]);

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

  const handleSaveIngredient = async () => {
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

  const handleDeleteIngredient = async (id) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await api.delete(`/ingredients/${id}`);
        fetchIngredients();
      } catch (error) {
        console.error('Error deleting ingredient:', error);
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
    'Frozen',
    'Bakery',
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
              Ingredients
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size="small"
            >
              Add Ingredient
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
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

          <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
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
          </Box>
        </Grid>

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
                  cursor: 'pointer',
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
                    {ingredient.name}
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

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 'auto' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {tab === 'mine' ? (
                        <>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(ingredient);
                            }}
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
                              e.stopPropagation();
                              handleDeleteIngredient(ingredient._id);
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
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
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
                {editingIngredient ? 'Save Changes' : 'Add Ingredient'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Grid>
    </Container>
  );
};

export default Ingredients;