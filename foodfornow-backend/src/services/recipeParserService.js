/**
 * Recipe Parser Service
 * Parses recipe data from URLs using schema.org JSON-LD and Microdata.
 * Transforms scraped data into the application's recipe format.
 * Includes a lenient fallback for sites (e.g. WP Recipe Maker) that use
 * valid JSON-LD but fail strict schema validation.
 */

const getRecipeData = require('@dimfu/recipe-scraper').default;
const { parseIngredient } = require('parse-ingredient');
const axios = require('axios');
const cheerio = require('cheerio');
const { assertUrlAllowedForFetch } = require('../utils/urlSafety');

const PROXY_ENDPOINT_TEMPLATE = (process.env.RECIPE_FETCH_PROXY_URL || '').trim();
const PROXY_REQUIRED = parseBoolean(process.env.RECIPE_FETCH_PROXY_REQUIRED);
const PROXY_SOURCE_URL_HEADER = 'X-Recipe-Source-Url';
const PROXY_SOURCE_HOST_HEADER = 'X-Recipe-Source-Host';
let proxyTemplateErrorLogged = false;

function parseBoolean(value) {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

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
  box: 'box',
  boxes: 'box',
};

const VALID_UNITS = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];

// Keywords for category inference (order matters - more specific first)
const CATEGORY_KEYWORDS = {
  Pantry: [
    'broth', 'stock', 'pasta', 'orzo', 'rice', 'flour', 'sugar', 'vinegar', 'mayo', 'mayonnaise',
    'jelly', 'jam', 'peanut butter', 'oil', 'olive oil', 'vegetable oil', 'soy sauce', 'honey',
    'maple syrup', 'canned', 'beans', 'lentils', 'chickpeas', 'tomato paste', 'salsa',
    'bread', 'breadcrumbs', 'crackers', 'tortilla', 'noodles', 'couscous', 'quinoa',
    'creatine', 'protein powder', 'nut butter',
  ],
  Dairy: [
    'milk', 'cream', 'cheese', 'parmesan', 'butter', 'yogurt', 'sour cream', 'ricotta',
    'mozzarella', 'cheddar', 'feta', 'whipping cream', 'heavy cream', 'half-and-half',
    'almond milk', 'oat milk', 'coconut milk', 'cream cheese',
  ],
  Meat: [
    'chicken', 'beef', 'pork', 'lamb', 'bacon', 'sausage', 'turkey', 'ham', 'rotisserie',
    'ground beef', 'ground turkey', 'prosciutto', 'pepperoni',
  ],
  Seafood: [
    'fish', 'shrimp', 'lobster', 'salmon', 'crab', 'tuna', 'cod', 'tilapia', 'scallop',
    'mussel', 'clam', 'oyster', 'anchovy', 'sardine', 'trout', 'halibut',
  ],
  Produce: [
    'spinach', 'broccoli', 'lettuce', 'kale', 'arugula', 'tomato', 'onion', 'garlic',
    'carrot', 'avocado', 'banana', 'apple', 'lemon', 'lime', 'orange', 'berry', 'berries',
    'celery', 'bell pepper', 'chili pepper', 'potato', 'sweet potato', 'zucchini', 'cucumber',
    'mushroom', 'ginger', 'herb', 'basil', 'cilantro', 'parsley', 'mint', 'dill',
    'edamame', 'corn', 'pea', 'bean', 'fruit', 'vegetable', 'greens', 'squash',
  ],
  Spices: [
    'seasoning', 'italian seasoning', 'oregano', 'paprika', 'cumin', 'cinnamon', 'nutmeg',
    'turmeric', 'curry', 'chili powder', 'cayenne', 'thyme', 'rosemary', 'sage',
    'bay leaf', 'vanilla', 'salt', 'pepper', 'black pepper', 'red pepper', 'spice',
  ],
  Beverages: [
    'water', 'juice', 'wine', 'beer', 'coffee', 'tea', 'soda', 'lemonade',
  ],
};

function appendProxyQuery(template, targetUrl) {
  const proxyUrl = new URL(template);
  proxyUrl.searchParams.set('url', targetUrl);
  return proxyUrl.toString();
}

function buildProxyFetchTarget(originalUrl) {
  if (!PROXY_ENDPOINT_TEMPLATE) {
    return { url: originalUrl, headers: {}, viaProxy: false };
  }

  try {
    const encodedTarget = encodeURIComponent(originalUrl);
    const finalUrl = PROXY_ENDPOINT_TEMPLATE.includes('{{URL}}')
      ? PROXY_ENDPOINT_TEMPLATE.replace(/{{URL}}/g, encodedTarget)
      : appendProxyQuery(PROXY_ENDPOINT_TEMPLATE, originalUrl);

    const sourceHost = new URL(originalUrl).host;
    return {
      url: finalUrl,
      headers: {
        [PROXY_SOURCE_URL_HEADER]: originalUrl,
        [PROXY_SOURCE_HOST_HEADER]: sourceHost,
      },
      viaProxy: true,
    };
  } catch (err) {
    if (!proxyTemplateErrorLogged) {
      console.error('Invalid RECIPE_FETCH_PROXY_URL value:', err.message || err);
      proxyTemplateErrorLogged = true;
    }
    return { url: originalUrl, headers: {}, viaProxy: false };
  }
}

/**
 * Infer ingredient category from name (for auto-created ingredients from URL import)
 */
function inferIngredientCategory(name) {
  if (!name || typeof name !== 'string') return 'Other';
  const decoded = name.replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  const lower = decoded.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return 'Other';
}

/**
 * Parse a duration string (e.g. "45 minutes", "PT10M", "1 hour 30 minutes") to minutes
 */
function parseDurationToMinutes(str) {
  if (str == null) return 0;
  if (typeof str === 'number' && !isNaN(str)) return Math.round(str);
  const s = (typeof str === 'string' ? str : String(str)).trim().toLowerCase();
  let total = 0;

  // ISO 8601 duration (e.g. PT10M, PT1H30M, P1DT2H)
  const isoMatch = s.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (isoMatch) {
    total = (parseInt(isoMatch[1] || 0, 10) * 60) + parseInt(isoMatch[2] || 0, 10);
    return total;
  }

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

// Browser-like headers to reduce 403 blocks from sites that reject bot requests.
// @dimfu/recipe-scraper sends no User-Agent, so many sites block it. We try our
// fallback first (with these headers) for better success on sites like ChewOutLoud.
const BROWSER_HEADERS_CHROME = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

// Alternate User-Agent for sites that block Chrome (e.g. Food Network, ChewOutLoud)
const BROWSER_HEADERS_FIREFOX = {
  ...BROWSER_HEADERS_CHROME,
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
};

/**
 * Fetch HTML with browser-like headers. Retries with alternate User-Agent on 403.
 */
async function fetchRecipeHtml(url) {
  await assertUrlAllowedForFetch(url);
  if (PROXY_REQUIRED && !PROXY_ENDPOINT_TEMPLATE) {
    throw new Error('Recipe import proxy is required but RECIPE_FETCH_PROXY_URL is not configured.');
  }

  const targetOrigin = new URL(url).origin;
  const proxyTarget = buildProxyFetchTarget(url);
  if (PROXY_REQUIRED && !proxyTarget.viaProxy) {
    throw new Error('Recipe import proxy is required but the configured proxy URL is invalid.');
  }

  const baseHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  };
  const opts = { responseType: 'text', timeout: 15000 };
  const { url: fetchUrl, headers: proxyHeaders } = proxyTarget;
  const headerSets = [
    { ...baseHeaders, ...proxyHeaders, 'User-Agent': BROWSER_HEADERS_CHROME['User-Agent'] },
    { ...baseHeaders, ...proxyHeaders, 'User-Agent': BROWSER_HEADERS_FIREFOX['User-Agent'], 'Referer': `${targetOrigin}/` },
  ];
  let lastErr;
  for (const headers of headerSets) {
    try {
      const { data } = await axios.get(fetchUrl, { ...opts, headers });
      return data;
    } catch (err) {
      lastErr = err;
      const is403 = err.response?.status === 403 || (err.message && err.message.includes('403'));
      if (!is403) throw err;
    }
  }
  throw lastErr;
}

/**
 * Lenient fallback: fetch HTML and extract Recipe from JSON-LD manually.
 * Handles sites (e.g. WP Recipe Maker, Salt & Lavender) that use valid schema
 * but fail @dimfu's strict validation (e.g. different property names).
 * Uses browser-like headers and retries with alternate User-Agent on 403.
 */
async function parseRecipeFromUrlFallback(url) {
  const html = await fetchRecipeHtml(url);

  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const text = $(scripts[i]).html();
      if (!text) continue;
      const json = JSON.parse(text);
      const recipes = [];

      const extract = (obj) => {
        if (!obj) return;
        if (obj['@type'] === 'Recipe' || (Array.isArray(obj['@type']) && obj['@type'].includes('Recipe'))) {
          recipes.push(obj);
        }
        if (obj['@graph'] && Array.isArray(obj['@graph'])) {
          obj['@graph'].forEach(extract);
        }
        if (Array.isArray(obj)) obj.forEach(extract);
      };
      extract(json);

      for (const r of recipes) {
        const ingredients = r.recipeIngredient || r.recipeIngredients || [];
        const ingList = Array.isArray(ingredients)
          ? ingredients.map((x) => {
              if (typeof x === 'string') return x.trim();
              if (x && typeof x === 'object') return (x.name || x.text || x['@value'] || '').trim();
              return '';
            })
          : [];
        if (!r.name || ingList.length === 0) continue;

        const instructions = r.recipeInstructions || [];
        const instrList = Array.isArray(instructions)
          ? instructions.map((x) => {
              if (typeof x === 'string') return x.trim();
              if (x && typeof x === 'object') return (x.text || x.name || x['@value'] || '').trim();
              return '';
            })
          : [];

        return {
          name: typeof r.name === 'string' ? r.name : (r.name && r.name['@value']) || 'Imported Recipe',
          description: r.description
            ? (typeof r.description === 'string' ? r.description : r.description['@value'] || r.name)
            : r.name,
          ingredients: ingList.filter(Boolean),
          instructions: instrList.filter(Boolean),
          prepTime: parseDurationToMinutes(r.prepTime),
          cookTime: parseDurationToMinutes(r.cookTime),
          totalTime: parseDurationToMinutes(r.totalTime),
          servings: parseServings(r.recipeYield),
          tags: Array.isArray(r.keywords) ? r.keywords : [],
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Parse recipe from URL and return data in our format
 * @param {string} url - Recipe URL
 * @returns {Promise<Object>} Parsed recipe data
 */
async function parseRecipeFromUrl(url) {
  await assertUrlAllowedForFetch(url);
  let data = null;

  // Try fallback first: it uses browser-like headers and retries with alternate User-Agent on 403.
  // @dimfu/recipe-scraper sends no User-Agent, so many sites (ChewOutLoud, Food Network, etc.) block it.
  try {
    data = await parseRecipeFromUrlFallback(url);
  } catch {
    data = null;
  }

  if (!data) {
    if (PROXY_REQUIRED) {
      throw new Error('Recipe import proxy is required; this URL could not be parsed via the proxy worker.');
    }
    try {
      data = await getRecipeData(url);
    } catch (err) {
      const shouldFallback =
        err.message === 'Recipe is not valid' ||
        err.response?.status === 403 ||
        (err.message && err.message.includes('status code 403'));
      if (shouldFallback) {
        data = await parseRecipeFromUrlFallback(url);
      }
      if (!data) throw err;
    }
  }

  if (!data || !data.name) {
    throw new Error('Could not extract recipe data from this URL. The site may not be supported or may not include structured recipe data.');
  }

  const ingredients = data.recipeIngredients || data.ingredients || [];
  const instructions = data.recipeInstructions || data.instructions || [];

  return {
    name: data.name,
    description: data.description || data.name,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    instructions: Array.isArray(instructions) ? instructions : [],
    prepTime: parseDurationToMinutes(data.prepTime),
    cookTime: parseDurationToMinutes(data.cookTime),
    totalTime: parseDurationToMinutes(data.totalTime),
    servings: parseServings(data.recipeYield || data.servings),
    tags: data.tags || data.keywords || [],
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
 * Build raw recipe format with suggested categories (no ingredient creation).
 * Used when we need user to confirm categories for uncertain ingredients.
 */
function buildRawRecipeFormat(parsed, validUnits) {
  const rawIngredients = [];
  for (const ingStr of parsed.ingredients) {
    const parsedIng = parseIngredientString(ingStr);
    if (!parsedIng || !parsedIng.name) continue;

    const suggestedCategory = inferIngredientCategory(parsedIng.name);
    const uncertain = suggestedCategory === 'Other';
    const unit = validUnits.includes(parsedIng.unit) ? parsedIng.unit : 'piece';

    rawIngredients.push({
      name: parsedIng.name,
      quantity: parsedIng.quantity,
      unit,
      suggestedCategory: CATEGORIES.includes(suggestedCategory) ? suggestedCategory : 'Other',
      uncertain,
    });
  }

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
    ingredients: rawIngredients,
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

/**
 * Transform raw recipe + category overrides into API format with ingredient IDs.
 * Creates or finds ingredients using user-selected categories when uncertain.
 */
async function transformToRecipeFormat(parsed, userId, Ingredient, validUnits, categoryOverrides = {}) {
  const ingredients = [];
  for (const raw of parsed.ingredients) {
    const name = raw.name || raw.ingredient?.name;
    if (!name) continue;

    const category = categoryOverrides[name] ?? raw.suggestedCategory ?? 'Other';
    const quantity = raw.quantity ?? 1;
    const unit = validUnits.includes(raw.unit) ? raw.unit : 'piece';

    let ingredient = await Ingredient.findOne({
      user: userId,
      name,
    }).collation({ locale: 'en', strength: 2 });

    if (!ingredient) {
      ingredient = new Ingredient({
        name,
        category: CATEGORIES.includes(category) ? category : 'Other',
        user: userId,
      });
      await ingredient.save();
    }

    ingredients.push({
      ingredient: ingredient._id,
      quantity,
      unit,
    });
  }

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

/**
 * Parse raw text (e.g. from OCR of handwritten recipe) into structured recipe format.
 * Expects text with optional sections: title, Ingredients, Instructions.
 */
function parseRecipeFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('No text provided');
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('No content to parse');

  const name = lines[0].length <= 80 ? lines[0] : 'Imported Recipe';

  // Find section boundaries (case-insensitive)
  const ingIdx = lines.findIndex((l) => /^ingredients?(\s*[:.]|$)/i.test(l) || /^ing\.?\s*$/i.test(l));
  const instrIdx = lines.findIndex((l) =>
    /^instructions?(\s*[:.]|$)/i.test(l) || /^directions?(\s*[:.]|$)/i.test(l) ||
    /^steps?(\s*[:.]|$)/i.test(l) || /^method(\s*[:.]|$)/i.test(l)
  );

  let ingredientLines = [];
  let instructionLines = [];

  if (ingIdx >= 0 && instrIdx >= 0 && ingIdx < instrIdx) {
    ingredientLines = lines.slice(ingIdx + 1, instrIdx).filter((l) => l.length > 1);
    instructionLines = lines.slice(instrIdx + 1).filter((l) => l.length > 1);
  } else if (ingIdx >= 0) {
    ingredientLines = lines.slice(ingIdx + 1).filter((l) => l.length > 1);
    const nextSection = lines.findIndex((l, i) => i > ingIdx && /^(instructions?|directions?|steps?|method)/i.test(l));
    if (nextSection > ingIdx) {
      ingredientLines = lines.slice(ingIdx + 1, nextSection).filter((l) => l.length > 1);
      instructionLines = lines.slice(nextSection + 1).filter((l) => l.length > 1);
    }
  } else if (instrIdx >= 0) {
    instructionLines = lines.slice(instrIdx + 1).filter((l) => l.length > 1);
  }

  // If no clear sections, heuristic: lines starting with numbers or bullets are often ingredients
  if (ingredientLines.length === 0 && instructionLines.length === 0) {
    const bulletOrNum = /^[\d\-•*]\s*\.?\s*/;
    const possibleIng = lines.filter((l) => bulletOrNum.test(l) || /^\d+\s*[\.\)]\s*/.test(l));
    const rest = lines.filter((l) => !bulletOrNum.test(l) && !/^\d+\s*[\.\)]\s*/.test(l));
    if (possibleIng.length >= 2) {
      ingredientLines = possibleIng.map((l) => l.replace(bulletOrNum, '').replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
      instructionLines = rest.slice(1).filter((l) => l.length > 2);
    } else {
      instructionLines = lines.slice(1).filter((l) => l.length > 2);
    }
  }

  // Parse ingredients
  const ingredients = [];
  for (const line of ingredientLines) {
    const parsed = parseIngredientString(line);
    if (parsed && parsed.name) {
      const suggestedCategory = inferIngredientCategory(parsed.name);
      const unit = VALID_UNITS.includes(parsed.unit) ? parsed.unit : 'piece';
      ingredients.push({
        name: parsed.name,
        quantity: parsed.quantity,
        unit,
        suggestedCategory: CATEGORIES.includes(suggestedCategory) ? suggestedCategory : 'Other',
        uncertain: suggestedCategory === 'Other',
      });
    }
  }

  if (ingredients.length === 0 && ingredientLines.length > 0) {
    for (const line of ingredientLines) {
      if (line.length > 2) {
        ingredients.push({
          name: line.replace(/^[\d\-•*]\s*\.?\s*/, '').trim(),
          quantity: 1,
          unit: 'piece',
          suggestedCategory: 'Other',
          uncertain: true,
        });
      }
    }
  }

  const instructions =
    instructionLines.length > 0
      ? instructionLines.map((l) => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean)
      : ['See original recipe for instructions.'];

  return {
    name,
    description: name,
    ingredients,
    instructions,
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    tags: [],
  };
}

module.exports = {
  parseRecipeFromUrl,
  parseRecipeFromText,
  parseIngredientString,
  buildRawRecipeFormat,
  transformToRecipeFormat,
  parseDurationToMinutes,
  parseServings,
  inferIngredientCategory,
};
