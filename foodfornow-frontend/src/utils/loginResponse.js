const DEFAULT_LOGIN_ERROR_MESSAGE = 'Login failed. Please try again.';

export function getValidLoginUser(payload) {
  const user = payload?.user ?? payload;
  if (user?.id || user?._id) return user;
  return null;
}

export function getLoginErrorMessage(error) {
  return error?.response?.data?.error || error?.message || DEFAULT_LOGIN_ERROR_MESSAGE;
}
