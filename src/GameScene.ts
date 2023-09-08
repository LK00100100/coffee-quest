import * as Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;

  private gameText!: Phaser.GameObjects.Text; //any messages for the player to read.

  //these are two maps that are placed one on top of the other. ad nauseam
  //we only go upwards
  private mapA: Phaser.Tilemaps.Tilemap;
  private mapB: Phaser.Tilemaps.Tilemap;
  private topMap: Phaser.Tilemaps.Tilemap;

  private man: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  private beans;

  private numBeansCollected;

  private readonly PLAYER_SPEED_DEFAULT = 200;

  private readonly IS_DEBUG_MODE = false;

  private mapHeight: number;
  private mapWidth: number;

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
    this.mapA = this.makeTiles(0, true);
    this.topMap = this.mapA;

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
    this.man = this.physics.add.sprite(48, this.mapHeight * 32 - 48, "man");
    this.man.depth = 10;

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
    this.cameras.main.centerOn(this.mapWidth * 16, this.mapHeight * 32 + 16);
  }

  /**
   *
   * @param topY
   * @returns
   */
  makeTiles(
    topY: number = 0,
    withFloor: boolean = false,
  ): Phaser.Tilemaps.Tilemap {
    /**
     * make level
     */
    const mapData = [];

    this.mapHeight = 16;
    this.mapWidth = 12;
    for (let y = 0; y < this.mapHeight; y++) {
      const row = [];

      for (let x = 0; x < this.mapWidth; x++) {
        // 16 is space
        const randTile = Math.floor(Math.random() * 120);
        const tileIndex = randTile >= 16 ? 16 : randTile;

        row.push(tileIndex);
      }

      //left and right border
      row[0] = 15;
      row[this.mapWidth - 1] = 10;

      mapData.push(row);
    }

    //last, floor row
    if (withFloor) {
      const tops = new Array(this.mapWidth - 2).fill(11);
      mapData[mapData.length - 1] = [6, ...tops, 6];
    }

    const map = this.make.tilemap({
      data: mapData,
      tileWidth: 32,
      tileHeight: 32,
    });
    const tileset = map.addTilesetImage("tiles", null, 32, 32, 1, 2); //margin and spacing for tile bleed
    const layer = map.createLayer(0, tileset, 0, topY); // layer index, tileset, x, y
    layer.setTint(0xaabbcc);
    //TODO: use correct tile art. generate another matrix that holds wasd data and translates that to tiles

    map.setCollisionBetween(0, 15);

    if (this.IS_DEBUG_MODE) {
      this.showCollision(map);
    }

    return map;
  }

  update() {
    //player controls
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

    //  Collide man against the tilemap layer
    this.physics.collide(
      this.man,
      this.mapA.layer.tilemapLayer,
      this.manTileCollide,
    );

    if (this.mapB) {
      this.physics.collide(
        this.man,
        this.mapB.layer.tilemapLayer,
        this.manTileCollide,
      );
    }

    // man hits bean
    this.physics.world.overlap(
      this.man,
      this.beans,
      this.pickUpBean,
      null,
      this,
    );

    //move camera up with man
    const manCanvasY = this.getRelativePositionToCanvas(
      this.man,
      this.cameras.main,
    );

    //move camera up with man
    if (manCanvasY.y <= 160) {
      this.cameras.main.scrollY = this.man.y - 208; //TODO: hmmm
      // console.log(
      //   `moving up: camera.y: ${this.cameras.main.scrollY} ; manCanvasY: ${manCanvasY.y} ; man.y ${this.man.y}`,
      // );
    }

    //make more tiles above
    const currentTopY = this.topMap.tileToWorldXY(0, 0).y;
    if (this.man.y < currentTopY) {
      console.log(`generating next layer... topmap : ${currentTopY}`);
      const newTilesY = currentTopY - this.mapHeight * 32;

      const oldMap = this.topMap;
      const newMap = this.makeTiles(newTilesY);
      this.topMap = newMap;

      if (oldMap == this.mapA) {
        this.mapA = oldMap;
        this.mapB = newMap;
      } else {
        this.mapA = newMap;
        this.mapB = oldMap;
      }
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
  private showCollision(map: Phaser.Tilemaps.Tilemap) {
    const debugGraphics = this.add.graphics();
    map.renderDebug(debugGraphics);
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

  private manTileCollide(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    tile: Phaser.Tilemaps.Tile,
  ) {
    console.log(`collide tile: ${tile.x},${tile.y} = ${tile.index}`);
  }

  private getRelativePositionToCanvas(
    gameObject: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    camera: Phaser.Cameras.Scene2D.Camera,
  ) {
    return {
      x: (gameObject.x - camera.worldView.x) * camera.zoom,
      y: (gameObject.y - camera.worldView.y) * camera.zoom,
    };
  }
}
