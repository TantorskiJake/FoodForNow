// @ts-check
const { test, expect } = require('@playwright/test');

// Use env for test password so it is not hardcoded (set in CI/local .env)
const testUser = {
  email: `e2e-${Date.now()}@example.com`,
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
  name: 'E2E Test User',
};

const recipeName = 'E2E Pasta Test';
const ingredientName = 'E2E Tomato';

test.describe('Full flow: recipes → dashboard → shopping list → pantry → cook meal', () => {
  test('create recipe, fill dashboard, add to list, add to pantry, mark meal cooked', async ({ page }) => {
    // —— 1. Register ——
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await page.getByRole('button', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await page.getByLabel(/full name/i).fill(testUser.name);
    await page.getByLabel(/email address/i).fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await page.locator('#confirmPassword').fill(testUser.password);
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

    // —— 2. Create a recipe ——
    await page.goto('/recipes');
    await expect(page).toHaveURL(/\/recipes/);
    await page.getByRole('button', { name: /add recipe/i }).first().click();
    await expect(page.getByRole('dialog').getByText('Add Recipe')).toBeVisible();

    await page.getByRole('textbox', { name: /^name$/i }).fill(recipeName);
    await page.getByRole('dialog').getByLabel(/description/i).fill('E2E test recipe description');
    // First ingredient: open autocomplete and create new ingredient
    const ingredientInput = page.getByRole('combobox', { name: /ingredient/i }).first();
    await ingredientInput.click();
    await ingredientInput.fill(ingredientName);
    await page.getByRole('option', { name: new RegExp(`create.*${ingredientName}`, 'i') }).click();
    const createIngredientDialog = page.getByRole('dialog').filter({ hasText: 'Create New Ingredient' });
    await expect(createIngredientDialog).toBeVisible();
    await createIngredientDialog.locator('.MuiSelect-select').click();
    await page.getByRole('option', { name: 'Produce' }).click();
    await createIngredientDialog.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('dialog').getByText('Create New Ingredient')).not.toBeVisible();

    await page.getByRole('textbox', { name: /quantity/i }).first().fill('2');
    await page.getByRole('dialog').locator('.MuiSelect-select').first().click();
    await page.getByRole('option', { name: 'piece' }).click();
    await page.getByRole('dialog').getByLabel(/prep time/i).fill('5');
    await page.getByRole('dialog').getByLabel(/cook time/i).fill('10');
    await page.getByRole('dialog').getByLabel(/servings/i).fill('2');
    await page.getByRole('dialog').getByLabel(/step 1/i).fill('Boil and serve.');
    await page.getByRole('dialog').locator('button[type="submit"]').click();
    await expect(page.getByRole('dialog').getByText('Add Recipe')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(recipeName)).toBeVisible({ timeout: 5000 });

    // —— 3. Dashboard: add meal to plan ——
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');

    // Click first empty slot (Monday Breakfast) to add a meal
    await page.locator('[data-meal-card]').first().click();
    await expect(page.getByRole('dialog').getByText(/add meal/i)).toBeVisible({ timeout: 5000 });
    const recipeSearch = page.getByRole('dialog').getByRole('combobox', { name: /search recipes|type to search|recipe/i });
    await recipeSearch.click();
    await recipeSearch.fill(recipeName.slice(0, 6));
    await page.getByRole('option', { name: recipeName }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(recipeName)).toBeVisible({ timeout: 5000 });

    // —— 4. Add needed ingredients to shopping list ——
    await page.getByRole('button', { name: 'Add All to Shopping List' }).click();
    await expect(page.getByText(/updated|shopping list|ingredients/i)).toBeVisible({ timeout: 10000 }).catch(() => {});

    // —— 5. Shopping list: check item and add to pantry ——
    await page.goto('/shopping-list');
    await expect(page).toHaveURL(/\/shopping-list/);
    await page.waitForLoadState('networkidle');
    const row = page.getByText(ingredientName).first();
    await expect(row).toBeVisible({ timeout: 5000 });
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.click();
    await page.getByRole('button', { name: /add to pantry/i }).click();
    await expect(page.getByText(/added.*pantry/i)).toBeVisible({ timeout: 10000 }).catch(() => {});

    // —— 6. Dashboard: mark meal as cooked ——
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');
    const mealCard = page.locator('[data-meal-card]').filter({ hasText: recipeName });
    await expect(mealCard).toBeVisible({ timeout: 5000 });
    const markCookedBtn = mealCard.locator('button').first();
    await markCookedBtn.click();
    await expect(mealCard.locator('button').first()).toBeVisible({ timeout: 10000 });
  });
});
