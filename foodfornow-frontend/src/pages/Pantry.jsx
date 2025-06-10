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
import axios from 'axios';

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
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchPantryItems();
    fetchIngredients();
  }, [navigate]);

  const fetchPantryItems = async () => {
    try {
      console.log('Fetching pantry items...');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/pantry', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Raw pantry response:', response.data);
      
      // Check if response.data exists and has items
      if (response.data && Array.isArray(response.data.items)) {
        // Ensure each item has the required data structure
        const processedItems = response.data.items.map(item => {
          console.log('Processing item:', item);
          return {
            _id: item._id,
            ingredient: item.ingredient ? {
              _id: item.ingredient._id,
              name: item.ingredient.name,
              category: item.ingredient.category
            } : null,
            quantity: item.quantity,
            unit: item.unit,
            expiryDate: item.expiryDate,
            notes: item.notes
          };
        });
        
        console.log('Processed pantry items:', processedItems);
        setPantryItems(processedItems);
      } else {
        console.log('No items found in response or invalid format');
        setPantryItems([]);
      }
    } catch (err) {
      console.error('Error fetching pantry items:', err);
      setError('Failed to fetch pantry items. Please try again.');
    }
  };

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/ingredients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIngredients(response.data);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients. Please try again.');
    }
  };

  const handleOpenDialog = () => {
    console.log('Opening dialog...');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    console.log('Closing dialog...');
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
      const token = localStorage.getItem('token');
      
      // Validate required fields
      if (!formData.ingredient || !formData.quantity || !formData.unit) {
        setError('Please fill in all required fields');
        return;
      }

      const submitData = {
        ingredient: formData.ingredient,
        quantity: Number(formData.quantity),
        unit: formData.unit
      };

      // Only add optional fields if they have values
      if (formData.expiryDate) {
        submitData.expiryDate = formData.expiryDate;
      }
      if (formData.notes) {
        submitData.notes = formData.notes;
      }

      console.log('Submitting pantry item:', submitData);

      if (editingItem) {
        await axios.put(
          `http://localhost:3000/pantry/${editingItem._id}`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const response = await axios.post(
          'http://localhost:3000/pantry',
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Server response:', response.data);
      }
      
      // Close dialog and reset form
      handleCloseDialog();
      
      // Fetch updated pantry items
      console.log('Fetching updated pantry items...');
      await fetchPantryItems();
      
    } catch (err) {
      console.error('Error saving pantry item:', err);
      setError(err.response?.data?.error || 'Failed to save pantry item. Please try again.');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/pantry/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPantryItems();
    } catch (err) {
      console.error('Error deleting pantry item:', err);
      setError('Failed to delete pantry item. Please try again.');
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3000/pantry/${id}/quantity`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

      {console.log('Current pantry items in render:', pantryItems)}
      {pantryItems && pantryItems.length > 0 ? (
        <List>
          {pantryItems.map((item) => {
            console.log('Rendering item:', item);
            return (
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
            );
          })}
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