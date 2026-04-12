import test from 'node:test';
import assert from 'node:assert/strict';
import { getInitialRecipeFormData, initializeRecipeFormDialogState } from './recipeFormDialogState.js';

test('getInitialRecipeFormData prioritizes editing recipe over create seed', () => {
  const calls = [];
  const editingRecipe = { id: 'edit-1' };
  const createSeed = { id: 'seed-1' };

  const mapped = getInitialRecipeFormData({
    editingRecipe,
    createSeed,
    mapRecipeDataToForm: (payload) => {
      calls.push(payload);
      return { mappedId: payload.id };
    },
    emptyFormData: { name: '' },
  });

  assert.deepEqual(mapped, { mappedId: 'edit-1' });
  assert.deepEqual(calls, [editingRecipe]);
});

test('getInitialRecipeFormData maps create seed when editing recipe is missing', () => {
  const calls = [];
  const createSeed = { id: 'seed-1' };

  const mapped = getInitialRecipeFormData({
    editingRecipe: null,
    createSeed,
    mapRecipeDataToForm: (payload) => {
      calls.push(payload);
      return { mappedId: payload.id };
    },
    emptyFormData: { name: '' },
  });

  assert.deepEqual(mapped, { mappedId: 'seed-1' });
  assert.deepEqual(calls, [createSeed]);
});

test('getInitialRecipeFormData returns a fresh empty object for new recipes', () => {
  const emptyFormData = {
    name: '',
    description: '',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
  };

  const mapped = getInitialRecipeFormData({
    editingRecipe: null,
    createSeed: null,
    mapRecipeDataToForm: () => {
      throw new Error('mapRecipeDataToForm should not be called');
    },
    emptyFormData,
  });

  assert.deepEqual(mapped, emptyFormData);
  assert.notEqual(mapped, emptyFormData);
});

test('initializeRecipeFormDialogState resets state before fetching ingredients', async () => {
  const calls = [];
  const initialFieldErrors = { name: 'stale', description: true };
  const editingRecipe = { id: 'edit-1' };

  await initializeRecipeFormDialogState({
    editingRecipe,
    createSeed: null,
    mapRecipeDataToForm: (payload) => ({ mappedId: payload.id }),
    emptyFormData: { name: '' },
    initialFieldErrors,
    setFormData: (value) => calls.push({ name: 'setFormData', value }),
    setError: (value) => calls.push({ name: 'setError', value }),
    setFieldErrors: (value) => calls.push({ name: 'setFieldErrors', value }),
    fetchIngredients: async (options) => {
      calls.push({ name: 'fetchIngredients', value: options });
    },
  });

  assert.equal(calls[0].name, 'setFormData');
  assert.deepEqual(calls[0].value, { mappedId: 'edit-1' });
  assert.deepEqual(calls[1], { name: 'setError', value: '' });
  assert.equal(calls[2].name, 'setFieldErrors');
  assert.deepEqual(calls[2].value, initialFieldErrors);
  assert.notEqual(calls[2].value, initialFieldErrors);
  assert.deepEqual(calls[3], { name: 'fetchIngredients', value: { forceRefresh: false } });
});

test('initializeRecipeFormDialogState keeps reset ordering even when fetch fails', async () => {
  const calls = [];

  await assert.rejects(
    initializeRecipeFormDialogState({
      editingRecipe: null,
      createSeed: null,
      mapRecipeDataToForm: () => ({ name: 'new recipe' }),
      emptyFormData: { name: '' },
      initialFieldErrors: { name: 'stale' },
      setFormData: () => calls.push('setFormData'),
      setError: () => calls.push('setError'),
      setFieldErrors: () => calls.push('setFieldErrors'),
      fetchIngredients: async () => {
        calls.push('fetchIngredients');
        throw new Error('ingredient lookup failed');
      },
    }),
    /ingredient lookup failed/
  );

  assert.deepEqual(calls, ['setFormData', 'setError', 'setFieldErrors', 'fetchIngredients']);
});
