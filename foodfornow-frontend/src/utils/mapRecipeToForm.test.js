import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('returns empty defaults when recipe data is missing', () => {
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

test('maps ingredient references and free-form ingredient entries', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Veggie Omelette',
    ingredients: [
      { ingredient: { _id: 'ing-eggs', name: 'Eggs' }, quantity: 3, unit: '' },
      { ingredient: 'ing-onion', quantity: 0.5, unit: 'cup' },
      { name: 'Paprika', quantity: 1, unit: '', category: '' },
    ],
  });

  assert.deepEqual(mapped.ingredients, [
    { ingredient: 'ing-eggs', quantity: '3', unit: 'piece' },
    { ingredient: 'ing-onion', quantity: '0.5', unit: 'cup' },
    {
      ingredient: '',
      ingredientName: 'Paprika',
      quantity: '1',
      unit: 'piece',
      category: 'Other',
    },
  ]);
});

test('applies fallback fields and preserves zero numeric values', () => {
  const mapped = mapRecipeDataToForm({
    name: 'Quick Soup',
    description: '',
    ingredients: [],
    instructions: [],
    prepTime: 0,
    cookTime: 0,
    servings: 0,
    tags: ['easy', 'weeknight'],
  });

  assert.equal(mapped.description, 'Quick Soup');
  assert.deepEqual(mapped.instructions, ['']);
  assert.equal(mapped.prepTime, 0);
  assert.equal(mapped.cookTime, 0);
  assert.equal(mapped.servings, 0);
  assert.equal(mapped.tags, 'easy, weeknight');
});
