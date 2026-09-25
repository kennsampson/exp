import Phaser from "phaser";
import Progress from "./ProgressManager";
import { prefersReducedMotion } from "../device";
import { talkTo, inspect, useDoor } from "./Conversations";

const FONT = '"Press Start 2P", system-ui';

/**
 * Everything the player can walk up to and press Space on: villagers,
 * inspectable objects, and doors. Each frame it finds the closest target in
 * range, floats a small "Talk / Look / Enter" bubble over it, and keeps the
 * ambient markers up to date -- a bobbing "!" over villagers with something
 * new to say and a twinkle on objects nobody has looked at yet.
 */
export default class InteractionManager {
  constructor(scene) {
    this.scene = scene;
    this.targets = [];
    this.key = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.prompt = this.makeBubble("", "#000000", 0xffffff).setVisible(false);
  }

  makeBubble(label, color, fill) {
    const text = makeText(this.scene, label, color);
    const bg = this.scene.add.graphics();
    const bubble = this.scene.add.container(0, 0, [bg, text]).setDepth(60);
    bubble.setLabel = (value) => {
      if (value === bubble.label) return bubble;
      bubble.label = value;
      text.setText(value);
      const w = Math.ceil(text.width) + 6;
      const h = Math.ceil(text.height) + 4;
      bg.clear()
        .fillStyle(fill, 1)
        .fillRoundedRect(-w / 2, -h, w, h, 2)
        .lineStyle(1, 0x000000, 1)
        .strokeRoundedRect(-w / 2, -h, w, h, 2);
      text.setPosition(-text.width / 2, -h + 2);
      return bubble;
    };
    return bubble.setLabel(label);
  }

  addVillager(villager) {
    const marker = makeText(this.scene, "!", "#ffd400")
      .setStroke("#000000", 3)
      .setOrigin(0.5, 1)
      .setDepth(59);
    this.targets.push({
      kind: "npc",
      label: "Talk",
      radius: 28,
      marker,
      entity: villager,
      center: () => villager.getCenter(),
      top: () => ({ x: villager.x + 16, y: villager.y + 2 }),
      interact: () => talkTo(this.scene, villager),
    });
  }

  addObject(def) {
    const target = {
      kind: "object",
      label: def.verb || "Look",
      radius: def.radius || 20,
      def,
      center: () => ({ x: def.x, y: def.y }),
      top: () => ({ x: def.x, y: def.y - (def.height || 12) }),
      interact: () => inspect(this.scene, def),
    };
    if (!def.quiet) target.sparkle = this.makeSparkle(def.x, def.y - 4);
    this.targets.push(target);
  }

  addDoor(def) {
    this.targets.push({
      kind: "door",
      label: def.verb || (def.to ? "Enter" : "Knock"),
      radius: def.radius || 16,
      def,
      center: () => ({ x: def.x, y: def.y }),
      top: () => ({ x: def.x, y: def.y - 20 }),
      interact: () => useDoor(this.scene, def),
    });
  }

  makeSparkle(x, y) {
    const g = this.scene.add.graphics({ x, y }).setDepth(58);
    g.fillStyle(0xffffff, 1);
    g.fillRect(-0.5, -2.5, 1, 5);
    g.fillRect(-2.5, -0.5, 5, 1);
    g.fillStyle(0xfff3a0, 1).fillRect(-0.5, -0.5, 1, 1);
    if (prefersReducedMotion()) return g; // a steady sparkle, no twinkle
    this.scene.tweens.add({
      targets: g,
      alpha: { from: 1, to: 0.15 },
      scale: { from: 1.2, to: 0.6 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 700,
    });
    return g;
  }

  refreshMarkers(time) {
    const bob = prefersReducedMotion()
      ? 0
      : Math.round(Math.sin(time / 180) * 1.5);
    this.targets.forEach((t) => {
      if (t.marker) {
        const show =
          t !== this.current &&
          !t.entity.isTalking &&
          Progress.hasNewTopics(t.entity.key);
        const top = t.top();
        t.marker.setVisible(show).setPosition(top.x, top.y + bob);
      }
      if (t.sparkle) {
        t.sparkle.setVisible(!Progress.hasInspected(t.def.id));
      }
    });
  }

  /**
   * Nearest target within its own radius of the player's centre. People
   * win over objects and doors: villagers patrol past scenery, and walking
   * up to someone should never prompt "Look" at the flower bed behind them.
   */
  findNearest() {
    const p = this.scene.player.getCenter();
    let best = null;
    let bestScore = Infinity;
    for (const t of this.targets) {
      const c = t.center();
      const d = Phaser.Math.Distance.Between(p.x, p.y, c.x, c.y);
      if (d >= t.radius) continue;
      const score = t.kind === "npc" ? d - 1000 : d;
      if (score < bestScore) {
        best = t;
        bestScore = score;
      }
    }
    return best;
  }

  hidePrompt() {
    this.current = null;
    this.prompt.setVisible(false);
  }

  /**
   * @param {number} time Scene time, for the marker bob.
   * @param {boolean} canInteract false while a dialog or menu is up: markers
   *   keep animating but no prompt shows and Space is left alone.
   */
  update(time, canInteract = true) {
    this.current = canInteract ? this.findNearest() : null;
    this.refreshMarkers(time);

    if (!this.current) {
      this.prompt.setVisible(false);
      return;
    }

    const top = this.current.top();
    this.prompt
      .setLabel(this.current.label)
      .setPosition(top.x, top.y)
      .setVisible(true);

    if (Phaser.Input.Keyboard.JustDown(this.key)) {
      const target = this.current;
      this.hidePrompt();
      target.interact();
    }
  }
}

function makeText(scene, value, color) {
  return scene.add.text(0, 0, value, {
    fontFamily: FONT,
    fontSize: "8px",
    color,
  });
}
