// Humans as an evolving, recruited-not-bought race — see DESIGN_DOC.md §7.
// Per the original brief humans could "evolve up to Super Rare" and be
// tradeable/sellable the same way other races are; the "bought as slaves"
// framing was refused and reworked into a bond/contract mechanic instead —
// a human ally joins because you ask and they agree, not because you
// purchase them. That's why recruitment below (see HumanRecruitment.jsx)
// is a simple consensual "will you travel with me?" ask, not a battle you
// win them in or a pack pull.
//
// Unlike every other race, a human's TIER isn't fixed on the card — it
// starts at Common and evolves upward (Common -> Uncommon -> Rare ->
// Super Rare, capping there) as you spend "bond points" with them, on top
// of the normal 1-100 level/xp system every card already has (see
// leveling.js). Evolving is a stat-tier jump; leveling within a tier is
// the same gradual +3%/level curve as everything else.

export const TIER_ORDER = ['common', 'uncommon', 'rare', 'superRare']

// Bond points needed to evolve FROM this tier to the next. No entry for
// 'superRare' since that's the cap — matches "capping out at Super Rare"
// in DESIGN_DOC.md §7.
export const BOND_THRESHOLDS = {
  common: 100,
  uncommon: 250,
  rare: 500
}

export function nextTier(tier) {
  const i = TIER_ORDER.indexOf(tier)
  if (i === -1 || i === TIER_ORDER.length - 1) return tier
  return TIER_ORDER[i + 1]
}

// Flat bond points granted per "spend time together" action, and its gold
// cost at a given tier — mirrors the training-cost pattern in leveling.js
// (a flat gain, a cost that scales with how far along this human already
// is) so the two systems feel consistent side by side in the Collection UI.
export const BOND_POINT_GAIN = 20

const TIER_BOND_COST_MULTIPLIER = { common: 1, uncommon: 2, rare: 4, superRare: 0 }

export function bondCost(tier) {
  return Math.round(25 * (TIER_BOND_COST_MULTIPLIER[tier] ?? 1))
}

// Base stats PER TIER (this is what "evolving" actually changes — the next
// tier's numbers, not a multiplier on the old ones, same as how the fixed-
// tier races jump between rarities). Roughly matched to the other races'
// stat bands at each tier so a human doesn't feel over/under-tuned next to
// an orc or dwarf of the same rarity.
export const HUMANS = [
  {
    id: 'toren',
    name: 'Toren Ashfield',
    tagline: 'An ex-soldier turned sellsword — trusts actions over words.',
    emoji: '🗡️',
    image: '/cards/toren.jpg',
    type: 'earth',
    ability: {
      name: 'Steady Blade',
      desc: 'A reliable, consistent extra strike',
      effect: { trigger: 'everyTurn', type: 'extraStrikeSelf', multiplier: 0.5 }
    },
    statsByTier: {
      common: { atk: 24, def: 20, spd: 28, hp: 90, role: 'attacker' },
      uncommon: { atk: 58, def: 50, spd: 40, hp: 150, role: 'attacker' },
      rare: { atk: 82, def: 62, spd: 48, hp: 220, role: 'attacker' },
      superRare: { atk: 98, def: 85, spd: 55, hp: 280, role: 'attacker' }
    }
  },
  {
    id: 'mira',
    name: 'Mira Calloway',
    tagline: 'A traveling healer and scholar — sees the good in people before they do.',
    emoji: '🌿',
    image: '/cards/mira.jpg',
    type: 'arcane',
    ability: {
      name: 'Field Dressing',
      desc: 'Tends wounds, steadily restoring HP',
      effect: { trigger: 'everyTurn', type: 'healLowestAllyPassive', healFraction: 0.08 }
    },
    statsByTier: {
      common: { atk: 16, def: 18, spd: 26, hp: 80, role: 'support' },
      uncommon: { atk: 40, def: 45, spd: 38, hp: 140, role: 'support' },
      rare: { atk: 55, def: 58, spd: 50, hp: 200, role: 'support' },
      superRare: { atk: 70, def: 80, spd: 60, hp: 260, role: 'support' }
    }
  }
]

export function getHuman(id) {
  return HUMANS.find((h) => h.id === id)
}

export function isHuman(id) {
  return HUMANS.some((h) => h.id === id)
}

// Resolves a collection entry that's a human into the same card-like shape
// `getCard()` returns for every other race, using the entry's CURRENT tier
// (not a fixed one) — this is what lets a human slot into Collection,
// PartySelect, and the battle engine without those needing to know humans
// are special at all.
export function resolveHumanCard(entry) {
  const human = getHuman(entry.cardId)
  if (!human) return null
  const tier = entry.tier || 'common'
  const stats = human.statsByTier[tier] || human.statsByTier.common
  return {
    id: human.id,
    name: human.name,
    race: 'human',
    tier,
    type: human.type,
    emoji: human.emoji,
    image: human.image,
    role: stats.role,
    stats,
    ability: human.ability
  }
}
