import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('returns empty form defaults when recipe data is missing', () => {
  assert.deepEqual(mapRecipeDataToForm(null), {
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

test('maps existing ingredient ids and defaults missing units', () => {
  const result = mapRecipeDataToForm({
    name: 'Tomato Soup',
    description: 'Simple soup',
    ingredients: [
      { ingredient: { _id: 'ing-1', name: 'Tomato' }, quantity: 2, unit: 'cup' },
      { ingredient: 'ing-2', quantity: null },
    ],
    instructions: ['Chop', 'Simmer'],
  });

  assert.deepEqual(result.ingredients, [
    { ingredient: 'ing-1', quantity: '2', unit: 'cup' },
    { ingredient: 'ing-2', quantity: '', unit: 'piece' },
  ]);
});

test('maps free-text ingredients with sensible defaults', () => {
  const result = mapRecipeDataToForm({
    name: 'Spice Blend',
    ingredients: [
      { name: 'Paprika', quantity: 1.5, category: 'Spices' },
      { name: 'No Id Ingredient', quantity: 3, unit: 'tbsp' },
    ],
    instructions: ['Mix'],
  });

  assert.deepEqual(result.ingredients, [
    {
      ingredient: '',
      ingredientName: 'Paprika',
      quantity: '1.5',
      unit: 'piece',
      category: 'Spices',
    },
    {
      ingredient: '',
      ingredientName: 'No Id Ingredient',
      quantity: '3',
      unit: 'tbsp',
      category: 'Other',
    },
  ]);
});

test('normalizes description, tags, instructions, and numeric fields', () => {
  const result = mapRecipeDataToForm({
    name: 'Pasta',
    description: '',
    ingredients: [],
    instructions: [],
    prepTime: 0,
    cookTime: null,
    servings: 4,
    tags: ['quick', 'dinner'],
  });

  assert.equal(result.description, 'Pasta');
  assert.deepEqual(result.instructions, ['']);
  assert.equal(result.prepTime, 0);
  assert.equal(result.cookTime, '');
  assert.equal(result.servings, 4);
  assert.equal(result.tags, 'quick, dinner');
});
