# Heartline — Full Character Roster & Image Specs

Every named character in the game (4 companions + 10 "hero" tier cards +
2 recruitable humans), plus the 18 common/uncommon animal cards, with a
personality bio (where applicable), the art prompt to generate them, and a
suggested filename. Technical image format guidance is up front so you
only have to read it once.

---

## Image format — read this once, applies to everything below

**File type:** PNG preferred (handles flat illustrated color better than
JPG, which can introduce fuzzy artifacts around clean linework). JPG is
fine as a fallback if that's what the tool gives you.

**Size/orientation:** Don't stress about exact pixel dimensions — whatever
your tool's default output is (most free tools give you a fixed
1024×1024 square, or a portrait option if available) works fine. I'll fit
whatever you send into the right shape in code using CSS, so there's no
need to fuss with cropping yourself.

**Background, two different rules depending on the character type:**
- **Companions** (Ava, Kai, Wren, Sable): contextual backgrounds are good —
  the bookshop, forest clearing, etc. already in their prompts. These get
  shown full-screen during story scenes, so atmosphere helps.
- **Hero cards** (orcs/dwarves/elves/dragons) and **animal cards**
  (common/uncommon): ask for a **simple, softly blurred, or plain-gradient
  background** — these get placed inside a small card frame in the UI, and
  a busy background fights with the frame art. Each prompt below already
  specifies this.

**File naming:** name each file to match the id in parentheses below
exactly (e.g. `ava.png`, `orc-warrior.png`) — that's what the code will
look for, so matching names means I can wire them in without back-and-forth.

**What to send, and when:** no need to wait until you have all 14 — send
whatever's done, whenever it's done, in any order. I'll wire in each batch
as it arrives.

---

## Companions (romantic, orientation-gated)

### Ava (`ava`) — Common-adjacent starting companion, girl
Witty bookshop regular with a dry sense of humor. Values being challenged
intellectually over being flattered; warm underneath the deadpan once she
trusts someone.

> "Fantasy game character portrait, young woman, warm brown skin, curly
> dark hair pulled back with reading glasses pushed up on her head, wearing
> a cozy cardigan over a simple top, holding a well-worn book, soft
> bookshop lighting, half-body portrait, confident dry smile, painterly
> fantasy RPG card art style, fully clothed, PG, no text, no watermark."

### Kai (`kai`) — girl-or-guy-preference companion, guy
Anxious musician who overthinks everything and disappears into his music;
quietly, deeply affectionate once he lets someone in.

> "Fantasy game character portrait, young man, tousled dark hair, soft
> nervous smile, wearing a loose hand-knit sweater, holding an acoustic
> guitar, warm indoor lighting, half-body portrait, painterly fantasy RPG
> card art style, fully clothed, PG, no text, no watermark."

### Wren (`wren`) — girl, bisexual, beastkin (wolf-hybrid race)
**Updated:** now a beastkin — a wolf-hybrid fantasy race, born with wolf
ears and instincts rather than a human with a spiritual kinship to wolves
(matches the generated portrait). Blunt, fiercely loyal, more at ease
around tamed animals than people; warms up slowly but completely.
Portrait: `wren.jpg` ✅ received and wired into the app.

> "Fantasy game character portrait, young woman, sharp amber eyes, undercut
> dark hair with a few braided strands, wolf-fur-trimmed practical travel
> cloak, faint wolf-paw pendant necklace, standing in a forest clearing,
> confident grounded stance, half-body portrait, painterly fantasy RPG card
> art style, fully clothed, PG, no text, no watermark."

### Sable (`sable`) — girl, rival-turned-companion ✅ received and wired in
Bold and competitive; introduced as a rival tamer who beats the player in
an early skirmish, then joins once the player earns her respect rather
than her affection outright.

> "Fantasy game character portrait, young woman, sharp confident grin,
> short choppy auburn hair, light battle scar across one eyebrow, fitted
> leather tamer's armor with a creature whistle around her neck, dynamic
> three-quarter pose, half-body portrait, painterly fantasy RPG card art
> style, fully clothed, PG, no text, no watermark."

*(The Guide/Assistant NPC has no fixed appearance/personality — it's named
and flavored by the player at character creation, so there's no portrait to
pre-generate for it.)*

---

## Recruitable humans (bond mechanic — see DESIGN_DOC.md §7)

Not romantic companions — these are the "Meet Travelers" recruits from the
consensual ask-and-agree bond mechanic. Unlike the companions above, they
show up in small card frames (Collection, party select, battle) just like
the hero cards, so use the **hero-card background rule**: simple, softly
blurred, or plain-gradient background, not a scene. Same file-naming rule
too — name each file to match the id in parentheses (`toren.jpg`,
`mira.jpg`) and drop it at `client/public/cards/<id>.jpg`.

### Toren Ashfield (`toren`) — attacker ✅ received (saved as `client/public/cards/toren.jpg`)
An ex-soldier turned sellsword who trusts actions over words. Blunt,
steady, quietly protective of whoever he's traveling with.

> "Fantasy game character portrait, man in his thirties, weathered face,
> short dark hair, light stubble, wearing worn practical leather armor
> over a simple tunic, a sheathed sword at his hip, steady grounded
> stance, simple softly-blurred background, half-body portrait, painterly
> fantasy RPG card art style, fully clothed, PG, no text, no watermark."

### Mira Calloway (`mira`) — support ✅ received (saved as `client/public/cards/mira.jpg`)
A traveling healer and scholar who sees the good in people before they see
it themselves. Gentle, curious, unflappable under pressure.

> "Fantasy game character portrait, woman in her late twenties, kind
> warm expression, dark hair loosely tied back with a few loose strands,
> wearing a practical herbalist's travel coat over simple clothes, a
> satchel of herbs and a small bound journal at her side, simple
> softly-blurred background, half-body portrait, painterly fantasy RPG
> card art style, fully clothed, PG, no text, no watermark."

---

## Rare tier — Orcs

### Grondek (`orc-warrior`) ✅ received (saved as `client/public/cards/orc-warrior.jpg`)
Blunt-force front-liner, first into every fight, secretly protective of
weaker party members despite the gruff act.

> "Fantasy game character portrait, orc warrior, muscular build, green-grey
> skin, tusked lower jaw, braided dark hair, wearing worn leather and iron
> plate armor, holding a battle axe, fierce but not grotesque, simple
> softly-blurred background, painterly fantasy RPG card art style,
> half-body portrait, no text, no watermark."

### Isha (`orc-shaman`) ✅ received (saved as `client/public/cards/orc-shaman.jpg`)
Tribal shaman, keeper of oral history for her clan, speaks rarely but with
weight when she does.

> "Fantasy game character portrait, female orc shaman, green-grey skin,
> tribal tattoos, wearing bone jewelry and layered ritual cloth, holding a
> carved wooden staff with a glowing charm, wise and intense expression,
> simple softly-blurred background, painterly fantasy RPG card art style,
> half-body portrait, no text, no watermark."

### Rurk (`orc-archer`) ✅ received (saved as `client/public/cards/orc-archer.jpg`)
Scout and archer, quieter and more calculating than most orcs in the
roster, prefers picking fights from a distance.

> "Fantasy game character portrait, orc archer, lean muscular build,
> green-grey skin, short cropped hair, wearing practical leather ranger
> gear, holding a recurve bow, alert focused expression, simple
> softly-blurred background, painterly fantasy RPG card art style,
> half-body portrait, no text, no watermark."

---

## Super Rare tier — Dwarves

### Bram Ironhand (`dwarf-warrior`) ✅ received (saved as `client/public/cards/dwarf-warrior.jpg`)
Proud clan warrior, treats every battle as a matter of honor, loud laugh,
louder grudges.

> "Fantasy game character portrait, dwarf warrior, stocky powerful build,
> thick braided red beard, wearing ornate steel plate armor, holding a
> war-hammer, proud confident stance, simple softly-blurred background,
> painterly fantasy RPG card art style, half-body portrait, no text, no
> watermark."

### Dagny Runeheart (`dwarf-runesmith`) ✅ received (saved as `client/public/cards/dwarf-runesmith.jpg`)
Runesmith and inventor, more interested in how things work than in
fighting, but formidable when pushed to it.

> "Fantasy game character portrait, female dwarf runesmith, stocky build,
> braided hair with metal clasps, wearing a leather smith's apron over
> chainmail, holding a glowing rune-etched hammer, focused craftsmanlike
> expression, simple softly-blurred background, painterly fantasy RPG card
> art style, half-body portrait, no text, no watermark."

---

## Legendary tier — Elves

### Sylvaen (`elf-ranger`) ✅ received — modest regeneration (saved as `client/public/cards/elf-ranger.jpg`)
Ranger and forest guardian, calm and watchful, speaks to the player like
someone testing whether they're worth trusting.

First attempt came back with a low-cut neckline, more revealing than the
rest of the roster; the closed-neckline regeneration below is the one used:

> "Fantasy game character portrait, elf ranger, slender graceful build,
> pointed ears, long silver hair, wearing a high-collared, fully closed
> forest-green leather ranger tunic buttoned/laced up to the collarbone,
> practical and modest, no cleavage, holding an ornate longbow, calm alert
> expression, simple softly-blurred background, painterly fantasy RPG card
> art style, half-body portrait, no text, no watermark."

### Ithrandel (`elf-mage`) ✅ received (saved as `client/public/cards/elf-mage.jpg`)
Scholar-mage from the sacred forest's inner court, serene, precise, quietly
condescending until proven wrong about the player.

> "Fantasy game character portrait, elf mage, slender build, pointed ears,
> flowing dark hair, wearing elegant blue-and-silver robes, holding a
> crystal-topped staff with soft magical glow, serene focused expression,
> simple softly-blurred background, painterly fantasy RPG card art style,
> half-body portrait, no text, no watermark."

### Faelynn (`elf-bladedancer`) ✅ received (saved as `client/public/cards/elf-bladedancer.jpg`)
Blade-dancer, all motion and confidence, treats combat like performance art.

> "Fantasy game character portrait, elf blade-dancer, slender athletic
> build, pointed ears, short windswept hair, wearing light fitted armor
> with flowing fabric accents, holding twin curved blades, dynamic
> confident pose, simple softly-blurred background, painterly fantasy RPG
> card art style, half-body portrait, no text, no watermark."

---

## God Tier — Dragons

### Emberwyrm (`dragon-fire`) ✅ received (saved as `client/public/cards/dragon-fire.jpg`)
Ancient fire dragon of the Sacred Peaks, obtained only via fusion or the
hardest missions — a genuine "you made it" moment when a player gets one.

> "Fantasy game creature portrait, majestic fire dragon, deep red and
> ember-orange scales, glowing amber eyes, wings partially spread, perched
> on a mountain peak, simple softly-blurred sky background, powerful and
> awe-inspiring but not menacing, painterly fantasy RPG card art style, no
> text, no watermark."

### Stormcaller (`dragon-storm`) ✅ received (saved as `client/public/cards/dragon-storm.jpg`) — full 14-card gacha roster complete (Toren and Mira above are a separate pair, also now fully received — see that section)
Storm dragon, said to nest only where lightning strikes the same peak twice
— the rarest of the two God Tier cards.

---

## Common tier — Animals (10)

Went with full custom AI-gen for all 18 animal cards instead of free
pre-made packs — no single free pack covers all 18 species in one
consistent style, and mixing sources would look inconsistent next to the
painterly hero cards. Same workflow as the hero cards: generate, send,
I wire them in as they arrive.

### Rabbit (`rabbit`)
> "Fantasy game creature portrait, wild rabbit with alert upright ears,
> soft brown-and-cream fur, crouched alert pose in tall grass, simple
> softly-blurred background, painterly fantasy RPG card art style,
> full-body, no text, no watermark."

### Deer (`deer`)
> "Fantasy game creature portrait, young forest deer with small antler
> nubs, warm brown coat with light speckles, standing alert in a dappled
> forest clearing, simple softly-blurred background, painterly fantasy RPG
> card art style, full-body, no text, no watermark."

### Boar (`boar`)
> "Fantasy game creature portrait, wild boar with dark bristled fur and
> small tusks, sturdy low stance, kicking up a bit of dirt, simple
> softly-blurred background, painterly fantasy RPG card art style,
> full-body, no text, no watermark."

### Fox (`fox`)
> "Fantasy game creature portrait, red fox with a bushy white-tipped tail,
> sharp intelligent eyes, mid-stride sly pose, simple softly-blurred
> background, painterly fantasy RPG card art style, full-body, no text, no
> watermark."

### Wolf Pup (`wolf-pup`)
> "Fantasy game creature portrait, young wolf pup, grey-and-white fur,
> slightly oversized paws, playful alert stance, simple softly-blurred
> background, painterly fantasy RPG card art style, full-body, no text, no
> watermark."

### Hawk (`hawk`)
> "Fantasy game creature portrait, fierce hawk with russet-and-brown
> plumage, wings partially spread perched on a branch, sharp golden eyes,
> simple softly-blurred background, painterly fantasy RPG card art style,
> full-body, no text, no watermark."

### Badger (`badger`)
> "Fantasy game creature portrait, sturdy badger with black-and-white
> striped face, low broad build, mid-dig stance, simple softly-blurred
> background, painterly fantasy RPG card art style, full-body, no text, no
> watermark."

### Mountain Goat (`goat`)
> "Fantasy game creature portrait, mountain goat with a shaggy white coat
> and curved horns, braced on a rocky outcrop, simple softly-blurred
> background, painterly fantasy RPG card art style, full-body, no text, no
> watermark."

### Raccoon (`raccoon`)
> "Fantasy game creature portrait, raccoon with black mask markings and a
> ringed tail, curious mischievous pose, simple softly-blurred background,
> painterly fantasy RPG card art style, full-body, no text, no watermark."

### Crow (`crow`)
> "Fantasy game creature portrait, glossy black crow with intelligent
> eyes, wings slightly spread mid-perch, simple softly-blurred background,
> painterly fantasy RPG card art style, full-body, no text, no watermark."

---

## Uncommon tier — Animals (8)

Bigger, more imposing presence than the common tier — same painterly
style, simple blurred background.

### Lion (`lion`)
> "Fantasy game creature portrait, powerful lion with a full golden mane,
> regal commanding stance, simple softly-blurred background, painterly
> fantasy RPG card art style, full-body, no text, no watermark."

### Tiger (`tiger`)
> "Fantasy game creature portrait, muscular tiger with bold orange-and-
> black stripes, mid-prowl predatory pose, simple softly-blurred
> background, painterly fantasy RPG card art style, full-body, no text, no
> watermark."

### Elephant (`elephant`)
> "Fantasy game creature portrait, massive elephant with weathered grey
> hide and long curved tusks, calm powerful stance, ears spread, simple
> softly-blurred background, painterly fantasy RPG card art style,
> full-body, no text, no watermark."

### Bear (`bear`)
> "Fantasy game creature portrait, huge brown bear reared up on hind legs,
> thick shaggy fur, imposing stance, simple softly-blurred background,
> painterly fantasy RPG card art style, full-body, no text, no watermark."

### Rhino (`rhino`)
> "Fantasy game creature portrait, armored-looking rhino with a large
> horn, thick grey hide, braced charging stance, simple softly-blurred
> background, painterly fantasy RPG card art style, full-body, no text, no
> watermark."

### Crocodile (`crocodile`)
> "Fantasy game creature portrait, large crocodile with rough textured
> scales, jaws slightly open, low predatory stance half in water, simple
> softly-blurred background, painterly fantasy RPG card art style,
> full-body, no text, no watermark."

### Gorilla (`gorilla`)
> "Fantasy game creature portrait, powerful silverback gorilla, broad
> chest, intense but not menacing expression, simple softly-blurred
> background, painterly fantasy RPG card art style, full-body, no text, no
> watermark."

### Buffalo (`buffalo`)
> "Fantasy game creature portrait, massive buffalo with thick curved
> horns, shaggy dark fur, braced sturdy stance, simple softly-blurred
> background, painterly fantasy RPG card art style, full-body, no text, no
> watermark."

---

## Story CG moments (companions' chapter 2 & 3 payoff scenes)

Not blocking — everything already plays correctly without these (the story
screen just keeps showing the companion's regular portrait, exactly as it
does today). This is a "when you're ready" follow-up, same handoff as the
portraits above: this project's sandbox has no image-generation tool of its
own, so generating these is a step only you can do, with whatever image
generator you already have on hand.

**What these are:** right now every story scene reuses the same standing
portrait throughout. Each companion's chapter 2 and chapter 3 ends on one
specific emotional beat (see the quoted line below) — a dedicated
illustration for just that line, instead of the everyday portrait, gives
those two moments per companion some real weight instead of blending into
the rest of the scene. The code is already wired for this (see
`engine/VisualNovel.jsx`): if the file exists at the path below, it shows
automatically in place of the portrait for that one line; if it doesn't
exist, nothing breaks, it just quietly falls back to the portrait like
today.

**Where to save them:** `client/public/cg/<filename>.jpg` (create the `cg`
folder if it doesn't exist yet). Same size/format guidance as the portraits
above — PNG or JPG, whatever your tool outputs, no need to crop precisely.

### Ava
- `ava-ch2.jpg` — payoff line: *"...You're easy to talk to. I wasn't expecting that, not gonna lie."*
  > "Fantasy game visual novel CG, young woman with warm brown skin, curly
  > dark hair, reading glasses pushed up on her head, wearing a cozy
  > cardigan, sitting relaxed in a worn armchair in a warm dimly-lit
  > bookshop after closing time, soft contented almost-smile, warm lamp
  > lighting, painterly fantasy RPG visual novel art style, half-body,
  > fully clothed, PG, no text, no watermark."
- `ava-ch3.jpg` — payoff line: *"Good. Great. I'm going to go reorganize a shelf that doesn't need it..."*
  > "Fantasy game visual novel CG, young woman with warm brown skin, curly
  > dark hair, cardigan, standing among bookshop shelves, caught mid-turn
  > glancing back over her shoulder, soft flustered happy smile, cheeks
  > slightly flushed, warm evening bookshop lighting, painterly fantasy RPG
  > visual novel art style, half-body, fully clothed, PG, no text, no
  > watermark."

### Kai
- `kai-ch2.jpg` — payoff line: *"Okay. Okay, good. I've been sitting on that for two weeks."*
  > "Fantasy game visual novel CG, young man with tousled dark hair, wearing
  > a loose hand-knit sweater, sitting with an acoustic guitar in his lap
  > just after finishing playing, eyes down, small relieved vulnerable
  > smile, warm indoor lamp lighting, painterly fantasy RPG visual novel art
  > style, half-body, fully clothed, PG, no text, no watermark."
- `kai-ch3.jpg` — payoff line: *"...My hands are actually shaking right now, look at that."*
  > "Fantasy game visual novel CG, young man with tousled dark hair, loose
  > sweater, looking down at his own slightly-trembling open hands with a
  > startled soft smile, warm indoor lighting, painterly fantasy RPG visual
  > novel art style, half-body, fully clothed, PG, no text, no watermark."

### Wren
- `wren-ch2.jpg` — payoff line: *"Come back tomorrow — I'll actually look for you this time..."*
  > "Fantasy game visual novel CG, young woman beastkin with wolf ears,
  > sharp amber eyes, undercut dark hair with braided strands, wolf-fur-
  > trimmed cloak, crouched at the edge of a forest den with a wolf pup
  > nuzzling close, small rare unguarded smile, warm dusk forest lighting,
  > painterly fantasy RPG visual novel art style, half-body, fully clothed,
  > PG, no text, no watermark."
- `wren-ch3.jpg` — payoff line: *"I'm falling for you. Hard. It scares me a little, if I'm honest."*
  > "Fantasy game visual novel CG, young woman beastkin with wolf ears,
  > amber eyes, undercut hair, sitting close to a small campfire at night,
  > cloak loosened, guarded expression cracking into something open and
  > a little scared, warm firelight against a dark forest background,
  > painterly fantasy RPG visual novel art style, half-body, fully clothed,
  > PG, no text, no watermark."

### Sable
- `sable-ch2.jpg` — payoff line: *"Careful with lines like that, you'll make a girl think you're serious."*
  > "Fantasy game visual novel CG, young woman with short choppy auburn
  > hair, light scar across one eyebrow, fitted leather tamer's armor,
  > leaning against a practice-arena fence post-sparring, sharp confident
  > smirk with a flicker of real warmth underneath, golden late-afternoon
  > training-grounds lighting, painterly fantasy RPG visual novel art
  > style, half-body, fully clothed, PG, no text, no watermark."
- `sable-ch3.jpg` — payoff line: *"Real, huh. Yeah. Okay. Don't get used to me being this soft..."*
  > "Fantasy game visual novel CG, young woman with short choppy auburn
  > hair, light eyebrow scar, leather armor with the creature-whistle collar
  > loosened, sitting quietly away from the training grounds at dusk, rare
  > soft unguarded expression instead of her usual smirk, warm dusk
  > lighting, painterly fantasy RPG visual novel art style, half-body, fully
  > clothed, PG, no text, no watermark."

---

## Additions discussed but deferred (not blocking Phase 1)

- **Goblins**: kept as flavor/lore alongside the Rare-tier orcs (not a
  separate card race), per your call. One reference image saved as
  `client/public/lore/goblin.jpg` for flavor/world-building use (e.g.
  mountain-region art), not as a battle card.
- **Demons**: kept as a future Underworld race, tier still TBD, not part
  of Phase 1. No art wired in yet.
- **Goddess of creation**: undecided whether she's a lore/narrative figure
  or an actual playable tier — holding off on both the design and the art
  until that's settled. The generated images for both demons and the
  goddess also ran noticeably more sexualized/revealing than the rest of
  the roster's established PG direction, so nothing from that batch was
  used; if/when these get built out, prompts should carry the same modest
  standard as everything else here.

> "Fantasy game creature portrait, majestic storm dragon, deep blue-grey
> scales with faint lightning-pattern markings, glowing pale blue eyes,
> wings spread mid-flight through storm clouds, simple softly-blurred
> background, powerful and awe-inspiring, painterly fantasy RPG card art
> style, no text, no watermark."
