// Thin fetch wrapper for the account/save endpoints (server/index.js).
// Uses relative '/api/...' paths, same pattern as ChatScreen.jsx's
// '/api/chat' call — Vite's dev/preview proxy forwards these to the
// backend locally (see vite.config.js), and in a real deployment the
// client is served from behind the same host/proxy as the API (see
// README.md's deploy notes).
async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // A 409 save conflict carries `{ version, state }` the caller needs to
    // resolve the conflict (see App.jsx) — attach the parsed body and
    // status to the error rather than just a message string, so callers
    // can branch on `err.status === 409` without re-parsing anything.
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export function registerAccount(username, password) {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export function loginAccount(username, password) {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export function resetPassword(username, recoveryCode, newPassword) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ username, recoveryCode, newPassword })
  })
}

export function changePassword(token, currentPassword, newPassword) {
  return request('/api/auth/change-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword })
  })
}

export function regenerateRecoveryCode(token, password) {
  return request('/api/auth/regenerate-recovery-code', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ password })
  })
}

export function fetchRemoteSave(token) {
  return request('/api/save', { headers: { authorization: `Bearer ${token}` } })
}

export function pushRemoteSave(token, state, version) {
  return request('/api/save', {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ state, version })
  })
}
