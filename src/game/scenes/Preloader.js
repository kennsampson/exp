import Phaser from "phaser";
import Characters from "../entities/Characters";

// Loads every asset the game needs up front, showing a progress bar, then
// hands off to the Intro scene. Nothing else should call this.load.* --
// everything gets loaded here once and stays in the shared texture cache.
export default class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
  }

  preload() {
    const { width, height } = this.cameras.main;
    const barWidth = 400;
    const barHeight = 24;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 - barHeight / 2;

    this.add
      .text(width / 2, barY - 40, "Loading...", {
        fontFamily: '"Press Start 2P", system-ui',
        fontSize: "16px",
        color: "#ebcc06",
      })
      .setOrigin(0.5);

    this.add
      .graphics()
      .lineStyle(2, 0xffffff, 1)
      .strokeRect(barX, barY, barWidth, barHeight)
      .fillStyle(0x222222, 1)
      .fillRect(barX + 2, barY + 2, barWidth - 4, barHeight - 4);

    const barFill = this.add.graphics();

    this.load.on("progress", (value) => {
      barFill.clear();
      barFill.fillStyle(0xebcc06, 1);
      barFill.fillRect(
        barX + 2,
        barY + 2,
        (barWidth - 4) * value,
        barHeight - 4,
      );
    });

    this.load.tilemapTiledJSON("town", "assets/tilemaps/townscene.json");
    this.load.image("cliffs", "assets/tilesets/cliffs.png"); // cliffs
    this.load.image("trees", "assets/tilesets/trees.png"); // trees
    this.load.image("houses", "assets/tilesets/houses.png"); // Houses
    this.load.image("market", "assets/tilesets/market.png"); // Market
    this.load.image("water", "assets/tilesets/water.png"); // Water
    this.load.image("exterior", "assets/tilesets/exterior.png"); // Exterior items
    this.load.image("foliage", "assets/tilesets/foliage.png"); // Foliage items
    this.load.image("tileset", "assets/tilesets/tileset.png"); // Generic tileset
    this.load.image("woods", "assets/tilesets/woods.png"); // Woods tiles
    this.load.image("tavern", "assets/tilesets/tavern.png"); // Tavern tiles
    this.load.image("forge", "assets/tilesets/blacksmith_forge.png"); // Forge tiles

    // Interiors
    this.load.tilemapTiledJSON(
      "homeInterior",
      "assets/tilemaps/homeInterior.json",
    );
    this.load.image("rugs", "assets/tilesets/rugs.png");
    this.load.image("kitchen_interior", "assets/tilesets/kitchen_interior.png");
    this.load.image(
      "house_interiors_items",
      "assets/tilesets/house_interiors_items.png",
    );
    this.load.image(
      "house_interior_tiles",
      "assets/tilesets/house_interior_tiles.png",
    );
    this.load.image("tavern_interior", "assets/tilesets/tavern_interior.png");

    //Load characters
    Object.values(Characters.spritesheets).forEach((sheet) => {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    });

    // Audio
    this.load.audio("bgm", "assets/audio/bgm.mp3");
    this.load.audio("menu-select", "assets/audio/menu_select.wav");
  }

  create() {
    this.scene.start("Intro");
  }
}
