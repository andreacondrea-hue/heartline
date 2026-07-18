import { TIER_LABELS, TIER_COLORS } from '../data/cards'
import { TYPE_EMOJI, TYPE_COLORS, TYPE_LABELS } from '../data/types'
import { MAX_LEVEL, xpToNextLevel, trainingCost, TRAINING_XP_GAIN, statsAtLevel } from '../data/leveling'
import { resolveCard } from '../data/resolveCard'
import { BOND_THRESHOLDS, BOND_POINT_GAIN, bondCost } from '../data/humanBond'

// Shows every card the player owns, grouped loosely by tier (highest
// first) since that's what a player wants to admire/check first. Each card
// can be trained (spend gold for a flat xp chunk) straight from here — see
// data/leveling.js for the curve/cost formulas. `index` on each entry is
// the card's position in the ORIGINAL save.collection array (not its
// position within the tier group), since a player can own several copies
// of the same card and each levels independently.
//
// Human entries additionally get a bond section (progress bar + "Spend
// time together" button) — see data/humanBond.js. resolveCard(entry) is
// what makes this screen not need to know humans are special for anything
// except that one extra block: it already resolves a human's CURRENT tier
// from the entry rather than a fixed card definition.
export default function Collection({ collection, gold, onTrain, onBond, onExit }) {
  const grouped = {}
  collection.forEach((entry, index) => {
    const card = resolveCard(entry)
    if (!card) return
    grouped[card.tier] = grouped[card.tier] || []
    grouped[card.tier].push({ ...entry, card, index })
  })

  const tierOrder = ['godTier', 'legendary', 'superRare', 'rare', 'uncommon', 'common']

  return (
    <div className="collection-screen">
      <h2>Your Collection</h2>
      <p className="pack-gold">Gold: {gold}</p>
      {collection.length === 0 && <p className="chat-empty">No cards yet — open a pack to get started.</p>}

      {tierOrder.map((tier) => {
        const entries = grouped[tier]
        if (!entries || entries.length === 0) return null
        return (
          <div key={tier} className="collection-tier-group">
            <h3 style={{ color: TIER_COLORS[tier] }}>{TIER_LABELS[tier]}</h3>
            <div className="collection-grid">
              {entries.map((e) => {
                const level = e.level || 1
                const xp = e.xp || 0
                const maxed = level >= MAX_LEVEL
                const needed = maxed ? 0 : xpToNextLevel(level)
                const pct = maxed ? 100 : Math.min(100, Math.round((xp / needed) * 100))
                const cost = trainingCost(e.card, level)
                const canAfford = !maxed && gold >= cost
                const stats = statsAtLevel(e.card.stats, level)
                const isHumanEntry = e.card.race === 'human'
                const bondThreshold = isHumanEntry ? BOND_THRESHOLDS[e.card.tier] : null
                const bondPoints = e.bondPoints || 0
                const bondPct = bondThreshold ? Math.min(100, Math.round((bondPoints / bondThreshold) * 100)) : 100
                const bCost = isHumanEntry ? bondCost(e.card.tier) : 0
                const canBond = isHumanEntry && !!bondThreshold && gold >= bCost
                return (
                  <div key={e.index} className="collection-card" style={{ borderColor: TIER_COLORS[tier] }}>
                    <div className="collection-card-thumb">
                      {e.card.image ? <img src={e.card.image} alt={e.card.name} /> : <span>{e.card.emoji}</span>}
                    </div>
                    <div className="collection-card-name">{e.card.name}</div>
                    <div className="collection-card-level">{maxed ? 'Lv. MAX' : `Lv. ${level}`}</div>
                    {e.card.type && (
                      <div className="collection-card-type" style={{ color: TYPE_COLORS[e.card.type] }}>
                        {TYPE_EMOJI[e.card.type]} {TYPE_LABELS[e.card.type]}
                      </div>
                    )}
                    <div className="collection-card-stats">
                      ATK {stats.atk} · DEF {stats.def} · SPD {stats.spd} · HP {stats.hp}
                    </div>
                    <div className="collection-xp-bar">
                      <div className="collection-xp-fill" style={{ width: `${pct}%`, background: TIER_COLORS[tier] }} />
                    </div>
                    {!maxed && (
                      <button
                        className="collection-train-button"
                        disabled={!canAfford}
                        onClick={() => onTrain(e.index)}
                        title={canAfford ? `+${TRAINING_XP_GAIN} xp` : "Not enough gold"}
                      >
                        Train ({cost}g)
                      </button>
                    )}
                    {isHumanEntry && bondThreshold && (
                      <>
                        <div className="collection-bond-label">Bond: {bondPoints}/{bondThreshold}</div>
                        <div className="collection-xp-bar collection-bond-bar">
                          <div className="collection-xp-fill" style={{ width: `${bondPct}%`, background: '#c86b98' }} />
                        </div>
                        <button
                          className="collection-bond-button"
                          disabled={!canBond}
                          onClick={() => onBond(e.index)}
                          title={canBond ? `+${BOND_POINT_GAIN} bond` : 'Not enough gold'}
                        >
                          Spend time together ({bCost}g)
                        </button>
                      </>
                    )}
                    {isHumanEntry && !bondThreshold && (
                      <div className="collection-bond-label collection-bond-max">Bond maxed — Super Rare</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <button className="vn-exit" onClick={onExit}>← back</button>
    </div>
  )
}
