// Creature/card roster for Phase 1. Data-driven so growing past this
// starting set later is just adding entries, not rewriting the engine.
//
// Tiers, in ascending rarity: common, uncommon, rare, superRare, legendary,
// godTier. Humans are handled separately (data/humanBond.js) since they
// evolve through play rather than being pulled at a fixed tier.

export const TIERS = ['common', 'uncommon', 'rare', 'superRare', 'legendary', 'godTier']

export const TIER_LABELS = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  superRare: 'Super Rare',
  legendary: 'Legendary',
  godTier: 'God Tier'
}

export const TIER_COLORS = {
  common: '#9aa0a6',
  uncommon: '#5fa85f',
  rare: '#4a7fd6',
  superRare: '#9b5fd6',
  legendary: '#d6a445',
  godTier: '#d6455f'
}

// Free-license stock photos (Pexels) for the common/uncommon animal cards —
// see ART_SOURCING.md for how these were sourced and ATTRIBUTIONS.md for
// photographer credit per photo (not required by the Pexels License, but
// good practice). Falls back to the emoji if image is omitted/null.
function beast(id, name, emoji, tier, elementType, stats, ability, image = null) {
  return { id, name, race: 'animal', tier, type: elementType, emoji, image, role: stats.role, stats, ability }
}

function hero(id, name, race, tier, elementType, image, stats, ability, role) {
  return { id, name, race, tier, type: elementType, image, emoji: null, role, stats, ability }
}

// Every ability now carries a real `effect` the battle engine executes
// (see battleEngine.js's file header for how `trigger` works) — not just
// descriptive flavor text. Several cards deliberately share an effect
// `type` (two different AoE hitters, two different stunners, etc.) with
// only the numbers differing, same as any card game's shared effect
// vocabulary — the point was giving every card a real mechanical identity,
// not hand-authoring 30 entirely bespoke code paths.
//
// Every card also now carries an elemental `type` (fire/storm/earth/arcane —
// see data/types.js) — NOT the same field as `ability.effect.type` above,
// which is unrelated. This is the counter-pick layer battleEngine.js's
// computeDamage() applies as a multiplier; assignments below are by flavor
// fit (a soldier is sturdy "earth", a mage is "arcane", a dragon that
// literally breathes fire is "fire", etc.) aiming for a roughly even spread
// across the 30-character roster.
export const CARDS = [
  // ---- Common (10) ----
  beast('rabbit', 'Rabbit', '🐇', 'common', 'storm', { atk: 18, def: 16, spd: 42, hp: 70, role: 'attacker' }, { name: 'Quick Dodge', desc: '+20% evasion for 1 turn', effect: { trigger: 'proc', type: 'evasionSelf', chance: 0.5, duration: 1 } }, '/cards/rabbit.jpg'),
  beast('deer', 'Deer', '🦌', 'common', 'earth', { atk: 22, def: 20, spd: 38, hp: 80, role: 'attacker' }, { name: 'Startle', desc: 'Small chance to skip enemy turn', effect: { trigger: 'proc', type: 'stunOnHit', chance: 0.35, duration: 1 } }, '/cards/deer.jpg'),
  beast('boar', 'Boar', '🐗', 'common', 'fire', { atk: 30, def: 26, spd: 20, hp: 95, role: 'attacker' }, { name: 'Charge', desc: 'Next attack deals +25% damage', effect: { trigger: 'proc', type: 'bonusDamageSelf', multiplier: 1.25 } }, '/cards/boar.jpg'),
  beast('fox', 'Fox', '🦊', 'common', 'arcane', { atk: 26, def: 18, spd: 36, hp: 75, role: 'attacker' }, { name: 'Sly Strike', desc: 'Ignores 15% of target defense', effect: { trigger: 'proc', type: 'defensePierceProc', pierce: 0.15 } }, '/cards/fox.jpg'),
  beast('wolf-pup', 'Wolf Pup', '🐺', 'common', 'earth', { atk: 28, def: 22, spd: 30, hp: 85, role: 'attacker' }, { name: 'Pack Instinct', desc: '+ATK when another beast is in the party', effect: { trigger: 'passiveModifier', type: 'packBonus', multiplier: 1.15 } }, '/cards/wolf-pup.jpg'),
  beast('hawk', 'Hawk', '🦅', 'common', 'storm', { atk: 24, def: 15, spd: 44, hp: 65, role: 'attacker' }, { name: 'Dive', desc: 'Always strikes first', effect: { trigger: 'passiveModifier', type: 'priorityFirst' } }, '/cards/hawk.jpg'),
  beast('badger', 'Badger', '🦡', 'common', 'earth', { atk: 25, def: 30, spd: 18, hp: 90, role: 'defender' }, { name: 'Dig In', desc: '+DEF for 2 turns', effect: { trigger: 'proc', type: 'selfDefBuff', multiplier: 1.5, duration: 2 } }, '/cards/badger.jpg'),
  beast('goat', 'Mountain Goat', '🐐', 'common', 'fire', { atk: 20, def: 24, spd: 28, hp: 88, role: 'defender' }, { name: 'Headbutt', desc: 'Chance to stun', effect: { trigger: 'proc', type: 'stunOnHit', chance: 0.3, duration: 1 } }, '/cards/goat.jpg'),
  beast('raccoon', 'Raccoon', '🦝', 'common', 'arcane', { atk: 19, def: 19, spd: 33, hp: 78, role: 'support' }, { name: 'Distract', desc: 'Lowers target accuracy briefly', effect: { trigger: 'proc', type: 'targetMissDebuff', chance: 0.4, duration: 2 } }, '/cards/raccoon.jpg'),
  beast('crow', 'Crow', '🐦‍⬛', 'common', 'storm', { atk: 21, def: 14, spd: 40, hp: 60, role: 'support' }, { name: 'Scout', desc: 'Reveals enemy weaknesses', effect: { trigger: 'proc', type: 'exposeDefense', reduction: 0.25, duration: 2 } }, '/cards/crow.jpg'),

  // ---- Uncommon (8) ----
  beast('lion', 'Lion', '🦁', 'uncommon', 'fire', { atk: 62, def: 48, spd: 55, hp: 140, role: 'attacker' }, { name: 'Pride Rally', desc: 'Boosts the whole party\'s ATK for 2 turns', effect: { trigger: 'proc', type: 'partyAtkBuff', multiplier: 1.3, duration: 2 } }, '/cards/lion.jpg'),
  beast('tiger', 'Tiger', '🐅', 'uncommon', 'fire', { atk: 68, def: 44, spd: 58, hp: 135, role: 'attacker' }, { name: 'Ambush', desc: 'Bonus damage if target is at full HP', effect: { trigger: 'proc', type: 'bonusIfFullHp', multiplier: 1.4 } }, '/cards/tiger.jpg'),
  beast('elephant', 'Elephant', '🐘', 'uncommon', 'earth', { atk: 55, def: 70, spd: 20, hp: 210, role: 'defender' }, { name: 'Trample', desc: 'Hits all enemies for reduced damage', effect: { trigger: 'proc', type: 'aoe', multiplier: 0.65 } }, '/cards/elephant.jpg'),
  beast('bear', 'Bear', '🐻', 'uncommon', 'fire', { atk: 64, def: 52, spd: 30, hp: 160, role: 'attacker' }, { name: 'Maul', desc: 'Chance to cause bleed (damage over time)', effect: { trigger: 'proc', type: 'bleedOnHit', dotMultiplier: 0.3, duration: 3 } }, '/cards/bear.jpg'),
  beast('rhino', 'Rhino', '🦏', 'uncommon', 'earth', { atk: 58, def: 65, spd: 24, hp: 190, role: 'defender' }, { name: 'Charge', desc: 'Guaranteed crit on first attack', effect: { trigger: 'onFirstAction', type: 'critFirstAction', multiplier: 1.75 } }, '/cards/rhino.jpg'),
  beast('crocodile', 'Crocodile', '🐊', 'uncommon', 'storm', { atk: 60, def: 58, spd: 26, hp: 165, role: 'defender' }, { name: 'Death Roll', desc: 'Locks target from fleeing', effect: { trigger: 'proc', type: 'restrainOnHit', atkMultiplier: 0.6, duration: 3 } }, '/cards/crocodile.jpg'),
  beast('gorilla', 'Gorilla', '🦍', 'uncommon', 'fire', { atk: 66, def: 50, spd: 34, hp: 150, role: 'attacker' }, { name: 'Chest Beat', desc: 'Intimidates, lowering enemy ATK', effect: { trigger: 'proc', type: 'partyEnemyAtkDebuff', multiplier: 0.75, duration: 2 } }, '/cards/gorilla.jpg'),
  beast('buffalo', 'Buffalo', '🐃', 'uncommon', 'earth', { atk: 56, def: 60, spd: 28, hp: 175, role: 'defender' }, { name: 'Stampede', desc: '+SPD when below half HP', effect: { trigger: 'passiveModifier', type: 'lowHpBonusDamage', threshold: 0.5, multiplier: 1.3 } }, '/cards/buffalo.jpg'),

  // ---- Rare: Orcs (3) ----
  hero('orc-warrior', 'Grondek', 'orc', 'rare', 'fire', '/cards/orc-warrior.jpg', { atk: 88, def: 70, spd: 40, hp: 260 }, { name: 'Reckless Swing', desc: 'Big damage, lowers own DEF briefly', effect: { trigger: 'proc', type: 'recklessBonus', multiplier: 1.5, selfDefMultiplier: 0.7, duration: 2 } }, 'attacker'),
  hero('orc-shaman', 'Isha', 'orc', 'rare', 'arcane', '/cards/orc-shaman.jpg', { atk: 60, def: 55, spd: 45, hp: 210 }, { name: 'Spirit Ward', desc: 'Heals the party a little each turn', effect: { trigger: 'everyTurn', type: 'partyHealPassive', healFraction: 0.06 } }, 'support'),
  hero('orc-archer', 'Rurk', 'orc', 'rare', 'storm', '/cards/orc-archer.jpg', { atk: 78, def: 50, spd: 62, hp: 195 }, { name: 'Piercing Shot', desc: 'Ignores target defense', effect: { trigger: 'proc', type: 'fullDefensePierce' } }, 'attacker'),

  // ---- Super Rare: Dwarves (2) ----
  hero('dwarf-warrior', 'Bram Ironhand', 'dwarf', 'superRare', 'earth', '/cards/dwarf-warrior.jpg', { atk: 105, def: 95, spd: 35, hp: 320 }, { name: 'Honor Guard', desc: 'Taunts enemies to attack Bram instead', effect: { trigger: 'proc', type: 'tauntSelf', duration: 3 } }, 'defender'),
  hero('dwarf-runesmith', 'Dagny Runeheart', 'dwarf', 'superRare', 'arcane', '/cards/dwarf-runesmith.jpg', { atk: 85, def: 80, spd: 50, hp: 280 }, { name: 'Rune Overcharge', desc: 'Boosts one ally\'s ability power', effect: { trigger: 'proc', type: 'allyAtkBuff', multiplier: 1.35, duration: 3 } }, 'support'),

  // ---- Legendary: Elves (3) ----
  hero('elf-ranger', 'Sylvaen', 'elf', 'legendary', 'storm', '/cards/elf-ranger.jpg', { atk: 120, def: 90, spd: 95, hp: 340 }, { name: 'Volley', desc: 'Hits all enemies', effect: { trigger: 'proc', type: 'aoe', multiplier: 1.0 } }, 'attacker'),
  hero('elf-mage', 'Ithrandel', 'elf', 'legendary', 'arcane', '/cards/elf-mage.jpg', { atk: 130, def: 85, spd: 80, hp: 320 }, { name: 'Arcane Bolt', desc: 'Ignores 30% of target defense', effect: { trigger: 'proc', type: 'defensePierceProc', pierce: 0.3 } }, 'attacker'),
  hero('elf-bladedancer', 'Faelynn', 'elf', 'legendary', 'storm', '/cards/elf-bladedancer.jpg', { atk: 125, def: 88, spd: 100, hp: 330 }, { name: 'Twin Strike', desc: 'Attacks twice in one turn', effect: { trigger: 'proc', type: 'doubleStrike' } }, 'attacker'),

  // ---- God Tier: Dragons (2, fusion/hardest-mission only) ----
  hero('dragon-fire', 'Emberwyrm', 'dragon', 'godTier', 'fire', '/cards/dragon-fire.jpg', { atk: 170, def: 140, spd: 90, hp: 480 }, { name: 'Inferno Breath', desc: 'Massive AoE fire damage', effect: { trigger: 'proc', type: 'aoeBurn', multiplier: 0.9, dotMultiplier: 0.15, dotDuration: 2 } }, 'attacker'),
  hero('dragon-storm', 'Stormcaller', 'dragon', 'godTier', 'storm', '/cards/dragon-storm.jpg', { atk: 165, def: 135, spd: 110, hp: 460 }, { name: 'Lightning Storm', desc: 'AoE damage + chance to stun all enemies', effect: { trigger: 'proc', type: 'aoeStun', multiplier: 0.85, stunChance: 0.3, duration: 1 } }, 'attacker')
]

export function getCard(id) {
  return CARDS.find((c) => c.id === id)
}

export function cardsByTier(tier) {
  return CARDS.filter((c) => c.tier === tier)
}
