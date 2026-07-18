// Achievements / collection-completion rewards — see COMPETITIVE_ANALYSIS.md
// §6 #10 ("no achievements or collection-completion rewards"). Each
// achievement's `check(save)` reads straight off save state that already
// exists for almost everything (collection, giftsGiven, recruitedHumanIds,
// affection); a couple of cumulative ones (battles won, tactics won with)
// needed a small `stats` counter added to saveState.js since nothing else
// tracked a running total. `check` is re-evaluated live every time the
// Achievements screen renders, rather than achievements being "unlocked" as
// a side effect elsewhere — the screen shows a Claim button for anything
// that's newly true but not yet in `unlockedAchievements`, same pattern as
// the daily quest claim button.

import { TIERS } from './cards'
import { resolveCard } from './resolveCard'
import { relationshipStage, RELATIONSHIP_STAGES } from './relationshipStage'

const TOP_STAGE_LABEL = RELATIONSHIP_STAGES[RELATIONSHIP_STAGES.length - 1].label

function totalGiftsGiven(save) {
  return Object.values(save.giftsGiven || {}).reduce(
    (sum, log) => sum + Object.values(log).reduce((a, b) => a + b, 0),
    0
  )
}

export const ACHIEVEMENTS = [
  {
    id: 'first_pack',
    name: 'First Steps',
    emoji: '🎁',
    desc: 'Open your first card pack.',
    reward: { gold: 20 },
    check: (save) => (save.stats?.packsOpened || 0) >= 1
  },
  {
    id: 'level_10',
    name: 'Getting Stronger',
    emoji: '📈',
    desc: 'Train any card up to level 10.',
    reward: { gold: 30 },
    check: (save) => save.collection.some((e) => (e.level || 1) >= 10)
  },
  {
    id: 'battles_10',
    name: 'Battle-Tested',
    emoji: '⚔️',
    desc: 'Win 10 battles out exploring.',
    reward: { gold: 50 },
    check: (save) => (save.stats?.battlesWon || 0) >= 10
  },
  {
    id: 'all_tactics',
    name: 'Master Tactician',
    emoji: '🧭',
    desc: 'Win a battle using each tactic — Aggressive, Balanced, and Defensive.',
    reward: { gold: 60 },
    check: (save) => ['aggressive', 'balanced', 'defensive'].every((t) => (save.stats?.tacticsWon || []).includes(t))
  },
  {
    id: 'gifts_5',
    name: 'Generous Heart',
    emoji: '💝',
    desc: 'Give 5 gifts total.',
    reward: { gold: 30 },
    check: (save) => totalGiftsGiven(save) >= 5
  },
  {
    id: 'committed_partners',
    name: 'Committed Partners',
    emoji: '💍',
    desc: "Reach your companion's deepest relationship stage.",
    reward: { gold: 75, affection: 5 },
    check: (save) =>
      !!save.recruitedCompanionId &&
      relationshipStage(save.affection[save.recruitedCompanionId] || 0) === TOP_STAGE_LABEL
  },
  {
    id: 'fellowship',
    name: 'Fellowship Complete',
    emoji: '🧑‍🤝‍🧑',
    desc: 'Recruit every Traveler you can meet.',
    reward: { gold: 40 },
    check: (save) => (save.recruitedHumanIds || []).length >= 2
  },
  {
    id: 'collector',
    name: 'Collector',
    emoji: '🏆',
    desc: 'Own at least one card of every tier, from Common to God Tier.',
    reward: { gold: 100 },
    check: (save) => TIERS.every((tier) => save.collection.some((e) => resolveCard(e)?.tier === tier))
  }
]
