/**
 * Safe for use as array index: integer in [0, length).
 * Avoids non-index keys such as "__proto__" (prototype pollution vectors).
 */
export const isSafeArrayIndex = (index, length) =>
  Number.isInteger(index) && index >= 0 && index < length;

/**
 * Returns the element at a valid array index without direct keyed lookup.
 * This avoids treating untrusted input as an object property name.
 */
export function getSafeElement(arr, index) {
  if (!Array.isArray(arr) || !isSafeArrayIndex(index, arr.length)) return null;

  let i = 0;
  for (const element of arr) {
    if (i === index) return element;
    i += 1;
  }
  return null;
}
