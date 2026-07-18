// Tiny save-game layer. This is a real deployed app (not a Claude.ai
// artifact preview), so localStorage is the right tool here for persisting
// progress between visits/sessions on the player's own device.

import { applyXpGain } from '../data/leveling'
import { BOND_THRESHOLDS, nextTier } from '../data/humanBond'

const KEY = 'heartline_save_v1'

// ---- Optional account layer (server/db.js) ----
// Play always works purely on localStorage with no account at all — these
// keys just track whether the player has since opted into a real account
// (progress backed by a real server-side database, surviving a cleared
// browser or a new device) or explicitly chosen to stay local-only. See
// App.jsx for how these gate the AuthGate screen, and engine/api.js for
// the actual network calls.
const AUTH_TOKEN_KEY = 'heartline_auth_token'
const SKIP_ACCOUNT_KEY = 'heartline_skip_account'

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function hasSkippedAccount() {
  return localStorage.getItem(SKIP_ACCOUNT_KEY) === '1'
}

export function skipAccount() {
  localStorage.setItem(SKIP_ACCOUNT_KEY, '1')
}

const defaultState = {
  // --- character creation (locked in once set, see CharacterCreation.jsx) ---
  player: null, // { name, orientation: 'girls'|'guys'|'both', assistantName, aspect, ageConfirmedAdult }
  recruitedCompanionId: null, // set after the first "free your companion" mission
  firstMissionDone: false,

  // --- companions (existing dating-sim layer) ---
  affection: {}, // { [characterId]: number }
  unlockedChat: {}, // { [characterId]: boolean }
  chatHistory: {}, // { [characterId]: [{role, content}] }

  // --- relationship depth (chapters, chat affection, memory, gifts) ---
  storyChapter: {}, // { [characterId]: number } — index of the NEXT chapter to play, 0 = first chapter not yet done
  chatAffectionToday: {}, // { [characterId]: { date: 'YYYY-MM-DD', count } } — soft daily cap on affection earned from chatting alone
  relationshipMemory: {}, // { [characterId]: string[] } — short facts the character has learned about the player, surfaced back into future chat
  giftsGiven: {}, // { [characterId]: { [giftId]: count } } — just a log, mainly so a "you've given them 3 of these" flavor could reference it later
  lastDailyBonusDate: null, // 'YYYY-MM-DD' — gates the once-per-day welcome-back bonus

  // --- daily quest checklist (see COMPETITIVE_ANALYSIS.md §6/§7 "no daily
  // quest checklist beyond the single once-a-day login bonus") ---
  dailyQuests: null, // { date, chatDone, trainDone, battleWon, claimed } | null until first ensured

  // --- cards/gacha/economy (new) ---
  gold: 300, // small head start so a player can afford at least a Common pack
  collection: [], // [{ cardId, level, xp, tier?, bondPoints? }] — tier/bondPoints only present on human entries
  claimedStarterRoll: false,

  // --- humans (recruited via bond/contract, not pulled from packs — see data/humanBond.js) ---
  recruitedHumanIds: [],

  // --- lifetime stats (feed the achievements list in data/achievements.js —
  // most achievement conditions read straight off other save fields, but a
  // few need a running total nothing else already tracks) ---
  stats: { battlesWon: 0, packsOpened: 0, tacticsWon: [] },
  unlockedAchievements: [], // achievement ids whose one-time reward has already been claimed

  // --- audio settings (see engine/audioManager.js) ---
  audioSettings: { musicVolume: 0.5, sfxVolume: 0.7, muted: false }
}

// Fills in any fields a saved/loaded state is missing (new fields added
// after a save was created, or the empty `{}` a freshly-registered account
// starts with) using the current defaultState — the one place this
// merge logic lives, used by both local loads and account loads.
export function mergeWithDefaults(partial) {
  return { ...structuredClone(defaultState), ...(partial || {}) }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(defaultState)
    return mergeWithDefaults(JSON.parse(raw))
  } catch {
    return structuredClone(defaultState)
  }
}

export function writeSave(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function setPlayer(state, player) {
  const next = { ...state, player }
  writeSave(next)
  return next
}

export function addAffection(state, characterId, delta) {
  const current = state.affection[characterId] || 0
  const next = { ...state, affection: { ...state.affection, [characterId]: current + delta } }
  writeSave(next)
  return next
}

// Marks the current story chapter finished and moves to the next one —
// see data/story/*.js for the chapter arrays and App.jsx for how the
// active chapter is picked based on this index + the affection threshold
// the NEXT chapter needs.
export function advanceStoryChapter(state, characterId) {
  const current = state.storyChapter[characterId] || 0
  const next = { ...state, storyChapter: { ...state.storyChapter, [characterId]: current + 1 } }
  writeSave(next)
  return next
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

const CHAT_AFFECTION_DAILY_CAP = 8

// Small, steady affection gain from just talking, capped per calendar day
// per character so one long chat marathon can't out-race the story's
// pacing (chapters gate on affection thresholds — see data/story/*.js).
// A no-op past the cap: returns the same state unchanged.
export function addChatAffection(state, characterId) {
  const today = todayString()
  const record = state.chatAffectionToday[characterId]
  const count = record && record.date === today ? record.count : 0
  if (count >= CHAT_AFFECTION_DAILY_CAP) return state
  const withCounter = {
    ...state,
    chatAffectionToday: { ...state.chatAffectionToday, [characterId]: { date: today, count: count + 1 } }
  }
  return addAffection(withCounter, characterId, 1)
}

const MAX_MEMORY_FACTS = 15

// Appends a short remembered fact about the player for this character —
// deduped with a loose substring check (good enough for short facts, not
// meant to be a real semantic-dedup system) and capped so the memory stays
// a highlights reel instead of growing forever. See engine/ChatScreen.jsx
// for where these get extracted and data/characters.js for how they're
// folded back into the system prompt.
export function addMemoryFact(state, characterId, fact) {
  const trimmed = (fact || '').trim()
  if (!trimmed) return state
  const existing = state.relationshipMemory[characterId] || []
  const alreadyKnown = existing.some(
    (f) => f.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(f.toLowerCase())
  )
  if (alreadyKnown) return state
  const nextFacts = [...existing, trimmed].slice(-MAX_MEMORY_FACTS)
  const next = { ...state, relationshipMemory: { ...state.relationshipMemory, [characterId]: nextFacts } }
  writeSave(next)
  return next
}

// Applies a gift's gold cost and affection delta in one write (delta/cost
// are looked up by the caller from data/gifts.js — this file doesn't need
// to know about gift content, same separation as the rest of the economy).
export function giveGift(state, characterId, giftId, cost, affectionDelta) {
  const currentAffection = state.affection[characterId] || 0
  const log = state.giftsGiven[characterId] || {}
  const next = {
    ...state,
    gold: Math.max(0, state.gold - cost),
    affection: { ...state.affection, [characterId]: currentAffection + affectionDelta },
    giftsGiven: { ...state.giftsGiven, [characterId]: { ...log, [giftId]: (log[giftId] || 0) + 1 } }
  }
  writeSave(next)
  return next
}

const DAILY_BONUS_GOLD = 25
const DAILY_BONUS_AFFECTION = 2

// Once-per-calendar-day "welcome back" bonus: a little gold always, plus a
// small affection nudge with whoever's already recruited (if anyone is).
// Returns { state, claimed } rather than just state, so the caller (hub)
// can decide whether to show a "welcome back" banner this load or not.
export function claimDailyBonusIfDue(state, recruitedCompanionId) {
  const today = todayString()
  if (state.lastDailyBonusDate === today) return { state, claimed: false }
  let next = { ...state, lastDailyBonusDate: today, gold: state.gold + DAILY_BONUS_GOLD }
  if (recruitedCompanionId) {
    const current = next.affection[recruitedCompanionId] || 0
    next = { ...next, affection: { ...next.affection, [recruitedCompanionId]: current + DAILY_BONUS_AFFECTION } }
  }
  writeSave(next)
  return {
    state: next,
    claimed: true,
    goldGranted: DAILY_BONUS_GOLD,
    affectionGranted: recruitedCompanionId ? DAILY_BONUS_AFFECTION : 0
  }
}

// ---- Daily quest checklist ----
// Three small, cheap-to-check tasks (chat once, train a card, win a battle)
// layered on top of the existing once-a-day welcome-back bonus — see
// COMPETITIVE_ANALYSIS.md §7 recommendation #4. Reuses the save hooks that
// already exist for each of those actions rather than adding any new
// tracking infrastructure; `ensureDailyQuests` is the same
// "reset if the calendar date has rolled over" pattern as
// `claimDailyBonusIfDue` above, just applied to a small object of flags
// instead of a single timestamp.
export const DAILY_QUEST_GOLD = 40
export const DAILY_QUEST_AFFECTION = 3

function freshDailyQuests(date) {
  return { date, chatDone: false, trainDone: false, battleWon: false, claimed: false }
}

// Resets today's checklist if it's stale (a new calendar day, or no
// checklist yet) — a no-op (same state back) if today's checklist already
// exists, so this is safe to call defensively wherever quest progress is
// read or written.
export function ensureDailyQuests(state) {
  const today = todayString()
  if (state.dailyQuests && state.dailyQuests.date === today) return state
  const next = { ...state, dailyQuests: freshDailyQuests(today) }
  writeSave(next)
  return next
}

// Marks one of today's three tasks done. Idempotent (re-marking an
// already-done task is a no-op past the initial ensure) and safe to call
// from any action handler without that handler needing to know whether
// today's checklist has been initialized yet.
export function markDailyQuest(state, questKey) {
  const withFresh = ensureDailyQuests(state)
  const dq = withFresh.dailyQuests
  if (dq[questKey]) return withFresh
  const next = { ...withFresh, dailyQuests: { ...dq, [questKey]: true } }
  writeSave(next)
  return next
}

// Claims the combined reward once all three tasks are done for today.
// Returns { state, claimed, ... } (like claimDailyBonusIfDue) so the caller
// can tell whether anything actually happened.
export function claimDailyQuests(state, recruitedCompanionId) {
  const withFresh = ensureDailyQuests(state)
  const dq = withFresh.dailyQuests
  const allDone = dq.chatDone && dq.trainDone && dq.battleWon
  if (!allDone || dq.claimed) return { state: withFresh, claimed: false }
  let next = { ...withFresh, dailyQuests: { ...dq, claimed: true }, gold: withFresh.gold + DAILY_QUEST_GOLD }
  if (recruitedCompanionId) {
    const current = next.affection[recruitedCompanionId] || 0
    next = { ...next, affection: { ...next.affection, [recruitedCompanionId]: current + DAILY_QUEST_AFFECTION } }
  }
  writeSave(next)
  return {
    state: next,
    claimed: true,
    goldGranted: DAILY_QUEST_GOLD,
    affectionGranted: recruitedCompanionId ? DAILY_QUEST_AFFECTION : 0
  }
}

export function unlockChat(state, characterId) {
  const next = { ...state, unlockedChat: { ...state.unlockedChat, [characterId]: true } }
  writeSave(next)
  return next
}

export function appendChat(state, characterId, message) {
  const history = state.chatHistory[characterId] || []
  const next = {
    ...state,
    chatHistory: { ...state.chatHistory, [characterId]: [...history, message] }
  }
  writeSave(next)
  return next
}

export function addGold(state, delta) {
  const next = { ...state, gold: Math.max(0, state.gold + delta) }
  writeSave(next)
  return next
}

export function addCardsToCollection(state, drawnCards) {
  const next = { ...state, collection: [...state.collection, ...drawnCards] }
  writeSave(next)
  return next
}

export function setRecruitedCompanion(state, characterId) {
  const next = { ...state, recruitedCompanionId: characterId, firstMissionDone: true }
  writeSave(next)
  return next
}

// Grants `xpGain` xp to the collection entry at `index` (not by cardId,
// since a player can own several copies of the same card — each is its
// own entry/level/xp track). Rolls any earned level-ups in via
// applyXpGain (data/leveling.js). Defensive `|| 0`/`|| 1` defaults here
// mean saves created before leveling existed still work without a
// migration step.
export function trainCard(state, index, xpGain) {
  const entry = state.collection[index]
  if (!entry) return state
  const { level, xp } = applyXpGain(entry.level || 1, entry.xp || 0, xpGain)
  const nextCollection = state.collection.map((e, i) => (i === index ? { ...e, level, xp } : e))
  const next = { ...state, collection: nextCollection }
  writeSave(next)
  return next
}

// Recruits a human ally by their bond/contract (see data/humanBond.js) —
// adds them to the collection at Common tier, level 1. No-ops if already
// recruited (each human is a unique individual, not a pullable card, so
// there's no such thing as owning a second copy).
export function recruitHuman(state, humanId) {
  if (state.recruitedHumanIds.includes(humanId)) return state
  const entry = { cardId: humanId, race: 'human', tier: 'common', level: 1, xp: 0, bondPoints: 0 }
  const next = {
    ...state,
    recruitedHumanIds: [...state.recruitedHumanIds, humanId],
    collection: [...state.collection, entry]
  }
  writeSave(next)
  return next
}

// Deepens the bond with a recruited human at collection index `index`,
// evolving them to the next tier once they cross that tier's threshold
// (BOND_THRESHOLDS in data/humanBond.js). Bond progress resets to 0 within
// the new tier — the point is reaching Super Rare through real investment,
// not stacking overflow points endlessly.
export function bondWithHuman(state, index, bondGain) {
  const entry = state.collection[index]
  if (!entry) return state
  let bondPoints = (entry.bondPoints || 0) + bondGain
  let tier = entry.tier || 'common'
  const threshold = BOND_THRESHOLDS[tier]
  if (threshold && bondPoints >= threshold) {
    tier = nextTier(tier)
    bondPoints = 0
  }
  const nextCollection = state.collection.map((e, i) => (i === index ? { ...e, tier, bondPoints } : e))
  const next = { ...state, collection: nextCollection }
  writeSave(next)
  return next
}

// ---- Lifetime stats + achievements ----
// A few achievement conditions (data/achievements.js) can be read directly
// off other save fields (collection, giftsGiven, recruitedHumanIds), but
// cumulative counts like "battles won" and "which tactics you've won with"
// aren't tracked anywhere else, so these small helpers exist just to feed
// those. Called alongside the existing action that already updates related
// state (App.jsx's pack-opening and battle-result handlers), not as a
// separate system.
export function incrementStat(state, key, delta = 1) {
  const next = { ...state, stats: { ...state.stats, [key]: (state.stats?.[key] || 0) + delta } }
  writeSave(next)
  return next
}

export function recordTacticWin(state, tacticId) {
  const existing = state.stats?.tacticsWon || []
  if (existing.includes(tacticId)) return state
  const next = { ...state, stats: { ...state.stats, tacticsWon: [...existing, tacticId] } }
  writeSave(next)
  return next
}

// Grants an achievement's one-time reward and marks it claimed. Idempotent —
// re-claiming an already-unlocked achievement is a no-op ({claimed: false}),
// same return shape as claimDailyBonusIfDue/claimDailyQuests so the caller
// can tell whether anything actually happened.
export function claimAchievement(state, achievementId, reward = {}) {
  if (state.unlockedAchievements.includes(achievementId)) return { state, claimed: false }
  let next = {
    ...state,
    unlockedAchievements: [...state.unlockedAchievements, achievementId],
    gold: state.gold + (reward.gold || 0)
  }
  if (reward.affection && state.recruitedCompanionId) {
    const current = next.affection[state.recruitedCompanionId] || 0
    next = { ...next, affection: { ...next.affection, [state.recruitedCompanionId]: current + reward.affection } }
  }
  writeSave(next)
  return { state: next, claimed: true }
}

// ---- Audio settings (see engine/audioManager.js) ----
export function setAudioSettings(state, partial) {
  const next = { ...state, audioSettings: { ...state.audioSettings, ...partial } }
  writeSave(next)
  return next
}
