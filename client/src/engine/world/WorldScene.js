import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { WORLD_BOUNDS } from './zones'
import { NPC_VILLAGERS } from '../../data/npcVillagers'

// ---------------------------------------------------------------------------
// Real 3D geometry, not flat sprites.
//
// The previous version of this file put camera-facing "billboard" planes
// (flat PNG art on a quad that rotates to always face you) in place of
// trees/buildings/NPCs. That's a classic and legitimate technique, but up
// close — and especially when walking *around* something rather than just
// past it — a billboard reads as exactly what it is: a flat cutout. That's
// the core complaint this rewrite addresses.
//
// Every tree, building, and villager below is assembled from real Three.js
// primitives (boxes, cones, capsules, low-facet icosahedrons) with flat
// shading and proper materials, so they have actual volume: they look
// different from every angle, they cast real directional shadows that
// rotate correctly as the sun-relative angle changes, and walking around
// one shows its back and sides like an actual object rather than nothing.
// This is the same "low-poly primitives" style used by a large number of
// shipped low-poly indie games (flat-shaded faceted geometry, no textures
// needed) — it reads as deliberately stylized rather than placeholder-y,
// which is the look being aimed for here.
// ---------------------------------------------------------------------------

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

// Flat-shaded low-poly material factory — one place to keep the "house
// style" (matte, faceted, no shininess) consistent across every hand-built
// object below.
const matCache = new Map()
function lpMat(color, { roughness = 0.9, metalness = 0, emissive = null } = {}) {
  const key = `${color}|${roughness}|${metalness}|${emissive}`
  if (matCache.has(key)) return matCache.get(key)
  const m = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness, metalness })
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 0.6 }
  matCache.set(key, m)
  return m
}

function shadowed(mesh, { cast = true, receive = true } = {}) {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
  return mesh
}

// ---- Trees -----------------------------------------------------------------
// Three kinds matching the old sprite variety (green/autumn/pine): a trunk
// cylinder plus either stacked cone tiers (pine) or clustered low-poly
// icosahedron blobs (round/autumn canopy).
//
// A 70-tree forest built as 70 individual Groups (each with its own
// trunk + 3 canopy pieces) would be ~280 separate draw calls, which is
// wasteful for geometry that never moves or animates — every tree is
// static once placed. Instead, each tree's per-part geometry is built in
// local space, baked into world space with `.applyMatrix4(matrix)`, and
// bucketed by material; buildWorldScene merges each bucket into a single
// BufferGeometry afterward (see `addMergedTrees`). Same triangles, same
// positions, same shadows — four draw calls total instead of ~280.
function collectTreeParts(kind, height, rand, matrix, buckets) {
  const trunkH = height * 0.36
  const trunkGeo = new THREE.CylinderGeometry(height * 0.045, height * 0.07, trunkH, 6)
  trunkGeo.translate(0, trunkH / 2, 0)
  trunkGeo.applyMatrix4(matrix)
  buckets.trunk.push(trunkGeo)

  if (kind === 'pine') {
    const tiers = 3
    const baseR = height * 0.32
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1)
      const r = baseR * (1 - t * 0.55)
      const h = height * 0.34
      const coneGeo = new THREE.ConeGeometry(r, h, 7)
      coneGeo.rotateY(rand() * Math.PI)
      coneGeo.translate(0, trunkH + i * height * 0.2 + h * 0.42, 0)
      coneGeo.applyMatrix4(matrix)
      buckets.pine.push(coneGeo)
    }
  } else {
    const bucket = kind === 'autumn' ? buckets.autumn : buckets.round
    const blobs = 3
    for (let i = 0; i < blobs; i++) {
      const r = height * (0.22 + rand() * 0.07)
      const geo = new THREE.IcosahedronGeometry(r, 0)
      geo.rotateX(rand() * Math.PI)
      geo.rotateY(rand() * Math.PI)
      geo.rotateZ(rand() * Math.PI)
      const ang = (i / blobs) * Math.PI * 2 + rand()
      geo.translate(Math.cos(ang) * r * 0.35, trunkH + height * 0.32 + (i === 0 ? r * 0.3 : 0), Math.sin(ang) * r * 0.35)
      geo.applyMatrix4(matrix)
      bucket.push(geo)
    }
  }
}

function addMergedTrees(scene, buckets) {
  const specs = [
    { key: 'trunk', color: '#5c4028' },
    { key: 'pine', color: '#2f5b3a' },
    { key: 'round', color: '#3f7d3f' },
    { key: 'autumn', color: '#c9762f' }
  ]
  for (const { key, color } of specs) {
    const geos = buckets[key]
    if (!geos.length) continue
    const merged = mergeGeometries(geos, false)
    scene.add(shadowed(new THREE.Mesh(merged, lpMat(color))))
  }
}

// ---- Buildings ---------------------------------------------------------
// Box walls + a faceted cone roof + inset door/window boxes. Three kinds
// (cottage/cabin/tower) vary proportions and color rather than needing
// separate geometry per kind.
function buildBuilding(kind, h) {
  const group = new THREE.Group()
  const isTower = kind === 'tower'
  const isCabin = kind === 'cabin'
  const wallColor = isTower ? '#9a9086' : isCabin ? '#7a5a3a' : '#c9a876'
  const roofColor = isTower ? '#5a4a6a' : isCabin ? '#4a3a2a' : '#a13f3f'
  const w = h * (isTower ? 0.5 : 0.82)
  const d = w * (isTower ? 0.9 : 1)
  const wallH = h * (isTower ? 0.72 : 0.52)

  const walls = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), lpMat(wallColor)))
  walls.position.y = wallH / 2
  group.add(walls)

  const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.2, wallH * 0.5, 0.06), lpMat('#2e2116'))
  door.position.set(0, wallH * 0.25, d / 2 + 0.01)
  group.add(door)

  const winMat = lpMat('#f4d98a', { roughness: 0.4, emissive: '#f4d98a' })
  const winPositions = isTower ? [[0, wallH * 0.82]] : [[-w * 0.27, wallH * 0.62], [w * 0.27, wallH * 0.62]]
  for (const [x, y] of winPositions) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.15, w * 0.15, 0.05), winMat)
    win.position.set(x, y, d / 2 + 0.01)
    group.add(win)
  }

  const roofH = h - wallH
  const roofSeg = isTower ? 8 : 4
  const roofR = (Math.sqrt(w * w + d * d) / 2) * (isTower ? 0.8 : 1.08)
  const roof = shadowed(new THREE.Mesh(new THREE.ConeGeometry(roofR, roofH, roofSeg), lpMat(roofColor)))
  roof.position.y = wallH + roofH / 2
  roof.rotation.y = isTower ? 0 : Math.PI / 4
  group.add(roof)

  return group
}

// ---- Villagers -----------------------------------------------------------
// Hand-built low-poly people (capsule/sphere primitives) rather than an
// imported rigged character — this keeps them visually consistent with the
// hand-built trees/buildings above (same faceted, flat-shaded "toy" look)
// instead of gluing in a mismatched realistic/sci-fi asset. Each theme's
// hat/accessory plus outfit color is what actually differentiates the four
// villagers from each other at a glance. Returns an animatable rig — the
// caller drives a small idle bob/sway each frame (see World.jsx).
const PERSON_THEMES = {
  baker: { skin: '#e8b48c', outfit: '#e2e2e2', accent: '#c9a876', hat: 'chef' },
  gardener: { skin: '#caa06e', outfit: '#5c8c4a', accent: '#3f6b34', hat: 'sunhat' },
  traveler: { skin: '#d8b48c', outfit: '#3a4a68', accent: '#26314a', hat: 'hood' },
  innkeeper: { skin: '#c8996e', outfit: '#6a5a4a', accent: '#8a3a3a', hat: 'helmet' }
}

function buildPerson(themeKey) {
  const theme = PERSON_THEMES[themeKey] || PERSON_THEMES.baker
  const skinMat = lpMat(theme.skin)
  const outfitMat = lpMat(theme.outfit)
  const accentMat = lpMat(theme.accent)

  const group = new THREE.Group()
  const bodyGroup = new THREE.Group()
  group.add(bodyGroup)

  const legH = 0.4
  const torsoH = 0.5
  const headR = 0.16

  for (const side of [-1, 1]) {
    const leg = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.065, legH * 0.6, 2, 5), lpMat('#332a22')))
    leg.position.set(side * 0.09, legH / 2, 0)
    bodyGroup.add(leg)
  }

  const torso = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.19, torsoH * 0.5, 3, 6), outfitMat))
  torso.position.y = legH + torsoH / 2
  bodyGroup.add(torso)

  const arms = []
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.23, legH + torsoH * 0.8, 0)
    const arm = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 2, 5), skinMat))
    arm.position.y = -0.17
    pivot.add(arm)
    bodyGroup.add(pivot)
    arms.push(pivot)
  }

  const headY = legH + torsoH + headR * 0.75
  const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(headR, 8, 6), skinMat))
  head.position.y = headY
  bodyGroup.add(head)

  // Per-role hat/accessory — the main visual differentiator between the
  // four villagers since they otherwise share the same rig.
  if (theme.hat === 'chef') {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.95, headR * 0.8, headR * 1.3, 10), lpMat('#f4f4f4'))
    hat.position.y = headY + headR * 1.15
    bodyGroup.add(hat)
  } else if (theme.hat === 'sunhat') {
    const brim = new THREE.Mesh(new THREE.ConeGeometry(headR * 1.7, headR * 0.3, 10), lpMat('#e0c877'))
    brim.position.y = headY + headR * 0.55
    bodyGroup.add(brim)
  } else if (theme.hat === 'hood') {
    const hood = new THREE.Mesh(new THREE.ConeGeometry(headR * 1.15, headR * 1.9, 8), accentMat)
    hood.position.y = headY + headR * 0.9
    bodyGroup.add(hood)
  } else if (theme.hat === 'helmet') {
    const helm = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.05, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), lpMat('#8a8a8a', { roughness: 0.5, metalness: 0.3 }))
    helm.position.y = headY + headR * 0.35
    bodyGroup.add(helm)
  }

  // Apron/satchel front panel for a bit more silhouette variety.
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.22, torsoH * 0.42, 0.03), accentMat)
  panel.position.set(0, legH + torsoH * 0.42, 0.16)
  bodyGroup.add(panel)

  return { group, bodyGroup, arms, bobOffset: 0 }
}

// Builds the static Three.js scene: ground, a lantern-lit town square, a
// road cutting south through a field, a forest of trees, hand-built
// buildings, and four talkative villagers. Returns the scene plus a list
// of { id, mesh } beacon markers and a list of villager `rigs` the caller
// animates (idle bob/sway) each frame — see World.jsx's tick loop.
export function buildWorldScene(zones) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#241830')
  scene.fog = new THREE.Fog('#241830', 25, 95)

  scene.add(new THREE.HemisphereLight('#8fa0d8', '#241830', 0.9))
  const sun = new THREE.DirectionalLight('#f2d9a8', 1.4)
  sun.position.set(30, 40, 10)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.bias = -0.0015
  sun.shadow.normalBias = 0.02
  const sc = sun.shadow.camera
  sc.left = -55; sc.right = 40; sc.top = 30; sc.bottom = -80
  sc.near = 1; sc.far = 120
  scene.add(sun)
  scene.add(sun.target)

  // Ground: one big base plane (grass/field) plus a lighter square patch
  // for the town and a darker ribbon for the road, each carrying a
  // seamless procedural texture (see public/world/tex_*.png).
  const ground = shadowed(new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ map: loadTexture('/world/tex_grass.png', [60, 60]), roughness: 1 })
  ), { cast: false })
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const townFloor = shadowed(new THREE.Mesh(
    new THREE.PlaneGeometry(46, 40),
    new THREE.MeshStandardMaterial({ map: loadTexture('/world/tex_town_floor.png', [11, 10]), roughness: 0.9 })
  ), { cast: false })
  townFloor.rotation.x = -Math.PI / 2
  townFloor.position.set(-4, 0.01, -6)
  scene.add(townFloor)

  const forestFloor = shadowed(new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46),
    new THREE.MeshStandardMaterial({ map: loadTexture('/world/tex_forest_floor.png', [11, 11]), roughness: 1 })
  ), { cast: false })
  forestFloor.rotation.x = -Math.PI / 2
  forestFloor.position.set(4, 0.005, -48)
  scene.add(forestFloor)

  const road = shadowed(new THREE.Mesh(
    new THREE.PlaneGeometry(7, 100),
    new THREE.MeshStandardMaterial({ map: loadTexture('/world/tex_road.png', [2, 25]), roughness: 1 })
  ), { cast: false })
  road.rotation.x = -Math.PI / 2
  road.position.set(-2, 0.015, -20)
  scene.add(road)

  // Town buildings: real 3D geometry (see buildBuilding above) instead of
  // flat art on a plane. Positions/sizes are cosmetic dressing, separate
  // from the interactive zone markers below.
  const buildingSpecs = [
    { x: -14, z: -10, h: 6.4, kind: 'tower' }, // bookshop block
    { x: 14, z: -8, h: 5.6, kind: 'cottage' }, // corner block
    { x: -4, z: 14, h: 4.6, kind: 'cottage' }, // cottage
    { x: 18, z: 6, h: 3.8, kind: 'cabin' }, // market stall
    { x: -32, z: -18, h: 5.8, kind: 'tower' } // inn
  ]
  for (const b of buildingSpecs) {
    const group = buildBuilding(b.kind, b.h)
    group.position.set(b.x, 0, b.z)
    group.rotation.y = ((b.x + b.z) % 7) * 0.2 // cheap deterministic variety in facing
    scene.add(group)
  }

  // Townsfolk: hand-built low-poly villagers standing around the square —
  // each one a real "Talk" interaction backed by an AI call (see
  // data/npcVillagers.js + World.jsx), not just a static prop. Position
  // data lives in npcVillagers.js so render placement here and the
  // proximity/interaction check in World.jsx can never drift apart.
  const npcRigs = []
  for (const n of NPC_VILLAGERS) {
    const rig = buildPerson(n.id)
    rig.group.position.set(n.x, 0, n.z)
    rig.group.rotation.y = Math.atan2(-n.x, -n.z) // face roughly toward the square center
    rig.bobOffset = n.x + n.z
    scene.add(rig.group)
    npcRigs.push(rig)
  }

  // Forest: a scattered but seeded (not random-per-render) cluster of
  // real 3D trees south of the town, thinning out toward the edges of the
  // map so it doesn't look like a wall.
  let seed = 42
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return (seed % 10000) / 10000
  }
  const TREE_KINDS = ['round', 'autumn', 'pine']
  const treeBuckets = { trunk: [], pine: [], round: [], autumn: [] }
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  const one = new THREE.Vector3(1, 1, 1)
  for (let i = 0; i < 70; i++) {
    const x = 4 + (rand() - 0.5) * 44
    const z = -48 + (rand() - 0.5) * 44
    if (Math.abs(x - 0) < 5 && z > -46) continue // keep the trail clear
    const kind = TREE_KINDS[Math.floor(rand() * TREE_KINDS.length)]
    const height = 4.2 + rand() * 1.8
    q.setFromAxisAngle(up, rand() * Math.PI * 2)
    m.compose(new THREE.Vector3(x, 0, z), q, one)
    collectTreeParts(kind, height, rand, m, treeBuckets)
  }
  addMergedTrees(scene, treeBuckets)

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

  return { scene, beacons, npcRigs }
}
