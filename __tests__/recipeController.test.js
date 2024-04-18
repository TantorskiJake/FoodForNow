// Import the recipe controller module
const recipeController = require('../server/controllers/recipeController');

// Mocked request and response objects
const req = {};
const res = {
  json: jest.fn().mockReturnValue(this),
  status: jest.fn().mockReturnValue(this)
};

describe('Recipe Controller Tests', () => {
  test('Create Recipe - Success', async () => {
    req.body = { title: 'Test Recipe', ingredients: ['ingredient1', 'ingredient2'], instructions: 'Cook it', category: 'Test', prepTime: 10, cookTime: 20, servings: 4 };
    await recipeController.createRecipe(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Create Recipe - Validation Error', async () => {
    req.body = { title: '', ingredients: ['ingredient1', 'ingredient2'], instructions: 'Cook it', category: 'Test', prepTime: 10, cookTime: 20, servings: 4 };
    await recipeController.createRecipe(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Add more test cases for other controller functions as needed
});
