import { useState, useEffect } from 'react';
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
  CircularProgress
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
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Pantry = () => {
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
  const [loading, setLoading] = useState(true);
  const [openClearConfirmDialog, setOpenClearConfirmDialog] = useState(false);

  const { authenticated } = useAuth();

  useEffect(() => {
    if (!authenticated) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchPantryItems(), fetchIngredients()]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [authenticated]);

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

  const handleClearAll = async () => {
    try {
      setLoading(true);
      await api.delete('/pantry');
      setPantryItems([]);
      toast.success('All pantry items cleared successfully');
    } catch (err) {
      console.error('Error clearing pantry:', err);
      toast.error('Failed to clear pantry items');
    } finally {
      setLoading(false);
      setOpenClearConfirmDialog(false);
    }
  };

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
              {item.ingredient.name}
            </Typography>
          }
          secondary={
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={item.ingredient.category}
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
              {item.notes && (
                <Typography variant="body2" color="text.secondary">
                  {item.notes}
                </Typography>
              )}
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pantry
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenClearConfirmDialog(true)}
            startIcon={<DeleteIcon />}
            sx={{ mr: 2 }}
            disabled={loading || pantryItems.length === 0}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : pantryItems.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No items in your pantry. Add your first item!
          </Typography>
        </Paper>
      ) : (
        <List>
          {pantryItems.map((item) => (
            <Paper
              key={item._id}
              elevation={1}
              sx={{
                mb: 2,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              <PantryItem
                item={item}
                onDelete={() => handleDeleteItem(item._id)}
                onEdit={() => handleOpenDialog(item)}
              />
            </Paper>
          ))}
        </List>
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

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={openClearConfirmDialog}
        onClose={() => setOpenClearConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clear All Pantry Items</DialogTitle>
        <DialogContent>
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
    </Container>
  );
};

export default Pantry;