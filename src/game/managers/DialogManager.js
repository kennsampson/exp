import Phaser from "phaser";
import Animations from "../data/Animations";
import AudioManager from "./AudioManager";
import { prefersReducedMotion } from "../device";

const TYPE_SPEED_MS = 22;
const BLIP_EVERY = 3; // characters per voice blip

/**
 * Drives the DOM dialog box: typewriter text with voice blips, and choice
 * menus. It knows nothing about villagers -- callers script a conversation
 * with the promise-returning helpers:
 *
 *   dialog.open({ name, portrait, voice });
 *   await dialog.say(["Hello!", "Nice day."]);
 *   const pick = await dialog.choose([{ id: "a", label: "Hi" }]);
 *   dialog.close();
 *
 * Keyboard input is polled from `update()` using the scene's shared Phaser
 * keys, so a press that advances or closes the dialog is consumed and can't
 * also re-trigger an interaction in the same frame.
 */
export default class DialogManager {
  constructor(scene) {
    this.scene = scene;
    this.audio = new AudioManager(scene);

    const keys = Phaser.Input.Keyboard.KeyCodes;
    const kb = scene.input.keyboard;
    this.keys = {
      space: kb.addKey(keys.SPACE),
      enter: kb.addKey(keys.ENTER),
      up: kb.addKey(keys.UP),
      down: kb.addKey(keys.DOWN),
      esc: kb.addKey(keys.ESC),
    };

    this.box = document.getElementById("dialog-box");
    this.speaker = document.getElementById("dialog-speaker");
    this.text = document.getElementById("dialog-text");
    this.portrait = document.getElementById("dialog-portrait");
    this.choices = document.getElementById("dialog-choices");
    this.next = document.getElementById("dialog-next");
    this.announcer = document.getElementById("sr-announcer");

    this.isOpen = false;
    this.mode = "idle"; // "idle" | "typing" | "waiting" | "choosing"
    this.voice = 260;

    // Scenes are re-created when moving between town and interiors; drop
    // DOM listeners with the scene so they never double up.
    this.abort = new AbortController();
    scene.events.once("shutdown", () => {
      this.abort.abort();
      this.stopTyping();
    });

    this.box.addEventListener("click", (e) => {
      if (e.target.closest("#dialog-choices")) return;
      this.advance();
    }, { signal: this.abort.signal });
  }

  open({ name, portrait, voice }) {
    this.speaker.textContent = name;
    this.portrait.src = portrait || "";
    this.portrait.style.display = portrait ? "" : "none";
    this.box.classList.toggle("no-portrait", !portrait);
    this.voice = voice || 260;
    this.aborted = false;

    if (!this.isOpen) {
      this.text.textContent = "";
      this.hideChoices();
      Animations.openDialogBox();
    }
    this.isOpen = true;
  }

  close() {
    if (!this.isOpen) return;
    if (this.choices.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    this.stopTyping();
    this.hideChoices();
    this.mode = "idle";
    this.isOpen = false;
    Animations.closeDialogBox();
  }

  /**
   * Types each line out in turn, waiting for the player between them.
   * @returns {Promise<boolean>} false if the player bailed out with Escape.
   */
  async say(lines) {
    for (const line of lines) {
      for (const page of this.paginate(line)) {
        if (this.aborted) return false;
        await this.typeLine(page);
        if (this.aborted) return false;
      }
    }
    return !this.aborted;
  }

  /**
   * Splits a line into pages that each fit in the text area at the box's
   * current size, so long lines continue on the next page instead of being
   * cut off.
   */
  paginate(line) {
    this.hideChoices();
    this.text.style.display = "";
    const maxBottom = this.box.clientHeight - 28; // room for the ▼ marker
    if (maxBottom <= this.text.offsetTop) return [line]; // not laid out yet
    const fits = (value) => {
      this.text.textContent = value;
      return this.text.offsetTop + this.text.offsetHeight <= maxBottom;
    };

    const pages = [];
    if (fits(line)) {
      pages.push(line);
    } else {
      let page = "";
      for (const word of line.split(" ")) {
        const next = page ? `${page} ${word}` : word;
        if (page && !fits(next)) {
          pages.push(page);
          page = word;
        } else {
          page = next;
        }
      }
      if (page) pages.push(page);
    }
    this.text.textContent = "";
    return pages;
  }

  typeLine(line) {
    this.hideChoices();
    this.text.style.display = "";
    this.next.style.display = "none";
    this.text.textContent = "";
    this.fullLine = line;
    this.mode = "typing";
    // The visible text types out letter by letter; screen readers get the
    // whole line at once.
    if (this.announcer) {
      this.announcer.textContent = `${this.speaker.textContent}: ${line}`;
    }

    return new Promise((resolve) => {
      this.resolveLine = resolve;
      if (prefersReducedMotion()) {
        this.finishTyping();
        return;
      }
      let i = 0;
      this.typer = setInterval(() => {
        i++;
        this.text.textContent = line.slice(0, i);
        const ch = line[i - 1];
        if (i % BLIP_EVERY === 1 && ch && ch.trim()) this.audio.blip(this.voice);
        if (i >= line.length) this.finishTyping();
      }, TYPE_SPEED_MS);
    });
  }

  finishTyping() {
    this.stopTyping();
    this.text.textContent = this.fullLine;
    this.next.style.display = "";
    this.mode = "waiting";
  }

  stopTyping() {
    clearInterval(this.typer);
    this.typer = null;
  }

  advance() {
    if (this.mode === "typing") {
      this.finishTyping();
    } else if (this.mode === "waiting") {
      this.mode = "idle";
      this.next.style.display = "none";
      const resolve = this.resolveLine;
      this.resolveLine = null;
      resolve?.();
    }
  }

  /**
   * Shows a list of options inside the dialog box.
   * @param {{id: string, label: string, isNew?: boolean, isDone?: boolean}[]} options
   * @returns {Promise<string|null>} chosen id, or null on Escape.
   */
  choose(options) {
    this.stopTyping();
    this.next.style.display = "none";
    this.text.style.display = "none";
    this.choices.innerHTML = "";
    this.choiceItems = options.map((opt, i) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "menu-item";
      button.classList.toggle("is-done", !!opt.isDone);
      button.innerHTML =
        '<span class="menu-caret">&#9654;</span>' +
        `<span class="menu-label"></span>` +
        (opt.isNew ? '<span class="choice-badge">NEW</span>' : "");
      button.querySelector(".menu-label").textContent = opt.label;
      if (opt.isNew) button.setAttribute("aria-description", "new");
      button.addEventListener("mousemove", () => this.highlight(i), {
        signal: this.abort.signal,
      });
      button.addEventListener("click", () => {
        this.highlight(i);
        this.pick();
      }, { signal: this.abort.signal });
      li.append(button);
      this.choices.appendChild(li);
      return { el: button, id: opt.id };
    });
    this.choices.style.display = "flex";
    this.fitChoices();
    this.mode = "choosing";
    this.highlight(0);

    return new Promise((resolve) => {
      this.resolveChoice = resolve;
    });
  }

  highlight(index) {
    const count = this.choiceItems.length;
    this.choiceIndex = (index + count) % count;
    this.choiceItems.forEach(({ el }, i) =>
      el.classList.toggle("is-selected", i === this.choiceIndex),
    );
    // Focus follows the highlight so screen readers read the option.
    this.choiceItems[this.choiceIndex].el.focus({ preventScroll: true });
  }

  pick(id = this.choiceItems[this.choiceIndex]?.id ?? null) {
    if (this.mode !== "choosing") return;
    this.audio.playSfx("menu-select");
    this.mode = "idle";
    const resolve = this.resolveChoice;
    this.resolveChoice = null;
    resolve?.(id);
  }

  /** Grow the box upward when a long menu wouldn't fit its usual height. */
  fitChoices() {
    this.box.style.height = "";
    const padding =
      this.box.clientHeight - parseFloat(getComputedStyle(this.box).height);
    const needed = this.choices.offsetTop + this.choices.offsetHeight + 16;
    if (needed > this.box.clientHeight) {
      this.box.style.height = `${needed - padding}px`;
    }
  }

  hideChoices() {
    this.choices.style.display = "none";
    this.box.style.height = "";
  }

  /** Escape: stop whatever is on screen and unwind the conversation. */
  cancel() {
    this.aborted = true;
    if (this.mode === "choosing") {
      this.pick(null);
    } else {
      this.stopTyping();
      this.mode = "idle";
      const resolve = this.resolveLine;
      this.resolveLine = null;
      resolve?.();
    }
  }

  update() {
    if (!this.isOpen) return;
    const down = (key) => Phaser.Input.Keyboard.JustDown(this.keys[key]);
    const confirm = down("space") || down("enter");

    if (down("esc")) {
      this.cancel();
    } else if (this.mode === "choosing") {
      if (down("up")) {
        this.highlight(this.choiceIndex - 1);
        this.audio.playSfx("menu-select");
      } else if (down("down")) {
        this.highlight(this.choiceIndex + 1);
        this.audio.playSfx("menu-select");
      } else if (confirm) {
        this.pick();
      }
    } else if (confirm) {
      this.advance();
    }
  }
}
