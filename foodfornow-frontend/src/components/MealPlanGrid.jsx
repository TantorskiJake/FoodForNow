import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText as MuiListItemText,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../services/api';
import { useAchievements } from '../context/AchievementContext';

const MealPlanGrid = ({ mealPlan = [], onAddMeal, onDeleteMeal, onEditMeal, onMealPlanUpdate, onAddRecipeToSlot }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showAchievements } = useAchievements();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [recipeToCopy, setRecipeToCopy] = useState(null);
  const [missingIngredientsDialog, setMissingIngredientsDialog] = useState(false);
  const [missingIngredients, setMissingIngredients] = useState([]);
  const [selectedMealForCooking, setSelectedMealForCooking] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

  const handleMealClick = (meal, event) => {
    if (!meal) return;
    setSelectedMeal(meal);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMeal(null);
  };

  const handleEditMeal = () => {
    if (selectedMeal) {
      onEditMeal(selectedMeal.day, selectedMeal.meal, selectedMeal);
    }
    handleMenuClose();
  };

  const handleViewRecipe = () => {
    if (selectedMeal?.recipe?._id) {
      navigate(`/recipes/${selectedMeal.recipe._id}`);
    } else if (selectedMeal?.eatingOut && selectedMeal?.restaurant?.url) {
      window.open(selectedMeal.restaurant.url, '_blank');
    }
    handleMenuClose();
  };

  const handleToggleCooked = async (meal, event) => {
    event.stopPropagation();
    
    // If already cooked, do nothing (cooked meals cannot be uncooked)
    if (meal.cooked) {
      return;
    }

    // If not cooked, try to cook the meal
    try {
      const response = await api.patch(`/mealplan/${meal._id}/cook`, {
        addMissingToShoppingList: false
      });
      
      // Check for achievements in response
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      
      if (onMealPlanUpdate) {
        const updatedMeal = response.data.mealPlanItem ?? response.data;
        onMealPlanUpdate(updatedMeal);
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.missingIngredients) {
        // Show missing ingredients dialog
        setMissingIngredients(error.response.data.missingIngredients);
        setSelectedMealForCooking(meal);
        setMissingIngredientsDialog(true);
      } else if (error.response?.data?.error === 'Pantry not found') {
        setSnackbarMessage('You need to add at least one item to your pantry before you can cook meals!');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      } else if (error.response?.data?.error) {
        setSnackbarMessage(error.response.data.error);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Failed to cook meal. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleAddMissingToShoppingList = async () => {
    if (!selectedMealForCooking) return;
    
    try {
      const response = await api.patch(`/mealplan/${selectedMealForCooking._id}/cook`, {
        addMissingToShoppingList: true
      });
      
      // Check for achievements in response
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements);
      }
      
      // Only update the meal plan if it was actually marked as cooked
      if (response.data.mealPlanItem.cooked) {
        if (onMealPlanUpdate) {
          onMealPlanUpdate(response.data.mealPlanItem);
        }
      } else {
        // If not cooked, just refresh the meal plan to show current state
        // The meal should remain uncooked
        window.location.reload();
      }
      
      setMissingIngredientsDialog(false);
      setMissingIngredients([]);
      setSelectedMealForCooking(null);
    } catch (error) {
      console.error('Error cooking meal with shopping list:', error);
    }
  };

  const handleCloseMissingIngredientsDialog = () => {
    setMissingIngredientsDialog(false);
    setMissingIngredients([]);
    setSelectedMealForCooking(null);
  };

  const handleCopyRecipe = (meal, event) => {
    event.stopPropagation();
    if (meal?.recipe) {
      setRecipeToCopy(meal.recipe);
    }
  };

  const handleCancelCopyMode = () => {
    setRecipeToCopy(null);
  };

  // Escape key exits copy mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && recipeToCopy) {
        handleCancelCopyMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recipeToCopy]);

  // Click outside meal cards exits copy mode (capture phase to catch all clicks)
  useEffect(() => {
    if (!recipeToCopy) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-meal-card]') && !e.target.closest('[role="alert"]')) {
        handleCancelCopyMode();
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [recipeToCopy]);

  const handleCardClick = (meal, day, mealType, event) => {
    if (recipeToCopy) {
      event.stopPropagation();
      if (!onAddRecipeToSlot) return;
      // Skip if this slot already has the same recipe
      if (meal?.recipe?._id === recipeToCopy._id) return;
      onAddRecipeToSlot(day, mealType, recipeToCopy, meal?._id);
      return;
    }
    // Not in copy mode - normal click behavior
    if (meal) {
      handleMealClick(meal, event);
    } else {
      onAddMeal(day, mealType);
    }
  };

  const getMealName = (meal) => {
    if (!meal) return 'No Recipe';
    if (meal.eatingOut && meal.restaurant?.name) {
      return meal.restaurant.name;
    }
    if (!meal.recipe) return 'Recipe not found';
    return meal.recipe.name || 'Unnamed Recipe';
  };

  const getDynamicFontSize = (text) => {
    if (!text) return '1rem';
    
    const length = text.length;
    
    if (length <= 8) return '1.3rem';
    if (length <= 12) return '1.2rem';
    if (length <= 16) return '1.1rem';
    if (length <= 20) return '1rem';
    if (length <= 25) return '0.95rem';
    if (length <= 30) return '0.9rem';
    return '0.85rem';
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={1.5}>
        {/* Header row with days */}
        <Grid item xs={12}>
          <Grid container spacing={1}>
            <Grid item xs={1} /> {/* Spacer for meal type labels */}
            {days.map((day) => (
              <Grid item xs={11/7} key={day}>
                <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold', m: 0, p: 0, lineHeight: 1.1 }}>
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Meal rows */}
        {mealTypes.map((mealType) => (
          <Grid item xs={12} key={mealType}>
            <Grid container spacing={1}>
              {/* Meal type label */}
              <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', p: 0, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', m: 0, p: 0, lineHeight: 1.1 }}>
                  {mealType}
                </Typography>
              </Grid>

              {/* Meal slots for each day */}
              {days.map((day) => {
                const meal = mealPlan.find(
                  (m) => m?.day?.toLowerCase() === day.toLowerCase() && m?.meal === mealType
                );
                const isCooked = meal?.cooked || false;
                const isEatingOut = meal?.eatingOut || false;
                const cardBg = meal
                  ? (isCooked ? 'success.light' : 'success.dark')
                  : theme.palette.mode === 'dark' ? 'background.paper' : 'grey.100';
                const cardHoverBg = meal
                  ? (isCooked ? 'success.main' : 'success.main')
                  : theme.palette.mode === 'dark' ? 'action.hover' : 'grey.200';
                
                return (
                  <Grid item xs={11/7} key={`${day}-${mealType}`} sx={{ p: 0 }}>
                    <Card 
                      data-meal-card
                      sx={{ 
                        height: '100%',
                        minHeight: 90,
                        bgcolor: cardBg,
                        '&:hover': {
                          bgcolor: cardHoverBg,
                          cursor: 'pointer',
                          ...(recipeToCopy && {
                            border: '2px dashed',
                            borderColor: 'primary.main',
                            boxSizing: 'border-box'
                          })
                        },
                        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                        position: 'relative',
                        overflow: 'visible',
                        m: 0
                      }}
                      onClick={(e) => handleCardClick(meal, day, mealType, e)}
                    >
                      <CardContent sx={{ 
                        p: 0.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        justifyContent: 'center',
                        m: 0
                      }}>
                        {meal ? (
                          <>
                            {/* Cooking status indicator - positioned top-left */}
                            <Box sx={{ 
                              position: 'absolute',
                              top: 2,
                              left: 2,
                              zIndex: 1
                            }}>
                              <Tooltip title={isCooked ? (isEatingOut ? 'Already marked' : 'Already cooked') : (isEatingOut ? 'Mark as eaten' : 'Mark as cooked')}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleToggleCooked(meal, e)}
                                    sx={{
                                      bgcolor: isCooked ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                      color: 'white',
                                      width: 20,
                                      height: 20,
                                      '&:hover': {
                                        bgcolor: isCooked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                                      },
                                      p: 0
                                    }}
                                  >
                                    {isCooked ? (
                                      <CheckCircleIcon sx={{ fontSize: 14 }} />
                                    ) : (
                                      <RestaurantMenuIcon sx={{ fontSize: 14 }} />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>

                            <Typography 
                              variant="body2" 
                              sx={{
                                wordBreak: 'break-word',
                                overflow: 'hidden',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.1,
                                fontSize: getDynamicFontSize(getMealName(meal)),
                                pt: 2,
                                color: 'white',
                                pl: 0.75, // theme.spacing(0.75) ~6px
                                pr: 0.75, // theme.spacing(0.75) ~6px
                                textAlign: 'center',
                                minHeight: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 500,
                                m: 0
                              }}
                            >
                              {getMealName(meal)}
                            </Typography>
                            
                            <Box sx={{ 
                              position: 'absolute', 
                              top: 0, 
                              right: 0,
                              display: 'flex',
                              gap: 0.25
                            }}>
                              {!meal.eatingOut && (
                              <Tooltip title="Copy to other days">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleCopyRecipe(meal, e)}
                                    sx={{ 
                                      p: 0.25,
                                      color: 'white',
                                      m: 0,
                                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                                    }}
                                  >
                                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              )}
                              <Tooltip title="Delete meal">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (meal._id) {
                                        onDeleteMeal(meal._id);
                                      }
                                    }}
                                    sx={{ 
                                      p: 0.25,
                                      color: 'white',
                                      m: 0,
                                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </>
                        ) : (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            align="center"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              m: 0
                            }}
                          >
                            Click to add meal
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        ))}
      </Grid>

      {/* Missing Ingredients Dialog */}
      <Dialog 
        open={missingIngredientsDialog} 
        onClose={handleCloseMissingIngredientsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Missing Ingredients</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            The following ingredients are missing from your pantry:
          </Typography>
          <List>
            {missingIngredients.map((ingredient, index) => (
              <ListItem key={index}>
                <MuiListItemText
                  primary={ingredient.ingredient.name}
                  secondary={`${ingredient.quantity} ${ingredient.unit} needed (${ingredient.available} ${ingredient.unit} available)`}
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Would you like to add the missing ingredients to your shopping list?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMissingIngredientsDialog}>Cancel</Button>
          <Button onClick={handleAddMissingToShoppingList} variant="contained" color="primary">
            Add to Shopping List
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarMessage.includes('pantry') ? null : 4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}
          action={
            snackbarMessage.includes('pantry') ? (
              <Button color="inherit" size="small" onClick={() => { setSnackbarOpen(false); navigate('/pantry'); }}>
                Go to Pantry
              </Button>
            ) : null
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Copy mode snackbar */}
      <Snackbar
        open={Boolean(recipeToCopy)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 6 }}
      >
        <Alert 
          severity="info" 
          sx={{ width: '100%' }}
          onClose={handleCancelCopyMode}
          action={
            <Button color="inherit" size="small" onClick={handleCancelCopyMode}>
              Cancel
            </Button>
          }
        >
          Click a card to add &quot;{recipeToCopy?.name || 'recipe'}&quot; to that day. Press Esc to cancel.
        </Alert>
      </Snackbar>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditMeal}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Meal</ListItemText>
        </MenuItem>
        {selectedMeal?.recipe?._id && (
          <MenuItem onClick={handleViewRecipe}>
            <ListItemIcon>
              <RestaurantIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Recipe</ListItemText>
          </MenuItem>
        )}
        {selectedMeal?.eatingOut && selectedMeal?.restaurant?.url && (
          <MenuItem onClick={handleViewRecipe}>
            <ListItemIcon>
              <RestaurantIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Open website</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default MealPlanGrid;