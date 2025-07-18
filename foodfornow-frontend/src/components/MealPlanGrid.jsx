import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import api from '../services/api';
import { useAchievements } from '../context/AchievementContext';

const MealPlanGrid = ({ mealPlan = [], onAddMeal, onDeleteMeal, onEditMeal, onMealPlanUpdate }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showAchievements } = useAchievements();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
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
        onMealPlanUpdate(response.data.mealPlanItem);
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

  const getMealName = (meal) => {
    if (!meal) return 'No Recipe';
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
      <Grid container spacing={1}>
        {/* Header row with days */}
        <Grid item xs={12}>
          <Grid container spacing={0.5}>
            <Grid item xs={1.5} /> {/* Spacer for meal type labels */}
            {days.map((day) => (
              <Grid item xs={1.5} key={day}>
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
            <Grid container spacing={0.5}>
              {/* Meal type label */}
              <Grid item xs={1.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', m: 0, p: 0, lineHeight: 1.1, px: 1 }}>
                  {mealType}
                </Typography>
              </Grid>

              {/* Meal slots for each day */}
              {days.map((day) => {
                const meal = mealPlan.find(
                  (m) => m?.day?.toLowerCase() === day.toLowerCase() && m?.meal === mealType
                );
                const isCooked = meal?.cooked || false;
                
                return (
                  <Grid item xs={1.5} key={`${day}-${mealType}`} sx={{ p: 0 }}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        minHeight: 90,
                        bgcolor: meal 
                          ? (isCooked ? 'success.light' : 'primary.light')
                          : theme.palette.mode === 'dark' ? 'background.paper' : 'grey.100',
                        '&:hover': {
                          bgcolor: meal 
                            ? (isCooked ? 'success.main' : 'primary.main')
                            : theme.palette.mode === 'dark' ? 'action.hover' : 'grey.200',
                          cursor: 'pointer'
                        },
                        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                        position: 'relative',
                        overflow: 'visible',
                        m: 0
                      }}
                      onClick={(e) => meal ? handleMealClick(meal, e) : onAddMeal(day, mealType)}
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
                            
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (meal._id) {
                                  onDeleteMeal(meal._id);
                                }
                              }}
                              sx={{ 
                                position: 'absolute', 
                                top: 0, 
                                right: 0,
                                p: 0.25,
                                color: 'white',
                                m: 0
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
      </Menu>
    </Box>
  );
};

export default MealPlanGrid;