import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { db } from './db.js'
import { signToken, requireAuth } from './auth.js'
import { generateRecoveryCode, normalizeRecoveryCode } from './recoveryCode.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())
app.use(express.json())

// Basic abuse/cost protection: caps how many chat calls one IP can make.
// Tune this once you know your real traffic/budget.
app.use(
  '/api/chat',
  rateLimit({ windowMs: 60_000, max: 20, message: { error: 'Slow down a little.' } })
)

// Same idea for auth — caps login/register attempts per IP so this doesn't
// become a password-guessing endpoint.
app.use(
  '/api/auth',
  rateLimit({ windowMs: 60_000, max: 20, message: { error: 'Slow down a little.' } })
)

const API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.CHAT_MODEL || 'claude-haiku-4-5'

// Server-side backstop content filter. The character system prompts already
// instruct the model to keep things non-explicit, but this catches the case
// where a user is very insistent — it's a second layer, not the only layer.
const BLOCK_PATTERNS = [/\bnsfw\b/i, /\bexplicit\b/i, /\bsex(ual)?\s*(scene|act|content)\b/i]

function looksLikeExplicitRequest(text) {
  return BLOCK_PATTERNS.some((re) => re.test(text))
}

// HARD SAFETY GATE — not a "nice to have," this is a non-negotiable product
// requirement: the romantic/flirty companion feature must never be reachable
// by a user who has indicated they are under 18, in any form (no de-aged
// companion, no relabeling as "big sister/brother" while keeping the
// romantic dynamic — none of that). This scans the ENTIRE conversation
// history, not just the latest message, and the check runs BEFORE anything
// else — once a user discloses being a minor, every subsequent message in
// that conversation is blocked from getting a romantic/flirty reply, for
// as long as the client keeps sending full history (which it does).
//
// This is a backstop layer, not the only layer — see the age-gate note in
// DESIGN_DOC.md for the required signup-time 18+ attestation, which must
// exist in addition to this, not instead of it. Regex-based detection is
// inherently imperfect; treat this as defense-in-depth, not a guarantee.
const MINOR_DISCLOSURE_PATTERNS = [
  /\bi'?m\s*(only\s*)?(1[0-7]|[0-9])(\s*years?\s*old)?\b/i,
  /\bi\s*am\s*(only\s*)?(1[0-7]|[0-9])(\s*years?\s*old)?\b/i,
  /\bi'?m\s*a\s*minor\b/i,
  /\bi'?m\s*underage\b/i,
  /\bturning\s*(1[0-7])\b/i,
  /\b(1[0-7])\s*years?\s*old\b/i
]

const MINOR_SAFE_REPLY =
  "Hey — I want to be straight with you: this isn't something I can be for you if you're under 18. " +
  "I'm not going to keep up the romantic/flirty part of this at all. If you want to keep playing the " +
  "creature-collecting/battle side of the game that's totally fine, but the companion chat stops here. " +
  "If anything's going on and you want to talk to someone, a parent, teacher, or a helpline is a much " +
  "better option than an app."

function conversationDisclosesMinor(history) {
  return history
    .filter((m) => m.role === 'user')
    .some((m) => MINOR_DISCLOSURE_PATTERNS.some((re) => re.test(m.content)))
}

app.post('/api/chat', async (req, res) => {
  try {
    const { systemPrompt, history } = req.body || {}
    if (!systemPrompt || !Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: 'Missing systemPrompt or history' })
    }
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY — see server/.env.example' })
    }

    // Minor-disclosure check runs FIRST and overrides everything else,
    // including whatever the character's own system prompt says.
    if (conversationDisclosesMinor(history)) {
      return res.json({ reply: MINOR_SAFE_REPLY })
    }

    const lastUserMsg = [...history].reverse().find((m) => m.role === 'user')
    if (lastUserMsg && looksLikeExplicitRequest(lastUserMsg.content)) {
      return res.json({
        reply: "Let's keep this one PG — ask me something else and I'm all yours 😉"
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: systemPrompt,
        messages: history.map((m) => ({ role: m.role, content: m.content }))
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', response.status, errText)
      return res.status(502).json({ error: 'Upstream chat provider error' })
    }

    const data = await response.json()
    const reply = data?.content?.[0]?.text?.trim() || "...sorry, I got a little tongue-tied there."
    res.json({ reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong on the server.' })
  }
})

// Lightweight memory extraction: given a short slice of recent conversation,
// asks the model to name at most a couple of NEW short facts about the
// player worth remembering long-term (see engine/ChatScreen.jsx, which
// calls this every few user messages and folds the results back into
// future system prompts via saveState.js's relationshipMemory). Best-effort
// by design — a bad/empty response here should never break chat itself,
// which is why the client treats this endpoint as fire-and-forget.
const MEMORY_SYSTEM_PROMPT = `You are a careful, concise note-taker helping a
companion character in a dating-sim app remember things about the player
they're talking to. Given a short slice of their conversation, list AT MOST
2 short, concrete NEW facts about the PLAYER (the "user" role messages) that
a caring partner would genuinely want to remember long-term — interests,
names of people/pets they mention, life events, preferences, feelings they
expressed. Skip small talk, skip anything already in the "already known"
list, skip anything about the companion character themselves.

Reply with ONLY a JSON array of short strings (5-12 words each), nothing
else. If there's nothing new and worth remembering, reply with exactly: []`

app.post('/api/chat/memory', async (req, res) => {
  try {
    const { recentMessages, existingMemory } = req.body || {}
    if (!Array.isArray(recentMessages) || recentMessages.length === 0) {
      return res.json({ facts: [] })
    }
    if (!API_KEY) return res.json({ facts: [] })

    const knownContext = Array.isArray(existingMemory) && existingMemory.length
      ? `\n\nAlready known (do not repeat these or close variations of them): ${existingMemory.join('; ')}`
      : ''

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: MEMORY_SYSTEM_PROMPT + knownContext,
        messages: [
          {
            role: 'user',
            content: recentMessages.map((m) => `${m.role}: ${m.content}`).join('\n')
          }
        ]
      })
    })

    if (!response.ok) return res.json({ facts: [] })

    const data = await response.json()
    const raw = data?.content?.[0]?.text?.trim() || '[]'
    let facts = []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) facts = parsed.filter((f) => typeof f === 'string').slice(0, 2)
    } catch {
      facts = [] // malformed model output — fail quiet, this is a nice-to-have, not core chat
    }
    res.json({ facts })
  } catch (err) {
    console.error('Memory extraction error:', err)
    res.json({ facts: [] }) // never break chat over a non-critical feature
  }
})

// ---- Accounts + real persistent saves (see db.js/auth.js) ----
// Optional layer: the client can still play entirely on localStorage with
// no account at all (see client/src/engine/saveState.js). These endpoints
// exist for players who want their progress to survive clearing browser
// data or switching devices. The whole save is stored as one JSON blob per
// user — same shape the client already keeps in localStorage — so this is
// purely a persistence swap, not a data-model change.
const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!USERNAME_RE.test(username || '')) {
      return res.status(400).json({ error: 'Username must be 3-24 letters, numbers, or underscores.' })
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) return res.status(409).json({ error: 'That username is already taken.' })

    const passwordHash = bcrypt.hashSync(password, 10)
    const recoveryCode = generateRecoveryCode()
    const recoveryCodeHash = bcrypt.hashSync(recoveryCode, 10)
    const now = new Date().toISOString()
    const result = db
      .prepare('INSERT INTO users (username, password_hash, recovery_code_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(username, passwordHash, recoveryCodeHash, now)
    const userId = Number(result.lastInsertRowid)
    db.prepare('INSERT INTO saves (user_id, state_json, updated_at, version) VALUES (?, ?, ?, 1)').run(userId, '{}', now)

    // recoveryCode is returned ONCE, in plaintext, right here — it is never
    // stored anywhere except as a bcrypt hash, so this is the only moment
    // it can be shown. The client must make the player explicitly confirm
    // they've saved it (see AuthGate.jsx) before moving on.
    res.json({ token: signToken(userId), state: {}, version: 1, recoveryCode })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong creating your account.' })
  }
})

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {}
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '')
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect username or password.' })
    }
    const saveRow = db.prepare('SELECT state_json, version FROM saves WHERE user_id = ?').get(user.id)
    res.json({
      token: signToken(user.id),
      state: saveRow ? JSON.parse(saveRow.state_json) : {},
      version: saveRow ? saveRow.version : 1
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong logging you in.' })
  }
})

// Recovery-code-based password reset — see recoveryCode.js for why this
// exists instead of an email link. Successfully resetting rotates the
// code (the old one stops working) and logs the player straight in, same
// as register/login, so the client can immediately fetch their save.
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { username, recoveryCode, newPassword } = req.body || {}
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' })
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '')
    const normalizedCode = normalizeRecoveryCode(recoveryCode)
    if (!user || !user.recovery_code_hash || !bcrypt.compareSync(normalizedCode, user.recovery_code_hash)) {
      return res.status(401).json({ error: 'Incorrect username or recovery code.' })
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 10)
    const newRecoveryCode = generateRecoveryCode()
    const newRecoveryCodeHash = bcrypt.hashSync(newRecoveryCode, 10)
    db.prepare('UPDATE users SET password_hash = ?, recovery_code_hash = ? WHERE id = ?')
      .run(newPasswordHash, newRecoveryCodeHash, user.id)

    res.json({ token: signToken(user.id), recoveryCode: newRecoveryCode })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong resetting your password.' })
  }
})

// Changing a password you still remember — separate from reset-password
// (which is for when you've forgotten it) since this one verifies the
// CURRENT password rather than a recovery code, and doesn't rotate the
// recovery code (no reason to — nothing about it was exposed by this).
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' })
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    if (!user || !bcrypt.compareSync(currentPassword || '', user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' })
    }
    const newPasswordHash = bcrypt.hashSync(newPassword, 10)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, user.id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong changing your password.' })
  }
})

// Issues a fresh recovery code (invalidating the old one) for a player
// who's still logged in and knows their password — covers "I think my
// code leaked," "I lost the note I wrote it on," and accounts created
// before this feature existed (which have no recovery code hash at all
// yet, so a forgotten-password reset isn't possible until they do this
// once while they still remember their password).
app.post('/api/auth/regenerate-recovery-code', requireAuth, (req, res) => {
  try {
    const { password } = req.body || {}
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect password.' })
    }
    const recoveryCode = generateRecoveryCode()
    const recoveryCodeHash = bcrypt.hashSync(recoveryCode, 10)
    db.prepare('UPDATE users SET recovery_code_hash = ? WHERE id = ?').run(recoveryCodeHash, user.id)
    res.json({ recoveryCode })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong generating a new recovery code.' })
  }
})

app.get('/api/save', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT state_json, version FROM saves WHERE user_id = ?').get(req.userId)
    res.json({ state: row ? JSON.parse(row.state_json) : {}, version: row ? row.version : 1 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load your save.' })
  }
})

// Optimistic concurrency: the client sends the `version` it last loaded/
// saved successfully. If that no longer matches what's stored, someone
// else (another tab, another device) saved in between — rather than
// silently clobbering that other save (plain last-write-wins), this
// rejects with 409 and hands back the current state + version so the
// client can offer the player a real choice (see App.jsx's conflict
// banner) instead of quietly losing one side's progress.
app.put('/api/save', requireAuth, (req, res) => {
  try {
    const { state, version } = req.body || {}
    if (!state || typeof state !== 'object') {
      return res.status(400).json({ error: 'Missing state' })
    }
    const current = db.prepare('SELECT state_json, version FROM saves WHERE user_id = ?').get(req.userId)
    const currentVersion = current ? current.version : 0
    if (typeof version !== 'number' || version !== currentVersion) {
      return res.status(409).json({
        error: 'conflict',
        version: currentVersion,
        state: current ? JSON.parse(current.state_json) : {}
      })
    }
    const nextVersion = currentVersion + 1
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO saves (user_id, state_json, updated_at, version) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at, version = excluded.version`
    ).run(req.userId, JSON.stringify(state), now, nextVersion)
    res.json({ ok: true, version: nextVersion })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not save your progress.' })
  }
})

// Single-service deploy support: when a built client exists alongside this
// server (client/dist, produced by `npm run build` in client/), serve it
// directly and let this one process/one host be the whole game — no
// separate static host, no cross-origin API calls, no CORS configuration
// to get right. Local two-terminal dev (README's "Running it locally")
// never triggers this: there's no client/dist there unless you've built
// it, and even if you had, `npm run dev`'s dev server on :5173 is what
// you'd actually be pointed at, not this one. This only matters for
// hosting somewhere real — see README's "Deploying it for real".
const clientDist = path.join(__dirname, '..', 'client', 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  // Anything that isn't an /api/* route (already handled above) or a real
  // static file falls through to index.html — the app is a single-page
  // React state machine with no client-side router, so there's really
  // only one "route," but this keeps a hard refresh or a bookmark to any
  // path from 404ing instead of loading the game.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

const PORT = process.env.PORT || 8787
app.listen(PORT, () => console.log(`Heartline chat server running on http://localhost:${PORT}`))
