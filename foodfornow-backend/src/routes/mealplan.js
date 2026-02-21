const express = require('express');
const authMiddleware = require('../middleware/auth');
const MealPlan = require('../models/mealPlan');
const Recipe = require('../models/recipe');
const { isAlwaysAvailableIngredient } = require('../constants/ingredients');
const { toStandard, fromStandard, getStandardUnit } = require('../services/unitConversionService');

const router = express.Router();

// Get meal plan for a specific week
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = { user: req.userId };
    
    // If weekStart is provided, filter by that week
    if (req.query.weekStart) {
      const weekStart = new Date(req.query.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      query.weekStart = {
        $gte: weekStart,
        $lt: weekEnd
      };
    }
    
    const mealPlan = await MealPlan.find(query).populate('recipe');
    res.json(mealPlan);
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    res.status(500).json({ error: 'Failed to fetch meal plan', details: error.message });
  }
});

// Add meal to plan
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { weekStart, day, meal, recipeId, notes, eatingOut, restaurant } = req.body;

    // Validate required fields
    if (!weekStart || !day || !meal) {
      return res.status(400).json({ error: 'Week start, day, and meal are required' });
    }

    if (eatingOut) {
      // Eating out: require restaurant name
      if (!restaurant?.name) {
        return res.status(400).json({ error: 'Restaurant name is required when eating out' });
      }
    } else {
      // Recipe-based: require recipeId
      if (!recipeId) {
        return res.status(400).json({ error: 'Recipe is required when not eating out' });
      }
      // Verify recipe exists
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
    }

    // Check if a meal already exists for this day and time
    const existingMeal = await MealPlan.findOne({
      user: req.userId,
      weekStart: new Date(weekStart),
      day,
      meal
    });

    if (existingMeal) {
      return res.status(400).json({ error: 'A meal already exists for this day and time' });
    }

    const mealPlanItem = new MealPlan({
      user: req.userId,
      weekStart: new Date(weekStart),
      day,
      meal,
      ...(eatingOut
        ? {
            eatingOut: true,
            restaurant: {
              name: restaurant.name,
              url: restaurant.url || undefined,
              address: restaurant.address || undefined,
              notes: restaurant.notes || undefined
            }
          }
        : { recipe: recipeId }),
      notes
    });

    await mealPlanItem.save();
    // Check for meal planning achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkMealPlanningAchievements(req.userId);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          await mealPlanItem.populate('recipe');
          res.status(201).json({
            mealPlanItem,
            achievements: newlyCompleted.map(a => ({
              name: a.config.name,
              description: a.config.description,
              icon: a.config.icon
            }))
          });
          return;
        }
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }
    
    // Populate recipe details before sending response
    await mealPlanItem.populate('recipe');
    res.status(201).json(mealPlanItem);
  } catch (error) {
    console.error('Error adding meal to plan:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'A meal already exists for this day and time' });
    } else {
      res.status(500).json({ error: 'Failed to add meal to plan' });
    }
  }
});

// Update meal in plan
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { recipeId, notes, eatingOut, restaurant } = req.body;
    const existingMeal = await MealPlan.findOne({ _id: req.params.id, user: req.userId });

    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    const update = {};
    const unset = {};

    if (notes !== undefined) update.notes = notes;

    if (eatingOut !== undefined) {
      if (eatingOut) {
        if (!restaurant?.name) {
          return res.status(400).json({ error: 'Restaurant name is required when eating out' });
        }
        update.eatingOut = true;
        update.recipe = null;
        update.restaurant = {
          name: restaurant.name,
          url: restaurant.url || undefined,
          address: restaurant.address || undefined,
          notes: restaurant.notes || undefined
        };
      } else {
        if (!recipeId) {
          return res.status(400).json({ error: 'Recipe is required when not eating out' });
        }
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
          return res.status(404).json({ error: 'Recipe not found' });
        }
        update.eatingOut = false;
        update.recipe = recipeId;
        unset.restaurant = 1; // Must use $unset to remove - undefined doesn't remove in Mongoose
      }
    } else if (recipeId) {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      update.recipe = recipeId;
    }

    const updateOp = {};
    if (Object.keys(update).length > 0) updateOp.$set = update;
    if (Object.keys(unset).length > 0) updateOp.$unset = unset;

    const mealPlanItem = await MealPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      Object.keys(updateOp).length > 0 ? updateOp : { $set: update },
      { new: true }
    )
      .populate('recipe')
      .lean();

    if (!mealPlanItem) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    res.json(mealPlanItem);
  } catch (error) {
    console.error('Error updating meal plan item:', error);
    res.status(500).json({ error: 'Failed to update meal plan item' });
  }
});

// Toggle cooked status (uncook: restock pantry with recipe ingredients)
router.patch('/:id/cooked', authMiddleware, async (req, res) => {
  try {
    const mealPlanItem = await MealPlan.findOne({ _id: req.params.id, user: req.userId })
      .populate({
        path: 'recipe',
        populate: {
          path: 'ingredients.ingredient'
        }
      });

    if (!mealPlanItem) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    const wasCooked = mealPlanItem.cooked;
    mealPlanItem.cooked = !mealPlanItem.cooked;

    // When uncooking: add recipe ingredients back to the pantry
    if (wasCooked && mealPlanItem.cooked === false) {
      if (!mealPlanItem.eatingOut && mealPlanItem.recipe && mealPlanItem.recipe.ingredients && mealPlanItem.recipe.ingredients.length > 0) {
        const PantryItem = require('../models/pantry-item');
        for (const recipeIngredient of mealPlanItem.recipe.ingredients) {
          if (!recipeIngredient.ingredient) continue;
          if (isAlwaysAvailableIngredient(recipeIngredient.ingredient.name)) continue;
          const ingredientId = recipeIngredient.ingredient._id;
          const addQuantity = recipeIngredient.quantity;
          const addUnit = recipeIngredient.unit;
          await PantryItem.findOneAndUpdate(
            { user: req.userId, ingredient: ingredientId, unit: addUnit },
            { $inc: { quantity: addQuantity } },
            { upsert: true, new: true }
          );
        }
      }
    }

    await mealPlanItem.save();
    await mealPlanItem.populate('recipe');
    res.json(mealPlanItem);
  } catch (error) {
    console.error('Error toggling cooked status:', error);
    res.status(500).json({ error: 'Failed to toggle cooked status' });
  }
});

// Reset week - delete all meal plans
router.delete('/reset-week', authMiddleware, async (req, res) => {
  try {
    let query = { user: req.userId };
    
    // If weekStart is provided, only delete meal plans for that week
    if (req.query.weekStart) {
      const weekStart = new Date(req.query.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      query.weekStart = {
        $gte: weekStart,
        $lt: weekEnd
      };
    }
    
    // Delete meal plans matching the query
    const result = await MealPlan.deleteMany(query);
    res.json({
      message: `Reset week - deleted ${result.deletedCount} meal plans`,
      mealPlans: []
    });
  } catch (error) {
    console.error('Error resetting week:', error);
    res.status(500).json({ error: 'Failed to reset week' });
  }
});

// Cook a meal - remove ingredients from pantry and handle missing ingredients
router.patch('/:id/cook', authMiddleware, async (req, res) => {
  try {
    const { addMissingToShoppingList = false } = req.body;
    
    const mealPlanItem = await MealPlan.findOne({ _id: req.params.id, user: req.userId })
      .populate({
        path: 'recipe',
        populate: {
          path: 'ingredients.ingredient'
        }
      });
    
    if (!mealPlanItem) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    // Eating out meals: just toggle cooked status (no pantry/ingredients)
    if (mealPlanItem.eatingOut) {
      mealPlanItem.cooked = true;
      await mealPlanItem.save();
      return res.json({ mealPlanItem });
    }

    if (!mealPlanItem.recipe || !mealPlanItem.recipe.ingredients) {
      return res.status(400).json({ error: 'Recipe has no ingredients' });
    }

    const PantryItem = require('../models/pantry-item');
    const pantryItems = await PantryItem.find({ user: req.userId }).populate('ingredient');

    const missingIngredients = [];
    /** @type {Array<{ ingredientId: string, name: string, deductInStandard: number }>} */
    const pantryDeductions = [];

    const ingredientName = (ing) => (ing && ing.ingredient && ing.ingredient.name) ? ing.ingredient.name : '';

    // Check each ingredient in the recipe (with unit conversion)
    for (const recipeIngredient of mealPlanItem.recipe.ingredients) {
      if (!recipeIngredient.ingredient) continue;

      if (isAlwaysAvailableIngredient(recipeIngredient.ingredient.name)) continue;

      const ingredientId = recipeIngredient.ingredient._id;
      const name = ingredientName(recipeIngredient);
      const neededQuantity = recipeIngredient.quantity;
      const neededUnit = recipeIngredient.unit;

      const neededInStandard = toStandard(neededQuantity, neededUnit, name);

      // All pantry items for this ingredient (any unit)
      const pantryItemsForIngredient = pantryItems.filter(
        item => item.ingredient && item.ingredient._id && item.ingredient._id.toString() === ingredientId.toString()
      );

      let totalAvailableInStandard = 0;
      for (const item of pantryItemsForIngredient) {
        totalAvailableInStandard += toStandard(item.quantity, item.unit, name);
      }

      if (totalAvailableInStandard < neededInStandard) {
        const missingInNeededUnit = fromStandard(
          Math.max(0, neededInStandard - totalAvailableInStandard),
          neededUnit,
          name
        );
        missingIngredients.push({
          ingredient: recipeIngredient.ingredient,
          quantity: missingInNeededUnit,
          unit: neededUnit,
          needed: neededQuantity,
          available: fromStandard(totalAvailableInStandard, neededUnit, name)
        });
        // Still deduct what we have from pantry
        if (totalAvailableInStandard > 0) {
          pantryDeductions.push({
            ingredientId: ingredientId.toString(),
            name,
            deductInStandard: totalAvailableInStandard
          });
        }
      } else {
        pantryDeductions.push({
          ingredientId: ingredientId.toString(),
          name,
          deductInStandard: neededInStandard
        });
      }
    }

    // If there are missing ingredients and user doesn't want to add to shopping list
    if (missingIngredients.length > 0 && !addMissingToShoppingList) {
      return res.status(400).json({
        error: 'Missing ingredients',
        missingIngredients,
        message: 'Some ingredients are missing from your pantry'
      });
    }

    // Add missing ingredients to shopping list if requested
    if (missingIngredients.length > 0 && addMissingToShoppingList) {
      const ShoppingListItem = require('../models/shopping-list-item');
      
      for (const missing of missingIngredients) {
        // Check if this ingredient already exists in the shopping list
        const existingItem = await ShoppingListItem.findOne({
          user: req.userId,
          ingredient: missing.ingredient._id,
          unit: missing.unit,
          completed: false
        });
        
        if (existingItem) {
          // Update existing item by adding the missing quantity
          existingItem.quantity += missing.quantity;
          await existingItem.save();
        } else {
          // Create new shopping list item
          const shoppingListItem = new ShoppingListItem({
            user: req.userId,
            ingredient: missing.ingredient._id,
            quantity: missing.quantity,
            unit: missing.unit,
            completed: false
          });
          await shoppingListItem.save();
        }
      }
      
      // Don't mark as cooked if there were missing ingredients
      // Just return the meal plan item without changing cooked status
      await mealPlanItem.populate('recipe');
      return res.json({
        mealPlanItem,
        removedIngredients: pantryDeductions.length,
        addedToShoppingList: missingIngredients.length,
        message: 'Missing ingredients added to shopping list. Meal not marked as cooked.'
      });
    }

    // Update pantry - deduct in standard units, updating each PantryItem in its own unit
    const pantryItemsForDeduct = await PantryItem.find({ user: req.userId }).populate('ingredient');
    for (const ded of pantryDeductions) {
      let remainingToDeduct = ded.deductInStandard;
      const itemsForIngredient = pantryItemsForDeduct.filter(
        item => item.ingredient && item.ingredient._id && item.ingredient._id.toString() === ded.ingredientId
      );
      for (const item of itemsForIngredient) {
        if (remainingToDeduct <= 0) break;
        const itemInStandard = toStandard(item.quantity, item.unit, ded.name);
        const deductFromThis = Math.min(remainingToDeduct, itemInStandard);
        if (deductFromThis <= 0) continue;
        const deductInItemUnit = fromStandard(deductFromThis, item.unit, ded.name);
        const newQuantity = Math.max(0, item.quantity - deductInItemUnit);
        const rounded = Math.round(newQuantity * 100) / 100;
        remainingToDeduct -= deductFromThis;
        if (rounded < 1e-9) {
          await PantryItem.findByIdAndDelete(item._id);
        } else {
          item.quantity = rounded;
          await item.save();
        }
      }
    }

    // Mark meal as cooked only if all ingredients were available
    mealPlanItem.cooked = true;
    await mealPlanItem.save();
    await mealPlanItem.populate('recipe');

    // Check for cooking-related achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkMealCookingAchievements(req.userId, mealPlanItem);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.json({
            mealPlanItem,
            removedIngredients: pantryDeductions.length,
            addedToShoppingList: 0,
            achievements: newlyCompleted.map(a => ({
              name: a.config.name,
              description: a.config.description,
              icon: a.config.icon
            }))
          });
          return;
        }
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }

    res.json({
      mealPlanItem,
      removedIngredients: pantryDeductions.length,
      addedToShoppingList: 0
    });

  } catch (error) {
    console.error('Error cooking meal:', error);
    res.status(500).json({ error: 'Failed to cook meal' });
  }
});

// Delete meal from plan
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const mealPlanItem = await MealPlan.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    if (!mealPlanItem) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }
    res.json({ message: 'Meal plan item deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal plan item:', error);
    res.status(500).json({ error: 'Failed to delete meal plan item' });
  }
});

// Get ingredients needed for meal plans
router.get('/ingredients', authMiddleware, async (req, res) => {
  try {
    let query = { user: req.userId };
    
    // If weekStart is provided, filter by that week
    if (req.query.weekStart) {
      const weekStart = new Date(req.query.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      query.weekStart = {
        $gte: weekStart,
        $lt: weekEnd
      };
    }
    
    // Get meal plans for the user (filtered by week if specified)
    const mealPlans = await MealPlan.find(query)
      .populate({
        path: 'recipe',
        populate: {
          path: 'ingredients.ingredient'
        }
      });
    // Filter out cooked meals and eating-out meals - only count ingredients from uncooked recipe meals
    const uncookedMealPlans = mealPlans.filter(
      mealPlan => !mealPlan.cooked && !mealPlan.eatingOut && mealPlan.recipe
    );
    const aggregateByIngredient = req.query.aggregateByIngredient === 'true';

    // Aggregate needed ingredients from uncooked meals only
    const ingredients = new Map();
    uncookedMealPlans.forEach(mealPlan => {
      if (mealPlan.recipe && mealPlan.recipe.ingredients) {
        mealPlan.recipe.ingredients.forEach(ing => {
          if (!ing.ingredient) return;
          const idStr = (ing.ingredient._id || ing.ingredient).toString();
          const name = (ing.ingredient.name != null && typeof ing.ingredient.name === 'string') ? ing.ingredient.name : '';
          if (isAlwaysAvailableIngredient(name)) return;
          if (aggregateByIngredient) {
            const needInStandard = toStandard(ing.quantity, ing.unit, name);
            if (!ingredients.has(idStr)) {
              ingredients.set(idStr, {
                _id: ing.ingredient._id || ing.ingredient,
                name,
                category: ing.ingredient.category != null ? ing.ingredient.category : undefined,
                quantityInStandard: needInStandard,
                usages: [{ quantity: ing.quantity, unit: ing.unit }]
              });
            } else {
              const existing = ingredients.get(idStr);
              existing.quantityInStandard += needInStandard;
              existing.usages.push({ quantity: ing.quantity, unit: ing.unit });
            }
          } else {
            const key = `${idStr}-${ing.unit}`;
            if (!ingredients.has(key)) {
              ingredients.set(key, {
                _id: ing.ingredient._id || ing.ingredient,
                name,
                category: ing.ingredient.category != null ? ing.ingredient.category : undefined,
                quantity: ing.quantity,
                unit: ing.unit
              });
            } else {
              const existing = ingredients.get(key);
              existing.quantity += ing.quantity;
            }
          }
        });
      }
    });

    // Normalize ingredient name for matching (e.g. "Lemon (juiced And Zested)" -> "lemon")
    const normalizeIngredientName = (name) => {
      if (!name || typeof name !== 'string') return '';
      return name
        .toLowerCase()
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Fetch pantry and build per-ingredient total in standard units (for conversion)
    const PantryItem = require('../models/pantry-item');
    const pantryItems = await PantryItem.find({ user: req.userId })
      .populate('ingredient', 'name');
    /** @type {Map<string, number>} ingredientId -> total quantity in standard unit */
    const pantryByIngredientStandard = new Map();
    /** @type {Map<string, number>} normalized name -> total (fallback when recipe name differs from pantry, e.g. "Lemon (juiced...)" vs "Lemon") */
    const pantryByNormalizedName = new Map();
    for (const item of pantryItems) {
      if (!item.ingredient) continue;
      const idStr = (item.ingredient._id || item.ingredient).toString();
      const name = (item.ingredient.name != null && item.ingredient.name !== '')
        ? String(item.ingredient.name).trim()
        : '';
      const inStandard = toStandard(item.quantity, item.unit, name);
      pantryByIngredientStandard.set(idStr, (pantryByIngredientStandard.get(idStr) || 0) + inStandard);
      const key = normalizeIngredientName(name);
      if (key) {
        pantryByNormalizedName.set(key, (pantryByNormalizedName.get(key) || 0) + inStandard);
      }
    }

    const roundForDisplay = (val, unit) => {
      if (val == null || Number.isNaN(Number(val))) return val;
      const n = Number(val);
      if (['piece', 'box'].includes(unit)) return Math.round(n * 10) / 10;
      return Math.round(n * 100) / 100;
    };

    // Add pantryQuantity in the same unit as needed (recipe unit when single, else standard)
    const result = aggregateByIngredient
      ? Array.from(ingredients.values()).map(ing => {
          const idStr = ing._id.toString();
          const nameKey = normalizeIngredientName(ing.name);
          const totalInStandard = pantryByIngredientStandard.get(idStr) ||
            (nameKey ? pantryByNormalizedName.get(nameKey) : 0) || 0;
          const stdUnit = getStandardUnit(ing.name);
          const uniqueUnits = [...new Set((ing.usages || []).map(u => u.unit))];
          const singleUnit = uniqueUnits.length === 1 ? uniqueUnits[0] : null;
          const displayUnit = singleUnit != null ? singleUnit : stdUnit;
          const quantity = singleUnit != null
            ? (ing.usages || []).reduce((sum, u) => sum + u.quantity, 0)
            : fromStandard(ing.quantityInStandard, stdUnit, ing.name);
          const pantryQuantity = fromStandard(totalInStandard, displayUnit, ing.name);
          return {
            _id: ing._id,
            name: ing.name,
            category: ing.category,
            quantity: roundForDisplay(quantity, displayUnit),
            unit: displayUnit,
            pantryQuantity: roundForDisplay(pantryQuantity, displayUnit)
          };
        })
      : Array.from(ingredients.values()).map(ing => {
          const idStr = ing._id.toString();
          const nameKey = normalizeIngredientName(ing.name);
          const totalInStandard = pantryByIngredientStandard.get(idStr) ||
            (nameKey ? pantryByNormalizedName.get(nameKey) : 0) || 0;
          const pantryQuantityInNeededUnit = fromStandard(totalInStandard, ing.unit, ing.name);
          return {
            ...ing,
            quantity: roundForDisplay(ing.quantity, ing.unit),
            pantryQuantity: roundForDisplay(pantryQuantityInNeededUnit, ing.unit)
          };
        });
    res.json(result);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients', details: error.message });
  }
});

// Populate week with random recipes
router.post('/populate-week', authMiddleware, async (req, res) => {
  try {
    // Get all recipes for the user
    const recipes = await Recipe.find({ createdBy: req.userId });
    
    if (recipes.length === 0) {
      return res.status(400).json({ error: 'No recipes found. Please add some recipes first.' });
    }

    // Use provided weekStart or calculate the start of the current week (Monday)
    let monday;
    if (req.body && typeof req.body.weekStart === 'string') {
      const parts = req.body.weekStart.split('-').map(Number);
      const [year, month, day] = parts.length >= 3 ? parts : [NaN, NaN, NaN];
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        monday = new Date(year, month - 1, day);
        monday.setHours(0, 0, 0, 0);
      }
    }
    if (!monday) {
      const today = new Date();
      monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      monday.setHours(0, 0, 0, 0);
    }

    // Clear existing meal plan for the week
    await MealPlan.deleteMany({ 
      user: req.userId,
      weekStart: {
        $gte: monday,
        $lt: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    const newMealPlans = [];

    // Populate each meal slot with a random recipe
    for (const day of days) {
      for (const meal of mealTypes) {
        // Get a random recipe
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        
        const mealPlanItem = new MealPlan({
          user: req.userId,
          weekStart: monday,
          day,
          meal,
          recipe: randomRecipe._id
        });

        await mealPlanItem.save();
        await mealPlanItem.populate('recipe');
        newMealPlans.push(mealPlanItem);
      }
    }

    // Check for meal planning achievements (e.g. Weekly Warrior)
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkMealPlanningAchievements(req.userId);
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.json({
            message: `Week populated with ${newMealPlans.length} random recipes`,
            mealPlans: newMealPlans,
            achievements: newlyCompleted.map(a => ({
              name: a.config.name,
              description: a.config.description,
              icon: a.config.icon
            }))
          });
          return;
        }
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }

    res.json({
      message: `Week populated with ${newMealPlans.length} random recipes`,
      mealPlans: newMealPlans
    });
  } catch (error) {
    console.error('Error populating week:', error);
    res.status(500).json({ error: 'Failed to populate week' });
  }
});

module.exports = router; 