// server/config/express.js

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const { mongoURI } = require('./config');

// Import routes
const authRoutes = require('../routes/authRoutes');
const recipeRoutes = require('../routes/recipeRoutes');

const configureExpress = (app) => {
  // Connect to MongoDB
  mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

  // Middleware
  app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'jake',
    resave: false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use('/api', authRoutes);
  app.use('/api', recipeRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
};

module.exports = configureExpress;
