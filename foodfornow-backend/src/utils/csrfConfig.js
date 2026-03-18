const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function parseAllowedOrigins(corsOrigin, defaultOrigins = DEFAULT_ORIGINS) {
  if (!corsOrigin) {
    return [...defaultOrigins];
  }

  return corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function shouldBypassCsrfForRequest({ isDev, origin, allowedOrigins }) {
  if (!isDev || !origin) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

module.exports = {
  DEFAULT_ORIGINS,
  parseAllowedOrigins,
  shouldBypassCsrfForRequest,
};
