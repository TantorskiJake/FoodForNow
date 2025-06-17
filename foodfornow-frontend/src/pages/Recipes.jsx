import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
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
  Tabs,
  Tab,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import TimerIcon from '@mui/icons-material/Timer';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getCategoryColor } from '../utils/categoryColors';
import { useNavigate } from 'react-router-dom';

const RecipeItem = ({ recipe, onEdit, onDelete, onAdd, isShared }) => {
  const theme = useTheme();
  const navigate = useNavigate();
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
            {recipe.name}
          </Typography>
        }
        secondary={
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {recipe.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimerIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {recipe.prepTime + recipe.cookTime} mins
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <RestaurantIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {recipe.servings} servings
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {recipe.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  }}
                />
              ))}
            </Box>
          </Box>
        }
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        {!isShared && (
          <>
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
          </>
        )}
        {isShared && (
          <Button
            variant="contained"
            size="small"
            onClick={onAdd}
          >
            Add
          </Button>
        )}
      </Box>
    </ListItem>
  );
};

// MemoizedRecipeList component
const MemoizedRecipeList = React.memo(({ recipes, onEdit, onDelete, theme }) => (
  <List>
    {recipes.map((recipe) => (
      <Paper
        key={recipe._id}
        elevation={1}
        sx={{
          mb: 2,
          '&:hover': {
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
          },
        }}
      >
        <RecipeItem
          recipe={recipe}
          onEdit={() => onEdit(recipe)}
          onDelete={() => onDelete(recipe._id)}
        />
      </Paper>
    ))}
  </List>
));

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  });
  const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'];
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  // Shared recipes and tab state
  const [tab, setTab] = useState('mine');
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { authenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch functions for recipes and ingredients
  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes', {
        params: { search: tab === 'mine' ? searchTerm : undefined },
      });
      setRecipes(response.data);
    } catch (err) {
      setError('Failed to fetch recipes. Please try again.');
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
      setIngredients(response.data);
    } catch (err) {
      setError('Failed to fetch ingredients. Please try again.');
    }
  };

  const fetchSharedRecipes = async () => {
    try {
      const response = await api.get('/recipes/shared', { params: { search: searchTerm } });
      setSharedRecipes(response.data);
    } catch (err) {
      console.error('Error fetching shared recipes:', err);
      setError('Failed to fetch shared recipes');
    }
  };

  useEffect(() => {
    if (!authenticated) return;

    const fetchInitial = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchRecipes(), fetchIngredients()]);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, [authenticated]);

  // Fetch shared recipes when tab or searchTerm changes
  useEffect(() => {
    if (!authenticated) return;
    if (tab === 'shared') {
      setLoading(true);
      fetchSharedRecipes().finally(() => setLoading(false));
    } else if (tab === 'mine') {
      setLoading(true);
      fetchRecipes().finally(() => setLoading(false));
    }
  }, [tab, searchTerm, authenticated]);

  const handleOpenDialog = (recipe = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients.map(ing => ({
          ingredient: ing.ingredient._id,
          quantity: ing.quantity,
          unit: ing.unit
        })),
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        tags: recipe.tags.join(', ')
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        name: '',
        description: '',
        ingredients: [{ ingredient: '', quantity: '', unit: '' }],
        instructions: [''],
        prepTime: '',
        cookTime: '',
        servings: '',
        tags: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRecipe(null);
  };

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredient: '', quantity: '', unit: '' }]
    });
  };

  const handleRemoveIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const handleAddInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, '']
    });
  };

  const handleRemoveInstruction = (index) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const recipeData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (editingRecipe) {
        await api.put(`/recipes/${editingRecipe._id}`, recipeData);
      } else {
        await api.post('/recipes', recipeData);
      }

      handleCloseDialog();
      await fetchRecipes();
      setError('');
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      setLoading(true);
      await api.delete(`/recipes/${id}`);
      await fetchRecipes();
      setError('');
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateRecipe = async (id) => {
    try {
      setLoading(true);
      await api.post(`/recipes/${id}/duplicate`);
      await fetchRecipes();
      setError('');
    } catch (err) {
      console.error('Error duplicating recipe:', err);
      if (err.response?.status === 409) {
        setError('You already have this recipe in your collection.');
      } else {
        setError('Failed to add recipe. Please try again.');
      }
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
              Recipes
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={loading}
              size="small"
            >
              Add Recipe
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
            <Tab label="My Recipes" value="mine" />
            <Tab label="Shared Recipes" value="shared" />
          </Tabs>

          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <TextField
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Box>

          {tab === 'mine' ? (
            recipes.length > 0 ? (
              <Grid container spacing={2}>
                {recipes.map((recipe) => (
                  <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                            : '0 8px 24px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                      onClick={() => navigate(`/recipes/${recipe._id}`)}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 'medium',
                            mb: 1
                          }}
                        >
                          {recipe.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          {recipe.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                backgroundColor: getCategoryColor(tag).main,
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: getCategoryColor(tag).dark,
                                },
                              }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimerIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="textSecondary">
                              {recipe.prepTime + recipe.cookTime} mins
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <RestaurantIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="textSecondary">
                              {recipe.servings} servings
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(recipe);
                          }}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecipe(recipe._id);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No recipes found
                </Typography>
              </Paper>
            )
          ) : (
            sharedRecipes.length > 0 ? (
              <Grid container spacing={2}>
                {sharedRecipes.map((recipe) => (
                  <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                            : '0 8px 24px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                      onClick={() => navigate(`/recipes/${recipe._id}`)}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 'medium',
                            mb: 1
                          }}
                        >
                          {recipe.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          {recipe.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                backgroundColor: getCategoryColor(tag).main,
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: getCategoryColor(tag).dark,
                                },
                              }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimerIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="textSecondary">
                              {recipe.prepTime + recipe.cookTime} mins
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <RestaurantIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="textSecondary">
                              {recipe.servings} servings
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateRecipe(recipe._id);
                          }}
                        >
                          Add
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No shared recipes found
                </Typography>
              </Paper>
            )
          )}
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRecipe ? 'Edit Recipe' : 'Add Recipe'}
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
                <Typography variant="subtitle1" gutterBottom>
                  Ingredients
                </Typography>
                {formData.ingredients.map((ingredient, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <FormControl sx={{ flex: 2 }}>
                      <InputLabel>Ingredient</InputLabel>
                      <Select
                        value={ingredient.ingredient}
                        onChange={(e) => {
                          const newIngredients = [...formData.ingredients];
                          newIngredients[index].ingredient = e.target.value;
                          setFormData({ ...formData, ingredients: newIngredients });
                        }}
                        required
                      >
                        {ingredients.map((ing) => (
                          <MenuItem key={ing._id} value={ing._id}>
                            {ing.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Quantity"
                      value={ingredient.quantity}
                      onChange={(e) => {
                        const newIngredients = [...formData.ingredients];
                        newIngredients[index].quantity = e.target.value;
                        setFormData({ ...formData, ingredients: newIngredients });
                      }}
                      required
                      sx={{ flex: 1 }}
                    />
                    <FormControl sx={{ flex: 1 }}>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={ingredient.unit}
                        onChange={(e) => {
                          const newIngredients = [...formData.ingredients];
                          newIngredients[index].unit = e.target.value;
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
                    <IconButton
                      onClick={() => handleRemoveIngredient(index)}
                      disabled={formData.ingredients.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddIngredient}
                  sx={{ mt: 1 }}
                >
                  Add Ingredient
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Instructions
                </Typography>
                {formData.instructions.map((instruction, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      label={`Step ${index + 1}`}
                      value={instruction}
                      onChange={(e) => {
                        const newInstructions = [...formData.instructions];
                        newInstructions[index] = e.target.value;
                        setFormData({ ...formData, instructions: newInstructions });
                      }}
                      fullWidth
                      required
                    />
                    <IconButton
                      onClick={() => handleRemoveInstruction(index)}
                      disabled={formData.instructions.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddInstruction}
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
                  onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cook Time (minutes)"
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  fullWidth
                  required
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
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {editingRecipe ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Recipes;