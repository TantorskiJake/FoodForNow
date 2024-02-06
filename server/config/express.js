const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const authRoutes = require('../routes/authRoutes');
const mainRoutes = require('../routes/routes');
const User = require('../models/user');
const mongoose = require('mongoose');

// Configure the LocalStrategy for Passport
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

// Implement serialization and deserialization logic for Passport
passport.serializeUser((user, done) => {
  // Implement serialization logic, e.g., done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Implement deserialization logic, e.g., User.findById(id, (err, user) => done(err, user));
});

const configureExpress = (app) => {
  const port = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'FoodForNow', // Specify the correct database name
  });

  mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  });

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  }));

  // Initialize Passport and use session
  app.use(passport.initialize());
  app.use(passport.session());

  // Use connect-flash for flash messages
  app.use(flash());

  // Mount your routes
  app.use(authRoutes);
  app.use(mainRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  });

  return app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

module.exports = configureExpress;
