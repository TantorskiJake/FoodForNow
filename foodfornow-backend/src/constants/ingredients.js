/**
 * Ingredient names that are assumed to always be available in every kitchen.
 * These are excluded from pantry checks, missing ingredient warnings, and shopping lists.
 * Uses exact match (case-insensitive) to avoid false positives (e.g. "bell pepper").
 */
const ALWAYS_AVAILABLE_INGREDIENTS = ['water', 'salt', 'pepper', 'black pepper', 'white pepper'];

/**
 * Check if an ingredient is always available (by name, case-insensitive).
 * @param {string} ingredientName - The ingredient name to check
 * @returns {boolean}
 */
function isAlwaysAvailableIngredient(ingredientName) {
  if (!ingredientName || typeof ingredientName !== 'string') return false;
  const nameLower = ingredientName.toLowerCase().trim();
  return ALWAYS_AVAILABLE_INGREDIENTS.includes(nameLower);
}

module.exports = {
  ALWAYS_AVAILABLE_INGREDIENTS,
  isAlwaysAvailableIngredient,
};
