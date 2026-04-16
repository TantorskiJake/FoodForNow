const createEmptyFormData = () => ({
  name: '',
  description: '',
  ingredients: [{ ingredient: '', quantity: '', unit: '' }],
  instructions: [''],
  prepTime: '',
  cookTime: '',
  servings: '',
  tags: '',
});

/** Map API / import recipe shape to RecipeFormDialog form state. */
export function mapRecipeDataToForm(recipeData) {
  if (!recipeData) return createEmptyFormData();
  const mappedIngredients = Array.isArray(recipeData.ingredients) && recipeData.ingredients.length
    ? recipeData.ingredients.map((ing) => {
        const safeIngredient = ing && typeof ing === 'object' ? ing : {};
        const id = safeIngredient.ingredient?._id ?? safeIngredient.ingredient;
        const name = safeIngredient.name || safeIngredient.ingredient?.name;
        if (id) {
          return { ingredient: id, quantity: String(safeIngredient.quantity ?? ''), unit: safeIngredient.unit || 'piece' };
        }
        return {
          ingredient: '',
          ingredientName: name || '',
          quantity: String(safeIngredient.quantity ?? ''),
          unit: safeIngredient.unit || 'piece',
          category: safeIngredient.category || 'Other',
        };
      })
    : [{ ingredient: '', quantity: '', unit: '' }];
  return {
    name: recipeData.name || '',
    description: recipeData.description || recipeData.name || '',
    ingredients: mappedIngredients,
    instructions: Array.isArray(recipeData.instructions) && recipeData.instructions.length ? [...recipeData.instructions] : [''],
    prepTime: recipeData.prepTime ?? '',
    cookTime: recipeData.cookTime ?? '',
    servings: recipeData.servings ?? '',
    tags: Array.isArray(recipeData.tags) ? recipeData.tags.join(', ') : '',
  };
}
