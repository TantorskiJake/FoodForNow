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
  const [changeRequests, setChangeRequests] = useState([]);
  const [openRequestsDialog, setOpenRequestsDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    defaultUnit: '',
    description: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        await api.get('/auth/me');
        fetchIngredients();
        fetchChangeRequests();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const response = await api.get('/ingredients/change-requests');
      setChangeRequests(response.data);
      setOpenRequestsDialog(response.data.length > 0);
    } catch (err) {
      console.error('Error fetching change requests:', err);
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
        const res = await api.put(`/ingredients/${editingIngredient._id}`, formData);
        if (res.status === 202) {
          alert('Change request submitted for approval');
        }
      } else {
        await api.post('/ingredients', formData);
      }
      handleCloseDialog();
      fetchIngredients();
      fetchChangeRequests();
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

  const handleApproveRequest = async (id) => {
    try {
      await api.post(`/ingredients/change-requests/${id}/approve`);
      fetchIngredients();
      fetchChangeRequests();
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  const handleDenyRequest = async (id) => {
    try {
      await api.post(`/ingredients/change-requests/${id}/deny`);
      fetchChangeRequests();
    } catch (err) {
      console.error('Error denying request:', err);
    }
  };

  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : ingredients.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No ingredients found. Add your first ingredient!
          </Typography>
        </Paper>
      ) : (
        <List>
          {ingredients.map((ingredient) => (
            <Paper
              key={ingredient._id}
              elevation={1}
              sx={{
                mb: 2,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              <IngredientItem
                ingredient={ingredient}
                onEdit={() => handleOpenDialog(ingredient)}
                onDelete={() => handleDeleteIngredient(ingredient._id)}
              />
            </Paper>
          ))}
        </List>
      )}

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

      <Dialog open={openRequestsDialog} onClose={() => setOpenRequestsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pending Change Requests</DialogTitle>
        <DialogContent dividers>
          {changeRequests.length === 0 ? (
            <Typography>No change requests</Typography>
          ) : (
            <List>
              {changeRequests.map((req) => (
                <ListItem key={req._id} alignItems="flex-start">
                  <ListItemText
                    primary={req.ingredient.name}
                    secondary={JSON.stringify(req.proposedChanges)}
                  />
                  <ListItemSecondaryAction>
                    <Button onClick={() => handleApproveRequest(req._id)}>Approve</Button>
                    <Button onClick={() => handleDenyRequest(req._id)} color="error">Deny</Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const IngredientItem = ({ ingredient, onEdit, onDelete }) => {
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
            {ingredient.name}
          </Typography>
        }
        secondary={
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
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
            </Box>
            {ingredient.description && (
              <Typography variant="body2" color="text.secondary">
                {ingredient.description}
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

export default Ingredients;
