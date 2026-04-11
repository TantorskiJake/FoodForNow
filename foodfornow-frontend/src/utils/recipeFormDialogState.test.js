import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeRecipeFormDialogState } from './recipeFormDialogState.js';
import { mapRecipeDataToForm } from './mapRecipeToForm.js';

const emptyFormData = {
  name: '',
  description: '',
  ingredients: [{ ingredient: '', quantity: '', unit: '' }],
  instructions: [''],
  prepTime: '',
  cookTime: '',
  servings: '',
  tags: '',
};

const initialFieldErrors = {
  name: '',
  description: false,
  prepTime: '',
  cookTime: '',
  servings: '',
  instructions: '',
  ingredients: '',
};

test('initializes edit state before awaiting ingredient fetch', async () => {
  const calls = [];
  let resolveFetch;
  const fetchPromise = new Promise((resolve) => {
    resolveFetch = resolve;
  });

  const editingRecipe = {
    name: 'Pasta',
    description: 'Creamy',
    ingredients: [{ ingredient: 'ing-1', quantity: 2, unit: 'cup' }],
    instructions: ['Cook'],
    prepTime: 10,
    cookTime: 20,
    servings: 3,
    tags: ['dinner'],
  };

  const cleanup = initializeRecipeFormDialogState({
    editingRecipe,
    createSeed: null,
    emptyFormData,
    initialFieldErrors,
    setFormData: (value) => calls.push(['setFormData', value]),
    setError: (value) => calls.push(['setError', value]),
    setFieldErrors: (value) => calls.push(['setFieldErrors', value]),
    fetchIngredients: () => fetchPromise,
  });

  assert.deepEqual(calls, [
    ['setFormData', mapRecipeDataToForm(editingRecipe)],
    ['setError', ''],
    ['setFieldErrors', { ...initialFieldErrors }],
  ]);

  cleanup();
  resolveFetch();
  await fetchPromise;
});

test('uses create seed payload when editing recipe is absent', async () => {
  const calls = [];

  const createSeed = {
    name: 'Imported Chili',
    description: '',
    ingredients: [{ name: 'Beans', quantity: 1, unit: '', category: '' }],
    instructions: ['Mix'],
  };

  const cleanup = initializeRecipeFormDialogState({
    editingRecipe: null,
    createSeed,
    emptyFormData,
    initialFieldErrors,
    setFormData: (value) => calls.push(['setFormData', value]),
    setError: (value) => calls.push(['setError', value]),
    setFieldErrors: (value) => calls.push(['setFieldErrors', value]),
    fetchIngredients: async () => {},
  });

  assert.equal(calls[0][0], 'setFormData');
  assert.deepEqual(calls[0][1], mapRecipeDataToForm(createSeed));
  assert.equal(calls[1][0], 'setError');
  assert.equal(calls[1][1], '');
  assert.equal(calls[2][0], 'setFieldErrors');
  assert.deepEqual(calls[2][1], { ...initialFieldErrors });

  cleanup();
});

test('falls back to empty form defaults for create mode', async () => {
  const calls = [];

  const cleanup = initializeRecipeFormDialogState({
    editingRecipe: null,
    createSeed: null,
    emptyFormData,
    initialFieldErrors,
    setFormData: (value) => calls.push(['setFormData', value]),
    setError: (value) => calls.push(['setError', value]),
    setFieldErrors: (value) => calls.push(['setFieldErrors', value]),
    fetchIngredients: async () => {},
  });

  assert.deepEqual(calls, [
    ['setFormData', { ...emptyFormData }],
    ['setError', ''],
    ['setFieldErrors', { ...initialFieldErrors }],
  ]);

  cleanup();
});
