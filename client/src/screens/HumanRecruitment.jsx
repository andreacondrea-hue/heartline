import { HUMANS } from '../data/humanBond'

// Lists humans the player hasn't met yet. This is deliberately NOT a pack
// pull, a purchase, or something you win in combat — see data/humanBond.js
// for why: the earlier "bought as slaves" framing was refused and reworked
// into this consensual ask. A human joins because you invite them and they
// agree, full stop. Once recruited they live in the normal Collection
// screen like any other card, but their tier grows through the bond you
// build with them (see the "Spend time together" action there) rather than
// through packs or training.
export default function HumanRecruitment({ recruitedHumanIds, onRecruit, onExit }) {
  const available = HUMANS.filter((h) => !recruitedHumanIds.includes(h.id))
  const alreadyJoined = HUMANS.filter((h) => recruitedHumanIds.includes(h.id))

  return (
    <div className="human-recruit-screen">
      <h2>Fellow Travelers</h2>
      <p className="human-recruit-hint">
        These aren't cards to pull or claim — they're people you can ask to
        travel with you. Say the word, and if they agree, they'll join your
        party and grow closer through the time you spend together.
      </p>

      {available.length === 0 && (
        <p className="chat-empty">Everyone you've met so far has already joined you.</p>
      )}

      <div className="human-recruit-list">
        {available.map((h) => (
          <div key={h.id} className="human-recruit-card">
            <div className="human-recruit-avatar">
              {h.image ? <img src={h.image} alt={h.name} /> : <span>{h.emoji}</span>}
            </div>
            <div className="human-recruit-info">
              <div className="human-recruit-name">{h.name}</div>
              <p className="human-recruit-tagline">{h.tagline}</p>
              <p className="human-recruit-ability">{h.ability.name} — {h.ability.desc}</p>
            </div>
            <button onClick={() => onRecruit(h.id)}>Ask them to join you</button>
          </div>
        ))}
      </div>

      {alreadyJoined.length > 0 && (
        <p className="human-recruit-joined-note">
          Already traveling with you: {alreadyJoined.map((h) => h.name).join(', ')} — find them in
          your Collection to deepen the bond.
        </p>
      )}

      <button className="vn-exit" onClick={onExit}>← back</button>
    </div>
  )
}
