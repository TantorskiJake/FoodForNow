export function isCompleteIngredient(ingredient) {
  return Boolean(
    (ingredient?.ingredient || (ingredient?.ingredientName && ingredient.ingredientName.trim())) &&
      ingredient?.quantity &&
      ingredient?.unit
  );
}

export function buildRecipeFieldErrors(formData) {
  const nameErr = !formData.name?.trim() ? 'Please fill out this field!' : '';
  const descriptionErr = !formData.description?.trim();
  const prepErr = !formData.prepTime || Number(formData.prepTime) <= 0 ? 'Must be greater than 0' : '';
  const cookErr = !formData.cookTime || Number(formData.cookTime) <= 0 ? 'Must be greater than 0' : '';
  const servingsErr = !formData.servings || Number(formData.servings) <= 0 ? 'Must be greater than 0' : '';
  const instructionsErr =
    !formData.instructions?.length || !formData.instructions[0]?.trim() ? 'At least one instruction is required' : '';
  const hasAtLeastOneIngredient = formData.ingredients?.some((ingredient) => isCompleteIngredient(ingredient));
  const ingredientsErr =
    !formData.ingredients?.length || !hasAtLeastOneIngredient
      ? 'Create that ingredient or choose from your collection.'
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

export function hasRecipeFieldErrors(fieldErrors) {
  return Boolean(
    fieldErrors.name ||
      fieldErrors.description ||
      fieldErrors.prepTime ||
      fieldErrors.cookTime ||
      fieldErrors.servings ||
      fieldErrors.instructions ||
      fieldErrors.ingredients
  );
}

export function buildRecipePayload(formData) {
  const ingredients = formData.ingredients
    .filter((ingredient) => isCompleteIngredient(ingredient))
    .map((ingredient) => {
      if (ingredient.ingredient) {
        return {
          ingredient: ingredient.ingredient,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        };
      }

      return {
        name: ingredient.ingredientName.trim(),
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category || 'Other',
      };
    });

  return {
    ...formData,
    name: formData.name.trim(),
    description: formData.description.trim(),
    instructions: formData.instructions.filter((instruction) => instruction.trim()),
    ingredients,
    tags: formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}
