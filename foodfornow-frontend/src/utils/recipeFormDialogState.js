/** Resolve the form payload used when opening RecipeFormDialog. */
export function getInitialRecipeFormData({ editingRecipe, createSeed, mapRecipeDataToForm, emptyFormData }) {
  if (editingRecipe) {
    return mapRecipeDataToForm(editingRecipe);
  }
  if (createSeed) {
    return mapRecipeDataToForm(createSeed);
  }
  return { ...emptyFormData };
}

/**
 * Initialize RecipeFormDialog state before ingredient options load so users
 * never see stale fields from a previously-opened recipe.
 */
export async function initializeRecipeFormDialogState({
  editingRecipe,
  createSeed,
  mapRecipeDataToForm,
  emptyFormData,
  initialFieldErrors,
  setFormData,
  setError,
  setFieldErrors,
  fetchIngredients,
}) {
  setFormData(getInitialRecipeFormData({ editingRecipe, createSeed, mapRecipeDataToForm, emptyFormData }));
  setError('');
  setFieldErrors({ ...initialFieldErrors });
  await fetchIngredients({ forceRefresh: false });
}
