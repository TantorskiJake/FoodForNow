import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyRecipeFormData, mapRecipeDataToForm } from './mapRecipeToForm.js';

test('returns empty form defaults when recipe data is missing', () => {
  assert.deepEqual(mapRecipeDataToForm(null), createEmptyRecipeFormData());
});

test('creates fresh nested defaults for each empty mapping call', () => {
  const first = mapRecipeDataToForm(null);
  first.ingredients[0].quantity = '7';
  first.instructions[0] = 'Mutated';

  const second = mapRecipeDataToForm(undefined);

  assert.deepEqual(second, {
    name: '',
    description: '',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  });
});

test('does not share instruction array reference with source recipe', () => {
  const recipe = {
    name: 'Salsa',
    description: 'Fresh',
    ingredients: [{ ingredient: 'ing-1', quantity: 1, unit: 'cup' }],
    instructions: ['Chop', 'Mix'],
  };

  const mapped = mapRecipeDataToForm(recipe);
  mapped.instructions[0] = 'Changed step';

  assert.deepEqual(recipe.instructions, ['Chop', 'Mix']);
});

test('maps existing ingredient references and array tags for edit flow', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Tomato Soup',
    description: 'Cozy dinner',
    ingredients: [
      {
        ingredient: { _id: 'ing-1', name: 'Tomato' },
        quantity: 2.5,
        unit: 'cup',
      },
      {
        ingredient: 'ing-2',
        quantity: 1,
        unit: 'tbsp',
      },
    ],
    instructions: ['Simmer', 'Blend'],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    tags: ['easy', 'vegetarian'],
  });

  assert.deepEqual(mapped, {
    name: 'Tomato Soup',
    description: 'Cozy dinner',
    ingredients: [
      { ingredient: 'ing-1', quantity: '2.5', unit: 'cup' },
      { ingredient: 'ing-2', quantity: '1', unit: 'tbsp' },
    ],
    instructions: ['Simmer', 'Blend'],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    tags: 'easy, vegetarian',
  });
});

test('maps free-form ingredients with safe defaults for import flow', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Quick Pasta',
    description: '',
    ingredients: [
      {
        name: 'Olive Oil',
        quantity: 0,
        unit: '',
        category: '',
      },
      {
        name: 'Salt',
        quantity: 1,
      },
    ],
    instructions: [],
  });

  assert.deepEqual(mapped, {
    name: 'Quick Pasta',
    description: 'Quick Pasta',
    ingredients: [
      {
        ingredient: '',
        ingredientName: 'Olive Oil',
        quantity: '0',
        unit: 'piece',
        category: 'Other',
      },
      {
        ingredient: '',
        ingredientName: 'Salt',
        quantity: '1',
        unit: 'piece',
        category: 'Other',
      },
    ],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  });
});

test('falls back to one empty ingredient and blank tags for non-array tags', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Boiled Egg',
    description: 'Simple',
    ingredients: [],
    instructions: ['Boil'],
    tags: 'not-an-array',
  });

  assert.deepEqual(mapped, {
    name: 'Boiled Egg',
    description: 'Simple',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
    instructions: ['Boil'],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  });
});
