// Pre-battle "Tactic" choice — see COMPETITIVE_ANALYSIS.md §6/§7's "no
// player-chosen battle actions" gap. A full turn-by-turn move-selection
// rework isn't realistic against battleEngine.js's architecture (runBattle
// resolves an entire fight synchronously in one pass with no pause points —
// see that file's header), so this scales the idea down to one real,
// meaningful decision per fight: a stance applied to the whole player party
// for that battle only, via a flat ATK/DEF multiplier. Cheap to implement,
// but it's a genuine tradeoff (there's no dominant strategy — Aggressive
// trades survivability for damage and vice versa), which is what makes it
// real player agency rather than a coat of paint.

export const TACTICS = {
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive',
    emoji: '⚔️',
    desc: '+18% ATK, -12% DEF for your whole party this battle.',
    atkMultiplier: 1.18,
    defMultiplier: 0.88
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    emoji: '⚖️',
    desc: 'No change — steady stats, no tradeoff.',
    atkMultiplier: 1,
    defMultiplier: 1
  },
  defensive: {
    id: 'defensive',
    label: 'Defensive',
    emoji: '🛡️',
    desc: '+18% DEF, -12% ATK for your whole party this battle.',
    atkMultiplier: 0.88,
    defMultiplier: 1.18
  }
}

export const TACTIC_ORDER = ['aggressive', 'balanced', 'defensive']

// Applies a tactic's multipliers to an already-built combatant (see
// battleEngine.js's makeCombatant) — returns a NEW object rather than
// mutating, same defensive convention runBattle itself relies on (it
// mutates its own inputs, so callers always hand it fresh copies).
export function applyTactic(combatant, tacticId) {
  const tactic = TACTICS[tacticId] || TACTICS.balanced
  return {
    ...combatant,
    atk: Math.round(combatant.atk * tactic.atkMultiplier),
    def: Math.round(combatant.def * tactic.defMultiplier)
  }
}
