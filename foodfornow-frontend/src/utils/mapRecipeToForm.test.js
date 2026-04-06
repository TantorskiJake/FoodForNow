import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('returns empty defaults when recipe data is missing', () => {
  const result = mapRecipeDataToForm(null);

  assert.deepEqual(result, {
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

test('maps existing ingredient IDs and preserves zero-valued numeric fields', () => {
  const result = mapRecipeDataToForm({
    name: 'Spicy Soup',
    description: '',
    ingredients: [
      {
        ingredient: { _id: 'ing-1', name: 'Tomato' },
        quantity: 2,
        unit: '',
      },
      {
        ingredient: 'ing-2',
        quantity: 0,
        unit: 'g',
      },
    ],
    instructions: ['Boil water', 'Add ingredients'],
    prepTime: 0,
    cookTime: 0,
    servings: 0,
    tags: ['quick', 'vegan'],
  });

  assert.deepEqual(result, {
    name: 'Spicy Soup',
    description: 'Spicy Soup',
    ingredients: [
      { ingredient: 'ing-1', quantity: '2', unit: 'piece' },
      { ingredient: 'ing-2', quantity: '0', unit: 'g' },
    ],
    instructions: ['Boil water', 'Add ingredients'],
    prepTime: 0,
    cookTime: 0,
    servings: 0,
    tags: 'quick, vegan',
  });
});

test('maps manual ingredient entries and applies fallback category/unit', () => {
  const result = mapRecipeDataToForm({
    name: 'Grandma Pie',
    ingredients: [
      {
        name: 'Mystery Spice',
        quantity: 1.5,
        unit: '',
      },
      {
        ingredient: null,
        quantity: null,
        name: '',
        category: 'Spices',
      },
    ],
    instructions: [],
    tags: 'not-an-array',
  });

  assert.deepEqual(result, {
    name: 'Grandma Pie',
    description: 'Grandma Pie',
    ingredients: [
      {
        ingredient: '',
        ingredientName: 'Mystery Spice',
        quantity: '1.5',
        unit: 'piece',
        category: 'Other',
      },
      {
        ingredient: '',
        ingredientName: '',
        quantity: '',
        unit: 'piece',
        category: 'Spices',
      },
    ],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  });
});
