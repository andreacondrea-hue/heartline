// A small shared gift catalog + per-character taste, used by the gift
// picker in engine/ChatScreen.jsx. Deliberately simple: every companion can
// receive any gift (no locked-out items), but reacts differently — loved
// gifts land much better than disliked ones, same "meaningful choice, not
// just a gold sink" idea as bond costs and training costs elsewhere in the
// economy (see data/humanBond.js, data/leveling.js).

export const GIFT_CATALOG = [
  { id: 'flowers', name: 'Wildflowers', emoji: '💐', cost: 15 },
  { id: 'book', name: 'A well-loved book', emoji: '📖', cost: 20 },
  { id: 'tea', name: 'Herbal tea blend', emoji: '🍵', cost: 10 },
  { id: 'charm', name: 'Hand-carved charm', emoji: '🪵', cost: 25 },
  { id: 'sparring-gear', name: 'Sparring gloves', emoji: '🥊', cost: 30 },
  { id: 'vinyl', name: 'Rare vinyl record', emoji: '💿', cost: 35 },
  { id: 'sweets', name: 'Box of sweets', emoji: '🍬', cost: 12 },
  { id: 'trinket', name: 'Shiny trinket', emoji: '✨', cost: 18 }
]

// { [characterId]: { loved: [giftId...], liked: [giftId...], disliked: [giftId...] } }
// Anything not listed for a character defaults to a small neutral bump.
const PREFERENCES = {
  ava: { loved: ['book'], liked: ['tea', 'sweets'], disliked: ['sparring-gear'] },
  kai: { loved: ['vinyl'], liked: ['sweets', 'charm'], disliked: ['trinket'] },
  wren: { loved: ['charm'], liked: ['flowers', 'sweets'], disliked: ['trinket', 'vinyl'] },
  sable: { loved: ['sparring-gear'], liked: ['trinket', 'sweets'], disliked: ['book'] }
}

const AFFECTION_BY_REACTION = { loved: 8, liked: 4, neutral: 1, disliked: -3 }

export function giftReaction(characterId, giftId) {
  const prefs = PREFERENCES[characterId]
  if (!prefs) return 'neutral'
  if (prefs.loved?.includes(giftId)) return 'loved'
  if (prefs.liked?.includes(giftId)) return 'liked'
  if (prefs.disliked?.includes(giftId)) return 'disliked'
  return 'neutral'
}

export function giftAffectionDelta(characterId, giftId) {
  return AFFECTION_BY_REACTION[giftReaction(characterId, giftId)]
}

export function getGift(giftId) {
  return GIFT_CATALOG.find((g) => g.id === giftId)
}
