import * as THREE from 'three'

// Builds the static 3D battle arena and one billboard "card" per combatant:
// a plane textured with that card's existing 2D art (no new art assets
// needed — the illustrated card is the model), backed by a glow plate
// tinted by elemental type (see data/types.js). This isn't a first-person
// space like World.jsx — it's a fixed dramatic 3/4 camera looking at two
// facing rows, closer to a JRPG battle screen than a walk-around space.
const CARD_W = 2.2
const CARD_H = 2.2

const TYPE_TINT = { fire: '#e0653a', storm: '#4a90d9', earth: '#a3813f', arcane: '#a55fd6' }

const textureCache = new Map()
function loadTexture(url) {
  if (!url) return null
  if (textureCache.has(url)) return textureCache.get(url)
  const tex = new THREE.TextureLoader().load(url)
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace
  textureCache.set(url, tex)
  return tex
}

export function buildBattleScene(playerCombatants, enemyCombatants) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#180f22')
  scene.fog = new THREE.Fog('#180f22', 14, 34)

  scene.add(new THREE.HemisphereLight('#a892d8', '#180f22', 0.85))
  const key = new THREE.DirectionalLight('#ffd9b0', 0.9)
  key.position.set(4, 8, 6)
  scene.add(key)
  const rim = new THREE.DirectionalLight('#8a6fd8', 0.6)
  rim.position.set(-6, 4, -4)
  scene.add(rim)

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(11, 48),
    new THREE.MeshStandardMaterial({ color: '#241733', roughness: 1 })
  )
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(10.6, 11.4, 48),
    new THREE.MeshBasicMaterial({ color: '#c98ac8', transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.01
  scene.add(ring)

  const cardMeshes = new Map()

  function layoutRow(list, z, tint) {
    const n = list.length
    list.forEach((c, i) => {
      const x = (i - (n - 1) / 2) * 2.6
      const group = new THREE.Group()
      group.position.set(x, 1.4, z)

      const glowColor = tint(c)
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(CARD_W + 0.3, CARD_H + 0.3),
        new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.4 })
      )
      glow.position.z = -0.02
      group.add(glow)

      const tex = loadTexture(c.image)
      const cardMat = new THREE.MeshBasicMaterial({
        map: tex || null,
        color: tex ? '#ffffff' : glowColor,
        transparent: true
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W, CARD_H), cardMat)
      group.add(mesh)

      scene.add(group)
      cardMeshes.set(c.cardId, {
        group, mesh, glow,
        basePos: group.position.clone(),
        baseColor: cardMat.color.getHex()
      })
    })
  }

  layoutRow(playerCombatants, 3.4, (c) => TYPE_TINT[c.type] || '#8a7fae')
  layoutRow(enemyCombatants, -3.4, (c) => TYPE_TINT[c.type] || '#ae7f8a')

  return { scene, cardMeshes }
}

// ---- Lightweight particle burst system -------------------------------
// A handful of small additive-blended sprites per burst that fly outward
// from a point and fade over ~700ms. No external particle library needed
// for effects this simple, and it keeps the battle bundle small.
let dotTextureCache = null
function dotTexture() {
  if (dotTextureCache) return dotTextureCache
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  dotTextureCache = new THREE.CanvasTexture(canvas)
  return dotTextureCache
}

export function createFxManager(scene) {
  const active = []

  function spawnBurst(position, color, count = 14) {
    const n = Math.max(1, Math.round(count))
    for (let i = 0; i < n; i++) {
      const mat = new THREE.SpriteMaterial({
        map: dotTexture(),
        color,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
      const sprite = new THREE.Sprite(mat)
      sprite.position.copy(position)
      sprite.scale.setScalar(0.12 + Math.random() * 0.1)
      scene.add(sprite)
      const angle = Math.random() * Math.PI * 2
      const speed = 1.2 + Math.random() * 1.8
      active.push({
        sprite,
        vel: new THREE.Vector3(Math.cos(angle) * speed, 0.6 + Math.random() * 1.4, Math.sin(angle) * speed),
        life: 0,
        maxLife: 0.55 + Math.random() * 0.35
      })
    }
  }

  function update(dt) {
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i]
      p.life += dt
      const t = p.life / p.maxLife
      if (t >= 1) {
        scene.remove(p.sprite)
        p.sprite.material.dispose()
        active.splice(i, 1)
        continue
      }
      p.sprite.position.addScaledVector(p.vel, dt)
      p.vel.y -= dt * 2.4 // light gravity
      p.sprite.material.opacity = 0.95 * (1 - t)
      const scale = (0.12 + Math.random() * 0.02) * (1 + t * 1.4)
      p.sprite.scale.setScalar(scale)
    }
  }

  function dispose() {
    active.forEach((p) => { scene.remove(p.sprite); p.sprite.material.dispose() })
    active.length = 0
  }

  return { spawnBurst, update, dispose }
}
