import Villagers from "../entities/Villagers";
import MovementManager from "../managers/MovementManager";
import World from "../data/World";
import WorldScene from "./WorldScene";

//We use the Scene class to make our different scenes.
export default class TownScene extends WorldScene {
  constructor() {
    super("TownScene"); //Super is used because every scene needs a unique string key for phaser can refer to it by name later.
  }

  // All assets are loaded up front by the Preloader scene, so there's
  // nothing left to load here -- the tilemap/tilesets/spritesheets are
  // already sitting in the shared texture cache by the time this scene runs.

  create(data) {
    this.movementManager = new MovementManager(this);

    //Define the town map
    const map = this.make.tilemap({ key: "town" }); //'town' is what we called it in the preload step.

    const housesTiles = map.addTilesetImage("houses", "houses");
    const marketTiles = map.addTilesetImage("market assets", "market");
    const tavernTiles = map.addTilesetImage("tavern", "tavern");
    const forgeTiles = map.addTilesetImage("Forge", "forge");
    const exteriorTiles = map.addTilesetImage(
      "tiles and exterior items",
      "exterior",
    );
    const woodsTiles = map.addTilesetImage("free_pixel_16_woods", "woods");
    const cliffsTiles = map.addTilesetImage("cliff_high", "cliffs");
    const tilesetTiles = map.addTilesetImage("tileset", "tileset");
    const foliageTiles = map.addTilesetImage("trees & stuff", "foliage");
    const waterTiles = map.addTilesetImage("waterfall & watertiles", "water");

    const allTilesets = [
      housesTiles,
      marketTiles,
      tavernTiles,
      exteriorTiles,
      woodsTiles,
      cliffsTiles,
      tilesetTiles,
      foliageTiles,
      waterTiles,
      forgeTiles,
    ];

    const grassLayer = map.createLayer("Grass", allTilesets, 0, 0);
    const waterLayer = map.createLayer("Water", allTilesets, 0, 0);
    const grassPatchLayer = map.createLayer("grass patch", allTilesets, 0, 0);
    const stoneTileLayer = map.createLayer("Stone Tile", allTilesets, 0, 0);
    const dirtLayer = map.createLayer("Dirt", allTilesets, 0, 0);
    const cliffLayer = map.createLayer("Cliff", allTilesets, 0, 0);
    const bridgeLayer = map.createLayer("Bridge", allTilesets, 0, 0);
    const homesLayer = map.createLayer("Homes", allTilesets, 0, 0);
    const homesRoofLayer = map.createLayer("Homes parallax", allTilesets, 0, 0);
    const AnimatedLayer = map.createLayer("Animated Object", allTilesets, 0, 0);
    const plantsLayer = map.createLayer("Plants", allTilesets, 0, 0);
    const fenceLayer = map.createLayer("Fence", allTilesets, 0, 0);
    const treesLayer = map.createLayer("Trees", allTilesets, 0, 0);
    const waterfallLayer = map.createLayer("Waterfall", allTilesets, 0, 0);
    const itemsLayer = map.createLayer("Items", allTilesets, 0, 0);
    const itemsParallaxLayer = map.createLayer(
      "Items Parallax",
      allTilesets,
      0,
      0,
    );

    // Set the depth of each layer to control rendering order
    grassLayer.setDepth(0);
    waterLayer.setDepth(0);
    grassPatchLayer.setDepth(0);
    stoneTileLayer.setDepth(0);
    dirtLayer.setDepth(0);
    cliffLayer.setDepth(5);
    bridgeLayer.setDepth(4);
    homesLayer.setDepth(4);
    homesRoofLayer.setDepth(9);
    AnimatedLayer.setDepth(6);
    plantsLayer.setDepth(3);
    fenceLayer.setDepth(9);
    treesLayer.setDepth(11);
    waterfallLayer.setDepth(8);
    itemsLayer.setDepth(5);
    itemsParallaxLayer.setDepth(9);

    //Place our villagers in the scene and the movement manager will handle their movement
    // Instantiate Ashley as a villager in the scene
    this.ashley = new Villagers(this, 300, 420, "ashley");

    //Leah
    this.leah = new Villagers(this, 150, 275, "leah");

    //Sydney
    this.sydney = new Villagers(this, 350, 300, "sydney");

    //Mimi - works at the market
    this.mimi = new Villagers(this, 600, 275, "mimi");

    //Mark
    this.mark = new Villagers(this, 200, 100, "mark");

    //Dale
    this.dale = new Villagers(this, 300, 250, "dale");

    //Kenn
    // Paces in front of his workshop rather than blocking its door.
    this.kenn = new Villagers(this, 676, 446, "kenn");

    //Eve -- patrols must start on one end of their route
    this.eve = new Villagers(this, 425, 450, "eve");

    //create an array of the villagers for this scene so the dialog manager can interact with them
    this.villagers = [
      this.ashley,
      this.leah,
      this.sydney,
      this.mimi,
      this.mark,
      this.dale,
      this.kenn,
      this.eve,
    ];

    this.villagers.forEach((villager) => {
      this.movementManager.npcAnimationFrames(villager);
    });

    // Music starts here (not on the title screen) and keeps playing across
    // every later scene, since scene.sound is shared by the whole game.
    this.setupWorld({
      map,
      collisionLayer: "Collision objects",
      spawn: { x: data?.x ?? 316, y: data?.y ?? 600 },
      content: World.town,
      pixelate: !data?.fromDoor,
    });
    this.physics.add.collider(this.player, this.villagers);
    this.villagers.forEach((villager) =>
      this.interactions.addVillager(villager),
    );
  }

  updateWorld() {
    this.movementManager.verticalMovement(this.ashley, 50, 350, 420);
    this.movementManager.horizontalMovement(this.leah, 50, 150, 300);
    this.movementManager.horizontalMovement(this.sydney, 50, 350, 400);
    this.movementManager.horizontalMovement(this.mimi, 50, 600, 700);
    this.movementManager.verticalMovement(this.mark, 50, 100, 200);
    this.movementManager.horizontalMovement(this.dale, 50, 300, 450);
    this.movementManager.horizontalMovement(this.kenn, 30, 676, 736);
    this.movementManager.horizontalMovement(this.eve, 50, 425, 500);
  }
}
