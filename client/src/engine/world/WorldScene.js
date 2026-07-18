import * as THREE from 'three'
import { WORLD_BOUNDS } from './zones'

// Builds the static Three.js scene: ground, a lantern-lit town square, a
// road cutting south through a field, and a forest of scattered trees.
// Pure Three.js (no React) so it's easy to unit-reason-about and cheap to
// rebuild if the layout ever needs to change. Returns the scene plus a
// list of { id, mesh } beacon markers so the caller can pulse them and
// measure distance without re-querying the scene graph.
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

  // Town buildings: simple colored boxes, enough to make the square read
  // as a place rather than an empty lot. Positions are cosmetic dressing,
  // separate from the interactive zone markers below.
  const buildingSpecs = [
    { x: -14, z: -10, w: 8, h: 6, d: 7, color: '#5a4a72' }, // bookshop block
    { x: 14, z: -8, w: 7, h: 5, d: 6, color: '#3f5a78' }, // corner block
    { x: -4, z: 14, w: 5, h: 4, d: 5, color: '#6a4630' }, // cottage
    { x: 18, z: 6, w: 4, h: 3, d: 4, color: '#7a6a2a' }, // market stall
    { x: -32, z: -18, w: 7, h: 5, d: 6, color: '#6a3a5a' } // inn
  ]
  for (const b of buildingSpecs) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, b.h, b.d),
      new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.9 })
    )
    box.position.set(b.x, b.h / 2, b.z)
    scene.add(box)
  }

  // Forest: a scattered but seeded (not random-per-render) cluster of
  // cone-and-cylinder trees south of the town, thinning out toward the
  // edges of the map so it doesn't look like a wall.
  const treeGroup = new THREE.Group()
  let seed = 42
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return (seed % 10000) / 10000
  }
  for (let i = 0; i < 70; i++) {
    const x = 4 + (rand() - 0.5) * 44
    const z = -48 + (rand() - 0.5) * 44
    if (Math.abs(x - 0) < 5 && z > -46) continue // keep the trail clear
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.32, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: '#4a3520', roughness: 1 })
    )
    const top = new THREE.Mesh(
      new THREE.ConeGeometry(1.4 + rand() * 0.8, 3 + rand() * 1.6, 7),
      new THREE.MeshStandardMaterial({ color: '#2f5c38', roughness: 1 })
    )
    trunk.position.set(x, 1.1, z)
    top.position.set(x, 2.6 + rand(), z)
    treeGroup.add(trunk, top)
  }
  scene.add(treeGroup)

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

  return { scene, beacons }
}
