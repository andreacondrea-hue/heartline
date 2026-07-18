// Tiny localStorage-backed durability layer for one outstanding save push.
//
// Without this, a push that fails because the player is offline (phone
// loses signal, laptop sleeps mid-flight, wifi drops) just sets
// syncStatus to 'error' and waits for the *next* local change before
// trying again — if the player closes the tab first, that write is gone
// for good and the server is left holding stale progress. This module
// persists the one pending write (the save body + the server version it
// was based on) so App.jsx can:
//   1. retry it with backoff while the tab stays open,
//   2. retry it immediately on the browser's 'online' event, and
//   3. find it again after a reload/crash, BEFORE trusting a fresh
//      fetchRemoteSave() — otherwise the mount-time fetch would silently
//      overwrite the unsynced local progress with the older server copy.
const KEY = 'heartline_pending_push_v1'

export function savePendingPush(pending) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pending))
  } catch {
    // Storage unavailable (private browsing quota, etc.) — best effort
    // only; the in-memory retry loop still covers the current tab session.
  }
}

export function loadPendingPush() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearPendingPush() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
