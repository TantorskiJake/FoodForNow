import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import api from '../services/api';
import { getSafeElement } from '../utils/safeArrayAccess';
import { mapRecipeDataToForm } from '../utils/mapRecipeToForm';

const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];
const ingredientCategories = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];

const emptyFormData = {
  name: '',
  description: '',
  ingredients: [{ ingredient: '', quantity: '', unit: '' }],
  instructions: [''],
  prepTime: '',
  cookTime: '',
  servings: '',
  tags: '',
};

const initialFieldErrors = {
  name: '',
  description: false,
  prepTime: '',
  cookTime: '',
  servings: '',
  instructions: '',
  ingredients: '',
};

/**
 * Add / edit recipe form in a dialog. Used from Recipes list and Recipe detail.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {object | null} editingRecipe — PUT target when set; otherwise create
 * @param {object | null} createSeed — prepared recipe payload (e.g. import) when creating
 * @param {(payload: { mode: 'create'|'update', recipe: object, achievements?: array }) => void | Promise<void>} onSaved — after successful API call; dialog already closed
 * @param {(fn: () => Promise<any>) => Promise<any>} [runTask] — optional global busy wrapper (e.g. Recipes page)
 * @param {boolean} [submitDisabled] — extra disable for submit (e.g. page skeleton)
 */
export default function RecipeFormDialog({
  open,
  onClose,
  editingRecipe,
  createSeed,
  onSaved,
  runTask: runTaskProp,
  submitDisabled = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState(emptyFormData);
  const [fieldErrors, setFieldErrors] = useState(initialFieldErrors);
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [error, setError] = useState('');
  const [internalBusy, setInternalBusy] = useState(false);

  const [openCreateIngredient, setOpenCreateIngredient] = useState(false);
  const [createIngredientForIndex, setCreateIngredientForIndex] = useState(null);
  const [newIngredientData, setNewIngredientData] = useState({ name: '', category: '', description: '' });
  const [creatingIngredient, setCreatingIngredient] = useState(false);

  const fetchIngredients = useCallback(async ({ forceRefresh = false } = {}) => {
    try {
      const response = await api.cachedGet('/ingredients', {
        cacheTtl: 5 * 60 * 1000,
        forceRefresh,
      });
      setIngredientOptions(response.data);
    } catch {
      setIngredientOptions([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    // Initialize form state immediately so we never render stale data from a
    // previous recipe while ingredient options are still loading.
    if (editingRecipe) {
      setFormData(mapRecipeDataToForm(editingRecipe));
    } else if (createSeed) {
      setFormData(mapRecipeDataToForm(createSeed));
    } else {
      setFormData({ ...emptyFormData });
    }
    setError('');
    setFieldErrors({ ...initialFieldErrors });

    (async () => {
      await fetchIngredients({ forceRefresh: false });
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [open, editingRecipe, createSeed, fetchIngredients]);

  const defaultRunTask = useCallback(async (task) => {
    setInternalBusy(true);
    try {
      return await task();
    } finally {
      setInternalBusy(false);
    }
  }, []);

  const runTask = runTaskProp ?? defaultRunTask;

  const handleCloseDialog = () => {
    setError('');
    setFieldErrors({ ...initialFieldErrors });
    onClose();
  };

  const clearFieldErrors = () => setFieldErrors({ ...initialFieldErrors });

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredient: '', quantity: '', unit: '' }],
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
      await fetchIngredients({ forceRefresh: true });
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
        await fetchIngredients({ forceRefresh: true });
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

    clearFieldErrors();
    const nameErr = !formData.name?.trim() ? 'Please fill out this field!' : '';
    const descriptionErr = !formData.description?.trim();
    const prepErr = !formData.prepTime || Number(formData.prepTime) <= 0 ? 'Must be greater than 0' : '';
    const cookErr = !formData.cookTime || Number(formData.cookTime) <= 0 ? 'Must be greater than 0' : '';
    const servingsErr = !formData.servings || Number(formData.servings) <= 0 ? 'Must be greater than 0' : '';
    const instructionsErr =
      !formData.instructions?.length || !formData.instructions[0]?.trim() ? 'At least one instruction is required' : '';
    const hasAtLeastOneIngredient = formData.ingredients?.some(
      (ing) => (ing.ingredient || (ing.ingredientName && ing.ingredientName.trim())) && ing.quantity && ing.unit
    );
    const ingredientsErr =
      !formData.ingredients?.length || !hasAtLeastOneIngredient
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

    try {
      await runTask(async () => {
        const ingredientsPayload = formData.ingredients
          .filter((ing) => (ing.ingredient || (ing.ingredientName && ing.ingredientName.trim())) && ing.quantity && ing.unit)
          .map((ing) => {
            if (ing.ingredient) {
              return { ingredient: ing.ingredient, quantity: ing.quantity, unit: ing.unit };
            }
            return {
              name: ing.ingredientName.trim(),
              quantity: ing.quantity,
              unit: ing.unit,
              category: ing.category || 'Other',
            };
          });
        const recipeData = {
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim(),
          instructions: formData.instructions.filter((instruction) => instruction.trim()),
          ingredients: ingredientsPayload,
          tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        };

        if (editingRecipe) {
          const res = await api.put(`/recipes/${editingRecipe._id}`, recipeData);
          handleCloseDialog();
          await onSaved?.({ mode: 'update', recipe: res.data });
        } else {
          const response = await api.post('/recipes', recipeData);
          const body = response.data;
          const createdRecipe = body.recipe ?? body;
          const achievements = body.achievements;
          handleCloseDialog();
          await onSaved?.({
            mode: 'create',
            recipe: createdRecipe,
            achievements,
          });
        }
      });
      setError('');
    } catch (err) {
      console.error('Error saving recipe:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save recipe. Please try again.');
      }
    }
  };

  const disableSubmit = submitDisabled || internalBusy;

  return (
    <>
      <Dialog open={open} onClose={handleCloseDialog} fullScreen={isMobile}>
        <DialogTitle>{editingRecipe ? 'Edit Recipe' : 'Add Recipe'}</DialogTitle>
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
                  onChange={(ev) => {
                    setFormData({ ...formData, name: ev.target.value });
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
                  onChange={(ev) => {
                    setFormData({ ...formData, description: ev.target.value });
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
                    ? ingredientOptions.find((i) => i._id === ingredient.ingredient) || null
                    : ingredient.ingredientName && ingredient.ingredientName.trim()
                      ? ingredient.ingredientName.trim()
                      : null;
                  return (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Autocomplete
                        sx={{ flex: 2 }}
                        options={ingredientOptions}
                        value={valueOption}
                        freeSolo={!ingredient.ingredient}
                        getOptionLabel={(option) => (option && (typeof option === 'string' ? option : option.name)) || ''}
                        isOptionEqualToValue={(option, value) => {
                          if (option == null && value == null) return true;
                          if (option == null || value == null) return false;
                          if (typeof option === 'string' || typeof value === 'string') {
                            const optionStr = typeof option === 'string' ? option : (option?.name ?? '');
                            const valueStr = typeof value === 'string' ? value : (value?.name ?? '');
                            return (optionStr || '').trim() === (valueStr || '').trim();
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
                        onChange={(ev, value) => {
                          setFieldErrors((prev) => ({ ...prev, ingredients: '' }));
                          if (value?.isCreate) {
                            handleOpenCreateIngredient(index, value.prefillName || '');
                          } else if (typeof value === 'string') {
                            const newIngredients = [...formData.ingredients];
                            newIngredients[index] = {
                              ...newIngredients[index],
                              ingredient: '',
                              ingredientName: value.trim() || '',
                              category: ingredient.category || 'Other',
                            };
                            setFormData({ ...formData, ingredients: newIngredients });
                          } else if (value) {
                            const newIngredients = [...formData.ingredients];
                            newIngredients[index] = {
                              ...newIngredients[index],
                              ingredient: value._id,
                              ingredientName: '',
                              category: '',
                            };
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
                        onChange={(ev) => {
                          setFieldErrors((prev) => ({ ...prev, ingredients: '' }));
                          const newIngredients = [...formData.ingredients];
                          const val = ev?.target?.value;
                          const el = getSafeElement(newIngredients, index);
                          if (el) el.quantity = typeof val === 'string' ? val : String(val ?? '');
                          setFormData({ ...formData, ingredients: newIngredients });
                        }}
                        required
                        sx={{ flex: 1 }}
                      />
                      <FormControl sx={{ flex: 1 }}>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={ingredient.unit}
                          onChange={(ev) => {
                            setFieldErrors((prev) => ({ ...prev, ingredients: '' }));
                            const newIngredients = [...formData.ingredients];
                            const v = ev?.target?.value;
                            const el = getSafeElement(newIngredients, index);
                            if (el) el.unit = validUnits.includes(v) ? v : (ingredient.unit || '');
                            setFormData({ ...formData, ingredients: newIngredients });
                          }}
                          required
                          label="Unit"
                        >
                          {validUnits.map((unit) => (
                            <MenuItem key={unit} value={unit}>
                              {unit}
                            </MenuItem>
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
                  Add Ingredient
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
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                    <TextField
                      label={`Step ${index + 1}`}
                      value={instruction}
                      onChange={(ev) => {
                        const newInstructions = [...formData.instructions];
                        newInstructions[index] = ev.target.value;
                        setFormData({ ...formData, instructions: newInstructions });
                        setFieldErrors((prev) => ({ ...prev, instructions: '' }));
                      }}
                      multiline
                      rows={3}
                      fullWidth
                      required
                      InputProps={{
                        inputComponent: 'textarea',
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        '& .MuiInputBase-root': { alignItems: 'flex-start' },
                        '& textarea.MuiInputBase-input': {
                          resize: 'both',
                          minHeight: '4.5rem',
                          boxSizing: 'border-box',
                        },
                      }}
                    />
                    <IconButton onClick={() => handleMoveInstructionUp(index)} disabled={index === 0} size="small">
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleMoveInstructionDown(index)}
                      disabled={index === formData.instructions.length - 1}
                      size="small"
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleRemoveInstruction(index)}
                      disabled={formData.instructions.length === 1}
                      size="small"
                    >
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
                  Add Step
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prep Time (minutes)"
                  type="number"
                  value={formData.prepTime}
                  onChange={(ev) => {
                    setFormData({ ...formData, prepTime: ev.target.value });
                    setFieldErrors((prev) => ({ ...prev, prepTime: '' }));
                  }}
                  fullWidth
                  required
                  error={!!fieldErrors.prepTime}
                  helperText={fieldErrors.prepTime}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cook Time (minutes)"
                  type="number"
                  value={formData.cookTime}
                  onChange={(ev) => {
                    setFormData({ ...formData, cookTime: ev.target.value });
                    setFieldErrors((prev) => ({ ...prev, cookTime: '' }));
                  }}
                  fullWidth
                  required
                  error={!!fieldErrors.cookTime}
                  helperText={fieldErrors.cookTime}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Servings"
                  type="number"
                  value={formData.servings}
                  onChange={(ev) => {
                    setFormData({ ...formData, servings: ev.target.value });
                    setFieldErrors((prev) => ({ ...prev, servings: '' }));
                  }}
                  fullWidth
                  required
                  error={!!fieldErrors.servings}
                  helperText={fieldErrors.servings}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(ev) => setFormData({ ...formData, tags: ev.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={disableSubmit}>
              {editingRecipe ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openCreateIngredient} onClose={handleCloseCreateIngredient} maxWidth="xs" fullWidth>
        <form onSubmit={handleCreateIngredient}>
          <DialogTitle>Create New Ingredient</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Name"
                value={newIngredientData.name}
                onChange={(ev) => setNewIngredientData({ ...newIngredientData, name: ev.target.value })}
                fullWidth
                required
                autoFocus
              />
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newIngredientData.category}
                  onChange={(ev) => setNewIngredientData({ ...newIngredientData, category: ev.target.value })}
                  label="Category"
                >
                  {ingredientCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Description (optional)"
                value={newIngredientData.description}
                onChange={(ev) => setNewIngredientData({ ...newIngredientData, description: ev.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateIngredient}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={creatingIngredient}>
              {creatingIngredient ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
