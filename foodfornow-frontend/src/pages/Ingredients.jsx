import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import { getCategoryColor } from '../utils/categoryColors';

const UNITS = [
  'g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'
];

const CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'
];

const Ingredients = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        await api.get('/auth/me');
        fetchIngredients();
      } catch {
        navigate('/login');
      }
    };
    checkAuthAndFetch();
  }, [navigate]);

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
      setIngredients(response.data);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to fetch ingredients. Please try again.');
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
      if (editingIngredient) {
        await api.put(`/ingredients/${editingIngredient._id}`, formData);
      } else {
        await api.post('/ingredients', formData);
      }
      handleCloseDialog();
      fetchIngredients();
    } catch (err) {
      console.error('Error saving ingredient:', err);
      setError('Failed to save ingredient. Please try again.');
    }
  };

  const handleDeleteIngredient = async (id) => {
    try {
      await api.delete(`/ingredients/${id}`);
      fetchIngredients();
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      setError('Failed to delete ingredient. Please try again.');
    }
  };

  const theme = useTheme();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1">
                Ingredients
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Ingredient
              </Button>
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
                <List>
                  {ingredients.map((ingredient) => (
                    <IngredientItem
                      key={ingredient._id}
                      ingredient={ingredient}
                      onDelete={handleDeleteIngredient}
                      onEdit={handleOpenDialog}
                    />
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Ingredient Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
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
            <FormControl fullWidth margin="normal" required>
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
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingIngredient ? 'Save Changes' : 'Add Ingredient'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const IngredientItem = ({ ingredient, onDelete, onEdit }) => {
  const theme = useTheme();
  const categoryColor = getCategoryColor(ingredient.category);
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <ListItem
      sx={{
        mb: 1,
        borderRadius: 1,
        backgroundColor: isDarkMode ? 'background.paper' : 'background.default',
        '&:hover': {
          backgroundColor: isDarkMode ? 'action.hover' : 'action.hover',
        },
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {ingredient.name}
            </Typography>
            <Chip
              label={ingredient.category}
              size="small"
              sx={{
                backgroundColor: categoryColor.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: categoryColor.dark,
                },
              }}
            />
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {ingredient.description || 'No description'}
            </Typography>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="edit"
          onClick={() => onEdit(ingredient)}
          sx={{ mr: 1 }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onDelete(ingredient._id)}
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default Ingredients;