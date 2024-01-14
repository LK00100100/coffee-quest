import GameScene from "./GameScene";
import * as Phaser from "phaser";

var config = {
  mode: Phaser.Scale.FIT,
  type: Phaser.AUTO,
  backgroundColor: "#125555",
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  width: 1024,
  height: 800,
  scene: GameScene,
};

const game = new Phaser.Game(config);
