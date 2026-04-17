import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecipePayload, hasRecipeFormErrors, validateRecipeFormData } from './recipeFormSubmission.js';

test('validateRecipeFormData reports required field errors for incomplete submissions', () => {
  const errors = validateRecipeFormData({
    name: '   ',
    description: '',
    prepTime: 0,
    cookTime: '',
    servings: -1,
    instructions: [''],
    ingredients: [{ ingredient: '', ingredientName: '  ', quantity: '', unit: '' }],
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

test('validateRecipeFormData accepts valid referenced or free-form ingredients', () => {
  const errors = validateRecipeFormData({
    name: 'Soup',
    description: 'A warm soup',
    prepTime: '5',
    cookTime: '15',
    servings: '2',
    instructions: ['Simmer'],
    ingredients: [
      { ingredient: '', ingredientName: '  ', quantity: '1', unit: 'cup' },
      { ingredient: 'ing-123', ingredientName: '', quantity: '2', unit: 'tbsp' },
      { ingredient: '', ingredientName: 'Basil', quantity: '1', unit: 'pinch' },
    ],
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

test('buildRecipePayload normalizes tags, instructions, and ingredient payload shape', () => {
  const payload = buildRecipePayload({
    name: '  Tomato Soup  ',
    description: '  Cozy and quick  ',
    prepTime: '10',
    cookTime: '20',
    servings: '4',
    instructions: ['  Chop vegetables  ', ' ', '\t', 'Simmer and blend'],
    tags: 'easy, vegetarian, , quick ',
    ingredients: [
      { ingredient: 'ing-1', ingredientName: '', quantity: '2', unit: 'cup', category: '' },
      { ingredient: '', ingredientName: '  Basil  ', quantity: '1', unit: 'pinch', category: '' },
      { ingredient: '', ingredientName: 'Pepper', quantity: '', unit: 'pinch', category: 'Spices' },
    ],
  });

  assert.deepEqual(payload, {
    name: 'Tomato Soup',
    description: 'Cozy and quick',
    prepTime: '10',
    cookTime: '20',
    servings: '4',
    instructions: ['  Chop vegetables  ', 'Simmer and blend'],
    tags: ['easy', 'vegetarian', 'quick'],
    ingredients: [
      { ingredient: 'ing-1', quantity: '2', unit: 'cup' },
      { name: 'Basil', quantity: '1', unit: 'pinch', category: 'Other' },
    ],
  });
});
