const escapeHTML = (str) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, (m) => map[m]);
};

const normalizeEmail = (email) => email.trim().toLowerCase();

// Sanitize common input fields
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    // Sanitize string fields
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace and escape HTML
        req.body[key] = escapeHTML(req.body[key].trim());
      }
    });

    // Normalize email if present
    if (req.body.email && typeof req.body.email === 'string') {
      req.body.email = normalizeEmail(req.body.email);
    }
  }

  next();
};

module.exports = sanitizeInput;

