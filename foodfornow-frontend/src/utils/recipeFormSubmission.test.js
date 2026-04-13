import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecipeFieldErrors,
  buildRecipePayload,
  hasRecipeFieldErrors,
  isCompleteIngredient,
} from './recipeFormSubmission.js';

test('isCompleteIngredient requires ingredient identity, quantity, and unit', () => {
  assert.equal(
    isCompleteIngredient({
      ingredient: 'ing-1',
      quantity: '2',
      unit: 'cup',
    }),
    true
  );
  assert.equal(
    isCompleteIngredient({
      ingredient: '',
      ingredientName: '  Garlic  ',
      quantity: '1',
      unit: 'piece',
    }),
    true
  );
  assert.equal(
    isCompleteIngredient({
      ingredient: '',
      ingredientName: '   ',
      quantity: '1',
      unit: 'piece',
    }),
    false
  );
  assert.equal(
    isCompleteIngredient({
      ingredient: 'ing-1',
      quantity: '',
      unit: 'cup',
    }),
    false
  );
});

test('buildRecipeFieldErrors flags required field and ingredient validation failures', () => {
  const fieldErrors = buildRecipeFieldErrors({
    name: '   ',
    description: '',
    prepTime: '0',
    cookTime: '',
    servings: -1,
    instructions: [''],
    ingredients: [{ ingredient: '', ingredientName: '  ', quantity: '1', unit: '' }],
    tags: '',
  });

  assert.deepEqual(fieldErrors, {
    name: 'Please fill out this field!',
    description: true,
    prepTime: 'Must be greater than 0',
    cookTime: 'Must be greater than 0',
    servings: 'Must be greater than 0',
    instructions: 'At least one instruction is required',
    ingredients: 'Create that ingredient or choose from your collection.',
  });
  assert.equal(hasRecipeFieldErrors(fieldErrors), true);
});

test('buildRecipeFieldErrors accepts valid free-form ingredient recipes', () => {
  const fieldErrors = buildRecipeFieldErrors({
    name: 'Pasta',
    description: 'Weeknight meal',
    prepTime: '10',
    cookTime: '20',
    servings: '4',
    instructions: ['Boil water'],
    ingredients: [{ ingredient: '', ingredientName: ' Basil ', quantity: '2', unit: 'tbsp' }],
    tags: 'quick',
  });

  assert.deepEqual(fieldErrors, {
    name: '',
    description: false,
    prepTime: '',
    cookTime: '',
    servings: '',
    instructions: '',
    ingredients: '',
  });
  assert.equal(hasRecipeFieldErrors(fieldErrors), false);
});

test('buildRecipePayload trims and filters data before API submit', () => {
  const payload = buildRecipePayload({
    name: '  Garlic Pasta  ',
    description: '  Creamy and fast  ',
    prepTime: '10',
    cookTime: '15',
    servings: '2',
    instructions: [' Boil pasta ', '   ', 'Serve hot'],
    ingredients: [
      { ingredient: 'ing-1', quantity: '200', unit: 'g' },
      { ingredient: '', ingredientName: '  Garlic  ', quantity: '2', unit: 'piece', category: '' },
      { ingredient: '', ingredientName: 'Pepper', quantity: '1', unit: '' },
    ],
    tags: ' dinner, quick, , vegetarian ',
  });

  assert.equal(payload.name, 'Garlic Pasta');
  assert.equal(payload.description, 'Creamy and fast');
  assert.deepEqual(payload.instructions, [' Boil pasta ', 'Serve hot']);
  assert.deepEqual(payload.ingredients, [
    { ingredient: 'ing-1', quantity: '200', unit: 'g' },
    { name: 'Garlic', quantity: '2', unit: 'piece', category: 'Other' },
  ]);
  assert.deepEqual(payload.tags, ['dinner', 'quick', 'vegetarian']);
});
