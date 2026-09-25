import Phaser from "phaser";

const KEYS = Phaser.Input.Keyboard.KeyCodes;
const MIN_PRESS_MS = 50;

/**
 * On-screen D-pad and A / B / MENU buttons for phones and tablets.
 *
 * Rather than a parallel input system, each button presses the same Phaser
 * key the keyboard would (arrows, Space, Escape, Enter) on whichever scenes
 * are running -- so walking, dialog, and menus all work unchanged. Keys are
 * pressed through Phaser's Key objects directly instead of faking DOM
 * keyboard events, which some mobile browsers don't allow.
 *
 * Only shown on touch devices (see the CSS); harmless everywhere else.
 */
export default class TouchControls {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById("touch-controls");
    if (!this.root) return;

    this.setupDpad(document.getElementById("dpad"));
    this.root.querySelectorAll("[data-key]").forEach((button) => {
      this.setupButton(button);
    });
  }

  /** Every running scene's Key for this code (Intro, town, or workshop). */
  keysFor(code) {
    return this.game.scene
      .getScenes(true)
      .map((scene) => scene.input?.keyboard?.keys[code])
      .filter(Boolean);
  }

  press(code) {
    clearTimeout(this.pendingRelease?.[code]);
    this.pressedAt = { ...this.pressedAt, [code]: performance.now() };
    const event = fakeEvent();
    this.keysFor(code).forEach((key) => key.onDown(event));
    navigator.vibrate?.(8);
  }

  // A quick tap can press and release between two game frames, and Phaser
  // forgets a press once it's released -- so the game would never see it.
  // Hold every press for at least a couple of frames.
  release(code) {
    const heldFor = performance.now() - (this.pressedAt?.[code] ?? 0);
    const wait = Math.max(0, MIN_PRESS_MS - heldFor);
    const up = () => {
      const event = fakeEvent();
      this.keysFor(code).forEach((key) => key.onUp(event));
    };
    if (!wait) return up();
    this.pendingRelease = {
      ...this.pendingRelease,
      [code]: setTimeout(up, wait),
    };
  }

  // MENU opens the menu, and backs out of it (like Escape) once it's open.
  codeFor(button) {
    if (button.dataset.key !== "MENU") return KEYS[button.dataset.key];
    const menuOpen = this.game.scene
      .getScenes(true)
      .some((scene) => scene.optionsManager?.isOpen);
    return menuOpen ? KEYS.ESC : KEYS.ENTER;
  }

  setupButton(button) {
    let code = null;
    const down = (e) => {
      e.preventDefault();
      capture(button, e);
      code = this.codeFor(button);
      button.classList.add("is-pressed");
      this.press(code);
    };
    const up = () => {
      if (code == null) return;
      this.release(code);
      code = null;
      button.classList.remove("is-pressed");
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("lostpointercapture", up);
  }

  /**
   * One pad rather than four buttons, so a thumb can roll from one
   * direction to the next without lifting.
   */
  setupDpad(pad) {
    if (!pad) return;
    let held = null;

    const setDirection = (code) => {
      if (code === held) return;
      if (held != null) this.release(held);
      held = code;
      pad.dataset.direction = code == null ? "" : directionName(code);
      if (code != null) this.press(code);
    };

    const track = (e) => {
      const rect = pad.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      if (Math.hypot(dx, dy) < rect.width * 0.12) {
        setDirection(null);
      } else if (Math.abs(dx) > Math.abs(dy)) {
        setDirection(dx > 0 ? KEYS.RIGHT : KEYS.LEFT);
      } else {
        setDirection(dy > 0 ? KEYS.DOWN : KEYS.UP);
      }
    };

    pad.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      capture(pad, e);
      track(e);
    });
    pad.addEventListener("pointermove", (e) => {
      if (held != null || e.buttons) track(e);
    });
    const stop = () => setDirection(null);
    pad.addEventListener("pointerup", stop);
    pad.addEventListener("pointercancel", stop);
    pad.addEventListener("lostpointercapture", stop);
  }
}

// Keep receiving a finger's moves/lift even if it slides off the control.
// Best effort: capture can fail (e.g. the pointer already ended).
function capture(el, e) {
  try {
    el.setPointerCapture(e.pointerId);
  } catch {
    // Not fatal -- the control still works without capture.
  }
}

function fakeEvent() {
  return {
    timeStamp: performance.now(),
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    location: 0,
  };
}

function directionName(code) {
  return { [KEYS.UP]: "up", [KEYS.DOWN]: "down", [KEYS.LEFT]: "left", [KEYS.RIGHT]: "right" }[code];
}
