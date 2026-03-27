const REMEMBERED_LOGIN_KEY = 'foodfornow_remembered_login';

function getRememberedEmail(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.(REMEMBERED_LOGIN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data.email === 'string') return data.email;
  } catch (_) {}
  return null;
}

function setRememberedEmail(email, storage = globalThis?.localStorage) {
  try {
    storage?.setItem?.(REMEMBERED_LOGIN_KEY, JSON.stringify({ email }));
  } catch (_) {}
}

function clearRememberedCredentials(storage = globalThis?.localStorage) {
  try {
    storage?.removeItem?.(REMEMBERED_LOGIN_KEY);
  } catch (_) {}
}

export {
  REMEMBERED_LOGIN_KEY,
  getRememberedEmail,
  setRememberedEmail,
  clearRememberedCredentials,
};
