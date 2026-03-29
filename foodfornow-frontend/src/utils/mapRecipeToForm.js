const emptyFormData = {
  name: '',
  description: '',
  ingredients: [{ ingredient: '', quantity: '', unit: '' }],
  instructions: [''],
  prepTime: '',
  cookTime: '',
  servings: '',
  tags: '',
};

/** Map API / import recipe shape to RecipeFormDialog form state. */
export function mapRecipeDataToForm(recipeData) {
  if (!recipeData) return { ...emptyFormData };
  const mappedIngredients = recipeData.ingredients?.length
    ? recipeData.ingredients.map((ing) => {
        const id = ing.ingredient?._id ?? ing.ingredient;
        const name = ing.name || ing.ingredient?.name;
        if (id) {
          return { ingredient: id, quantity: String(ing.quantity ?? ''), unit: ing.unit || 'piece' };
        }
        return {
          ingredient: '',
          ingredientName: name || '',
          quantity: String(ing.quantity ?? ''),
          unit: ing.unit || 'piece',
          category: ing.category || 'Other',
        };
      })
    : [{ ingredient: '', quantity: '', unit: '' }];
  return {
    name: recipeData.name || '',
    description: recipeData.description || recipeData.name || '',
    ingredients: mappedIngredients,
    instructions: recipeData.instructions?.length ? recipeData.instructions : [''],
    prepTime: recipeData.prepTime ?? '',
    cookTime: recipeData.cookTime ?? '',
    servings: recipeData.servings ?? '',
    tags: Array.isArray(recipeData.tags) ? recipeData.tags.join(', ') : '',
  };
}
