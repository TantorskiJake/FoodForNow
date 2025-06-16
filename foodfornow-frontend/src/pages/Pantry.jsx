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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import api from '../services/api';

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

  const handleOpenDialog = () => {
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

      if (editingItem) {
        await api.put(`/pantry/${editingItem._id}`, submitData);
      } else {
        await api.post('/pantry', submitData);
      }
      
      handleCloseDialog();
      await fetchPantryItems();
      
    } catch (err) {
      console.error('Error saving pantry item:', err);
      setError(err.response?.data?.error || 'Failed to save pantry item. Please try again.');
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
          onClick={handleOpenDialog}
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
            <ListItem
              key={item._id}
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {item.ingredient?.name || 'Unknown Ingredient'}
                    </Typography>
                    <Chip
                      size="small"
                      label={item.ingredient?.category || 'Uncategorized'}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Quantity: {item.quantity} {item.unit}
                    </Typography>
                    {item.expiryDate && (
                      <Typography variant="body2" color="text.secondary">
                        Expires: {new Date(item.expiryDate).toLocaleDateString()}
                      </Typography>
                    )}
                    {item.notes && (
                      <Typography variant="body2" color="text.secondary">
                        Notes: {item.notes}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <RemoveIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                >
                  <AddIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteItem(item._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItem>
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
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingItem ? 'Update' : 'Add'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Pantry;