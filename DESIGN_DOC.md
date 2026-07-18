# Heartline: Tamer's Path — Game Design Document (v0.1 draft)

This is a first full-vision draft based on everything described so far. Where
something in the original description was ambiguous or contradictory, I've
made a specific assumption and **flagged it clearly** so you can correct it
before we build anything. Treat this as a living document, not a locked spec.

---

## 0. Trust & Safety — non-negotiable, read this first

The romantic/flirty companion feature (§4-5) requires a **hard 18+ gate**
that cannot be worked around in any form:

- **Signup-time**: the app must get an explicit 18+ attestation before the
  companion/romance feature is reachable at all (standard practice for
  every real AI-companion app). Self-attestation is weak protection on its
  own, but it's the required minimum baseline — not optional.
- **Mid-conversation backstop**: if a player discloses at any point during
  play that they're under 18, the romantic dynamic stops immediately and
  permanently for that conversation — not a de-aged companion, not a
  relabeling as "big sister/brother" while keeping romantic undertones,
  no version of it continues. This is now implemented as a two-layer
  backstop in the actual code (not just this doc): the character system
  prompts instruct the model to hard-stop on any minor disclosure
  (`client/src/data/characters.js`), and the server independently scans the
  full conversation history for age-disclosure patterns and overrides the
  reply before it ever reaches the model
  (`server/index.js` — `MINOR_DISCLOSURE_PATTERNS`).
- Non-romantic parts of the game (creature collecting, battling, the
  non-romantic Guide/Assistant) can stay general-audience if you want that,
  but the girlfriend/boyfriend feature specifically must never be reachable
  by anyone under 18, regardless of what age or "aspect" they entered at
  character creation (since a real user could lie at signup and disclose
  the truth later — the mid-conversation backstop exists for exactly that
  case).

---

## 1. Open questions / assumptions that need your confirmation

**Confirmed:** Legendary = Elves, God Tier = Dragons. Everything below and
throughout this doc already uses that split.

Remaining places where I had to guess or resolve a contradiction:

1. **Rare/Super Rare supply cap.** You wrote "rare and super rare are 99000
   cards" — I've assumed this means **each** tier has its own 99,000-card
   cap (not a shared 99,000 split between both). *Confirm.*
2. **God Tier supply cap.** No number was given. I've provisionally proposed
   **1,000** as an extremely scarce cap, obtainable only via (a) the God
   Tier pack's hardest missions, or (b) fusing 1 Legendary + 1 Super Rare
   card. *Needs your number.*
3. **Starter pack vs. purchased pack.** I've interpreted this as: every new
   player gets **one free pack with a randomly rolled tier** (weighted
   heavily toward Common — classic "starter roll"), OR can **pay** (gold or
   real money) to buy a pack of a **guaranteed** tier instead. *Confirm this
   matches what you meant by "chose if want to buy one pack or start with
   the starter pack."*
4. **Goblins.** Mentioned once for the mountain region but never assigned a
   tier. I've treated them as a common/uncommon-tier variant living
   alongside Rare-tier Orcs in the mountains (flavor/lower-tier enemies, not
   a separate card race). *Confirm or reassign.*
5. **Player character's own race.** Card races (animal/orc/dwarf/elf/dragon)
   are for tamed creatures. I've assumed the **player character** is
   presumably human (or you pick a portrait/race purely for flavor, with no
   gameplay effect) — separate from what they tame. *Confirm.*
6. **Underworld inhabitants.** Mentioned on the map but no race/tier was
   assigned. Proposed as a **future expansion** (e.g. a "Demon" race) rather
   than in the initial roster.

---

## 2. Core fantasy (one paragraph)

You create a character, get an AI companion who joins you after your first
(rigged-to-win) battle, and set out into a world of seven kinds of
recruitable/tamable beings — animals, orcs, dwarves, humans, elves,
dragons, and (eventually) something underworldly — that you recruit or
catch, level from 1-100, battle with, trade, and sell. Packs (bought with
gold or real money) are how you get new cards, weighted so common
creatures are plentiful and dragons are a once-in-months event.

**Note on the human race:** per your description, humans can evolve up to
Super Rare and be "bought" the same way other races are. I've implemented
this as humans being **recruited via a bond/contract mechanic** (won over
through a quest line, same economic weight as taming — tradeable and
sellable to guilds the same way orcs/dwarves/elves are) rather than
literally sold as slaves. Everything else about how you described them
(evolve up to Super Rare, tradeable, sellable) is preserved — see §7.

---

## 3. Player character creation

Locked in permanently at creation (per your spec):
- **Name**
- **Companion orientation preference**: girls / guys / both — determines
  which companions are offered later
- **Assistant's name** (see §4)
- **Age**: not applicable to the player at all — this describes
  companions/NPCs/humans-as-a-race in the game world only, and says
  nothing about and places no requirement on the real person playing. Per
  your latest note, in-fiction ages are now **randomized per character**
  rather than fixed at 20-22. One firm floor I'm keeping regardless: every
  in-fiction character, especially anyone in a romantic/companion role,
  stays a clearly-adult age — I'd suggest randomizing within something like
  20-27 rather than opening the range downward, so there's a comfortable
  buffer above 18 rather than sitting right at the line.
- **"Aspect" description**: a free-text self-description (e.g. "shy and
  quiet," "confident and a bit of a flirt") that is fed into the romantic
  companion's AI system prompt so their behavior adapts to you — a shy
  self-description makes the companion approach slowly; a bold one gets met
  with more directness. This is the same mechanism as the character system
  prompts already built in the MVP, just parameterized by your input instead
  of fixed.
- **Player race**: cosmetic only (see open question #6) unless you want it
  to affect gameplay (e.g. a small stat bonus), which I'd recommend against
  for v1 to keep balance simple.

---

## 4. The two AI-driven NPCs

Both reuse the guardrail pattern from the existing MVP (flirty ceiling,
explicit content refused and redirected in-character, real distress breaks
character to respond with genuine care) — that boundary doesn't change as
the game gets bigger.

**The Guide/Assistant** — non-romantic, always present, handles tutorial and
ongoing quest guidance. Named by the player at creation. System prompt
emphasizes competence, warmth, and clarity over flirting.

**The Companion** (girlfriend/boyfriend) — chosen from the roster matching
the player's stated orientation preference, recruited via the first "free
them in battle" mission (see §8), fights alongside the player afterward,
and flirts/escalates romantic tone based on the player's "aspect"
description. Below is the initial roster.

---

## 5. Companion roster (v1: 4 characters)

For each, I've written a full personality brief plus an **art-direction
prompt** you can paste into an external image generator (Midjourney,
DALL-E/ChatGPT, Stable Diffusion, etc.) — written for stylized fantasy
game-card art, not photoreal, and deliberately framed as a fully-clothed
portrait/bust shot to avoid anything explicit. Send me the resulting image
files and I'll wire them into the game.

### Ava — witty bookshop regular (already in the MVP)
Dry humor, warm underneath the deadpan, values being challenged
intellectually more than being flattered.

> **Art prompt:** "Fantasy game character portrait, young woman, early
> twenties, warm brown skin, curly dark hair pulled back with reading
> glasses pushed up on her head, wearing a cozy cardigan over a simple top,
> holding a well-worn book, soft bookshop lighting, half-body portrait,
> confident dry smile, painterly fantasy RPG card art style, fully clothed,
> PG, no text, no watermark."

### Kai — anxious musician, secretly a softie (already in the MVP)
Overthinks everything, disappears into his music, quietly affectionate once
he trusts someone.

> **Art prompt:** "Fantasy game character portrait, young man, early
> twenties, tousled dark hair, soft nervous smile, wearing a loose
> hand-knit sweater, holding an acoustic guitar, warm indoor lighting,
> half-body portrait, painterly fantasy RPG card art style, fully clothed,
> PG, no text, no watermark."

### Wren (bisexual, beastkin) — UPDATED per generated art
Originally written as a fully-human therian (psychological kinship with
wolves, no physical trait). The portrait you generated shows literal wolf
ears, so — per your call — Wren is now a **beastkin**: an actual
wolf-hybrid fantasy race, born with wolf ears and instincts, fitting
alongside orcs/elves/dwarves as another humanoid race in the world rather
than a human with an internal identity. Bisexual, so she's available
regardless of which gender the player is pursuing. Personality unchanged:
blunt, fiercely loyal, more comfortable around tamed animals than people,
warms up slowly but completely once she does. **Portrait received and
wired into the app as `wren.jpg`.**

> **Art prompt:** "Fantasy game character portrait, young woman, early
> twenties, sharp amber eyes, undercut dark hair with a few braided
> strands, wolf-fur-trimmed practical travel cloak, faint wolf-paw pendant
> necklace, standing in a forest clearing, confident grounded stance,
> half-body portrait, painterly fantasy RPG card art style, fully clothed,
> PG, no text, no watermark."

### NEW — Sable (competitive rival-turned-companion)
For contrast against Ava (witty) and Wren (grounded/quiet): Sable is bold,
competitive, first met as a rival tamer who beats the player in an early
skirmish, and joins the roster once the player earns her respect rather
than her affection outright — her arc is "grudging respect into something
more," which plays well against a player whose "aspect" description is
more assertive.

> **Art prompt:** "Fantasy game character portrait, young woman, early
> twenties, sharp confident grin, short choppy auburn hair, light battle
> scar across one eyebrow, fitted leather tamer's armor with a creature
> whistle around her neck, dynamic three-quarter pose, half-body portrait,
> painterly fantasy RPG card art style, fully clothed, PG, no text, no
> watermark."

*Note: the roster is currently 3 female / 1 male. If you want real parity
for "guys" or "both" preference players, we should add at least one more
male companion — happy to draft one if you want it.*

---

## 6. World map

| Region | Inhabitants | Card tier |
|---|---|---|
| Wild Forest | Common/uncommon animals (deer, wolves, boars → lions, tigers, elephants) | Common / Uncommon |
| Deep/Sacred Forest | Elves | Legendary |
| Mountain foothills | Orcs & goblins | Rare (goblins as lower-tier flavor, see open question #5) |
| Deep Mines | Dwarves | Super Rare |
| Human settlements/villages | Humans (recruited via bond/contract, see §2 and §7) | Common → Super Rare (evolves) |
| Sacred Peaks | Dragons | God Tier |
| Underworld | TBD (future expansion) | TBD |
| Starter City | Neutral hub — registration, guild hall, market, pack shop | — |

---

## 7. Creature/card system

Every card has: **Name, Race, Tier, Level (1-100), Role (Attacker /
Defender / Support), Stats (ATK / DEF / SPD / HP), one signature Ability.**

Rather than 1,000 unique designs up front (not realistic for a first
build — see §11), v1 launches with a **starting roster of ~35 cards**
across the six tiers, built as data files so adding #36 onward later is
just adding a new entry, not rewriting the engine:

- Common (10 cards): rabbit, deer, boar, fox, wolf, hawk, badger, goat,
  raccoon, crow
- Uncommon (8 cards): lion, tiger, elephant, bear, rhino, crocodile,
  gorilla, buffalo
- Rare (6 cards): 3 orc warriors + 3 orc shaman/archer variants (male &
  female of each)
- Super Rare (4 cards): 2 dwarf warriors + 2 dwarf smiths/runemasters + 2
  humans at their evolved Super Rare form (see below)
- Legendary (3 cards): 3 elf variants (ranger, mage, blade-dancer)
- God Tier (2 cards): 2 dragon variants (fire, storm) — fusion-only, see §9

**Humans as an evolving race:** unlike the other races (which are a fixed
tier per card), humans start as a low-tier recruit and **evolve upward
through play** — Common → Uncommon → Rare → Super Rare — as they level and
complete bond quests with the player, capping out at Super Rare rather
than being pulled at a fixed tier from packs. This matches "they can evolve
up to super rare" and gives them a distinct identity from the other races
(which you build a whole roster of, vs. humans being a small number of
individuals you personally grow).

**Bond/recruitment mechanic (implemented):** `client/src/data/humanBond.js`,
`client/src/screens/HumanRecruitment.jsx`, `client/src/data/resolveCard.js`.
Humans are never pulled from packs, bought, or won in battle — a hub button
("Meet Travelers") lists not-yet-met humans, each with a simple, consensual
"Ask them to join you" action. That's a deliberate, permanent design
choice: an earlier "bought as slaves" framing was explicitly rejected
during design and reworked into this ask-and-consent model, and nothing
about the mechanic should ever read as owning or winning a person. Once
recruited, a human sits in the normal Collection alongside every other
card — same 1-100 level/xp track via `leveling.js` — but additionally
carries a `tier` and `bondPoints` on their collection entry (every other
race's tier is fixed on the card itself; a human's is not). A "Spend time
together" button in Collection spends gold (`bondCost(tier)` — 25g at
Common, 50g at Uncommon, 100g at Rare) for a flat +20 bond points; crossing
that tier's threshold (100 / 250 / 500 bond points for Common / Uncommon /
Rare) evolves the human to the next tier's stat block and resets bond
progress within the new tier. Rare → Super Rare is presented as the final
evolution (no further threshold), matching "capping out at Super Rare"
above. The v1 roster ships two humans — Toren Ashfield (attacker) and Mira
Calloway (support) — each with per-tier stat blocks; adding more is just
adding entries to the `HUMANS` array, same data-driven pattern as every
other race. Because a human's tier isn't fixed on the card, every screen
that displays or battles with a collection entry (Collection, PartySelect,
BattleArena) resolves it through `resolveCard(entry)` rather than calling
`getCard(entry.cardId)` directly — that resolver is the one place that
knows humans are special; the screens themselves don't. Toren and Mira
now both have real portrait art too (`client/public/cards/toren.jpg` and
`mira.jpg` — see `CHARACTER_ROSTER.md`), the same painterly style as the
hero cards, so no card on the roster is still on the emoji fallback.

Example stat template (Uncommon — Lion):
`ATK 62 / DEF 48 / SPD 55 / HP 140`, Ability: *Pride Rally* — boosts the
whole party's ATK for 2 turns.

**On 3D battle visuals:** you mentioned cards should "come to life" as
high-quality 3D creatures in battle. Flagging scope honestly here, same as
with character art: I don't have any 3D model-generation tool available,
and true "high quality" 3D models (even just for a 35-card starting
roster) normally means commissioning a 3D artist per creature or
buying/adapting 3D asset packs, plus building the game in an actual 3D
engine (e.g. Three.js) rather than the 2D card-UI approach. That's a
distinct skill set and budget line from everything else here. **Confirmed
path: Phase 1 ships with 2D stylized art** with battle animation/motion
effects (cards can still feel alive — screen shake, particle effects,
sprite animation — without being full 3D models); genuine 3D is a later
phase once there's budget for assets/an artist or a 3D generation tool is
available.

**Battle engine (implemented):** `client/src/data/battleEngine.js`. Pick
up to 3 cards from your collection, the game rolls a wild 1-2 card
encounter (common/uncommon animals, leveled around your party's average),
and the whole fight resolves via real stat math: turn order by SPD
(fixed for the fight), damage = `atk * diminishing-returns-DEF-mitigation
* ±15% variance`, each actor targets the opponent at the lowest HP%. A
battle ends when one side is fully knocked out (or after 30 rounds, judged
by total remaining HP% — a safety valve, not something you'll normally
see). Win rewards gold + 50 xp per party card; a loss still gives 15 xp
each so a defeat teaches the roster something rather than being pure
downside.

**Unique ability effects (implemented):** every card's ability used to be
flavor text only — a ~30% chance the log would say the attacker "used" it,
with zero mechanical difference from a plain hit. Each of the 30 abilities
(28 cards + Toren and Mira, see §7's human section) now has a real,
distinct effect that `battleEngine.js` actually executes: Rabbit dodges
attacks for a turn, Bear's Maul applies a real damage-over-time bleed,
Lion's Pride Rally buffs the whole party's ATK, Bram Ironhand's Honor
Guard genuinely redirects enemy targeting to him, Faelynn's Twin Strike
really does hit twice, the dragons' breath attacks really do hit every
enemy at once (Stormcaller's with a real stun chance per target), and so
on — roughly 27 distinct effect categories in total (evasion, stuns,
bleed/burn DOTs, defense-piercing at various strengths, party-wide and
single-target ATK/DEF buffs and debuffs, taunt, AoE, a double-strike,
guaranteed-first-hit crits, and passive heals), covering every ability on
the roster. Effects are tagged in data (`{ trigger, type, ... }` on each
`ability`) rather than hand-written per card, so several cards share an
effect type with only the numbers differing — normal for a card game's
effect vocabulary, and it kept 30 cards' worth of mechanics maintainable
in one file instead of 30 bespoke functions. Verified by simulating over
11,000 1-on-1 battles across every card matchup (every effect type
confirmed to fire at least once, no crashes, no invalid HP/damage states)
in addition to the usual Playwright pass through the real UI.

---

## 8. Gacha pack system

Six pack tiers, each yielding **5 cards**, composition as you specified:

| Pack | Contents |
|---|---|
| Common | 5 Common |
| Uncommon | 2 Uncommon + 3 Common |
| Rare | 2 Rare + 2 Uncommon + 1 Common |
| Super Rare | 2 Super Rare + 2 Rare + 1 Uncommon |
| Legendary | 2 Legendary + 3 Super Rare |
| God Tier | 2 God Tier + 3 Legendary |

**Free starter roll** (proposed odds, tune later):
Common 60% / Uncommon 25% / Rare 10% / Super Rare 4% / Legendary 0.9% /
God Tier 0.1%.

**Reward cadence for non-purchased cards** (as you specified):
- Common/Uncommon: unlimited, earnable daily via low-tier missions
- Rare/Super Rare: capped supply (see open question #2), one card roughly
  every 15 days via mission or pack
- Legendary: capped at 10,000 total, one roughly every 3-4 months via a
  hard mission or pack
- God Tier: extremely scarce (see open question #3), via the hardest
  missions, the God Tier pack, or fusion

---

## 9. Fusion

Consume **1 Legendary + 1 Super Rare** card to create **1 God Tier** card.
This is the only guaranteed (non-RNG) path to God Tier and should probably
be the *expected* main path, with pack pulls being the lottery-ticket path.

---

## 10. Progression & first-session flow

1. Character creation (name, orientation, assistant name, aspect
   description)
2. Tutorial, guided by the Assistant
3. First mission: **free your companion** — they fight using your starter
   pack's cards; this battle should be tuned so the player wins essentially
   every time (soft-scripted difficulty, not genuine RNG risk)
4. Companion joins your party
5. Travel together to the Starter City, register
6. Open world begins — missions, taming, battling, pack pulls, trading

**Leveling (implemented):** 1-100 per card, in `client/src/data/leveling.js`.
The XP curve is gentle early (level 1→2 needs 25 xp) and steeper late
(level 99→100 needs ~1,495 xp) so hitting 100 is a real long-term goal.
Stats scale linearly at +3%/level above the card's level-1 base, so a
level-100 card is roughly ~4x its level-1 stats. Since there's no real
battle engine yet (battles are still soft-scripted), the only XP source
for now is spending gold to "train" a card directly from the Collection
screen — a flat 40 xp per training action, at a gold cost that scales with
both the card's current level and its tier (a Legendary costs ~7x what a
Common costs to train at the same level). This slots in cleanly as one XP
source among several once a real battle/mission system exists to hand out
XP too — training doesn't need to go away, it just stops being the only
option. (Now that the real battle engine exists — see §7 — battles are
also a live XP/gold source alongside training, exactly as anticipated
here.)

**Accounts & persistence (implemented):** `server/db.js`, `server/auth.js`,
`client/src/engine/api.js`, `client/src/screens/AuthGate.jsx`. Save data
originally lived only in the browser's localStorage — fine for a quick
prototype, but progress vanished if the player cleared browser data or
tried to continue on a different device. The server now has a real
database (SQLite via Node's built-in `node:sqlite`, not a third-party
native module — see the comment in `db.js` for why: native SQLite addons
need to download prebuilt binaries from nodejs.org at install time, which
isn't available in every environment, while Node's built-in SQLite needs
nothing extra) with a `users` table (username + bcrypt password hash) and
a `saves` table (one JSON blob per user — the exact same save shape the
client already used for localStorage, so this is a persistence swap, not a
data-model change). A brand-new session sees an "AuthGate" screen before
character creation: create an account, log into an existing one, or skip
and play on just this device (today's original behavior, no server calls
at all — an account is an opt-in upgrade, not a requirement). Returning
players who already had a local save before this feature existed are never
interrupted by that gate; a "back up your progress" banner in the hub lets
them opt in later, which uploads their current local save to a new account
rather than overwriting it with the empty one a fresh registration starts
with. While logged in, every state change debounce-syncs to the server
~800ms after it settles; localStorage keeps working the whole time too, as
a same-device cache.

**Password reset (implemented):** `server/recoveryCode.js`,
`client/src/screens/AuthGate.jsx`, `client/src/screens/AccountSettings.jsx`.
Since signup never collects an email address — and this project's dev
environment can't test real email delivery even if it did — password
recovery uses a one-time recovery code instead of an emailed reset link.
Registration (and every password reset) generates a code from a charset
that skips visually-ambiguous characters (`0`/`O`, `1`/`I`/`L`), formatted
as `XXXX-XXXX-XXXX-XXXX`, and shows it to the player exactly once on a
"save your recovery code" screen with a mandatory "I've saved this"
checkbox gating the continue button — the server stores only a bcrypt hash
of it, never the plaintext, so this is the only moment it's ever visible.
A "Forgot your password?" link on the login screen lets a player reset
using their username + recovery code + a new password; a successful reset
rotates the code (the old one stops working, a new one is issued and shown
using the same reveal screen) so a leaked-and-used code can't be reused.
The new **Account Settings** screen (reachable from the hub while logged
in) also lets a player change their password directly (current password +
new password) or regenerate their recovery code on demand (e.g. if they
suspect the old one leaked), both gated behind re-entering the current
password, plus a "log out on this device" action. Logging out is
local-only — it doesn't touch the account or its save, it just stops this
browser from syncing until the player signs back in via the hub's new
"Log into an existing account" link (previously the *only* login screen
was the one shown to brand-new sessions, which a returning player who'd
already onboarded, or who'd just logged out, would never see again).

**Multi-device conflict handling (implemented):** `server/db.js`,
`server/index.js`, `client/src/App.jsx`. The `saves` table now carries a
`version` integer alongside each user's state blob. Every save push sends
the version the client last saw; the server only accepts the write if that
matches the row's current version (and increments it on success), and
rejects with a 409 plus the server's actual current state+version if it
doesn't. On the client, a 409 surfaces as a real player-facing screen —
"Your progress conflicts with another device" — offering a genuine choice
between keeping this device's progress (overwriting the server) or
adopting the other device's progress instead (overwriting this device),
rather than either silently clobbering one side or silently discarding
changes the way naive last-write-wins sync would. This replaces the
previous deliberate scope cut ("sync is last-write-wins, no conflict
resolution") called out in an earlier pass of this document.

One implementation pitfall worth recording here since it was subtle enough
to nearly ship: the client's "last known version" was originally React
state, and also a dependency of the debounced auto-sync effect. Since a
successful push's own success handler updated that state, and the effect
re-ran whenever any of its dependencies changed, every successful sync
re-triggered the same effect — which scheduled another sync ~800ms later
even with no actual content change, which succeeded and bumped the
version again, forever. It didn't crash or throw; it just meant a client
silently kept "self-resyncing" and racing its own known version ahead,
which is exactly the kind of bug that only shows up when you go looking
for it — it was caught by a dedicated two-browser-context test that
expected a real conflict and initially failed to reproduce one. The fix
was moving that version out of React state and into a `useRef` (read
inside the effect via `.current`, not listed as a dependency), so reading
the "last known version" no longer triggers a re-run of the effect that
writes it.

**Relationship depth (implemented):** `client/src/data/story/*.js`,
`client/src/data/storyProgress.js`, `client/src/data/relationshipStage.js`,
`client/src/data/gifts.js`, `client/src/engine/ChatScreen.jsx`,
`server/index.js`'s `/api/chat/memory`. Before this pass, every companion
had exactly one short scripted scene ending in "here's my number," and from
then on it was flat, unbounded AI chat with zero mechanical weight —
chatting never moved affection, the AI had no sense of how close the
relationship actually was, and there was nothing scripted left to reach
for. Four things changed that:

- **Multi-chapter story arcs.** Each companion's single scene is now
  chapter 1 of a 3-chapter arc (`unlockAffection: 0, 12, 30` — the same
  thresholds the relationship-stage ladder below uses, so the story
  advancing and the AI acting closer happen on one shared scale, not two
  disconnected ones). `data/storyProgress.js`'s `activeChapterInfo` decides,
  from `save.storyChapter[id]` (index of the next not-yet-played chapter)
  and current affection, whether the hub button should say "Continue
  story" (chapter 1 still pending), "💌 New moment: <title>" (a new chapter
  just unlocked), or "Replay story" (nothing new yet, so replay the most
  recent chapter instead of showing nothing). `VisualNovel.jsx` gained a
  generic "chapter end" state — any node with no choices left shows a plain
  Continue button wired to `onChapterComplete`, distinct from chapter 1's
  ending, which always shows the "give your number" chat-unlock button
  instead.
- **Chat that earns affection and remembers you.** Every chat exchange now
  grants a small affection tick via `addChatAffection` (saveState.js),
  capped at 8/day per companion so a long single-session chat marathon
  can't out-race the story's pacing the way gifts or scripted choices can.
  Separately, every few user messages `ChatScreen.jsx` calls the new
  `POST /api/chat/memory` endpoint, which asks the model for up to 2 short
  new facts worth remembering about the player (deduped against what's
  already known, capped at 15 facts, oldest dropped) — these get folded
  back into every future system prompt alongside a relationship-stage
  description (`data/relationshipStage.js`'s affection ladder: Just met →
  Getting closer → Close → Falling for each other → Committed partners) so
  the character's warmth and familiarity genuinely track the relationship
  instead of staying flat forever. This is explicitly scoped to stay inside
  the existing safety boundaries already in each character's system prompt
  (never sexually explicit, never claims to be a real human with
  real-world capabilities, immediate hard stop on any minor disclosure) —
  the dynamic stage/memory text is appended, not a replacement, and
  restates those boundaries inline as a second layer rather than assuming
  the base prompt alone will hold under a much warmer, more personalized
  tone.
- **Gifts** (`data/gifts.js`): a small shared catalog (8 items, 10-35 gold)
  with per-companion taste (loved/liked/disliked, defaulting to neutral) —
  Ava loves books, Wren loves a hand-carved charm, Sable loves sparring
  gear, Kai loves a rare vinyl record, and so on. Giving a gift deducts
  gold and grants affection immediately (+8/+4/+1/-3 for loved/liked/
  neutral/disliked) via `giveGift` in saveState.js, then sends a synthetic
  chat turn ("🎁 *gives Ava a well-loved book*") through the normal chat
  endpoint with a one-off system-prompt hint about which reaction category
  it was, so the character's in-character reply genuinely matches the
  mechanical outcome instead of reacting identically to every gift.
- **A once-per-day welcome-back bonus** (`claimDailyBonusIfDue`): a little
  gold plus a small affection nudge with whoever's recruited, claimed once
  per calendar day and gated behind the save actually being stable (waits
  for the account fetch to finish in account mode, same ordering care as
  the version-tracking bug above) so it can't be silently discarded by a
  server save overwriting the local one moments later.

**A real bug caught in testing, worth recording honestly:** the first
version of "Replay story" let a player replay an already-completed chapter
and still collect its choices' affection every time — a free, zero-cost way
to farm affection by clicking through the same scene on a loop, which would
have undermined the entire point of gating chapters and gifts behind
affection thresholds. Worse, since replayed choices genuinely moved
affection, a long enough replay session could push affection past the
*next* chapter's threshold **while the player was still inside the chapter
being replayed** — which flipped `activeChapterInfo`'s chosen chapter out
from under the already-mounted `VisualNovel` component mid-scene (same
component instance, new `route` prop, but its internal "current node" state
doesn't reset on a prop change, only on a true remount) and crashed on an
undefined node lookup. A Playwright test written to confirm replaying a
chapter doesn't double-advance its progress counter is what surfaced it —
it kept replaying and clicking through the same scene, which is exactly
the sequence needed to trigger the crash. The fix has two parts: replays
no longer call `onAffection` at all (`info.mode === 'replay'` short-circuits
it in App.jsx), which closes the farming exploit and, as a side effect,
means affection can no longer change mid-replay at all — but `VisualNovel`
is now also explicitly `key`-ed on the active chapter's id as a second,
independent safeguard, so any future case that swaps the active chapter
while mounted forces a clean remount instead of silently carrying over
stale internal state.

**Competitive gap-closing pass (implemented):** after `COMPETITIVE_ANALYSIS.md`
identified the two biggest structural gaps versus creature-collector peers
(no elemental/type system, no player-chosen battle actions at all) plus a
smaller, cheap-to-add gap (no daily quest checklist beyond the single
login bonus), all three were built:

- **Elemental type system** (`client/src/data/types.js`): a small 4-type
  cyclic advantage wheel — fire > earth > storm > arcane > fire — rather
  than a full Pokémon-scale chart, since the goal was closing "no
  counter-pick layer at all" without turning team-building into a
  spreadsheet. Every card in `cards.js` and both humans in `humanBond.js`
  now carries a `type` (assigned by flavor fit — a sturdy ex-soldier is
  "earth", a mage is "arcane", a dragon that breathes literal fire is
  "fire" — aiming for a roughly even spread: 8 fire, 8 earth, 8 storm, 6
  arcane across the 30-character roster). `battleEngine.js`'s
  `computeDamage()` folds in a 1.3x/0.75x/neutral multiplier via
  `effectivenessMultiplier()`, and the battle log now prints "It's super
  effective!"/"It's not very effective..." alongside the normal hit line.
  Type badges are shown in `Collection.jsx`, `PartySelect.jsx`, and
  `BattleArena.jsx`. Verified with 5,000 simulated random-matchup battles
  (across all tactic choices and levels 1-100) with zero crashes, plus the
  effectiveness wheel's three cases (super/not-very/neutral) spot-checked
  directly.
- **Pre-battle Tactic/Stance choice** (`client/src/data/tactics.js`,
  wired into `BattleArena.jsx`): a real (if scaled-down) answer to
  "battles are fully auto-resolved, zero player agency" — the single
  biggest gap after the missing type system. A full turn-by-turn
  move-selection rework isn't realistic against `runBattle()`'s
  architecture (it resolves an entire fight synchronously in one pass with
  no pause points — see that file's header), so this adds one real,
  whole-battle decision instead: Aggressive (+18% ATK/-12% DEF),
  Balanced (no change), or Defensive (+18% DEF/-12% ATK), applied to the
  player's party for that fight only via `applyTactic()`. It's a genuine
  tradeoff with no dominant option, which is what makes it real agency
  rather than a coat of paint, and the choice is echoed as the first line
  of the battle log so it's clear it actually did something.
- **Daily quest checklist** (`saveState.js`'s `ensureDailyQuests` /
  `markDailyQuest` / `claimDailyQuests`, a hub widget in `App.jsx`): three
  small tasks reset each calendar day — chat with your companion once,
  train a card, win a battle — each marked done by the same save hooks
  those actions already fire (`ChatScreen.jsx`'s send flow, the
  Collection train handler, a battle result of `'win'`), with a combined
  +40 gold / +3 affection reward once all three are done. Layered
  alongside the existing once-a-day welcome-back bonus rather than
  replacing it — the two are independent and both show in the hub.

All three were verified end-to-end via Playwright against a mocked
`/api/chat` (so the chat quest step doesn't need a real Anthropic key to
test): type badges render in all three screens, the tactic picker's
selection is reflected in the battle log, effectiveness text appears on
super/not-very-effective hits, each quest step flips on its trigger, the
claim button stays disabled until all three are done, and claiming grants
the reward exactly once per day. Existing regression suites (battle,
human-bond, relationship-depth/replay-guard) were re-run afterward and
still pass unchanged.

**Audio system + achievements (implemented):** closing two more items from
`COMPETITIVE_ANALYSIS.md` §6 — no sound anywhere, and no achievements/
collection-completion rewards.

- **Audio** (`client/src/engine/audioManager.js`, `client/src/data/audio.js`,
  `client/src/screens/Settings.jsx`): a module-level singleton (not a React
  hook/context, since playback is genuinely global browser state) exposes
  `playMusic(key)` / `playSfx(key)` / volume + mute setters. `App.jsx` gets
  one small effect that maps the current screen to a music key — `hub` for
  every menu-ish screen, `romance` for story chapters and chat, `battle`
  for both the scripted intro fight and real battles — and calls
  `playMusic()` every render (a no-op if that track's already playing, so
  it's safe to call unconditionally). Two SFX stingers fire at the moment
  they narratively matter, not on the later "Continue" click: `victory` the
  instant a battle result resolves to a win (`BattleArena.jsx`,
  `FirstBattle.jsx`), `packopen` the instant a pack reveal happens
  (`PackOpening.jsx`, and the onboarding starter-pack button in `App.jsx`).
  Volume/mute live in `save.audioSettings`, so they persist and sync like
  everything else in the save, and the new Settings screen (finally
  justified — see the original deferral note above) is just two sliders
  and a mute checkbox.

  **Important scope note on the actual audio files:** this sandbox's
  network access is restricted to package registries, not general
  websites, so the six real Pixabay Music tracks found and shortlisted
  earlier couldn't actually be downloaded into the repo (`pixabay.com` and
  its CDN are unreachable from here). The five files under
  `client/public/audio/` are instead original placeholders — synthesized
  directly with numpy (simple chord/arpeggio synthesis, encoded to mp3
  with ffmpeg) — so the app has real, functioning, zero-licensing-risk
  audio today rather than staying silent. `AUDIO_SOURCING.md` documents
  exactly which real Pixabay track to drop in over which placeholder
  filename whenever there's normal internet access to fetch them; no code
  changes needed when that happens, just replacing the file.

- **Achievements** (`client/src/data/achievements.js`,
  `client/src/screens/Achievements.jsx`): eight one-time milestones —
  first pack opened, a card to level 10, 10 battle wins, winning with all
  three tactics (tying the reward system directly to the tactic feature
  above), 5 gifts given, reaching the top relationship stage, recruiting
  both Travelers, and owning a card of every tier. Each `check(save)` reads
  live off existing save fields for everything except two genuinely new
  cumulative counters (`stats.battlesWon`, `stats.tacticsWon`) that nothing
  else was tracking — added to `saveState.js` alongside the fields they
  measure. The Achievements screen re-evaluates every condition on render
  and shows a Claim button for anything newly true but not yet in
  `save.unlockedAchievements`, the same pattern already established by the
  daily quest checklist's claim button.

Both were verified via Playwright with `window.Audio` instrumented (a
proxy that logs every construction and `.play()` call, since a headless
browser can't be listened to) to confirm the right track plays at the
right screen transition and the right stinger fires at the right moment,
plus a full onboarding-through-battle run confirming the "First Steps"
achievement becomes claimable exactly when a pack is opened, grants its
reward once, and `stats.battlesWon`/`stats.tacticsWon` update correctly
after a real battle win. Existing regression suites were re-run again
afterward with zero new failures.

---

## 11. Multiplayer systems (Phase 2+, not in the first build)

- **Parties**: players group up
- **PvP/"PK"**: opt-in or zone-restricted is strongly recommended (pure
  open-world PvP with loot-stealing tends to drive away new players fast —
  most successful games in this genre restrict it to flagged zones or
  consensual duels)
- **Guilds**: sell tamed creatures for gold; gold buys almost anything,
  including Super Rare cards
- **Trading** between players

All of this requires real backend infrastructure (authoritative server,
anti-cheat, a persistent database of who owns which of the capped-supply
cards) — this is a genuinely large undertaking on top of the single-player
game and should be scoped as its own project once the core loop is proven
fun.

---

## 12. Monetization & legal considerations (real money is part of the plan)

Since you confirmed real-money pack purchases are the goal, a few factual
things worth knowing before building the payment system — I'm not a lawyer
and this isn't legal advice, just flagging real, jurisdiction-dependent
risk so you can get proper advice before launch:

- **Randomized paid purchases ("loot boxes") are restricted or banned
  outright in some countries.** Belgium and the Netherlands have both ruled
  against paid loot boxes with randomized rewards. Several other
  jurisdictions (e.g. China) require you to publicly disclose exact drop
  odds for every tier.
- **Real-world value/tradeability is the biggest risk multiplier.** The
  more a rare card looks like it has real cash value (tradeable,
  resellable, "will have a lot of value" as you put it), the closer the
  mechanic drifts toward how regulators define gambling. Keeping card value
  strictly in-game (no official cash-out, no player-to-player real-money
  trading) is the single biggest thing that keeps this in "collectible game
  item" territory rather than "unlicensed gambling product" territory.
- **Apple and Google both require odds disclosure** for any loot-box-style
  mechanic as a store policy matter, separate from the legal questions
  above.
- **Practical mitigations** commonly used: publish drop odds publicly,
  never allow real-money cash-out of pulled cards, age-gate purchases,
  consider spending caps.
- **Recommendation**: before you take a single real payment, get an actual
  gaming/gambling-law consultation for whatever country you're
  incorporating/launching in — this is genuinely not something either of us
  can self-certify as compliant, and the penalties for getting it wrong
  (fines, forced shutdown, store delisting) are real.

---

## 13. Recommended build order

1. **Phase 1 (buildable now)**: single-player prototype — character
   creation, both AI NPCs, the ~35-card starting roster, pack-opening with
   in-game-gold-only economy (no real money yet), simple turn-based
   battles, the scripted "free your companion" opening mission.
2. **Phase 2**: swap in your externally-generated character art once ready;
   expand the card roster past 35.
3. **Phase 3**: real-money purchases — only after the legal groundwork in
   §12 is actually done.
4. **Phase 4**: multiplayer — parties, PvP, guilds, trading — as its own
   project with real backend infrastructure.

This keeps every phase something that can actually ship and be played,
rather than one enormous build that never reaches a playable state.
