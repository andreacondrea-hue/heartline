// Card leveling (1-100). This is the "exact curve TBD" from DESIGN_DOC.md
// §10, now implemented. There's no real battle engine yet (battles are
// still soft-scripted, see FirstBattle.jsx), so the only XP source for now
// is spending gold to "train" a card directly at the Collection screen —
// this is a real, working leveling system on its own, and slots in cleanly
// as an additional XP source (mission/battle rewards) once a real combat
// engine exists later.

export const MAX_LEVEL = 100

// XP needed to go from `level` to `level + 1`. Deliberately gentle at low
// levels (1-2 training clicks per level early on) and steeper late, so
// hitting 100 is a real long-term goal rather than an afternoon's grinding.
export function xpToNextLevel(level) {
  return Math.round(15 * level + 10)
}

// Total XP a card needs to have EARNED to be sitting at `level` (i.e. the
// cumulative sum of xpToNextLevel for every level below it). Used to render
// an absolute progress bar from a card's total accumulated xp.
export function cumulativeXpForLevel(level) {
  let total = 0
  for (let l = 1; l < level; l++) total += xpToNextLevel(l)
  return total
}

// Gold cost of one "training" action at the card's current level/tier.
// Higher-tier cards cost more to train at the same level — a Legendary
// card's time is worth more than a Common's.
const TIER_COST_MULTIPLIER = {
  common: 1,
  uncommon: 1.5,
  rare: 2.5,
  superRare: 4,
  legendary: 7,
  godTier: 12
}

export function trainingCost(card, level) {
  const mult = TIER_COST_MULTIPLIER[card.tier] || 1
  return Math.round((10 + level * 4) * mult)
}

// Flat XP granted per training action, regardless of level/tier — keeps
// the cost curve (above) as the only thing that scales, so the mechanic
// stays easy to reason about.
export const TRAINING_XP_GAIN = 40

// Applies `xpGain` to a card's accumulated xp and rolls it up into as many
// level-ups as it earns (capped at MAX_LEVEL, no xp banked past the cap).
// Returns { level, xp } — xp is the remainder still needed toward the next
// level (or 0 once MAX_LEVEL is hit).
export function applyXpGain(currentLevel, currentXp, xpGain) {
  let level = currentLevel
  let xp = currentXp + xpGain
  while (level < MAX_LEVEL) {
    const needed = xpToNextLevel(level)
    if (xp < needed) break
    xp -= needed
    level += 1
  }
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL
    xp = 0
  }
  return { level, xp }
}

// Scales a card's level-1 base stats up for its current level. Linear
// growth, +3% of the base value per level above 1, so a level-100 card is
// roughly ~4x its level-1 stats — a meaningful payoff without needing an
// exponential curve that would make low-level cards feel worthless.
export function statsAtLevel(baseStats, level) {
  const multiplier = 1 + (level - 1) * 0.03
  return {
    atk: Math.round(baseStats.atk * multiplier),
    def: Math.round(baseStats.def * multiplier),
    spd: Math.round(baseStats.spd * multiplier),
    hp: Math.round(baseStats.hp * multiplier),
    role: baseStats.role
  }
}
