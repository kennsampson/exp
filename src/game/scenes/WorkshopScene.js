import WorldScene from "./WorldScene";
import World from "../data/World";

// Kenn's workshop: the building behind him in town. Holds the portfolio --
// case studies on the bookshelf, resume on the desk, guestbook (Journal).
export default class WorkshopScene extends WorldScene {
  constructor() {
    super("Workshop");
  }

  create(data) {
    const map = this.make.tilemap({ key: "homeInterior" });
    const tilesets = [
      "rugs",
      "kitchen_interior",
      "house_interiors_items",
      "house_interior_tiles",
      "tavern_interior",
    ].map((name) => map.addTilesetImage(name, name));

    map.layers.forEach((layer, i) => {
      map.createLayer(layer.name, tilesets, 0, 0).setDepth(i < 5 ? 0 : 3);
    });

    this.cameras.main.setBackgroundColor(0x000000);

    this.setupWorld({
      map,
      collisionLayer: "Collision",
      spawn: { x: data?.x ?? 104, y: data?.y ?? 180 },
      content: World.workshop,
      pixelate: false,
      indoor: true,
    });
  }
}
