const ingredientSelectionError = 'Create that ingredient or choose from your collection.';

export function getRecipeFormFieldErrors(formData) {
  const nameErr = !formData.name?.trim() ? 'Please fill out this field!' : '';
  const descriptionErr = !formData.description?.trim();
  const prepErr = !formData.prepTime || Number(formData.prepTime) <= 0 ? 'Must be greater than 0' : '';
  const cookErr = !formData.cookTime || Number(formData.cookTime) <= 0 ? 'Must be greater than 0' : '';
  const servingsErr = !formData.servings || Number(formData.servings) <= 0 ? 'Must be greater than 0' : '';
  const instructionsErr =
    !formData.instructions?.length || !formData.instructions[0]?.trim() ? 'At least one instruction is required' : '';
  const hasAtLeastOneIngredient = formData.ingredients?.some(
    (ing) => (ing.ingredient || (ing.ingredientName && ing.ingredientName.trim())) && ing.quantity && ing.unit
  );
  const ingredientsErr =
    !formData.ingredients?.length || !hasAtLeastOneIngredient
      ? ingredientSelectionError
      : '';

  return {
    name: nameErr,
    description: descriptionErr,
    prepTime: prepErr,
    cookTime: cookErr,
    servings: servingsErr,
    instructions: instructionsErr,
    ingredients: ingredientsErr,
  };
}

export function hasRecipeFormErrors(fieldErrors) {
  return (
    !!fieldErrors.name ||
    !!fieldErrors.description ||
    !!fieldErrors.prepTime ||
    !!fieldErrors.cookTime ||
    !!fieldErrors.servings ||
    !!fieldErrors.instructions ||
    !!fieldErrors.ingredients
  );
}

export function buildRecipePayload(formData) {
  const ingredientsPayload = formData.ingredients
    .filter((ing) => (ing.ingredient || (ing.ingredientName && ing.ingredientName.trim())) && ing.quantity && ing.unit)
    .map((ing) => {
      if (ing.ingredient) {
        return { ingredient: ing.ingredient, quantity: ing.quantity, unit: ing.unit };
      }
      return {
        name: ing.ingredientName.trim(),
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category || 'Other',
      };
    });

  return {
    ...formData,
    name: formData.name.trim(),
    description: formData.description.trim(),
    instructions: formData.instructions.filter((instruction) => instruction.trim()),
    ingredients: ingredientsPayload,
    tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}
