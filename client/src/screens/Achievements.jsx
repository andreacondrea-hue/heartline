import { ACHIEVEMENTS } from '../data/achievements'

// Achievement conditions are re-checked live against the current save every
// render (see data/achievements.js) rather than tracked as a separate
// "unlocked" side effect — anything that's newly true but not yet in
// `save.unlockedAchievements` gets a Claim button here, same pattern as the
// hub's daily quest checklist.
export default function Achievements({ save, onClaim, onExit }) {
  return (
    <div className="achievements-screen">
      <h2>Achievements</h2>
      <p className="achievements-hint">One-time rewards for milestones across the whole game, not just today.</p>

      <div className="achievements-list">
        {ACHIEVEMENTS.map((a) => {
          const claimed = save.unlockedAchievements.includes(a.id)
          const met = !claimed && a.check(save)
          return (
            <div
              key={a.id}
              className={`achievement-card${claimed ? ' achievement-card-claimed' : ''}${met ? ' achievement-card-ready' : ''}`}
            >
              <span className="achievement-emoji">{a.emoji}</span>
              <div className="achievement-info">
                <div className="achievement-name">{a.name}</div>
                <div className="achievement-desc">{a.desc}</div>
                <div className="achievement-reward">
                  Reward: +{a.reward.gold} gold{a.reward.affection ? `, +${a.reward.affection} affection` : ''}
                </div>
              </div>
              {claimed && <span className="achievement-status achievement-status-claimed">✅ Claimed</span>}
              {met && (
                <button className="achievement-claim" onClick={() => onClaim(a.id, a.reward)}>
                  Claim
                </button>
              )}
              {!claimed && !met && <span className="achievement-status achievement-status-locked">🔒 Locked</span>}
            </div>
          )
        })}
      </div>

      <button className="vn-exit" onClick={onExit}>← back</button>
    </div>
  )
}
