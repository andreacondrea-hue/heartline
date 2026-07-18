// Static layout of the explorable world: where each building/landmark sits,
// what it looks like (color, radius), and what happens when the player
// walks up to it. Keeping this as plain data (rather than baking positions
// into WorldScene.js) means adding/moving a landmark is a one-line change,
// and App.jsx can decide what each `action` actually does without this
// file needing to know about screens, save state, or React at all.
//
// Coordinate system: +X east, +Z south (Three.js default right-handed,
// looking down -Z initially), world units are roughly meters. Player
// starts at the town well (0, 2) facing north into the square.

export const WORLD_BOUNDS = { minX: -60, maxX: 60, minZ: -70, maxZ: 40 }

// Companion landmarks depend on which companion the player recruited —
// each of the four cast members gets a distinct spot matching their
// tagline (Ava/Kai live in town, Wren is out in the forest, Sable trains
// at the crossroads) so the world placement always matches the flavor
// text in data/characters.js.
export const COMPANION_SPOTS = {
  ava: { x: -14, z: -10, label: "Ava's Bookshop", color: '#e58ab5' },
  kai: { x: 14, z: -8, label: 'The Street Corner', color: '#7fa8e0' },
  wren: { x: 6, z: -52, label: "Wren's Camp", color: '#9fc46b' },
  sable: { x: -30, z: 10, label: 'The Training Yard', color: '#e0a24a' }
}

// Landmarks that exist regardless of which companion you picked.
export const FIXED_ZONES = [
  { id: 'market', x: 18, z: 6, label: 'Market Stall', color: '#e0c34a', radius: 3.2, action: 'packs' },
  { id: 'home', x: -4, z: 14, label: 'Your Cottage', color: '#c98a4a', radius: 3.2, action: 'collection' },
  { id: 'forestTrail', x: 0, z: -40, label: 'Forest Trail', color: '#4a8f5c', radius: 3.6, action: 'partySelect' },
  { id: 'inn', x: -32, z: -18, label: 'Crossroads Inn', color: '#b06a9a', radius: 3.2, action: 'humanRecruit' }
]

export function companionZone(companionId) {
  if (!companionId || !COMPANION_SPOTS[companionId]) return null
  const spot = COMPANION_SPOTS[companionId]
  return { id: 'companion', x: spot.x, z: spot.z, label: spot.label, color: spot.color, radius: 3.4, action: 'companion' }
}

export function allZones(companionId) {
  const zones = [...FIXED_ZONES]
  const cz = companionZone(companionId)
  if (cz) zones.push(cz)
  return zones
}
