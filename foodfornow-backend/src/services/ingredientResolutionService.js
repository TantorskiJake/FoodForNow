/**
 * Ingredient resolution service.
 * Normalizes names for matching and finds existing "similar" ingredients
 * to avoid duplicates like "swordfish filets" vs "1 inch thick swordfish filets".
 */

/**
 * Normalize ingredient name for similarity matching:
 * - Lowercase, trim, collapse spaces
 * - Remove common size/format phrases (e.g. "1 inch thick", "diced", "minced")
 */
function normalizeNameForMatching(name) {
  if (!name || typeof name !== 'string') return '';
  let s = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  // Remove optional size/thickness/format prefixes (e.g. "1 inch thick", "2 cm", "large", "diced")
  s = s
    .replace(/\d+\s*(inch|in\.?|inches)\s*thick\s*/gi, ' ')
    .replace(/\d+\s*(cm|mm)\s*(thick)?\s*/gi, ' ')
    .replace(/\b(large|medium|small)\s+(sized?\s+)?/gi, ' ')
    .replace(/\b(diced|minced|chopped|sliced|grated|julienned|whole|halved)\s+/gi, ' ')
    .replace(/\b(fresh|frozen|dried|canned|raw|cooked)\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

/**
 * Find an existing ingredient for the user that is "similar" in name to the given name.
 * Similar = exact match (case-insensitive) or one normalized name contains the other
 * (e.g. "swordfish filets" matches "1 inch thick swordfish filets").
 * Returns the ingredient document or null.
 */
async function findSimilarIngredient(Ingredient, userId, name) {
  const normalizedInput = normalizeNameForMatching(name);
  if (!normalizedInput) return null;

  const userIngredients = await Ingredient.find({ user: userId }).select('name');
  for (const ing of userIngredients) {
    const normalizedExisting = normalizeNameForMatching(ing.name);
    if (!normalizedExisting) continue;
    if (normalizedInput === normalizedExisting) return ing;
    if (normalizedExisting.includes(normalizedInput) || normalizedInput.includes(normalizedExisting)) {
      return ing;
    }
  }
  return null;
}

/**
 * Resolve an ingredient for a recipe: by id or by name.
 * - If ing.ingredient (id) is provided and valid, use it.
 * - If ing.name is provided, find similar existing or create new (using category).
 * Returns { ingredient: ObjectId, quantity, unit }.
 */
async function resolveRecipeIngredient(Ingredient, userId, ing, validUnits, defaultCategory = 'Other') {
  const quantity = Number(ing.quantity);
  const unit = validUnits.includes(ing.unit) ? ing.unit : 'piece';

  if (ing.ingredient) {
    const found = await Ingredient.findOne({ _id: ing.ingredient, user: userId });
    if (found) {
      return { ingredient: found._id, quantity, unit };
    }
  }

  const name = (ing.name || ing.ingredientName || '').trim();
  if (!name) return null;

  let ingredient = await findSimilarIngredient(Ingredient, userId, name);
  if (!ingredient) {
    const category = (ing.category && ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'].includes(ing.category))
      ? ing.category
      : defaultCategory;
    ingredient = new Ingredient({
      name,
      category,
      user: userId,
    });
    await ingredient.save();
  }
  return { ingredient: ingredient._id, quantity, unit };
}

module.exports = {
  normalizeNameForMatching,
  findSimilarIngredient,
  resolveRecipeIngredient,
};
