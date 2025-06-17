import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  IconButton,
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
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import { getCategoryColor } from '../utils/categoryColors';
import { useAuth } from '../context/AuthContext';

const UNITS = [
  'g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'
];

const CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'
];

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    defaultUnit: '',
    description: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('mine');
  const [searchTerm, setSearchTerm] = useState('');
  const { authenticated } = useAuth();
  const theme = useTheme();
  const [myIngredients, setMyIngredients] = useState([]);

  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);
    setError('');
    if (tab === 'mine') {
      fetchIngredients();
    } else {
      fetchSharedIngredients();
    }
  }, [tab, searchTerm, authenticated]);

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/ingredients', {
        params: { search: searchTerm },
      });
      setIngredients(response.data);
      setMyIngredients(response.data);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedIngredients = async () => {
    try {
      const response = await api.get('/ingredients/shared', {
        params: { search: searchTerm },
      });
      setIngredients(response.data);
    } catch (err) {
      console.error('Error fetching shared ingredients:', err);
      setError('Failed to fetch shared ingredients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/ingredients/${id}/duplicate`);
      setTab('mine');
      setLoading(true);
      await fetchIngredients();
    } catch (err) {
      console.error('Error duplicating ingredient:', err);
      if (err.response?.status === 409) {
        setError('You already have this ingredient in your collection.');
      } else {
        setError('Failed to add ingredient. Please try again.');
      }
    }
  };

  const handleOpenDialog = (ingredient = null) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setFormData({
        name: ingredient.name,
        category: ingredient.category,
        defaultUnit: ingredient.defaultUnit,
        description: ingredient.description || '',
        notes: ingredient.notes || '',
      });
    } else {
      setEditingIngredient(null);
      setFormData({
        name: '',
        category: '',
        defaultUnit: '',
        description: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingIngredient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingIngredient) {
        await api.put(`/ingredients/${editingIngredient._id}`, formData);
      } else {
        await api.post('/ingredients', formData);
      }
      handleCloseDialog();
      await fetchIngredients();
      setError('');
    } catch (err) {
      console.error('Error saving ingredient:', err);
      setError('Failed to save ingredient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIngredient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) return;

    try {
      setLoading(true);
      await api.delete(`/ingredients/${id}`);
      await fetchIngredients();
      setError('');
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      setError('Failed to delete ingredient. Please try again.');
    } finally {
      setLoading(false);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Ingredients
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={loading}
              size="small"
            >
              Add Ingredient
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Tabs
            value={tab}
            onChange={(e, newVal) => {
              setTab(newVal);
              setSearchTerm('');
            }}
            sx={{ mb: 2 }}
          >
            <Tab label="My Ingredients" value="mine" />
            <Tab label="Shared Ingredients" value="shared" />
          </Tabs>

          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <TextField
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
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
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Chip
                          label={ingredient.category}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(ingredient.category).main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: getCategoryColor(ingredient.category).dark,
                            },
                          }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {ingredient.defaultUnit}
                        </Typography>
                      </Box>
                      {ingredient.description && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {ingredient.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {!tab === 'shared' ? (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(ingredient)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteIngredient(ingredient._id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        !myIngredients.some(myIng => myIng.name.toLowerCase() === ingredient.name.toLowerCase()) && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleDuplicate(ingredient._id)}
                          >
                            Add
                          </Button>
                        )
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No ingredients found
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Default Unit</InputLabel>
                  <Select
                    value={formData.defaultUnit}
                    label="Default Unit"
                    onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
                  >
                    {UNITS.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {editingIngredient ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Ingredients;