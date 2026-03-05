export function evaluatePasswordStrength(password = '') {
  const pwd = String(password);
  return {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };
}

export function meetsBackendPasswordPolicy(password = '') {
  const checks = evaluatePasswordStrength(password);
  return Object.values(checks).every(Boolean);
}
