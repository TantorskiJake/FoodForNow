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
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../services/api';
import { useAchievements } from '../context/AchievementContext';

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MealPlanGrid = ({ mealPlan = [], days: daysProp, onAddMeal, onDeleteMeal, onEditMeal, onMealPlanUpdate, onAddRecipeToSlot, onAddRestaurantToSlot }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showAchievements } = useAchievements();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [itemsToCopy, setItemsToCopy] = useState([]);
  const [copyChoiceAnchor, setCopyChoiceAnchor] = useState(null);
  const [copyChoiceMeal, setCopyChoiceMeal] = useState(null);
  const [missingIngredientsDialog, setMissingIngredientsDialog] = useState(false);
  const [missingIngredients, setMissingIngredients] = useState([]);
  const [selectedMealForCooking, setSelectedMealForCooking] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [uncookConfirmOpen, setUncookConfirmOpen] = useState(false);
  const [mealToUncook, setMealToUncook] = useState(null);
  const days = Array.isArray(daysProp) && daysProp.length === 7 ? daysProp : DEFAULT_DAYS;
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

    // If already cooked, show confirmation before uncooking
    if (meal.cooked) {
      setMealToUncook(meal);
      setUncookConfirmOpen(true);
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
      
      const addedCount = response.data.addedToShoppingList ?? missingIngredients.length;
      setSnackbarMessage(addedCount === 1
        ? 'Added 1 ingredient to your shopping list'
        : `Added all ${addedCount} ingredients to your shopping list`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Only update the meal plan if it was actually marked as cooked
      if (response.data.mealPlanItem?.cooked) {
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
      setSnackbarMessage(error.response?.data?.error || 'Failed to add ingredients to shopping list. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseMissingIngredientsDialog = () => {
    setMissingIngredientsDialog(false);
    setMissingIngredients([]);
    setSelectedMealForCooking(null);
  };

  const handleUncookConfirm = async () => {
    if (!mealToUncook) return;
    try {
      const response = await api.patch(`/mealplan/${mealToUncook._id}/cooked`);
      if (onMealPlanUpdate) {
        onMealPlanUpdate(response.data);
      }
      setUncookConfirmOpen(false);
      setMealToUncook(null);
    } catch (error) {
      setSnackbarMessage(error.response?.data?.error || 'Failed to uncook meal. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setUncookConfirmOpen(false);
      setMealToUncook(null);
    }
  };

  const handleUncookCancel = () => {
    setUncookConfirmOpen(false);
    setMealToUncook(null);
  };

  const getMealsInSlot = (day, mealType) =>
    mealPlan.filter(
      (m) => m?.day?.toLowerCase() === day?.toLowerCase() && m?.meal === mealType
    );

  const mealToCopyItem = (meal) => {
    if (meal?.eatingOut && meal?.restaurant?.name) {
      return { type: 'restaurant', restaurant: meal.restaurant };
    }
    if (meal?.recipe) {
      return { type: 'recipe', recipe: meal.recipe };
    }
    return null;
  };

  const canCopyMeal = (meal) =>
    (meal?.recipe && !meal?.eatingOut) || (meal?.eatingOut && meal?.restaurant?.name);

  const handleCopyMeal = (meal, event) => {
    event.stopPropagation();
    const item = mealToCopyItem(meal);
    if (!item) return;
    const day = meal.day;
    const mealType = meal.meal;
    const inSlot = getMealsInSlot(day, mealType).filter(canCopyMeal);
    if (inSlot.length <= 1) {
      setItemsToCopy([item]);
      return;
    }
    setCopyChoiceMeal(meal);
    setCopyChoiceAnchor(event.currentTarget);
  };

  const handleCopyThisMeal = () => {
    const item = mealToCopyItem(copyChoiceMeal);
    if (item) setItemsToCopy([item]);
    setCopyChoiceAnchor(null);
    setCopyChoiceMeal(null);
  };

  const handleCopyAllMealsInSlot = () => {
    if (!copyChoiceMeal) return;
    const inSlot = getMealsInSlot(copyChoiceMeal.day, copyChoiceMeal.meal);
    const items = inSlot.map(mealToCopyItem).filter(Boolean);
    if (items.length > 0) setItemsToCopy(items);
    setCopyChoiceAnchor(null);
    setCopyChoiceMeal(null);
  };

  const handleCancelCopyMode = () => {
    setItemsToCopy([]);
  };

  // Escape key exits copy mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && itemsToCopy.length > 0) {
        handleCancelCopyMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemsToCopy.length]);

  // Click outside meal cards exits copy mode (capture phase to catch all clicks)
  useEffect(() => {
    if (itemsToCopy.length === 0) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-meal-card]') && !e.target.closest('[role="alert"]')) {
        handleCancelCopyMode();
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [itemsToCopy.length]);

  const pasteCopyItems = async (day, mealType) => {
    for (const item of itemsToCopy) {
      if (item.type === 'recipe' && item.recipe && onAddRecipeToSlot) {
        await onAddRecipeToSlot(day, mealType, item.recipe, null);
      } else if (item.type === 'restaurant' && item.restaurant && onAddRestaurantToSlot) {
        await onAddRestaurantToSlot(day, mealType, item.restaurant);
      }
    }
  };

  const handleSlotClick = async (mealsInSlot, day, mealType, event) => {
    if (itemsToCopy.length > 0) {
      event.stopPropagation();
      await pasteCopyItems(day, mealType);
      return;
    }
    if (mealsInSlot.length === 0) {
      onAddMeal(day, mealType);
    }
  };

  const handleMealCardClick = async (meal, day, mealType, event) => {
    event.stopPropagation();
    if (itemsToCopy.length > 0) {
      await pasteCopyItems(day, mealType);
      return;
    }
    handleMealClick(meal, event);
  };

  const handleAddAnotherClick = (day, mealType, event) => {
    event.stopPropagation();
    onAddMeal(day, mealType);
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

              {/* Meal slots for each day - multiple meals per slot supported */}
              {days.map((day) => {
                const mealsInSlot = mealPlan.filter(
                  (m) => m?.day?.toLowerCase() === day.toLowerCase() && m?.meal === mealType
                );
                const slotEmpty = mealsInSlot.length === 0;
                const cardBg = slotEmpty
                  ? (theme.palette.mode === 'dark' ? 'background.paper' : 'grey.100')
                  : 'transparent';
                const cardHoverBg = slotEmpty
                  ? (theme.palette.mode === 'dark' ? 'action.hover' : 'grey.200')
                  : 'transparent';

                return (
                  <Grid item xs={11/7} key={`${day}-${mealType}`} sx={{ p: 0 }}>
                    <Card
                      data-meal-card
                      sx={{
                        height: '100%',
                        minHeight: 180,
                        bgcolor: cardBg,
                        '&:hover': {
                          bgcolor: cardHoverBg,
                          cursor: slotEmpty || itemsToCopy.length > 0 ? 'pointer' : 'default',
                          ...(itemsToCopy.length > 0 && {
                            border: '2px dashed',
                            borderColor: 'primary.main',
                            boxSizing: 'border-box'
                          })
                        },
                        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        m: 0
                      }}
                      onClick={(e) => handleSlotClick(mealsInSlot, day, mealType, e)}
                    >
                      <CardContent sx={{
                        p: slotEmpty ? 0.5 : 0,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        justifyContent: 'flex-start',
                        m: 0,
                        '&:last-child': { pb: slotEmpty ? 1 : 0 }
                      }}>
                        {slotEmpty ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: 1,
                              m: 0
                            }}
                          >
                            Click to add meal
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0,
                              bgcolor: 'success.dark',
                              borderRadius: 'inherit'
                            }}
                          >
                            {mealsInSlot.map((meal, index) => {
                              const isCooked = meal?.cooked || false;
                              const isEatingOut = meal?.eatingOut || false;
                              const mealCardBg = isCooked ? 'success.light' : 'success.dark';
                              return (
                                <Box
                                  key={meal._id}
                                  data-meal-card
                                  onClick={(e) => handleMealCardClick(meal, day, mealType, e)}
                                  sx={{
                                    position: 'relative',
                                    zIndex: index + 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: mealCardBg,
                                    flex: '1 1 0',
                                    minHeight: 44,
                                    py: 0.5,
                                    px: 1,
                                    cursor: 'pointer',
                                    borderBottom: index < mealsInSlot.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                    '&:hover': { bgcolor: 'success.main' }
                                  }}
                                >
                                  <Box sx={{ position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'center', gap: 0, zIndex: 1 }}>
                                    {index === 0 && (
                                      <Tooltip title="Add another meal">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => handleAddAnotherClick(day, mealType, e)}
                                          sx={{ color: 'white', width: 24, height: 24, p: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                        >
                                          <AddIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    <Tooltip title={isCooked ? (isEatingOut ? 'Already marked' : 'Uncook') : (isEatingOut ? 'Mark as eaten' : 'Mark as cooked')}>
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={(e) => handleToggleCooked(meal, e)}
                                          sx={{ color: 'white', width: 24, height: 24, p: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                        >
                                          {isCooked ? (
                                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                                          ) : (
                                            <RestaurantMenuIcon sx={{ fontSize: 16 }} />
                                          )}
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Box>
                                  <Box sx={{ position: 'absolute', right: 0, top: 0, display: 'flex', alignItems: 'center', gap: 0, zIndex: 2 }}>
                                    {canCopyMeal(meal) && (
                                      <Tooltip title="Copy to other days">
                                        <span>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => handleCopyMeal(meal, e)}
                                            sx={{ color: 'white', width: 24, height: 24, p: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                          >
                                            <ContentCopyIcon sx={{ fontSize: 16 }} />
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
                                            if (meal._id) onDeleteMeal(meal._id);
                                          }}
                                          sx={{ color: 'white', width: 24, height: 24, p: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                        >
                                          <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: 'white',
                                      fontWeight: 600,
                                      textAlign: 'center',
                                      width: '100%',
                                      fontSize: getDynamicFontSize(getMealName(meal)),
                                      px: 0.5,
                                      pl: 3,
                                      pr: 3,
                                      lineHeight: 1.25,
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {getMealName(meal)}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
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
            Would you like to add all missing ingredients to your shopping list?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMissingIngredientsDialog}>Cancel</Button>
          <Button onClick={handleAddMissingToShoppingList} variant="contained" color="primary">
            Add all to Shopping List
          </Button>
        </DialogActions>
      </Dialog>

      {/* Uncook confirmation dialog */}
      <Dialog
        open={uncookConfirmOpen}
        onClose={handleUncookCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Uncook this meal?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to mark this meal as not cooked? This will not restore ingredients to your pantry.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUncookCancel}>Cancel</Button>
          <Button onClick={handleUncookConfirm} variant="contained" color="primary">
            Yes, uncook
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
        open={itemsToCopy.length > 0}
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
          {itemsToCopy.length === 1
            ? `Click a card to add "${itemsToCopy[0].type === 'recipe' ? (itemsToCopy[0].recipe?.name || 'recipe') : (itemsToCopy[0].restaurant?.name || 'restaurant')}" to that day. Press Esc to cancel.`
            : `Click a card to add ${itemsToCopy.length} meals to that day. Press Esc to cancel.`}
        </Alert>
      </Snackbar>

      {/* Copy choice: this meal vs all meals in slot */}
      <Menu
        anchorEl={copyChoiceAnchor}
        open={Boolean(copyChoiceAnchor)}
        onClose={() => { setCopyChoiceAnchor(null); setCopyChoiceMeal(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleCopyThisMeal}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy this meal only</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleCopyAllMealsInSlot}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Copy all {getMealsInSlot(copyChoiceMeal?.day, copyChoiceMeal?.meal).filter(canCopyMeal).length} meals in this slot
          </ListItemText>
        </MenuItem>
      </Menu>

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