import { cardsByTier } from './cards'

// Six pack tiers as designed. Each yields 5 cards in the specified tier
// composition. Buying a specific pack GUARANTEES that composition — the
// free "starter roll" (rollStarterTier below) is the only place actual
// randomness picks the tier for you.
export const PACKS = {
  common: { label: 'Common Pack', cost: 50, composition: { common: 5 } },
  uncommon: { label: 'Uncommon Pack', cost: 150, composition: { uncommon: 2, common: 3 } },
  rare: { label: 'Rare Pack', cost: 400, composition: { rare: 2, uncommon: 2, common: 1 } },
  superRare: { label: 'Super Rare Pack', cost: 900, composition: { superRare: 2, rare: 2, uncommon: 1 } },
  legendary: { label: 'Legendary Pack', cost: 2000, composition: { legendary: 2, superRare: 3 } },
  godTier: { label: 'God Tier Pack', cost: 5000, composition: { godTier: 2, legendary: 3 } }
}

// Free starter-roll odds — which PACK TIER a brand-new player gets for
// free, weighted heavily toward Common. See DESIGN_DOC.md open question #3.
const STARTER_TIER_ODDS = [
  { tier: 'common', weight: 60 },
  { tier: 'uncommon', weight: 25 },
  { tier: 'rare', weight: 10 },
  { tier: 'superRare', weight: 4 },
  { tier: 'legendary', weight: 0.9 },
  { tier: 'godTier', weight: 0.1 }
]

export function rollStarterTier(randomFn = Math.random) {
  const total = STARTER_TIER_ODDS.reduce((sum, o) => sum + o.weight, 0)
  let roll = randomFn() * total
  for (const o of STARTER_TIER_ODDS) {
    if (roll < o.weight) return o.tier
    roll -= o.weight
  }
  return 'common'
}

function pickRandom(list, randomFn) {
  return list[Math.floor(randomFn() * list.length)]
}

// Opens a pack of the given tier key (from PACKS) and returns the 5 cards
// drawn, each as { cardId, level: 1, xp: 0 }. Cards are picked randomly
// WITHIN each required tier — e.g. a Rare pack's "2 rare" slots each
// independently roll among the 3 orc cards. `xp` tracks progress toward
// the card's next level — see data/leveling.js.
export function openPack(packKey, randomFn = Math.random) {
  const pack = PACKS[packKey]
  if (!pack) throw new Error(`Unknown pack: ${packKey}`)
  const drawn = []
  for (const [tier, count] of Object.entries(pack.composition)) {
    const pool = cardsByTier(tier)
    for (let i = 0; i < count; i++) {
      const card = pickRandom(pool, randomFn)
      drawn.push({ cardId: card.id, level: 1, xp: 0 })
    }
  }
  return drawn
}
