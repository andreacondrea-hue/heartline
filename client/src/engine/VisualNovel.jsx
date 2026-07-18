import { useState } from 'react'

// Renders one scripted dialogue node at a time and lets the player pick a
// choice, which moves affection and advances to the next node. When a node
// has `unlockChat: true`, it surfaces a button to jump into live AI chat
// (chapter 1's ending only — see data/story/*.js). Any other node with no
// choices left is just "the end of this chapter" — it surfaces a plain
// Continue button that reports completion back up via `onChapterComplete`
// so App.jsx can advance to the next chapter and return to the hub.
//
// A handful of nodes — the chapter 2/3 emotional payoff at each companion's
// `end_2`/`end_3` — carry an optional `image` field (see data/story/*.js
// and CHARACTER_ROSTER.md's "Story CG moments" section) pointing at a
// dedicated scene illustration rather than the character's standing
// portrait. No CG art has been generated for this project yet, so
// `node.image` is always undefined today and every node falls through to
// the ordinary portrait exactly as before — this is forward wiring only:
// drop a real file at the referenced path later (client/public/cg/...) and
// it activates with no other code changes.
export default function VisualNovel({ route, character, onAffection, onUnlockChat, onChapterComplete, onExit }) {
  const [nodeId, setNodeId] = useState(route.start)
  // Defensive fallback: App.jsx keys this component on the active chapter's
  // id specifically so a chapter change always remounts fresh (see that
  // comment), but if `nodeId` ever doesn't resolve for any reason, fall back
  // to the route's start node rather than crashing on `undefined.choices`.
  const node = route.nodes[nodeId] || route.nodes[route.start]
  const isChapterEnd = node.choices.length === 0

  function pick(choice) {
    if (choice.affection) onAffection(choice.affection)
    setNodeId(choice.next)
  }

  return (
    <div className="vn-screen" style={{ borderColor: character.color }}>
      {node.image ? (
        <img className="vn-cg" src={node.image} alt={`${character.name} — ${node.speaker}`} />
      ) : (
        character.image && (
          <img className="vn-portrait" src={character.image} alt={character.name} />
        )
      )}
      <div className="vn-speaker" style={{ color: character.color }}>{node.speaker}</div>
      <p className="vn-text">{node.text}</p>

      {node.unlockChat && (
        <button
          className="vn-choice vn-choice-primary"
          style={{ borderColor: character.color }}
          onClick={() => onUnlockChat()}
        >
          Give {character.name} your number →
        </button>
      )}

      {isChapterEnd && !node.unlockChat && (
        <button
          className="vn-choice vn-choice-primary"
          style={{ borderColor: character.color }}
          onClick={() => onChapterComplete()}
        >
          Continue →
        </button>
      )}

      <div className="vn-choices">
        {node.choices.map((choice, i) => (
          <button key={i} className="vn-choice" onClick={() => pick(choice)}>
            {choice.text}
          </button>
        ))}
      </div>

      <button className="vn-exit" onClick={onExit}>← back to character select</button>
    </div>
  )
}
