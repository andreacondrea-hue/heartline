// Maps a card's mechanical ability effect (see battleEngine.js's EFFECT
// DISPATCH switch) to a visual effect key the 3D battle stage (see
// engine/battle/BattleScene.js) knows how to render. Deliberately a small
// shared vocabulary rather than one bespoke effect per card — many cards
// already share a mechanical effect type, so they naturally share a visual
// too, same principle the ability system itself uses.
//
// Falls back to the card's elemental `type` (fire/storm/earth/arcane, see
// data/types.js) for a plain attack with no special ability firing that
// turn, so even a "boring" hit still looks like that creature's element
// rather than a single generic effect for the whole roster.
export const EFFECT_FX = {
  bonusDamageSelf: 'slash',
  recklessBonus: 'slash',
  critFirstAction: 'slash',
  bonusIfFullHp: 'slash',
  extraStrikeSelf: 'slash',
  doubleStrike: 'slash',
  defensePierceProc: 'pierce',
  fullDefensePierce: 'pierce',
  aoe: 'shockwave',
  aoeStun: 'shockwave',
  aoeBurn: 'fire',
  stunOnHit: 'stun',
  bleedOnHit: 'poison',
  restrainOnHit: 'debuff',
  targetMissDebuff: 'debuff',
  exposeDefense: 'debuff',
  partyEnemyAtkDebuff: 'debuff',
  evasionSelf: 'buff',
  selfDefBuff: 'buff',
  partyAtkBuff: 'buff',
  tauntSelf: 'buff',
  allyAtkBuff: 'buff',
  partyHealPassive: 'heal',
  healLowestAllyPassive: 'heal'
}

const FX_BY_ELEMENT = { fire: 'fire', storm: 'lightning', earth: 'physical', arcane: 'pierce' }

export function fxForEffect(effectType, elementalType) {
  if (effectType && EFFECT_FX[effectType]) return EFFECT_FX[effectType]
  return FX_BY_ELEMENT[elementalType] || 'physical'
}

// Visual tuning per fx key: particle color, particle count, and whether the
// impact reads as "hostile" (red flash on the target) or "friendly" (soft
// glow, no shake) — heals/buffs land on your own side and shouldn't look
// like damage.
export const FX_CONFIG = {
  physical: { color: '#e7e2f5', particles: 10, friendly: false, shake: 0.12 },
  slash: { color: '#ff5a5a', particles: 16, friendly: false, shake: 0.22 },
  pierce: { color: '#c9a0ff', particles: 14, friendly: false, shake: 0.16 },
  fire: { color: '#ff8a3d', particles: 26, friendly: false, shake: 0.28 },
  lightning: { color: '#6fb3ff', particles: 20, friendly: false, shake: 0.3 },
  poison: { color: '#7fd67f', particles: 14, friendly: false, shake: 0.08 },
  stun: { color: '#ffe36b', particles: 12, friendly: false, shake: 0.1 },
  buff: { color: '#ffd35c', particles: 18, friendly: true, shake: 0 },
  debuff: { color: '#9a6fae', particles: 14, friendly: false, shake: 0.06 },
  heal: { color: '#7fd67f', particles: 20, friendly: true, shake: 0 },
  shockwave: { color: '#e08ac8', particles: 30, friendly: false, shake: 0.35 },
  miss: { color: '#8f8aa0', particles: 6, friendly: true, shake: 0 }
}
