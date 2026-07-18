// Volume/mute controls for the audio system (engine/audioManager.js). This
// screen only became worth building once there was actual audio to toggle —
// see COMPETITIVE_ANALYSIS.md §6 #7, previously deprioritized for exactly
// that reason.
export default function Settings({ audioSettings, onChange, onExit }) {
  const { musicVolume, sfxVolume, muted } = audioSettings

  return (
    <div className="settings-screen">
      <h2>Settings</h2>

      <div className="settings-section">
        <label className="settings-row">
          <span>Music volume</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(musicVolume * 100)}
            onChange={(e) => onChange({ musicVolume: Number(e.target.value) / 100 })}
          />
        </label>
        <label className="settings-row">
          <span>Sound effects volume</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(sfxVolume * 100)}
            onChange={(e) => onChange({ sfxVolume: Number(e.target.value) / 100 })}
          />
        </label>
        <label className="settings-row settings-row-checkbox">
          <span>Mute all audio</span>
          <input
            type="checkbox"
            checked={muted}
            onChange={(e) => onChange({ muted: e.target.checked })}
          />
        </label>
      </div>

      <p className="settings-hint">
        The hub, battles, and story/chat scenes each have their own background
        theme, plus a couple of short stingers (a card-pack reveal, a battle
        win). See AUDIO_SOURCING.md if you'd like to swap in different tracks.
      </p>

      <button className="vn-exit" onClick={onExit}>← back</button>
    </div>
  )
}
