import React, { useState, useEffect, useCallback } from 'react';
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
  Menu,
  MenuItem,
  MenuList,
  Select,
  FormControl,
  InputLabel,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import TimerIcon from '@mui/icons-material/Timer';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SortIcon from '@mui/icons-material/Sort';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import InlineLoaderIcon from '../components/InlineLoaderIcon';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { createWorker } from 'tesseract.js';
import useProgressiveLoader from '../hooks/useProgressiveLoader';
import RecipeFormDialog from '../components/RecipeFormDialog';

const ingredientCategories = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeFormCreateSeed, setRecipeFormCreateSeed] = useState(null);
  const theme = useTheme();

  // Import state
  const [anchorImportMenu, setAnchorImportMenu] = useState(null);
  const [openImportUrl, setOpenImportUrl] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [parsingUrl, setParsingUrl] = useState(false);
  const [importUrlError, setImportUrlError] = useState('');
  const [openImportImage, setOpenImportImage] = useState(false);
  const [importImageFile, setImportImageFile] = useState(null);
  const [parsingImage, setParsingImage] = useState(false);
  const [importImageError, setImportImageError] = useState('');
  const [openImportText, setOpenImportText] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsingText, setParsingText] = useState(false);
  const [importTextError, setImportTextError] = useState('');
  const [openCategoryReview, setOpenCategoryReview] = useState(false);
  const [pendingRecipeData, setPendingRecipeData] = useState(null);
  const [categoryOverrides, setCategoryOverrides] = useState({});

  // Delete confirmation
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Shared recipes and tab state
  const [tab, setTab] = useState('mine');
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const { authenticated } = useAuth();
  const { showAchievements } = useAchievements();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { startTask, markHydrated, showBusyBar, showSkeleton, appHasHydratedOnce } = useProgressiveLoader();

  // Open create-recipe dialog when arriving from dashboard (plus button) — same as clicking "Add Recipe"
  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    setSearchParams({}, { replace: true });
    setRecipeFormCreateSeed(null);
    setEditingRecipe(null);
    setOpenDialog(true);
  }, [searchParams, setSearchParams]);

  // When edit dialog is open, scroll the recipe card into view so it's visible behind the dialog
  useEffect(() => {
    if (!openDialog || !editingRecipe?._id) return;
    const id = String(editingRecipe._id);
    const timer = setTimeout(() => {
      document.querySelector(`[data-recipe-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
    return () => clearTimeout(timer);
  }, [openDialog, editingRecipe]);

  const runTask = useCallback(
    async (task, options = {}) => {
      const { hydrate = false } = options;
      const stop = startTask();
      try {
        const result = await task();
        if (hydrate) {
          markHydrated();
        }
        return result;
      } finally {
        stop();
      }
    },
    [startTask, markHydrated]
  );

  const disablePageActions = showSkeleton || showBusyBar;
  const invalidateRecipesCache = useCallback(() => {
    api.invalidateCache((key) => key.includes('/recipes'));
  }, []);

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

  // Filter and sort recipes based on search term and sort setting
  const filteredRecipes = recipes
    .filter(recipe => {
      const searchLower = searchTerm.toLowerCase();
      return recipe.name.toLowerCase().includes(searchLower) ||
             recipe.description?.toLowerCase().includes(searchLower);
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
             recipe.description?.toLowerCase().includes(searchLower);
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
  const fetchRecipes = async ({ forceRefresh = false } = {}) => {
    try {
      const response = await api.cachedGet('/recipes', {
        params: { search: tab === 'mine' ? searchTerm : undefined },
        cacheTtl: 5 * 60 * 1000,
        forceRefresh,
      });
      setRecipes(response.data);
    } catch (err) {
      setError('Failed to fetch recipes. Please try again.');
    }
  };

  const fetchSharedRecipes = async ({ forceRefresh = false } = {}) => {
    try {
      const response = await api.cachedGet('/recipes/shared', {
        params: { search: searchTerm },
        cacheTtl: 2 * 60 * 1000,
        forceRefresh,
      });
      setSharedRecipes(response.data);
    } catch (err) {
      console.error('Error fetching shared recipes:', err);
      setError('Failed to fetch shared recipes');
    }
  };

  useEffect(() => {
    if (!authenticated) return;

    const load = async () => {
      try {
        await fetchRecipes({ forceRefresh: true });
        markHydrated();
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
      }
    };

    if (appHasHydratedOnce) {
      load();
    } else {
      runTask(load, { hydrate: true });
    }
  }, [authenticated, runTask, appHasHydratedOnce, markHydrated]);

  // Fetch when tab or searchTerm changes — silent (no loading bar) so tab switch feels instant
  useEffect(() => {
    if (!authenticated) return;
    if (tab === 'shared') {
      fetchSharedRecipes({ forceRefresh: true });
    } else if (tab === 'mine') {
      fetchRecipes({ forceRefresh: true });
    }
  }, [tab, searchTerm, authenticated]);

  const openRecipeFormWithData = (recipeData) => {
    setRecipeFormCreateSeed(recipeData);
    setEditingRecipe(null);
    setOpenDialog(true);
  };

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

      await processImportedRecipeData(recipeData);
    } catch (err) {
      setImportUrlError(
        err.response?.data?.error || 'Failed to parse recipe. The site may not be supported.'
      );
    } finally {
      setParsingUrl(false);
    }
  };

  const processImportedRecipeData = async (recipeData) => {
    const uncertainIngredients = recipeData.ingredients?.filter((ing) => ing.uncertain) || [];
    if (uncertainIngredients.length > 0) {
      const initialOverrides = {};
      uncertainIngredients.forEach((ing) => {
        initialOverrides[ing.name] = ing.suggestedCategory || 'Other';
      });
      setCategoryOverrides(initialOverrides);
      setPendingRecipeData(recipeData);
      setOpenCategoryReview(true);
    } else {
      const prepResponse = await api.post('/recipes/prepare-import', {
        recipeData,
        categoryOverrides: {},
      });
      openRecipeFormWithData(prepResponse.data);
    }
  };

  const handleImportFromImage = async () => {
    if (!importImageFile) {
      setImportImageError('Please select an image');
      return;
    }

    try {
      setParsingImage(true);
      setImportImageError('');
      const worker = await createWorker('eng');
      try {
        const { data: { text } } = await worker.recognize(importImageFile);
        if (!text?.trim()) {
          setImportImageError('Could not read any text from the image. Try a clearer photo.');
          return;
        }
        const response = await api.post('/recipes/parse-text', { text });
        const recipeData = response.data;

        setOpenImportImage(false);
        setImportImageFile(null);

        await processImportedRecipeData(recipeData);
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      setImportImageError(
        err.response?.data?.error || 'Failed to parse recipe from image. Try a clearer photo.'
      );
    } finally {
      setParsingImage(false);
    }
  };

  const handleImportFromText = async () => {
    const text = importText?.trim();
    if (!text) {
      setImportTextError('Please paste recipe text');
      return;
    }

    try {
      setParsingText(true);
      setImportTextError('');
      const response = await api.post('/recipes/parse-text', { text });
      const recipeData = response.data;

      setOpenImportText(false);
      setImportText('');

      await processImportedRecipeData(recipeData);
    } catch (err) {
      setImportTextError(
        err.response?.data?.error || 'Failed to parse recipe. Make sure the text includes a title, ingredients, and instructions.'
      );
    } finally {
      setParsingText(false);
    }
  };

  const handleCategoryReviewContinue = async () => {
    if (!pendingRecipeData) return;
    try {
      setParsingUrl(true);
      const response = await api.post('/recipes/prepare-import', {
        recipeData: pendingRecipeData,
        categoryOverrides,
      });
      setOpenCategoryReview(false);
      setPendingRecipeData(null);
      setCategoryOverrides({});
      openRecipeFormWithData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to prepare recipe import.');
    } finally {
      setParsingUrl(false);
    }
  };

  const handleOpenDialog = (recipe = null) => {
    setRecipeFormCreateSeed(null);
    setEditingRecipe(recipe || null);
    setOpenDialog(true);
  };

  const handleCloseRecipeForm = () => {
    setOpenDialog(false);
    setEditingRecipe(null);
    setRecipeFormCreateSeed(null);
  };

  const handleRecipeSaved = async (payload) => {
    if (payload?.achievements?.length) {
      showAchievements(payload.achievements);
    }
    invalidateRecipesCache();
    await fetchRecipes({ forceRefresh: true });
  };

  const handleDeleteRecipeClick = (recipe) => {
    setRecipeToDelete(recipe);
  };

  const handleDeleteRecipeConfirm = async () => {
    if (!recipeToDelete) return;
    const recipeId = String(recipeToDelete._id);
    const previousRecipes = recipes;
    setRecipes((prev) => prev.filter((r) => String(r._id) !== recipeId));
    setError('');
    setRecipeToDelete(null);
    setDeleting(true);

    try {
      await api.delete(`/recipes/${recipeId}`);
      invalidateRecipesCache();
      await fetchRecipes({ forceRefresh: true });
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setRecipes(previousRecipes);
      setError(err.response?.data?.error || 'Failed to delete recipe. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicateRecipe = async (id) => {
    try {
      await runTask(async () => {
        const response = await api.post(`/recipes/${id}/duplicate`);
        if (response.data.achievements && response.data.achievements.length > 0) {
          showAchievements(response.data.achievements);
        }
        invalidateRecipesCache();
        await fetchRecipes({ forceRefresh: true });
      });
      setError('');
    } catch (err) {
      console.error('Error duplicating recipe:', err);
      if (err.response?.status === 409) {
        setError('You already have this recipe in your collection.');
      } else {
        setError('Failed to add recipe. Please try again.');
      }
    }
  };

  const busyIndicator = showBusyBar ? (
    <LinearProgress
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: theme.zIndex.tooltip + 1,
      }}
    />
  ) : null;

  if (showSkeleton) {
    return (
      <PageLoader
        maxWidth="xl"
        headingWidth="45%"
        blocks={[
          { height: 160, xs: 12 },
          { height: 360, xs: 12 },
          { height: 360, xs: 12 },
        ]}
      />
    );
  }

  return (
    <Container 
      maxWidth={false}
      sx={{ 
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 3, md: 4, lg: 6, xl: 8 }
      }}
    >
      {busyIndicator}
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={(e) => setAnchorImportMenu(e.currentTarget)}
            size="small"
          >
            Import
          </Button>
          <Menu
            anchorEl={anchorImportMenu}
            open={!!anchorImportMenu}
            onClose={() => setAnchorImportMenu(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <MenuList>
              <MenuItem
                onClick={() => {
                  setAnchorImportMenu(null);
                  setImportUrl('');
                  setImportUrlError('');
                  setOpenImportUrl(true);
                }}
              >
                <LinkIcon sx={{ mr: 1.5, fontSize: 20 }} />
                From URL
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorImportMenu(null);
                  setImportImageFile(null);
                  setImportImageError('');
                  setOpenImportImage(true);
                }}
              >
                <ImageIcon sx={{ mr: 1.5, fontSize: 20 }} />
                From handwritten recipe card
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorImportMenu(null);
                  setImportText('');
                  setImportTextError('');
                  setOpenImportText(true);
                }}
              >
                <ContentPasteIcon sx={{ mr: 1.5, fontSize: 20 }} />
                Paste recipe text
              </MenuItem>
            </MenuList>
          </Menu>
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
          <Box>
            <Grid container spacing={3}>
              {filteredRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={recipe._id}>
                  <Paper
                    data-recipe-id={recipe._id}
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
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
                  >
                    <Box
                      sx={{ p: 2, flex: 1, cursor: 'pointer' }}
                      onClick={() => navigate(`/recipes/${recipe._id}`)}
                    >
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
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, px: 2, pb: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(recipe)}
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
                        onClick={() => handleDeleteRecipeClick(recipe)}
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
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : recipes.length === 0 ? (
          <EmptyState
            icon={<MenuBookIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
            title="Add your first recipe"
            description="Create a recipe manually or import from a URL or handwritten recipe card."
            primaryAction={{
              label: 'Add Recipe',
              onClick: () => handleOpenDialog(),
              startIcon: <AddIcon />,
            }}
            secondaryAction={{
              label: 'Import',
              onClick: (e) => setAnchorImportMenu(e.currentTarget),
              startIcon: <ImageIcon />,
            }}
          />
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No recipes match your search
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try changing your search or filters.
            </Typography>
          </Box>
        )
      ) : (
        filteredSharedRecipes.length > 0 ? (
          <Box>
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
          </Box>
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

      <RecipeFormDialog
        open={openDialog}
        onClose={handleCloseRecipeForm}
        editingRecipe={editingRecipe}
        createSeed={recipeFormCreateSeed}
        onSaved={handleRecipeSaved}
        runTask={runTask}
        submitDisabled={disablePageActions}
      />

      <Dialog
        open={Boolean(recipeToDelete)}
        onClose={() => !deleting && setRecipeToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete recipe?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {recipeToDelete
              ? `Are you sure you want to delete "${recipeToDelete.name}"? This cannot be undone.`
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecipeToDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRecipeConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
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
            Paste a recipe URL from supported sites (e.g. AllRecipes, Food Network, BBC Good Food, Serious Eats, TheKitchn, ChewOutLoud).
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
            startIcon={parsingUrl ? <InlineLoaderIcon size={20} /> : <LinkIcon />}
          >
            {parsingUrl ? 'Parsing...' : 'Parse Recipe'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openImportImage}
        onClose={() => !parsingImage && (setOpenImportImage(false), setImportImageFile(null), setImportImageError(''))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import from handwritten recipe card</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Take or upload a photo of a handwritten recipe card. We&apos;ll extract the text and turn it into a recipe.
            Clear, legible handwriting works best.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ py: 3, borderStyle: 'dashed' }}
            disabled={parsingImage}
          >
            {importImageFile ? importImageFile.name : 'Choose image or take photo'}
            <input
              type="file"
              hidden
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImportImageFile(file || null);
                setImportImageError('');
              }}
            />
          </Button>
          {importImageError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {importImageError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenImportImage(false);
              setImportImageFile(null);
              setImportImageError('');
            }}
            disabled={parsingImage}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImportFromImage}
            disabled={parsingImage || !importImageFile}
            startIcon={parsingImage ? <InlineLoaderIcon size={20} /> : <ImageIcon />}
          >
            {parsingImage ? 'Reading...' : 'Import recipe'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openImportText}
        onClose={() => !parsingText && (setOpenImportText(false), setImportText(''), setImportTextError(''))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Paste recipe text</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste a recipe you copied from a blog, note, or message. Include a title, ingredients, and instructions so we can parse it.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={10}
            maxRows={20}
            label="Recipe text"
            placeholder="Paste your recipe here..."
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportTextError('');
            }}
            error={!!importTextError}
            helperText={importTextError}
            disabled={parsingText}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenImportText(false);
              setImportText('');
              setImportTextError('');
            }}
            disabled={parsingText}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImportFromText}
            disabled={parsingText || !importText?.trim()}
            startIcon={parsingText ? <InlineLoaderIcon size={20} /> : <ContentPasteIcon />}
          >
            {parsingText ? 'Parsing...' : 'Import recipe'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCategoryReview}
        onClose={() => !parsingUrl && !parsingImage && (setOpenCategoryReview(false), setPendingRecipeData(null))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select categories for ingredients</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We couldn&apos;t determine the category for these ingredients. Please select the best match.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pendingRecipeData?.ingredients
              ?.filter((ing) => ing.uncertain)
              .map((ing) => (
                <Box
                  key={ing.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography sx={{ flex: '1 1 200px', minWidth: 0 }} noWrap>
                    {ing.name}
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryOverrides[ing.name] ?? ing.suggestedCategory ?? 'Other'}
                      onChange={(e) =>
                        setCategoryOverrides((prev) => ({ ...prev, [ing.name]: e.target.value }))
                      }
                      label="Category"
                    >
                      {ingredientCategories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCategoryReview(false);
              setPendingRecipeData(null);
            }}
            disabled={parsingUrl}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCategoryReviewContinue}
            disabled={parsingUrl}
          >
            {parsingUrl ? 'Preparing...' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>

          </Container>
  );
};

export default Recipes;
