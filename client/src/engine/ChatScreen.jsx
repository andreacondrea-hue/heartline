import { useState, useRef, useEffect } from 'react'
import { relationshipStage } from '../data/relationshipStage'
import { GIFT_CATALOG, giftReaction } from '../data/gifts'

// Live AI free-chat with the character. This calls OUR OWN backend
// (server/index.js), never the Anthropic API directly from the browser —
// that keeps the API key off the client and lets the server enforce content
// guardrails no matter what the frontend sends.
//
// Two things layer on top of plain chat here (see DESIGN_DOC.md §10 for the
// full writeup): chatting itself now earns a little affection (through
// `onChatAffection`, daily-capped — see saveState.js), and the character's
// system prompt gets a per-turn addendum built from the relationship's
// current affection/stage plus a running list of remembered facts about the
// player, so the tone genuinely shifts as the relationship grows instead of
// staying flat forever. A small gift picker lets the player also grant
// affection deliberately (with per-character taste, see data/gifts.js)
// instead of only through conversation.
export default function ChatScreen({
  character, player, history, affection, memory, gold,
  onNewMessage, onChatAffection, onMemoryFact, onGiveGift, onDailyQuestChat, onExit
}) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [giftPanelOpen, setGiftPanelOpen] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [history])

  function buildSystemPrompt(extra) {
    // Fold the player's self-description into the system prompt so the
    // companion's approach actually adapts (shy player -> slower approach,
    // bold player -> met more directly) per DESIGN_DOC.md §3. This is
    // appended, not prepended, so it can't override the boundaries section.
    const playerContext = player?.aspect
      ? `\n\nThe player described themselves as: "${player.aspect}". Let this genuinely shape your pacing and tone (e.g. approach more slowly for a shy/reserved description, more directly for a bold one) — but it never changes the boundaries above.`
      : ''

    const stage = relationshipStage(affection)
    const stageContext = `\n\nYour current relationship stage with the player is: "${stage}" (affection ${affection}, reflecting everything you've built together so far — shared conversations, gifts, and story moments). Let this genuinely shape your warmth and familiarity: a little more playful or guarded early on, progressively more openly affectionate, familiar, and secure as the stage advances. At the closer stages you talk like an established couple who knows each other well, and can openly use words like "my girlfriend/boyfriend" or pet names when it's natural. This never overrides the boundaries above — still never sexually explicit, still never claims to be a real human with real-world capabilities, still an immediate hard stop if the player is a minor.`

    const memoryContext = memory && memory.length
      ? `\n\nThings you've learned and remember about the player over time — bring these up naturally when it fits instead of treating every conversation like the first one: ${memory.map((f) => `"${f}"`).join('; ')}.`
      : ''

    return character.systemPrompt + playerContext + stageContext + memoryContext + (extra || '')
  }

  async function send(overrideText, { isGift, giftContext } = {}) {
    const text = (overrideText ?? input).trim()
    if (!text || sending) return
    if (!overrideText) setInput('')
    setError(null)
    const userMsg = { role: 'user', content: text }
    onNewMessage(userMsg)
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          systemPrompt: buildSystemPrompt(giftContext),
          history: [...history, userMsg]
        })
      })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      const data = await res.json()
      onNewMessage({ role: 'assistant', content: data.reply })
      if (!isGift) {
        onChatAffection()
        onDailyQuestChat?.()
        maybeExtractMemory([...history, userMsg, { role: 'assistant', content: data.reply }])
      }
    } catch (e) {
      setError("Couldn't reach the chat server — is the backend running? See README.")
    } finally {
      setSending(false)
    }
  }

  // Every few user messages, ask the server for a tiny memory update — up to
  // a couple of short facts worth remembering long-term (see server/index.js
  // POST /api/chat/memory). Best-effort and non-blocking: a failure here
  // just means memory doesn't grow this round, never a user-facing error.
  function maybeExtractMemory(fullHistory) {
    const userCount = fullHistory.filter((m) => m.role === 'user').length
    if (userCount % 4 !== 0) return
    fetch('/api/chat/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterName: character.name,
        recentMessages: fullHistory.slice(-8),
        existingMemory: memory || []
      })
    })
      .then((res) => (res.ok ? res.json() : { facts: [] }))
      .then(({ facts }) => {
        (facts || []).forEach((fact) => onMemoryFact(fact))
      })
      .catch((e) => console.error('Memory extraction skipped:', e))
  }

  const REACTION_HINTS = {
    loved: 'You genuinely LOVE this specific gift — react with real delight, it\'s exactly your kind of thing.',
    liked: 'You like this gift — react warmly and appreciatively.',
    neutral: 'This gift isn\'t especially "you," but react graciously and appreciate the thought.',
    disliked: 'This really isn\'t your kind of thing — react honestly but kindly, still touched by the gesture even if the gift itself misses the mark. Never be cruel or dismissive about it.'
  }

  function handleGiveGift(gift) {
    if (gold < gift.cost) return
    onGiveGift(gift.id)
    setGiftPanelOpen(false)
    const reaction = giftReaction(character.id, gift.id)
    const flavor = `🎁 *gives ${character.name} ${startsWithVowel(gift.name) ? 'an' : 'a'} ${gift.name.toLowerCase()}*`
    const giftContext = `\n\nThe player just gave you a gift: "${gift.name}". ${REACTION_HINTS[reaction]} React in character to receiving it before anything else in your reply.`
    send(flavor, { isGift: true, giftContext })
  }

  function startsWithVowel(word) {
    return /^[aeiou]/i.test(word)
  }

  const stage = relationshipStage(affection)

  return (
    <div className="chat-screen">
      <div className="chat-header" style={{ borderColor: character.color }}>
        <div className="chat-header-identity">
          {character.image && <img className="chat-header-avatar" src={character.image} alt={character.name} />}
          <div>
            <span style={{ color: character.color }}>{character.name}</span>
            <div className="chat-header-stage">♥ {affection} · {stage}</div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-gift-toggle" onClick={() => setGiftPanelOpen((v) => !v)}>🎁 Gift</button>
          <button className="vn-exit" onClick={onExit}>← back</button>
        </div>
      </div>

      {giftPanelOpen && (
        <div className="chat-gift-panel">
          <p className="chat-gift-panel-hint">Gold: {gold}</p>
          <div className="chat-gift-grid">
            {GIFT_CATALOG.map((gift) => (
              <button
                key={gift.id}
                className="chat-gift-item"
                disabled={gold < gift.cost || sending}
                onClick={() => handleGiveGift(gift)}
              >
                <span className="chat-gift-emoji">{gift.emoji}</span>
                <span className="chat-gift-name">{gift.name}</span>
                <span className="chat-gift-cost">{gift.cost}g</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-log" ref={scrollRef}>
        {history.length === 0 && (
          <div className="chat-empty">Say hi to {character.name} to start the conversation.</div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`chat-bubble chat-${m.role}`}>
            {m.content}
          </div>
        ))}
        {sending && <div className="chat-bubble chat-assistant chat-typing">…</div>}
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`Message ${character.name}...`}
        />
        <button onClick={() => send()} disabled={sending}>Send</button>
      </div>
    </div>
  )
}
