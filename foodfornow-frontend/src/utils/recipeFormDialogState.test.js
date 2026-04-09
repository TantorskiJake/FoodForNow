import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_RECIPE_FORM_DATA,
  INITIAL_RECIPE_FIELD_ERRORS,
  initializeRecipeFormDialogState,
  resolveInitialRecipeFormData,
} from './recipeFormDialogState.js';

test('resolveInitialRecipeFormData prefers editing recipe over create seed', () => {
  const calls = [];
  const mapRecipeDataToFormFn = (recipe) => {
    calls.push(recipe.id);
    return { source: recipe.id };
  };

  const result = resolveInitialRecipeFormData({
    editingRecipe: { id: 'edit' },
    createSeed: { id: 'seed' },
    mapRecipeDataToFormFn,
  });

  assert.deepEqual(result, { source: 'edit' });
  assert.deepEqual(calls, ['edit']);
});

test('resolveInitialRecipeFormData returns isolated empty defaults when inputs are missing', () => {
  const first = resolveInitialRecipeFormData({});
  first.name = 'Mutated';

  const second = resolveInitialRecipeFormData({});

  assert.equal(second.name, EMPTY_RECIPE_FORM_DATA.name);
  assert.deepEqual(second.ingredients, EMPTY_RECIPE_FORM_DATA.ingredients);
});

test('initializeRecipeFormDialogState sets form state before ingredient fetch', async () => {
  const callOrder = [];
  const mapRecipeDataToFormFn = (recipe) => {
    callOrder.push('map');
    return { name: recipe.name };
  };

  let fetchArg;
  const fetchIngredients = async (args) => {
    callOrder.push('fetch');
    fetchArg = args;
  };

  let formValue;
  let errorValue = null;
  let fieldErrorsValue;

  initializeRecipeFormDialogState({
    editingRecipe: { name: 'Loaded recipe' },
    setFormData: (value) => {
      callOrder.push('setFormData');
      formValue = value;
    },
    setError: (value) => {
      callOrder.push('setError');
      errorValue = value;
    },
    setFieldErrors: (value) => {
      callOrder.push('setFieldErrors');
      fieldErrorsValue = value;
    },
    fetchIngredients,
    mapRecipeDataToFormFn,
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(callOrder, ['map', 'setFormData', 'setError', 'setFieldErrors', 'fetch']);
  assert.deepEqual(fetchArg, { forceRefresh: false });
  assert.deepEqual(formValue, { name: 'Loaded recipe' });
  assert.equal(errorValue, '');
  assert.deepEqual(fieldErrorsValue, INITIAL_RECIPE_FIELD_ERRORS);
});
