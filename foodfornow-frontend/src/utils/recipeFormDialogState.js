/**
 * Resolve initial form payload when recipe dialog opens.
 */
export function getInitialRecipeFormData({ editingRecipe, createSeed, mapRecipeDataToForm, emptyFormData }) {
  if (editingRecipe) return mapRecipeDataToForm(editingRecipe);
  if (createSeed) return mapRecipeDataToForm(createSeed);
  return { ...emptyFormData };
}

/**
 * Initialize recipe form dialog state before ingredient options load to avoid
 * rendering stale values from previously edited recipes.
 */
export function initializeRecipeFormDialogState({
  open,
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
  if (!open) return undefined;

  let cancelled = false;

  setFormData(
    getInitialRecipeFormData({
      editingRecipe,
      createSeed,
      mapRecipeDataToForm,
      emptyFormData,
    })
  );
  setError('');
  setFieldErrors({ ...initialFieldErrors });

  (async () => {
    await fetchIngredients({ forceRefresh: false });
    if (cancelled) return;
  })();

  return () => {
    cancelled = true;
  };
}
