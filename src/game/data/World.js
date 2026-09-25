// Inspectable objects and doors, per scene. Coordinates are world pixels
// (16px tiles) at the spot the player walks up to.
//
// Object fields:
//   id, x, y, title, lines   -- what the narrator says
//   verb                     -- bubble label (default "Look")
//   radius, height           -- interaction range / bubble offset
//   quiet                    -- no sparkle, not counted as a discovery
//   action                   -- after reading: "case-studies", "journal",
//                               or "link:<key from Links.js>"
//   actionLabel, missingLines
//
// Light fields (glows at dusk and night): x, y, radius, color, and
// `always` for sources that burn in daylight too, like a fire.
//
// Door fields: id, x, y, title, and either `to` (scene key) plus `arrive`
// (the player's top-left position in that scene), or `lines` for a door
// that doesn't open.

export default class World {
  static town = {
    lights: [
      { x: 128, y: 236 }, // west cottage door
      { x: 368, y: 206 }, // ZippyPaws
      { x: 318, y: 228, radius: 22 },
      { x: 512, y: 222 }, // east cottage (Arvada Surplus)
      { x: 176, y: 350, radius: 14 }, // row house (Outward Hound)
      { x: 204, y: 350, radius: 14 },
      { x: 184, y: 398 },
      { x: 478, y: 416 }, // long house (Paradise Pen)
      { x: 506, y: 412, radius: 14 },
      { x: 706, y: 398 }, // workshop
      { x: 630, y: 406, radius: 30, color: 0xff9a4a, always: true }, // forge
    ],
    objects: [
      {
        id: "town-bridge",
        x: 328,
        y: 572,
        title: "Bridge",
        lines: [
          "Letters are carved into the railing:",
          "'EXP...'",
          "That means 'Experience Points.'",
          "Every person in this town gave me some.",
        ],
      },
      {
        id: "town-bench",
        x: 398,
        y: 300,
        title: "Bench",
        lines: [
          "A small plaque on the bench reads:",
          "'For the long talks after work that fixed more than the code did.'",
        ],
      },
      {
        id: "town-well",
        x: 672,
        y: 534,
        radius: 22,
        title: "Well",
        lines: [
          "You toss a coin into the well.",
          "I wish for more experience points.",
        ],
      },
      {
        id: "town-falls",
        x: 150,
        y: 104,
        radius: 30,
        title: "Waterfall",
        lines: [
          "The waterfall roars.",
          "Sometimes the sounds of nature beat the sounds of the town.",
        ],
      },
      {
        id: "town-produce",
        x: 615,
        y: 275,
        title: "Truong An Gifts",
        lines: [
          "Baskets and crates of little gifts. A hand-lettered sign says:",
          "'Truong An Gifts. Family-owned.'",
        ],
      },
      {
        id: "town-flowers",
        x: 288,
        y: 420,
        title: "Flower Beds",
        lines: [
          "Neat rows of flowers, every one lined up just so.",
          "Someone around here really pays attention to the details.",
        ],
      },
      {
        id: "town-anvil",
        x: 652,
        y: 444,
        title: "Anvil",
        lines: [
          "Kenn's anvil. It's seen a lot of use.",
          "Many projects have passed over this.",
          "I wonder what the next project will be.",
        ],
      },
      // Career chapters: one building per job, oldest to newest. The first
      // chapter (Truong An, 2006) is Mimi's market stall above.
      {
        id: "plaque-outward-hound",
        x: 184,
        y: 412,
        height: 20,
        verb: "Read",
        title: "Outward Hound",
        lines: [
          "A plaque by the door: Outward Hound, 2009 to 2014.",
          "Dog toys and accessories for every pup.",
          "Kenn's role: Front-End Developer.",
          "He built landing pages and a lot of the site's UX and UI.",
        ],
      },
      {
        id: "plaque-paradise-pen",
        x: 478,
        y: 432,
        height: 20,
        verb: "Read",
        title: "Paradise Pen",
        lines: [
          "A plaque by the door: Paradise Pen, 2014 to 2017.",
          "High-end writing instruments.",
          "Kenn's role: Web Manager.",
          "Managed ecommerce site, and planned the marketing campaigns and landing pages to go with it.",
          "Family-owned.",
        ],
      },
      {
        id: "plaque-arvada-surplus",
        x: 512,
        y: 240,
        height: 20,
        verb: "Read",
        title: "Arvada Surplus",
        lines: [
          "A plaque by the door: Arvada Surplus, 2017 to 2018.",
          "Outdoor gear and surplus supplies.",
          "Kenn's role: Web Developer and Manager.",
          "He oversaw the build and launch of the new website.",
          "Family-owned.",
        ],
      },
      {
        id: "plaque-zippypaws",
        x: 368,
        y: 222,
        height: 20,
        verb: "Read",
        title: "ZippyPaws",
        lines: [
          "The biggest building in town. A sign over the door: ZippyPaws, 2018 to present.",
          "Dog toys and accessories.. wow a lot of experience in the pet industry.",
          "Kenn's role: Web Manager.",
          "He runs day-to-day development on the ecommerce site: the store, landing pages.",
          "Also family-owned. Hm, I see a pattern here!",
        ],
      },
    ],
    doors: [
      {
        id: "door-workshop",
        x: 706,
        y: 414,
        radius: 20,
        title: "Kenn's Workshop",
        to: "Workshop",
        arrive: { x: 104, y: 180 },
      },
      {
        id: "door-cottage-west",
        x: 128,
        y: 254,
        title: "Cottage",
        lines: [
          "Nobody's home.",
          "There is a note on the door.",
          "It reads: 'Vacant, Interested in renting?'",
          "I wonder if I should inquire about renting it.",
        ],
      },
    ],
  };

  static workshop = {
    lights: [
      { x: 120, y: 44, radius: 44, color: 0xff9a4a, always: true }, // fireplace
      { x: 220, y: 196, radius: 26 }, // floor lamp
      { x: 56, y: 24, radius: 16, color: 0xa8c0ff }, // windows
      { x: 184, y: 24, radius: 16, color: 0xa8c0ff },
    ],
    objects: [
      {
        id: "workshop-bookshelf",
        x: 36,
        y: 68,
        height: 24,
        title: "Bookshelf",
        lines: [
          "Binders line the shelves, each labeled with a project name.",
          "These are Kenn's case studies.",
        ],
        action: "case-studies",
        actionLabel: "Read them",
      },
      {
        id: "workshop-fireplace",
        x: 120,
        y: 66,
        radius: 26,
        height: 24,
        title: "Fireplace",
        lines: [
          "A warm fire crackles.",
          "On the mantel sits an old graduation card from Mark, his high school art teacher.",
          "'Be the change you wish to see in the world.'",
        ],
      },
      {
        id: "workshop-timeline",
        x: 156,
        y: 66,
        height: 40,
        title: "Timeline",
        lines: [
          "A hand-drawn timeline hangs on the wall.",
          "2006: Truong An. Web Designer.",
          "2009: Outward Hound. Front-End Developer.",
          "2014: Paradise Pen. Web Manager.",
          "2017: Arvada Surplus. Web Developer and Manager.",
          "2018: ZippyPaws. Web Manager. Still there!",
        ],
      },
      {
        id: "workshop-desk",
        x: 214,
        y: 84,
        height: 20,
        title: "Desk",
        lines: [
          "A tidy desk. A list of skills is written out",
          "...including web development, design, and project management.",
          "React, JavaScript, Wordpress, Woocommerce...",
          "and many more...",
        ],
        action: "link:resume",
        actionLabel: "Open the resume",
      },
      {
        id: "workshop-armchair",
        x: 121,
        y: 104,
        title: "Armchair",
        lines: [
          "A well-worn armchair. The cushion has a permanent dent.",
          "This is where the thinking happens.",
        ],
      },
      {
        id: "workshop-guestbook",
        x: 50,
        y: 128,
        radius: 24,
        title: "Guestbook",
        lines: [
          "A guestbook sits open on the table. Your name is already in it.",
          "Everyone you've met in town has signed it too.",
        ],
        action: "journal",
        actionLabel: "Flip through it",
      },
      {
        id: "workshop-coffee",
        x: 30,
        y: 180,
        title: "Counter",
        lines: [
          "A coffee maker, still warm. A sticky note on it reads:",
          "'git add . git commit -m \"Update\" git push'",
        ],
      },
    ],
    doors: [
      {
        id: "workshop-exit",
        x: 120,
        y: 222,
        radius: 14,
        title: "Door",
        verb: "Exit",
        to: "TownScene",
        arrive: { x: 690, y: 432 },
      },
    ],
  };
}
