import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('returns empty defaults when recipe data is missing', () => {
  const mapped = mapRecipeDataToForm(null);

  assert.deepEqual(mapped, {
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

test('maps linked ingredient objects and preserves zero-ish numeric values', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Overnight Oats',
    description: '',
    ingredients: [
      {
        ingredient: { _id: 'ing-1', name: 'Oats' },
        quantity: 0,
        unit: '',
      },
      {
        ingredient: 'ing-2',
        quantity: 2,
        unit: 'cup',
      },
    ],
    instructions: ['Mix', 'Chill'],
    prepTime: 0,
    cookTime: 0,
    servings: 0,
    tags: ['breakfast', 'quick'],
  });

  assert.deepEqual(mapped, {
    name: 'Overnight Oats',
    description: 'Overnight Oats',
    ingredients: [
      { ingredient: 'ing-1', quantity: '0', unit: 'piece' },
      { ingredient: 'ing-2', quantity: '2', unit: 'cup' },
    ],
    instructions: ['Mix', 'Chill'],
    prepTime: 0,
    cookTime: 0,
    servings: 0,
    tags: 'breakfast, quick',
  });
});

test('maps inline ingredient names and falls back optional fields', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Custom Soup',
    ingredients: [
      {
        name: 'Mystery Herb',
        quantity: 1,
        unit: '',
      },
      {
        name: 'Untracked Spice',
        quantity: null,
        category: '',
      },
    ],
    instructions: [],
    tags: 'not-an-array',
  });

  assert.deepEqual(mapped, {
    name: 'Custom Soup',
    description: 'Custom Soup',
    ingredients: [
      {
        ingredient: '',
        ingredientName: 'Mystery Herb',
        quantity: '1',
        unit: 'piece',
        category: 'Other',
      },
      {
        ingredient: '',
        ingredientName: 'Untracked Spice',
        quantity: '',
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
