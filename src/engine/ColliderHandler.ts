import GameScene from "../GameScene";

/**
 * Handles collisions between entities.
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
      this.collideManInTile,
    );

    // man hits guard
    this.game.physics.world.overlap(
      this.game.man,
      this.game.guards,
      this.collideManInGuard,
      null,
      this,
    );

    // man hits screw
    this.game.physics.world.overlap(
      this.game.man,
      this.game.screws,
      this.collideManInScrew,
      null,
      this,
    );

    // man hits fire
    this.game.physics.world.overlap(
      this.game.man,
      this.game.fires,
      this.collideManInFire,
      null,
      this,
    );

    //TODO: could use map array
    //guard hits tiles
    this.game.physics.collide(
      this.game.guards,
      this.game.mapA.layer.tilemapLayer,
      this.collideGuardInTile,
    );

    //guard hits guard
    this.game.physics.world.overlap(
      this.game.guards,
      this.game.guards,
      this.collideGuardInGuard,
      null,
      this,
    );

    //guard hits fire
    this.game.physics.world.overlap(
      this.game.guards,
      this.game.fires,
      this.collideGuardInFire,
      null,
      this,
    );

    //TODO: remove check
    if (this.game.mapB) {
      this.game.physics.collide(
        this.game.man,
        this.game.mapB.layer.tilemapLayer,
        this.collideManInTile,
      );

      this.game.physics.collide(
        this.game.guards,
        this.game.mapB.layer.tilemapLayer,
        this.collideGuardInTile,
      );
    }
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

    this.game.setGameText(
      `mmm screws...\ncollected ${this.game.numScrewsCollected} screws`,
    );
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
    const oldVelocity = guard.getData("velocity"); //velocity is set to 0 on collision
    guard.setVelocityX(-oldVelocity);

    guard.flipX = -oldVelocity < 0 ? true : false; //face left : face right

    guard.setData("velocity", -oldVelocity);
  }

  private collideGuardInGuard(
    guard1: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    guard2: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  ) {
    //only set guard1 (it's enough)
    const oldVelocity = guard1.getData("velocity"); //velocity is set to 0 on collision
    guard1.setVelocityX(-oldVelocity);

    guard1.flipX = -oldVelocity < 0 ? true : false; //face left : face right

    guard1.setData("velocity", -oldVelocity);
  }
}
