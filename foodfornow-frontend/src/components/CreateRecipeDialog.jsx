import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  Typography,
  IconButton,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import api from '../services/api';
import { useAchievements } from '../context/AchievementContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];
const ingredientCategories = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];

const initialFormData = {
  name: '',
  description: '',
  ingredients: [{ ingredient: '', quantity: '', unit: 'piece' }],
  instructions: [''],
  prepTime: '',
  cookTime: '',
  servings: '',
  tags: '',
};

export default function CreateRecipeDialog({ open, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showAchievements } = useAchievements();
  const [formData, setFormData] = useState(initialFormData);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    description: false,
    prepTime: '',
    cookTime: '',
    servings: '',
    instructions: '',
    ingredients: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [openCreateIngredient, setOpenCreateIngredient] = useState(false);
  const [createIngredientForIndex, setCreateIngredientForIndex] = useState(null);
  const [newIngredientData, setNewIngredientData] = useState({ name: '', category: '', description: '' });
  const [creatingIngredient, setCreatingIngredient] = useState(false);

  const fetchIngredients = async () => {
    try {
      const response = await api.cachedGet('/ingredients', { cacheTtl: 5 * 60 * 1000, forceRefresh: true });
      setIngredients(response.data);
    } catch (_) {
      setIngredients([]);
    }
  };

  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setError('');
      setFieldErrors({ name: '', description: false, prepTime: '', cookTime: '', servings: '', instructions: '', ingredients: '' });
      fetchIngredients();
    }
  }, [open]);

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredient: '', quantity: '', unit: 'piece' }],
    });
  };

  const handleRemoveIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleOpenCreateIngredient = (index, prefillName = '') => {
    setCreateIngredientForIndex(index);
    setNewIngredientData({ name: prefillName, category: '', description: '' });
    setOpenCreateIngredient(true);
  };

  const handleCloseCreateIngredient = () => {
    setOpenCreateIngredient(false);
    setCreateIngredientForIndex(null);
    setNewIngredientData({ name: '', category: '', description: '' });
  };

  const handleCreateIngredient = async (e) => {
    e?.preventDefault();
    if (!newIngredientData.name?.trim() || !newIngredientData.category) return;
    const indexToUpdate = createIngredientForIndex;
    try {
      setCreatingIngredient(true);
      const response = await api.post('/ingredients', {
        name: newIngredientData.name.trim(),
        category: newIngredientData.category,
        description: newIngredientData.description?.trim() || undefined,
      });
      const newIng = response.data;
      await fetchIngredients();
      if (indexToUpdate !== null) {
        setFormData((prev) => {
          const newIngredients = [...prev.ingredients];
          newIngredients[indexToUpdate] = {
            ...newIngredients[indexToUpdate],
            ingredient: newIng._id,
            ingredientName: '',
          };
          return { ...prev, ingredients: newIngredients };
        });
      }
      handleCloseCreateIngredient();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.existingIngredient) {
        const existing = err.response.data.existingIngredient;
        await fetchIngredients();
        if (indexToUpdate !== null) {
          setFormData((prev) => {
            const newIngredients = [...prev.ingredients];
            newIngredients[indexToUpdate] = {
              ...newIngredients[indexToUpdate],
              ingredient: existing._id,
              ingredientName: '',
            };
            return { ...prev, ingredients: newIngredients };
          });
        }
        handleCloseCreateIngredient();
      } else {
        setError(err.response?.data?.message || 'Failed to create ingredient.');
      }
    } finally {
      setCreatingIngredient(false);
    }
  };

  const handleAddInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, ''],
    });
  };

  const handleRemoveInstruction = (index) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  const handleMoveInstructionUp = (index) => {
    if (index === 0) return;
    const newInstructions = [...formData.instructions];
    [newInstructions[index - 1], newInstructions[index]] = [newInstructions[index], newInstructions[index - 1]];
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleMoveInstructionDown = (index) => {
    if (index === formData.instructions.length - 1) return;
    const newInstructions = [...formData.instructions];
    [newInstructions[index + 1], newInstructions[index]] = [newInstructions[index], newInstructions[index + 1]];
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({ name: '', description: false, prepTime: '', cookTime: '', servings: '', instructions: '', ingredients: '' });
    const nameErr = !formData.name?.trim() ? 'Please fill out this field!' : '';
    const descriptionErr = !formData.description?.trim();
    const prepErr = !formData.prepTime || Number(formData.prepTime) <= 0 ? 'Must be greater than 0' : '';
    const cookErr = !formData.cookTime || Number(formData.cookTime) <= 0 ? 'Must be greater than 0' : '';
    const servingsErr = !formData.servings || Number(formData.servings) <= 0 ? 'Must be greater than 0' : '';
    const instructionsErr = !formData.instructions?.length || !formData.instructions[0]?.trim() ? 'At least one instruction is required' : '';
    const hasIngredient = formData.ingredients?.some(
      (ing) => (ing.ingredient || (ing.ingredientName && ing.ingredientName.trim())) && ing.quantity && ing.unit
    );
    const ingredientsErr = !formData.ingredients?.length || !hasIngredient
      ? 'Create that ingredient or choose from your collection.'
      : '';

    setFieldErrors({
      name: nameErr,
      description: descriptionErr,
      prepTime: prepErr,
      cookTime: cookErr,
      servings: servingsErr,
      instructions: instructionsErr,
      ingredients: ingredientsErr,
    });
    if (nameErr || descriptionErr || prepErr || cookErr || servingsErr || instructionsErr || ingredientsErr) {
      setError('');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const ingredientsPayload = formData.ingredients
        .filter((ing) => (ing.ingredient || (ing.ingredientName && ing.ingredientName.trim())) && ing.quantity && ing.unit)
        .map((ing) => {
          if (ing.ingredient) {
            return { ingredient: ing.ingredient, quantity: ing.quantity, unit: ing.unit };
          }
          return {
            name: (ing.ingredientName || '').trim(),
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category || 'Other',
          };
        });
      const recipeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.filter((s) => s?.trim()),
        ingredients: ingredientsPayload,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        servings: formData.servings,
        tags: (formData.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      };
      const response = await api.post('/recipes', recipeData);
      if (response.data.achievements?.length > 0) {
        showAchievements(response.data.achievements);
      }
      onSuccess(response.data);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save recipe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullScreen={isMobile} maxWidth="sm" fullWidth>
        <DialogTitle>Create recipe</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  fullWidth
                  required
                  error={!!fieldErrors.name}
                  helperText={fieldErrors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, description: false }));
                  }}
                  fullWidth
                  multiline
                  rows={2}
                  required
                  error={fieldErrors.description}
                  helperText={fieldErrors.description ? 'Please fill out this field!' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Ingredients
                </Typography>
                {formData.ingredients.map((ingredient, index) => {
                  const valueOption = ingredient.ingredient
                    ? ingredients.find((i) => i._id === ingredient.ingredient) || null
                    : (ingredient.ingredientName && ingredient.ingredientName.trim()) ? ingredient.ingredientName.trim() : null;
                  return (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Autocomplete
                        sx={{ flex: '1 1 200px', minWidth: 120 }}
                        options={ingredients}
                        value={valueOption}
                        freeSolo={!ingredient.ingredient}
                        getOptionLabel={(option) => (option && (typeof option === 'string' ? option : option.name)) || ''}
                        isOptionEqualToValue={(option, value) => {
                          if (option == null && value == null) return true;
                          if (option == null || value == null) return false;
                          if (typeof option === 'string' || typeof value === 'string') {
                            const a = typeof option === 'string' ? option : (option?.name ?? '');
                            const b = typeof value === 'string' ? value : (value?.name ?? '');
                            return (a || '').trim() === (b || '').trim();
                          }
                          return option._id === value?._id;
                        }}
                        filterOptions={(options, state) => {
                          const filtered = options.filter((opt) =>
                            opt.name && opt.name.toLowerCase().includes((state.inputValue || '').toLowerCase())
                          );
                          const createOption = {
                            _id: '__create__',
                            name: state.inputValue ? `Create "${state.inputValue}"` : '+ Create new ingredient',
                            isCreate: true,
                            prefillName: state.inputValue || '',
                          };
                          return [...filtered, createOption];
                        }}
                        onChange={(e, value) => {
                          setFieldErrors((prev) => ({ ...prev, ingredients: '' }));
                          if (value?.isCreate) {
                            handleOpenCreateIngredient(index, value.prefillName || '');
                          } else if (typeof value === 'string') {
                            const newIngredients = [...formData.ingredients];
                            newIngredients[index] = { ...newIngredients[index], ingredient: '', ingredientName: (value || '').trim(), category: ingredient.category || 'Other' };
                            setFormData({ ...formData, ingredients: newIngredients });
                          } else if (value) {
                            const newIngredients = [...formData.ingredients];
                            newIngredients[index] = { ...newIngredients[index], ingredient: value._id, ingredientName: '', category: '' };
                            setFormData({ ...formData, ingredients: newIngredients });
                          } else {
                            const newIngredients = [...formData.ingredients];
                            newIngredients[index] = { ...newIngredients[index], ingredient: '', ingredientName: '' };
                            setFormData({ ...formData, ingredients: newIngredients });
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Ingredient"
                            required={!ingredient.ingredient && !(ingredient.ingredientName && ingredient.ingredientName.trim())}
                            error={index === 0 && !!fieldErrors.ingredients}
                            helperText={index === 0 ? fieldErrors.ingredients : ''}
                          />
                        )}
                      />
                      <TextField
                        label="Quantity"
                        value={ingredient.quantity}
                        onChange={(e) => {
                          setFieldErrors((prev) => ({ ...prev, ingredients: '' }));
                          const newIngredients = [...formData.ingredients];
                          newIngredients[index] = { ...newIngredients[index], quantity: e.target.value };
                          setFormData({ ...formData, ingredients: newIngredients });
                        }}
                        required
                        sx={{ width: 90 }}
                      />
                      <FormControl sx={{ minWidth: 100 }}>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={ingredient.unit || 'piece'}
                          onChange={(e) => {
                            setFieldErrors((prev) => ({ ...prev, ingredients: '' }));
                            const newIngredients = [...formData.ingredients];
                            newIngredients[index] = { ...newIngredients[index], unit: e.target.value };
                            setFormData({ ...formData, ingredients: newIngredients });
                          }}
                          required
                          label="Unit"
                        >
                          {validUnits.map((unit) => (
                            <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton onClick={() => handleRemoveIngredient(index)} disabled={formData.ingredients.length === 1}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  );
                })}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    handleAddIngredient();
                    setFieldErrors((prev) => ({ ...prev, ingredients: '' }));
                  }}
                  sx={{ mt: 1 }}
                >
                  Add ingredient
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Instructions
                </Typography>
                {fieldErrors.instructions && (
                  <FormHelperText error sx={{ mt: -1, mb: 1 }}>
                    {fieldErrors.instructions}
                  </FormHelperText>
                )}
                {formData.instructions.map((instruction, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField
                      label={`Step ${index + 1}`}
                      value={instruction}
                      onChange={(e) => {
                        const next = [...formData.instructions];
                        next[index] = e.target.value;
                        setFormData({ ...formData, instructions: next });
                        setFieldErrors((prev) => ({ ...prev, instructions: '' }));
                      }}
                      fullWidth
                      required
                    />
                    <IconButton onClick={() => handleMoveInstructionUp(index)} disabled={index === 0} size="small">
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleMoveInstructionDown(index)} disabled={index === formData.instructions.length - 1} size="small">
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleRemoveInstruction(index)} disabled={formData.instructions.length === 1} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    handleAddInstruction();
                    setFieldErrors((prev) => ({ ...prev, instructions: '' }));
                  }}
                  sx={{ mt: 1 }}
                >
                  Add step
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prep time (minutes)"
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) => {
                    setFormData({ ...formData, prepTime: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, prepTime: '' }));
                  }}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  error={!!fieldErrors.prepTime}
                  helperText={fieldErrors.prepTime}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cook time (minutes)"
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) => {
                    setFormData({ ...formData, cookTime: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, cookTime: '' }));
                  }}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  error={!!fieldErrors.cookTime}
                  helperText={fieldErrors.cookTime}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => {
                    setFormData({ ...formData, servings: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, servings: '' }));
                  }}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  error={!!fieldErrors.servings}
                  helperText={fieldErrors.servings}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create recipe'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openCreateIngredient} onClose={handleCloseCreateIngredient} maxWidth="xs" fullWidth>
        <form onSubmit={handleCreateIngredient}>
          <DialogTitle>Create new ingredient</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Name"
                value={newIngredientData.name}
                onChange={(e) => setNewIngredientData({ ...newIngredientData, name: e.target.value })}
                fullWidth
                required
                autoFocus
              />
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newIngredientData.category}
                  onChange={(e) => setNewIngredientData({ ...newIngredientData, category: e.target.value })}
                  label="Category"
                >
                  {ingredientCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Description (optional)"
                value={newIngredientData.description}
                onChange={(e) => setNewIngredientData({ ...newIngredientData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateIngredient}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={creatingIngredient}>
              {creatingIngredient ? 'Creating…' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
