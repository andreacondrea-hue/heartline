import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildBattleScene, createFxManager } from '../engine/battle/BattleScene'
import { FX_CONFIG } from '../data/battleFx'

// How long each step type holds on screen before advancing to the next
// one. Bigger multi-target effects (aoe casts) linger a touch longer so
// the burst reads before the per-target hit lines start firing.
const STEP_DURATION = {
  attack: 950, cast: 900, heal: 900, buff: 800, debuff: 800,
  dot: 700, stun: 750, stunned: 700, miss: 750
}

// Plays back an already-fully-computed battle (see data/battleEngine.js —
// results are deterministic and instant; this only controls PACING and
// visuals) as a 3D scene: each card is the existing 2D card art on a
// billboard, and every ability activation triggers a matching particle
// burst (see data/battleFx.js) plus a lunge/flash/shake on the actor and
// target. Never recomputes or alters the outcome — it's a viewer, not a
// second engine.
export default function BattleStage3D({ combatants, steps, onDone }) {
  const mountRef = useRef(null)
  const sceneApiRef = useRef(null)
  const skippedRef = useRef(false)

  const [hp, setHp] = useState(() => {
    const m = {}
    combatants.forEach((c) => { m[c.cardId] = { hp: c.maxHp, maxHp: c.maxHp } })
    return m
  })
  const [caption, setCaption] = useState('')
  const [round, setRound] = useState(1)
  const [finished, setFinished] = useState(false)

  // ---- three.js scene: built once per battle, driven imperatively by the
  // step-playback effect below via sceneApiRef so the scene never rebuilds
  // mid-battle. ----
  useEffect(() => {
    const mount = mountRef.current
    const { scene, cardMeshes } = buildBattleScene(
      combatants.filter((c) => c.side === 'player'),
      combatants.filter((c) => c.side === 'enemy')
    )
    const fx = createFxManager(scene)

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100)
    const baseCamPos = new THREE.Vector3(0, 6.6, 8.6)
    camera.position.copy(baseCamPos)
    camera.lookAt(0, 1.1, -0.6)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    function resize() {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', resize)

    let raf
    let last = performance.now()
    let shakeTime = 0
    let shakeMag = 0

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      cardMeshes.forEach(({ group, basePos }) => {
        group.position.y = basePos.y + Math.sin(now / 600 + basePos.x) * 0.05
        // Billboard each card to face the camera exactly — these are flat
        // planes, and the camera sits elevated looking down at an angle,
        // so without this they render as keystoned trapezoids instead of
        // clean rectangles.
        group.quaternion.copy(camera.quaternion)
      })

      if (shakeTime > 0) {
        shakeTime = Math.max(0, shakeTime - dt)
        camera.position.set(
          baseCamPos.x + (Math.random() - 0.5) * shakeMag,
          baseCamPos.y + (Math.random() - 0.5) * shakeMag,
          baseCamPos.z + (Math.random() - 0.5) * shakeMag
        )
      } else {
        camera.position.copy(baseCamPos)
      }

      fx.update(dt)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    sceneApiRef.current = {
      lunge(cardId) {
        const c = cardMeshes.get(cardId)
        if (!c) return
        const dir = -Math.sign(c.basePos.z) || 1
        c.group.position.z = c.basePos.z + dir * 0.9
        setTimeout(() => { c.group.position.z = c.basePos.z }, 260)
      },
      flash(cardId) {
        const c = cardMeshes.get(cardId)
        if (!c) return
        c.mesh.material.color.setHex(0xff5a5a)
        setTimeout(() => { c.mesh.material.color.setHex(c.baseColor) }, 180)
      },
      glowPulse(cardId) {
        const c = cardMeshes.get(cardId)
        if (!c) return
        c.glow.material.opacity = 0.85
        setTimeout(() => { c.glow.material.opacity = 0.4 }, 320)
      },
      fadeKO(cardId) {
        const c = cardMeshes.get(cardId)
        if (!c) return
        c.mesh.material.opacity = 0.25
        c.glow.material.opacity = 0.05
        c.group.rotation.z = 0.35
      },
      burst(cardId, fxKey) {
        const c = cardMeshes.get(cardId)
        if (!c) return
        const cfg = FX_CONFIG[fxKey] || FX_CONFIG.physical
        fx.spawnBurst(c.group.position, cfg.color, cfg.particles)
      },
      shake(mag) { shakeTime = 0.28; shakeMag = mag }
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      fx.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      sceneApiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Step playback: advances through the precomputed log on a timer.
  useEffect(() => {
    if (finished) return
    let cancelled = false
    let i = -1

    function finish() {
      if (cancelled) return
      setFinished(true)
      onDone()
    }

    function playNext() {
      if (cancelled || skippedRef.current) return
      i += 1
      if (i >= steps.length) { finish(); return }
      const step = steps[i]

      if (step.type === 'round') {
        setRound(step.round)
        setTimeout(playNext, 450)
        return
      }

      setCaption(step.text)
      const api = sceneApiRef.current
      const cfg = FX_CONFIG[step.fx] || FX_CONFIG.physical

      if (api && step.actorId) {
        if (cfg.friendly) api.glowPulse(step.actorId)
        else api.lunge(step.actorId)

        setTimeout(() => {
          if (cancelled) return
          const targets = step.targetIds || (step.targetId ? [step.targetId] : [step.actorId])
          targets.forEach((tid) => {
            api.burst(tid, step.fx)
            if (!cfg.friendly) api.flash(tid)
            else api.glowPulse(tid)
          })
          if (cfg.shake) api.shake(cfg.shake)

          setHp((prev) => {
            const next = { ...prev }
            if (step.targetId && step.targetHpAfter !== undefined) {
              next[step.targetId] = { hp: step.targetHpAfter, maxHp: step.targetMaxHp ?? prev[step.targetId]?.maxHp }
            }
            if (step.kind === 'dot' && step.actorId && step.targetHpAfter !== undefined) {
              next[step.actorId] = { hp: step.targetHpAfter, maxHp: step.targetMaxHp ?? prev[step.actorId]?.maxHp }
            }
            return next
          })
          if (step.ko) {
            const koId = step.kind === 'dot' ? step.actorId : step.targetId
            if (koId) api.fadeKO(koId)
          }
        }, 240)
      }

      const duration = STEP_DURATION[step.kind] || 800
      setTimeout(playNext, duration)
    }

    const kickoff = setTimeout(playNext, 350)
    return () => { cancelled = true; clearTimeout(kickoff) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function skip() {
    skippedRef.current = true
    setHp(() => {
      const m = {}
      combatants.forEach((c) => { m[c.cardId] = { hp: c.hp, maxHp: c.maxHp } })
      return m
    })
    setFinished(true)
    onDone()
  }

  return (
    <div className="battle-stage3d">
      <div ref={mountRef} className="battle-stage3d-mount" />

      <div className="battle-stage3d-round">Round {round}</div>

      <div className="battle-stage3d-hpbars">
        <div className="battle-stage3d-hpgroup">
          {combatants.filter((c) => c.side === 'player').map((c) => (
            <HpBar key={c.cardId} c={c} hp={hp[c.cardId]} />
          ))}
        </div>
        <div className="battle-stage3d-hpgroup battle-stage3d-hpgroup-enemy">
          {combatants.filter((c) => c.side === 'enemy').map((c) => (
            <HpBar key={c.cardId} c={c} hp={hp[c.cardId]} />
          ))}
        </div>
      </div>

      {caption && <div className="battle-stage3d-caption">{caption}</div>}

      {!finished && (
        <button className="battle-stage3d-skip" onClick={skip}>Skip ⏭</button>
      )}
    </div>
  )
}

function HpBar({ c, hp }) {
  const cur = hp?.hp ?? c.maxHp
  const max = hp?.maxHp ?? c.maxHp
  const pct = Math.max(0, Math.min(100, (cur / max) * 100))
  const low = pct <= 25
  return (
    <div className="battle-stage3d-hp">
      <span className="battle-stage3d-hp-name">{c.name}</span>
      <div className="battle-stage3d-hp-track">
        <div className={`battle-stage3d-hp-fill${low ? ' battle-stage3d-hp-low' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
