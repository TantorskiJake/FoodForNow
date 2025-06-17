export function getErrorMessage(err, fallback = 'An error occurred') {
  if (err?.response?.data) {
    if (typeof err.response.data === 'string') return err.response.data;
    if (err.response.data.error) return err.response.data.error;
    if (err.response.data.message) return err.response.data.message;
  }
  if (err?.message) return err.message;
  return fallback;
}
