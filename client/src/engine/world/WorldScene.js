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

const textureCache = new Map()
function loadTexture(url) {
  if (textureCache.has(url)) return textureCache.get(url)
  const tex = new THREE.TextureLoader().load(url)
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace
  textureCache.set(url, tex)
  return tex
}

// Builds one upright billboard plane for a piece of foliage/architecture
// art: `height` is the world-space height in units, width follows the
// source image's aspect ratio, and the plane's local origin is its base
// so `group.position.y` can stay 0 (ground level) rather than needing a
// half-height offset at every call site.
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

// Builds the static Three.js scene: ground, a lantern-lit town square, a
// road cutting south through a field, and a forest of scattered trees.
// Pure Three.js (no React) so it's easy to unit-reason-about and cheap to
// rebuild if the layout ever needs to change. Returns the scene plus a
// list of { id, mesh } beacon markers so the caller can pulse them and
// measure distance without re-querying the scene graph, and a list of
// { group } billboards the caller must face toward the camera each frame.
export function buildWorldScene(zones) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#241830')
  scene.fog = new THREE.Fog('#241830', 25, 95)

  scene.add(new THREE.HemisphereLight('#8fa0d8', '#241830', 0.9))
  const sun = new THREE.DirectionalLight('#f2d9a8', 0.8)
  sun.position.set(30, 40, 10)
  scene.add(sun)

  // Ground: one big base plane (grass/field) plus a lighter square patch
  // for the town and a darker ribbon for the road, all just flat
  // overlapping planes — cheap, no texture loading, reads fine from a
  // first-person eye height.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ color: '#3c5a3e', roughness: 1 })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const townFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 40),
    new THREE.MeshStandardMaterial({ color: '#8a7a63', roughness: 1 })
  )
  townFloor.rotation.x = -Math.PI / 2
  townFloor.position.set(-4, 0.01, -6)
  scene.add(townFloor)

  const forestFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46),
    new THREE.MeshStandardMaterial({ color: '#25422c', roughness: 1 })
  )
  forestFloor.rotation.x = -Math.PI / 2
  forestFloor.position.set(4, 0.005, -48)
  scene.add(forestFloor)

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 100),
    new THREE.MeshStandardMaterial({ color: '#4a4550', roughness: 1 })
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
    billboards.push({ group })
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
