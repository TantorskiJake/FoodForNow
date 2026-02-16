import api from './api';

/**
 * Extract numeric barcode from scanned value (handles URLs, QR codes, raw barcodes)
 */
export function extractBarcode(value) {
  const code = String(value || '').replace(/\D/g, '');
  return code || null;
}

/**
 * Look up product info by barcode using Open Food Facts (via backend proxy)
 * @param {string} barcode - The scanned barcode (UPC/EAN) or URL containing barcode
 * @returns {Promise<{productName: string, category: string, quantity: number, unit: string, barcode: string}>}
 */
export async function lookupBarcode(barcode) {
  const code = extractBarcode(barcode);
  if (!code) throw new Error('Invalid barcode');
  const { data } = await api.get(`/barcode/${code}`);
  return data;
}
