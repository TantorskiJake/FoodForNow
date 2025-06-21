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
import SortIcon from '@mui/icons-material/Sort';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getCategoryColor } from '../utils/categoryColors';
import { useNavigate } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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
  const [sortBy, setSortBy] = useState('name');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { authenticated } = useAuth();
  const navigate = useNavigate();

  // Sort recipes based on current sort setting
  const sortedRecipes = [...recipes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'cookTime':
        return a.cookTime - b.cookTime;
      case 'cookTime-desc':
        return b.cookTime - a.cookTime;
      case 'prepTime':
        return a.prepTime - b.prepTime;
      case 'prepTime-desc':
        return b.prepTime - a.prepTime;
      case 'totalTime':
        return (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
      case 'totalTime-desc':
        return (b.prepTime + b.cookTime) - (a.prepTime + a.cookTime);
      case 'servings':
        return a.servings - b.servings;
      case 'servings-desc':
        return b.servings - a.servings;
      case 'ingredients':
        return a.ingredients.length - b.ingredients.length;
      case 'ingredients-desc':
        return b.ingredients.length - a.ingredients.length;
      default:
        return 0;
    }
  });

  const sortedSharedRecipes = [...sharedRecipes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'cookTime':
        return a.cookTime - b.cookTime;
      case 'cookTime-desc':
        return b.cookTime - a.cookTime;
      case 'prepTime':
        return a.prepTime - b.prepTime;
      case 'prepTime-desc':
        return b.prepTime - a.prepTime;
      case 'totalTime':
        return (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
      case 'totalTime-desc':
        return (b.prepTime + b.cookTime) - (a.prepTime + a.cookTime);
      case 'servings':
        return a.servings - b.servings;
      case 'servings-desc':
        return b.servings - a.servings;
      case 'ingredients':
        return a.ingredients.length - b.ingredients.length;
      case 'ingredients-desc':
        return b.ingredients.length - a.ingredients.length;
      default:
        return 0;
    }
  });

  // Get unique categories for filtering
  const categories = [...new Set(recipes.map(recipe => recipe.category).filter(Boolean))];

  // Filter and sort recipes based on search term, category filter, and sort setting
  const filteredRecipes = recipes
    .filter(recipe => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = recipe.name.toLowerCase().includes(searchLower) ||
                           recipe.description?.toLowerCase().includes(searchLower) ||
                           recipe.category?.toLowerCase().includes(searchLower);
      
      const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'cookTime':
          return (a.cookTime || 0) - (b.cookTime || 0);
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
        default:
          return 0;
      }
    });

  const filteredSharedRecipes = sharedRecipes
    .filter(recipe => {
      const searchLower = searchTerm.toLowerCase();
      return recipe.name.toLowerCase().includes(searchLower) ||
             recipe.description?.toLowerCase().includes(searchLower) ||
             recipe.category?.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'cookTime':
          return (a.cookTime || 0) - (b.cookTime || 0);
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
        default:
          return 0;
      }
    });

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
    <Container 
      maxWidth={false}
      sx={{ 
        py: 4,
        px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
        maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: '1400px', xl: '1600px' }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Recipes
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort by"
              startAdornment={<SortIcon sx={{ mr: 1, fontSize: 20 }} />}
            >
              <MenuItem value="name">Name (A-Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z-A)</MenuItem>
              <MenuItem value="cookTime">Cook Time (Fast-Slow)</MenuItem>
              <MenuItem value="difficulty">Difficulty (Easy-Hard)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            size="small"
          >
            Add Recipe
          </Button>
        </Box>
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
        sx={{ 
          mb: 2,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
          },
        }}
      >
        <Tab label="My Recipes" value="mine" />
        <Tab label="Shared Recipes" value="shared" />
      </Tabs>

      {tab === 'mine' ? (
        filteredRecipes.length > 0 ? (
          <Container maxWidth="xl">
            <Grid container spacing={3}>
              {filteredRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={recipe._id}>
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
                    <Box sx={{ p: 2, flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                        }}
                      >
                        {recipe.name}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          icon={<AccessTimeIcon sx={{ fontSize: '1rem' }} />}
                          label={`${recipe.cookTime} mins`}
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(34, 139, 34, 0.2)'
                              : 'rgba(34, 139, 34, 0.1)',
                            color: '#228B22',
                            '& .MuiChip-icon': {
                              color: '#228B22',
                            },
                          }}
                        />
                        <Chip
                          size="small"
                          icon={<TimerIcon sx={{ fontSize: '1rem' }} />}
                          label={`${recipe.prepTime} mins`}
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(34, 139, 34, 0.2)'
                              : 'rgba(34, 139, 34, 0.1)',
                            color: '#228B22',
                            '& .MuiChip-icon': {
                              color: '#228B22',
                            },
                          }}
                        />
                        {recipe.tags && recipe.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            size="small"
                            label={tag}
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              background: theme.palette.mode === 'dark'
                                ? 'rgba(34, 139, 34, 0.2)'
                                : 'rgba(34, 139, 34, 0.1)',
                              color: '#228B22',
                            }}
                          />
                        ))}
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.4,
                        }}
                      >
                        {recipe.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {recipe.ingredients.length} ingredients
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(recipe);
                            }}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': {
                                background: theme.palette.mode === 'dark'
                                  ? 'rgba(34, 139, 34, 0.1)'
                                  : 'rgba(34, 139, 34, 0.05)',
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecipe(recipe._id);
                            }}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': {
                                background: theme.palette.mode === 'dark'
                                  ? 'rgba(211, 47, 47, 0.1)'
                                  : 'rgba(211, 47, 47, 0.05)',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Container>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No recipes found
            </Typography>
            <Button
              variant="contained"
              onClick={handleOpenDialog}
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
              Add Recipe
            </Button>
          </Box>
        )
      ) : (
        filteredSharedRecipes.length > 0 ? (
          <Container maxWidth="xl">
            <Grid container spacing={3}>
              {filteredSharedRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={recipe._id}>
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
                    <Box sx={{ p: 2, flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                        }}
                      >
                        {recipe.name}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          icon={<AccessTimeIcon sx={{ fontSize: '1rem' }} />}
                          label={`${recipe.cookTime} mins`}
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(34, 139, 34, 0.2)'
                              : 'rgba(34, 139, 34, 0.1)',
                            color: '#228B22',
                            '& .MuiChip-icon': {
                              color: '#228B22',
                            },
                          }}
                        />
                        <Chip
                          size="small"
                          icon={<TimerIcon sx={{ fontSize: '1rem' }} />}
                          label={`${recipe.prepTime} mins`}
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(34, 139, 34, 0.2)'
                              : 'rgba(34, 139, 34, 0.1)',
                            color: '#228B22',
                            '& .MuiChip-icon': {
                              color: '#228B22',
                            },
                          }}
                        />
                        {recipe.tags && recipe.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            size="small"
                            label={tag}
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              background: theme.palette.mode === 'dark'
                                ? 'rgba(34, 139, 34, 0.2)'
                                : 'rgba(34, 139, 34, 0.1)',
                              color: '#228B22',
                            }}
                          />
                        ))}
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.4,
                        }}
                      >
                        {recipe.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {recipe.ingredients.length} ingredients
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateRecipe(recipe._id);
                          }}
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
                          Add
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Container>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No shared recipes found
            </Typography>
          </Box>
        )
      )}

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