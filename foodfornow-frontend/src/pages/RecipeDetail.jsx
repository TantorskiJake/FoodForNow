import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  useTheme,
  Stack,
  IconButton,
  TextField,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExploreIcon from '@mui/icons-material/Explore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

const VALID_UNITS = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];

function ingredientToForm(ing) {
  if (typeof ing === 'string') return { name: ing, quantity: '', unit: 'piece' };
  const name = ing.ingredient?.name ?? '';
  return {
    name,
    quantity: ing.quantity ?? '',
    unit: ing.unit ?? 'piece',
  };
}

const RecipeDetail = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await api.get(`/recipes/${id}`);
        setRecipe(response.data);
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const startEditing = () => {
    if (!recipe) return;
    setFormData({
      name: recipe.name,
      description: recipe.description ?? '',
      prepTime: recipe.prepTime ?? '',
      cookTime: recipe.cookTime ?? '',
      servings: recipe.servings ?? '',
      ingredients: (recipe.ingredients || []).map(ingredientToForm),
      instructions: Array.isArray(recipe.instructions) && recipe.instructions.length > 0
        ? [...recipe.instructions]
        : [''],
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormData(null);
  };

  const handleAddIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: 'piece' }],
    }));
  };

  const handleRemoveIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleAddInstruction = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const handleRemoveInstruction = (index) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!formData || !id) return;
    const name = formData.name?.trim();
    const description = formData.description?.trim();
    if (!name || !description) {
      setSnackbar({ open: true, message: 'Name and description are required.', severity: 'error' });
      return;
    }
    const ingredients = formData.ingredients
      .map((ing) => ({
        name: (ing.name || '').trim(),
        quantity: Number(ing.quantity) || 0,
        unit: VALID_UNITS.includes(ing.unit) ? ing.unit : 'piece',
      }))
      .filter((ing) => ing.name);
    if (ingredients.length === 0) {
      setSnackbar({ open: true, message: 'Add at least one ingredient.', severity: 'error' });
      return;
    }
    const instructions = (formData.instructions || []).map((s) => (s || '').trim()).filter(Boolean);
    if (instructions.length === 0) {
      setSnackbar({ open: true, message: 'Add at least one instruction step.', severity: 'error' });
      return;
    }
    setSaveLoading(true);
    try {
      const response = await api.put(`/recipes/${id}`, {
        name,
        description,
        prepTime: Number(formData.prepTime) || 0,
        cookTime: Number(formData.cookTime) || 0,
        servings: Number(formData.servings) || 1,
        ingredients,
        instructions,
      });
      setRecipe(response.data);
      setIsEditing(false);
      setFormData(null);
      setSnackbar({ open: true, message: 'Recipe updated.', severity: 'success' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update recipe.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(45deg, #f5f5f7 0%, #ffffff 100%)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !recipe) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(45deg, #f5f5f7 0%, #ffffff 100%)',
          gap: 2,
        }}
      >
        <Typography variant="h5" color="error">
          {error || 'Recipe not found'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
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
          Back to Dashboard
        </Button>
      </Box>
    );
  }

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
      <Container maxWidth="md">
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
              textTransform: 'none',
              '&:hover': {
                background: 'transparent',
                color: '#228B22',
              },
            }}
          >
            Back to Dashboard
          </Button>
          <Button
            startIcon={<ExploreIcon />}
            onClick={() => navigate('/recipes')}
            sx={{
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
              textTransform: 'none',
              '&:hover': {
                background: 'transparent',
                color: '#228B22',
              },
            }}
          >
            Explore Other Recipes
          </Button>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: 4,
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
          {isEditing && formData ? (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.mode === 'dark' ? '#fff' : '#1d1d1f' }}>
                Edit Recipe
              </Typography>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                required
                sx={{ mb: 2 }}
              />
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField
                  label="Prep (mins)"
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                  required
                  inputProps={{ min: 0 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Cook (mins)"
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                  required
                  inputProps={{ min: 0 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  required
                  inputProps={{ min: 1 }}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.mode === 'dark' ? '#fff' : '#1d1d1f' }}>
                Ingredients
              </Typography>
              {formData.ingredients.map((ing, index) => (
                <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
                  <TextField
                    label="Ingredient"
                    value={ing.name}
                    onChange={(e) => {
                      const next = [...formData.ingredients];
                      next[index] = { ...next[index], name: e.target.value };
                      setFormData({ ...formData, ingredients: next });
                    }}
                    required
                    size="small"
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="Qty"
                    value={ing.quantity}
                    onChange={(e) => {
                      const next = [...formData.ingredients];
                      next[index] = { ...next[index], quantity: e.target.value };
                      setFormData({ ...formData, ingredients: next });
                    }}
                    required
                    size="small"
                    sx={{ width: 90 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={ing.unit}
                      label="Unit"
                      onChange={(e) => {
                        const next = [...formData.ingredients];
                        next[index] = { ...next[index], unit: e.target.value };
                        setFormData({ ...formData, ingredients: next });
                      }}
                    >
                      {VALID_UNITS.map((u) => (
                        <MenuItem key={u} value={u}>{u}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton
                    onClick={() => handleRemoveIngredient(index)}
                    disabled={formData.ingredients.length === 1}
                    size="small"
                    aria-label="Remove ingredient"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<AddIcon />} onClick={handleAddIngredient} size="small" sx={{ mb: 2 }}>
                Add ingredient
              </Button>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2, color: theme.palette.mode === 'dark' ? '#fff' : '#1d1d1f' }}>
                Instructions
              </Typography>
              {formData.instructions.map((step, index) => (
                <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
                  <TextField
                    label={`Step ${index + 1}`}
                    value={step}
                    onChange={(e) => {
                      const next = [...formData.instructions];
                      next[index] = e.target.value;
                      setFormData({ ...formData, instructions: next });
                    }}
                    fullWidth
                    required
                    size="small"
                  />
                  <IconButton
                    onClick={() => handleRemoveInstruction(index)}
                    disabled={formData.instructions.length === 1}
                    size="small"
                    aria-label="Remove step"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<AddIcon />} onClick={handleAddInstruction} size="small" sx={{ mb: 3 }}>
                Add step
              </Button>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={cancelEditing} disabled={saveLoading}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saveLoading}
                  sx={{
                    background: '#228B22',
                    '&:hover': { background: '#1B6B1B' },
                  }}
                >
                  {saveLoading ? <CircularProgress size={24} /> : 'Save changes'}
                </Button>
              </Stack>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                    flex: 1,
                  }}
                >
                  {recipe.name}
                </Typography>
                <IconButton
                  onClick={startEditing}
                  aria-label="Edit recipe"
                  sx={{
                    color: '#228B22',
                    flexShrink: 0,
                    '&:hover': {
                      background: 'rgba(34, 139, 34, 0.12)',
                      color: '#1B6B1B',
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip
                  icon={<TimerIcon />}
                  label={`Prep: ${recipe.prepTime} mins`}
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(34, 139, 34, 0.2)'
                      : 'rgba(34, 139, 34, 0.1)',
                    color: '#228B22',
                  }}
                />
                <Chip
                  icon={<AccessTimeIcon />}
                  label={`Cook: ${recipe.cookTime} mins`}
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(34, 139, 34, 0.2)'
                      : 'rgba(34, 139, 34, 0.1)',
                    color: '#228B22',
                  }}
                />
                <Chip
                  icon={<RestaurantIcon />}
                  label={`${recipe.servings} servings`}
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(34, 139, 34, 0.2)'
                      : 'rgba(34, 139, 34, 0.1)',
                    color: '#228B22',
                  }}
                />
              </Box>

              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  mb: 4,
                  lineHeight: 1.6,
                }}
              >
                {recipe.description}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                  mb: 2,
                }}
              >
                Ingredients
              </Typography>
              <List>
                {recipe.ingredients.map((ingredient, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={typeof ingredient === 'string' ? ingredient : `${ingredient.quantity} ${ingredient.unit} ${ingredient.ingredient.name}`}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                  mb: 2,
                }}
              >
                Instructions
              </Typography>
              <List>
                {recipe.instructions.map((instruction, index) => (
                  <ListItem key={index} sx={{ py: 1 }}>
                    <ListItemText
                      primary={`${index + 1}. ${instruction}`}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          lineHeight: 1.6,
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Paper>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default RecipeDetail;