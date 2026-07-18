# Heartline — Art Sourcing Guide

How to get all the art this game needs without spending money or burning
weeks generating images one at a time. Split into three buckets: free
pre-made packs (environments, generic creatures, UI), custom AI-generated
art (companions and named "hero" cards), and code-only (no image needed).

---

## 1. Free image generators (no subscription needed)

Since you haven't picked one yet, here's what's actually free right now,
based on current info:

- **Google Gemini** ("Nano Banana 2" image mode) — roughly 20 free images/day,
  simplest to just start with.
- **ChatGPT (free tier)** — image generation built in, easiest conversational
  interface, tighter daily limit than Gemini.
- **Leonardo.ai** — free daily credits, and has a "Consistent Character"
  feature specifically for keeping the same character's face/design
  consistent across multiple generated images. **Use this one for the 4
  companions** — you'll likely want each of them in more than one pose/scene
  eventually (story scenes, chat avatar, card art), and this feature is
  built exactly for that problem.
- **Craiyon** — no account needed at all, unlimited, but noticeably lower
  quality — fine as a last resort.

Pick whichever's easiest to access; the prompts below are written in plain
language so they work reasonably well on any of these (Midjourney users
would want to add `--ar 3:4 --style raw`-type parameters, but that's not
needed for the others).

Sources: [Best Free AI Image Generators 2026 — DataCamp](https://www.datacamp.com/blog/best-free-ai-image-generators), [10 Best Free AI Image Generators — WaveSpeed](https://wavespeed.ai/blog/posts/best-free-ai-image-generators-2026/)

---

## 2. Free pre-made asset packs (world regions, UI — NOT the animal cards)

**Update:** we looked into using free packs for the 18 common/uncommon
animal cards specifically, but no single free pack covers all 18 species
(rabbit, deer, boar, fox, wolf pup, hawk, badger, goat, raccoon, crow,
lion, tiger, elephant, bear, rhino, crocodile, gorilla, buffalo) in one
consistent style — the best CC0 match (Kenney's Animal Pack Redux) only
had 8 of them, in a cute flat-icon style that wouldn't match the painterly
hero cards. Decision: all 18 animal cards are getting custom AI-gen art
instead, same workflow as the hero cards — full prompts are in
`CHARACTER_ROSTER.md`.

For the 7 world regions and UI chrome (borders, buttons, panels), free
packs are still the plan — use these instead of custom-generating each
one:

- **[Kenney.nl](https://kenney.nl/assets)** — completely free, CC0 (no
  attribution even required), huge fantasy-RPG-relevant catalog. Specifically
  useful: [Retro Fantasy Kit](https://kenney.nl/assets/retro-fantasy-kit),
  [RPG Base](https://kenney.nl/assets/rpg-base),
  [Roguelike/RPG pack](https://kenney.nl/assets/roguelike-rpg-pack) (has
  animal/creature sprites), [Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit)
  (great for the Starter City), [Fantasy UI Borders](https://kenney.nl/assets/fantasy-ui-borders)
  and [UI Pack RPG Expansion](https://kenney.nl/assets/ui-pack-rpg-expansion)
  for buttons/panels/frames.
- **itch.io** ([itch.io/game-assets](https://itch.io/game-assets)) — search
  "fantasy forest background," "mountain tileset," "animal sprite pack" —
  tons of $0-15 packs, filter by "free."
- **OpenGameArt.org** — community-uploaded, filter by CC0/CC-BY license,
  good backup if Kenney doesn't have a specific creature you need.

---

## 3. Custom AI-generated art (companions + "hero" cards only)

Reserve actual prompting effort for characters that need to look like
*specific individuals*, not generic animals. That's the 4 companions
(prompts already in `DESIGN_DOC.md` §5) plus the named humanoid/dragon
cards below — these are the highest-tier, most "special" cards in the game
and worth the custom treatment.

All written for stylized fantasy game-card art, half-body portraits, fully
clothed, PG — same direction as the companion prompts, so the whole roster
feels visually consistent.

### Rare tier — Orcs (3 needed)

> "Fantasy game character portrait, orc warrior, muscular build, green-grey
> skin, tusked lower jaw, braided dark hair, wearing worn leather and iron
> plate armor, holding a battle axe, fierce but not grotesque, painterly
> fantasy RPG card art style, half-body portrait, no text, no watermark."

> "Fantasy game character portrait, female orc shaman, green-grey skin,
> tribal tattoos, wearing bone jewelry and layered ritual cloth, holding a
> carved wooden staff with a glowing charm, wise and intense expression,
> painterly fantasy RPG card art style, half-body portrait, no text, no
> watermark."

> "Fantasy game character portrait, orc archer, lean muscular build,
> green-grey skin, short cropped hair, wearing practical leather ranger
> gear, holding a recurve bow, alert focused expression, painterly fantasy
> RPG card art style, half-body portrait, no text, no watermark."

### Super Rare tier — Dwarves (2 needed)

> "Fantasy game character portrait, dwarf warrior, stocky powerful build,
> thick braided red beard, wearing ornate steel plate armor, holding a
> war-hammer, proud confident stance, painterly fantasy RPG card art style,
> half-body portrait, no text, no watermark."

> "Fantasy game character portrait, female dwarf runesmith, stocky build,
> braided hair with metal clasps, wearing a leather smith's apron over
> chainmail, holding a glowing rune-etched hammer, focused craftsmanlike
> expression, painterly fantasy RPG card art style, half-body portrait, no
> text, no watermark."

### Legendary tier — Elves (3 needed)

> "Fantasy game character portrait, elf ranger, slender graceful build,
> pointed ears, long silver hair, wearing forest-green leather armor,
> holding an ornate longbow, calm alert expression, painterly fantasy RPG
> card art style, half-body portrait, no text, no watermark."

> "Fantasy game character portrait, elf mage, slender build, pointed ears,
> flowing dark hair, wearing elegant blue-and-silver robes, holding a
> crystal-topped staff with soft magical glow, serene focused expression,
> painterly fantasy RPG card art style, half-body portrait, no text, no
> watermark."

> "Fantasy game character portrait, elf blade-dancer, slender athletic
> build, pointed ears, short windswept hair, wearing light fitted armor
> with flowing fabric accents, holding twin curved blades, dynamic
> confident pose, painterly fantasy RPG card art style, half-body portrait,
> no text, no watermark."

### God Tier — Dragons (2 needed)

> "Fantasy game creature portrait, majestic fire dragon, deep red and
> ember-orange scales, glowing amber eyes, wings partially spread, perched
> on a mountain peak, powerful and awe-inspiring but not menacing,
> painterly fantasy RPG card art style, no text, no watermark."

> "Fantasy game creature portrait, majestic storm dragon, deep blue-grey
> scales with faint lightning-pattern markings, glowing pale blue eyes,
> wings spread mid-flight through storm clouds, powerful and awe-inspiring,
> painterly fantasy RPG card art style, no text, no watermark."

---

## 4. Code-only, no image needed

UI chrome beyond what the free packs cover (custom buttons, borders, the
affection meter, gold-currency icon, pack-opening reveal animation) can be
built directly in CSS/SVG — free, infinitely reusable, no generation
needed. I'll build these directly when we get to that part of the code.

---

## What this leaves you with for Phase 1

- **4 companion portraits** + **10 hero-card portraits** + **18 animal-card
  portraits** (all prompts in `CHARACTER_ROSTER.md`) = **32 custom images**
  to generate, same tool/workflow as before — send them whenever they're
  done, in any order, and they get wired in as they arrive.
- **7 environments and most UI chrome** still come from free asset packs
  (Kenney.nl etc., see above) — zero generation needed for those.
