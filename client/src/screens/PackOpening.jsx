import { useState } from 'react'
import { PACKS, rollStarterTier, openPack } from '../data/packs'
import { getCard, TIER_LABELS, TIER_COLORS } from '../data/cards'
import { playSfx } from '../engine/audioManager'

// Pack shop + opening/reveal screen. The free starter roll is a one-time
// thing (claimedStarterRoll); every pack after that costs gold. No real
// money here yet — see DESIGN_DOC.md §12, that's a later phase gated on
// actual legal review.
export default function PackOpening({ gold, claimedStarterRoll, onClaimStarter, onBuyPack, onExit }) {
  const [revealed, setRevealed] = useState(null) // array of drawn cards, or null

  function claimStarter() {
    const tier = rollStarterTier()
    const drawn = openPack(tier)
    onClaimStarter(drawn)
    setRevealed(drawn)
    playSfx('packopen')
  }

  function buy(packKey) {
    const pack = PACKS[packKey]
    if (gold < pack.cost) return
    const drawn = openPack(packKey)
    onBuyPack(packKey, drawn)
    setRevealed(drawn)
    playSfx('packopen')
  }

  if (revealed) {
    return (
      <div className="pack-screen">
        <h2>Your cards!</h2>
        <div className="pack-reveal-grid">
          {revealed.map((entry, i) => {
            const card = getCard(entry.cardId)
            return (
              <div key={i} className="pack-reveal-card" style={{ borderColor: TIER_COLORS[card.tier] }}>
                <div className="pack-reveal-thumb" style={{ borderColor: TIER_COLORS[card.tier] }}>
                  {card.image ? <img src={card.image} alt={card.name} /> : <span>{card.emoji}</span>}
                </div>
                <div className="pack-reveal-name">{card.name}</div>
                <div className="pack-reveal-tier" style={{ color: TIER_COLORS[card.tier] }}>
                  {TIER_LABELS[card.tier]}
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={() => setRevealed(null)}>Back to packs</button>
      </div>
    )
  }

  return (
    <div className="pack-screen">
      <h2>Packs</h2>
      <p className="pack-gold">Gold: {gold}</p>

      {!claimedStarterRoll && (
        <button className="pack-starter-button" onClick={claimStarter}>
          🎁 Open your free starter pack
        </button>
      )}

      <div className="pack-list">
        {Object.entries(PACKS).map(([key, pack]) => (
          <div key={key} className="pack-row">
            <div>
              <div className="pack-row-label">{pack.label}</div>
              <div className="pack-row-cost">{pack.cost} gold</div>
            </div>
            <button disabled={gold < pack.cost} onClick={() => buy(key)}>
              Open
            </button>
          </div>
        ))}
      </div>

      <button className="vn-exit" onClick={onExit}>← back</button>
    </div>
  )
}
