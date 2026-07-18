// See ava.js for the chapter-structure explanation — same pattern here.

export const WREN_CHAPTERS = [
  {
    id: 'meet',
    title: 'The Den',
    unlockAffection: 0,
    route: {
      start: 'intro_1',
      nodes: {
        intro_1: {
          speaker: 'Wren',
          text: "You're loud. Whatever you're tracking through this forest heard you three minutes ago.",
          choices: [
            { text: '"Sorry — didn\'t expect company out here."', next: 'intro_2', affection: 2 },
            { text: '"I wasn\'t tracking anything. Are you?"', next: 'intro_2', affection: 3 },
            { text: '"Noted. I\'ll try to be interesting instead of loud."', next: 'intro_2_bold', affection: 1 }
          ]
        },
        intro_2: {
          speaker: 'Wren',
          text: "Watching a den, mostly. They don't mind me. People are usually the problem.",
          choices: [
            { text: 'Ask about the wolves', next: 'ask_wolves', affection: 2 },
            { text: 'Ask if she\'s always alone out here', next: 'ask_alone', affection: 1 }
          ]
        },
        intro_2_bold: {
          speaker: 'Wren',
          text: "Bold. I'll give you that much.",
          choices: [
            { text: 'Ask about the wolves', next: 'ask_wolves', affection: 1 },
            { text: 'Ask if she\'s always alone out here', next: 'ask_alone', affection: 2 }
          ]
        },
        ask_wolves: {
          speaker: 'Wren',
          text: "They don't perform for people the way tamed things do. I like that. Nothing about them is pretending.",
          choices: [
            { text: '"Is that why you\'re more comfortable with them than people?"', next: 'end_1', affection: 3 },
            { text: '"Sounds lonely."', next: 'end_1', affection: -1 }
          ]
        },
        ask_alone: {
          speaker: 'Wren',
          text: "Most of the time, yeah. Doesn't bother me. Company has to earn its way in slowly, that's all.",
          choices: [
            { text: '"I don\'t mind slow."', next: 'end_1', affection: 3 },
            { text: '"Sounds like a lot of work."', next: 'end_1', affection: 0 }
          ]
        },
        end_1: {
          speaker: 'Wren',
          text: "...Huh. You're still here. Most people aren't, after a conversation like that. Fine — come find me again if you want. I don't say that often.",
          unlockChat: true,
          choices: []
        }
      }
    }
  },
  {
    id: 'closer',
    title: 'Earning It',
    unlockAffection: 12,
    route: {
      start: 'ch2_1',
      nodes: {
        ch2_1: {
          speaker: 'Wren',
          text: "The pups let you get close today. That doesn't happen for just anyone — they can tell who's steady and who's not.",
          choices: [
            { text: '"Guess I passed, then."', next: 'ch2_2', affection: 3 },
            { text: '"That means more coming from you than from them."', next: 'ch2_2', affection: 3 }
          ]
        },
        ch2_2: {
          speaker: 'Wren',
          text: "Don't let it go to your head. ...But yeah. You did. I don't let people this close to the den, usually. Or to me, honestly.",
          choices: [
            { text: '"I noticed. I\'m glad you did, though."', next: 'end_2', affection: 4 },
            { text: '"Slow and earned. Just like you said."', next: 'end_2', affection: 3 }
          ]
        },
        end_2: {
          speaker: 'Wren',
          text: "Yeah. Just like I said. Come back tomorrow — I'll actually look for you this time instead of pretending I didn't notice you're gone.",
          image: '/cg/wren-ch2.jpg',
          choices: []
        }
      }
    }
  },
  {
    id: 'falling',
    title: 'Not Pretending',
    unlockAffection: 30,
    route: {
      start: 'ch3_1',
      nodes: {
        ch3_1: {
          speaker: 'Wren',
          text: "I need to say this straight, because I don't do the soft, dancing-around-it thing. I'm falling for you. Hard. It scares me a little, if I'm honest.",
          choices: [
            { text: '"I\'m falling for you too, Wren. No dancing around it."', next: 'ch3_2', affection: 5 },
            { text: '"Scares me a little too. Doesn\'t change how I feel."', next: 'ch3_2', affection: 4 }
          ]
        },
        ch3_2: {
          speaker: 'Wren',
          text: "Good. I don't say things I don't mean, so — that's real, for both of us now. No pretending, not with you.",
          choices: [
            { text: '"No pretending. I\'m all in."', next: 'end_3', affection: 4 },
            { text: '"That\'s all I wanted to hear."', next: 'end_3', affection: 4 }
          ]
        },
        end_3: {
          speaker: 'Wren',
          text: "Alright. Enough soft talk before I get twitchy about it. Come on — the den wants to meet you properly now that you're not just 'the loud one.'",
          image: '/cg/wren-ch3.jpg',
          choices: []
        }
      }
    }
  }
]
