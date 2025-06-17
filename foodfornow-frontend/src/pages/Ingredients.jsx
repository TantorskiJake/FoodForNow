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
      setEditingIngredient(ingredient);
      setFormData({
        name: ingredient.name,
        category: ingredient.category,
        unit: ingredient.unit,
        quantity: ingredient.quantity,
      });
    } else {
      setEditingIngredient(null);
      setFormData({
        name: '',
        category: '',
        unit: '',
        quantity: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIngredient) {
        await api.put(`/ingredients/${editingIngredient._id}`, formData);
      } else {
        await api.post('/ingredients', formData);
      }
      fetchIngredients();
      handleCloseDialog();
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(45deg, #f5f5f7 0%, #ffffff 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
            }}
          >
            Ingredients
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
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
            Add Ingredient
          </Button>
        </Box>

        <Tabs
          value={tab}
          onChange={(e, newVal) => {
            setTab(newVal);
            setSearchTerm('');
          }}
          sx={{
            mb: 3,
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

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.8)',
              },
            }}
          />
        </Paper>

        <Grid container spacing={3}>
          {filteredIngredients.map((ingredient) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={ingredient._id}>
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
                <Box sx={{ p: 2, flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                      fontSize: '1.1rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {ingredient.name}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
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
                        '&:hover': {
                          background: theme.palette.mode === 'dark'
                            ? `${getCategoryColor(ingredient.category).main}44`
                            : `${getCategoryColor(ingredient.category).main}33`,
                        },
                      }}
                    />
                    {ingredient.quantity && ingredient.unit && (
                      <Chip
                        size="small"
                        label={`${ingredient.quantity} ${ingredient.unit}`}
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          background: theme.palette.mode === 'dark'
                            ? 'rgba(34, 139, 34, 0.2)'
                            : 'rgba(34, 139, 34, 0.1)',
                          color: '#228B22',
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
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
                          onClick={() => handleDeleteIngredient(ingredient._id)}
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
                          onClick={() => handleDuplicate(ingredient._id)}
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

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={formData.unit}
                      label="Unit"
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      {units.map((unit) => (
                        <MenuItem key={unit} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </Grid>
              </Grid>
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
      </Container>
    </Box>
  );
};

export default Ingredients;