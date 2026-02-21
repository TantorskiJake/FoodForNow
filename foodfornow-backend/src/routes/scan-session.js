const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// In-memory store for scan sessions (sessionId -> { barcode, createdAt })
// In production, consider Redis for multi-instance deployments
const sessions = new Map();

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SUBMIT_TOKEN_TTL_SECONDS = Number(process.env.SCAN_SESSION_TOKEN_TTL_SECONDS || 5 * 60);
const SUBMIT_TOKEN_SECRET = process.env.SCAN_SESSION_TOKEN_SECRET || process.env.JWT_SECRET;

if (!SUBMIT_TOKEN_SECRET) {
  throw new Error('SCAN_SESSION_TOKEN_SECRET (or JWT_SECRET) is required for scan session security');
}

function createSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, data] of sessions.entries()) {
    if (now - data.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

function createSubmitToken(sessionId, userId) {
  return jwt.sign(
    { sessionId, userId },
    SUBMIT_TOKEN_SECRET,
    { expiresIn: `${SUBMIT_TOKEN_TTL_SECONDS}s` }
  );
}

/**
 * POST /api/scan-session
 * Create a new scan session (auth required)
 * Returns { sessionId } - used to build the QR code URL
 */
router.post('/', authMiddleware, (req, res) => {
  cleanupExpiredSessions();
  const sessionId = createSessionId();
  const userId = String(req.userId);
  const submitToken = createSubmitToken(sessionId, userId);
  sessions.set(sessionId, { barcode: null, createdAt: Date.now(), userId });
  res.json({ sessionId, submitToken, expiresIn: SUBMIT_TOKEN_TTL_SECONDS });
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
  if (String(req.userId) !== data.userId) {
    return res.status(403).json({ error: 'Session does not belong to this user' });
  }
  res.json({ barcode: data.barcode });
});

/**
 * POST /api/scan-session/:id
 * Submit barcode from phone (no auth - session ID is the secret)
 * Body: { barcode: string }
 */
router.post('/:id', (req, res) => {
  const { barcode, token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Scan token is required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, SUBMIT_TOKEN_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired scan token' });
  }

  if (decoded.sessionId !== req.params.id) {
    return res.status(403).json({ error: 'Token does not match this session' });
  }

  const data = sessions.get(req.params.id);
  if (!data) return res.status(404).json({ error: 'Session expired or not found' });
  if (Date.now() - data.createdAt > SESSION_TTL_MS) {
    sessions.delete(req.params.id);
    return res.status(404).json({ error: 'Session expired' });
  }
  if (data.userId !== decoded.userId) {
    return res.status(403).json({ error: 'Scan token mismatch' });
  }
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Barcode is required' });
  }
  data.barcode = String(barcode).trim();
  res.json({ success: true });
});

module.exports = router;
