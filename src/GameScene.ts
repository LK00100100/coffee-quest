import * as Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;

  private gameText!: Phaser.GameObjects.Text; //any messages for the player to read.

  private map: Phaser.Tilemaps.Tilemap;

  private man: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

  private layer: Phaser.Tilemaps.TilemapLayer;

  private beans;

  private numBeansCollected;

  private readonly PLAYER_SPEED_DEFAULT = 500;

  private readonly IS_DEBUG_MODE = false;

  constructor() {
    super("GameScene");
  }

  preload() {
    //level
    this.load.tilemapCSV("map", "assets/tiles.csv");
    this.load.image("tiles", "assets/tiles2.png");

    //people
    this.load.image("man", "assets/man.png");

    this.load.image("bean", "assets/bean.png");
  }

  create() {
    /**
     * make level
     */
    const mapData = [];

    const mapHeight = 9;
    const mapWidth = 12;
    for (let y = 0; y < mapHeight; y++) {
      const row = [];

      for (let x = 0; x < mapWidth; x++) {
        //  Scatter the tiles so we get more mud and less stones
        const randTile = Math.floor(Math.random() * 50);
        const tileIndex = randTile >= 16 ? 16 : randTile;

        row.push(tileIndex);
      }

      //left and right border
      row[0] = 15;
      row[mapWidth - 1] = 10;

      mapData.push(row);
    }

    //last row
    const tops = new Array(mapWidth - 2).fill(11);
    mapData.push([6, ...tops, 6]);

    this.map = this.make.tilemap({
      data: mapData,
      tileWidth: 32,
      tileHeight: 32,
    });
    const tileset = this.map.addTilesetImage("tiles", null, 32, 32, 1, 2); //margin and spacing for tile bleed
    this.layer = this.map.createLayer(0, tileset, 0, 0); // layer index, tileset, x, y

    //TODO: use correct tile art

    // Or, you can set collision on all indexes within an array
    this.map.setCollisionBetween(0, 15);

    console.dir(this.layer);

    if (this.IS_DEBUG_MODE) {
      this.showCollision();
    }

    this.gameText = this.add.text(10, 10, "test text");

    /**
     * keyboard
     */
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    /**
     * person
     */
    this.man = this.physics.add.sprite(48, 272, "man");

    /**
     * beans
     */
    this.beans = [];
    this.beans.push(this.physics.add.sprite(80, 272, "bean"));
    this.beans.push(this.physics.add.sprite(80, 80, "bean"));

    this.numBeansCollected = 0;

    /**
     * camera
     */
    //this.cameras.main.setBounds(0, 0, 400, 400);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.centerOn(mapWidth * 16, mapWidth * 16);
  }

  update() {
    if (!this.checkIsManMoving()) {
      //fix rounding errors, or you'll collide in thin hallways
      this.man.x = Math.round(this.man.x);
      this.man.y = Math.round(this.man.y);

      if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
        this.setGameText("w");
        this.man.setVelocityX(0);
        this.man.setVelocityY(-this.PLAYER_SPEED_DEFAULT);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
        this.setGameText("a");
        this.man.setVelocityX(-this.PLAYER_SPEED_DEFAULT);
        this.man.setVelocityY(0);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
        this.setGameText("s");
        this.man.setVelocityX(0);
        this.man.setVelocityY(this.PLAYER_SPEED_DEFAULT);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
        this.setGameText("d");
        this.man.setVelocityX(this.PLAYER_SPEED_DEFAULT);
        this.man.setVelocityY(0);
      }
    }

    //  Collide player against the tilemap layer
    this.physics.collide(this.man, this.layer);

    // man hits bean
    this.physics.world.overlap(
      this.man,
      this.beans,
      this.pickUpBean,
      null,
      this,
    );

    //move camera up with man
    console.log("man.y:" + this.man.y);
    if (this.man.y < 128) {
      this.cameras.main.scrollY = this.man.y - 256;
      console.log(
        `camera.y: ${this.cameras.main.scrollY} ; man.y: ${this.man.y}`,
      );
    }
  }

  /**
   * @param newText
   */
  setGameText(newText: string) {
    this.gameText.text = newText;
  }

  /**
   * Visualize the colliding tiles
   */
  private showCollision() {
    const debugGraphics = this.add.graphics();
    this.map.renderDebug(debugGraphics);
  }

  private checkIsManMoving(): boolean {
    return this.man.body.velocity.x != 0 || this.man.body.velocity.y != 0;
  }

  private pickUpBean(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    bean: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    bean.destroy();
    this.setGameText("mmm coffee beans...");

    this.numBeansCollected++;
    if (this.numBeansCollected == this.beans.length) {
      this.setGameText("You have consumed all the coffee beans.");
    }
  }
}
