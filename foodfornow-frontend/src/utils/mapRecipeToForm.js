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

function cloneEmptyFormData() {
  return {
    ...emptyFormData,
    ingredients: emptyFormData.ingredients.map((ingredient) => ({ ...ingredient })),
    instructions: [...emptyFormData.instructions],
  };
}

/** Map API / import recipe shape to RecipeFormDialog form state. */
export function mapRecipeDataToForm(recipeData) {
  if (!recipeData) return cloneEmptyFormData();
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
    : cloneEmptyFormData().ingredients;
  return {
    name: recipeData.name || '',
    description: recipeData.description || recipeData.name || '',
    ingredients: mappedIngredients,
    instructions: recipeData.instructions?.length ? recipeData.instructions.map((instruction) => instruction) : [''],
    prepTime: recipeData.prepTime ?? '',
    cookTime: recipeData.cookTime ?? '',
    servings: recipeData.servings ?? '',
    tags: Array.isArray(recipeData.tags) ? recipeData.tags.join(', ') : '',
  };
}
