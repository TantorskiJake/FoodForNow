const validator = require("validator");

// Sanitize common input fields
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    // Sanitize string fields
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace and escape HTML
        req.body[key] = validator.escape(req.body[key].trim());
      }
    });

    // Normalize email if present
    if (req.body.email && typeof req.body.email === 'string') {
      req.body.email = validator.normalizeEmail(req.body.email);
    }
  }

  next();
};

module.exports = sanitizeInput;

