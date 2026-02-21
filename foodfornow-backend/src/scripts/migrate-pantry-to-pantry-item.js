/**
 * Migration: Pantry (single doc per user with items[]) -> PantryItem (one doc per item)
 *
 * Run once after deploying the new PantryItem model. Copies all existing
 * pantry items into the PantryItem collection and then removes old Pantry docs.
 *
 * Usage: node src/scripts/migrate-pantry-to-pantry-item.js
 */

const mongoose = require('mongoose');
const Pantry = require('../models/pantry');
const PantryItem = require('../models/pantry-item');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodfornow';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const pantries = await Pantry.find({}).lean();
  console.log(`Found ${pantries.length} Pantry document(s)`);

  let itemCount = 0;
  for (const pantry of pantries) {
    const items = pantry.items || [];
    if (!pantry.user) continue;
    for (const item of items) {
      if (!item.ingredient) continue;
      await PantryItem.findOneAndUpdate(
        {
          user: pantry.user,
          ingredient: item.ingredient,
          unit: item.unit
        },
        {
          $inc: { quantity: item.quantity || 0 },
          ...(item.expiryDate ? { $set: { expiryDate: item.expiryDate } } : {})
        },
        { upsert: true, new: true }
      );
      itemCount++;
    }
  }

  const deleteResult = await Pantry.deleteMany({});
  console.log(`Migrated ${itemCount} pantry item(s) into PantryItem collection. Deleted ${deleteResult.deletedCount} old Pantry document(s).`);
  await mongoose.disconnect();
  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
