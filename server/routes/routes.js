// routes.js

const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { getRecipes } = require('../controllers/dataController');
const User = require('../models/user'); // Adjust the path based on your project structure

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

passport.use(new LocalStrategy(
  async function(username, password, done) {
    try {
      const user = await User.findOne({ username: username });

      if (!user || !user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect username or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

router.route('/auth/login')
  .get((req, res) => {
    // Render your login page or return an appropriate response
    res.send('Login page');
  })
  .post(passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/auth/login',
    failureFlash: true
  }));

  router.get('/api/data', passport.authenticate('local'), asyncHandler(async (req, res) => {
    try {
      // Retrieving recipes using the getRecipes function from the dataController
      const documents = await getRecipes();
  
      // Sending the retrieved recipes as a JSON response
      res.json(documents);
    } catch (error) {
      // Handling errors by logging them and sending a 500 Internal Server Error response
      console.error('Error fetching recipes:', error);
      res.status(500).send('Internal Server Error');
    }
  }));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

module.exports = router;
