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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';

const Recipes = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        await api.get('/auth/me');
        fetchRecipes();
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

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data);
    } catch (err) {
      console.error('Error fetching recipes:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to fetch recipes. Please try again.');
      }
    }
  };

  const handleOpenDialog = (recipe = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        ...recipe,
        tags: recipe.tags.join(', '),
        ingredients: recipe.ingredients.map(ing => ({
          ingredient: ing.ingredient._id,
          quantity: ing.quantity,
          unit: ing.unit
        }))
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
        tags: '',
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
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleAddInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, '']
    });
  };

  const handleRemoveInstruction = (index) => {
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const recipeData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        ingredients: formData.ingredients.filter(ing => ing.ingredient && ing.quantity && ing.unit),
        instructions: formData.instructions.filter(instruction => instruction.trim())
      };
      if (editingRecipe) {
        await api.put(`/recipes/${editingRecipe._id}`, recipeData);
      } else {
        await api.post('/recipes', recipeData);
      }
      handleCloseDialog();
      fetchRecipes();
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Failed to save recipe. Please try again.');
    }
  };

  const handleDeleteRecipe = async (id) => {
    try {
      await api.delete(`/recipes/${id}`);
      fetchRecipes();
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1">
                My Recipes
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Recipe
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
                  {recipes.map((recipe) => (
                    <ListItem key={recipe._id}>
                      <ListItemText
                        primary={recipe.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {recipe.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {recipe.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleOpenDialog(recipe)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteRecipe(recipe._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipe Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Ingredients
                </Typography>
                {formData.ingredients.map((ingredient, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl fullWidth>
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
                      type="number"
                      value={ingredient.quantity}
                      onChange={(e) => {
                        const newIngredients = [...formData.ingredients];
                        newIngredients[index].quantity = e.target.value;
                        setFormData({ ...formData, ingredients: newIngredients });
                      }}
                      required
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={ingredient.unit}
                        onChange={(e) => {
                          const newIngredients = [...formData.ingredients];
                          newIngredients[index].unit = e.target.value;
                          setFormData({ ...formData, ingredients: newIngredients });
                        }}
                        required
                      >
                        <MenuItem value="g">g</MenuItem>
                        <MenuItem value="kg">kg</MenuItem>
                        <MenuItem value="oz">oz</MenuItem>
                        <MenuItem value="lb">lb</MenuItem>
                        <MenuItem value="ml">ml</MenuItem>
                        <MenuItem value="l">l</MenuItem>
                        <MenuItem value="cup">cup</MenuItem>
                        <MenuItem value="tbsp">tbsp</MenuItem>
                        <MenuItem value="tsp">tsp</MenuItem>
                        <MenuItem value="piece">piece</MenuItem>
                        <MenuItem value="pinch">pinch</MenuItem>
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
                  sx={{ mb: 2 }}
                >
                  Add Ingredient
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Instructions
                </Typography>
                {formData.instructions.map((instruction, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      label={`Step ${index + 1}`}
                      value={instruction}
                      onChange={(e) => {
                        const newInstructions = [...formData.instructions];
                        newInstructions[index] = e.target.value;
                        setFormData({ ...formData, instructions: newInstructions });
                      }}
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
                  sx={{ mb: 2 }}
                >
                  Add Step
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prep Time (minutes)"
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cook Time (minutes)"
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., vegetarian, quick, healthy"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingRecipe ? 'Save Changes' : 'Add Recipe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Recipes;