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
  Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import TimerIcon from '@mui/icons-material/Timer';
import LinkIcon from '@mui/icons-material/Link';
import SortIcon from '@mui/icons-material/Sort';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import { useNavigate } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import useMediaQuery from '@mui/material/useMediaQuery';

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
  const ingredientCategories = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];
  const theme = useTheme();

  // Inline create ingredient state
  const [openCreateIngredient, setOpenCreateIngredient] = useState(false);
  const [createIngredientForIndex, setCreateIngredientForIndex] = useState(null);
  const [newIngredientData, setNewIngredientData] = useState({ name: '', category: '', description: '' });
  const [creatingIngredient, setCreatingIngredient] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);

  // Import from URL state
  const [openImportUrl, setOpenImportUrl] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [parsingUrl, setParsingUrl] = useState(false);
  const [importUrlError, setImportUrlError] = useState('');
  const [openCategoryReview, setOpenCategoryReview] = useState(false);
  const [pendingRecipeData, setPendingRecipeData] = useState(null);
  const [categoryOverrides, setCategoryOverrides] = useState({});

  // Shared recipes and tab state
  const [tab, setTab] = useState('mine');
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { authenticated } = useAuth();
  const { showAchievements } = useAchievements();
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

  const handleImportFromUrl = async () => {
    const url = importUrl?.trim();
    if (!url) {
      setImportUrlError('Please enter a recipe URL');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setImportUrlError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      setParsingUrl(true);
      setImportUrlError('');
      const response = await api.post('/recipes/parse-url', { url });
      const recipeData = response.data;

      setOpenImportUrl(false);
      setImportUrl('');

      await fetchIngredients();
      setEditingRecipe(null);
      const mappedIngredients = recipeData.ingredients?.length
        ? recipeData.ingredients.map((ing) => ({
            ingredient: ing.ingredient?._id ?? ing.ingredient,
            quantity: String(ing.quantity ?? ''),
            unit: ing.unit || 'piece',
          }))
        : [{ ingredient: '', quantity: '', unit: '' }];
      setFormData({
        name: recipeData.name,
        description: recipeData.description || recipeData.name,
        ingredients: mappedIngredients,
        instructions: recipeData.instructions?.length
          ? recipeData.instructions
          : [''],
        prepTime: recipeData.prepTime || '',
        cookTime: recipeData.cookTime || '',
        servings: recipeData.servings || '',
        tags: Array.isArray(recipeData.tags) ? recipeData.tags.join(', ') : '',
      });
      setOpenDialog(true);
    } catch (err) {
      setImportUrlError(
        err.response?.data?.error || 'Failed to parse recipe. The site may not be supported.'
      );
    } finally {
      setParsingUrl(false);
    }
  };

  const handleOpenDialog = async (recipe = null) => {
    // Refresh ingredients list when opening the dialog
    await fetchIngredients();
    
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

    try {
      setCreatingIngredient(true);
      const response = await api.post('/ingredients', {
        name: newIngredientData.name.trim(),
        category: newIngredientData.category,
        description: newIngredientData.description?.trim() || undefined,
      });
      const newIng = response.data;
      await fetchIngredients();
      if (createIngredientForIndex !== null) {
        const newIngredients = [...formData.ingredients];
        newIngredients[createIngredientForIndex] = {
          ...newIngredients[createIngredientForIndex],
          ingredient: newIng._id,
        };
        setFormData({ ...formData, ingredients: newIngredients });
      }
      handleCloseCreateIngredient();
    } catch (err) {
      console.error('Error creating ingredient:', err);
      setError(err.response?.data?.message || 'Failed to create ingredient.');
    } finally {
      setCreatingIngredient(false);
    }
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

  // Move instruction up
  const handleMoveInstructionUp = (index) => {
    if (index === 0) return;
    const newInstructions = [...formData.instructions];
    [newInstructions[index - 1], newInstructions[index]] = [newInstructions[index], newInstructions[index - 1]];
    setFormData({ ...formData, instructions: newInstructions });
  };
  // Move instruction down
  const handleMoveInstructionDown = (index) => {
    if (index === formData.instructions.length - 1) return;
    const newInstructions = [...formData.instructions];
    [newInstructions[index + 1], newInstructions[index]] = [newInstructions[index], newInstructions[index + 1]];
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name?.trim()) {
      setError('Recipe name is required');
      return;
    }
    if (!formData.description?.trim()) {
      setError('Recipe description is required');
      return;
    }
    if (!formData.prepTime || formData.prepTime <= 0) {
      setError('Prep time must be greater than 0');
      return;
    }
    if (!formData.cookTime || formData.cookTime <= 0) {
      setError('Cook time must be greater than 0');
      return;
    }
    if (!formData.servings || formData.servings <= 0) {
      setError('Servings must be greater than 0');
      return;
    }
    if (!formData.instructions || formData.instructions.length === 0 || !formData.instructions[0]?.trim()) {
      setError('At least one instruction is required');
      return;
    }
    if (!formData.ingredients || formData.ingredients.length === 0 || !formData.ingredients[0]?.ingredient) {
      setError('At least one ingredient is required');
      return;
    }
    
    try {
      setLoading(true);
      const recipeData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.filter(instruction => instruction.trim()),
        ingredients: formData.ingredients.filter(ing => ing.ingredient && ing.quantity && ing.unit),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (editingRecipe) {
        await api.put(`/recipes/${editingRecipe._id}`, recipeData);
      } else {
        const response = await api.post('/recipes', recipeData);
        
        // Check for achievements in response
        if (response.data.achievements && response.data.achievements.length > 0) {
          showAchievements(response.data.achievements);
        }
      }

      handleCloseDialog();
      await fetchRecipes();
      setError('');
    } catch (err) {
      console.error('Error saving recipe:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save recipe. Please try again.');
      }
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
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 3, md: 4, lg: 6, xl: 8 },
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
            variant="outlined"
            color="primary"
            startIcon={<LinkIcon />}
            onClick={() => {
              setImportUrl('');
              setImportUrlError('');
              setOpenImportUrl(true);
            }}
            size="small"
          >
            Import from URL
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => {
                  setImportUrl('');
                  setImportUrlError('');
                  setOpenImportUrl(true);
                }}
                sx={{
                  textTransform: 'none',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(34, 139, 34, 0.5)' : '#228B22',
                  color: '#228B22',
                  '&:hover': {
                    borderColor: '#228B22',
                    background: theme.palette.mode === 'dark' ? 'rgba(34, 139, 34, 0.1)' : 'rgba(34, 139, 34, 0.05)',
                  },
                }}
              >
                Import from URL
              </Button>
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

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullScreen={isMobile}
      >
        <DialogTitle>{editingRecipe ? 'Edit Recipe' : 'Add Recipe'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={isMobile ? { maxHeight: '80vh', overflowY: 'auto' } : {}}>
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
                    <Autocomplete
                      sx={{ flex: 2 }}
                      options={ingredients}
                      value={ingredients.find((i) => i._id === ingredient.ingredient) || null}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option._id === value?._id}
                      filterOptions={(options, state) => {
                        const filtered = options.filter((opt) =>
                          opt.name.toLowerCase().includes((state.inputValue || '').toLowerCase())
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
                        if (value?.isCreate) {
                          handleOpenCreateIngredient(index, value.prefillName || '');
                        } else if (value) {
                          const newIngredients = [...formData.ingredients];
                          newIngredients[index].ingredient = value._id;
                          setFormData({ ...formData, ingredients: newIngredients });
                        } else {
                          const newIngredients = [...formData.ingredients];
                          newIngredients[index].ingredient = '';
                          setFormData({ ...formData, ingredients: newIngredients });
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Ingredient" required={!ingredient.ingredient} />
                      )}
                    />
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
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
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
                      onClick={() => handleMoveInstructionUp(index)}
                      disabled={index === 0}
                      size="small"
                    >
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

      <Dialog
        open={openImportUrl}
        onClose={() => !parsingUrl && setOpenImportUrl(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Recipe from URL</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste a recipe URL from supported sites (e.g. AllRecipes, Food Network, BBC Good Food, Serious Eats).
            The recipe will be parsed and you can review before saving.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Recipe URL"
            placeholder="https://www.allrecipes.com/recipe/..."
            value={importUrl}
            onChange={(e) => {
              setImportUrl(e.target.value);
              setImportUrlError('');
            }}
            error={!!importUrlError}
            helperText={importUrlError}
            disabled={parsingUrl}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportUrl(false)} disabled={parsingUrl}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImportFromUrl}
            disabled={parsingUrl}
            startIcon={parsingUrl ? <CircularProgress size={20} /> : <LinkIcon />}
          >
            {parsingUrl ? 'Parsing...' : 'Parse Recipe'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCreateIngredient} onClose={handleCloseCreateIngredient} maxWidth="xs" fullWidth>
        <form onSubmit={handleCreateIngredient}>
          <DialogTitle>Create New Ingredient</DialogTitle>
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
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
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
              {creatingIngredient ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Recipes;
