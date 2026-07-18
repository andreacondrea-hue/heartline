// A small, shared affection-threshold ladder used two places: labeling how
// close a companion relationship currently is (hub display + chat system
// prompt, so the AI's tone genuinely shifts as the number climbs — see
// characters.js), and gating which story chapter is next (see story/*.js,
// where each chapter's `unlockAffection` lines up with one of these
// thresholds). Keeping both on the same ladder means "the story advances"
// and "the AI acts closer" happen together, not on two disconnected scales.
export const RELATIONSHIP_STAGES = [
  { min: 0, label: 'Just met' },
  { min: 12, label: 'Getting closer' },
  { min: 30, label: 'Close' },
  { min: 60, label: 'Falling for each other' },
  { min: 100, label: 'Committed partners' }
]

export function relationshipStage(affection) {
  let label = RELATIONSHIP_STAGES[0].label
  for (const stage of RELATIONSHIP_STAGES) {
    if (affection >= stage.min) label = stage.label
  }
  return label
}
