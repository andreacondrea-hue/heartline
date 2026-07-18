import { useState } from 'react'
import { getCard } from '../data/cards'
import { playSfx } from '../engine/audioManager'

// The scripted opening battle: "free your companion." Per DESIGN_DOC.md
// §10, this is soft-scripted so the player wins essentially every time —
// it's a story beat, not a real difficulty check. We still show the
// player's actual starter cards so it feels grounded in their collection.
export default function FirstBattle({ companion, collection, onVictory }) {
  const [log, setLog] = useState([])
  const [finished, setFinished] = useState(false)

  const fighters = collection.slice(0, 3).map((entry) => getCard(entry.cardId)).filter(Boolean)

  function fight() {
    const lines = []
    if (fighters.length === 0) {
      lines.push('You step in yourself — and somehow, that\'s enough.')
    } else {
      fighters.forEach((f) => {
        lines.push(`${f.name} uses ${f.ability.name}!`)
      })
    }
    lines.push(`The captor's grip breaks. ${companion.name} is free.`)
    setLog(lines)
    setFinished(true)
    playSfx('victory')
  }

  return (
    <div className="battle-screen">
      <h2>Freeing {companion.name}</h2>

      {fighters.length > 0 && (
        <div className="battle-party">
          {fighters.map((f, i) => (
            <div key={i} className="battle-party-card">
              {f.image ? <img src={f.image} alt={f.name} /> : <span className="battle-emoji">{f.emoji}</span>}
              <div>{f.name}</div>
            </div>
          ))}
        </div>
      )}

      {!finished && <button onClick={fight}>Fight!</button>}

      {log.length > 0 && (
        <div className="battle-log">
          {log.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {finished && <button onClick={onVictory}>Continue →</button>}
    </div>
  )
}
