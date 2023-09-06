import GameScene from "./GameScene";
import * as Phaser from "phaser";

var config = {
  type: Phaser.AUTO,
  backgroundColor: "#125555",
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  width: 800,
  height: 600,
  scene: GameScene,
};

const game = new Phaser.Game(config);
