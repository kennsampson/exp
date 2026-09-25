// Everyone in town and everything they can talk about.
//
// Each person has:
//   name, portrait   -- shown in the dialog box and the Journal
//   voice            -- base pitch (Hz) of their typewriter blips
//   relation         -- one line for the Journal: how they know Kenn
//   vouches          -- one trait they'd vouch for (Journal, once met)
//   greeting         -- lines the very first time you talk to them
//   returnGreeting   -- lines every time after that
//   topics           -- things the player can ask about. Each topic:
//       id        stable key; progress is saved against it, so don't rename
//       label     what the player picks from the menu
//       lines     what the villager says back
//       story     true if it counts toward "Stories found" in the Journal
//       title     Journal name for a story topic
//       requires  optional ["villager"] (met them) or ["villager:topic"]
//                 (heard that topic) gates
//       finale    true to hold it back until enough stories are found
//       touchLines  optional replacement lines on phones/tablets (for
//                   anything that mentions keyboard keys)
//   lockedLines      -- said instead of the menu while no topic is unlocked

export default class Dialog {
  static people = {
    kenn: {
      name: "Kenn",
      portrait: "/assets/portraits/kenn.png",
      voice: 190,
      relation: "Web Manager at ZippyPaws",
      vouches: "Everyone else in this town",
      greeting: [
        "Welcome!",
        "It's great to see you here.",
        "This town is a full retrospective of my life as a web developer.",
        "I couldn't be here without the support of everyone I've met along the way.",
        "Why don't you talk with them and see what stories you can uncover?",
      ],
      returnGreeting: ["Back again! Find anyone interesting?"],
      topics: [
        {
          id: "town",
          label: "What is this place?",
          lines: [
            "Everyone here has played a part in me becoming the person I am today.",
            "Friends, teachers, coworkers, they all contributed in their own way.",
            "I think its better to hear it from them, than listen to me brag about it.",
          ],
        },
        {
          id: "howto",
          label: "Any tips?",
          lines: [
            "A yellow ! over someone's head means they have something new to say.",
            "If you see a sparkle, it means something's worth a closer look.",
            "Press J to open your Journal. It tracks who you've met and the stories you've found.",
            "Press Enter for the menu. My links are in there too.",
            // PAUSED(atmosphere)
            // "Oh, and the town follows your local time and weather. Come back at night sometime.",
          ],
          touchLines: [
            "A yellow ! over someone's head means they have something new to say.",
            "If you see a sparkle, it means something's worth a closer look.",
            "Tap MENU and open your Journal to see who you've met and the stories you've found.",
            "My links are in the menu too.",
          ],
        },
        {
          id: "about",
          label: "What do you do?",
          lines: [
            "Right now I am open to new opportunities and collaborations.",
            "I specialize in various web technologies and development practices.",
            "Woocommerce, Wordpress, React, JS, Sass you name it!",
            "See my resume for more details, then reach out!",
          ],
        },
        {
          id: "career",
          label: "Where have you worked?",
          requires: ["kenn:about"],
          lines: [
            "I have worked at several small, family-owned businesses over the years.",
            "I helped some grow, some failed. All of them taught me lessons.",
            "Each of those buildings around town has a plaque, if you want the details.",
            "You can view my full work history on my resume.",
          ],
        },
        {
          id: "work",
          label: "Can I see your work?",
          lines: [
            "My workshop is right behind me.",
            "Case studies are on the bookshelf, and there's a timeline on the wall.",
          ],
        },
        {
          id: "finale",
          label: "I've heard a lot about you.",
          finale: true,
          lines: [
            "Oh yeah? Good things, I hope.",
            "Honestly, that's what I wanted you to see.",
            "Thanks for walking around and listening.",
            "I am always open to conversations, work and collaborations!",
            "Contact me through the menu if you'd like to reach out.",
            "Before you go, there are some people you should meet properly.",
          ],
        },
      ],
    },

    ashley: {
      name: "Ashley",
      portrait: "/assets/portraits/ashley.png",
      voice: 330,
      relation: "His manager at ZippyPaws",
      vouches: "PLACEHOLDER TEXT",
      greeting: ["Oh, hi! You must be the visitor Kenn mentioned."],
      returnGreeting: ["Hey again."],
      topics: [
        {
          id: "how",
          label: "How do you know Kenn?",
          lines: [
            "I was the Marketing Director at ZippyPaws. I managed him directly.",
          ],
        },
        {
          id: "working",
          label: "What's Kenn like to work with?",
          story: true,
          title: "Working With Kenn",
          requires: ["ashley:how"],
          lines: ["PLACEHOLDER TEXT- Ashleys own words on working with me."],
        },
        {
          id: "merge",
          label: "What's the biggest thing he built?",
          story: true,
          title: "Two Sites, One Store",
          requires: ["ashley:how"],
          lines: [
            "We were running two separate websites. One for wholesale buyers, one for everyone else.",
            "Twice the maintenance. Twice the tech debt.",
            "Kenn rebuilt it from the ground up as one site, on current frameworks.",
            "The hard part was keeping every customer's account history and order numbers intact. From both sites.",
            "He pulled it off. Tech debt: gone.",
            "...For a while, anyway.",
          ],
        },
        {
          id: "rewards",
          label: "Any other big projects?",
          story: true,
          title: "Accessibility Improvements",
          requires: ["ashley:merge"],
          lines: [
            "We needed to make our site more accessible to all users.",
            "Kenn led the effort to improve accessibility across the platform.",
            "He implemented changes that made the site easier to navigate and use for everyone.",
            "It was a significant improvement for our customers and our team.",
          ],
        },
      ],
    },

    leah: {
      name: "Leah",
      portrait: "/assets/portraits/leah.png",
      voice: 300,
      relation: "Coworker at ZippyPaws",
      vouches: "Listening to customers",
      greeting: ["Hi there! New in town?"],
      returnGreeting: ["Hello again!"],
      topics: [
        {
          id: "how",
          label: "How do you know Kenn?",
          lines: [
            "We work together at ZippyPaws.",
            "Leah quotes here from her perspective on Kenn..",
          ],
        },
        {
          id: "survey",
          label: "What have you worked on together?",
          story: true,
          title: "Asking the Customers",
          requires: ["leah:how"],
          lines: ["Leah lines on working together."],
        },
        {
          id: "who",
          label: "Who else should I talk to?",
          lines: [
            "You should talk to Ashley! She was our manager.",
            "I think she usually walks by the flower beds.",
          ],
        },
      ],
    },

    eve: {
      name: "Eve",
      portrait: "/assets/portraits/eve.png",
      voice: 260,
      relation: "Friend and Mentor",
      vouches: "Clean design & fun UI/UX",
      greeting: ["Well hello. Lovely afternoon for a walk, isn't it?"],
      returnGreeting: ["Oh, it's you again."],
      topics: [
        {
          id: "geocities",
          label: "How do you know Kenn?",
          story: true,
          title: "GK Combi",
          requires: ["kenn"],
          lines: [
            "Way back in the 90s and the days of GeoCities and AngelFire sites",
            "when personal sites were often cluttered and chaotic.",
            "I kept mine clean.",
            "Kenn found my site and was inspired to create his own.",
            "We became friends, built sites together.",
            "I am amazed at how far he's come since then.",
          ],
        },
        {
          id: "growth",
          label: "What was it like seeing him grow?",
          story: true,
          title: "From Student to Lead",
          requires: ["eve:geocities"],
          lines: [
            "After all this time he still looks for new ways to 'level up' his skills,",
            "and now he has lead his own teams, and help grow others.",
            "It's wild to see someone you inspired inspiring so many others.",
          ],
        },
      ],
      lockedLines: [
        "Hmm? Sorry, I don't really talk to strangers.",
        "Maybe once you've met Kenn, I'll know you're alright.",
      ],
    },

    mark: {
      name: "Mark",
      portrait: "/assets/portraits/mark.png",
      voice: 150,
      relation: "High school art teacher",
      vouches: "Chasing your interests",
      greeting: ["Ah. A visitor. Good view of the falls from up here."],
      returnGreeting: ["Still enjoying the view?"],
      topics: [
        {
          id: "how",
          label: "How do you know Kenn?",
          lines: [
            "I taught Kenn art in high school.",
            "I can tell when someone is truly passionate about what they're doing.",
            "Kenn was one of those students.",
            "He always pushed himself to improve and learn more.",
          ],
        },
        {
          id: "note",
          label: "Do you remember his graduation?",
          story: true,
          title: "The Graduation Card",
          requires: ["mark:how"],
          lines: [
            "At graduation, I gave him a card.",
            "It said: 'Be the change you wish to see in the world.'",
            "I hear he still has it.",
            "And he did.",
          ],
        },
      ],
    },

    mimi: {
      name: "Mimi",
      portrait: "/assets/portraits/mimi.png",
      voice: 380,
      relation: "Gave him his first real break",
      vouches: "Figuring it out",
      greeting: [
        "Welcome to Truong An! Take a look around, everything's handpicked.",
      ],
      returnGreeting: ["Back again? Something catch your eye?"],
      topics: [
        {
          id: "website",
          label: "Kenn built you a website?",
          story: true,
          title: "The Family Store Website",
          requires: ["dale:mimi"],
          lines: [
            "Ah yes! In 2006, he built the first website for my family's gift store.",
            "Right in the heart of Little Saigon, in Denver.",
            "We were friends, and he'd just finished college, and was looking for his first real job as a web developer.",
            "Domain names? SSL certificates? Payment processors? I didn't even know what those were, haha!",
            "Honestly? He was nervous, and it was hard at first.",
            "But he learned, and set it all up for us.",
            "That's when I knew he was someone who'd solve the problem in front of him, no matter what.",
          ],
        },
        {
          id: "break",
          label: "Why did you hire him?",
          requires: ["mimi:website"],
          lines: [
            "Everyone needs somebody to take a chance on them.",
            "I just happened to be first.",
            "I am glad I did. Look how far he has come.",
          ],
        },
        {
          id: "market",
          label: "How's the store?",
          lines: [
            "Still here, still family-run!",
            "Dale keeps telling everyone how our website got started. Ask him sometime.",
          ],
        },
      ],
    },

    dale: {
      name: "Dale",
      portrait: "/assets/portraits/dale.png",
      voice: 210,
      relation: "Friend",
      vouches: "Showing up",
      greeting: ["Hey! Don't think I've seen you around before."],
      returnGreeting: ["Oh hey, it's you again."],
      topics: [
        {
          id: "how",
          label: "How do you know Kenn?",
          lines: [
            "Kenn? Oh, we worked together at Outward Hound",
            "I remember him as a very creative and inquisitive person.",
            "We spent a lot of time developing the company site together.",
          ],
        },
        {
          id: "skate",
          label: "What was work like at Outward Hound?",
          story: true,
          title: "Dog Days",
          requires: ["dale:how"],
          lines: [
            "While I handeld most of the back-end development, Kenn was always coming up with creative solutions for the front-end.",
            "Fun ideas for landing pages and things to make the shopping experience more engaging.",
            "The lunch breaks playing disc golf were always a highlight, too!",
          ],
        },
        {
          id: "mimi",
          label: "Know any good stories?",
          lines: [
            "You should go see Mimi at the market.",
            "She can tell you about how her website was built. That's where it all started.",
          ],
        },
      ],
    },

    sydney: {
      name: "Sydney",
      portrait: "/assets/portraits/sydney.png",
      voice: 350,
      relation: "Friendt",
      vouches: "Paying it forward",
      greeting: ["Ooh, a new face! You must have heard about Kenn."],
      returnGreeting: ["Heard anything juicy yet?"],
      topics: [
        {
          id: "how",
          label: "How do you know Kenn?",
          lines: [
            "I'm his tattoo artist!",
            "Turns out we have a ton in common. Sessions with him are never quiet.",
          ],
        },
        {
          id: "gossip",
          label: "Heard anything about Kenn?",
          lines: [
            "I heard Eve was the one who inspired him to get into the wild world of web.!",
            "...or is it the world wide web?",
            "She's usually strolling in the middle of town.",
          ],
        },
        {
          id: "mentor",
          label: "Has Kenn ever inspired you?",
          story: true,
          title: "Passing It On",
          requires: ["eve:geocities"],
          lines: [
            "I think he inspired me in ways he might not even realize.",
            "Once he told me about his journey into web development, it really stuck with me.",
            "I now take those lessons into my own work.",
            "I know Eve inspired him back in the day. Now he's doing the same for me.",
            "Funny how that gets passed along!",
          ],
        },
      ],
    },
  };
}
