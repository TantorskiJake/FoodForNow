const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeNameForMatching,
  findSimilarIngredient,
  resolveRecipeIngredient,
} = require('./ingredientResolutionService');

test('normalizeNameForMatching strips size and prep descriptors', () => {
  assert.equal(
    normalizeNameForMatching('1 inch thick Fresh Chopped Swordfish Filets'),
    'swordfish filets'
  );
});

test('findSimilarIngredient returns indexed normalizedName match first', async () => {
  const calls = [];
  const Ingredient = {
    findOne: async (query) => {
      calls.push(query);
      return { _id: 'ing-indexed', name: 'Fresh Basil' };
    },
    find: async () => {
      throw new Error('legacy fallback should not run when indexed match exists');
    },
    updateOne: async () => {
      throw new Error('legacy update should not run when indexed match exists');
    },
  };

  const result = await findSimilarIngredient(Ingredient, 'user-1', 'fresh basil');
  assert.equal(result._id, 'ing-indexed');
  assert.deepEqual(calls, [{ user: 'user-1', normalizedName: 'basil' }]);
});

test('findSimilarIngredient matches legacy ingredient and backfills normalizedName', async () => {
  const updates = [];
  const legacyRows = [
    { _id: 'legacy-1', name: '1 inch thick swordfish filets' },
    { _id: 'legacy-2', name: 'bay leaves' },
  ];

  const Ingredient = {
    findOne: async () => null,
    find: (query) => {
      assert.deepEqual(query, {
        user: 'user-7',
        normalizedName: { $exists: false },
      });
      return {
        select: async (selection) => {
          assert.equal(selection, '_id name');
          return legacyRows;
        },
      };
    },
    updateOne: async (filter, update) => {
      updates.push({ filter, update });
    },
  };

  const result = await findSimilarIngredient(Ingredient, 'user-7', 'swordfish filets');
  assert.equal(result, legacyRows[0]);
  assert.deepEqual(updates, [
    {
      filter: { _id: 'legacy-1' },
      update: { normalizedName: 'swordfish filets' },
    },
  ]);
});

test('resolveRecipeIngredient reuses provided ingredient id and normalizes unit', async () => {
  const Ingredient = {
    findOne: async (query) => {
      assert.deepEqual(query, { _id: 'ing-1', user: 'user-3' });
      return { _id: 'ing-1' };
    },
  };

  const resolved = await resolveRecipeIngredient(
    Ingredient,
    'user-3',
    { ingredient: 'ing-1', quantity: '2.5', unit: 'invalid-unit' },
    ['g', 'ml', 'cup']
  );

  assert.deepEqual(resolved, {
    ingredient: 'ing-1',
    quantity: 2.5,
    unit: 'piece',
  });
});

test('resolveRecipeIngredient creates ingredient with safe category fallback', async () => {
  const savedDocs = [];

  function Ingredient(doc) {
    this._id = 'new-ing-1';
    this.name = doc.name;
    this.category = doc.category;
    this.user = doc.user;
    this.save = async () => {
      savedDocs.push({
        _id: this._id,
        name: this.name,
        category: this.category,
        user: this.user,
      });
    };
  }

  Ingredient.findOne = async () => null;
  Ingredient.find = () => ({
    select: async () => [],
  });
  Ingredient.updateOne = async () => {};

  const resolved = await resolveRecipeIngredient(
    Ingredient,
    'user-9',
    {
      name: 'Fresh Mint',
      quantity: '3',
      unit: 'tbsp',
      category: 'UnsafeCategory',
    },
    ['g', 'ml', 'cup', 'tbsp'],
    'Pantry'
  );

  assert.deepEqual(resolved, {
    ingredient: 'new-ing-1',
    quantity: 3,
    unit: 'tbsp',
  });
  assert.deepEqual(savedDocs, [
    {
      _id: 'new-ing-1',
      name: 'Fresh Mint',
      category: 'Pantry',
      user: 'user-9',
    },
  ]);
});
