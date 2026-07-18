import * as THREE from 'three'
import { WORLD_BOUNDS } from './zones'

// Trees and buildings are real flat-illustrated art on camera-facing
// billboards (see public/world/*.png) rather than procedural cone/box
// geometry — the low-poly placeholders read as "a cone" and "a colored
// square" up close, which is exactly what got called out. Each billboard
// is a plane sized to its source image's aspect ratio, anchored at ground
// level, with its Y-rotation updated every frame by the caller (see
// World.jsx's tick loop) so it always faces the camera around the
// vertical axis — classic sprite-in-3D "cylindrical billboarding," which
// keeps trees upright even as the player looks up/down.
const TREE_TEXTURES = [
  { url: '/world/tree_green.png', aspect: 270 / 480 },
  { url: '/world/tree_autumn.png', aspect: 244 / 480 },
  { url: '/world/tree_pine.png', aspect: 230 / 480 }
]
const HOUSE_TEXTURES = {
  cottage: { url: '/world/house_cottage.png', aspect: 220 / 260 },
  cabin: { url: '/world/house_cabin.png', aspect: 220 / 250 },
  tower: { url: '/world/house_tower.png', aspect: 200 / 320 }
}
// Decorative townsfolk — generic flat-illustrated villagers (not the
// dateable cast, who already have their own portraits elsewhere) just to
// make the square feel lived-in instead of empty.
const NPC_TEXTURES = [
  { url: '/world/npc_blue.png', aspect: 160 / 380 },
  { url: '/world/npc_apron.png', aspect: 160 / 380 },
  { url: '/world/npc_scarf.png', aspect: 160 / 380 }
]

const textureCache = new Map()
function loadTexture(url, repeat) {
  const cacheKey = repeat ? `${url}|${repeat[0]}x${repeat[1]}` : url
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)
  const tex = new THREE.TextureLoader().load(url)
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(repeat[0], repeat[1])
  }
  textureCache.set(cacheKey, tex)
  return tex
}

// Builds one upright billboard plane for a piece of foliage/architecture/
// character art: `height` is the world-space height in units, width
// follows the source image's aspect ratio, and the plane's local origin
// is its base so `group.position.y` can stay 0 (ground level) rather than
// needing a half-height offset at every call site.
function makeBillboard({ url, aspect }, height) {
  const width = height * aspect
  const tex = loadTexture(url)
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35 })
  )
  mesh.position.y = height / 2
  const group = new THREE.Group()
  group.add(mesh)
  return group
}

// A soft dark ellipse decal flat on the ground under a billboard. This is
// a classic cheap "grounding" trick for billboarded sprites — real shadow
// mapping would cast the *plane's* silhouette, which would rotate with
// the billboard as the player walks around it (a tree's shadow spinning
// to always face you reads as very wrong). A static blob avoids that
// entirely and still sells "this thing is standing on the ground."
let shadowTex = null
function makeShadowBlob(width, depth) {
  if (!shadowTex) shadowTex = loadTexture('/world/shadow_blob.png')
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.02
  return mesh
}

// Builds the static Three.js scene: ground, a lantern-lit town square, a
// road cutting south through a field, and a forest of scattered trees.
// Pure Three.js (no React) so it's easy to unit-reason-about and cheap to
// rebuild if the layout ever needs to change. Returns the scene plus a
// list of { id, mesh } beacon markers so the caller can pulse them and
// measure distance without re-querying the scene graph, and a list of
// { group, bob } billboards the caller must face toward the camera each
// frame (bob: true also gets a small idle sway, used for NPCs).
export function buildWorldScene(zones) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#241830')
  scene.fog = new THREE.Fog('#241830', 25, 95)

  scene.add(new THREE.HemisphereLight('#8fa0d8', '#241830', 0.9))
  const sun = new THREE.DirectionalLight('#f2d9a8', 0.8)
  sun.position.set(30, 40, 10)
  scene.add(sun)

  // Ground: one big base plane (grass/field) plus a lighter square patch
  // for the town and a darker ribbon for the road. Each now carries a
  // seamless procedural texture (see public/world/tex_*.png, generated
  // offline) instead of a flat solid color, so the ground reads as grass/
  // cobblestone/dirt up close rather than a single flat-shaded polygon.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ map: loadTexture('/world/tex_grass.png', [60, 60]), roughness: 1 })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const townFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 40),
    new THREE.MeshStandardMaterial({ map: loadTexture('/world/tex_town_floor.png', [11, 10]), roughness: 0.9 })
  )
  townFloor.rotation.x = -Math.PI / 2
  townFloor.position.set(-4, 0.01, -6)
  scene.add(townFloor)

  const forestFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46),
    new THREE.MeshStandardMaterial({ map: loadTexture('/world/tex_forest_floor.png', [11, 11]), roughness: 1 })
  )
  forestFloor.rotation.x = -Math.PI / 2
  forestFloor.position.set(4, 0.005, -48)
  scene.add(forestFloor)

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 100),
    new THREE.MeshStandardMaterial({ map: loadTexture('/world/tex_road.png', [2, 25]), roughness: 1 })
  )
  road.rotation.x = -Math.PI / 2
  road.position.set(-2, 0.015, -20)
  scene.add(road)

  const billboards = []

  // Town buildings: real illustrated house art on billboards (see
  // public/world/house_*.png) instead of flat-colored boxes. Positions/
  // sizes are cosmetic dressing, separate from the interactive zone
  // markers below.
  const buildingSpecs = [
    { x: -14, z: -10, h: 6.4, kind: 'tower' }, // bookshop block
    { x: 14, z: -8, h: 5.6, kind: 'cottage' }, // corner block
    { x: -4, z: 14, h: 4.6, kind: 'cottage' }, // cottage
    { x: 18, z: 6, h: 3.8, kind: 'cabin' }, // market stall
    { x: -32, z: -18, h: 5.8, kind: 'tower' } // inn
  ]
  for (const b of buildingSpecs) {
    const group = makeBillboard(HOUSE_TEXTURES[b.kind], b.h)
    group.position.set(b.x, 0, b.z)
    scene.add(group)
    const shadow = makeShadowBlob(b.h * 0.85, b.h * 0.5)
    shadow.position.set(b.x, 0.02, b.z)
    scene.add(shadow)
    billboards.push({ group })
  }

  // Decorative townsfolk: a handful of generic villagers standing around
  // the square so it doesn't feel abandoned. Purely cosmetic — no
  // dialogue, no proximity prompt — that's what the zone beacons below
  // are for. `bob: true` gets a slow idle sway in World.jsx's tick loop
  // so they read as alive rather than propped-up cutouts.
  const npcSpecs = [
    { x: 6, z: -3, kind: 0 },
    { x: -9, z: 5, kind: 1 },
    { x: 9, z: 11, kind: 2 },
    { x: -20, z: -15, kind: 1 }
  ]
  for (const n of npcSpecs) {
    const group = makeBillboard(NPC_TEXTURES[n.kind], 1.8)
    group.position.set(n.x, 0, n.z)
    scene.add(group)
    const shadow = makeShadowBlob(1.1, 0.6)
    shadow.position.set(n.x, 0.02, n.z)
    scene.add(shadow)
    billboards.push({ group, bob: true, bobOffset: n.x + n.z })
  }

  // Forest: a scattered but seeded (not random-per-render) cluster of
  // billboard trees south of the town, thinning out toward the edges of
  // the map so it doesn't look like a wall.
  let seed = 42
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return (seed % 10000) / 10000
  }
  for (let i = 0; i < 70; i++) {
    const x = 4 + (rand() - 0.5) * 44
    const z = -48 + (rand() - 0.5) * 44
    if (Math.abs(x - 0) < 5 && z > -46) continue // keep the trail clear
    const tex = TREE_TEXTURES[Math.floor(rand() * TREE_TEXTURES.length)]
    const height = 4.2 + rand() * 1.8
    const group = makeBillboard(tex, height)
    group.position.set(x, 0, z)
    scene.add(group)
    const shadow = makeShadowBlob(height * 0.55, height * 0.32)
    shadow.position.set(x, 0.02, z)
    scene.add(shadow)
    billboards.push({ group })
  }

  // Boundary hint: a low translucent wall ring so the player feels an
  // edge instead of just stopping with no explanation.
  const bounds = new THREE.Mesh(
    new THREE.RingGeometry(
      Math.max(WORLD_BOUNDS.maxX, -WORLD_BOUNDS.minX, WORLD_BOUNDS.maxZ, -WORLD_BOUNDS.minZ) + 0.5,
      Math.max(WORLD_BOUNDS.maxX, -WORLD_BOUNDS.minX, WORLD_BOUNDS.maxZ, -WORLD_BOUNDS.minZ) + 3,
      64
    ),
    new THREE.MeshBasicMaterial({ color: '#150f1c', side: THREE.DoubleSide })
  )
  bounds.rotation.x = -Math.PI / 2
  bounds.position.y = 0.02
  scene.add(bounds)

  // Interactive zone beacons: a glowing pillar over each landmark so it's
  // visible from a distance even before the proximity prompt appears.
  const beacons = zones.map((z) => {
    const group = new THREE.Group()
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 6, 8),
      new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: 0.55 })
    )
    beam.position.y = 3
    const glow = new THREE.PointLight(z.color, 1.2, 12)
    glow.position.y = 1.5
    group.add(beam, glow)
    group.position.set(z.x, 0, z.z)
    scene.add(group)
    return { id: z.id, group, beam }
  })

  return { scene, beacons, billboards }
}
