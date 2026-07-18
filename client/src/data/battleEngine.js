// The real combat engine — actual stat math, actual per-card ability
// effects (see below), not guesswork. FirstBattle.jsx (the scripted "free
// your companion" opening mission) stays soft-scripted on purpose, since
// that's a story beat, not a fight the player should be able to lose. This
// engine is for the repeatable "Explore" encounters reachable from the hub
// once onboarding is done.
//
// Ability effects (implemented): every card's `ability` in cards.js /
// humanBond.js now carries an `effect` descriptor — `{ trigger, type, ... }`
// — that this file actually executes, replacing the earlier "flavor text
// only, one shared damage formula" version. `trigger` says WHEN an effect
// can fire:
//   - 'proc'      — a 30% per-turn chance (same odds the flavor-text
//                    version always used), replacing/augmenting that
//                    turn's attack.
//   - 'passiveModifier' — always on, folded silently into damage math or
//                    turn order (no roll, no separate log line) — e.g. a
//                    permanent +ATK while a pack member is alive.
//   - 'everyTurn'  — fires guaranteed, every one of the actor's turns, in
//                    ADDITION to their normal attack (heals, a reliable
//                    extra strike).
//   - 'onFirstAction' — fires once, guaranteed, the very first turn this
//                    combatant acts in the battle, then never again.
// `type` picks which effect actually runs — see EFFECT DISPATCH below.
// Not every type needs a bespoke code path: several cards deliberately
// share a type (e.g. two different "expose an enemy" abilities) with only
// their numbers differing, which is normal for a card game's effect
// system, not a shortcut — the point of this pass was replacing "flavor
// text, no mechanical difference at all" with "cards actually play
// differently," not hand-authoring 30 one-off functions with no shared
// vocabulary.

import { statsAtLevel } from './leveling'
import { cardsByTier } from './cards'
import { effectivenessMultiplier, effectivenessLabel } from './types'
import { fxForEffect } from './battleFx'

const MAX_ROUNDS = 30

function pickRandom(list, randomFn) {
  return list[Math.floor(randomFn() * list.length)]
}

// Builds an independent, battle-ready combatant snapshot from a card entry.
// `side` is 'player' or 'enemy'. Stats are frozen at battle start (a card's
// level doesn't change mid-fight even if it takes damage/acts). `status`
// holds every timed buff/debuff/DOT/stun/taunt this combatant can carry —
// durations count down on THIS combatant's own turns (see resolveActorTurn),
// regardless of who granted the effect.
export function makeCombatant(card, level, side) {
  const stats = statsAtLevel(card.stats, level)
  return {
    cardId: card.id,
    name: card.name,
    image: card.image,
    emoji: card.emoji,
    ability: card.ability,
    race: card.race,
    type: card.type,
    level,
    side,
    maxHp: stats.hp,
    hp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    hasActedOnce: false,
    status: {
      evasionChance: 0, evasionTurns: 0,
      missChance: 0, missTurns: 0,
      defMod: 1, defModTurns: 0,
      atkMod: 1, atkModTurns: 0,
      dotDamage: 0, dotTurns: 0,
      stunnedTurns: 0,
      tauntTurns: 0
    }
  }
}

// A simple wild encounter: 1-2 common/uncommon animal cards, leveled
// roughly around the player's average party level so early fights stay
// approachable. No story/region context yet — that's future scope once
// there's an actual open-world map to draw encounters from.
export function generateEncounter(avgPlayerLevel, randomFn = Math.random) {
  const enemyCount = randomFn() < 0.6 ? 1 : 2
  const pool = [...cardsByTier('common'), ...cardsByTier('uncommon')]
  const enemies = []
  for (let i = 0; i < enemyCount; i++) {
    const card = pickRandom(pool, randomFn)
    const level = Math.max(1, Math.min(100, Math.round(avgPlayerLevel + (randomFn() * 5 - 2))))
    enemies.push(makeCombatant(card, level, 'enemy'))
  }
  return enemies
}

function livingCombatants(combatants, side) {
  return combatants.filter((c) => c.side === side && c.hp > 0)
}

// A handful of abilities are permanently-on modifiers rather than
// something that "procs" — folded straight into the attack math so they
// apply on every hit that combatant lands, not just when their ability
// happens to trigger.
function passiveAtkMultiplier(actor, combatants) {
  const effect = actor.ability?.effect
  if (!effect || effect.trigger !== 'passiveModifier') return 1
  if (effect.type === 'packBonus') {
    const hasAnimalAlly = combatants.some(
      (c) => c !== actor && c.side === actor.side && c.hp > 0 && c.race === 'animal'
    )
    return hasAnimalAlly ? effect.multiplier : 1
  }
  if (effect.type === 'lowHpBonusDamage') {
    return actor.hp / actor.maxHp <= effect.threshold ? effect.multiplier : 1
  }
  return 1
}

// Diminishing-returns defense formula (higher DEF gives real but bounded
// mitigation) plus +/-15% variance so fights aren't perfectly predictable.
// `opts.multiplier` scales raw damage (bonus/AoE-reduced hits), `opts.pierce`
// ignores a fraction of the defender's (post-debuff) DEF, and
// `opts.ignoreDefense` ignores all of it (a full-pierce ability). Also
// folds in the elemental type-effectiveness multiplier (see data/types.js) —
// applied on top of everything else, same as ability-driven multipliers,
// so a super-effective bonus-damage ability hits even harder rather than
// the two systems fighting each other. Returns both the final damage AND
// the type multiplier (so callers can print "super effective!" in the log).
function computeDamage(attacker, defender, randomFn, combatants, opts = {}) {
  const multiplier = opts.multiplier ?? 1
  const pierce = opts.pierce ?? 0
  const rawDef = opts.ignoreDefense ? 0 : defender.def * defender.status.defMod
  const effectiveDef = rawDef * (1 - pierce)
  const mitigation = effectiveDef / (effectiveDef + 50)
  const variance = 0.85 + randomFn() * 0.3
  const typeMult = effectivenessMultiplier(attacker.type, defender.type)
  const atk = attacker.atk * attacker.status.atkMod * passiveAtkMultiplier(attacker, combatants)
  const dmg = Math.max(1, Math.round(atk * multiplier * (1 - mitigation) * variance * typeMult))
  return { dmg, typeMult }
}

// Self-inflicted miss (e.g. from a "distract" debuff) is checked before the
// target's own evasion buff — either can independently cause a whiffed hit.
function rollsMiss(attacker, defender, randomFn) {
  if (attacker.status.missChance > 0 && randomFn() < attacker.status.missChance) return 'attacker'
  if (defender.status.evasionChance > 0 && randomFn() < defender.status.evasionChance) return 'defender'
  return null
}

function hitLine(actor, target, dmg, abilityName, typeMult) {
  const verb = abilityName ? ` uses ${abilityName} on ` : ' attacks '
  const effLabel = effectivenessLabel(typeMult)
  const effText = effLabel ? ` ${effLabel}` : ''
  const tail = target.hp <= 0 ? ` — ${target.name} is knocked out!` : ` (${target.hp}/${target.maxHp} HP left)`
  return `${actor.name}${verb}${target.name} for ${dmg} damage${effText}${tail}`
}

// Resolves everything that happens on one combatant's turn: their own
// status ticking (bleed damage, stun consuming the turn, buff/debuff
// countdowns), any guaranteed 'everyTurn' effect, then whichever 'proc' or
// 'onFirstAction' ability effect (if any) fires this turn, falling back to
// a plain attack otherwise.
function resolveActorTurn(actor, combatants, log, randomFn) {
  const st = actor.status

  // ---- this combatant's own status, ticked at the start of THEIR turn ----
  if (st.dotTurns > 0) {
    const dmg = st.dotDamage
    actor.hp = Math.max(0, actor.hp - dmg)
    st.dotTurns -= 1
    if (st.dotTurns <= 0) st.dotDamage = 0
    const tail = actor.hp <= 0 ? ` — ${actor.name} is knocked out!` : ` (${actor.hp}/${actor.maxHp} HP left)`
    log.push({
      type: 'action', text: `${actor.name} takes ${dmg} bleed damage${tail}`,
      kind: 'dot', fx: 'poison', actorId: actor.cardId, dmg,
      targetHpAfter: actor.hp, targetMaxHp: actor.maxHp, ko: actor.hp <= 0
    })
    if (actor.hp <= 0) return
  }

  if (st.stunnedTurns > 0) {
    st.stunnedTurns -= 1
    log.push({ type: 'action', text: `${actor.name} is stunned and can't act this turn!`, kind: 'stunned', fx: 'stun', actorId: actor.cardId })
    return
  }

  if (st.evasionTurns > 0) { st.evasionTurns -= 1; if (st.evasionTurns === 0) st.evasionChance = 0 }
  if (st.missTurns > 0) { st.missTurns -= 1; if (st.missTurns === 0) st.missChance = 0 }
  if (st.defModTurns > 0) { st.defModTurns -= 1; if (st.defModTurns === 0) st.defMod = 1 }
  if (st.atkModTurns > 0) { st.atkModTurns -= 1; if (st.atkModTurns === 0) st.atkMod = 1 }
  if (st.tauntTurns > 0) st.tauntTurns -= 1

  const opposingSide = actor.side === 'player' ? 'enemy' : 'player'
  const alliedSide = actor.side
  const targets = livingCombatants(combatants, opposingSide)

  function pickTarget(pool) {
    // A live taunt (dwarf-warrior's Honor Guard) overrides the usual
    // "focus lowest HP%" targeting — every attacker in `pool` must go
    // after the taunter instead.
    const taunters = pool.filter((t) => t.status.tauntTurns > 0)
    const priority = taunters.length > 0 ? taunters : pool
    return priority.reduce((lowest, t) => (t.hp / t.maxHp < lowest.hp / lowest.maxHp ? t : lowest), priority[0])
  }

  function singleAttack(target, opts = {}) {
    const effectType = actor.ability?.effect?.type || null
    const miss = rollsMiss(actor, target, randomFn)
    if (miss) {
      log.push({
        type: 'action',
        text: miss === 'attacker'
          ? `${actor.name}'s attack goes wide and misses ${target.name}!`
          : `${target.name} dodges ${actor.name}'s attack!`,
        kind: 'miss', fx: 'miss', hit: false, dmg: 0,
        actorId: actor.cardId, actorType: actor.type, targetId: target.cardId, effectType
      })
      return { hit: false, dmg: 0 }
    }
    const { dmg, typeMult } = computeDamage(actor, target, randomFn, combatants, opts)
    target.hp = Math.max(0, target.hp - dmg)
    log.push({
      type: 'action', text: hitLine(actor, target, dmg, opts.abilityName, typeMult),
      kind: 'attack', fx: fxForEffect(effectType, actor.type), hit: true, dmg, typeMult,
      actorId: actor.cardId, actorType: actor.type, targetId: target.cardId, effectType,
      targetHpAfter: target.hp, targetMaxHp: target.maxHp, ko: target.hp <= 0
    })
    return { hit: true, dmg }
  }

  const effect = actor.ability?.effect

  // ---- guaranteed, every-turn effects (heals / a reliable extra strike) ----
  // These happen ALONGSIDE the turn's normal attack, not instead of it.
  if (effect?.trigger === 'everyTurn') {
    if (effect.type === 'partyHealPassive') {
      const healAmt = Math.max(1, Math.round(actor.maxHp * effect.healFraction))
      const hurt = livingCombatants(combatants, alliedSide).filter((a) => a.hp < a.maxHp)
      hurt.forEach((a) => { a.hp = Math.min(a.maxHp, a.hp + healAmt) })
      if (hurt.length > 0) {
        log.push({
          type: 'action', text: `${actor.name}'s ${actor.ability.name} tends the party's wounds for ${healAmt} HP each.`,
          kind: 'heal', fx: 'heal', actorId: actor.cardId, targetIds: hurt.map((a) => a.cardId), healAmt, effectType: effect.type
        })
      }
    } else if (effect.type === 'healLowestAllyPassive') {
      const hurt = livingCombatants(combatants, alliedSide).filter((a) => a.hp < a.maxHp)
      if (hurt.length > 0) {
        const target = hurt.reduce((lowest, a) => (a.hp / a.maxHp < lowest.hp / lowest.maxHp ? a : lowest), hurt[0])
        const healAmt = Math.max(1, Math.round(actor.maxHp * effect.healFraction))
        target.hp = Math.min(target.maxHp, target.hp + healAmt)
        log.push({
          type: 'action', text: `${actor.name} uses ${actor.ability.name}, healing ${target.name} for ${healAmt} HP.`,
          kind: 'heal', fx: 'heal', actorId: actor.cardId, targetId: target.cardId, healAmt, effectType: effect.type,
          targetHpAfter: target.hp, targetMaxHp: target.maxHp
        })
      }
    } else if (effect.type === 'extraStrikeSelf' && targets.length > 0) {
      singleAttack(pickTarget(targets), { multiplier: effect.multiplier, abilityName: actor.ability.name })
    }
  }

  if (targets.length === 0) return

  let activeEffect = null
  if (effect && effect.trigger === 'onFirstAction' && !actor.hasActedOnce) {
    activeEffect = effect
  } else if (effect && effect.trigger === 'proc' && randomFn() < 0.3) {
    activeEffect = effect
  }
  actor.hasActedOnce = true

  if (!activeEffect) {
    singleAttack(pickTarget(targets))
    return
  }

  // ---- EFFECT DISPATCH: the 'proc'/'onFirstAction' ability that fires this turn ----
  switch (activeEffect.type) {
    // -- damage-modifying effects: replace/augment the single attack --
    case 'bonusDamageSelf':
      singleAttack(pickTarget(targets), { multiplier: activeEffect.multiplier, abilityName: actor.ability.name })
      break

    case 'defensePierceProc':
      singleAttack(pickTarget(targets), { pierce: activeEffect.pierce, abilityName: actor.ability.name })
      break

    case 'fullDefensePierce':
      singleAttack(pickTarget(targets), { ignoreDefense: true, abilityName: actor.ability.name })
      break

    case 'bonusIfFullHp': {
      const target = pickTarget(targets)
      const multiplier = target.hp === target.maxHp ? activeEffect.multiplier : 1
      singleAttack(target, { multiplier, abilityName: actor.ability.name })
      break
    }

    case 'critFirstAction':
      singleAttack(pickTarget(targets), { multiplier: activeEffect.multiplier, abilityName: actor.ability.name })
      break

    case 'recklessBonus': {
      singleAttack(pickTarget(targets), { multiplier: activeEffect.multiplier, abilityName: actor.ability.name })
      st.defMod = activeEffect.selfDefMultiplier
      st.defModTurns = activeEffect.duration
      log.push({ type: 'action', text: `${actor.name}'s reckless swing leaves their own defense lowered!`, kind: 'debuff', fx: 'debuff', actorId: actor.cardId })
      break
    }

    case 'stunOnHit': {
      const target = pickTarget(targets)
      const { hit } = singleAttack(target, { abilityName: actor.ability.name })
      if (hit && target.hp > 0 && randomFn() < activeEffect.chance) {
        target.status.stunnedTurns = Math.max(target.status.stunnedTurns, activeEffect.duration)
        log.push({ type: 'action', text: `${target.name} is stunned and will miss their next turn!`, kind: 'stun', fx: 'stun', actorId: actor.cardId, targetId: target.cardId })
      }
      break
    }

    case 'bleedOnHit': {
      const target = pickTarget(targets)
      const { hit } = singleAttack(target, { abilityName: actor.ability.name })
      if (hit && target.hp > 0) {
        target.status.dotDamage = Math.max(1, Math.round(actor.atk * activeEffect.dotMultiplier))
        target.status.dotTurns = activeEffect.duration
        log.push({ type: 'action', text: `${target.name} is bleeding!`, kind: 'poison', fx: 'poison', actorId: actor.cardId, targetId: target.cardId })
      }
      break
    }

    case 'restrainOnHit': {
      const target = pickTarget(targets)
      const { hit } = singleAttack(target, { abilityName: actor.ability.name })
      if (hit && target.hp > 0) {
        target.status.atkMod = activeEffect.atkMultiplier
        target.status.atkModTurns = activeEffect.duration
        log.push({ type: 'action', text: `${target.name} is pinned down, their attacks weakened!`, kind: 'debuff', fx: 'debuff', actorId: actor.cardId, targetId: target.cardId })
      }
      break
    }

    case 'doubleStrike': {
      let target = pickTarget(targets)
      singleAttack(target, { abilityName: actor.ability.name })
      if (target.hp <= 0) {
        const remaining = livingCombatants(combatants, opposingSide)
        if (remaining.length === 0) break
        target = pickTarget(remaining)
      }
      singleAttack(target, { abilityName: actor.ability.name })
      break
    }

    case 'aoe': {
      const aoeTargets = livingCombatants(combatants, opposingSide)
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, striking every enemy!`, kind: 'cast', fx: 'shockwave', actorId: actor.cardId, targetIds: aoeTargets.map((t) => t.cardId), effectType: activeEffect.type })
      aoeTargets.forEach((target) => {
        singleAttack(target, { multiplier: activeEffect.multiplier })
      })
      break
    }

    case 'aoeBurn': {
      const aoeTargets = livingCombatants(combatants, opposingSide)
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, engulfing every enemy in flame!`, kind: 'cast', fx: 'fire', actorId: actor.cardId, targetIds: aoeTargets.map((t) => t.cardId), effectType: activeEffect.type })
      aoeTargets.forEach((target) => {
        const { hit } = singleAttack(target, { multiplier: activeEffect.multiplier })
        if (hit && target.hp > 0) {
          target.status.dotDamage = Math.max(1, Math.round(actor.atk * activeEffect.dotMultiplier))
          target.status.dotTurns = activeEffect.dotDuration
        }
      })
      break
    }

    case 'aoeStun': {
      const aoeTargets = livingCombatants(combatants, opposingSide)
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, striking every enemy!`, kind: 'cast', fx: 'shockwave', actorId: actor.cardId, targetIds: aoeTargets.map((t) => t.cardId), effectType: activeEffect.type })
      aoeTargets.forEach((target) => {
        const { hit } = singleAttack(target, { multiplier: activeEffect.multiplier })
        if (hit && target.hp > 0 && randomFn() < activeEffect.stunChance) {
          target.status.stunnedTurns = Math.max(target.status.stunnedTurns, activeEffect.duration)
          log.push({ type: 'action', text: `${target.name} is stunned!`, kind: 'stun', fx: 'stun', actorId: actor.cardId, targetId: target.cardId })
        }
      })
      break
    }

    // -- utility effects: a normal single attack, PLUS a buff/debuff side effect --
    case 'evasionSelf':
      st.evasionChance = activeEffect.chance
      st.evasionTurns = activeEffect.duration
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, poised to dodge!`, kind: 'buff', fx: 'buff', actorId: actor.cardId, effectType: activeEffect.type })
      singleAttack(pickTarget(targets))
      break

    case 'selfDefBuff':
      st.defMod = activeEffect.multiplier
      st.defModTurns = activeEffect.duration
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, bracing defensively!`, kind: 'buff', fx: 'buff', actorId: actor.cardId, effectType: activeEffect.type })
      singleAttack(pickTarget(targets))
      break

    case 'targetMissDebuff': {
      const target = pickTarget(targets)
      target.status.missChance = activeEffect.chance
      target.status.missTurns = activeEffect.duration
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name} on ${target.name}, throwing off their aim!`, kind: 'debuff', fx: 'debuff', actorId: actor.cardId, targetId: target.cardId, effectType: activeEffect.type })
      singleAttack(target)
      break
    }

    case 'exposeDefense': {
      const target = pickTarget(targets)
      target.status.defMod = Math.min(target.status.defMod, 1 - activeEffect.reduction)
      target.status.defModTurns = Math.max(target.status.defModTurns, activeEffect.duration)
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, exposing ${target.name}'s weak points!`, kind: 'debuff', fx: 'debuff', actorId: actor.cardId, targetId: target.cardId, effectType: activeEffect.type })
      singleAttack(target)
      break
    }

    case 'partyAtkBuff': {
      const allies = livingCombatants(combatants, alliedSide)
      allies.forEach((ally) => {
        ally.status.atkMod = activeEffect.multiplier
        ally.status.atkModTurns = activeEffect.duration
      })
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, rallying the whole party's attack!`, kind: 'buff', fx: 'buff', actorId: actor.cardId, targetIds: allies.map((a) => a.cardId), effectType: activeEffect.type })
      singleAttack(pickTarget(targets))
      break
    }

    case 'partyEnemyAtkDebuff': {
      const enemies = livingCombatants(combatants, opposingSide)
      enemies.forEach((enemy) => {
        enemy.status.atkMod = activeEffect.multiplier
        enemy.status.atkModTurns = activeEffect.duration
      })
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, intimidating every enemy!`, kind: 'debuff', fx: 'debuff', actorId: actor.cardId, targetIds: enemies.map((e) => e.cardId), effectType: activeEffect.type })
      singleAttack(pickTarget(targets))
      break
    }

    case 'tauntSelf':
      st.tauntTurns = activeEffect.duration
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, daring every enemy to target them!`, kind: 'buff', fx: 'buff', actorId: actor.cardId, effectType: activeEffect.type })
      singleAttack(pickTarget(targets))
      break

    case 'allyAtkBuff': {
      const allies = livingCombatants(combatants, alliedSide).filter((a) => a !== actor)
      const beneficiary = allies.length > 0 ? pickRandom(allies, randomFn) : actor
      beneficiary.status.atkMod = activeEffect.multiplier
      beneficiary.status.atkModTurns = activeEffect.duration
      log.push({ type: 'action', text: `${actor.name} uses ${actor.ability.name}, empowering ${beneficiary.name}!`, kind: 'buff', fx: 'buff', actorId: actor.cardId, targetId: beneficiary.cardId, effectType: activeEffect.type })
      singleAttack(pickTarget(targets))
      break
    }

    default:
      singleAttack(pickTarget(targets))
  }
}

// Runs a full battle to completion in one pass (no mid-battle player
// decisions yet — that's a natural next step once this foundation is in).
// Returns a replayable `log` (an array of round markers + narrated action
// entries) and the final `result`: 'win' | 'lose'.
export function runBattle(playerCombatants, enemyCombatants, randomFn = Math.random) {
  const combatants = [...playerCombatants, ...enemyCombatants]
  // Turn order by speed, fixed for the whole battle (no mid-fight speed
  // changes in this version) — except a 'priorityFirst' passive (Hawk's
  // Dive) always sorts ahead of everyone else regardless of SPD.
  const order = [...combatants].sort((a, b) => {
    const aFirst = a.ability?.effect?.type === 'priorityFirst' ? 1 : 0
    const bFirst = b.ability?.effect?.type === 'priorityFirst' ? 1 : 0
    if (aFirst !== bFirst) return bFirst - aFirst
    return b.spd - a.spd
  })
  const log = []

  let round = 1
  while (round <= MAX_ROUNDS) {
    if (livingCombatants(combatants, 'player').length === 0) break
    if (livingCombatants(combatants, 'enemy').length === 0) break

    log.push({ type: 'round', round })

    for (const actor of order) {
      if (actor.hp <= 0) continue
      resolveActorTurn(actor, combatants, log, randomFn)
      if (livingCombatants(combatants, 'player').length === 0) break
      if (livingCombatants(combatants, 'enemy').length === 0) break
    }
    round += 1
  }

  const playerAlive = livingCombatants(combatants, 'player')
  const enemyAlive = livingCombatants(combatants, 'enemy')
  let result
  if (playerAlive.length > 0 && enemyAlive.length === 0) {
    result = 'win'
  } else if (enemyAlive.length > 0 && playerAlive.length === 0) {
    result = 'lose'
  } else {
    // Hit the round cap without a clean knockout — whoever has more
    // remaining HP% overall is judged the winner.
    const pct = (side) =>
      combatants.filter((c) => c.side === side).reduce((sum, c) => sum + c.hp / c.maxHp, 0)
    result = pct('player') >= pct('enemy') ? 'win' : 'lose'
  }

  return { log, result, combatants }
}

// Reward formulas — deliberately simple and separate from the gold-training
// costs in leveling.js. Winning nets real gold plus a solid xp chunk per
// party card that fought; losing still grants a small consolation xp so a
// loss isn't pure downside for a new player still building their roster.
export function battleRewards(enemyCombatants, result) {
  if (result === 'win') {
    const gold = enemyCombatants.reduce((sum, e) => sum + 8 + e.level * 2, 0)
    return { gold, xpPerCard: 50 }
  }
  return { gold: 0, xpPerCard: 15 }
}
