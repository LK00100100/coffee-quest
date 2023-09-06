import * as Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;

  private gameText!: Phaser.GameObjects.Text; //any messages for the player to read.

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.tilemapCSV("map", "assets/tiles.csv");
    this.load.image("tiles", "assets/tiles.png");
  }

  create() {
    const map = this.make.tilemap({
      key: "map",
      tileWidth: 32,
      tileHeight: 32,
    });
    const tileset = map.addTilesetImage("tiles");
    const layer = map.createLayer(0, tileset, 0, 0); // layer index, tileset, x, y
    layer.skipCull = true;

    this.gameText = this.add.text(10, 10, "test text");

    /**
     * keyboard
     */
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
      this.setGameText("w");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.setGameText("A");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
      this.setGameText("S");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.setGameText("D");
    }
  }

  /**
   * @param newText
   */
  setGameText(newText: string) {
    this.gameText.text = newText;
  }
}
