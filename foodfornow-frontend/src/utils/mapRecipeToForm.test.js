import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('mapRecipeDataToForm returns empty defaults when no recipe data is provided', () => {
  assert.deepEqual(mapRecipeDataToForm(), {
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

test('mapRecipeDataToForm maps mixed ingredient shapes for edit form state', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Veggie Soup',
    description: 'Cozy soup',
    ingredients: [
      { ingredient: { _id: 'ing-1', name: 'Carrot' }, quantity: 2, unit: 'piece' },
      { ingredient: 'ing-2', quantity: '1.5', unit: 'cup' },
      { name: 'Salt', quantity: 0.5, category: 'Spices' },
      { name: 'Pepper', quantity: null, unit: '' },
    ],
    instructions: ['Chop vegetables', 'Simmer until tender'],
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    tags: ['soup', 'vegetarian'],
  });

  assert.deepEqual(mapped, {
    name: 'Veggie Soup',
    description: 'Cozy soup',
    ingredients: [
      { ingredient: 'ing-1', quantity: '2', unit: 'piece' },
      { ingredient: 'ing-2', quantity: '1.5', unit: 'cup' },
      { ingredient: '', ingredientName: 'Salt', quantity: '0.5', unit: 'piece', category: 'Spices' },
      { ingredient: '', ingredientName: 'Pepper', quantity: '', unit: 'piece', category: 'Other' },
    ],
    instructions: ['Chop vegetables', 'Simmer until tender'],
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    tags: 'soup, vegetarian',
  });
});

test('mapRecipeDataToForm applies safe fallbacks for legacy or partial recipe payloads', () => {
  const mapped = mapRecipeDataToForm({
    name: 'No-description recipe',
    ingredients: [],
    instructions: [],
    prepTime: null,
    cookTime: undefined,
    servings: null,
    tags: 'not-an-array',
  });

  assert.deepEqual(mapped, {
    name: 'No-description recipe',
    description: 'No-description recipe',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  });
});
