import * as Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;

  private keyQ: Phaser.Input.Keyboard.Key;
  private keyE: Phaser.Input.Keyboard.Key;

  private gameText!: Phaser.GameObjects.Text; //any messages for the player to read.

  //these are two maps that are placed one on top of the other. ad nauseam
  //we only go upwards
  private mapA: Phaser.Tilemaps.Tilemap;
  private mapB: Phaser.Tilemaps.Tilemap;
  private topMap: Phaser.Tilemaps.Tilemap;

  private man: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  private beans: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
  private fires: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;

  private numBeansCollected;

  private readonly PLAYER_SPEED_DEFAULT = 400;

  private readonly IS_DEBUG_MODE = false;

  private levelHeight: number = 16;
  private levelWidth: number = 12;

  private readonly TILE_WIDTH = 32; //tile is square
  private readonly TILE_HALF_WIDTH = this.TILE_WIDTH / 2;

  constructor() {
    super("GameScene");
  }

  preload() {
    //level
    this.load.tilemapCSV("map", "assets/tiles.csv");
    this.load.image("tiles", "assets/tiles2.png");

    //people
    this.load.image("man", "assets/man.png");

    //hostiles
    this.load.image("bean", "assets/bean.png");
    this.load.spritesheet("fire", "assets/fire-ss.png", {
      frameWidth: 30,
      frameHeight: 30,
    });
  }

  create() {
    this.mapA = this.makeTiles(0, true);
    this.topMap = this.mapA;

    /**
     * keyboard
     */
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    /**
     * person
     */
    this.man = this.physics.add.sprite(
      48,
      this.levelHeight * this.TILE_WIDTH -
        (this.TILE_WIDTH + this.TILE_HALF_WIDTH),
      "man",
    );
    this.man.depth = 10;

    /**
     * beans
     */
    this.beans = [];
    this.beans.push(this.physics.add.sprite(80, 80, "bean"));

    this.numBeansCollected = 0;

    /**
     * fires
     */
    this.fires = [];

    this.anims.create({
      key: "burn",
      frames: this.anims.generateFrameNumbers("fire"),
      frameRate: 16,
      repeat: -1,
    });

    /**
     * camera
     */
    //this.cameras.main.setBounds(0, 0, 400, 400);
    this.cameras.main.setZoom(1.5);

    // prettier-ignore
    this.cameras.main.centerOn(
      this.levelWidth * this.TILE_HALF_WIDTH, //go half way
      (this.levelHeight * this.TILE_WIDTH) + this.TILE_HALF_WIDTH,
    );

    // prettier-ignore
    this.gameText = this.add
      .text((this.levelWidth * this.TILE_HALF_WIDTH) - 50, 112, "test text")
      .setDepth(100)
      .setScrollFactor(0);
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
    for (let y = 0; y < this.levelHeight; y++) {
      const row = [];

      for (let x = 0; x < this.levelWidth; x++) {
        // 16 is space
        const randTile = Math.floor(Math.random() * 200);
        const tileIndex = randTile >= 16 ? 16 : randTile;

        row.push(tileIndex);
      }

      //left and right border
      row[0] = 15;
      row[this.levelWidth - 1] = 10;

      mapData.push(row);
    }

    //last, floor row
    if (withFloor) {
      const tops = new Array(this.levelWidth - 2).fill(11);
      mapData[mapData.length - 1] = [6, ...tops, 6];
    }

    const map = this.make.tilemap({
      data: mapData,
      tileWidth: this.TILE_WIDTH,
      tileHeight: this.TILE_WIDTH,
    });
    const tileset = map.addTilesetImage(
      "tiles",
      null,
      this.TILE_WIDTH,
      this.TILE_WIDTH,
      1,
      2,
    ); //margin and spacing for tile bleed
    const layer = map.createLayer(0, tileset, 0, topY); // layer index, tileset, x, y

    const colors = [0xffcccb, 0x90ee90, 0xadd8e6]; //R,G,B
    const color = colors[Math.floor(Math.random() * 3)];
    layer.setTint(color);
    //TODO: use correct tile art. generate another matrix that holds wasd data and translates that to tiles

    map.setCollisionBetween(0, 15);

    if (this.IS_DEBUG_MODE) {
      this.showCollision(map);
    }

    return map;
  }

  addBeansAndFire(
    map: Phaser.Tilemaps.Tilemap,
    numBeans: number = 5,
    numFires: number = 3,
  ) {
    const mapOrigin = map.tileToWorldXY(0, 0);

    let beansAdded = 0;
    //add stuff in empty spaces
    for (let row = 0; row < this.levelHeight; row++) {
      for (let col = 0; col < this.levelWidth; col++) {
        const tile = map.getTileAt(col, row);
        //space
        if (tile.index == 16) {
          const rand = Math.floor(Math.random() * 100);

          //add fire
          if (rand < 3) {
            const fire = this.physics.add
              .sprite(
                mapOrigin.x + tile.pixelX + this.TILE_HALF_WIDTH,
                mapOrigin.y + tile.pixelY + this.TILE_HALF_WIDTH,
                "fire",
              )
              .play("burn");

            this.fires.push(fire);
            continue;
          }

          //add bean
          if (rand < 5) {
            this.beans.push(
              this.physics.add.sprite(
                mapOrigin.x + tile.pixelX + 16,
                mapOrigin.y + tile.pixelY + 16,
                "bean",
              ),
            );
            beansAdded++;
            continue;
          }
        }
      }
    }
    //HACK: to upper limit
  }

  removeOldBeans() {}

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

    if (this.keyQ.isDown) {
      this.setGameText("q");
      this.cameras.main.zoom -= 0.1;
    }
    if (this.keyE.isDown) {
      this.setGameText("e");
      this.cameras.main.zoom += 0.1;
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
      this.manInBean,
      null,
      this,
    );

    // man hits fire
    this.physics.world.overlap(
      this.man,
      this.fires,
      this.manInFire,
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
    }

    //if needed, make more tiles above
    const currentTopY = this.topMap.tileToWorldXY(0, 0).y;
    if (this.man.y < currentTopY + this.TILE_WIDTH * 4) {
      console.log(`generating next layer... topmap : ${currentTopY}`);
      const newTilesY = currentTopY - this.levelHeight * this.TILE_WIDTH;

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
      this.setGameText("new layer...");

      //add/remove beans
      this.addBeansAndFire(this.topMap, 5);
      this.removeOldBeans();

      //y will goof at -infinity
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
    if (!this.man.visible) return false;

    return this.man.body.velocity.x != 0 || this.man.body.velocity.y != 0;
  }

  private manInBean(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    bean: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    bean.destroy();

    this.numBeansCollected++;

    this.setGameText(
      `mmm coffee beans...\nconsumed ${this.numBeansCollected} coffee beans`,
    );
  }

  private manInFire(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    fire: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    man.destroy();

    this.setGameText(`You have died in an office fire.`);
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
