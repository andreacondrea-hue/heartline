// Real persistent storage for accounts + saves, replacing "progress only
// lives in one browser's localStorage." Uses Node's built-in SQLite
// (node:sqlite, available since Node 22 — currently marked experimental by
// Node itself but functionally stable for a single-file app like this)
// rather than a native addon like better-sqlite3: native addons need to
// download prebuilt binaries or compiler headers from nodejs.org at
// install time, which fails in network-restricted environments. Built-in
// SQLite needs nothing beyond Node itself, so `npm install` + `npm start`
// keeps working anywhere Node runs.
//
// Schema is intentionally small: one row per user, one row per save
// (the whole save is stored as a JSON blob, same shape the client already
// uses for localStorage — see client/src/engine/saveState.js). That's a
// deliberate scope choice: normalizing collection/affection/chat history
// into real relational tables would let the server ever query "how many
// players own card X" etc, but isn't needed yet and is a natural follow-up
// once there's a reason to query saves rather than just load/store them
// whole.
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'heartline.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saves (
    user_id INTEGER PRIMARY KEY,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

// Small idempotent migrations for columns added after the tables above
// first shipped — `ALTER TABLE ... ADD COLUMN` errors if the column
// already exists, so each is wrapped rather than guarded with an
// "IF NOT EXISTS" (SQLite doesn't support that clause for ADD COLUMN).
// `recovery_code_hash` backs the one-time-recovery-code password reset
// flow (see index.js) — bcrypt-hashed the same way passwords are, never
// stored or logged in plaintext after the moment it's issued to the
// player. `version` on `saves` (added to the CREATE TABLE above for fresh
// databases, backfilled here for ones created before it existed) is the
// optimistic-concurrency counter that lets the client detect "someone else
// saved since I last loaded" instead of silently last-write-wins clobbering
// a second device's progress — see the PUT /api/save handler in index.js.
function addColumnIfMissing(table, column, ddl) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`)
  } catch (err) {
    if (!/duplicate column name/i.test(err.message)) throw err
  }
}
addColumnIfMissing('users', 'recovery_code_hash', 'TEXT')
addColumnIfMissing('saves', 'version', 'INTEGER NOT NULL DEFAULT 1')
