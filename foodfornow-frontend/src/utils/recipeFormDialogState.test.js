import test from 'node:test';
import assert from 'node:assert/strict';
import { getInitialRecipeFormData, initializeRecipeFormDialogState } from './recipeFormDialogState.js';

test('getInitialRecipeFormData prioritizes editing recipe over create seed', () => {
  const calls = [];
  const mapRecipeDataToForm = (input) => {
    calls.push(input.kind);
    return { mapped: input.kind };
  };

  const result = getInitialRecipeFormData({
    editingRecipe: { kind: 'editing' },
    createSeed: { kind: 'seed' },
    mapRecipeDataToForm,
    emptyFormData: { fallback: true },
  });

  assert.deepEqual(result, { mapped: 'editing' });
  assert.deepEqual(calls, ['editing']);
});

test('getInitialRecipeFormData falls back to create seed and empty defaults', () => {
  const mapRecipeDataToForm = (input) => ({ mapped: input.kind });

  const seedResult = getInitialRecipeFormData({
    editingRecipe: null,
    createSeed: { kind: 'seed' },
    mapRecipeDataToForm,
    emptyFormData: { fallback: true },
  });
  assert.deepEqual(seedResult, { mapped: 'seed' });

  const emptyDefaults = { name: '', ingredients: [] };
  const emptyResult = getInitialRecipeFormData({
    editingRecipe: null,
    createSeed: null,
    mapRecipeDataToForm,
    emptyFormData: emptyDefaults,
  });
  assert.deepEqual(emptyResult, emptyDefaults);
  assert.notStrictEqual(emptyResult, emptyDefaults);
});

test('initializeRecipeFormDialogState sets form values before ingredient fetch', async () => {
  const callOrder = [];
  const fetchCalls = [];
  const initialFieldErrors = { name: '', ingredients: '' };
  const mappedForm = { name: 'Mapped recipe' };

  let resolveFetch;
  const fetchDone = new Promise((resolve) => {
    resolveFetch = resolve;
  });

  const cleanup = initializeRecipeFormDialogState({
    open: true,
    editingRecipe: { _id: 'recipe-1' },
    createSeed: null,
    mapRecipeDataToForm: () => mappedForm,
    emptyFormData: { name: '' },
    initialFieldErrors,
    setFormData: (value) => {
      callOrder.push('setFormData');
      assert.deepEqual(value, mappedForm);
    },
    setError: (value) => {
      callOrder.push('setError');
      assert.equal(value, '');
    },
    setFieldErrors: (value) => {
      callOrder.push('setFieldErrors');
      assert.deepEqual(value, initialFieldErrors);
      assert.notStrictEqual(value, initialFieldErrors);
    },
    fetchIngredients: async (options) => {
      callOrder.push('fetchIngredients');
      fetchCalls.push(options);
      await fetchDone;
    },
  });

  assert.equal(typeof cleanup, 'function');
  assert.deepEqual(callOrder, ['setFormData', 'setError', 'setFieldErrors', 'fetchIngredients']);
  assert.deepEqual(fetchCalls, [{ forceRefresh: false }]);

  resolveFetch();
  await fetchDone;
  cleanup();
});

test('initializeRecipeFormDialogState is a no-op when dialog is closed', () => {
  let invoked = false;
  const cleanup = initializeRecipeFormDialogState({
    open: false,
    editingRecipe: null,
    createSeed: null,
    mapRecipeDataToForm: () => {
      invoked = true;
      return {};
    },
    emptyFormData: {},
    initialFieldErrors: {},
    setFormData: () => {
      invoked = true;
    },
    setError: () => {
      invoked = true;
    },
    setFieldErrors: () => {
      invoked = true;
    },
    fetchIngredients: async () => {
      invoked = true;
    },
  });

  assert.equal(cleanup, undefined);
  assert.equal(invoked, false);
});
