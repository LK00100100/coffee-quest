import GameScene from "../GameScene";

/**
 * Handles collisions between entities for GameScene
 */
export default class ColliderHandler {
  game: GameScene;

  constructor(game: GameScene) {
    this.game = game;
  }

  public handleCollision() {
    // Collide man against the tilemap layer
    this.game.physics.collide(
      this.game.man,
      this.game.mapA.layer.tilemapLayer,
      this.collideManInTile.bind(this),
    );

    this.game.physics.collide(
      this.game.man,
      this.game.mapB.layer.tilemapLayer,
      this.collideManInTile.bind(this),
    );

    // man hits guard
    this.game.physics.world.overlap(
      this.game.man,
      this.game.guards,
      this.collideManInGuard.bind(this),
      null,
      this,
    );

    // man hits screw
    this.game.physics.world.overlap(
      this.game.man,
      this.game.screws,
      this.collideManInScrew.bind(this),
      null,
      this,
    );

    // man hits pizza
    this.game.physics.world.overlap(
      this.game.man,
      this.game.pizzas,
      this.collideManInPizza.bind(this),
      null,
      this,
    );

    // man hits fire
    this.game.physics.world.overlap(
      this.game.man,
      this.game.fires,
      this.collideManInFire.bind(this),
      null,
      this,
    );

    //guard hits tiles
    this.game.physics.collide(
      this.game.guards,
      this.game.mapA.layer.tilemapLayer,
      this.collideGuardInTile.bind(this),
    );

    this.game.physics.collide(
      this.game.guards,
      this.game.mapB.layer.tilemapLayer,
      this.collideGuardInTile.bind(this),
    );

    //guard hits guard
    this.game.physics.world.overlap(
      this.game.guards,
      this.game.guards,
      this.collideGuardInGuard.bind(this),
      null,
      this,
    );

    //guard hits fire
    this.game.physics.world.overlap(
      this.game.guards,
      this.game.fires,
      this.collideGuardInFire.bind(this),
      null,
      this,
    );

    //guard hits rat
    this.game.physics.world.overlap(
      this.game.guards,
      this.game.rats,
      this.collideGuardInRat.bind(this),
      null,
      this,
    );
  }

  private collideManInGuard(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    guard: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    man.destroy();

    this.game.setGameText(`The guard has taken your soul.`);
  }

  private collideManInScrew(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    screw: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    screw.destroy();

    this.game.numScrewsCollected++;
    this.game.doUpdateUi = true;

    this.game.setGameText(
      `mmm screws...\ncollected ${this.game.numScrewsCollected} screws`,
    );
  }

  private collideManInPizza(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    pizza: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    pizza.destroy();

    this.game.manNumPizzas++;
    this.game.doUpdateUi = true;

    this.game.setGameText(`mmm bougie $15 Big City personal pizza...`);
  }

  private collideManInFire(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    fire: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    man.destroy();

    this.game.setGameText(`You have died in an office fire.`);
  }

  private collideGuardInFire(
    guard: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    fire: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  ) {
    guard.destroy();
  }

  private collideGuardInRat(
    guard: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    rat: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  ) {
    this.flipGuardDirection(guard);
  }

  collideManInTile(
    man: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    tile: Phaser.Tilemaps.Tile,
  ) {
    console.log(`collide tile: ${tile.x},${tile.y} = ${tile.index}`);
  }

  private collideGuardInTile(
    guard: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    tile: Phaser.Tilemaps.Tile,
  ) {
    this.flipGuardDirection(guard);
  }

  private collideGuardInGuard(
    guard1: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    guard2: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  ) {
    //only set guard1 (it's enough)
    this.flipGuardDirection(guard1);
  }

  /**
   * Flip guard horizontally
   * @param guard -
   */
  flipGuardDirection(guard: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    const oldVelocity = guard.getData("velocity"); //velocity is set to 0 on collision
    guard.setVelocityX(-oldVelocity);
    guard.flipX = -oldVelocity < 0 ? true : false; //face left : face right
    guard.setData("velocity", -oldVelocity);
  }
}
