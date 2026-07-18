import { getCard } from './cards'
import { isHuman, resolveHumanCard } from './humanBond'

// Every screen that shows a collection entry (Collection, PartySelect,
// BattleArena, the pack-reveal grids) needs a fully-resolved card object.
// For every race except human that's just getCard(entry.cardId) — humans
// are the one race whose tier isn't fixed on the card itself, so they need
// the entry (which carries the CURRENT tier) rather than just the id.
// Centralizing this here means none of those screens need to know humans
// are special at all.
export function resolveCard(entry) {
  if (!entry) return null
  if (isHuman(entry.cardId)) return resolveHumanCard(entry)
  return getCard(entry.cardId)
}
