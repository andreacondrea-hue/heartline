import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { buildWorldScene } from '../engine/world/WorldScene'
import { allZones, WORLD_BOUNDS } from '../engine/world/zones'
import { NPC_VILLAGERS, npcContextMessage } from '../data/npcVillagers'

const EYE_HEIGHT = 1.7
const MOVE_SPEED = 9 // units/sec
const LOOK_SENSITIVITY = 0.0032
const JOYSTICK_RADIUS = 44
const NPC_PROXIMITY_SLACK = 1.0

// First-person explorable hub: replaces the old flat button-grid menu.
// Walking up to a landmark's glowing beacon surfaces a prompt; committing
// it calls onEnterZone(action) with the same action strings the old hub
// buttons used ('packs', 'collection', 'partySelect', 'humanRecruit',
// 'companion'), so App.jsx's existing setScreen(...) wiring doesn't need
// to know this is 3D at all.
//
// Controls are unified across mouse and touch on purpose: PointerLock
// (the "proper" desktop FPS approach) needs a permission-like click and
// behaves inconsistently inside PWAs/webviews, and touch devices can't
// use it at all. Drag-to-look plus a thumb joystick works identically
// everywhere, which matters a lot more than desktop purism given this is
// primarily played on a phone.
export default function World({ companionId, companionName, gold, battlesWon, onEnterZone, onOpenMenu, hud }) {
  const mountRef = useRef(null)
  const [nearZone, setNearZone] = useState(null)
  const [nearNpc, setNearNpc] = useState(null)
  const [npcRemark, setNpcRemark] = useState(null) // { npcId, name, text, loading, error }
  const [joystick, setJoystick] = useState(null) // { originX, originY, dx, dy } while a touch/drag is active on the stick

  // Mutable per-frame state that doesn't need to trigger React re-renders.
  const stateRef = useRef({
    yaw: 0, // facing -Z ("north"), toward the bookshop/corner/forest side of the square
    pitch: 0,
    pos: new THREE.Vector3(0, EYE_HEIGHT, 2),
    keys: Object.create(null),
    move: { x: 0, z: 0 }, // joystick vector, -1..1 each axis
    lookDrag: null // { pointerId, lastX, lastY } while a look-drag is active
  })
  const nearZoneRef = useRef(null)
  const nearNpcRef = useRef(null)
  const onEnterZoneRef = useRef(onEnterZone)
  onEnterZoneRef.current = onEnterZone
  // Kept current every render (not just at effect-setup time) so the tick
  // loop's closure and talkToNpc always see the latest game state without
  // needing companionId-style dependency-array rebuilds of the whole scene.
  const companionNameRef = useRef(companionName)
  companionNameRef.current = companionName
  const goldRef = useRef(gold)
  goldRef.current = gold
  const battlesWonRef = useRef(battlesWon)
  battlesWonRef.current = battlesWon

  // Walking up to a villager and hitting "Talk" fires ONE real AI call
  // (same /api/chat backend the companions use) and shows whatever single
  // line comes back — see data/npcVillagers.js for why this is "AI" and
  // not a canned flavor-text pool.
  async function talkToNpc(npc) {
    setNpcRemark({ npcId: npc.id, name: npc.name, text: '', loading: true, error: null })
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: npc.systemPrompt,
          history: [{
            role: 'user',
            content: npcContextMessage({
              companionName: companionNameRef.current,
              gold: goldRef.current,
              battlesWon: battlesWonRef.current
            })
          }]
        })
      })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      const data = await res.json()
      setNpcRemark({ npcId: npc.id, name: npc.name, text: data.reply, loading: false, error: null })
    } catch (e) {
      setNpcRemark({ npcId: npc.id, name: npc.name, text: '', loading: false, error: "Couldn't reach them just now." })
    }
  }

  // Auto-dismiss the speech bubble a few seconds after a reply lands so it
  // doesn't linger on screen forever.
  useEffect(() => {
    if (!npcRemark || npcRemark.loading) return
    const timer = setTimeout(() => setNpcRemark(null), 7000)
    return () => clearTimeout(timer)
  }, [npcRemark])

  useEffect(() => {
    const mount = mountRef.current
    const zones = allZones(companionId)
    const { scene, beacons, npcRigs } = buildWorldScene(zones)

    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 300)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    // Real shadow mapping (soft-filtered) now that trees/buildings/NPCs are
    // actual 3D geometry rather than flat billboards — a billboard's cast
    // shadow would have rotated with it as the player walked around, which
    // is why the old version faked grounding with a static shadow-blob
    // decal instead. Real geometry doesn't have that problem.
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    // Light post-processing: bloom picks out the lantern/beacon glow and
    // window lights against the dusk sky, which reads as a big part of
    // "atmosphere" for very little GPU cost — kept deliberately subtle and
    // without SSAO/AO passes so this still runs comfortably on a phone.
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.45, // strength
      0.4, // radius
      0.82 // threshold
    )
    composer.addPass(bloomPass)
    composer.addPass(new OutputPass())

    const st = stateRef.current

    function resize() {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      composer.setSize(mount.clientWidth, mount.clientHeight)
      bloomPass.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', resize)

    // ---- Keyboard (desktop convenience alongside drag-to-look) ----
    function onKeyDown(e) { st.keys[e.key.toLowerCase()] = true }
    function onKeyUp(e) { st.keys[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // ---- Look: drag anywhere on the canvas (mouse or touch) rotates
    // the camera. A separate joystick element (rendered in the HUD, see
    // below) handles movement so the two gestures never fight over the
    // same pointer.
    function onPointerDown(e) {
      if (e.target.closest('[data-joystick]')) return
      st.lookDrag = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY }
      e.target.setPointerCapture?.(e.pointerId)
    }
    function onPointerMove(e) {
      if (!st.lookDrag || st.lookDrag.pointerId !== e.pointerId) return
      const dx = e.clientX - st.lookDrag.lastX
      const dy = e.clientY - st.lookDrag.lastY
      st.lookDrag.lastX = e.clientX
      st.lookDrag.lastY = e.clientY
      st.yaw -= dx * LOOK_SENSITIVITY
      st.pitch = Math.max(-1.1, Math.min(1.1, st.pitch - dy * LOOK_SENSITIVITY))
    }
    function onPointerUp(e) {
      if (st.lookDrag && st.lookDrag.pointerId === e.pointerId) st.lookDrag = null
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    let raf
    let last = performance.now()
    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      // Movement vector: keyboard (desktop) merged with joystick (touch),
      // expressed in camera-local space then rotated by yaw.
      let mx = st.move.x, mz = st.move.z
      if (st.keys['w'] || st.keys['arrowup']) mz -= 1
      if (st.keys['s'] || st.keys['arrowdown']) mz += 1
      if (st.keys['a'] || st.keys['arrowleft']) mx -= 1
      if (st.keys['d'] || st.keys['arrowright']) mx += 1
      const len = Math.hypot(mx, mz)
      if (len > 1) { mx /= len; mz /= len }

      if (mx !== 0 || mz !== 0) {
        const sin = Math.sin(st.yaw), cos = Math.cos(st.yaw)
        const worldX = mx * cos - mz * sin
        const worldZ = mx * sin + mz * cos
        st.pos.x += worldX * MOVE_SPEED * dt
        st.pos.z += worldZ * MOVE_SPEED * dt
        st.pos.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, st.pos.x))
        st.pos.z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, st.pos.z))
      }

      camera.position.copy(st.pos)
      camera.rotation.order = 'YXZ'
      camera.rotation.y = st.yaw
      camera.rotation.x = st.pitch

      // Proximity check + gentle beacon pulse.
      let closest = null
      let closestDist = Infinity
      for (const z of zones) {
        const d = Math.hypot(st.pos.x - z.x, st.pos.z - z.z)
        if (d < closestDist) { closestDist = d; closest = z }
      }
      const within = closest && closestDist <= closest.radius + 1.2 ? closest : null
      if ((within?.id || null) !== nearZoneRef.current) {
        nearZoneRef.current = within?.id || null
        setNearZone(within)
      }
      const t = now / 500
      for (const b of beacons) {
        const isNear = within && b.id === within.id
        b.beam.material.opacity = isNear ? 0.85 : 0.45 + Math.sin(t + b.group.position.x) * 0.1
      }

      // Same proximity pattern as the zone beacons above, but for the
      // talkative villagers — a separate check because getting near an
      // NPC should surface a "Talk" prompt, not navigate away like a zone.
      let closestNpc = null
      let closestNpcDist = Infinity
      for (const n of NPC_VILLAGERS) {
        const d = Math.hypot(st.pos.x - n.x, st.pos.z - n.z)
        if (d < closestNpcDist) { closestNpcDist = d; closestNpc = n }
      }
      const withinNpc = closestNpc && closestNpcDist <= closestNpc.radius + NPC_PROXIMITY_SLACK ? closestNpc : null
      if ((withinNpc?.id || null) !== nearNpcRef.current) {
        nearNpcRef.current = withinNpc?.id || null
        setNearNpc(withinNpc)
      }

      // Idle animation for the hand-built villagers: a small torso bob plus
      // a gentle arm swing so they read as alive rather than static props.
      // Trees and buildings are real static geometry now — with actual
      // volume rather than a flat sprite, they no longer need to fake
      // "facing the camera" the way the old billboards did.
      const bobT = now / 700
      for (const rig of npcRigs) {
        rig.bodyGroup.position.y = Math.sin(bobT + rig.bobOffset) * 0.025
        rig.arms[0].rotation.x = Math.sin(bobT * 0.9 + rig.bobOffset) * 0.12
        rig.arms[1].rotation.x = -Math.sin(bobT * 0.9 + rig.bobOffset) * 0.12
      }

      composer.render()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
    // Only rebuild the whole scene if the companion (and therefore their
    // world marker) changes — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companionId])

  // ---- Joystick pointer handlers (HUD overlay element, not the canvas) ----
  function joystickDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    setJoystick({ pointerId: e.pointerId, originX: rect.left + rect.width / 2, originY: rect.top + rect.height / 2, dx: 0, dy: 0 })
  }
  function joystickMove(e) {
    setJoystick((j) => {
      if (!j || j.pointerId !== e.pointerId) return j
      let dx = e.clientX - j.originX
      let dy = e.clientY - j.originY
      const d = Math.hypot(dx, dy)
      if (d > JOYSTICK_RADIUS) { dx = (dx / d) * JOYSTICK_RADIUS; dy = (dy / d) * JOYSTICK_RADIUS }
      stateRef.current.move = { x: dx / JOYSTICK_RADIUS, z: dy / JOYSTICK_RADIUS }
      return { ...j, dx, dy }
    })
  }
  function joystickUp(e) {
    setJoystick((j) => (j && j.pointerId === e.pointerId ? null : j))
    stateRef.current.move = { x: 0, z: 0 }
  }

  return (
    <div className="world-shell">
      <div ref={mountRef} className="world-canvas-mount" />

      <div className="world-hud-top">
        <button className="world-menu-btn" onClick={onOpenMenu} aria-label="Menu">☰</button>
        {hud}
      </div>

      {nearZone && (
        <div className="world-prompt">
          <span>{nearZone.label}</span>
          <button onClick={() => onEnterZoneRef.current(nearZone.action, nearZone)}>Enter →</button>
        </div>
      )}

      {nearNpc && (!npcRemark || npcRemark.npcId !== nearNpc.id) && (
        <div className="world-prompt world-prompt-npc">
          <span>{nearNpc.name}</span>
          <button onClick={() => talkToNpc(nearNpc)}>Talk</button>
        </div>
      )}

      {npcRemark && (
        <div className="world-npc-bubble">
          <span className="world-npc-bubble-name">{npcRemark.name}</span>
          <p className="world-npc-bubble-text">
            {npcRemark.loading ? '…' : npcRemark.error || `"${npcRemark.text}"`}
          </p>
        </div>
      )}

      <div
        className="world-joystick"
        data-joystick
        onPointerDown={joystickDown}
        onPointerMove={joystickMove}
        onPointerUp={joystickUp}
        onPointerCancel={joystickUp}
      >
        <div
          className="world-joystick-nub"
          style={joystick ? { transform: `translate(${joystick.dx}px, ${joystick.dy}px)` } : undefined}
        />
      </div>

      <p className="world-hint">Drag to look · move with the stick (or WASD)</p>
    </div>
  )
}
