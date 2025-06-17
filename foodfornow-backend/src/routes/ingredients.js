const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Ingredient = require('../models/ingredient');
const IngredientChangeRequest = require('../models/ingredientChangeRequest');
const Recipe = require('../models/recipe');

// Get all ingredients
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching all ingredients');
    const ingredients = await Ingredient.find({ archived: false }).sort({ name: 1 });
    const owned = ingredients.filter(i => i.createdBy.toString() === req.userId.toString());
    const global = ingredients.filter(i => i.createdBy.toString() !== req.userId.toString());
    res.json({ owned, global });
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ message: 'Error fetching ingredients' });
  }
});

// Add new ingredient
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Adding new ingredient:', { ...req.body, createdBy: req.userId });
    const ingredient = new Ingredient({
      ...req.body,
      createdBy: req.userId,
    });
    await ingredient.save();
    res.status(201).json(ingredient);
  } catch (err) {
    console.error('Error adding ingredient:', err);
    res.status(500).json({ message: 'Error adding ingredient' });
  }
});

// Update ingredient
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Updating ingredient:', { id: req.params.id, ...req.body });
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    if (ingredient.createdBy.toString() !== req.userId.toString()) {
      if (ingredient.archived) {
        return res.status(409).json({ message: 'Archived ingredient. Claim to modify', requiresClaim: true });
      }
      const changeRequest = new IngredientChangeRequest({
        ingredient: ingredient._id,
        requestedBy: req.userId,
        proposedChanges: req.body,
      });
      await changeRequest.save();
      return res.status(202).json({ message: 'Change request submitted' });
    }

    Object.assign(ingredient, req.body);
    await ingredient.save();
    res.json(ingredient);
  } catch (err) {
    console.error('Error updating ingredient:', err);
    res.status(500).json({ message: 'Error updating ingredient' });
  }
});

// Delete ingredient
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Deleting ingredient:', req.params.id);
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    if (ingredient.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete this ingredient' });
    }
    const recipeCount = await Recipe.countDocuments({ 'ingredients.ingredient': ingredient._id });

    if (recipeCount > 0) {
      ingredient.archived = true;
      await ingredient.save();
      return res.json({ message: 'Ingredient archived because it is used in recipes' });
    }

    await ingredient.deleteOne();
    res.json({ message: 'Ingredient deleted' });
  } catch (err) {
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ message: 'Error deleting ingredient' });
  }
});

// Claim an archived ingredient
router.post('/:id/claim', authMiddleware, async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient || !ingredient.archived) {
      return res.status(404).json({ message: 'Archived ingredient not found' });
    }
    ingredient.archived = false;
    ingredient.createdBy = req.userId;
    await ingredient.save();
    res.json({ message: 'Ingredient claimed', ingredient });
  } catch (err) {
    console.error('Error claiming ingredient:', err);
    res.status(500).json({ message: 'Error claiming ingredient' });
  }
});

// Get pending change requests for ingredients created by the current user
router.get('/change-requests', authMiddleware, async (req, res) => {
  try {
    const requests = await IngredientChangeRequest.find({ status: 'pending' })
      .populate('ingredient');

    const filtered = requests.filter(r => r.ingredient.createdBy.toString() === req.userId.toString());
    res.json(filtered);
  } catch (err) {
    console.error('Error fetching change requests:', err);
    res.status(500).json({ message: 'Error fetching change requests' });
  }
});

// Approve a change request
router.post('/change-requests/:id/approve', authMiddleware, async (req, res) => {
  try {
    const request = await IngredientChangeRequest.findById(req.params.id).populate('ingredient');
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ message: 'Change request not found' });
    }
    if (request.ingredient.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }
    Object.assign(request.ingredient, request.proposedChanges);
    await request.ingredient.save();
    request.status = 'approved';
    await request.save();
    res.json({ message: 'Change request approved' });
  } catch (err) {
    console.error('Error approving change request:', err);
    res.status(500).json({ message: 'Error approving change request' });
  }
});

// Deny a change request
router.post('/change-requests/:id/deny', authMiddleware, async (req, res) => {
  try {
    const request = await IngredientChangeRequest.findById(req.params.id).populate('ingredient');
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ message: 'Change request not found' });
    }
    if (request.ingredient.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to deny this request' });
    }
    request.status = 'denied';
    await request.save();
    res.json({ message: 'Change request denied' });
  } catch (err) {
    console.error('Error denying change request:', err);
    res.status(500).json({ message: 'Error denying change request' });
  }
});

module.exports = router; 