// One-time account-recovery codes — the password-reset mechanism for this
// app, chosen deliberately over email-based reset: there's no email
// collected at signup (just a username + password), and adding real email
// delivery would mean signing up for a third-party email service and
// wiring in another API key, the same setup burden as ANTHROPIC_API_KEY.
// A recovery code needs no external service, works the moment the server
// is running, and is fully testable without real email delivery.
//
// Tradeoff, stated plainly: if a player loses BOTH their password and
// their recovery code, this account is unrecoverable — same as losing a
// hardware wallet seed phrase or 2FA backup codes. The client makes the
// player explicitly confirm they've saved the code before continuing past
// registration (see AuthGate.jsx) precisely because there's no email
// safety net behind it.
import crypto from 'node:crypto'

// Avoids 0/O/1/I/L — characters that are easy to mis-type or mis-read.
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRecoveryCode() {
  const groups = []
  for (let g = 0; g < 4; g++) {
    let group = ''
    for (let i = 0; i < 4; i++) {
      group += CHARSET[crypto.randomInt(CHARSET.length)]
    }
    groups.push(group)
  }
  return groups.join('-')
}

// Recovery codes are compared case-insensitively and with surrounding
// whitespace trimmed, since a player retyping "xk7p-9rtq-3fgh-2mnb" from a
// note they scribbled down shouldn't fail on case alone.
export function normalizeRecoveryCode(code) {
  return (code || '').trim().toUpperCase()
}
