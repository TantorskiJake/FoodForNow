import { mapRecipeDataToForm } from './mapRecipeToForm.js';

export const EMPTY_RECIPE_FORM_DATA = {
  name: '',
  description: '',
  ingredients: [{ ingredient: '', quantity: '', unit: '' }],
  instructions: [''],
  prepTime: '',
  cookTime: '',
  servings: '',
  tags: '',
};

export const INITIAL_RECIPE_FIELD_ERRORS = {
  name: '',
  description: false,
  prepTime: '',
  cookTime: '',
  servings: '',
  instructions: '',
  ingredients: '',
};

export function resolveInitialRecipeFormData({
  editingRecipe,
  createSeed,
  mapRecipeDataToFormFn = mapRecipeDataToForm,
}) {
  if (editingRecipe) {
    return mapRecipeDataToFormFn(editingRecipe);
  }
  if (createSeed) {
    return mapRecipeDataToFormFn(createSeed);
  }
  return { ...EMPTY_RECIPE_FORM_DATA };
}

export function initializeRecipeFormDialogState({
  editingRecipe,
  createSeed,
  setFormData,
  setError,
  setFieldErrors,
  fetchIngredients,
  mapRecipeDataToFormFn = mapRecipeDataToForm,
}) {
  // Keep this synchronous so the dialog never renders stale recipe details while
  // ingredient options are still loading.
  setFormData(
    resolveInitialRecipeFormData({
      editingRecipe,
      createSeed,
      mapRecipeDataToFormFn,
    })
  );
  setError('');
  setFieldErrors({ ...INITIAL_RECIPE_FIELD_ERRORS });

  Promise.resolve(fetchIngredients({ forceRefresh: false })).catch(() => undefined);
}
