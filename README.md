# EXP

**A portfolio you can walk around in.**

EXP is my portfolio built as a small JRPG-style town. Instead of a page telling you about me, you explore a small town filled with friends, teachers, coworkers who tell their stories about working with me.

The name EXP meaning 'Expierence Points' a common staple in JRPG video games. We all gain experience through our interactions, stories, and the people we meet along the way.

> Looking for a regular website? My standard portfolio is at **[y2kenn.com](https://y2kenn.com)**.

## The game

You arrive at the edge of town. Kenn (me) is waiting outside his workshop to welcome you, and everyone else has something to say.

- **Talk to the townsfolk.** Each person offers a menu of things to ask about, JRPG style. Some stories only unlock after you've heard someone else's, so villagers point you toward each other.
- **Collect stories.** A yellow **!** marks anyone with something new to say. Finding stories fills your **Journal**, which tracks who you've met, how they know me, and what they'd vouch for.
- **Explore.** Sparkles mark things worth a closer look: plaques on each building tell the story of a job in my career, and there's more tucked around town.
- **Visit the workshop.** My case studies are on the bookshelf, and my career timeline hangs on the wall.
- **See it through.** Find enough stories and I'll have one last thing to say, followed by a credits roll starring everyone in town.

Progress is saved in your browser, so you can come back and pick up where you left off.

### Controls

| Action                      | Keyboard           | Phone / tablet |
| --------------------------- | ------------------ | -------------- |
| Move                        | Arrow keys or WASD | D-pad          |
| Talk / look / advance       | Space              | A              |
| Back / leave a conversation | Escape             | B              |
| Menu                        | Enter              | MENU           |
| Journal                     | J                  | MENU → Journal |

On phones held upright, the game switches to a handheld layout: town on top, dialog in the middle, controls at the bottom.

## Accessibility

Since my understanding of Phaser.io is limited. I am by no means an expert with this framework. I know that it draws everything onto a `<canvas>`: a single picture with no text, headings, or buttons that assistive technology can read. Making accessibility very difficult within the game itself. While Accessibility is a priority, and something I take seriously, the nature of the framework imposes inherent limitations and this is just for fun to experiment with.

If you tab in the page, the notice at the top of the page (the first thing a screen reader reads, and a banner when a keyboard user presses Tab) explains this and links to [y2kenn.com](https://y2kenn.com).

Within the game:

- It's fully playable by keyboard, and menus and dialog choices are real buttons that follow keyboard focus.
- Dialog lines are announced to screen readers as they appear.
- The OS **reduce motion** setting turns off the typewriter text, the pixelated intro, bobbing markers, and scrolling credits.
- **Options → Font → Plain** swaps the pixel font for a readable system font across the menus and dialog.

## Tools used

- **[Phaser 4](https://phaser.io/)**: game engine (rendering, physics, input, tilemaps, sound)
- **[Vite](https://vitejs.dev/)**: dev server and production build, starting from Phaser's [Vite template](https://github.com/phaserjs/template-vite)
- **[GSAP](https://gsap.com/)**: animation for the HTML interface (dialog box, menus, toasts, credits)
- **[Tiled](https://www.mapeditor.org/)**: map editor used to build the town and the workshop interior
- **[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)** via Google Fonts: pixel font
- **Node's built-in test runner**: content and logic tests

The dialog box, menus, Journal, and case studies are plain HTML and CSS layered over the game canvas, which keeps them crisp at any size and usable with a keyboard or screen reader. Sound effects like the typewriter "voices" are generated in code with the Web Audio API.

## Credits

The artwork and music in EXP come from talented artists on **[itch.io](https://itch.io/)**. Thank you for making this possible.

The stories in the game are real, told by (and about) real people. Thank you to everyone in town.
