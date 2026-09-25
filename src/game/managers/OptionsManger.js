import Phaser from "phaser";
import Animations from "../data/Animations";
import AudioManager from "./AudioManager";
import CaseStudies from "../data/CaseStudies";
import Dialog from "../data/Dialog";
import World from "../data/World";
import Links from "../data/Links";
import Progress, { listStories } from "./ProgressManager";
// import Environment from "./EnvironmentManager"; // PAUSED(atmosphere)
import { readableFont, setReadableFont } from "../device";

// Menu entries are <button>s and <a>s inside <li>s; hiding an entry hides
// its <li> so the list's spacing doesn't leave a gap.
const setShown = (el, shown) => (el.closest("li").hidden = !shown);
const isShown = (el) => !el.closest("li").hidden;

/**
 * The Enter menu and the full-screen panels it leads to (Case Studies,
 * Journal). Panels can also be opened straight from the world -- the
 * workshop bookshelf and guestbook, or J for the Journal -- in which case
 * backing out returns to the game instead of the menu.
 */
export default class OptionsManager {
  constructor(scene) {
    this.scene = scene;
    this.audioManager = new AudioManager(scene);
    this.isOpen = false;
    // "main" | "options" | "case-studies" | "case-study-detail" | "journal"
    this.view = "main";
    this.selectedIndex = 0;
    this.openedFromWorld = false;

    this.abort = new AbortController();
    scene.events.once("shutdown", () => this.abort.abort());

    this.mainPanel = document.getElementById("options-main");
    this.subPanel = document.getElementById("options-sub");
    this.caseStudiesListPanel = document.getElementById("case-studies-list");
    this.caseStudyDetail = document.getElementById("case-study-detail");
    this.caseStudyDetailTitle = document.getElementById(
      "case-study-detail-title",
    );
    this.caseStudyDetailSource = document.getElementById(
      "case-study-detail-source",
    );
    this.caseStudyDetailList = document.getElementById(
      "case-study-detail-list",
    );
    this.journalOverlay = document.getElementById("journal-overlay");

    this.hideMissingLinks();
    this.buildCaseStudiesList();

    // Main-menu entries can be hidden later (Credits until the finale), so
    // keep them all and filter when navigating.
    const items = (root) => Array.from(root.querySelectorAll(".menu-item"));
    this.mainItems = items(this.mainPanel);
    this.subItems = items(this.subPanel);
    this.detailItems = items(this.caseStudyDetail);
    this.journalItems = items(this.journalOverlay);

    [
      this.mainItems,
      this.subItems,
      this.caseStudyItems,
      this.detailItems,
      this.journalItems,
    ].forEach((items) => this.wireItems(items));

    const keys = Phaser.Input.Keyboard.KeyCodes;
    const kb = scene.input.keyboard;
    this.confirmKey = kb.addKey(keys.ENTER);
    this.spaceKey = kb.addKey(keys.SPACE);
    this.upKey = kb.addKey(keys.UP);
    this.downKey = kb.addKey(keys.DOWN);
    this.escKey = kb.addKey(keys.ESC);
    this.journalKey = kb.addKey(keys.J);

    this.refreshToggleLabels();
  }

  hideMissingLinks() {
    this.mainPanel.querySelectorAll("[data-link]").forEach((el) => {
      const url = Links[el.dataset.link];
      if (url) el.href = url;
      setShown(el, !!url);
    });
  }

  buildCaseStudiesList() {
    this.caseStudiesListPanel.innerHTML = "";
    const addItem = (label, data) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "menu-item";
      Object.assign(button.dataset, data);
      button.innerHTML =
        '<span class="menu-caret">&#9654;</span><span class="menu-label"></span>';
      button.querySelector(".menu-label").textContent = label;
      li.append(button);
      this.caseStudiesListPanel.append(li);
    };
    CaseStudies.entries.forEach((entry, index) => {
      if (!entry.draft) {
        addItem(entry.title, { action: "view-case-study", index: String(index) });
      }
    });
    addItem("Back", { action: "back" });

    this.caseStudyItems = Array.from(
      this.caseStudiesListPanel.querySelectorAll(".menu-item"),
    );
  }

  wireItems(items) {
    const signal = this.abort.signal;
    items.forEach((el) => {
      el.addEventListener(
        "mousemove",
        () => {
          const i = this.currentItems.indexOf(el);
          if (i === -1) return;
          this.selectedIndex = i;
          this.updateHighlight();
        },
        { signal },
      );
      el.addEventListener(
        "click",
        () => {
          const i = this.currentItems.indexOf(el);
          if (i === -1) return;
          this.selectedIndex = i;
          this.updateHighlight();
          if (el.tagName === "A") return; // the browser follows the link
          this.confirmSelection();
        },
        { signal },
      );
    });
  }

  get currentItems() {
    switch (this.view) {
      case "main":
        return this.mainItems.filter(isShown);
      case "options":
        return this.subItems;
      case "case-studies":
        return this.caseStudyItems;
      case "journal":
        return this.journalItems;
      default:
        return this.detailItems;
    }
  }

  update() {
    const justDown = Phaser.Input.Keyboard.JustDown;

    if (!this.isOpen) {
      if (justDown(this.confirmKey)) this.openOptions();
      else if (justDown(this.journalKey)) this.openJournal();
      return;
    }

    if (justDown(this.escKey)) {
      this.back();
    } else if (this.view === "journal" && justDown(this.journalKey)) {
      this.closeOptions();
    } else if (justDown(this.confirmKey) || justDown(this.spaceKey)) {
      this.confirmSelection();
    } else if (justDown(this.downKey)) {
      this.move(1);
    } else if (justDown(this.upKey)) {
      this.move(-1);
    }
  }

  move(delta) {
    const items = this.currentItems;
    if (!items.length) return;
    this.selectedIndex =
      (this.selectedIndex + delta + items.length) % items.length;
    this.updateHighlight();
    this.audioManager.playSfx("menu-select");
  }

  updateHighlight() {
    this.currentItems.forEach((el, i) => {
      el.classList.toggle("is-selected", i === this.selectedIndex);
    });
    // Keep keyboard focus on the highlighted entry so screen readers
    // announce it and focus never sits on a hidden panel.
    if (this.isOpen) {
      this.currentItems[this.selectedIndex]?.focus({ preventScroll: true });
    }
  }

  confirmSelection() {
    const el = this.currentItems[this.selectedIndex];
    if (!el) return;
    this.audioManager.playSfx("menu-select");

    if (el.dataset.action === "back") {
      this.back();
    } else if (el.dataset.action === "close") {
      this.closeOptions();
    } else if (el.dataset.action === "view-case-study") {
      this.showCaseStudyDetail(Number(el.dataset.index));
    } else if (el.dataset.toggle) {
      this.handleToggle(el.dataset.toggle);
    } else if (el.dataset.link) {
      this.openLink(Links[el.dataset.link]);
    } else if (this.view === "main") {
      this.handleMainAction(el.dataset.action);
    }
  }

  handleMainAction(action) {
    switch (action) {
      case "case-studies":
        this.showCaseStudies();
        break;
      case "journal":
        this.showJournal();
        break;
      case "credits":
        this.closeOptions();
        this.scene.creditsManager.play();
        break;
      case "options":
        this.showSub();
        break;
    }
  }

  openLink(url) {
    if (!url) return;
    // Mobile browsers can block the new tab when the press came through
    // the on-screen A button; fall back to opening it here.
    const tab = window.open(url, "_blank", "noopener,noreferrer");
    if (!tab && !url.startsWith("mailto:")) window.location.href = url;
  }

  back() {
    if (this.view === "case-study-detail") {
      this.showCaseStudiesList();
    } else if (this.view === "case-studies" || this.view === "journal") {
      if (this.view === "journal") Animations.closeJournal();
      else Animations.closeCaseStudies();
      if (this.openedFromWorld) {
        this.finishClosing();
      } else {
        Animations.openOptionsMenu();
        this.showMain();
      }
    } else if (this.view === "options") {
      this.showMain();
    } else {
      this.closeOptions();
    }
  }

  showMain() {
    this.view = "main";
    this.selectedIndex = 0;
    setShown(
      this.mainPanel.querySelector('[data-action="credits"]'),
      Progress.state.finaleSeen,
    );
    this.subPanel.style.display = "none";
    this.mainPanel.style.display = "flex";
    this.updateHighlight();
  }

  showSub() {
    this.view = "options";
    this.selectedIndex = 0;
    this.mainPanel.style.display = "none";
    this.subPanel.style.display = "flex";
    this.updateHighlight();
  }

  showCaseStudies() {
    this.view = "case-studies";
    this.selectedIndex = 0;
    if (!this.openedFromWorld) Animations.closeOptionsMenu();
    Animations.openCaseStudies();
    this.caseStudyDetail.style.display = "none";
    this.caseStudiesListPanel.style.display = "flex";
    this.updateHighlight();
  }

  showCaseStudiesList() {
    this.view = "case-studies";
    this.selectedIndex = 0;
    this.caseStudyDetail.style.display = "none";
    this.caseStudiesListPanel.style.display = "flex";
    this.updateHighlight();
  }

  showCaseStudyDetail(index) {
    const entry = CaseStudies.entries[index];
    if (!entry) return;
    this.caseStudyDetailTitle.textContent = entry.title;
    this.caseStudyDetailSource.textContent = entry.source;
    this.caseStudyDetailList.replaceChildren(
      ...entry.details.map((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        return li;
      }),
    );

    this.view = "case-study-detail";
    this.selectedIndex = 0;
    this.caseStudiesListPanel.style.display = "none";
    this.caseStudyDetail.style.display = "flex";
    this.updateHighlight();
  }

  showJournal() {
    this.view = "journal";
    this.selectedIndex = 0;
    if (!this.openedFromWorld) Animations.closeOptionsMenu();
    this.renderJournal();
    Animations.openJournal();
    this.updateHighlight();
  }

  renderJournal() {
    const { found, total } = Progress.stories;
    const discoverable = [
      ...World.town.objects,
      ...World.workshop.objects,
    ].filter((obj) => !obj.quiet);
    const discovered = discoverable.filter((obj) =>
      Progress.hasInspected(obj.id),
    ).length;
    const people = Object.entries(Dialog.people);
    const met = people.filter(([key]) => Progress.hasMet(key)).length;

    const setMeter = (id, value, max) => {
      const el = document.getElementById(id);
      el.querySelector(".meter-count").textContent = `${value}/${max}`;
      el.querySelector(".meter-fill").style.width =
        `${max ? (value / max) * 100 : 0}%`;
    };
    setMeter("journal-stories", found, total);
    setMeter("journal-people", met, people.length);
    setMeter("journal-places", discovered, discoverable.length);

    const stories = listStories(Dialog.people);
    const grid = document.getElementById("journal-people-grid");
    grid.replaceChildren(
      ...people.map(([key, person]) => {
        const isMet = Progress.hasMet(key);
        const card = document.createElement("li");
        card.className = "journal-card" + (isMet ? "" : " is-unmet");

        const img = document.createElement("img");
        img.src = person.portrait;
        img.alt = isMet ? person.name : "Someone you haven't met";

        const body = document.createElement("div");
        const name = document.createElement("h3");
        name.textContent = isMet ? person.name : "???";
        const relation = document.createElement("p");
        relation.className = "journal-relation";
        relation.textContent = isMet ? person.relation : "Somewhere in town...";
        body.append(name, relation);

        if (isMet) {
          const vouches = document.createElement("p");
          vouches.className = "journal-vouches";
          vouches.textContent = `Vouches for: ${person.vouches}`;
          body.append(vouches);

          const theirs = stories.filter((s) => s.person === key);
          if (theirs.length) {
            const list = document.createElement("ul");
            list.className = "journal-stories";
            theirs.forEach((s) => {
              const li = document.createElement("li");
              const heard = Progress.state.heard.includes(s.id);
              li.className = heard ? "is-found" : "";
              li.textContent = heard ? s.topic.title : "? ? ?";
              list.append(li);
            });
            body.append(list);
          }
        }

        card.append(img, body);
        return card;
      }),
    );
  }

  handleToggle(key) {
    if (key === "music") {
      this.audioManager.toggleMusicMuted();
    } else if (key === "sfx") {
      this.audioManager.toggleSfxMuted();
    } else if (key === "font") {
      setReadableFont(!readableFont());
    }
    // PAUSED(atmosphere)
    // else if (key === "time" || key === "weather") {
    //   Environment.cycle(key);
    // }
    this.refreshToggleLabels();
  }

  refreshToggleLabels() {
    const onOff = (muted) => (muted ? "OFF" : "ON");
    this.setToggleText("music", onOff(this.audioManager.musicMuted));
    this.setToggleText("sfx", onOff(this.audioManager.sfxMuted));
    this.setToggleText("font", readableFont() ? "PLAIN" : "PIXEL");
    // PAUSED(atmosphere)
    // this.setToggleText("time", Environment.timeSetting.toUpperCase());
    // this.setToggleText("weather", Environment.weatherSetting.toUpperCase());
  }

  setToggleText(key, text) {
    const el = this.subPanel.querySelector(
      `[data-toggle="${key}"] .menu-toggle-state`,
    );
    if (el) el.textContent = text;
  }

  pauseWorld() {
    this.isOpen = true;
    this.scene.player.halt();
    this.scene.physics.pause();
  }

  openOptions() {
    this.openedFromWorld = false;
    Animations.openOptionsMenu();
    this.pauseWorld();
    this.showMain();
    this.audioManager.playSfx("menu-select");
  }

  /** Straight to the case studies, e.g. from the workshop bookshelf. */
  openCaseStudies() {
    this.openedFromWorld = true;
    this.pauseWorld();
    this.showCaseStudies();
  }

  /** Straight to the Journal: the J key or the workshop guestbook. */
  openJournal() {
    this.openedFromWorld = true;
    this.pauseWorld();
    this.showJournal();
    this.audioManager.playSfx("menu-select");
  }

  closeOptions() {
    if (this.view === "journal") Animations.closeJournal();
    else if (this.view.startsWith("case-stud")) Animations.closeCaseStudies();
    else Animations.closeOptionsMenu();
    this.audioManager.playSfx("menu-select");
    this.finishClosing();
  }

  finishClosing() {
    this.isOpen = false;
    document.activeElement?.blur();
    this.view = "main";
    this.scene.physics.resume();
  }
}
