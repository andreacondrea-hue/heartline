import { useState } from 'react'
import { changePassword, regenerateRecoveryCode } from '../engine/api'

// Reachable from the hub only while logged into a real account. Covers
// the two things a player might need without having lost anything: change
// a password they still remember, or get a fresh recovery code (e.g. they
// think the old one leaked, or they registered before recovery codes
// existed and have none on file yet — see server/recoveryCode.js).
// "Log out" clears the token locally only; the server never signs a token
// out early, it just expires as configured in server/auth.js.
export default function AccountSettings({ token, onLogout, onExit }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState(null) // { type: 'ok'|'error', text }
  const [passwordBusy, setPasswordBusy] = useState(false)

  const [regenPassword, setRegenPassword] = useState('')
  const [newRecoveryCode, setNewRecoveryCode] = useState(null)
  const [recoveryError, setRecoveryError] = useState(null)
  const [recoveryBusy, setRecoveryBusy] = useState(false)
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false)

  async function submitChangePassword() {
    setPasswordStatus(null)
    if (!currentPassword || !newPassword) {
      setPasswordStatus({ type: 'error', text: 'Fill in both fields.' })
      return
    }
    setPasswordBusy(true)
    try {
      await changePassword(token, currentPassword, newPassword)
      setPasswordStatus({ type: 'ok', text: 'Password changed.' })
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordStatus({ type: 'error', text: err.message || 'Something went wrong.' })
    } finally {
      setPasswordBusy(false)
    }
  }

  async function submitRegenerateCode() {
    setRecoveryError(null)
    if (!regenPassword) {
      setRecoveryError('Enter your password to confirm.')
      return
    }
    setRecoveryBusy(true)
    try {
      const { recoveryCode } = await regenerateRecoveryCode(token, regenPassword)
      setNewRecoveryCode(recoveryCode)
      setRecoveryConfirmed(false)
      setRegenPassword('')
    } catch (err) {
      setRecoveryError(err.message || 'Something went wrong.')
    } finally {
      setRecoveryBusy(false)
    }
  }

  if (newRecoveryCode) {
    return (
      <div className="auth-gate-screen">
        <h2>Your new recovery code</h2>
        <p className="auth-gate-hint">
          Your old recovery code no longer works. Save this one somewhere
          safe — it won't be shown again.
        </p>
        <div className="recovery-code-display">{newRecoveryCode}</div>
        <label className="recovery-code-confirm">
          <input
            type="checkbox"
            checked={recoveryConfirmed}
            onChange={(e) => setRecoveryConfirmed(e.target.checked)}
          />
          I've saved this code somewhere safe
        </label>
        <button
          className="creation-submit"
          disabled={!recoveryConfirmed}
          onClick={() => setNewRecoveryCode(null)}
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="account-settings-screen">
      <h2>Account</h2>

      <div className="account-settings-section">
        <h3>Change password</h3>
        <div className="creation-field">
          <label>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="creation-field">
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        {passwordStatus && (
          <p className={passwordStatus.type === 'error' ? 'creation-error' : 'account-settings-ok'}>
            {passwordStatus.text}
          </p>
        )}
        <button disabled={passwordBusy} onClick={submitChangePassword}>
          {passwordBusy ? 'Please wait…' : 'Change password'}
        </button>
      </div>

      <div className="account-settings-section">
        <h3>Recovery code</h3>
        <p className="auth-gate-hint">
          Get a new one-time recovery code (invalidates your old one) — use
          this if you think your old code leaked, lost it, or made this
          account before recovery codes existed.
        </p>
        <div className="creation-field">
          <label>Confirm your password</label>
          <input type="password" value={regenPassword} onChange={(e) => setRegenPassword(e.target.value)} />
        </div>
        {recoveryError && <p className="creation-error">{recoveryError}</p>}
        <button disabled={recoveryBusy} onClick={submitRegenerateCode}>
          {recoveryBusy ? 'Please wait…' : 'Get a new recovery code'}
        </button>
      </div>

      <div className="account-settings-section">
        <button className="account-settings-logout" onClick={onLogout}>Log out on this device</button>
      </div>

      <button className="vn-exit" onClick={onExit}>← back</button>
    </div>
  )
}
