/**
 * Ingredient similarity utility
 * Detects when a new ingredient (e.g. "shredded chicken") is similar to an existing one (e.g. "chicken")
 * so we can suggest using the existing ingredient instead of creating duplicates.
 */

// Preparation/cooking modifiers to strip when comparing ingredients
const PREPARATION_MODIFIERS = new Set([
  'shredded', 'diced', 'chopped', 'minced', 'grated', 'sliced', 'cubed', 'julienned',
  'fresh', 'cooked', 'raw', 'frozen', 'canned', 'dried', 'drained', 'rinsed',
  'boneless', 'skinless', 'peeled', 'cut', 'crushed', 'crumbled', 'melted',
  'softened', 'room temperature', 'warm', 'cold', 'chilled',
  'extra', 'virgin', 'organic', 'low-fat', 'fat-free', 'reduced-fat',
  'rotisserie', 'leftover', 'prepared', 'store-bought', 'homemade',
  'large', 'small', 'medium', 'whole', 'halved', 'quartered',
  'finely', 'roughly', 'thinly', 'thickly', 'coarsely',
  'optional', 'to taste', 'for garnish',
]);

/**
 * Normalize an ingredient name for comparison by removing preparation modifiers
 * and standardizing format. E.g. "Shredded Chicken" -> "chicken"
 */
function normalizeForComparison(name) {
  if (!name || typeof name !== 'string') return '';
  const decoded = name.replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  const words = decoded
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !PREPARATION_MODIFIERS.has(w));
  return words.join(' ').trim();
}

/**
 * Check if two normalized ingredient names are similar (one contains the other or they match)
 */
function namesAreSimilar(normNew, normExisting) {
  if (!normNew || !normExisting) return false;
  if (normNew === normExisting) return true;
  if (normNew.includes(normExisting)) return true;
  if (normExisting.includes(normNew)) return true;
  return false;
}

/**
 * Find existing ingredients that are similar to a new ingredient name.
 * Returns array of similar ingredients, sorted by preference (exact match first, then shorter names)
 * @param {Array} existingIngredients - Array of { _id, name, ... } objects
 * @param {string} newName - The new ingredient name being added
 * @returns {Array} Similar ingredients, best match first
 */
function findSimilarIngredients(existingIngredients, newName) {
  if (!newName || !existingIngredients?.length) return [];

  const normNew = normalizeForComparison(newName);
  if (!normNew) return [];

  const similar = [];
  for (const ing of existingIngredients) {
    const normExisting = normalizeForComparison(ing.name);
    if (!normExisting) continue;
    if (namesAreSimilar(normNew, normExisting)) {
      similar.push(ing);
    }
  }

  // Sort: exact normalized match first, then by name length (prefer shorter/generic names)
  similar.sort((a, b) => {
    const normA = normalizeForComparison(a.name);
    const normB = normalizeForComparison(b.name);
    const exactA = normA === normNew ? 1 : 0;
    const exactB = normB === normNew ? 1 : 0;
    if (exactA !== exactB) return exactB - exactA;
    return a.name.length - b.name.length;
  });

  return similar;
}

module.exports = {
  normalizeForComparison,
  findSimilarIngredients,
  PREPARATION_MODIFIERS,
};
