function createEmptyFormData() {
  return {
    name: '',
    description: '',
    ingredients: [{ ingredient: '', quantity: '', unit: '' }],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
  };
}

function mapIngredientToFormEntry(ingredientData) {
  if (!ingredientData || typeof ingredientData !== 'object') return null;

  const ingredientRef =
    ingredientData.ingredient && typeof ingredientData.ingredient === 'object'
      ? ingredientData.ingredient
      : null;
  const ingredientId = ingredientRef?._id ?? ingredientData.ingredient;
  const ingredientName = ingredientData.name || ingredientRef?.name;

  if (ingredientId && (typeof ingredientId === 'string' || typeof ingredientId === 'number')) {
    return {
      ingredient: ingredientId,
      quantity: String(ingredientData.quantity ?? ''),
      unit: ingredientData.unit || 'piece',
    };
  }

  return {
    ingredient: '',
    ingredientName: ingredientName || '',
    quantity: String(ingredientData.quantity ?? ''),
    unit: ingredientData.unit || 'piece',
    category: ingredientData.category || 'Other',
  };
}

/** Map API / import recipe shape to RecipeFormDialog form state. */
export function mapRecipeDataToForm(recipeData) {
  if (!recipeData || typeof recipeData !== 'object') return createEmptyFormData();

  const mappedIngredients = Array.isArray(recipeData.ingredients)
    ? recipeData.ingredients.map(mapIngredientToFormEntry).filter(Boolean)
    : [];

  const instructions = Array.isArray(recipeData.instructions) && recipeData.instructions.length
    ? [...recipeData.instructions]
    : [''];

  return {
    name: recipeData.name || '',
    description: recipeData.description || recipeData.name || '',
    ingredients: mappedIngredients.length ? mappedIngredients : [{ ingredient: '', quantity: '', unit: '' }],
    instructions,
    prepTime: recipeData.prepTime ?? '',
    cookTime: recipeData.cookTime ?? '',
    servings: recipeData.servings ?? '',
    tags: Array.isArray(recipeData.tags) ? recipeData.tags.join(', ') : '',
  };
}
