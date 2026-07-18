// Ava's route, split into affection-gated chapters (see
// data/relationshipStage.js for the shared threshold ladder these line up
// with). Chapter 1 is the original scripted scene that unlocks chat;
// chapters 2-3 are additional scripted beats that unlock once affection
// crosses their threshold, so the relationship keeps having new scripted
// moments instead of flattening into "one scene, then infinite chat."
// `unlockChat: true` only appears on chapter 1's ending (chat is already
// unlocked after that); later chapters just end when `choices` is empty —
// see engine/VisualNovel.jsx for how that renders a "Continue" button.

export const AVA_CHAPTERS = [
  {
    id: 'meet',
    title: 'First Impressions',
    unlockAffection: 0,
    route: {
      start: 'intro_1',
      nodes: {
        intro_1: {
          speaker: 'Ava',
          text: "You're back. Third time this week — are you actually reading these books, or just here for the bad coffee?",
          choices: [
            { text: '"Bit of both, honestly."', next: 'intro_2', affection: 2 },
            { text: '"The coffee is objectively terrible."', next: 'intro_2', affection: 3 },
            { text: "\"I'm here for you, obviously.\"", next: 'intro_2_bold', affection: 1 }
          ]
        },
        intro_2: {
          speaker: 'Ava',
          text: "Ha — fair. I'd apologize for the coffee but I didn't make it, so, not my problem.",
          choices: [
            { text: 'Ask her what she\'s reading', next: 'ask_reading', affection: 2 },
            { text: 'Ask when her shift ends', next: 'ask_shift', affection: 1 }
          ]
        },
        intro_2_bold: {
          speaker: 'Ava',
          text: "Smooth. I almost believed you. Almost.",
          choices: [
            { text: 'Ask her what she\'s reading', next: 'ask_reading', affection: 1 },
            { text: 'Ask when her shift ends', next: 'ask_shift', affection: 2 }
          ]
        },
        ask_reading: {
          speaker: 'Ava',
          text: "Something about deep sea creatures that don't need sunlight to survive. Relatable, honestly.",
          choices: [
            { text: '"That\'s oddly poetic for a marine biology book."', next: 'end_1', affection: 3 },
            { text: '"Sounds depressing."', next: 'end_1', affection: -1 }
          ]
        },
        ask_shift: {
          speaker: 'Ava',
          text: "Twenty minutes. Why, are you planning something?",
          choices: [
            { text: '"Maybe. Depends how the next twenty minutes go."', next: 'end_1', affection: 3 },
            { text: '"Just curious."', next: 'end_1', affection: 1 }
          ]
        },
        end_1: {
          speaker: 'Ava',
          text: "You know, you're alright. Here — text me, I want to see if you're actually this charming without the bookshop lighting doing all the work.",
          unlockChat: true,
          choices: []
        }
      }
    }
  },
  {
    id: 'closer',
    title: 'Closing Time',
    unlockAffection: 12,
    route: {
      start: 'ch2_1',
      nodes: {
        ch2_1: {
          speaker: 'Ava',
          text: "Hey — I'm closing up in ten. You could stick around and pretend to browse, if you wanted. Purely coincidentally.",
          choices: [
            { text: '"Purely coincidentally, sure."', next: 'ch2_2', affection: 3 },
            { text: '"Only if I get a discount."', next: 'ch2_2', affection: 1 }
          ]
        },
        ch2_2: {
          speaker: 'Ava',
          text: "No discount. But you get the good chair, the one that doesn't creak. Consider that my whole heart, laid bare.",
          choices: [
            { text: 'Ask why she works somewhere she jokes about so much', next: 'ch2_why', affection: 3 },
            { text: '"High honor. I\'ll try to earn it."', next: 'ch2_earn', affection: 2 }
          ]
        },
        ch2_why: {
          speaker: 'Ava',
          text: "Honestly? I like knowing where everything is. It's steady. I make fun of it because I'd feel silly admitting I actually love it here.",
          choices: [
            { text: '"That\'s not silly. That\'s just honest."', next: 'end_2', affection: 3 },
            { text: '"You could just say that, you know."', next: 'end_2', affection: 1 }
          ]
        },
        ch2_earn: {
          speaker: 'Ava',
          text: "We'll see. The bar's higher than it looks — the chair's seen a lot of disappointing conversation.",
          choices: [
            { text: '"Then I better not waste the good chair."', next: 'end_2', affection: 3 },
            { text: '"No pressure at all, then."', next: 'end_2', affection: 1 }
          ]
        },
        end_2: {
          speaker: 'Ava',
          text: "...You're easy to talk to. I wasn't expecting that, not gonna lie. Come by again — good chair's yours whenever.",
          image: '/cg/ava-ch2.jpg',
          choices: []
        }
      }
    }
  },
  {
    id: 'falling',
    title: 'Slow Burn',
    unlockAffection: 30,
    route: {
      start: 'ch3_1',
      nodes: {
        ch3_1: {
          speaker: 'Ava',
          text: "Can I say something and you not make it weird? I look forward to you coming in. Like, actually plan my day around it a little. It's annoying.",
          choices: [
            { text: '"I plan mine around you too, for what it\'s worth."', next: 'ch3_2', affection: 4 },
            { text: '"That\'s not annoying. That\'s kind of nice."', next: 'ch3_2', affection: 3 }
          ]
        },
        ch3_2: {
          speaker: 'Ava',
          text: "Yeah? Okay. Good. I've been informed by exactly zero people that I'm bad at this part, but I'm going to go ahead and say it anyway: I like you. Actually like you, not bookshop-banter like you.",
          choices: [
            { text: '"I like you too. Actually like you."', next: 'end_3', affection: 5 },
            { text: '"I was hoping you\'d say that first."', next: 'end_3', affection: 4 }
          ]
        },
        end_3: {
          speaker: 'Ava',
          text: "Good. Great. I'm going to go reorganize a shelf that doesn't need it so I have something to do with my hands. Come find me before you leave, alright?",
          image: '/cg/ava-ch3.jpg',
          choices: []
        }
      }
    }
  }
]
