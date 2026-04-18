import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecipePayload,
  getRecipeFormFieldErrors,
  hasRecipeFormErrors,
} from './recipeFormSubmission.js';

test('getRecipeFormFieldErrors returns required-field errors for invalid form data', () => {
  const errors = getRecipeFormFieldErrors({
    name: '   ',
    description: '  ',
    ingredients: [{ ingredient: '', ingredientName: '', quantity: '', unit: '' }],
    instructions: [''],
    prepTime: '0',
    cookTime: '',
    servings: -1,
    tags: '',
  });

  assert.deepEqual(errors, {
    name: 'Please fill out this field!',
    description: true,
    prepTime: 'Must be greater than 0',
    cookTime: 'Must be greater than 0',
    servings: 'Must be greater than 0',
    instructions: 'At least one instruction is required',
    ingredients: 'Create that ingredient or choose from your collection.',
  });
  assert.equal(hasRecipeFormErrors(errors), true);
});

test('getRecipeFormFieldErrors accepts a form with one complete ingredient row', () => {
  const errors = getRecipeFormFieldErrors({
    name: 'Pasta',
    description: 'Weeknight pasta',
    ingredients: [
      { ingredient: '', ingredientName: '  ', quantity: '', unit: '' },
      { ingredient: 'ing-1', ingredientName: '', quantity: '2', unit: 'cup' },
    ],
    instructions: ['Boil water'],
    prepTime: '10',
    cookTime: '12',
    servings: '4',
    tags: '',
  });

  assert.deepEqual(errors, {
    name: '',
    description: false,
    prepTime: '',
    cookTime: '',
    servings: '',
    instructions: '',
    ingredients: '',
  });
  assert.equal(hasRecipeFormErrors(errors), false);
});

test('buildRecipePayload trims values and filters empty instructions and tags', () => {
  const payload = buildRecipePayload({
    name: '  Lemon Rice  ',
    description: '  Tangy and bright  ',
    ingredients: [{ ingredient: 'ing-1', quantity: '1.5', unit: 'cup' }],
    instructions: ['  Toast spices  ', '   ', 'Fold in rice'],
    prepTime: '8',
    cookTime: '15',
    servings: '3',
    tags: ' quick, , easy , weeknight  ',
  });

  assert.equal(payload.name, 'Lemon Rice');
  assert.equal(payload.description, 'Tangy and bright');
  assert.deepEqual(payload.ingredients, [{ ingredient: 'ing-1', quantity: '1.5', unit: 'cup' }]);
  assert.deepEqual(payload.instructions, ['  Toast spices  ', 'Fold in rice']);
  assert.deepEqual(payload.tags, ['quick', 'easy', 'weeknight']);
  assert.equal(payload.prepTime, '8');
  assert.equal(payload.cookTime, '15');
  assert.equal(payload.servings, '3');
});

test('buildRecipePayload keeps only complete ingredients and maps free-form entries', () => {
  const payload = buildRecipePayload({
    name: 'Pantry Soup',
    description: 'Comfort food',
    ingredients: [
      { ingredient: '', ingredientName: ' Tomato ', quantity: '2', unit: 'piece', category: '' },
      { ingredient: '', ingredientName: 'Salt', quantity: '', unit: 'tsp', category: 'Spices' },
      { ingredient: '', ingredientName: 'Pepper', quantity: '1', unit: 'tsp', category: 'Spices' },
    ],
    instructions: ['Mix'],
    prepTime: '5',
    cookTime: '25',
    servings: '2',
    tags: '',
  });

  assert.deepEqual(payload.ingredients, [
    { name: 'Tomato', quantity: '2', unit: 'piece', category: 'Other' },
    { name: 'Pepper', quantity: '1', unit: 'tsp', category: 'Spices' },
  ]);
});
