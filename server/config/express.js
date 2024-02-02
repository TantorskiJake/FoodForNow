// config/express.js

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const router = require('../routes/routes');
const User = require('../models/user');

// Configure Passport
passport.use(new LocalStrategy(
  async function(username, password, done) {
    try {
      // Find the user in the database
      const user = await User.findOne({ username: username });

      // If user not found or password is incorrect
      if (!user || !user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect username or password' });
      }

      // If user and password are correct
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

const configureExpress = (app) => {
  const port = process.env.PORT || 8080;

  app.use(cors());
  app.use(express.json());
  
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(flash());

  app.use(router);

  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  });

  return app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

module.exports = configureExpress;
