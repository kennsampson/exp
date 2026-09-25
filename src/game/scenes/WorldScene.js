import Phaser from "phaser";
import Cameras from "../cameras";
import Player from "../entities/Player";
import DialogManager from "../managers/DialogManager";
import OptionsManager from "../managers/OptionsManger";
import AudioManager from "../managers/AudioManager";
import InteractionManager from "../managers/InteractionManager";
import CreditsManager from "../managers/CreditsManager";
// PAUSED(atmosphere): time-of-day + weather is switched off for now. To bring it back,
// uncomment every line tagged PAUSED(atmosphere) (search the project for it).
// import AtmosphereManager from "../managers/AtmosphereManager";

/**
 * Shared plumbing for any walkable map (the town, building interiors):
 * managers, collisions, the player, doors/objects, and one update loop that
 * decides who gets the keyboard this frame -- credits, then the menu, then
 * an open dialog, then the world.
 */
export default class WorldScene extends Phaser.Scene {
  /**
   * @param {object} opts
   * @param {Phaser.Tilemaps.Tilemap} opts.map
   * @param {string} opts.collisionLayer Name of the Tiled object layer.
   * @param {{x: number, y: number}} opts.spawn Player's top-left position.
   * @param {{objects: object[], doors: object[]}} opts.content From World.js.
   * @param {boolean} opts.pixelate Big reveal vs. quick fade-in.
   * @param {boolean} opts.indoor Softer time-of-day tint and no weather.
   */
  setupWorld({
    map,
    collisionLayer,
    spawn,
    content,
    pixelate,
    indoor = false,
  }) {
    this.optionsManager = new OptionsManager(this);
    this.dialogManager = new DialogManager(this);
    this.creditsManager = new CreditsManager(this);
    Cameras.create(this, { pixelate });
    new AudioManager(this).playMusic();
    this.transitioning = false;

    const collisionGroup = this.physics.add.staticGroup();
    map.getObjectLayer(collisionLayer).objects.forEach((obj) => {
      collisionGroup.add(
        this.add.rectangle(
          obj.x + obj.width / 2,
          obj.y + obj.height / 2,
          obj.width,
          obj.height,
        ),
      );
    });

    this.player = new Player(this, spawn.x, spawn.y, {
      width: map.widthInPixels,
      height: map.heightInPixels,
    });
    this.physics.add.collider(this.player, collisionGroup);
    this.player.playerControls();

    this.interactions = new InteractionManager(this);
    content.objects.forEach((def) => this.interactions.addObject(def));
    content.doors.forEach((def) => this.interactions.addDoor(def));

    // PAUSED(atmosphere)
    // this.atmosphere = new AtmosphereManager(this, {
    //   lights: content.lights,
    //   indoor,
    // });
  }

  /** Fade out and hand over to another map. */
  goTo(sceneKey, arrive) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.halt();
    this.interactions.hidePrompt();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => this.scene.start(sceneKey, { ...arrive, fromDoor: true }),
    );
  }

  /** Per-frame hook for scene-specific things like NPC patrols. */
  updateWorld() {}

  update(time, delta) {
    // this.atmosphere.update(time, delta); // PAUSED(atmosphere)
    this.routeInput(time);
    this.flushPresses();
  }

  /**
   * Phaser remembers a press until something asks JustDown() about it, so a
   * key hit while nobody was listening (Escape while walking, Space while a
   * menu is up) would otherwise fire later -- instantly closing the next
   * dialog or re-opening an interaction. Whoever owns input reads their
   * keys in routeInput(); anything left unread is dropped here.
   */
  flushPresses() {
    const keys = Phaser.Input.Keyboard.KeyCodes;
    [keys.SPACE, keys.ENTER, keys.ESC, keys.J, keys.UP, keys.DOWN].forEach(
      (code) => {
        const key = this.input.keyboard.keys[code];
        if (key) Phaser.Input.Keyboard.JustDown(key);
      },
    );
  }

  routeInput(time) {
    if (this.transitioning) return;

    if (this.creditsManager.isOpen) {
      this.creditsManager.update();
      return;
    }

    if (this.optionsManager.isOpen) {
      this.optionsManager.update();
      return;
    }

    this.updateWorld(time);

    if (this.dialogManager.isOpen) {
      this.dialogManager.update();
      this.interactions.update(time, false);
      return;
    }

    this.optionsManager.update();
    if (this.optionsManager.isOpen) return;

    this.interactions.update(time);
    if (!this.dialogManager.isOpen) this.player.movementControls();
  }
}
