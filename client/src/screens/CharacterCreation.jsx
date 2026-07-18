import { useState } from 'react'

// Character creation. Per DESIGN_DOC.md §0 (Trust & Safety), the 18+
// attestation is REQUIRED and blocks everything else — it is not one field
// among many, it's a hard gate. This is a weak baseline on its own
// (self-attestation), but it's the required minimum layer; the mid-
// conversation backstop in server/index.js is the other required layer.
export default function CharacterCreation({ onComplete }) {
  const [name, setName] = useState('')
  const [orientation, setOrientation] = useState(null)
  const [assistantName, setAssistantName] = useState('')
  const [aspect, setAspect] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [touched, setTouched] = useState(false)

  const canSubmit = name.trim() && orientation && assistantName.trim() && aspect.trim() && ageConfirmed

  function submit() {
    setTouched(true)
    if (!canSubmit) return
    onComplete({
      name: name.trim(),
      orientation,
      assistantName: assistantName.trim(),
      aspect: aspect.trim(),
      ageConfirmedAdult: true
    })
  }

  return (
    <div className="creation-screen">
      <h1>Before we start</h1>
      <p className="creation-intro">
        A few things about you — some of these are locked in once you continue,
        so take a moment with them.
      </p>

      <label className="creation-field">
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" />
      </label>

      <label className="creation-field">
        Your companion will be...
        <div className="creation-choices">
          {[
            { key: 'girls', label: 'A girl' },
            { key: 'guys', label: 'A guy' },
            { key: 'both', label: 'Open to either' }
          ].map((o) => (
            <button
              key={o.key}
              className={`creation-choice ${orientation === o.key ? 'creation-choice-selected' : ''}`}
              onClick={() => setOrientation(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </label>

      <label className="creation-field">
        Name your guide (they'll help you through the tutorial — no romance, just a smart companion in your corner)
        <input value={assistantName} onChange={(e) => setAssistantName(e.target.value)} placeholder="Guide's name" />
      </label>

      <label className="creation-field">
        Describe yourself in a sentence or two — this shapes how your companion approaches you (shy gets approached slowly; bold gets met head-on)
        <textarea
          value={aspect}
          onChange={(e) => setAspect(e.target.value)}
          placeholder="e.g. 'quiet and a little awkward' or 'confident, likes to tease back'"
          rows={3}
        />
      </label>

      <label className="creation-age-gate">
        <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
        <span>I confirm I am 18 years of age or older. The romantic companion feature is not available to anyone under 18, in any form.</span>
      </label>

      {touched && !canSubmit && (
        <p className="creation-error">
          {!ageConfirmed
            ? 'You must confirm you are 18+ to continue — this app\'s companion feature requires it.'
            : 'Please fill in every field above before continuing.'}
        </p>
      )}

      <button className="creation-submit" onClick={submit}>Begin</button>
    </div>
  )
}
