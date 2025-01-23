const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Retrieve the token from the Authorization header
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach the decoded token (user ID) to the request
    next(); // Proceed to the next middleware or route
  } catch (err) {
    res.status(400).json({ error: "Invalid token." });
  }
};
