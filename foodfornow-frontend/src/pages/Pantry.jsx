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
  useTheme
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AddShoppingCart as AddShoppingCartIcon
} from '@mui/icons-material';
import api from '../services/api';
import { getCategoryColor } from '../utils/categoryColors';

const Pantry = () => {
  const navigate = useNavigate();
  const [pantryItems, setPantryItems] = useState([]);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    ingredient: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    notes: '',
  });
  const [ingredients, setIngredients] = useState([]);
  const [units] = useState(['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch']);
  const theme = useTheme();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        await api.get('/auth/me');
        fetchPantryItems();
        fetchIngredients();
      } catch {
        navigate('/login');
      }
    };
    checkAuthAndFetch();
  }, [navigate]);

  const fetchPantryItems = async () => {
    try {
      const response = await api.get('/pantry');
      console.log('Raw pantry response:', response.data);
      
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

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
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
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        ingredient: '',
        quantity: '',
        unit: '',
        expiryDate: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({
      ingredient: '',
      quantity: '',
      unit: '',
      expiryDate: '',
      notes: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    try {
      if (!formData.ingredient || !formData.quantity || !formData.unit) {
        setError('Please fill in all required fields');
        return;
      }

      const submitData = {
        ingredient: formData.ingredient,
        quantity: Number(formData.quantity),
        unit: formData.unit
      };

      if (formData.expiryDate) {
        submitData.expiryDate = formData.expiryDate;
      }
      if (formData.notes) {
        submitData.notes = formData.notes;
      }

      console.log('Submitting pantry item:', submitData);
      console.log('Editing item:', editingItem);

      let response;
      if (editingItem) {
        console.log('Updating existing item with ID:', editingItem._id);
        response = await api.patch(`/pantry/items/${editingItem._id}`, submitData);
        console.log('Update response:', response);
      } else {
        console.log('Creating new item');
        response = await api.post('/pantry', submitData);
        console.log('Create response:', response);
      }
      
      if (response && response.data) {
        console.log('Successfully saved pantry item');
        handleCloseDialog();
        await fetchPantryItems();
        setFormData({
          ingredient: '',
          quantity: '',
          unit: '',
          expiryDate: '',
          notes: ''
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
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        navigate('/login');
      } else {
        setError('Failed to save pantry item. Please try again.');
      }
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/pantry/${id}`);
      fetchPantryItems();
    } catch (err) {
      console.error('Error deleting pantry item:', err);
      setError('Failed to delete pantry item. Please try again.');
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    try {
      await api.put(`/pantry/${id}/quantity`, { quantity: newQuantity });
      fetchPantryItems();
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity. Please try again.');
    }
  };

  const handleAddToShoppingList = async (item) => {
    try {
      await api.post('/shopping-list', { ingredient: item.ingredient._id, quantity: item.quantity });
      fetchPantryItems();
    } catch (err) {
      console.error('Error adding to shopping list:', err);
      setError('Failed to add to shopping list. Please try again.');
    }
  };

  const PantryItem = ({ item, onDelete, onEdit }) => {
    const categoryColor = getCategoryColor(item.ingredient.category);
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
                {item.ingredient.name}
              </Typography>
              <Chip
                label={item.ingredient.category}
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
                {item.quantity} {item.unit}
              </Typography>
              {item.expiryDate && (
                <Typography variant="body2" color="text.secondary">
                  • Expires: {new Date(item.expiryDate).toLocaleDateString()}
                </Typography>
              )}
              {item.notes && (
                <Typography variant="body2" color="text.secondary">
                  • {item.notes}
                </Typography>
              )}
            </Box>
          }
        />
        <ListItemSecondaryAction>
          <IconButton
            edge="end"
            aria-label="edit"
            onClick={() => onEdit(item)}
            sx={{ mr: 1 }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => onDelete(item._id)}
          >
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Pantry
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {pantryItems && pantryItems.length > 0 ? (
        <List>
          {pantryItems.map((item) => (
            <PantryItem
              key={item._id}
              item={item}
              onDelete={handleDeleteItem}
              onEdit={handleOpenDialog}
            />
          ))}
        </List>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Your pantry is empty. Add some ingredients to get started!
          </Typography>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Pantry Item' : 'Add Pantry Item'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Ingredient</InputLabel>
              <Select
                value={formData.ingredient}
                onChange={(e) => setFormData({ ...formData, ingredient: e.target.value })}
                label="Ingredient"
              >
                {ingredients.map((ingredient) => (
                  <MenuItem key={ingredient._id} value={ingredient._id}>
                    {ingredient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Pantry;