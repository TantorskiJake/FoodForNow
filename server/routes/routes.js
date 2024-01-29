// routes.js

const express = require('express');
const { getRecipes } = require('../controllers/dataController');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Use the getRecipes function from the dataController to fetch data from MongoDB
    const documents = await getRecipes();
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = { routes: router };
