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
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RestaurantIcon from '@mui/icons-material/Restaurant';

const MealPlanGrid = ({ mealPlan, onAddMeal, onDeleteMeal, onEditMeal }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

  const handleMealClick = (meal, event) => {
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
    if (selectedMeal) {
      navigate(`/recipes/${selectedMeal.recipe._id}`);
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Weekly Meal Plan
      </Typography>
      <Grid container spacing={2}>
        {/* Header row with days */}
        <Grid item xs={12}>
          <Grid container spacing={1}>
            <Grid item xs={1.5} /> {/* Spacer for meal type labels */}
            {days.map((day) => (
              <Grid item xs={1.5} key={day}>
                <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold' }}>
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
              <Grid item xs={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
                  {mealType}
                </Typography>
              </Grid>

              {/* Meal slots for each day */}
              {days.map((day) => {
                const meal = mealPlan.find(
                  (m) => m.day.toLowerCase() === day.toLowerCase() && m.meal === mealType
                );
                return (
                  <Grid item xs={1.5} key={`${day}-${mealType}`}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        minHeight: 100,
                        bgcolor: meal ? 'primary.light' : theme.palette.mode === 'dark' ? 'background.paper' : 'grey.100',
                        '&:hover': {
                          bgcolor: meal ? 'primary.main' : theme.palette.mode === 'dark' ? 'action.hover' : 'grey.200',
                          cursor: 'pointer'
                        },
                        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none'
                      }}
                      onClick={(e) => meal ? handleMealClick(meal, e) : onAddMeal(day, mealType)}
                    >
                      <CardContent sx={{ 
                        p: 1.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                      }}>
                        {meal ? (
                          <>
                            <Typography 
                              variant="body2" 
                              sx={{
                                wordBreak: 'break-word',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.2,
                                fontSize: '0.875rem',
                                pt: 2, // Add padding top to account for delete button
                                color: 'white'
                              }}
                            >
                              {meal.recipe && meal.recipe.name ? meal.recipe.name : 'No Recipe'}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMeal(meal._id);
                              }}
                              sx={{ 
                                position: 'absolute', 
                                top: 0, 
                                right: 0,
                                p: 0.5,
                                color: 'white'
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
                              height: '100%'
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
        <MenuItem onClick={handleViewRecipe}>
          <ListItemIcon>
            <RestaurantIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Recipe</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MealPlanGrid;