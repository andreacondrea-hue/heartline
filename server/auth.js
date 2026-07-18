// Small JWT-based session layer. A logged-in client gets a signed token
// (no server-side session table to manage/expire) and sends it back as
// `Authorization: Bearer <token>` on every save-related request.
import jwt from 'jsonwebtoken'

// A real deployment MUST set a real JWT_SECRET in server/.env — this
// fallback only exists so local dev works out of the box without one, the
// same tradeoff the app already makes for ANTHROPIC_API_KEY being required
// but everything else having a working default.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-.env'

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '180d' })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing auth token' })
  try {
    req.userId = jwt.verify(token, JWT_SECRET).userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session — please log in again' })
  }
}
