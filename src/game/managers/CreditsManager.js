import Phaser from "phaser";
import gsap from "gsap";
import Dialog from "../data/Dialog";
import Links from "../data/Links";
import AudioManager from "./AudioManager";
import { prefersReducedMotion } from "../device";

const LINK_LABELS = {
  resume: "Resume",
  linkedin: "LinkedIn",
  github: "GitHub",
  email: "Email",
  portfolio: "Y2Kenn.com",
};

/**
 * The finale: a JRPG-style credits roll starring everyone in town, ending
 * on a card with Kenn's links. Space/Enter skips to the card; Escape (or
 * "Keep exploring") drops back into the world.
 */
export default class CreditsManager {
  constructor(scene) {
    this.scene = scene;
    this.audio = new AudioManager(scene);
    this.isOpen = false;
    this.overlay = document.getElementById("credits-overlay");
    this.roll = document.getElementById("credits-roll");
    this.card = document.getElementById("credits-card");

    const keys = Phaser.Input.Keyboard.KeyCodes;
    const kb = scene.input.keyboard;
    this.keys = [kb.addKey(keys.SPACE), kb.addKey(keys.ENTER)];
    this.escKey = kb.addKey(keys.ESC);

    this.abort = new AbortController();
    scene.events.once("shutdown", () => {
      this.abort.abort();
      this.tween?.kill();
    });
  }

  build() {
    const cast = Object.values(Dialog.people)
      .filter((person) => person.name !== "Kenn")
      .map((person) => {
        const row = document.createElement("li");
        const img = document.createElement("img");
        img.src = person.portrait;
        img.alt = "";
        const name = document.createElement("strong");
        name.textContent = person.name;
        const relation = document.createElement("span");
        relation.textContent = person.relation;
        row.append(img, name, relation);
        return row;
      });
    document.getElementById("credits-cast").replaceChildren(...cast);

    const links = document.getElementById("credits-links");
    links.replaceChildren(
      ...Object.entries(LINK_LABELS)
        .filter(([key]) => Links[key])
        .map(([key, label]) => {
          const a = document.createElement("a");
          a.href = Links[key];
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = label;
          return a;
        }),
    );

    document
      .getElementById("credits-continue")
      .addEventListener("click", () => this.close(), {
        signal: this.abort.signal,
        once: true,
      });
  }

  play() {
    this.build();
    this.isOpen = true;
    this.atCard = false;
    this.scene.player.halt();
    this.scene.physics.pause();
    this.audio.jingle();

    this.card.style.display = "none";
    this.roll.style.display = "";
    this.overlay.style.display = "flex";
    gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.8 });

    // Reduced motion: no auto-scroll. The cast is a normal scrollable page
    // and A / Space moves on to the thank-you card.
    const still = prefersReducedMotion();
    this.overlay.classList.toggle("is-static", still);
    if (still) return;

    const distance = this.roll.offsetHeight + this.overlay.offsetHeight;
    this.tween = gsap.fromTo(
      this.roll,
      { y: this.overlay.offsetHeight },
      {
        y: -this.roll.offsetHeight,
        duration: distance / 80, // px per second
        ease: "none",
        onComplete: () => this.showCard(),
      },
    );
  }

  showCard() {
    this.tween?.kill();
    this.atCard = true;
    this.roll.style.display = "none";
    this.card.style.display = "flex";
    gsap.fromTo(this.card, { opacity: 0 }, { opacity: 1, duration: 0.6 });
    document.getElementById("credits-continue").focus({ preventScroll: true });
  }

  close() {
    if (!this.isOpen) return;
    this.tween?.kill();
    this.isOpen = false;
    gsap.to(this.overlay, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => (this.overlay.style.display = "none"),
    });
    this.scene.physics.resume();
  }

  update() {
    const justDown = Phaser.Input.Keyboard.JustDown;
    if (justDown(this.escKey)) {
      this.close();
    } else if (this.keys.some((key) => justDown(key))) {
      if (this.atCard) this.close();
      else this.showCard();
    }
  }
}
