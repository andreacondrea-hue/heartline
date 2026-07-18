import { useState, useEffect, useRef } from 'react'
import { CHARACTERS, getCharacter } from './data/characters'
import { AVA_CHAPTERS } from './data/story/ava'
import { KAI_CHAPTERS } from './data/story/kai'
import { WREN_CHAPTERS } from './data/story/wren'
import { SABLE_CHAPTERS } from './data/story/sable'
import { activeChapterInfo } from './data/storyProgress'
import { relationshipStage } from './data/relationshipStage'
import { getGift, giftAffectionDelta } from './data/gifts'
import VisualNovel from './engine/VisualNovel'
import ChatScreen from './engine/ChatScreen'
import CharacterCreation from './screens/CharacterCreation'
import CompanionSelect from './screens/CompanionSelect'
import FirstBattle from './screens/FirstBattle'
import PackOpening from './screens/PackOpening'
import Collection from './screens/Collection'
import PartySelect from './screens/PartySelect'
import BattleArena from './screens/BattleArena'
import HumanRecruitment from './screens/HumanRecruitment'
import AuthGate from './screens/AuthGate'
import AccountSettings from './screens/AccountSettings'
import Settings from './screens/Settings'
import Achievements from './screens/Achievements'
import World from './screens/World'
import { PACKS, rollStarterTier, openPack } from './data/packs'
import { getCard, TIER_LABELS, TIER_COLORS } from './data/cards'
import { trainingCost, TRAINING_XP_GAIN } from './data/leveling'
import { resolveCard } from './data/resolveCard'
import { BOND_POINT_GAIN, bondCost } from './data/humanBond'
import { fetchRemoteSave, pushRemoteSave } from './engine/api'
import { savePendingPush, loadPendingPush, clearPendingPush } from './engine/syncQueue'
import { playMusic, playSfx, setMusicVolume, setSfxVolume, setMuted } from './engine/audioManager'
import {
  loadSave, setPlayer, addAffection, unlockChat, appendChat,
  addGold, addCardsToCollection, setRecruitedCompanion, trainCard,
  recruitHuman, bondWithHuman,
  advanceStoryChapter, addChatAffection, addMemoryFact, giveGift, claimDailyBonusIfDue,
  ensureDailyQuests, markDailyQuest, claimDailyQuests, DAILY_QUEST_GOLD,
  incrementStat, recordTacticWin, claimAchievement, setAudioSettings,
  mergeWithDefaults, getAuthToken, setAuthToken, clearAuthToken,
  hasSkippedAccount, skipAccount
} from './engine/saveState'

const STORY_CHAPTERS = { ava: AVA_CHAPTERS, kai: KAI_CHAPTERS, wren: WREN_CHAPTERS, sable: SABLE_CHAPTERS }

// Overall flow, in order for a brand-new save:
//   creation -> starterPack -> companionSelect -> battle -> story -> hub
// Every screen after that (hub/collection/packs/story/chat) is reachable
// from the hub once onboarding is done.
export default function App() {
  const [save, setSave] = useState(loadSave)
  const [screen, setScreen] = useState({ view: 'hub' })
  // Holds the just-drawn starter cards until the player actively continues
  // past the reveal — kept OUTSIDE `save` so flipping the persistent
  // claimedStarterRoll flag doesn't yank the reveal off screen before
  // they've seen it (that was a real bug caught in testing).
  const [starterReveal, setStarterReveal] = useState(null)

  // ---- Optional account layer (server/db.js via engine/api.js) ----
  // 'account' = a token is stored, so progress lives in the real database
  // and needs loading before anything else renders. 'local' = the player
  // explicitly chose (or, for saves that predate this feature, implicitly
  // already is) local-only play — no server calls, same as before this
  // feature existed. null = undecided; only shown to a session with no
  // save.player yet (see showAuthGate below) so returning local players
  // are never interrupted by a gate they never saw originally.
  const [authMode, setAuthMode] = useState(() => {
    if (getAuthToken()) return 'account'
    if (hasSkippedAccount()) return 'local'
    return null
  })
  const [accountStatus, setAccountStatus] = useState(authMode === 'account' ? 'loading' : 'idle')
  const [showBackupPrompt, setShowBackupPrompt] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  // Pause-style menu that floats over the 3D world for anything that
  // doesn't have (or doesn't deserve) a physical landmark to walk to —
  // Achievements, Settings, Account, plus a couple of duplicate shortcuts
  // to landmarked screens for players who'd rather tap than walk.
  const [worldMenuOpen, setWorldMenuOpen] = useState(false)
  // The save row's version on the server, as far as we know — sent with
  // every PUT so the server can detect "someone else (another tab, another
  // device) saved since I last loaded" instead of silently overwriting it
  // (see server/index.js's PUT /api/save handler for the other half of
  // this). Kept in a REF, not state: a successful push updates it, and if
  // it were a dependency of the debounce effect below, that update would
  // re-trigger the effect and schedule another push purely because the
  // version changed — a feedback loop that would resync on a timer
  // forever even with no real edits. A ref lets the effect read the
  // latest version without depending on it. `syncStatus` just drives a
  // small indicator in the hub so a logged-in player has some visibility
  // into whether their progress has actually reached the server.
  const saveVersionRef = useRef(null)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'synced' | 'error' | 'conflict' | 'offline'
  // Set when a PUT comes back 409 — someone else's save is sitting on the
  // server ahead of ours. Holds everything needed to let the player choose
  // which side wins rather than the app silently picking for them.
  const [conflict, setConflict] = useState(null) // { serverState, serverVersion }
  const syncTimeout = useRef(null)
  // Offline write queue (see engine/syncQueue.js): a ref mirror of `save`
  // so the backoff/retry timers below always push the LATEST local state
  // even though the timer callback closure was created several renders
  // ago, plus the backoff bookkeeping for those retries.
  const saveRef = useRef(save)
  useEffect(() => { saveRef.current = save }, [save])
  const retryAttemptRef = useRef(0)
  const pendingRetryTimeout = useRef(null)

  // The one place a save push is actually attempted, whether that's the
  // normal debounced push, a retry after a failed one, or the immediate
  // retry on the browser's 'online' event. A network failure (fetch never
  // got a response at all — `err.status` is unset, unlike a real HTTP
  // error from the server) persists the write to the offline queue and
  // reschedules itself with exponential backoff (capped at 60s) instead of
  // giving up, so a flaky connection can't silently drop progress.
  function attemptSync(token, stateToPush, baseVersion) {
    setSyncStatus('syncing')
    pushRemoteSave(token, stateToPush, baseVersion)
      .then(({ version }) => {
        saveVersionRef.current = version
        retryAttemptRef.current = 0
        clearPendingPush()
        setSyncStatus('synced')
      })
      .catch((err) => {
        if (err.status === 409 && err.data) {
          setConflict({ serverState: err.data.state, serverVersion: err.data.version })
          setSyncStatus('conflict')
          return
        }
        if (!err.status) {
          // No HTTP status at all means fetch() itself failed — offline,
          // DNS hiccup, server unreachable. Not a rejection, just not
          // delivered yet.
          savePendingPush({ state: stateToPush, baseVersion })
          setSyncStatus('offline')
          const attempt = retryAttemptRef.current
          retryAttemptRef.current = attempt + 1
          const delay = Math.min(60000, 5000 * 2 ** attempt)
          clearTimeout(pendingRetryTimeout.current)
          pendingRetryTimeout.current = setTimeout(() => {
            attemptSync(token, saveRef.current, saveVersionRef.current)
          }, delay)
          return
        }
        console.error('Save sync failed:', err)
        setSyncStatus('error')
      })
  }

  // Counterpart to attemptSync for the OTHER half of the offline story:
  // the very first load of a session that's never successfully synced at
  // all. There's no server version yet to push against, so there's
  // nothing to queue — just keep retrying the read with the same backoff
  // shape until the server answers, while the player keeps playing on
  // whatever this browser already had cached locally.
  function attemptFetchSave(token) {
    fetchRemoteSave(token)
      .then(({ state, version }) => {
        setSave(mergeWithDefaults(state))
        saveVersionRef.current = version
        retryAttemptRef.current = 0
        setAccountStatus('ready')
        setSyncStatus('synced')
      })
      .catch((err) => {
        if (!err.status) {
          const attempt = retryAttemptRef.current
          retryAttemptRef.current = attempt + 1
          const delay = Math.min(60000, 5000 * 2 ** attempt)
          clearTimeout(pendingRetryTimeout.current)
          pendingRetryTimeout.current = setTimeout(() => attemptFetchSave(token), delay)
          return
        }
        console.error('Failed to load account save:', err)
        setAccountStatus('error')
      })
  }

  // The moment the browser regains connectivity, retry right away rather
  // than waiting out whatever backoff delay is still pending — the whole
  // point of the queue is that reconnecting is the actual signal to sync,
  // not a fixed timer. Which half applies depends on whether we've ever
  // gotten a real server version: no version yet means the initial read
  // never completed (attemptFetchSave); a version plus a queued write
  // means a push is what's waiting (attemptSync).
  useEffect(() => {
    function handleOnline() {
      if (authMode !== 'account' || accountStatus !== 'ready' || conflict) return
      const token = getAuthToken()
      if (!token) return
      clearTimeout(pendingRetryTimeout.current)
      retryAttemptRef.current = 0
      if (saveVersionRef.current === null) {
        attemptFetchSave(token)
        return
      }
      const pending = loadPendingPush()
      if (!pending) return
      attemptSync(token, pending.state, pending.baseVersion)
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode, accountStatus, conflict])

  // Once-per-calendar-day "welcome back" bonus (see saveState.js's
  // claimDailyBonusIfDue) — a little gold, plus a small affection nudge with
  // whoever's already recruited. Waits for a real, stable save before
  // claiming: for account mode that means the server fetch has to finish
  // first (claiming against the local mount-time save and then having the
  // account fetch overwrite it moments later would silently discard the
  // bonus — same class of ordering bug as the save-version feedback loop
  // documented in DESIGN_DOC.md §10, so this is deliberately guarded the
  // same way). The ref ensures this only ever fires once per app session.
  const dailyBonusClaimedRef = useRef(false)
  const [dailyBonusBanner, setDailyBonusBanner] = useState(null) // { gold, companionName } | null
  useEffect(() => {
    if (dailyBonusClaimedRef.current) return
    if (authMode === 'account' && accountStatus !== 'ready') return
    if (!save.player) return
    dailyBonusClaimedRef.current = true
    const { state: next, claimed, goldGranted } = claimDailyBonusIfDue(save, save.recruitedCompanionId)
    if (claimed) {
      setSave(next)
      const companion = save.recruitedCompanionId ? getCharacter(save.recruitedCompanionId) : null
      setDailyBonusBanner({ gold: goldGranted, companionName: companion?.name || null })
    }
    // Deliberately only re-checks when these gating flags change, not on
    // every `save` update — see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode, accountStatus, save.player])

  // Daily quest checklist (see saveState.js's ensureDailyQuests) — same
  // "wait for a stable save" gating and once-per-session ref as the daily
  // bonus effect just above, for the same reason (claiming/resetting
  // against a local mount-time save that the account fetch then overwrites
  // moments later would silently discard progress).
  const dailyQuestsCheckedRef = useRef(false)
  useEffect(() => {
    if (dailyQuestsCheckedRef.current) return
    if (authMode === 'account' && accountStatus !== 'ready') return
    if (!save.player) return
    dailyQuestsCheckedRef.current = true
    setSave((s) => ensureDailyQuests(s))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode, accountStatus, save.player])

  // Audio (see engine/audioManager.js): keep the manager's live volume/mute
  // in sync with whatever's saved, and swap the looping background track to
  // match whatever's actually on screen. Both effects are plain synced
  // side effects (not gated behind the "stable save" ref pattern above)
  // since there's no risk of double-granting anything — worst case a
  // redundant `playMusic` call, which is already a no-op when the track
  // hasn't changed (see that function).
  useEffect(() => {
    setMusicVolume(save.audioSettings?.musicVolume ?? 0.5)
    setSfxVolume(save.audioSettings?.sfxVolume ?? 0.7)
    setMuted(!!save.audioSettings?.muted)
  }, [save.audioSettings])

  useEffect(() => {
    let key = 'hub'
    if (!conflict && !(authMode === 'account' && accountStatus !== 'ready') && save.player) {
      if (!save.claimedStarterRoll) key = 'hub'
      else if (!save.firstMissionDone) key = screen.view === 'battle' ? 'battle' : 'hub'
      else if (screen.view === 'story' || screen.view === 'chat') key = 'romance'
      else if (screen.view === 'battle-real') key = 'battle'
      else key = 'hub'
    }
    playMusic(key)
  }, [conflict, authMode, accountStatus, save.player, save.claimedStarterRoll, save.firstMissionDone, screen.view])

  // On mount, if we already have a token (returning account player),
  // fetch the authoritative save from the server before rendering
  // anything else — the local `save` state from loadSave() is only a
  // same-device cache and may be stale/behind.
  useEffect(() => {
    if (authMode !== 'account') return
    const token = getAuthToken()
    if (!token) { setAuthMode(null); setAccountStatus('idle'); return }

    // A pending write surviving from a previous session (see
    // engine/syncQueue.js) means the last thing we did was try to save
    // progress the server never got. Trusting a fresh fetchRemoteSave()
    // here would silently roll the player back to that older server
    // copy — so push the pending write FIRST and only fall through to
    // the normal fetch if there was nothing queued.
    const pending = loadPendingPush()
    if (pending) {
      setAccountStatus('ready') // let the player keep playing on the local copy immediately
      setSave(mergeWithDefaults(pending.state))
      saveVersionRef.current = pending.baseVersion
      attemptSync(token, pending.state, pending.baseVersion)
      return
    }

    fetchRemoteSave(token)
      .then(({ state, version }) => {
        setSave(mergeWithDefaults(state))
        saveVersionRef.current = version
        setAccountStatus('ready')
      })
      .catch((err) => {
        if (!err.status) {
          // Can't reach the server at all right now — don't block the
          // player behind an error screen for a connectivity blip. Play
          // on with whatever this browser already has cached locally,
          // and keep retrying the read in the background (attemptFetchSave)
          // with backoff, and immediately on the 'online' event, until it
          // succeeds and hands us a real version to sync against.
          console.error('Failed to load account save (offline, using local copy):', err)
          setAccountStatus('ready')
          setSyncStatus('offline')
          attemptFetchSave(token)
          return
        }
        console.error('Failed to load account save:', err)
        setAccountStatus('error')
      })
    // Only ever run once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // While logged in, debounce-push every local state change up to the
  // server so it's the durable, cross-device copy. Optimistic concurrency
  // (the `version` round-trip) means this ISN'T blind last-write-wins: if
  // another tab/device saved since we last loaded, the server rejects with
  // 409 and we surface a real choice to the player (see the conflict
  // screen below) instead of quietly clobbering their other save. This
  // effect intentionally does NOT depend on the version (see saveVersionRef
  // above) — only on `save` actually changing, plus the account/conflict
  // gating state.
  useEffect(() => {
    if (authMode !== 'account' || accountStatus !== 'ready' || saveVersionRef.current === null) return
    if (conflict) return // paused until the player resolves it (see conflict screen below)
    const token = getAuthToken()
    if (!token) return
    clearTimeout(syncTimeout.current)
    syncTimeout.current = setTimeout(() => {
      attemptSync(token, save, saveVersionRef.current)
    }, 800)
    return () => clearTimeout(syncTimeout.current)
  }, [save, authMode, accountStatus, conflict])

  const character = screen.characterId ? getCharacter(screen.characterId) : null

  if (authMode === 'account' && accountStatus === 'loading') {
    return (
      <div className="app-shell">
        <p className="chat-empty">Loading your account…</p>
      </div>
    )
  }

  if (authMode === 'account' && accountStatus === 'error') {
    return (
      <div className="app-shell">
        <p className="chat-empty">Couldn't reach the server to load your account.</p>
        <button
          onClick={() => {
            clearAuthToken()
            setAuthMode(null)
            setAccountStatus('idle')
          }}
        >
          Continue on this device instead
        </button>
      </div>
    )
  }

  // A save conflict takes priority over everything else once it happens —
  // letting the player keep playing while their progress might be about to
  // be overwritten (or silently discarded) would be worse than a brief
  // interruption. See the debounced push effect above for how this gets
  // set, and server/index.js's PUT /api/save for the version check.
  if (conflict) {
    return (
      <div className="app-shell">
        <div className="auth-gate-screen">
          <h2>Your progress conflicts with another device</h2>
          <p className="auth-gate-hint">
            Another device (or browser tab) saved to this account after this
            one last loaded. Pick which progress to keep — the other side's
            changes since then will be lost.
          </p>
          <button
            className="creation-submit"
            onClick={() => {
              const token = getAuthToken()
              pushRemoteSave(token, save, conflict.serverVersion)
                .then(({ version }) => {
                  saveVersionRef.current = version
                  clearPendingPush()
                  setSyncStatus('synced')
                  setConflict(null)
                })
                .catch((err) => console.error('Failed to resolve conflict (keep this device):', err))
            }}
          >
            Keep this device's progress
          </button>
          <button
            onClick={() => {
              setSave(mergeWithDefaults(conflict.serverState))
              saveVersionRef.current = conflict.serverVersion
              clearPendingPush()
              setSyncStatus('synced')
              setConflict(null)
            }}
          >
            Use the other device's progress instead
          </button>
        </div>
      </div>
    )
  }

  // Only a brand-new session (no player yet) with no account decision made
  // sees the gate — an existing local save (from before this feature, or
  // from an earlier explicit skip) is never interrupted by it.
  if (authMode === null && !save.player) {
    return (
      <div className="app-shell">
        <AuthGate
          onAccountReady={(token, state, version) => {
            setAuthToken(token)
            setSave(mergeWithDefaults(state))
            saveVersionRef.current = version
            setAuthMode('account')
            setAccountStatus('ready')
          }}
          onSkip={() => {
            skipAccount()
            setAuthMode('local')
          }}
        />
      </div>
    )
  }

  // ---- Onboarding gating: figure out which stage a fresh save is in ----
  if (!save.player) {
    return (
      <div className="app-shell">
        <CharacterCreation
          onComplete={(player) => setSave((s) => setPlayer(s, player))}
        />
      </div>
    )
  }

  if (!save.claimedStarterRoll) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <h1>Heartline</h1>
          <p className="app-subtitle">Welcome, {save.player.name}. Let's get you started.</p>
        </header>
        {starterReveal ? (
          <StarterReveal
            drawn={starterReveal}
            onContinue={() => {
              setSave((s) => {
                const withCards = addCardsToCollection(s, starterReveal)
                const withStat = incrementStat(withCards, 'packsOpened')
                return { ...withStat, claimedStarterRoll: true }
              })
              setStarterReveal(null)
            }}
          />
        ) : (
          <div className="pack-screen">
            <h2>Your first pack is on the house</h2>
            <button
              className="pack-starter-button"
              onClick={() => {
                setStarterReveal(openPack(rollStarterTier()))
                playSfx('packopen')
              }}
            >
              🎁 Open your free starter pack
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!save.firstMissionDone) {
    if (!screen.chosenCompanionId) {
      return (
        <div className="app-shell">
          <CompanionSelect
            orientation={save.player.orientation}
            onPick={(id) => setScreen({ view: 'battle', chosenCompanionId: id })}
          />
        </div>
      )
    }
    const chosen = getCharacter(screen.chosenCompanionId)
    if (screen.view === 'battle') {
      return (
        <div className="app-shell">
          <FirstBattle
            companion={chosen}
            collection={save.collection}
            onVictory={() => {
              setSave((s) => setRecruitedCompanion(s, chosen.id))
              setScreen({ view: 'story', characterId: chosen.id })
            }}
          />
        </div>
      )
    }
  }

  if (showBackupPrompt) {
    return (
      <div className="app-shell">
        <AuthGate
          registerOnly
          onAccountReady={(token, state, version) => {
            // Registering fresh always gets an empty `{}` server-side at
            // version 1 — push the progress already sitting in THIS
            // browser up to the new account rather than overwriting it
            // with that emptiness. version 1 is exactly what the fresh
            // row is at, so this push is expected to succeed immediately.
            setAuthToken(token)
            pushRemoteSave(token, save, version)
              .then(({ version: pushedVersion }) => {
                saveVersionRef.current = pushedVersion
                setSyncStatus('synced')
              })
              .catch((err) => {
                console.error('Initial backup push failed:', err)
                // Still set the version we DO know about (from
                // registration) rather than leaving it null — that lets
                // the normal debounced-sync effect pick this up and retry
                // on the next state change instead of silently never
                // syncing again.
                saveVersionRef.current = version
                setSyncStatus('error')
              })
            setAuthMode('account')
            setAccountStatus('ready')
            setShowBackupPrompt(false)
          }}
          onCancel={() => setShowBackupPrompt(false)}
        />
      </div>
    )
  }

  if (showLoginPrompt) {
    return (
      <div className="app-shell">
        <AuthGate
          loginOnly
          onAccountReady={(token, state, version) => {
            // Logging into an EXISTING account replaces whatever's playing
            // locally right now with that account's own save — same as
            // the very first AuthGate's login path — rather than merging,
            // since "log into a different account" implies leaving this
            // device's local progress behind in favor of the account's.
            setAuthToken(token)
            setSave(mergeWithDefaults(state))
            saveVersionRef.current = version
            setAuthMode('account')
            setAccountStatus('ready')
            setShowLoginPrompt(false)
          }}
          onCancel={() => setShowLoginPrompt(false)}
        />
      </div>
    )
  }

  // ---- Normal post-onboarding screens ----
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Heartline</h1>
        <p className="app-subtitle">a small story about small moments</p>
      </header>

      {screen.view === 'hub' && (() => {
        const c = save.recruitedCompanionId ? getCharacter(save.recruitedCompanionId) : null
        const chatReady = c && save.unlockedChat[c.id]
        const info = c ? activeChapterInfo(STORY_CHAPTERS[c.id], save, c.id) : null
        const affection = c ? save.affection[c.id] || 0 : 0

        return (
          <>
            <World
              companionId={save.recruitedCompanionId}
              onOpenMenu={() => setWorldMenuOpen(true)}
              onEnterZone={(action) => {
                if (action === 'companion') {
                  // Walking up to your companion's spot either drops you
                  // straight into whichever story beat is next, or — once
                  // that's caught up and chat has unlocked — asks which of
                  // the two you're here for (same choice the old hub
                  // buttons offered).
                  if (chatReady && info.mode === 'replay') setWorldMenuOpen('companionChoice')
                  else setScreen({ view: 'story', characterId: c.id })
                } else {
                  setScreen({ view: action })
                }
              }}
              hud={
                <div className="world-hud-card">
                  {c && (
                    <>
                      <div className="world-hud-avatar" style={{ background: c.color }}>
                        {c.image ? <img src={c.image} alt={c.name} /> : c.name[0]}
                      </div>
                      <span>{c.name} · ♥ {affection}</span>
                    </>
                  )}
                  <span className="world-hud-gold">🪙 {save.gold}</span>
                </div>
              }
            />

            {dailyBonusBanner && (
              <div className="daily-bonus-banner world-toast">
                <span>
                  🎉 Welcome back! +{dailyBonusBanner.gold} gold
                  {dailyBonusBanner.companionName ? ` and a little extra closeness with ${dailyBonusBanner.companionName}.` : '.'}
                </span>
                <button onClick={() => setDailyBonusBanner(null)}>Dismiss</button>
              </div>
            )}

            {worldMenuOpen === 'companionChoice' && c && (
              <div className="world-menu-overlay" onClick={() => setWorldMenuOpen(false)}>
                <div className="world-menu-panel" onClick={(e) => e.stopPropagation()}>
                  <h2 style={{ color: c.color }}>{c.name}</h2>
                  <div className="character-actions">
                    <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'story', characterId: c.id }) }}>
                      Replay story
                    </button>
                    <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'chat', characterId: c.id }) }}>
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {worldMenuOpen === true && (
              <div className="world-menu-overlay" onClick={() => setWorldMenuOpen(false)}>
                <div className="world-menu-panel" onClick={(e) => e.stopPropagation()}>
                  <h2>Menu</h2>

                  {save.dailyQuests && (
                    <div className="daily-quests-card">
                      <h3>Today's quests</h3>
                      <ul className="daily-quests-list">
                        <li className={save.dailyQuests.chatDone ? 'daily-quest-done' : ''}>
                          {save.dailyQuests.chatDone ? '✅' : '☐'} Chat with your companion
                        </li>
                        <li className={save.dailyQuests.trainDone ? 'daily-quest-done' : ''}>
                          {save.dailyQuests.trainDone ? '✅' : '☐'} Train a card
                        </li>
                        <li className={save.dailyQuests.battleWon ? 'daily-quest-done' : ''}>
                          {save.dailyQuests.battleWon ? '✅' : '☐'} Win a battle
                        </li>
                      </ul>
                      {save.dailyQuests.claimed ? (
                        <p className="daily-quests-claimed">Reward claimed for today ✓</p>
                      ) : (
                        <button
                          className="daily-quests-claim"
                          disabled={!(save.dailyQuests.chatDone && save.dailyQuests.trainDone && save.dailyQuests.battleWon)}
                          onClick={() => {
                            const result = claimDailyQuests(save, save.recruitedCompanionId)
                            if (result.claimed) setSave(result.state)
                          }}
                        >
                          Claim reward (+{DAILY_QUEST_GOLD} gold{save.recruitedCompanionId ? ', +3 affection' : ''})
                        </button>
                      )}
                    </div>
                  )}

                  <div className="character-actions">
                    <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'packs' }) }}>Open Packs</button>
                    <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'collection' }) }}>Collection</button>
                    <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'partySelect' }) }}>Explore (Battle)</button>
                    <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'humanRecruit' }) }}>Meet Travelers</button>
                    <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'achievements' }) }}>Achievements</button>
                    <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'settings' }) }}>Settings</button>
                    {authMode === 'account' && (
                      <button onClick={() => { setWorldMenuOpen(false); setScreen({ view: 'account' }) }}>Account</button>
                    )}
                  </div>

                  {authMode === 'account' && (
                    <p className={`hub-sync-status hub-sync-status-${syncStatus}`}>
                      {syncStatus === 'syncing' && 'Syncing…'}
                      {syncStatus === 'synced' && 'Synced ✓'}
                      {syncStatus === 'error' && 'Sync failed — will retry'}
                      {syncStatus === 'offline' && 'Offline — saved locally, will sync automatically'}
                      {syncStatus === 'idle' && 'Account connected'}
                    </p>
                  )}

                  {authMode === 'local' && (
                    <button className="hub-backup-banner" onClick={() => { setWorldMenuOpen(false); setShowBackupPrompt(true) }}>
                      ☁️ Back up your progress with a free account
                    </button>
                  )}
                  {authMode === 'local' && (
                    <button className="hub-login-link" onClick={() => { setWorldMenuOpen(false); setShowLoginPrompt(true) }}>
                      Log into an existing account
                    </button>
                  )}

                  <button className="vn-exit" onClick={() => setWorldMenuOpen(false)}>← back to world</button>
                </div>
              </div>
            )}
          </>
        )
      })()}

      {screen.view === 'account' && authMode === 'account' && (
        <AccountSettings
          token={getAuthToken()}
          onLogout={() => {
            // Local-only, doesn't touch the server or delete anything —
            // the account and its save keep existing exactly as they are;
            // this just stops THIS browser from syncing to them until the
            // player logs back in via the hub's "Log into an existing
            // account" link.
            clearAuthToken()
            skipAccount()
            setAuthMode('local')
            saveVersionRef.current = null
            setSyncStatus('idle')
            setScreen({ view: 'hub' })
          }}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}

      {screen.view === 'story' && character && (() => {
        const chapters = STORY_CHAPTERS[character.id]
        const info = activeChapterInfo(chapters, save, character.id)
        return (
          <VisualNovel
            // Keying on the active chapter's id forces a clean remount (fresh
            // internal nodeId state) whenever the active chapter actually
            // changes — belt-and-suspenders alongside the replay-affection
            // guard below, which is what normally prevents this from
            // happening mid-scene in the first place (see that comment).
            key={`${character.id}:${info.chapter.id}`}
            route={info.chapter.route}
            character={character}
            onAffection={(delta) => {
              // Replaying an already-completed chapter must NOT re-grant its
              // choices' affection — otherwise replaying a free scripted
              // scene on a loop would be a zero-cost way to farm affection,
              // undermining the whole point of gating chapters/gifts behind
              // it. This also matters for a subtler reason: without this
              // guard, affection climbing during a replay could cross the
              // NEXT chapter's threshold mid-scene, which would swap the
              // route out from under this component and crash it (caught in
              // testing — see DESIGN_DOC.md §10 for the writeup).
              if (info.mode === 'replay') return
              setSave((s) => addAffection(s, character.id, delta))
            }}
            onUnlockChat={() => {
              setSave((s) => {
                let next = unlockChat(s, character.id)
                // Only advance the chapter counter the first time chapter 1
                // actually finishes — replaying it later (its ending always
                // has unlockChat too) must not double-advance progress.
                if (info.mode === 'first') next = advanceStoryChapter(next, character.id)
                return next
              })
              setScreen({ view: 'chat', characterId: character.id })
            }}
            onChapterComplete={() => {
              // Same idea: only a genuinely NEW chapter finishing should
              // advance the counter, not a replay of an already-seen one.
              if (info.mode === 'new') {
                setSave((s) => advanceStoryChapter(s, character.id))
              }
              setScreen({ view: 'hub' })
            }}
            onExit={() => setScreen({ view: 'hub' })}
          />
        )
      })()}

      {screen.view === 'chat' && character && (
        <ChatScreen
          character={character}
          player={save.player}
          history={save.chatHistory[character.id] || []}
          affection={save.affection[character.id] || 0}
          memory={save.relationshipMemory[character.id] || []}
          gold={save.gold}
          onNewMessage={(msg) => setSave((s) => appendChat(s, character.id, msg))}
          onChatAffection={() => setSave((s) => addChatAffection(s, character.id))}
          onMemoryFact={(fact) => setSave((s) => addMemoryFact(s, character.id, fact))}
          onDailyQuestChat={() => setSave((s) => markDailyQuest(s, 'chatDone'))}
          onGiveGift={(giftId) => {
            const gift = getGift(giftId)
            if (!gift) return
            const delta = giftAffectionDelta(character.id, giftId)
            setSave((s) => giveGift(s, character.id, giftId, gift.cost, delta))
          }}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}

      {screen.view === 'packs' && (
        <PackOpening
          gold={save.gold}
          claimedStarterRoll={save.claimedStarterRoll}
          onClaimStarter={() => {}}
          onBuyPack={(packKey, drawn) => {
            setSave((s) => {
              const cost = PACKS[packKey].cost
              const withGold = addGold(s, -cost)
              const withCards = addCardsToCollection(withGold, drawn)
              return incrementStat(withCards, 'packsOpened')
            })
          }}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}

      {screen.view === 'collection' && (
        <Collection
          collection={save.collection}
          gold={save.gold}
          onTrain={(index) => {
            setSave((s) => {
              const entry = s.collection[index]
              if (!entry) return s
              const card = resolveCard(entry)
              const cost = trainingCost(card, entry.level || 1)
              if (s.gold < cost) return s
              const withGold = addGold(s, -cost)
              const trained = trainCard(withGold, index, TRAINING_XP_GAIN)
              return markDailyQuest(trained, 'trainDone')
            })
          }}
          onBond={(index) => {
            setSave((s) => {
              const entry = s.collection[index]
              if (!entry) return s
              const cost = bondCost(entry.tier || 'common')
              if (s.gold < cost) return s
              const withGold = addGold(s, -cost)
              return bondWithHuman(withGold, index, BOND_POINT_GAIN)
            })
          }}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}

      {screen.view === 'humanRecruit' && (
        <HumanRecruitment
          recruitedHumanIds={save.recruitedHumanIds}
          onRecruit={(humanId) => setSave((s) => recruitHuman(s, humanId))}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}

      {screen.view === 'achievements' && (
        <Achievements
          save={save}
          onClaim={(id, reward) => {
            const result = claimAchievement(save, id, reward)
            if (result.claimed) setSave(result.state)
          }}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}

      {screen.view === 'settings' && (
        <Settings
          audioSettings={save.audioSettings}
          onChange={(partial) => setSave((s) => setAudioSettings(s, partial))}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}

      {screen.view === 'partySelect' && (
        <PartySelect
          collection={save.collection}
          onBegin={(partyIndices) => setScreen({ view: 'battle-real', partyIndices })}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}

      {screen.view === 'battle-real' && (
        <BattleArena
          partyIndices={screen.partyIndices}
          collection={save.collection}
          onFinish={({ goldGain, xpGains, result, tactic }) => {
            setSave((s) => {
              let next = addGold(s, goldGain)
              Object.entries(xpGains).forEach(([index, xp]) => {
                next = trainCard(next, Number(index), xp)
              })
              if (result === 'win') {
                next = markDailyQuest(next, 'battleWon')
                next = incrementStat(next, 'battlesWon')
                next = recordTacticWin(next, tactic)
              }
              return next
            })
            setScreen({ view: 'hub' })
          }}
          onExit={() => setScreen({ view: 'hub' })}
        />
      )}
    </div>
  )
}

// One-time reveal for the free starter pack during onboarding, kept
// separate from PackOpening's reveal (which is for the repeatable
// paid-pack shop) since this one needs a "Continue →" that advances
// onboarding rather than a "back to packs" that would loop.
function StarterReveal({ drawn, onContinue }) {
  return (
    <div className="pack-screen">
      <h2>Your cards!</h2>
      <div className="pack-reveal-grid">
        {drawn.map((entry, i) => {
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
      <button className="creation-submit" onClick={onContinue}>Continue →</button>
    </div>
  )
}
