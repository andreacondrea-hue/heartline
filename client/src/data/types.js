// Lightweight elemental/type-matchup layer — the single biggest structural
// gap versus creature-collector peers identified in COMPETITIVE_ANALYSIS.md
// §2/§6. Deliberately small (4 types, one cyclic advantage wheel) rather
// than a full Pokémon-style chart: the goal is closing the "no counter-pick
// layer at all" gap without turning team-building into a spreadsheet.
//
// Every card in cards.js and humanBond.js now carries a `type` (distinct
// from the pre-existing mechanical `ability.effect.type`, which is unrelated
// — that one picks which ability effect fires, this one is the elemental
// identity used only for the damage multiplier below).

export const TYPES = ['fire', 'storm', 'earth', 'arcane']

export const TYPE_LABELS = {
  fire: 'Fire',
  storm: 'Storm',
  earth: 'Earth',
  arcane: 'Arcane'
}

export const TYPE_EMOJI = {
  fire: '🔥',
  storm: '⚡',
  earth: '🪨',
  arcane: '✨'
}

export const TYPE_COLORS = {
  fire: '#e0653a',
  storm: '#4a90d9',
  earth: '#a3813f',
  arcane: '#a55fd6'
}

// Cyclic advantage wheel: fire > earth > storm > arcane > fire. Each type
// is super effective (1.3x) against the one it beats, and not very
// effective (0.75x) against the one that beats it. Same type vs. same type
// (or anything without a type, e.g. a future untyped card) is neutral.
const BEATS = { fire: 'earth', earth: 'storm', storm: 'arcane', arcane: 'fire' }

export function effectivenessMultiplier(attackerType, defenderType) {
  if (!attackerType || !defenderType || attackerType === defenderType) return 1
  if (BEATS[attackerType] === defenderType) return 1.3
  if (BEATS[defenderType] === attackerType) return 0.75
  return 1
}

// Battle-log flavor text for a computed multiplier — null means "don't
// bother printing anything" (neutral matchup).
export function effectivenessLabel(multiplier) {
  if (multiplier > 1) return "It's super effective!"
  if (multiplier < 1) return "It's not very effective..."
  return null
}
