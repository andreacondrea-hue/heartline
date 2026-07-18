// See ava.js for the chapter-structure explanation — same pattern here.

export const KAI_CHAPTERS = [
  {
    id: 'meet',
    title: 'Mid-Song',
    unlockAffection: 0,
    route: {
      start: 'intro_1',
      nodes: {
        intro_1: {
          speaker: 'Kai',
          text: "Oh — hey. Sorry, I was mid-song, I get kind of tunnel-visioned. Did you catch any of that or was it just noise?",
          choices: [
            { text: '"It was really good, actually."', next: 'intro_2', affection: 3 },
            { text: '"Mostly noise, sorry."', next: 'intro_2', affection: -1 },
            { text: '"You looked really into it."', next: 'intro_2_soft', affection: 2 }
          ]
        },
        intro_2: {
          speaker: 'Kai',
          text: "...really? Okay, don't just say that to be nice. I will absolutely play it again if you mean it.",
          choices: [
            { text: '"I mean it. Play it again."', next: 'ask_song', affection: 3 },
            { text: '"Maybe another time."', next: 'ask_song', affection: 1 }
          ]
        },
        intro_2_soft: {
          speaker: 'Kai',
          text: "Yeah, I kind of disappear when I play. It's the only time my brain shuts up, honestly.",
          choices: [
            { text: 'Ask what the song is about', next: 'ask_song', affection: 2 },
            { text: 'Ask if he\'s always this anxious', next: 'ask_anxious', affection: 1 }
          ]
        },
        ask_song: {
          speaker: 'Kai',
          text: "It's about... okay this is embarrassing, it's about someone I haven't worked up the nerve to talk to properly yet.",
          choices: [
            { text: '"Well, you\'re talking to me now."', next: 'end_1', affection: 3 },
            { text: '"Good luck with that."', next: 'end_1', affection: 0 }
          ]
        },
        ask_anxious: {
          speaker: 'Kai',
          text: "Pretty much always, yeah. Music's the one place it goes quiet. Kind of nice, actually, having someone ask instead of just noticing and saying nothing.",
          choices: [
            { text: '"I like that you notice things too."', next: 'end_1', affection: 3 },
            { text: '"That sounds tough."', next: 'end_1', affection: 1 }
          ]
        },
        end_1: {
          speaker: 'Kai',
          text: "Hey — this is going to sound forward, but can I get your number? I'd rather text you badly than never text you at all.",
          unlockChat: true,
          choices: []
        }
      }
    }
  },
  {
    id: 'closer',
    title: 'New Song',
    unlockAffection: 12,
    route: {
      start: 'ch2_1',
      nodes: {
        ch2_1: {
          speaker: 'Kai',
          text: "Okay, don't laugh, but I wrote something new and I kind of want you to be the first person who hears it. Is that too much?",
          choices: [
            { text: '"Not too much. Play it."', next: 'ch2_2', affection: 3 },
            { text: '"I\'d be honored, actually."', next: 'ch2_2', affection: 3 }
          ]
        },
        ch2_2: {
          speaker: 'Kai',
          text: "*plays a few bars, voice a little unsteady* ...it's rough. It's about someone who makes the noise in my head quiet down. Guess who.",
          choices: [
            { text: '"I have a guess, and I like it."', next: 'end_2', affection: 4 },
            { text: '"It\'s really good, Kai. I mean that."', next: 'end_2', affection: 3 }
          ]
        },
        end_2: {
          speaker: 'Kai',
          text: "Okay. Okay, good. I've been sitting on that for two weeks. Feels a lot lighter now that you've heard it.",
          image: '/cg/kai-ch2.jpg',
          choices: []
        }
      }
    }
  },
  {
    id: 'falling',
    title: 'Out Loud',
    unlockAffection: 30,
    route: {
      start: 'ch3_1',
      nodes: {
        ch3_1: {
          speaker: 'Kai',
          text: "I keep almost saying this and chickening out, so I'm just going to say it fast: I really like you. Like, more-than-friends, actually-falling-for-you like you.",
          choices: [
            { text: '"I\'ve been falling for you too, Kai."', next: 'ch3_2', affection: 5 },
            { text: '"Good. Because I feel the same."', next: 'ch3_2', affection: 4 }
          ]
        },
        ch3_2: {
          speaker: 'Kai',
          text: "...oh thank god. My hands are actually shaking right now, look at that. I've never said that out loud to anyone before.",
          choices: [
            { text: '"I\'m glad I got to be the first."', next: 'end_3', affection: 4 },
            { text: '"Your hands can stop shaking now. I\'m not going anywhere."', next: 'end_3', affection: 5 }
          ]
        },
        end_3: {
          speaker: 'Kai',
          text: "Yeah. Yeah, okay. I'm going to write a much better song about this exact moment, just so you know.",
          image: '/cg/kai-ch3.jpg',
          choices: []
        }
      }
    }
  }
]
