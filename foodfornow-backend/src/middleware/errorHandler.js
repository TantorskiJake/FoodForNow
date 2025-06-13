module.exports = (err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace
  const statusCode = err.status || 500;
  const message = err.message || "Something went wrong. Please try again later.";
  res.status(statusCode).json({ error: message });
};
  