const bcrypt = require('bcrypt'); // Import bcrypt
const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      // Find user by username
      const user = await User.findOne({ username });

      if (!user) {
        // User not found
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Match password using bcrypt.compare
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // Password matched, return user
        return done(null, user);
      } else {
        // Password doesn't match
        return done(null, false, { message: 'Invalid username or password' });
      }
    } catch (error) {
      // Error occurred
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err);
      });
  });
};
