/**
 * Recipe Parser Service
 * Parses recipe data from URLs using schema.org JSON-LD and Microdata.
 * Transforms scraped data into the application's recipe format.
 */

const getRecipeData = require('@dimfu/recipe-scraper').default;
const { parseIngredient } = require('parse-ingredient');

// Map parse-ingredient unit IDs to our valid units
const UNIT_MAP = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  pound: 'lb',
  pounds: 'lb',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'l',
  liter: 'l',
  litres: 'l',
  liters: 'l',
  cup: 'cup',
  cups: 'cup',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  piece: 'piece',
  pieces: 'piece',
  pinch: 'pinch',
  pinches: 'pinch',
};

const VALID_UNITS = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'];

/**
 * Parse a duration string (e.g. "45 minutes", "1 hour 30 minutes") to minutes
 */
function parseDurationToMinutes(str) {
  if (!str || typeof str !== 'string') return 0;
  const s = str.trim().toLowerCase();
  let total = 0;

  // Match "X hour(s)" or "X hr(s)"
  const hourMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)s?/i);
  if (hourMatch) total += parseFloat(hourMatch[1]) * 60;

  // Match "X minute(s)" or "X min(s)"
  const minMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:minute|min)s?/i);
  if (minMatch) total += parseFloat(minMatch[1]);

  // If no matches, try parsing as plain number (assume minutes)
  if (total === 0) {
    const numMatch = s.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) total = parseFloat(numMatch[1]);
  }

  return Math.round(total) || 0;
}

/**
 * Parse an ingredient string into { quantity, unit, name }
 */
function parseIngredientString(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return null;

  try {
    const parsed = parseIngredient(str.trim());
    if (!parsed || parsed.length === 0) return null;
    const p = parsed[0];
    if (p.isGroupHeader) return null;

    const quantity = p.quantity != null ? p.quantity : (p.quantity2 != null ? p.quantity2 : 1);
    let unit = 'piece';
    if (p.unitOfMeasureID) {
      const mapped = UNIT_MAP[p.unitOfMeasureID.toLowerCase()];
      unit = mapped && VALID_UNITS.includes(mapped) ? mapped : 'piece';
    }
    const name = (p.description || str).trim();
    if (!name) return null;

    return { quantity, unit, name };
  } catch {
    // Fallback: treat whole string as ingredient name with quantity 1, unit piece
    return { quantity: 1, unit: 'piece', name: str.trim() };
  }
}

/**
 * Parse recipe from URL and return data in our format
 * @param {string} url - Recipe URL
 * @returns {Promise<Object>} Parsed recipe data
 */
async function parseRecipeFromUrl(url) {
  const data = await getRecipeData(url);

  if (!data || !data.name) {
    throw new Error('Could not extract recipe data from this URL. The site may not be supported or may not include structured recipe data.');
  }

  return {
    name: data.name,
    description: data.name, // Use name as fallback; many sites don't have separate description
    ingredients: data.recipeIngredients || [],
    instructions: data.recipeInstructions || [],
    prepTime: parseDurationToMinutes(data.prepTime),
    cookTime: parseDurationToMinutes(data.cookTime),
    totalTime: parseDurationToMinutes(data.totalTime),
    servings: parseServings(data.recipeYield),
    tags: data.tags || [],
  };
}

/**
 * Parse servings from various formats (number, "4 servings", "Serves 4", etc.)
 */
function parseServings(val) {
  if (val == null) return 4;
  if (typeof val === 'number' && !isNaN(val)) return Math.max(1, Math.round(val));
  const str = String(val).trim();
  const numMatch = str.match(/(\d+)/);
  return numMatch ? Math.max(1, parseInt(numMatch[1], 10)) : 4;
}

/**
 * Transform parsed recipe into our API format with ingredient IDs
 * Creates or finds ingredients for the user
 */
async function transformToRecipeFormat(parsed, userId, Ingredient, validUnits) {
  const ingredients = [];
  for (const ingStr of parsed.ingredients) {
    const parsedIng = parseIngredientString(ingStr);
    if (!parsedIng || !parsedIng.name) continue;

    let ingredient = await Ingredient.findOne({
      user: userId,
      name: parsedIng.name,
    }).collation({ locale: 'en', strength: 2 });

    if (!ingredient) {
      ingredient = new Ingredient({
        name: parsedIng.name,
        category: 'Other',
        user: userId,
      });
      await ingredient.save();
    }

    const unit = validUnits.includes(parsedIng.unit) ? parsedIng.unit : 'piece';
    ingredients.push({
      ingredient: ingredient._id,
      quantity: parsedIng.quantity,
      unit,
    });
  }

  // Ensure we have at least prep and cook time
  let prepTime = parsed.prepTime || 0;
  let cookTime = parsed.cookTime || 0;
  if (prepTime === 0 && cookTime === 0 && parsed.totalTime > 0) {
    prepTime = Math.floor(parsed.totalTime / 2);
    cookTime = parsed.totalTime - prepTime;
  }
  if (prepTime === 0) prepTime = 15;
  if (cookTime === 0) cookTime = 30;

  return {
    name: parsed.name,
    description: parsed.description || parsed.name,
    ingredients,
    instructions: Array.isArray(parsed.instructions)
      ? parsed.instructions
          .filter(Boolean)
          .map((i) => (typeof i === 'string' ? i : (i && (i.text || i.name)) || String(i)))
      : ['See original recipe for instructions.'],
    prepTime,
    cookTime,
    servings: parsed.servings || 4,
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean) : [],
  };
}

module.exports = {
  parseRecipeFromUrl,
  parseIngredientString,
  transformToRecipeFormat,
  parseDurationToMinutes,
  parseServings,
};
