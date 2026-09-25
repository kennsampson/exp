import Phaser from "phaser";

/**
 * Playable character with Arcade physics, camera tracking, and directional movement.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene Current game scene.
   * @param {number} x Starting world x-coordinate.
   * @param {number} y Starting world y-coordinate.
   * @param {{width: number, height: number}} bounds Size of the map, used to
   *   clamp both the player and the camera.
   */
  constructor(scene, x, y, bounds = { width: 1024, height: 768 }) {
    super(scene, x, y, "main");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    scene.physics.world.setBounds(0, 0, bounds.width, bounds.height);

    scene.cameras.main.setBounds(0, 0, bounds.width, bounds.height, true);
    scene.cameras.main.startFollow(this);

    this.enableFilters();
    this.filters.external.addBlocky({ size: 0 });

    this.speed = 75;
    // The source sprite is 320px tall; render it as a 32px character.
    this.setScale(32 / 320);
    this.body.setSize(100, 100);
    this.setOrigin(0);
    this.setDepth(8);
    this.setCollideWorldBounds(true);
  }

  /**
   * Registers cursor input and the looping walk animations used by movementControls.
   */
  playerControls() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = this.scene.input.keyboard.addKeys("W,A,S,D");

    this.anims.create({
      key: "walk-down",
      frames: this.anims.generateFrameNumbers("main", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-up",
      frames: this.anims.generateFrameNumbers("main", {
        start: 12,
        end: 15,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-left",
      frames: this.anims.generateFrameNumbers("main", {
        start: 7,
        end: 4,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("main", {
        start: 7,
        end: 4,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  /** Stop dead -- used when a conversation or menu takes over. */
  halt() {
    this.setVelocity(0, 0);
    this.stop();
  }

  /**
   * Updates velocity and walk animation from the current cursor-key state.
   * Call once per scene update.
   */
  movementControls() {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left) {
      this.setFlip(false);
      this.play("walk-left", true);
      this.setVelocityX(-this.speed);
      this.setVelocityY(0);
    } else if (right) {
      this.setFlip(true);
      this.play("walk-right", true);
      this.setVelocityX(this.speed);
      this.setVelocityY(0);
    } else if (up) {
      this.play("walk-up", true);
      this.setVelocityY(-this.speed);
      this.setVelocityX(0);
    } else if (down) {
      this.play("walk-down", true);
      this.setVelocityY(this.speed);
      this.setVelocityX(0);
    } else {
      this.stop();
      this.setVelocityX(0);
      this.setVelocityY(0);
    }
  }
}
