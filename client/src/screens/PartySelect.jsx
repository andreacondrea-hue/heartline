import { useState } from 'react'
import { TIER_COLORS } from '../data/cards'
import { TYPE_EMOJI, TYPE_COLORS, TYPE_LABELS } from '../data/types'
import { resolveCard } from '../data/resolveCard'

const MAX_PARTY_SIZE = 3

// Lets the player pick up to 3 cards from their collection to bring into
// a real battle (see data/battleEngine.js). Selection is by ORIGINAL
// collection index (not cardId), same reasoning as Collection.jsx — a
// player can own several copies of the same card, each at its own level.
export default function PartySelect({ collection, onBegin, onExit }) {
  const [selected, setSelected] = useState([])

  function toggle(index) {
    setSelected((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index)
      if (prev.length >= MAX_PARTY_SIZE) return prev
      return [...prev, index]
    })
  }

  return (
    <div className="party-select-screen">
      <h2>Choose your battle party</h2>
      <p className="party-select-hint">
        Pick up to {MAX_PARTY_SIZE} cards ({selected.length}/{MAX_PARTY_SIZE} selected).
      </p>

      {collection.length === 0 && <p className="chat-empty">You don't have any cards yet — open a pack first.</p>}

      <div className="collection-grid">
        {collection.map((entry, index) => {
          const card = resolveCard(entry)
          if (!card) return null
          const isSelected = selected.includes(index)
          return (
            <div
              key={index}
              className={`collection-card party-select-card${isSelected ? ' party-select-card-chosen' : ''}`}
              style={{ borderColor: TIER_COLORS[card.tier] }}
              onClick={() => toggle(index)}
            >
              <div className="collection-card-thumb">
                {card.image ? <img src={card.image} alt={card.name} /> : <span>{card.emoji}</span>}
              </div>
              <div className="collection-card-name">{card.name}</div>
              <div className="collection-card-level">Lv. {entry.level || 1}</div>
              {card.type && (
                <div className="collection-card-type" style={{ color: TYPE_COLORS[card.type] }}>
                  {TYPE_EMOJI[card.type]} {TYPE_LABELS[card.type]}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="party-select-actions">
        <button className="vn-exit" onClick={onExit}>← back</button>
        <button
          className="creation-submit"
          disabled={selected.length === 0}
          onClick={() => onBegin(selected)}
        >
          Begin Battle →
        </button>
      </div>
    </div>
  )
}
