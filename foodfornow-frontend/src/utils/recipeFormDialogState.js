import { mapRecipeDataToForm } from './mapRecipeToForm';

export function getInitialRecipeFormData({ editingRecipe, createSeed, emptyFormData }) {
  if (editingRecipe) return mapRecipeDataToForm(editingRecipe);
  if (createSeed) return mapRecipeDataToForm(createSeed);
  return { ...emptyFormData };
}

export function initializeRecipeFormDialogState({
  editingRecipe,
  createSeed,
  emptyFormData,
  initialFieldErrors,
  setFormData,
  setError,
  setFieldErrors,
  fetchIngredients,
}) {
  setFormData(getInitialRecipeFormData({ editingRecipe, createSeed, emptyFormData }));
  setError('');
  setFieldErrors({ ...initialFieldErrors });

  let cancelled = false;
  void (async () => {
    await fetchIngredients({ forceRefresh: false });
    if (cancelled) return;
  })();

  return () => {
    cancelled = true;
  };
}
