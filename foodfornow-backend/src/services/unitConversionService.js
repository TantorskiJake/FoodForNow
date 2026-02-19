/**
 * Unit conversion for ingredients. Converts between weight (g, kg, oz, lb),
 * volume (ml, l, cup, tbsp, tsp), and countable units (piece, pinch, box).
 * Uses ingredient name to decide standard: liquids -> ml, solids -> g, etc.
 */

const VOLUME_TO_ML = {
  ml: 1,
  l: 1000,
  cup: 236.59,
  tbsp: 14.79,
  tsp: 4.93,
};

const WEIGHT_TO_G = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.59,
};

const ML_TO_VOLUME = Object.fromEntries(
  Object.entries(VOLUME_TO_ML).map(([u, factor]) => [u, 1 / factor])
);

/** Cups to other volume (1 cup = 16 tbsp = 48 tsp = 236.59 ml) */
const CUPS_TO_VOLUME = {
  cup: 1,
  tbsp: 16,
  tsp: 48,
  ml: 236.59,
  l: 0.23659,
};

const G_TO_WEIGHT = Object.fromEntries(
  Object.entries(WEIGHT_TO_G).map(([u, factor]) => [u, 1 / factor])
);

const VOLUME_UNITS = ['ml', 'l', 'cup', 'tbsp', 'tsp'];
const WEIGHT_UNITS = ['g', 'kg', 'oz', 'lb'];
const COUNTABLE_UNITS = ['piece', 'pinch', 'box'];

/** Keywords that indicate volume-based (liquid) ingredients */
const LIQUID_KEYWORDS = [
  'milk', 'water', 'oil', 'juice', 'broth', 'sauce', 'vinegar',
  'lemon juice', 'cream', 'stock', 'wine', 'beer', 'soda', 'tea',
  'coffee', 'syrup', 'honey', 'molasses', 'almond milk', 'soy milk',
  'oat milk', 'coconut milk', 'buttermilk',
];

/**
 * Fallback density (g per US cup) when ingredient is not in GRAMS_PER_CUP.
 * Used so volume amounts are never treated as 0 need (avoids wrong deduction).
 */
const FALLBACK_GRAMS_PER_CUP = 120;

/**
 * Approximate grams per US cup for weight-based ingredients often measured by volume.
 * Used to convert recipe volume (cups/tbsp/tsp) <-> pantry weight (g) for display/deduction.
 */
const GRAMS_PER_CUP = [
  { keywords: ['flour', 'all-purpose', 'all purpose'], gPerCup: 120 },
  { keywords: ['bread flour', 'cake flour'], gPerCup: 120 },
  { keywords: ['sugar', 'granulated', 'brown sugar', 'powdered sugar', 'confectioners'], gPerCup: 200 },
  { keywords: ['salt', 'kosher salt', 'table salt', 'sea salt'], gPerCup: 288 },
  { keywords: ['butter'], gPerCup: 227 },
  { keywords: ['peanut butter', 'almond butter', 'nut butter'], gPerCup: 256 },
  { keywords: ['rice', 'white rice', 'jasmine rice', 'basmati'], gPerCup: 185 },
  { keywords: ['pasta', 'orzo', 'penne', 'spaghetti', 'macaroni'], gPerCup: 100 },
  { keywords: ['oat', 'rolled oats', 'oatmeal'], gPerCup: 90 },
  { keywords: ['cornstarch'], gPerCup: 128 },
  { keywords: ['cocoa powder', 'cacao'], gPerCup: 86 },
  { keywords: ['parmesan', 'parmigiano', 'grated cheese', 'shredded cheese'], gPerCup: 100 },
  { keywords: ['creatine', 'protein powder', 'whey'], gPerCup: 120 },
  { keywords: ['tomato paste'], gPerCup: 270 },
  { keywords: ['pepper', 'black pepper', 'ground pepper'], gPerCup: 110 },
  { keywords: ['oregano', 'paprika', 'cumin', 'spice', 'herb'], gPerCup: 50 },
  { keywords: ['garlic powder', 'onion powder'], gPerCup: 140 },
  { keywords: ['spinach', 'baby spinach', 'chopped spinach', 'leafy green'], gPerCup: 30 },
  { keywords: ['frozen fruit', 'berries', 'edamame'], gPerCup: 150 },
  { keywords: ['shredded carrot', 'carrot grated'], gPerCup: 100 },
  { keywords: ['mayo', 'mayonnaise', 'spicy mayo'], gPerCup: 220 },
  { keywords: ['avocado', 'mashed avocado'], gPerCup: 230 },
];

function getGramsPerCup(ingredientName) {
  if (!ingredientName || typeof ingredientName !== 'string') return null;
  const name = ingredientName.toLowerCase();
  for (const { keywords, gPerCup } of GRAMS_PER_CUP) {
    if (keywords.some((kw) => name.includes(kw))) return gPerCup;
  }
  return null;
}

/**
 * Approximate grams per piece for countable produce/herbs so we can convert
 * pantry weight (g) <-> recipe "piece" (e.g. 12 garlic cloves, 3 onions).
 */
const GRAMS_PER_PIECE = [
  { keywords: ['garlic', 'garlic clove'], gPerPiece: 5 },
  { keywords: ['onion', 'yellow onion', 'red onion', 'white onion'], gPerPiece: 150 },
  { keywords: ['lemon', 'lime'], gPerPiece: 60 },
  { keywords: ['avocado'], gPerPiece: 150 },
  { keywords: ['fennel', 'fennel bulb'], gPerPiece: 200 },
  { keywords: ['thyme', 'sprig'], gPerPiece: 1 },
  { keywords: ['bay leaf', 'bay leaves'], gPerPiece: 0.5 },
];

function getGramsPerPiece(ingredientName) {
  if (!ingredientName || typeof ingredientName !== 'string') return null;
  const name = ingredientName.toLowerCase();
  for (const { keywords, gPerPiece } of GRAMS_PER_PIECE) {
    if (keywords.some((kw) => name.includes(kw))) return gPerPiece;
  }
  return null;
}

/** Typical ml per "piece" for liquids sold by carton (e.g. broth 1 carton ≈ 2 cups). */
const ML_PER_PIECE_LIQUID = [
  { keywords: ['broth', 'stock', 'beef broth', 'chicken broth', 'vegetable broth'], mlPerPiece: 473 },
];

function getMlPerPiece(ingredientName) {
  if (!ingredientName || typeof ingredientName !== 'string') return null;
  const name = ingredientName.toLowerCase();
  for (const { keywords, mlPerPiece } of ML_PER_PIECE_LIQUID) {
    if (keywords.some((kw) => name.includes(kw))) return mlPerPiece;
  }
  return null;
}

/**
 * Get the standard unit for an ingredient by name (ml for liquids, g for weight, piece for countable).
 * Ingredients with a density (grams per cup) use grams so volume/weight conversion is consistent.
 * @param {string} ingredientName
 * @returns {'ml'|'g'|'piece'}
 */
function getStandardUnit(ingredientName) {
  if (!ingredientName || typeof ingredientName !== 'string') return 'g';
  const name = ingredientName.toLowerCase();

  if (getGramsPerCup(ingredientName) != null) return 'g';
  if (LIQUID_KEYWORDS.some((kw) => name.includes(kw))) return 'ml';
  if (['salt', 'pepper', 'spice', 'herb', 'garlic', 'onion powder', 'cinnamon', 'nutmeg'].some((s) => name.includes(s))) return 'g';
  if (['flour', 'sugar', 'rice', 'pasta', 'beans'].some((b) => name.includes(b))) return 'g';
  if (['chicken', 'beef', 'pork', 'fish', 'meat', 'lobster', 'shrimp'].some((p) => name.includes(p))) return 'g';
  if (['banana', 'apple', 'orange', 'tomato', 'carrot', 'lettuce', 'spinach'].some((p) => name.includes(p))) return 'piece';

  return 'g';
}

/**
 * Convert quantity in given unit to standard unit (ml, g, or piece).
 * When ingredientName is missing, convert by unit type only (volume->ml, weight->g) so pantry is never zeroed.
 * @param {number} quantity
 * @param {string} unit
 * @param {string} ingredientName - used to choose volume vs weight (optional; fallback by unit if empty)
 * @returns {number} quantity in standard unit
 */
function toStandard(quantity, unit, ingredientName) {
  if (quantity == null || Number.isNaN(Number(quantity))) return 0;
  const q = Number(quantity);
  const hasName = typeof ingredientName === 'string' && ingredientName.trim().length > 0;
  const std = hasName ? getStandardUnit(ingredientName) : null;

  if (COUNTABLE_UNITS.includes(unit)) {
    if (!hasName) return q;
    if (unit === 'pinch') return std === 'g' ? q * 0.36 : 0;
    if (unit === 'piece' || unit === 'box') {
      if (std === 'piece') return q;
      if (std === 'g') {
        const gPerPiece = getGramsPerPiece(ingredientName);
        if (gPerPiece != null && gPerPiece > 0) return q * gPerPiece;
      }
      if (std === 'ml') {
        const mlPerPiece = getMlPerPiece(ingredientName);
        if (mlPerPiece != null && mlPerPiece > 0) return q * mlPerPiece;
      }
    }
    return 0;
  }
  if (VOLUME_UNITS.includes(unit)) {
    if (!hasName || std === 'ml') return q * (VOLUME_TO_ML[unit] ?? 1);
    if (std === 'g' || (std === 'piece' && (getGramsPerCup(ingredientName) != null || std === 'g'))) {
      const density = getGramsPerCup(ingredientName) ?? (std === 'g' ? FALLBACK_GRAMS_PER_CUP : null);
      if (density != null) {
        const ml = q * (VOLUME_TO_ML[unit] ?? 1);
        const cups = ml / 236.59;
        return cups * density;
      }
    }
    return 0;
  }
  if (WEIGHT_UNITS.includes(unit)) {
    if (!hasName || std === 'g') return q * (WEIGHT_TO_G[unit] ?? 1);
    if (std === 'piece' && getGramsPerCup(ingredientName) != null) return q * (WEIGHT_TO_G[unit] ?? 1);
    return 0;
  }
  return 0;
}

/**
 * Convert quantity from standard unit to target unit.
 * When ingredientName is missing, infer standard from target unit (volume->ml, weight->g).
 * @param {number} quantityInStandard
 * @param {string} targetUnit
 * @param {string} ingredientName - used to choose volume vs weight for standard
 * @returns {number} quantity in target unit
 */
function fromStandard(quantityInStandard, targetUnit, ingredientName) {
  if (quantityInStandard == null || Number.isNaN(Number(quantityInStandard))) return 0;
  const q = Number(quantityInStandard);
  const hasName = typeof ingredientName === 'string' && ingredientName.trim().length > 0;
  const std = hasName ? getStandardUnit(ingredientName) : null;

  if (COUNTABLE_UNITS.includes(targetUnit)) {
    if (!hasName) return q;
    if (targetUnit === 'pinch') return std === 'g' ? q / 0.36 : q;
    if (targetUnit === 'piece' || targetUnit === 'box') {
      if (std === 'piece') return q;
      if (std === 'g') {
        const gPerPiece = getGramsPerPiece(ingredientName);
        if (gPerPiece != null && gPerPiece > 0) return q / gPerPiece;
      }
      if (std === 'ml') {
        const mlPerPiece = getMlPerPiece(ingredientName);
        if (mlPerPiece != null && mlPerPiece > 0) return q / mlPerPiece;
      }
    }
    return q;
  }
  if (VOLUME_UNITS.includes(targetUnit)) {
    if (!hasName || std === 'ml') return q * (ML_TO_VOLUME[targetUnit] ?? 1);
    if (std === 'g' || (std === 'piece' && (getGramsPerCup(ingredientName) != null || std === 'g'))) {
      const density = getGramsPerCup(ingredientName) ?? (std === 'g' ? FALLBACK_GRAMS_PER_CUP : null);
      if (density != null && density > 0) {
        const cups = q / density;
        return cups * (CUPS_TO_VOLUME[targetUnit] ?? 1);
      }
    }
    return 0;
  }
  if (WEIGHT_UNITS.includes(targetUnit)) {
    if (!hasName || std === 'g') return q * (G_TO_WEIGHT[targetUnit] ?? 1);
    return 0;
  }
  return q;
}

/**
 * Convert quantity from one unit to another for a given ingredient.
 * @param {number} quantity
 * @param {string} fromUnit
 * @param {string} toUnit
 * @param {string} ingredientName
 * @returns {number}
 */
function convert(quantity, fromUnit, toUnit, ingredientName) {
  const standard = getStandardUnit(ingredientName);
  const inStandard = toStandard(quantity, fromUnit, ingredientName);
  return fromStandard(inStandard, toUnit, ingredientName);
}

/**
 * Check if two units are compatible (both volume, both weight, or both countable).
 */
function areUnitsCompatible(unitA, unitB) {
  const aVol = VOLUME_UNITS.includes(unitA);
  const bVol = VOLUME_UNITS.includes(unitB);
  if (aVol && bVol) return true;
  const aWt = WEIGHT_UNITS.includes(unitA);
  const bWt = WEIGHT_UNITS.includes(unitB);
  if (aWt && bWt) return true;
  const aCnt = COUNTABLE_UNITS.includes(unitA);
  const bCnt = COUNTABLE_UNITS.includes(unitB);
  if (aCnt && bCnt) return true;
  return false;
}

module.exports = {
  getStandardUnit,
  toStandard,
  fromStandard,
  convert,
  areUnitsCompatible,
  VOLUME_UNITS,
  WEIGHT_UNITS,
  COUNTABLE_UNITS,
};
