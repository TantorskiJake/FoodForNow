const express = require('express');
const session = require('express-session');
const passport = require('passport');
const configureExpress = require('./config/express');

// Import Passport configuration
require('./config/passport')(passport);

const app = express();

// Session middleware
app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Other configurations and middleware
configureExpress(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
