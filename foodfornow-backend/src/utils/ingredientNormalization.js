/**
 * Ingredient name normalization helper used for deduplicating ingredients.
 * Shared between schema hooks and ingredient resolution logic to ensure
 * consistent normalized values persisted in MongoDB.
 */
function normalizeIngredientName(name) {
  if (!name || typeof name !== 'string') return '';
  let normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  normalized = normalized
    .replace(/\d+\s*(inch|in\.?|inches)\s*thick\s*/gi, ' ')
    .replace(/\d+\s*(cm|mm)\s*(thick)?\s*/gi, ' ')
    .replace(/\b(large|medium|small)\s+(sized?\s+)?/gi, ' ')
    .replace(/\b(diced|minced|chopped|sliced|grated|julienned|whole|halved)\s+/gi, ' ')
    .replace(/\b(fresh|frozen|dried|canned|raw|cooked)\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

module.exports = {
  normalizeIngredientName,
};
