/**
 * Ingredient resolution service.
 * Normalizes names for matching and finds existing "similar" ingredients
 * to avoid duplicates like "swordfish filets" vs "1 inch thick swordfish filets".
 */

const { normalizeIngredientName } = require('../utils/ingredientNormalization');

/**
 * Normalize ingredient name for similarity matching. Legacy name retained to
 * avoid breaking existing imports/tests.
 */
function normalizeNameForMatching(name) {
  return normalizeIngredientName(name);
}

/**
 * Find an existing ingredient for the user that is "similar" in name to the given name.
 * Similar = exact match (case-insensitive) or one normalized name contains the other
 * (e.g. "swordfish filets" matches "1 inch thick swordfish filets").
 * Returns the ingredient document or null.
 */
async function findSimilarIngredient(Ingredient, userId, name) {
  const normalizedInput = normalizeIngredientName(name);
  if (!normalizedInput) return null;

  const indexedMatch = await Ingredient.findOne({
    user: userId,
    normalizedName: normalizedInput,
  });
  if (indexedMatch) {
    return indexedMatch;
  }

  // Fallback for legacy ingredients created before normalizedName existed.
  const legacyIngredients = await Ingredient.find({
    user: userId,
    normalizedName: { $exists: false },
  }).select('_id name');

  for (const ing of legacyIngredients) {
    const normalizedExisting = normalizeIngredientName(ing.name);
    if (!normalizedExisting) continue;
    if (normalizedInput === normalizedExisting || normalizedExisting.includes(normalizedInput) || normalizedInput.includes(normalizedExisting)) {
      await Ingredient.updateOne(
        { _id: ing._id },
        { normalizedName: normalizedExisting }
      );
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
