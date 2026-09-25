import Phaser from "phaser";
import Preloader from "./scenes/Preloader";
import Intro from "./scenes/Intro";
import TownScene from "./scenes/TownScene";
import WorkshopScene from "./scenes/WorkshopScene";

//General Phaser configuration
const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 832,
    height: 672,
  },
  scene: [Preloader, Intro, TownScene, WorkshopScene], // Add your scenes here
};

const StartGame = (parent) => {
  return new Phaser.Game({ ...config, parent });
};

export default StartGame;
