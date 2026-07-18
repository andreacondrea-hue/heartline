import { useState } from 'react'
import { registerAccount, loginAccount, resetPassword, fetchRemoteSave } from '../engine/api'

// Shown once, before character creation, to brand-new sessions that
// haven't decided yet whether they want a real account. Playing entirely
// on this device (today's behavior, no server calls at all) stays a first-
// class option — an account is an opt-in upgrade (real server-side
// database, see server/db.js), not a requirement to play.
//
// `registerOnly` renders just the "create an account" form with no skip/
// login options — used by the hub's "Back up your progress" banner, where
// logging into a *different* existing account would silently blow away
// the progress already sitting in this browser, which is a footgun this
// screen shouldn't offer from that entry point. `loginOnly` is the
// opposite case — used by the hub's "Log into an existing account" link
// (shown to a local-mode player, e.g. right after logging out) where
// registering a NEW account isn't what they're there for.
//
// Password recovery here is a one-time RECOVERY CODE, not an email link —
// see server/recoveryCode.js for why (no email is collected at all, and
// that's deliberate to avoid a whole extra external service dependency).
// That means every successful register/reset shows the code exactly once
// and makes the player affirmatively confirm they've saved it before
// continuing — there's no "resend the email" safety net behind this one.
export default function AuthGate({ registerOnly, loginOnly, onAccountReady, onSkip, onCancel }) {
  const [mode, setMode] = useState(registerOnly ? 'register' : loginOnly ? 'login' : 'choose')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  // Once a register/reset succeeds, we hold onto the pending login result
  // here and show the recovery code before actually handing control back
  // to the parent via onAccountReady.
  const [pendingReveal, setPendingReveal] = useState(null) // { token, state, version, recoveryCode }
  const [savedConfirmed, setSavedConfirmed] = useState(false)

  async function submitLoginOrRegister(action) {
    setError(null)
    if (!username.trim() || !password) {
      setError('Enter a username and password.')
      return
    }
    setBusy(true)
    try {
      if (action === 'login') {
        const { token, state, version } = await loginAccount(username.trim(), password)
        onAccountReady(token, state, version)
        return
      }
      const { token, state, version, recoveryCode } = await registerAccount(username.trim(), password)
      setPendingReveal({ token, state, version, recoveryCode })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function submitReset() {
    setError(null)
    if (!username.trim() || !recoveryCodeInput.trim() || !newPassword) {
      setError('Fill in your username, recovery code, and a new password.')
      return
    }
    setBusy(true)
    try {
      const { token, recoveryCode } = await resetPassword(username.trim(), recoveryCodeInput.trim(), newPassword)
      // reset-password doesn't hand back the save directly (it's about
      // credentials, not game state) — fetch it now with the fresh token.
      const { state, version } = await fetchRemoteSave(token)
      setPendingReveal({ token, state, version, recoveryCode })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (pendingReveal) {
    return (
      <div className="auth-gate-screen">
        <h2>Save your recovery code</h2>
        <p className="auth-gate-hint">
          If you ever forget your password, this code is the only way back
          into this account — there's no email on file to send a reset link
          to. Write it down or store it somewhere safe before continuing;
          it won't be shown again.
        </p>
        <div className="recovery-code-display">{pendingReveal.recoveryCode}</div>
        <label className="recovery-code-confirm">
          <input
            type="checkbox"
            checked={savedConfirmed}
            onChange={(e) => setSavedConfirmed(e.target.checked)}
          />
          I've saved this code somewhere safe
        </label>
        <button
          className="creation-submit"
          disabled={!savedConfirmed}
          onClick={() => onAccountReady(pendingReveal.token, pendingReveal.state, pendingReveal.version)}
        >
          Continue →
        </button>
      </div>
    )
  }

  if (mode === 'choose') {
    return (
      <div className="auth-gate-screen">
        <h2>Keep your progress anywhere</h2>
        <p className="auth-gate-hint">
          Create a free account and your cards, companions, and gold sync to a
          real server, so clearing your browser or switching phones won't lose
          your progress. Totally optional — you can also just play on this
          device with no account at all.
        </p>
        <button className="creation-submit" onClick={() => setMode('register')}>Create an account</button>
        <button onClick={() => setMode('login')}>I already have an account</button>
        <button className="vn-exit" onClick={onSkip}>Skip — play on this device only</button>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <div className="auth-gate-screen">
        <h2>Reset your password</h2>
        <p className="auth-gate-hint">
          Enter your username, your recovery code from when you registered,
          and a new password. This also issues you a fresh recovery code —
          the old one stops working.
        </p>
        <div className="creation-field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="creation-field">
          <label>Recovery code</label>
          <input
            value={recoveryCodeInput}
            onChange={(e) => setRecoveryCodeInput(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
          />
        </div>
        <div className="creation-field">
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        {error && <p className="creation-error">{error}</p>}
        <button className="creation-submit" disabled={busy} onClick={submitReset}>
          {busy ? 'Please wait…' : 'Reset password'}
        </button>
        <button className="vn-exit" onClick={() => { setMode('login'); setError(null) }}>← back</button>
      </div>
    )
  }

  return (
    <div className="auth-gate-screen">
      <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
      {registerOnly && (
        <p className="auth-gate-hint">
          This uploads your current progress on this device to your new
          account, so it's backed up going forward.
        </p>
      )}
      <div className="creation-field">
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
      </div>
      <div className="creation-field">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="creation-error">{error}</p>}
      <button className="creation-submit" disabled={busy} onClick={() => submitLoginOrRegister(mode)}>
        {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
      </button>
      {mode === 'login' && (
        <button className="auth-gate-forgot" onClick={() => { setMode('reset'); setError(null) }}>
          Forgot your password?
        </button>
      )}
      {!registerOnly && !loginOnly && (
        <button className="vn-exit" onClick={() => setMode('choose')}>← back</button>
      )}
      {(registerOnly || loginOnly) && onCancel && (
        <button className="vn-exit" onClick={onCancel}>← back</button>
      )}
    </div>
  )
}
