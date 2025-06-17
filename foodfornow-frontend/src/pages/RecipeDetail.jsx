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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import api from '../services/api';

const RecipeDetail = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          onClick={() => navigate('/recipes')}
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
          Back to Recipes
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/recipes')}
          sx={{
            mb: 3,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
            textTransform: 'none',
            '&:hover': {
              background: 'transparent',
              color: '#228B22',
            },
          }}
        >
          Back to Recipes
        </Button>

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
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1d1d1f',
              mb: 2,
            }}
          >
            {recipe.name}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Chip
              icon={<AccessTimeIcon />}
              label={`${recipe.cookTime} mins`}
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'rgba(34, 139, 34, 0.2)'
                  : 'rgba(34, 139, 34, 0.1)',
                color: '#228B22',
              }}
            />
            <Chip
              icon={<RestaurantIcon />}
              label={recipe.difficulty || 'Medium'}
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
        </Paper>
      </Container>
    </Box>
  );
};

export default RecipeDetail;