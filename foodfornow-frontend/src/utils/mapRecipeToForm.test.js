import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('returns empty form defaults when recipe data is missing', () => {
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

test('maps id-based ingredients and preserves zero-valued numeric fields', () => {
  const result = mapRecipeDataToForm({
    name: 'Weeknight Pasta',
    description: 'Simple and fast',
    ingredients: [
      { ingredient: { _id: 'ing-1', name: 'Tomato' }, quantity: 2, unit: 'kg' },
      { ingredient: 'ing-2', quantity: 0, unit: '' },
    ],
    instructions: ['Boil pasta', 'Mix sauce'],
    prepTime: 0,
    cookTime: 15,
    servings: 2,
    tags: ['quick', 'vegetarian'],
  });

  assert.deepEqual(result, {
    name: 'Weeknight Pasta',
    description: 'Simple and fast',
    ingredients: [
      { ingredient: 'ing-1', quantity: '2', unit: 'kg' },
      { ingredient: 'ing-2', quantity: '0', unit: 'piece' },
    ],
    instructions: ['Boil pasta', 'Mix sauce'],
    prepTime: 0,
    cookTime: 15,
    servings: 2,
    tags: 'quick, vegetarian',
  });
});

test('maps free-text ingredients and applies description/instruction/tag fallbacks', () => {
  const result = mapRecipeDataToForm({
    name: 'Imported Soup',
    description: '',
    ingredients: [
      { name: 'Carrot', quantity: 1, unit: null, category: '' },
      { ingredient: null, name: 'Onion', quantity: null, unit: 'piece', category: 'Produce' },
    ],
    instructions: [],
    prepTime: null,
    cookTime: undefined,
    servings: null,
    tags: 'not-an-array',
  });

  assert.deepEqual(result, {
    name: 'Imported Soup',
    description: 'Imported Soup',
    ingredients: [
      { ingredient: '', ingredientName: 'Carrot', quantity: '1', unit: 'piece', category: 'Other' },
      { ingredient: '', ingredientName: 'Onion', quantity: '', unit: 'piece', category: 'Produce' },
    ],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  });
});
