import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('returns a fresh empty form when recipe data is missing', () => {
  const first = mapRecipeDataToForm(null);
  const second = mapRecipeDataToForm(undefined);

  assert.deepEqual(first, {
    name: '',
    description: '',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  });
  assert.deepEqual(second, first);
  assert.notEqual(first, second);
});

test('maps ingredients with IDs and preserves quantity zero as a string', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Pancakes',
    description: 'Fluffy',
    ingredients: [
      {
        ingredient: { _id: 'ing-1', name: 'Flour' },
        quantity: 0,
        unit: '',
      },
      {
        ingredient: 'ing-2',
        quantity: 1.5,
        unit: 'cup',
      },
    ],
    instructions: ['Mix', 'Cook'],
    prepTime: 0,
    cookTime: 12,
    servings: 0,
    tags: ['breakfast', 'quick'],
  });

  assert.deepEqual(mapped.ingredients, [
    { ingredient: 'ing-1', quantity: '0', unit: 'piece' },
    { ingredient: 'ing-2', quantity: '1.5', unit: 'cup' },
  ]);
  assert.equal(mapped.prepTime, 0);
  assert.equal(mapped.servings, 0);
  assert.equal(mapped.tags, 'breakfast, quick');
  assert.deepEqual(mapped.instructions, ['Mix', 'Cook']);
});

test('maps free-text ingredients and applies sensible defaults', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Mystery Soup',
    ingredients: [
      {
        name: 'Unknown Leaf',
        quantity: 2,
      },
      {
        name: 'Secret Spice',
        quantity: '',
        unit: 'pinch',
        category: 'Spices',
      },
    ],
    instructions: [],
    tags: 'not-an-array',
  });

  assert.deepEqual(mapped.ingredients, [
    {
      ingredient: '',
      ingredientName: 'Unknown Leaf',
      quantity: '2',
      unit: 'piece',
      category: 'Other',
    },
    {
      ingredient: '',
      ingredientName: 'Secret Spice',
      quantity: '',
      unit: 'pinch',
      category: 'Spices',
    },
  ]);
  assert.equal(mapped.description, 'Mystery Soup');
  assert.deepEqual(mapped.instructions, ['']);
  assert.equal(mapped.tags, '');
});
