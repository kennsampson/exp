import Phaser from "phaser";
import StartGame from "./game/main";
import TouchControls from "./game/managers/TouchControls";
import { readableFont, setReadableFont } from "./game/device";

document.addEventListener("DOMContentLoaded", () => {
  setReadableFont(readableFont());

  const game = StartGame("game-container");
  const notice = document.querySelector(".a11y-notice");
  const focusGame = () => game.canvas?.focus();

  // Phaser listens for keys on the whole window and cancels Enter/Space,
  // which would stop the notice's link and button from working (and start
  // the game instead). Keep the notice's key presses to itself; Escape
  // closes it by moving on to the game.
  notice?.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Escape") focusGame();
  });
  notice
    ?.querySelector(".a11y-notice-continue")
    .addEventListener("click", focusGame);
  new TouchControls(game);

  // The canvas is just pixels to a screen reader, so describe it and point
  // to the regular portfolio site.
  game.events.once(Phaser.Core.Events.READY, () => {
    // Focusable, so Tab moves from the notice on to the game (the notice
    // hides once focus leaves it) instead of cycling back to it.
    game.canvas.tabIndex = 0;
    game.canvas.setAttribute("role", "img");
    game.canvas.setAttribute(
      "aria-label",
      "EXP: a pixel-art town where people from Kenn's life and career tell " +
        "stories about him. This game can't be read by screen readers; " +
        "Kenn's regular portfolio at y2kenn.com is linked at the top of " +
        "the page.",
    );
  });

  // Handy for poking at scenes from the browser console while developing.
  if (import.meta.env.DEV) window.__game = game;
});
