//Handle Gsap annimations in this file. mostly dialogs, menus and UI elements that are in the DOM.

import gsap from "gsap";
import { prefersReducedMotion } from "../device";

export default class Animations {
  static openDialogBox() {
    const dialogBox = document.getElementById("dialog-box");
    gsap.killTweensOf(dialogBox);
    dialogBox.style.display = "flex";
    dialogBox.style.opacity = 0;
    gsap.to(dialogBox, {
      opacity: 1,
      yPercent: -25,
      duration: 0.5,
      ease: "back.out(1.7)",
    });
  }

  static closeDialogBox() {
    const dialogBox = document.getElementById("dialog-box");
    gsap.killTweensOf(dialogBox);
    gsap.to(dialogBox, {
      opacity: 0,
      yPercent: 25,
      duration: 0.5,
      ease: "back.in(1.7)",
      onComplete: () => {
        dialogBox.style.display = "none";
      },
    });
  }

  // Options menu
  static openOptionsMenu() {
    const optionsMenu = document.getElementById("options-menu");
    optionsMenu.style.display = "flex";
    optionsMenu.style.opacity = 0;
    gsap.to(optionsMenu, {
      opacity: 1,
      duration: 0.75,
      yPercent: -50,
      ease: "back.out(1.7)",
    });
  }

  static closeOptionsMenu() {
    const optionsMenu = document.getElementById("options-menu");
    gsap.to(optionsMenu, {
      opacity: 0,
      duration: 0.5,
      ease: "back.in(1.7)",
      onComplete: () => {
        optionsMenu.style.display = "none";
      },
    });
  }

  // Case studies: a full-screen takeover, so the town fades to black behind it.
  static openCaseStudies() {
    const overlay = document.getElementById("case-studies-overlay");
    overlay.style.display = "flex";
    overlay.style.opacity = 0;
    gsap.to(overlay, {
      opacity: 1,
      duration: 0.5,
    });
    
  }

  static closeCaseStudies() {
    const overlay = document.getElementById("case-studies-overlay");
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => {
        overlay.style.display = "none";
      },
    });
  }

  static openJournal() {
    const overlay = document.getElementById("journal-overlay");
    overlay.style.display = "flex";
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35 });
  }

  static closeJournal() {
    const overlay = document.getElementById("journal-overlay");
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        overlay.style.display = "none";
      },
    });
  }

  // Small banner that slides down from the top, e.g. "Story found!".
  // Toasts queue up in #toasts so several in a row stack instead of overlap.
  static toast(message, { star = false, delay = 0 } = {}) {
    const el = document.createElement("div");
    el.className = "toast" + (star ? " toast-star" : "");
    el.textContent = message;
    document.getElementById("toasts").appendChild(el);
    gsap
      .timeline({ delay, onComplete: () => el.remove() })
      .fromTo(
        el,
        { y: prefersReducedMotion() ? 0 : -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35 },
      )
      .to(el, { opacity: 0, duration: 0.4, delay: 3 });
  }
}
