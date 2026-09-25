import Phaser from "phaser";

export default class Villagers extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, movementDir) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.enableFilters();
    this.filters.external.addBlocky({ size: 0 });
    //this. refers to the player object.
    this.speed = 75;
    this.setScale(32 / 320);
    this.body.setSize(100, 100);
    this.setOrigin(0);
    this.setDepth(7.8);
    this.setCollideWorldBounds(true);
    this.body.setImmovable(true);
    this.key = textureKey;
    this.movementDir = movementDir;
  }

  /** Turn to look at a point (usually the player) using the idle frames. */
  faceToward(x, y) {
    const dx = x - this.getCenter().x;
    const dy = y - this.getCenter().y;
    this.anims.stop();
    if (Math.abs(dx) > Math.abs(dy)) {
      this.setFrame(4);
      this.flipX = dx > 0; // side frames face left; flipped faces right
    } else {
      this.setFrame(dy < 0 ? 12 : 0);
      this.flipX = false;
    }
  }
}
