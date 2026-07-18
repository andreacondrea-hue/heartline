// Tiny background-music + one-shot SFX manager. Kept as a plain
// module-level singleton rather than a React hook/context — playback is
// genuinely global browser state (there's only ever one <audio> element
// worth of "current music"), so components just call these functions
// directly rather than needing music state threaded through props. See
// App.jsx for the effect that picks the right track per screen, and
// data/audio.js for the track manifest.
import { MUSIC_TRACKS, SFX_TRACKS } from '../data/audio'

let musicEl = null
let currentMusicKey = null
let musicVolume = 0.5
let sfxVolume = 0.7
let muted = false

function ensureMusicEl() {
  if (!musicEl) {
    musicEl = new Audio()
    musicEl.loop = true
  }
  return musicEl
}

// Swaps the looping background track. A no-op if the requested track is
// already playing, so callers (App.jsx's per-screen effect) can call this
// on every render without it restarting the music from the top each time.
export function playMusic(key) {
  if (key === currentMusicKey) return
  const track = MUSIC_TRACKS[key]
  const el = ensureMusicEl()
  currentMusicKey = key
  if (!track) {
    el.pause()
    return
  }
  el.src = track.src
  el.volume = muted ? 0 : musicVolume
  // Browsers block autoplay until the page has had a user gesture — that's
  // normal, expected policy, not a bug here. Every screen change in this
  // app is itself triggered by a click, so playback catches up on the very
  // next one; swallowing the rejected promise just avoids a console error
  // on the very first automatic call (e.g. the initial hub track) before
  // any click has happened yet.
  el.play().catch(() => {})
}

export function stopMusic() {
  if (musicEl) musicEl.pause()
  currentMusicKey = null
}

// One-shot sound effect — a fresh Audio() per call (rather than reusing one
// element) so overlapping triggers (e.g. two quick pack opens) don't cut
// each other off.
export function playSfx(key) {
  if (muted) return
  const track = SFX_TRACKS[key]
  if (!track) return
  const el = new Audio(track.src)
  el.volume = sfxVolume
  el.play().catch(() => {})
}

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v))
  if (musicEl) musicEl.volume = muted ? 0 : musicVolume
}

export function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v))
}

export function setMuted(next) {
  muted = next
  if (musicEl) musicEl.volume = muted ? 0 : musicVolume
}
