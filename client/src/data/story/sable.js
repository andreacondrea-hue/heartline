// See ava.js for the chapter-structure explanation — same pattern here.

export const SABLE_CHAPTERS = [
  {
    id: 'meet',
    title: 'The Skirmish',
    unlockAffection: 0,
    route: {
      start: 'intro_1',
      nodes: {
        intro_1: {
          speaker: 'Sable',
          text: "Still sulking about the skirmish? It's been a week. You'll live.",
          choices: [
            { text: '"I wasn\'t sulking. I was studying your tactics."', next: 'intro_2', affection: 3 },
            { text: '"You got lucky."', next: 'intro_2', affection: 1 },
            { text: '"...maybe a little."', next: 'intro_2_soft', affection: 2 }
          ]
        },
        intro_2: {
          speaker: 'Sable',
          text: "Studying, huh? Careful, keep watching me that closely and people will talk.",
          choices: [
            { text: '"Let them talk."', next: 'ask_rematch', affection: 3 },
            { text: '"I meant your battle tactics."', next: 'ask_rematch', affection: 1 }
          ]
        },
        intro_2_soft: {
          speaker: 'Sable',
          text: "Ha! Honesty. Didn't expect that. It's a good look on you, actually.",
          choices: [
            { text: 'Ask for a rematch', next: 'ask_rematch', affection: 2 },
            { text: 'Ask why she fights so hard', next: 'ask_why', affection: 2 }
          ]
        },
        ask_rematch: {
          speaker: 'Sable',
          text: "A rematch? Now we're talking. Winner buys the other a drink after — deal?",
          choices: [
            { text: '"Deal. Try not to lose gracefully."', next: 'end_1', affection: 3 },
            { text: '"Only if you go easy on me."', next: 'end_1', affection: 0 }
          ]
        },
        ask_why: {
          speaker: 'Sable',
          text: "Because standing still is boring. Losing is fine, actually — it's not trying that I can't stand.",
          choices: [
            { text: '"That\'s the most honest thing you\'ve said to me."', next: 'end_1', affection: 3 },
            { text: '"Sounds exhausting."', next: 'end_1', affection: 0 }
          ]
        },
        end_1: {
          speaker: 'Sable',
          text: "Alright, you've earned this much — here, keep in touch. Don't get soft on me just because I like you a little now.",
          unlockChat: true,
          choices: []
        }
      }
    }
  },
  {
    id: 'closer',
    title: 'The Rematch',
    unlockAffection: 12,
    route: {
      start: 'ch2_1',
      nodes: {
        ch2_1: {
          speaker: 'Sable',
          text: "So, that rematch. I actually want it — not just to win again, I want to see if you've gotten any better. Don't disappoint me.",
          choices: [
            { text: '"I\'ve been training. You\'re in trouble."', next: 'ch2_2', affection: 3 },
            { text: '"No promises. But I\'ll try."', next: 'ch2_2', affection: 2 }
          ]
        },
        ch2_2: {
          speaker: 'Sable',
          text: "Good answer either way. Honestly? I like that you keep showing up instead of staying salty about the first loss. Most people don't.",
          choices: [
            { text: '"Giving up was never really an option."', next: 'end_2', affection: 4 },
            { text: '"Guess I just like being around you."', next: 'end_2', affection: 3 }
          ]
        },
        end_2: {
          speaker: 'Sable',
          text: "Careful with lines like that, you'll make a girl think you're serious. ...Good. Be serious. I dare you.",
          image: '/cg/sable-ch2.jpg',
          choices: []
        }
      }
    }
  },
  {
    id: 'falling',
    title: 'Dropping the Guard',
    unlockAffection: 30,
    route: {
      start: 'ch3_1',
      nodes: {
        ch3_1: {
          speaker: 'Sable',
          text: "Okay, no jokes for a second — I actually have feelings about this, about you, and I don't know what to do with them because I never let myself lose that kind of fight before.",
          choices: [
            { text: '"You\'re not losing anything. I feel the same way."', next: 'ch3_2', affection: 5 },
            { text: '"Then don\'t fight it. I\'m right here."', next: 'ch3_2', affection: 4 }
          ]
        },
        ch3_2: {
          speaker: 'Sable',
          text: "Huh. Look at that — I'm actually letting my guard down, and it doesn't feel like losing at all. Weird. Good weird.",
          choices: [
            { text: '"Good weird is my favorite kind."', next: 'end_3', affection: 4 },
            { text: '"That\'s what happens when it\'s real."', next: 'end_3', affection: 5 }
          ]
        },
        end_3: {
          speaker: 'Sable',
          text: "Real, huh. Yeah. Okay. Don't get used to me being this soft — but for you, I guess I'll make exceptions.",
          image: '/cg/sable-ch3.jpg',
          choices: []
        }
      }
    }
  }
]
