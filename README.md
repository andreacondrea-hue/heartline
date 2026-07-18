# Heartline — dating-sim / creature-collecting companion app (Phase 1)

A small web app (installable as a PWA, so it behaves like an app on your
phone's home screen — no App Store/Play Store review needed). Two parts:

- `client/` — the React app: character creation (with a hard 18+ gate on
  the romance feature), a starter gacha pack, a scripted first mission to
  recruit your companion, then the visual-novel story + live AI chat, plus
  a card collection screen, a pack shop (gold-only economy for now), a
  real turn-based battle system ("Explore" from the hub) using each card's
  actual stats and level — now with an elemental type-matchup layer and a
  pre-battle tactic choice, see "Battles: types & tactics" below — and a
  "Meet Travelers" screen for recruiting human allies via a consensual
  bond/contract instead of packs or combat. A small daily quest checklist
  in the hub rewards a chat, a training session, and a battle win each day.
- `server/` — a tiny Express backend that talks to the Claude API on the
  app's behalf (the frontend never touches your API key directly), plus a
  real SQLite-backed accounts/save system so progress can survive clearing
  your browser or switching devices (see "Accounts & saves" below) —
  entirely optional, the app still works with local-only saves and no
  account at all.

## What's actually playable right now

The very first screen a new session sees is a choice: create a free
account (progress synced to a real server database), log into an existing
one, or skip and just play on this device (the app's original behavior,
zero server calls). Whichever you pick, next comes: character creation →
claim a free starter pack (randomly Common-weighted
tier, see `client/src/data/packs.js`) → pick which companion to go free
(filtered by the orientation you chose) → a short scripted battle using
your starter cards (soft-scripted so you win) → that companion's story
scene → live AI chat unlocks → hub screen with your companion, your gold,
the pack shop, and your card collection. All 32 cards now have real art:
4 companions and 10 "hero" cards (3 orcs, 2 dwarves, 3 elves, 2 dragons) in
a painterly custom style, plus all 18 common/uncommon animal cards using
free stock photography (see `ATTRIBUTIONS.md`). From the hub you can also
open "Meet Travelers" to ask human allies to join you — a consensual
recruitment, not a pack pull or a fight — and grow their bond over time in
the Collection screen.

The companion relationship doesn't stop at that first scene: it's a real
3-chapter story arc that unlocks further chapters as affection grows (the
hub button becomes "💌 New moment" when one's ready), chatting itself now
earns a little affection and the AI remembers things you've told it over
time (so it doesn't treat every conversation like the first one), you can
give gifts from the chat screen (each companion has real preferences —
give Ava a book, not sparring gloves), and there's a small once-a-day
welcome-back bonus for returning. See "Companion relationships" below for
the full picture.

## Battles: types & tactics

Every card now has an elemental type — fire, storm, earth, or arcane —
on a small cyclic wheel (fire beats earth, earth beats storm, storm beats
arcane, arcane beats fire; 1.3x damage on a favorable matchup, 0.75x on an
unfavorable one). Type badges show up next to a card everywhere it
appears (Collection, party select, the battle screen), and the battle log
calls out "It's super effective!"/"It's not very effective..." on hits
where it matters — see `client/src/data/types.js`. Before a fight, you
also pick a whole-party Tactic — Aggressive (+18% ATK, -12% DEF),
Balanced (no change), or Defensive (+18% DEF, -12% ATK) — a real
tradeoff for that battle only, see `client/src/data/tactics.js`. It's not
full turn-by-turn move selection (the battle engine resolves a whole fight
in one pass — see `client/src/data/battleEngine.js`), but it's a genuine
pre-battle decision instead of the encounter playing itself with zero
input from you.

## Sound & achievements

The app now has real audio: a background theme that switches with context
(a cozy hub loop, a driving battle loop, a soft romance loop for story
chapters and chat) plus two short stingers (a battle-won fanfare, a
pack-opening chime). Open "Settings" from the hub to adjust music/SFX
volume or mute everything. One honest caveat: the five files under
`client/public/audio/` are original placeholder tracks synthesized
directly in this project rather than real recordings, since the sandbox
this was built in can't reach general websites to download audio (only
package registries) — see `AUDIO_SOURCING.md` for exactly which real,
free-licensed track to drop in over each placeholder when you have normal
internet access; no code changes needed, just replacing the file.

There's also a proper Achievements screen (open "Achievements" from the
hub) — eight one-time milestones (first pack, a level-10 card, 10 battle
wins, winning with all three tactics, 5 gifts given, your companion's top
relationship stage, recruiting every Traveler, owning a card of every
tier), each with a gold reward you claim once it's met.

## Why a backend at all?

If the browser called Claude's API directly, your API key would be visible
to anyone who opens developer tools on your site — they could copy it and
run up your bill. The server keeps the key private and is also where the
content-safety backstop lives (see `server/index.js`). It's also now home
to the accounts/save database — see the next section.

## Companion relationships

Each companion's arc is 3 chapters, gated behind affection thresholds
rather than one scene followed by flat, unbounded chat forever. Affection
comes from three places now: the scripted chapters' dialogue choices,
chatting itself (a small capped amount per day, so a marathon chat session
can't out-pace the story), and gifts (a small catalog you can give from the
chat screen — each companion has real preferences, so a loved gift is worth
much more than a disliked one). The AI's tone is built from the actual
relationship stage (Just met → Getting closer → Close → Falling for each
other → Committed partners) plus a running list of short facts it's picked
up about you in conversation, so it genuinely feels like it's paying
attention over time instead of resetting every session — all still inside
the same non-negotiable boundaries as before (never sexually explicit,
never claims to be a real human with real-world capabilities, and an
immediate, permanent stop the moment a minor discloses their age — see
`server/index.js` and `data/characters.js`). Replaying an already-completed
chapter is just for flavor — it doesn't re-grant affection, so there's no
way to farm the system by clicking through the same scene on a loop.

## Accounts & saves

By default every save lives in the browser's own localStorage, same as
before — nothing here is required to play. If you want progress to
survive clearing your browser or to continue on a different device, create
a free account from the screen the app opens with (or later, via the
"Back up your progress" button in the hub). Accounts are stored in a real
SQLite database on the server (`server/db.js`, using Node's built-in
`node:sqlite` — no separate database service to install or run) with
bcrypt-hashed passwords and JWT-signed login sessions (`server/auth.js`).
While logged in, your save auto-syncs to the server a moment after each
change; localStorage still updates too, as a same-device cache.

Forgot your password? There's no email on file to send a reset link to, so
recovery works through a one-time recovery code instead: it's shown once,
right after you register (or after any password reset), on a screen that
requires you to check "I've saved this" before continuing. Use the
"Forgot your password?" link on the login screen with that code to reset
your password — resetting also issues you a brand-new code and retires the
old one. The Account Settings screen (open "Account" from the hub while
logged in) lets you change your password, generate a new recovery code on
demand, or log out on just this device.

If two devices (or two browser tabs) are logged into the same account and
both try to save around the same time, you'll see a "Your progress
conflicts with another device" screen letting you choose which side's
progress to keep — real conflict detection, not silent last-write-wins.
See `DESIGN_DOC.md` §10 for the full design notes.

**Before deploying for real:** set a real `JWT_SECRET` in `server/.env`
(a long random string — anyone who knows the fallback dev value could
forge a login session) and make sure wherever you host the server keeps
`server/heartline.db` on **persistent** disk. Some free hosting tiers wipe
the filesystem on every redeploy/restart, which would silently reset every
account — check your host's docs, or point `DB_PATH` (see `.env.example`)
at a mounted persistent volume if it offers one.

## Running it locally

**Windows shortcut:** if you just want to play (not develop), double-click
`install.bat` once, then `play.bat` every time you want to start the game —
see `PLAY_GUIDE.docx` for the fully illustrated walkthrough. Everything
below is the manual/cross-platform version of the same steps.

You'll need [Node.js](https://nodejs.org) **22.5+** installed (the account
system uses Node's built-in SQLite support, which landed in 22.5 — the
rest of the app would run on 18+, but that built-in database needs the
newer version).

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Set up your environment
cd ../server
cp .env.example .env
# edit .env: paste in a real Claude API key, and set a real JWT_SECRET
# (both explained inline in .env.example)

# 3. Run both (two terminal tabs)
cd server && npm run dev      # starts the chat + accounts backend on :8787
cd client && npm run dev      # starts the app on :5173
```

Open the printed `localhost:5173` URL. The scripted story and local-only
saves work with no API key or account at all; you only need the Claude API
key once you unlock chat with a character, and an account is opt-in.

## Playing on your phone (no app store, no APK)

Both dev servers bind to `0.0.0.0` (see `host: true` in `client/vite.config.js`),
so any device on the same WiFi network as the computer running them can
reach the game — not just that computer itself:

1. Start both servers as above (or just run `play.bat` on Windows — it
   prints the addresses to try in step 2 automatically).
2. Find this computer's local IP address (Windows: `ipconfig`, look for
   "IPv4 Address"; Mac: System Settings → Network; Linux: `ip addr` or
   `hostname -I`). It'll look like `192.168.x.x` or `10.x.x.x`.
3. On your phone, connect to the same WiFi network, then open
   `http://<that-ip>:5173` in its browser.
4. Use the browser's menu to "Add to Home Screen" (Safari) or "Install
   app" (Chrome) — the manifest/service worker (`vite-plugin-pwa`, set up
   above) makes this a real installable PWA: its own icon, launches
   full-screen, no browser chrome.

This only works while that computer is on, connected to the same network,
and running the two dev servers — it's a LAN trick, not a deployment. For
something reachable from anywhere (cellular data, different WiFi, or after
the computer's turned off), see "Deploying it for real" below and repeat
step 3-4 against the deployed URL instead of a local IP.

A native `.apk` isn't part of this project — see "On app stores" below for
why, and what wrapping it with Capacitor would take if that's wanted later.

## Getting an Anthropic API key & what it costs

1. Go to https://platform.claude.com, create an account, add a small amount
   of billing credit (a few dollars is plenty to start).
2. Create an API key and put it in `server/.env`.
3. Cost is pay-as-you-go: the app defaults to Claude Haiku, roughly
   **$0.0015 per chat message**. Even a few thousand messages a month costs
   single-digit dollars. Set a spend limit in the Anthropic console so you
   can never be surprised by a bill.

## Deploying it for real

The repo deploys as **one single-service app**, not a separate frontend +
backend: the root `package.json`'s `build` script installs both `client/`
and `server/`'s dependencies and builds the client, and `server/index.js`
serves that built client directly (static files + an index.html fallback)
alongside the API — see the comment above `clientDist` in that file. One
process, one URL, no CORS setup, no separate static host to configure. Any
host that runs an arbitrary Node app works:

1. Push this repo to a Git host (GitHub/GitLab) if it isn't already —
   most Node hosts deploy from a connected repo.
2. Create a new Node web service on your host of choice, pointed at this
   repo, with build command `npm run build` and start command `npm start`
   (both run from the repo root — see `package.json`).
3. Set the `ANTHROPIC_API_KEY` and `JWT_SECRET` environment variables in
   the host's dashboard (never commit your `.env` file — it's gitignored
   on purpose).
4. Attach a **persistent disk/volume** and set `DB_PATH` to a file inside
   it (e.g. `/data/heartline.db`) — this is the one thing that'll bite you
   if skipped, since accounts and saves live in that one SQLite file (see
   "Accounts & saves" above). Confirm your specific host's disk actually
   survives restarts/redeploys before trusting it with real player data —
   some "free" web service tiers advertise persistent disks as a paid-tier
   feature only, with free instances running on an ephemeral filesystem
   that's wiped on every redeploy, restart, *or* scale-to-zero after
   inactivity. Check this before committing to a host — pricing and free
   tier terms across every Node host change often enough that whatever's
   written here can go stale; check the host's current docs rather than
   trusting an old README (or a chatbot's training data) on this point.
5. Once deployed, visiting the site on a phone and choosing "Add to Home
   Screen" (Safari) or "Install app" (Chrome) installs it like a native
   app — same PWA setup as the same-WiFi trick above, just now reachable
   from anywhere instead of only the same network.

**On cost:** as of when this was last checked, most Node hosts either
don't offer a truly free *and* persistent tier anymore, or offer one with
real caveats (a time-limited trial credit, an ephemeral filesystem, a
sleep-and-cold-restart cycle that can also wipe local disk on wake). A
small always-on paid tier (commonly single-digit dollars a month for a
low-traffic app like this, plus a small persistent-disk fee) is the
realistic way to get something that reliably keeps player saves intact —
budget for that rather than assuming $0, and double check current pricing
on whichever host you pick before deciding.

## On app stores

Apple and Google both apply heavy extra scrutiny to AI-companion/dating-chat
apps — many get rejected or removed even when the content itself is tame.
That's why this is built web-first. If it gets traction and you want a real
App Store/Play Store listing later, wrapping this same codebase with
[Capacitor](https://capacitorjs.com) is the standard path — but treat that
as a "phase two," not a blocker to shipping.

## Content boundaries (built in, not optional)

Both characters' system prompts (`client/src/data/characters.js`) explicitly
keep things flirty/romantic and instruct the model to redirect rather than
comply if a user pushes for explicit content. The server
(`server/index.js`) adds a second, code-level backstop that intercepts
obviously explicit requests before they even reach the model. If you expand
this app, keep both layers — don't rely on the prompt alone.

## What's here vs. what's next

Done: character creation with the 18+ gate, 4 companions with full story
routes + AI chat, all 32 cards with real art (10 hero cards painterly
custom-gen, 18 animal cards via free stock photography), the 6-tier gacha
pack system with correct compositions/odds, card leveling (1-100, with a
real xp curve and stat scaling — see `DESIGN_DOC.md` §10 and
`client/src/data/leveling.js`) trainable with gold from the Collection
screen, a real turn-based battle system (pick up to 3 cards, fight a wild
encounter, turn order by speed, damage from actual atk/def/level — see
`client/src/data/battleEngine.js`) reachable via "Explore" from the hub
and paying out gold + xp on top of gold-training, the scripted
first-mission recruitment battle (kept intentionally soft-scripted since
it's a story beat, not meant to be losable), and the **human bond/
recruitment mechanic** (see `DESIGN_DOC.md` §7 and
`client/src/data/humanBond.js`): a "Meet Travelers" hub screen lets you ask
not-yet-met humans to join you — never a pack pull, purchase, or something
you win in a fight, since the original "bought as slaves" idea was rejected
during design in favor of this consensual ask-and-agree model. Recruited
humans (currently Toren Ashfield and Mira Calloway) sit in your normal
Collection, level 1-100 like every other card, and additionally grow
through a "Spend time together" action that spends gold for bond points,
evolving them Common → Uncommon → Rare → Super Rare as thresholds are
crossed (their stats jump to that tier's block). They fight in real
battles alongside your other cards the same way. Save/resume works via
the browser's local storage by default, PWA manifest installs on phones,
and progress can now optionally live in a **real server-side database**
instead of local-only storage (see `DESIGN_DOC.md` §10 and "Accounts &
saves" above): create a free account (or log into one) from the very first
screen, or skip and stay local-only exactly like before this existed. A
"back up your progress" button in the hub lets an existing local player
opt in later without losing what they've already built. Every card's
ability is also now a **real mechanical effect**, not flavor text — see
`DESIGN_DOC.md` §7 and `client/src/data/battleEngine.js`: dodges, stuns,
bleed/burn damage-over-time, party-wide and single-target buffs/debuffs,
a taunt, area-of-effect hits, a double strike, guaranteed first-hit crits,
and passive heals, covering all 30 abilities on the roster (verified by
simulating 11,000+ battles across every card matchup with zero crashes).
Accounts also now have a full **password reset + multi-device polish**
pass (see `DESIGN_DOC.md` §10 and "Accounts & saves" above): a one-time
recovery code stands in for email-based reset (there's no email on file
to send a link to), an Account Settings screen handles password changes,
recovery-code regeneration, and logout, a "Log into an existing account"
hub link lets a local-mode or logged-out player sign back in, and
server-side save versioning means two devices racing to save no longer
silently clobber each other — the player sees a real conflict screen and
picks which side's progress to keep. Toren and Mira also now have real
portrait art (see `CHARACTER_ROSTER.md`), so the full 16-character roster
(4 companions, 10 hero cards, 2 recruitable humans) has real art, no emoji
fallbacks left. Companion relationships also got a real **depth pass** (see
`DESIGN_DOC.md` §10 and "Companion relationships" above): each companion's
one scene became a 3-chapter affection-gated arc, chatting itself now earns
capped daily affection and feeds a running memory of things you've told
the AI back into future conversations so its tone tracks the relationship
stage instead of staying flat, a gift system with real per-companion taste
lets you deliberately grow the relationship (not just talk your way there),
and a small once-a-day welcome-back bonus rewards returning. A real bug
surfaced during this pass and is documented honestly in `DESIGN_DOC.md`
§10: replaying an already-seen chapter could originally still farm
affection for free and, in one case, crash the story screen — both fixed.
After `COMPETITIVE_ANALYSIS.md` compared Heartline against creature-
collector, otome, and AI-companion peers, the three highest-impact,
buildable-now gaps it flagged got closed (see `DESIGN_DOC.md` §10 for the
full writeup): an **elemental type-matchup system** (fire/storm/earth/
arcane on a small cyclic wheel, a real damage multiplier, badges + battle
log callouts — see "Battles: types & tactics" above), a **pre-battle
Tactic/Stance choice** (Aggressive/Balanced/Defensive, a genuine whole-
party tradeoff for that fight, since the battle engine's one-pass
architecture doesn't support full turn-by-turn control), and a **daily
quest checklist** (chat once, train a card, win a battle, for a combined
gold+affection reward) layered alongside the existing once-a-day bonus.
Verified with 5,000 simulated battles across every tactic/level
combination plus full Playwright coverage (including a mocked chat API so
the chat-quest step doesn't need a real Anthropic key to test). Two more
gaps from that same analysis are now also closed: a real **audio system**
(see "Sound & achievements" above) with a Settings screen finally worth
having, and an **Achievements** screen with eight one-time collection/
progression milestones — verified via Playwright with `window.Audio`
instrumented to confirm the right track and stinger fire at the right
moments, plus a full run confirming an achievement becomes claimable at
the right point and grants its reward exactly once.

Realistic next steps: unique CG/milestone art for each companion's later
story chapters (the art-sourcing pipeline already works — see
`CHARACTER_ROSTER.md` — this is mostly content production, not
engineering), and swapping the placeholder audio for the real licensed
tracks listed in `AUDIO_SOURCING.md` once there's normal internet access
to fetch them — both still open in `COMPETITIVE_ANALYSIS.md`. Also still
open: an offline write queue for the account sync (today it
still requires a live connection to push a change — there's no local
queue-and-retry for saves made while offline), and — much later, after
real legal review — real-money pack purchases (`DESIGN_DOC.md` §12).
Multiplayer/guilds/PvP/trading remain a distinct future project per
`DESIGN_DOC.md` §11.
