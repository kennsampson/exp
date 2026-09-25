import Phaser from "phaser";
import { prefersReducedMotion } from "./device";

export default class Cameras extends Phaser.Scene {
  constructor() {
    super("Cameras");
  }

  /**
   * @param {Phaser.Scene} pixels Scene whose main camera to set up.
   * @param {{pixelate?: boolean}} options pixelate: play the big
   *   de-pixelating reveal (first arrival) instead of a quick fade (doors).
   */
  static create(pixels, { pixelate = true } = {}) {
    if (prefersReducedMotion()) pixelate = false;
    const camera = pixels.cameras.main;
    camera.setZoom(3);
    const startscene = camera.filters.external.addBlocky({
      size: pixelate ? 50 : 0,
    });
    camera.filters.external.addBlocky({ size: 2 });
    camera.filters.internal.addTiltShift(1, 0, 0.2, 0.2, 0.9, 0.2);
    camera.filters.internal.addQuantize({
      steps: [64, 64, 64, 64],
      mode: 0,
      dither: false,
      gamma: [1, 1, 1, 1],
    });

    if (!pixelate) {
      camera.fadeIn(250, 0, 0, 0);
      return;
    }

    pixels.tweens.add({
      targets: startscene.size,
      x: 0,
      y: 0,
      duration: 1000,
      ease: "Sine",
    });
  }
}
