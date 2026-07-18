// Audio manifest — see AUDIO_SOURCING.md for the full story on where these
// files came from. Short version: this sandbox's network access is
// restricted to package registries (no general web access), so the actual
// licensed tracks found on Pixabay Music couldn't be downloaded directly
// into the project. Every file below is instead an original, procedurally
// synthesized placeholder (plain sine/harmonic synthesis via numpy, no
// samples or copyrighted material involved) — it makes the app not-silent
// today with zero licensing risk, and AUDIO_SOURCING.md lists the exact
// real Pixabay track to drop in for each one when you have normal internet
// access (same filename, same folder — nothing else needs to change).

export const MUSIC_TRACKS = {
  hub: { src: '/audio/hub.mp3', label: 'Hub theme' },
  battle: { src: '/audio/battle.mp3', label: 'Battle theme' },
  romance: { src: '/audio/romance.mp3', label: 'Story & chat theme' }
}

export const SFX_TRACKS = {
  victory: { src: '/audio/victory.mp3', label: 'Victory stinger' },
  packopen: { src: '/audio/packopen.mp3', label: 'Pack-opening chime' }
}
