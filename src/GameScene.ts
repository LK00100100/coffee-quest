import * as Phaser from "phaser";
import ColliderHandler from "./engine/ColliderHandler";

export default class GameScene extends Phaser.Scene {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyR: Phaser.Input.Keyboard.Key;
  private keySpace: Phaser.Input.Keyboard.Key;
  private keyZ: Phaser.Input.Keyboard.Key;
  private keyX: Phaser.Input.Keyboard.Key;

  /**
   * ui elements
   */
  private gameText!: Phaser.GameObjects.Text; //any messages for the player to read.
  private uiNumScrewsText!: Phaser.GameObjects.Text;
  private uiNumPizzasText!: Phaser.GameObjects.Text;
  private uiScrewsSprite: Phaser.GameObjects.Sprite;
  private uiPizzasSprite: Phaser.GameObjects.Sprite;
  public doUpdateUi: boolean;

  //these are two maps that are placed one on top of the other. ad nauseam
  //we only go upwards
  public mapA: Phaser.Tilemaps.Tilemap;
  public mapB: Phaser.Tilemaps.Tilemap;
  private topMap: Phaser.Tilemaps.Tilemap;

  /**
   * man variables
   */
  public man: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  public isManInvincible: boolean;
  public manNumPizzas: number;
  public isDead: boolean;

  public pizzas: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
  public screws: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
  public fires: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
  public guards: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
  public rats: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;

  public numScrewsCollected: number;

  private readonly PLAYER_SPEED_DEFAULT = 400;

  private readonly IS_DEBUG_MODE = false;

  private readonly levelHeight: number = 30;
  private readonly levelWidth: number = 20;

  private readonly TILE_WIDTH = 32; //tile is square
  private readonly TILE_HALF_WIDTH = this.TILE_WIDTH / 2;

  private colliderHandler: ColliderHandler;
  constructor() {
    super("GameScene");

    this.colliderHandler = new ColliderHandler(this);
  }

  preload() {
    //level
    //this.load.tilemapCSV("map", "assets/tiles.csv");
    //image is adjusted so the borders don't bleed through
    this.load.image("tiles", "assets/tiles2.png");

    //people
    this.load.spritesheet("man", "assets/man-ss.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    //powerups
    this.load.image("pizza", "assets/pizza.png");
    this.load.image("screw", "assets/screw.png");

    //hostiles
    this.load.spritesheet("fire", "assets/fire-ss.png", {
      frameWidth: 30,
      frameHeight: 30,
    });

    this.load.spritesheet("guard", "assets/guard-ss.png", {
      frameWidth: 30,
      frameHeight: 30,
    });

    this.load.spritesheet("rat", "assets/rat-ss.png", {
      frameWidth: 30,
      frameHeight: 30,
    });

    //misc
    this.load.image("bean", "assets/bean.png");
  }

  create() {
    this.resetGame();
    /**
     * keyboard
     */
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.keySpace = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );

    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    /**
     * entities
     */

    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("man"),
      frameRate: 16,
      repeat: -1,
    });

    this.anims.create({
      key: "angry",
      frames: this.anims.generateFrameNumbers("guard"),
      frameRate: 16,
      repeat: -1,
    });

    this.anims.create({
      key: "move",
      frames: this.anims.generateFrameNumbers("rat"),
      frameRate: 16,
      repeat: -1,
    });

    this.anims.create({
      key: "burn",
      frames: this.anims.generateFrameNumbers("fire"),
      frameRate: 16,
      repeat: -1,
    });

    /**
     * ui elements
     */
    // prettier-ignore
    this.gameText = this.add
      .text((this.levelWidth * this.TILE_HALF_WIDTH) - 150, 130, "test text 3")
      .setDepth(100)
      .setScrollFactor(0);

    this.uiNumScrewsText = this.add
      .text(200, 650, "")
      .setDepth(100)
      .setScrollFactor(0);

    this.uiScrewsSprite = this.add
      .sprite(180, 650, "screw")
      .setDepth(100)
      .setScrollFactor(0);

    this.uiNumPizzasText = this.add
      .text(200, 630, "")
      .setDepth(100)
      .setScrollFactor(0);

    this.uiPizzasSprite = this.add
      .sprite(180, 630, "pizza")
      .setDepth(100)
      .setScrollFactor(0);

    this.resetGame();
  }

  /**
   * Resets everything to the beginning.
   */
  resetGame() {
    this.destroyAllSprites();
    this.doUpdateUi = true;

    this.mapA = this.makeTiles(0, true);
    this.mapB = this.makeTiles(-10000, true); //init so we don't null check.
    this.topMap = this.mapA;

    /**
     * man / coder
     */
    this.numScrewsCollected = 0;
    this.manNumPizzas = 2;
    this.isManInvincible = false;
    this.isDead = false;

    this.man = this.physics.add.sprite(
      48,
      this.levelHeight * this.TILE_WIDTH -
        (this.TILE_WIDTH + this.TILE_HALF_WIDTH),
      "man",
    );
    this.man.setDepth(10);
    this.man.play("walk");

    /**
     * entities, powerups, and pickups
     */
    this.screws = [];
    this.pizzas = [];

    this.fires = [];
    this.guards = [];
    this.rats = [];

    /**
     * camera
     */
    //this.cameras.main.setBounds(0, 0, 400, 400);
    this.cameras.main.setZoom(1.4);

    // prettier-ignore
    this.cameras.main.centerOn(
      this.levelWidth * this.TILE_HALF_WIDTH, //go half way
      (this.levelHeight * this.TILE_WIDTH) + this.TILE_HALF_WIDTH,
    );
  }

  destroyAllSprites() {
    this.mapA?.destroy();
    this.mapB?.destroy();

    this.man?.destroy();

    this.screws?.forEach((s) => s.destroy());
    this.pizzas?.forEach((s) => s.destroy());

    this.fires?.forEach((s) => s.destroy());
    this.guards?.forEach((s) => s.destroy());
    this.rats?.forEach((s) => s.destroy());
  }

  /**
   *
   * @param topY drawing up starting here.
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

  /**
   *
   * @param topY
   * @param withFloor include a bottom floor or not
   * @startColumn the startColumn of the player. defaults to 0.
   * @returns
   */
  makeFeasibleTiles(
    topY: number = 0,
    withFloor: boolean = false,
    startColumn = 0,
  ): Phaser.Tilemaps.Tilemap {
    /**
     * make level
     */
    const mapData = [];
    for (let y = 0; y < this.levelHeight; y++) {
      const row = [];

      for (let x = 0; x < this.levelWidth; x++) {
        // 16 is space
        const tileIndex = 1;
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

    //do the wacky zigzag upward
    let currentColumn = startColumn;
    let currentRow = this.levelHeight - 1;

    let isGoVertical = true;

    while (currentRow != 0) {
      if (isGoVertical) {
      } else {
      }
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

  addStuffInMap(
    map: Phaser.Tilemaps.Tilemap,
    numScrews: number = 5,
    numFires: number = 10,
  ) {
    const mapOrigin = map.tileToWorldXY(0, 0);

    let screwsAdded = 0;
    let firesAdded = 0;

    //add stuff in empty spaces
    for (let row = 0; row < this.levelHeight; row++) {
      for (let col = 0; col < this.levelWidth; col++) {
        const tile = map.getTileAt(col, row);
        //space
        if (tile.index == 16) {
          //TODO: move utils
          const rand = Math.floor(Math.random() * 100); //0 - 99

          //add rat
          if (rand <= 0) {
            const rat = this.physics.add
              .sprite(
                mapOrigin.x + tile.pixelX + this.TILE_HALF_WIDTH,
                mapOrigin.y + tile.pixelY + this.TILE_HALF_WIDTH,
                "rat",
              )
              .play("move");

            this.rats.push(rat);
            continue;
          }

          //add angry guard
          if (rand <= 1) {
            const guard = this.physics.add
              .sprite(
                mapOrigin.x + tile.pixelX + this.TILE_HALF_WIDTH,
                mapOrigin.y + tile.pixelY + this.TILE_HALF_WIDTH,
                "guard",
              )
              .play("angry");

            const randDirection = Math.floor(Math.random() * 2);
            const velocity = randDirection == 0 ? -80 : 80;

            guard.setVelocityX(velocity);
            guard.setData("velocity", velocity);
            guard.flipX = velocity < 0 ? true : false; //face left : face right

            this.guards.push(guard);
            continue;
          }

          //add pizza
          if (rand < 3) {
            this.pizzas.push(
              this.physics.add.sprite(
                mapOrigin.x + tile.pixelX + 16,
                mapOrigin.y + tile.pixelY + 16,
                "pizza",
              ),
            );
            continue;
          }

          //add fire
          if (firesAdded < numFires && rand < 4) {
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

          //add screw
          if (screwsAdded < numScrews && rand < 5) {
            this.screws.push(
              this.physics.add.sprite(
                mapOrigin.x + tile.pixelX + 16,
                mapOrigin.y + tile.pixelY + 16,
                "screw",
              ),
            );
            screwsAdded++;
            continue;
          }
        }
      }
    }
    //HACK: to upper limit
  }

  removeOldScrews() {}

  toggleManInvincibility(toggle: boolean) {
    if (toggle) {
      this.man.setTint(0xd2042d);
      this.isManInvincible = true;
      return;
    }

    this.isManInvincible = false;
    this.man.clearTint();
  }

  manEatPizza() {
    if (this.isDead) {
      return;
    }

    if (this.isManInvincible) {
      this.setGameText("you are still full");
      return;
    }

    if (this.manNumPizzas == 0) {
      return;
    }

    this.manNumPizzas--; //note: could make method and link this to doUpdateUi

    this.toggleManInvincibility(true);

    this.setGameText("you have eaten bougie $15 pizza and feel unstoppable");

    this.doUpdateUi = true;
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.manEatPizza();
    }

    //player controls
    if (this.isManReadyToMove()) {
      //fix rounding errors, or you'll collide in thin hallways
      this.man.x = Math.round(this.man.x);
      this.man.y = Math.round(this.man.y);

      if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
        this.man.setVelocityX(0);
        this.man.setVelocityY(-this.PLAYER_SPEED_DEFAULT);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
        this.man.setVelocityX(-this.PLAYER_SPEED_DEFAULT);
        this.man.setVelocityY(0);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
        this.man.setVelocityX(0);
        this.man.setVelocityY(this.PLAYER_SPEED_DEFAULT);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
        this.man.setVelocityX(this.PLAYER_SPEED_DEFAULT);
        this.man.setVelocityY(0);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.resetGame();
    }

    if (this.keyZ.isDown) {
      this.cameras.main.zoom -= 0.1;
    }
    if (this.keyX.isDown) {
      this.cameras.main.zoom += 0.1;
    }

    //move camera up with man
    const manCanvasY = this.getRelativePositionToCanvas(
      this.man,
      this.cameras.main,
    );

    if (manCanvasY.y <= 500) {
      this.cameras.main.scrollY = this.man.y - 470; //working jank code
    }

    this.colliderHandler.handleCollision();

    //if needed, make more tiles above
    const currentTopY = this.topMap.tileToWorldXY(0, 0).y;
    if (this.man.y < currentTopY + this.TILE_WIDTH * 20) {
      console.log(`generating next ... topmap : ${currentTopY}`);
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
      this.setGameText("Another floor...");

      //add stuff
      this.addStuffInMap(this.topMap, 5);
      this.removeOldScrews();

      //y will goof at -infinity
    }
    /**
     *  ui stuff
     */
    if (this.doUpdateUi) {
      this.doUpdateUi = false;
      this.uiNumPizzasText.setText(`${this.manNumPizzas}`);
      this.uiNumScrewsText.setText(`${this.numScrewsCollected}`);
    }
  }

  /**
   * Set game message for display.
   * @param newText
   */
  setGameText(newText: string) {
    this.gameText.text = newText;
  }

  /**
   * Kill the man (and sprite)
   */
  killMan() {
    this.man.destroy();
    this.isDead = true;
  }

  /**
   * Visualize the colliding tiles
   */
  private showCollision(map: Phaser.Tilemaps.Tilemap) {
    const debugGraphics = this.add.graphics();
    map.renderDebug(debugGraphics);
  }

  private isManReadyToMove(): boolean {
    if (!this.man.visible) {
      return false;
    }

    return this.man.body.velocity.x == 0 && this.man.body.velocity.y == 0;
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
