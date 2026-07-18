import { useState } from 'react'
import { resolveCard } from '../data/resolveCard'
import { makeCombatant, generateEncounter, runBattle, battleRewards } from '../data/battleEngine'
import { TACTICS, TACTIC_ORDER, applyTactic } from '../data/tactics'
import { TYPE_EMOJI, TYPE_COLORS, TYPE_LABELS } from '../data/types'
import { playSfx } from '../engine/audioManager'
import BattleStage3D from './BattleStage3D'

// The real battle screen — turn-by-turn stat resolution, not the soft-
// scripted opening mission. Builds the player's chosen party, rolls a wild
// encounter, and (on "Fight!") runs the whole battle in one pass via
// data/battleEngine.js, then reveals the log and hands back rewards.
//
// The one pre-battle player decision here is a whole-party Tactic/Stance
// (see data/tactics.js) — a real ATK/DEF tradeoff for the fight, not just
// flavor. It can't be a full turn-by-turn move-selection system without
// reworking runBattle() into something pausable (see that file's header),
// but it's still a genuine choice with no dominant option, addressing the
// "battles are fully auto-resolved, no player agency" gap from
// COMPETITIVE_ANALYSIS.md.
export default function BattleArena({ partyIndices, collection, onFinish, onExit }) {
  const playerEntries = partyIndices.map((index) => ({ index, entry: collection[index] })).filter((e) => e.entry)
  const playerCombatants = playerEntries.map(({ entry }) =>
    makeCombatant(resolveCard(entry), entry.level || 1, 'player')
  )
  const avgLevel = playerCombatants.reduce((sum, c) => sum + c.level, 0) / (playerCombatants.length || 1)

  const [enemyCombatants] = useState(() => generateEncounter(avgLevel))
  const [tacticId, setTacticId] = useState('balanced')
  const [outcome, setOutcome] = useState(null) // { log, result, rewards, combatants }
  const [playbackDone, setPlaybackDone] = useState(false)

  function fight() {
    // runBattle mutates the combatant objects it's given, so hand it fresh
    // copies rather than the ones used for the "your party" preview above.
    // The chosen tactic's ATK/DEF multipliers apply only to the player's
    // side, for this battle only — nothing is persisted onto the cards.
    const freshPlayer = playerEntries.map(({ entry }) =>
      applyTactic(makeCombatant(resolveCard(entry), entry.level || 1, 'player'), tacticId)
    )
    const freshEnemy = enemyCombatants.map((e) => ({ ...e }))
    const { log, result, combatants } = runBattle(freshPlayer, freshEnemy)
    const tactic = TACTICS[tacticId] || TACTICS.balanced
    log.unshift({ type: 'action', text: `Your party enters the fight in a ${tactic.label} stance (${tactic.desc})` })
    const rewards = battleRewards(freshEnemy, result)
    setOutcome({ log, result, rewards, combatants })
    setPlaybackDone(false)
    if (result === 'win') playSfx('victory')
  }

  function claim() {
    const xpGains = {}
    playerEntries.forEach(({ index }) => { xpGains[index] = outcome.rewards.xpPerCard })
    onFinish({ goldGain: outcome.rewards.gold, xpGains, result: outcome.result, tactic: tacticId })
  }

  if (outcome && !playbackDone) {
    return (
      <div className="battle-screen battle-screen-3d">
        <BattleStage3D
          combatants={outcome.combatants}
          steps={outcome.log}
          onDone={() => setPlaybackDone(true)}
        />
      </div>
    )
  }

  return (
    <div className="battle-screen">
      <h2>Wild Encounter</h2>

      <div className="battle-party">
        {playerCombatants.map((c, i) => (
          <div key={i} className="battle-party-card">
            {c.image ? <img src={c.image} alt={c.name} /> : <span className="battle-emoji">{c.emoji}</span>}
            <div>{c.name} (Lv.{c.level})</div>
            {c.type && (
              <div className="battle-type-badge" style={{ color: TYPE_COLORS[c.type] }}>
                {TYPE_EMOJI[c.type]} {TYPE_LABELS[c.type]}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="battle-vs">vs.</p>

      <div className="battle-party">
        {enemyCombatants.map((c, i) => (
          <div key={i} className="battle-party-card">
            {c.image ? <img src={c.image} alt={c.name} /> : <span className="battle-emoji">{c.emoji}</span>}
            <div>{c.name} (Lv.{c.level})</div>
            {c.type && (
              <div className="battle-type-badge" style={{ color: TYPE_COLORS[c.type] }}>
                {TYPE_EMOJI[c.type]} {TYPE_LABELS[c.type]}
              </div>
            )}
          </div>
        ))}
      </div>

      {!outcome && (
        <div className="battle-tactic-picker">
          <p className="battle-tactic-hint">Choose your party's tactic for this fight:</p>
          <div className="battle-tactic-options">
            {TACTIC_ORDER.map((id) => {
              const tactic = TACTICS[id]
              return (
                <button
                  key={id}
                  className={`battle-tactic-option${tacticId === id ? ' battle-tactic-option-chosen' : ''}`}
                  onClick={() => setTacticId(id)}
                >
                  <span className="battle-tactic-emoji">{tactic.emoji}</span>
                  <span className="battle-tactic-label">{tactic.label}</span>
                  <span className="battle-tactic-desc">{tactic.desc}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!outcome && <button onClick={fight}>Fight!</button>}

      {outcome && playbackDone && (
        <>
          <div className="battle-log">
            {outcome.log.map((entry, i) =>
              entry.type === 'round' ? (
                <p key={i} className="battle-log-round">— Round {entry.round} —</p>
              ) : (
                <p key={i}>{entry.text}</p>
              )
            )}
          </div>

          <div className={`battle-result battle-result-${outcome.result}`}>
            {outcome.result === 'win' ? (
              <>
                <p><strong>Victory!</strong></p>
                <p>+{outcome.rewards.gold} gold, +{outcome.rewards.xpPerCard} xp per party card</p>
              </>
            ) : (
              <>
                <p><strong>Your party retreated.</strong></p>
                <p>+{outcome.rewards.xpPerCard} xp per party card (lessons learned)</p>
              </>
            )}
          </div>

          <button onClick={claim}>Continue →</button>
        </>
      )}

      {!outcome && <button className="vn-exit" onClick={onExit}>← back</button>}
    </div>
  )
}
