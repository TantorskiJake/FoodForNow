import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

test('mapRecipeDataToForm returns empty defaults when recipe is missing', () => {
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

test('mapRecipeDataToForm maps ingredient ids and normalizes quantity/unit', () => {
  const form = mapRecipeDataToForm({
    name: 'Tomato Pasta',
    description: 'Simple pasta',
    ingredients: [
      { ingredient: { _id: 'ing-1', name: 'Tomato' }, quantity: 2, unit: 'kg' },
      { ingredient: 'ing-2', quantity: 0 },
    ],
    instructions: ['Boil water', 'Cook pasta'],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    tags: ['pasta', 'quick'],
  });

  assert.deepEqual(form.ingredients, [
    { ingredient: 'ing-1', quantity: '2', unit: 'kg' },
    { ingredient: 'ing-2', quantity: '0', unit: 'piece' },
  ]);
  assert.deepEqual(form.instructions, ['Boil water', 'Cook pasta']);
  assert.equal(form.tags, 'pasta, quick');
});

test('mapRecipeDataToForm maps unresolved ingredient names with defaults', () => {
  const form = mapRecipeDataToForm({
    name: 'Imported Soup',
    ingredients: [
      { name: 'Mystery Spice', quantity: 1.5 },
      { name: 'Garlic', quantity: 3, unit: 'tsp', category: 'Spices' },
    ],
    instructions: ['Mix'],
  });

  assert.deepEqual(form.ingredients, [
    {
      ingredient: '',
      ingredientName: 'Mystery Spice',
      quantity: '1.5',
      unit: 'piece',
      category: 'Other',
    },
    {
      ingredient: '',
      ingredientName: 'Garlic',
      quantity: '3',
      unit: 'tsp',
      category: 'Spices',
    },
  ]);
});

test('mapRecipeDataToForm falls back description and preserves numeric zero values', () => {
  const form = mapRecipeDataToForm({
    name: 'Zero-Time Salad',
    prepTime: 0,
    cookTime: 0,
    servings: 0,
    ingredients: [],
    instructions: [],
  });

  assert.equal(form.description, 'Zero-Time Salad');
  assert.equal(form.prepTime, 0);
  assert.equal(form.cookTime, 0);
  assert.equal(form.servings, 0);
  assert.deepEqual(form.instructions, ['']);
  assert.equal(form.tags, '');
});
