import * as Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  keyW: Phaser.Input.Keyboard.Key;
  keyA: Phaser.Input.Keyboard.Key;
  keyS: Phaser.Input.Keyboard.Key;
  keyD: Phaser.Input.Keyboard.Key;

  constructor() {
    super("GameScene");
  }

  preload() {}

  create() {
    /**
     * keyboard
     */
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    console.log("reee");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
      console.log("just down W");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
      console.log("just down A");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
      console.log("just down S");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
      console.log("just down D");
    }
  }
}
