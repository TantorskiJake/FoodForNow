const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

/**
 * Map Open Food Facts categories to our ingredient categories
 */
const CATEGORY_MAP = {
  'en:meats': 'Meat',
  'en:seafood': 'Seafood',
  'en:dairy': 'Dairy',
  'en:fruits': 'Produce',
  'en:vegetables': 'Produce',
  'en:spices': 'Spices',
  'en:beverages': 'Beverages',
  'en:breakfast-cereals': 'Pantry',
  'en:spreads': 'Pantry',
  'en:chocolates': 'Pantry',
  'en:snacks': 'Pantry',
  'en:condiments': 'Pantry',
  'en:plant-based-foods': 'Produce',
};

const VALID_CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];
const VALID_UNITS = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];

/**
 * Parse quantity string like "400g" or "1.5 kg" into { value, unit }
 */
function parseQuantity(quantityStr) {
  if (!quantityStr || typeof quantityStr !== 'string') return { value: 1, unit: 'piece' };
  const trimmed = quantityStr.trim().toLowerCase();
  const match = trimmed.match(/^([\d.,]+)\s*(g|kg|oz|lb|ml|l|cup|tbsp|tsp|piece|pinch|box)?$/i);
  if (match) {
    const value = parseFloat(match[1].replace(',', '.')) || 1;
    let unit = (match[2] || 'g').toLowerCase();
    if (unit === 'l') unit = 'l';
    if (!VALID_UNITS.includes(unit)) unit = 'g';
    return { value, unit };
  }
  if (/\d/.test(trimmed)) {
    const numMatch = trimmed.match(/([\d.,]+)/);
    if (numMatch) {
      const value = parseFloat(numMatch[1].replace(',', '.')) || 1;
      if (/\b(kg|oz|lb|ml|l)\b/i.test(trimmed)) {
        const u = trimmed.match(/\b(kg|oz|lb|ml|l)\b/i);
        return { value, unit: u[1].toLowerCase() };
      }
      return { value, unit: 'g' };
    }
  }
  return { value: 1, unit: 'piece' };
}

/**
 * Map Open Food Facts category to our enum
 */
function mapCategory(categoriesStr, categoriesTags = []) {
  if (!categoriesStr && !categoriesTags?.length) return 'Other';
  const combined = [
    ...(categoriesStr ? categoriesStr.split(',').map(s => s.trim().toLowerCase()) : []),
    ...(categoriesTags || []).map(t => t.replace('en:', '').toLowerCase()),
  ];
  for (const tag of categoriesTags || []) {
    if (CATEGORY_MAP[tag]) return CATEGORY_MAP[tag];
  }
  for (const cat of combined) {
    const key = 'en:' + cat.replace(/\s+/g, '-');
    if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  }
  if (combined.some(c => c.includes('meat') || c.includes('viande'))) return 'Meat';
  if (combined.some(c => c.includes('fish') || c.includes('seafood') || c.includes('poisson'))) return 'Seafood';
  if (combined.some(c => c.includes('dairy') || c.includes('lait') || c.includes('cheese'))) return 'Dairy';
  if (combined.some(c => c.includes('fruit') || c.includes('vegetable') || c.includes('produce'))) return 'Produce';
  if (combined.some(c => c.includes('spice') || c.includes('herb'))) return 'Spices';
  if (combined.some(c => c.includes('beverage') || c.includes('drink') || c.includes('boisson'))) return 'Beverages';
  return 'Pantry';
}

/**
 * GET /api/barcode/:code
 * Look up product info by barcode using Open Food Facts API
 */
router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const code = String(req.params.code).replace(/\D/g, '');
    if (!code) {
      return res.status(400).json({ error: 'Invalid barcode' });
    }

    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
      {
        timeout: 8000,
        headers: {
          'User-Agent': 'FoodForNow - https://github.com/FoodForNow - Contact: foodfornow@example.com',
        },
      }
    );

    const data = response.data;
    const product = data?.product;

    if (!product || data.status === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const name =
      product.product_name ||
      product.product_name_en ||
      product.generic_name_en ||
      product.generic_name ||
      product.abbreviated_product_name ||
      'Unknown Product';

    const category = mapCategory(product.categories, product.categories_tags);
    const { value: quantity, unit } = parseQuantity(product.quantity || product.product_quantity);

    res.json({
      productName: name.trim(),
      category: VALID_CATEGORIES.includes(category) ? category : 'Other',
      quantity,
      unit: VALID_UNITS.includes(unit) ? unit : 'piece',
      barcode: code,
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.error('Barcode lookup network error:', err.code, err.message);
      return res.status(503).json({ error: 'Unable to reach product database. Check your connection.' });
    }
    console.error('Barcode lookup error:', err.message, 'code:', req.params.code);
    res.status(500).json({ error: 'Failed to look up barcode' });
  }
});

module.exports = router;
