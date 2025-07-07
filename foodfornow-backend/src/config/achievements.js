/**
 * Achievements Configuration
 * 
 * Defines all available achievements with their requirements, descriptions, and metadata.
 * Each achievement has a unique ID, name, description, category, icon, and progress requirements.
 */

const achievements = {
  // Getting Started Achievements
  'welcome-aboard': {
    name: 'Welcome Aboard',
    description: 'Join FoodForNow and start your culinary journey',
    category: 'getting-started',
    icon: '🎉',
    requiredProgress: 1
  },
  'first-recipe': {
    name: 'First Steps',
    description: 'Create your first recipe',
    category: 'getting-started',
    icon: '🎯',
    requiredProgress: 1
  },
  'first-meal-cooked': {
    name: 'Kitchen Newbie',
    description: 'Cook your first meal',
    category: 'getting-started',
    icon: '👨‍🍳',
    requiredProgress: 1
  },
  'first-shopping-item': {
    name: 'List Maker',
    description: 'Add your first item to shopping list',
    category: 'getting-started',
    icon: '📝',
    requiredProgress: 1
  },
  'first-pantry-item': {
    name: 'Pantry Pioneer',
    description: 'Add your first item to pantry',
    category: 'getting-started',
    icon: '🥫',
    requiredProgress: 1
  },

  // Recipe Mastery Achievements
  'recipes-created-5': {
    name: 'Recipe Collector',
    description: 'Create 5 recipes',
    category: 'recipe-mastery',
    icon: '📚',
    requiredProgress: 5
  },
  'recipes-created-10': {
    name: 'Recipe Master',
    description: 'Create 10 recipes',
    category: 'recipe-mastery',
    icon: '🏆',
    requiredProgress: 10
  },
  'different-recipes-cooked-5': {
    name: 'Chef in Training',
    description: 'Cook 5 different recipes',
    category: 'recipe-mastery',
    icon: '👨‍🍳',
    requiredProgress: 5
  },
  'different-recipes-cooked-10': {
    name: 'Seasoned Chef',
    description: 'Cook 10 different recipes',
    category: 'recipe-mastery',
    icon: '👨‍🍳',
    requiredProgress: 10
  },

  // Meal Planning Achievements
  'first-meal-plan': {
    name: 'Planner',
    description: 'Create your first meal plan',
    category: 'meal-planning',
    icon: '📅',
    requiredProgress: 1
  },
  'full-week-planned': {
    name: 'Weekly Warrior',
    description: 'Plan a full week of meals',
    category: 'meal-planning',
    icon: '🗓️',
    requiredProgress: 7
  },
  'three-meals-one-day': {
    name: 'Meal Prep Pro',
    description: 'Cook 3 meals in one day',
    category: 'meal-planning',
    icon: '⏰',
    requiredProgress: 3
  },
  'consecutive-cooking-7': {
    name: 'Consistent Cook',
    description: 'Cook meals for 7 consecutive days',
    category: 'meal-planning',
    icon: '🎯',
    requiredProgress: 7
  },

  // Pantry & Shopping Achievements
  'first-shopping-complete': {
    name: 'Shopping Savvy',
    description: 'Complete your first shopping list',
    category: 'pantry-shopping',
    icon: '✅',
    requiredProgress: 1
  },
  'shopping-lists-completed-10': {
    name: 'Grocery Guru',
    description: 'Complete 10 shopping lists',
    category: 'pantry-shopping',
    icon: '🛒',
    requiredProgress: 10
  },
  'pantry-items-20': {
    name: 'Pantry Pro',
    description: 'Add 20 different items to pantry',
    category: 'pantry-shopping',
    icon: '🥫',
    requiredProgress: 20
  },
  'total-pantry-items-50': {
    name: 'Stock Master',
    description: 'Have 50 total items in pantry',
    category: 'pantry-shopping',
    icon: '📦',
    requiredProgress: 50
  },

  // Fun/Special Achievements
  'night-owl-cooking': {
    name: 'Night Owl',
    description: 'Cook a meal after 10 PM',
    category: 'fun',
    icon: '🌙',
    requiredProgress: 1
  },
  'early-bird-cooking': {
    name: 'Early Bird',
    description: 'Cook breakfast before 8 AM',
    category: 'fun',
    icon: '🌅',
    requiredProgress: 1
  },
  'party-planner': {
    name: 'Party Planner',
    description: 'Plan meals for 4+ people',
    category: 'fun',
    icon: '🎉',
    requiredProgress: 1
  },
  'pizza-lover': {
    name: 'Pizza Lover',
    description: 'Create 3 pizza recipes',
    category: 'fun',
    icon: '🍕',
    requiredProgress: 3
  },
  'sweet-tooth': {
    name: 'Sweet Tooth',
    description: 'Create 5 dessert recipes',
    category: 'fun',
    icon: '🍰',
    requiredProgress: 5
  },
  'health-nut': {
    name: 'Health Nut',
    description: 'Create 10 vegetarian recipes',
    category: 'fun',
    icon: '🌱',
    requiredProgress: 10
  },
  'world-cuisine': {
    name: 'World Cuisine',
    description: 'Create recipes from 5 different cuisines',
    category: 'fun',
    icon: '🌍',
    requiredProgress: 5
  },
  'holiday-cooking': {
    name: 'Celebration Chef',
    description: 'Cook on a holiday',
    category: 'fun',
    icon: '🎊',
    requiredProgress: 1
  },
  'speed-demon': {
    name: 'Speed Demon',
    description: 'Cook 3 meals in under 2 hours total',
    category: 'fun',
    icon: '🔥',
    requiredProgress: 3
  },
  'the-improviser': {
    name: 'The Improviser',
    description: 'Cook a meal with only 3 ingredients',
    category: 'fun',
    icon: '🎭',
    requiredProgress: 1
  },

  // Milestone Achievements
  'bronze-chef': {
    name: 'Bronze Chef',
    description: 'Complete 10 achievements',
    category: 'milestone',
    icon: '🏅',
    requiredProgress: 10
  },
  'silver-chef': {
    name: 'Silver Chef',
    description: 'Complete 25 achievements',
    category: 'milestone',
    icon: '🥈',
    requiredProgress: 25
  },
  'gold-chef': {
    name: 'Gold Chef',
    description: 'Complete 50 achievements',
    category: 'milestone',
    icon: '🥇',
    requiredProgress: 50
  },
  'master-chef': {
    name: 'Master Chef',
    description: 'Complete all achievements',
    category: 'milestone',
    icon: '👑',
    requiredProgress: 1
  }
};

module.exports = achievements; 