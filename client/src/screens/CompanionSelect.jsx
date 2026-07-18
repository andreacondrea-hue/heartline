import { CHARACTERS } from '../data/characters'

const GENDER_OF = { ava: 'girls', kai: 'guys', wren: 'girls', sable: 'girls' }

// Filters the companion roster by the player's stated orientation
// preference (locked in at character creation) and lets them pick who
// their first mission is about freeing.
export default function CompanionSelect({ orientation, onPick }) {
  const options = CHARACTERS.filter((c) => orientation === 'both' || GENDER_OF[c.id] === orientation)

  return (
    <div className="companion-select-screen">
      <h2>Someone's caught your attention...</h2>
      <p className="creation-intro">
        Word is someone nearby is being held back against their will. Your guide
        thinks you're ready to do something about it. Who are you going after?
      </p>
      <div className="select-grid">
        {options.map((c) => (
          <div key={c.id} className="character-card" style={{ borderColor: c.color }}>
            <div className="character-avatar" style={{ background: c.color }}>
              {c.image ? <img src={c.image} alt={c.name} /> : c.name[0]}
            </div>
            <h2 style={{ color: c.color }}>{c.name}</h2>
            <p className="character-tagline">{c.tagline}</p>
            <button onClick={() => onPick(c.id)}>Go free {c.name}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
