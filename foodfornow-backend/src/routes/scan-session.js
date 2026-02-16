const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');

// In-memory store for scan sessions (sessionId -> { barcode, createdAt })
// In production, consider Redis for multi-instance deployments
const sessions = new Map();

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

function createSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, data] of sessions.entries()) {
    if (now - data.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

/**
 * POST /api/scan-session
 * Create a new scan session (auth required)
 * Returns { sessionId } - used to build the QR code URL
 */
router.post('/', authMiddleware, (req, res) => {
  cleanupExpiredSessions();
  const sessionId = createSessionId();
  sessions.set(sessionId, { barcode: null, createdAt: Date.now() });
  res.json({ sessionId });
});

/**
 * GET /api/scan-session/:id
 * Poll for barcode from phone (auth required - session is tied to user)
 * Returns { barcode } when phone has submitted, or { barcode: null } if not yet
 */
router.get('/:id', authMiddleware, (req, res) => {
  const data = sessions.get(req.params.id);
  if (!data) return res.status(404).json({ error: 'Session expired or not found' });
  if (Date.now() - data.createdAt > SESSION_TTL_MS) {
    sessions.delete(req.params.id);
    return res.status(404).json({ error: 'Session expired' });
  }
  res.json({ barcode: data.barcode });
});

/**
 * POST /api/scan-session/:id
 * Submit barcode from phone (no auth - session ID is the secret)
 * Body: { barcode: string }
 */
router.post('/:id', (req, res) => {
  const { barcode } = req.body || {};
  const data = sessions.get(req.params.id);
  if (!data) return res.status(404).json({ error: 'Session expired or not found' });
  if (Date.now() - data.createdAt > SESSION_TTL_MS) {
    sessions.delete(req.params.id);
    return res.status(404).json({ error: 'Session expired' });
  }
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Barcode is required' });
  }
  data.barcode = String(barcode).trim();
  res.json({ success: true });
});

module.exports = router;
