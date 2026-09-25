import Phaser from "phaser";
import { isTouch, prefersReducedMotion } from "../device";

// Title/controls screen shown once after loading finishes, before the
// player is dropped into the town.
export default class Intro extends Phaser.Scene {
  constructor() {
    super("Intro");
  }

  create() {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor(0x0a0a12);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const titleFont = '"Press Start 2P", system-ui';

    this.add
      .text(width / 2, height * 0.22, "EXP", {
        fontFamily: titleFont,
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.3, "Everyone here has a story about me.\nFind them all.", {
        fontFamily: titleFont,
        fontSize: "12px",
        color: "#9fa8ff",
        align: "center",
        lineSpacing: 10,
      })
      .setOrigin(0.5);

    const touch = isTouch();
    const controlsY = height * 0.5;
    const controls = touch
      ? [
          ["D-pad", "Move"],
          ["A", "Talk / Look / Advance"],
          ["B", "Back"],
          ["MENU", "Menu & Journal"],
        ]
      : [
          ["Arrows/WASD", "Move"],
          ["Space", "Talk / Look / Advance"],
          ["Enter", "Open Menu"],
          ["J", "Journal"],
        ];

    this.add
      .text(width / 2, controlsY - 40, "CONTROLS", {
        fontFamily: titleFont,
        fontSize: "16px",
        color: "#ffd400",
      })
      .setOrigin(0.5);

    controls.forEach(([key, action], i) => {
      const y = controlsY + i * 34;
      this.add
        .text(width / 2 - 20, y, key, {
          fontFamily: titleFont,
          fontSize: "14px",
          color: "#ffffff",
        })
        .setOrigin(1, 0.5);

      this.add
        .text(width / 2 + 20, y, action, {
          fontFamily: titleFont,
          fontSize: "14px",
          color: "#cccccc",
        })
        .setOrigin(0, 0.5);
    });

    const prompt = this.add
      .text(width / 2, height * 0.85, touch ? "Tap to Begin" : "Press ENTER to Begin", {
        fontFamily: titleFont,
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    if (!prefersReducedMotion()) this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.startKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
    this.confirmKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.hasStarted = false;
    this.input.once("pointerdown", () => this.begin());
  }

  begin() {
    if (this.hasStarted) return;
    this.hasStarted = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => this.scene.start("TownScene"),
    );
  }

  update() {
    if (this.hasStarted) return;

    if (
      Phaser.Input.Keyboard.JustDown(this.startKey) ||
      Phaser.Input.Keyboard.JustDown(this.confirmKey)
    ) {
      this.begin();
    }
  }
}
