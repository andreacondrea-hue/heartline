# Audio sourcing

Heartline has a real audio system (`client/src/engine/audioManager.js`,
`client/src/data/audio.js`, a Settings screen) — background music that
swaps per screen (hub, battle, story/chat) plus two short one-shot
stingers (a battle win, a pack-opening reveal).

## Status: real tracks are now in place

The five files under `client/public/audio/` are the actual licensed
Pixabay Music tracks listed in the table below (downloaded via browser and
verified by duration — e.g. `hub.mp3` is 3:01, `romance.mp3` is 2:43,
matching the source pages exactly). All under Pixabay's Content License:
free for commercial/app use, no attribution required.

Earlier in development, this project's cloud sandbox only had network
access to package registries (npm, pypi, etc.) and couldn't reach
`pixabay.com` directly, so the app briefly shipped with synthesized
placeholder audio (simple numpy sine/harmonic tones) just so the audio
system was wired and testable. Those placeholders have been fully
replaced and removed from the repo — the shipped game only ships the
real tracks below.

## Track credits

| File | Used for | Real track (now shipped) |
|---|---|---|
| `hub.mp3` | Hub / menu loop | ["Cozy Home" by folk_acoustic](https://pixabay.com/music/acoustic-group-cozy-home-124581/) (3:01) |
| `battle.mp3` | Battle loop | ["Epic battle Orchestra music" by DeusLower](https://pixabay.com/music/mystery-epic-battle-orchestra-music-241006/) (1:12) |
| `romance.mp3` | Story chapters + chat loop | ["Emotional Romantic Piano Story" by RomanSenykMusic](https://pixabay.com/music/modern-classical-emotional-romantic-piano-story-123587/) (2:43) |
| `victory.mp3` | Battle-won stinger | ["Success Fanfare Trumpets"](https://pixabay.com/sound-effects/success-fanfare-trumpets-6185/) (0:04) |
| `packopen.mp3` | Pack-opening reveal chime | ["Crystal Chimes 15 sec audio" by MeditativeTiger](https://pixabay.com/music/ambient-crystal-chimes-15-sec-audio-395542/) (0:16) |

The three loop tracks (`hub.mp3`, `battle.mp3`, `romance.mp3`) are played
with `loop = true` in `audioManager.js`. `battle.mp3` is shorter (1:12)
than the other two, so it loops a bit more often — that's fine, it's
meant to feel urgent and driving during combat.

## License terms (Pixabay Content License)

Free for commercial use, no attribution required, but the audio file
itself can't be resold or redistributed standalone (bundling it inside the
game, which is what this does, is normal permitted use). Full terms:
https://pixabay.com/service/license-summary/
