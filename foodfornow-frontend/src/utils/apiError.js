export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  const payload = error?.response?.data;
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return fallback;
};
