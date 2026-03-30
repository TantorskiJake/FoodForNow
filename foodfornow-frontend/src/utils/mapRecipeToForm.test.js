import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('mapRecipeDataToForm returns empty defaults when recipe data is missing', () => {
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

test('mapRecipeDataToForm maps ingredient ids and free-text ingredient fallbacks', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Weeknight Pasta',
    description: '',
    ingredients: [
      { ingredient: { _id: 'ing-1', name: 'Salt' }, quantity: 2, unit: 'tsp' },
      { ingredient: 'ing-2', quantity: null },
      { name: 'Mystery Spice', quantity: 0, category: 'Spices' },
      { ingredient: { _id: '', name: 'Banana' }, quantity: 1, unit: '' },
    ],
    instructions: [],
    prepTime: 0,
    cookTime: null,
    servings: 4,
    tags: ['quick', 'vegetarian'],
  });

  assert.equal(mapped.name, 'Weeknight Pasta');
  assert.equal(mapped.description, 'Weeknight Pasta');
  assert.deepEqual(mapped.ingredients, [
    { ingredient: 'ing-1', quantity: '2', unit: 'tsp' },
    { ingredient: 'ing-2', quantity: '', unit: 'piece' },
    {
      ingredient: '',
      ingredientName: 'Mystery Spice',
      quantity: '0',
      unit: 'piece',
      category: 'Spices',
    },
    {
      ingredient: '',
      ingredientName: 'Banana',
      quantity: '1',
      unit: 'piece',
      category: 'Other',
    },
  ]);
  assert.deepEqual(mapped.instructions, ['']);
  assert.equal(mapped.prepTime, 0);
  assert.equal(mapped.cookTime, '');
  assert.equal(mapped.servings, 4);
  assert.equal(mapped.tags, 'quick, vegetarian');
});

test('mapRecipeDataToForm keeps explicit instructions and ignores non-array tags', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Soup',
    description: 'Simple soup',
    ingredients: [],
    instructions: ['Boil water', 'Add ingredients'],
    prepTime: 5,
    cookTime: 20,
    servings: 2,
    tags: 'not-an-array',
  });

  assert.deepEqual(mapped.ingredients, [{ ingredient: '', quantity: '', unit: '' }]);
  assert.deepEqual(mapped.instructions, ['Boil water', 'Add ingredients']);
  assert.equal(mapped.tags, '');
});
