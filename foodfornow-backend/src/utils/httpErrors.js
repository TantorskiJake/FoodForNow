function errorPayload(message, extras = {}) {
  return {
    error: message,
    message,
    ...extras,
  };
}

module.exports = {
  errorPayload,
};
