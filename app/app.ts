/// <reference path="../libs/phaser.d.ts" />

var scaleRatio: number = 1;
var debug = true;

class SimpleGame {
  constructor() {
    var windowSize = {width: 480, height: 800};
    let scaleX = (window.innerWidth / windowSize.width) * window.devicePixelRatio;
    let scaleY = (window.innerHeight / windowSize.height) * window.devicePixelRatio;
    scaleRatio = (scaleY < scaleX) ? scaleY : scaleX;
    this.game = new Phaser.Game(windowSize.width*scaleRatio, windowSize.height*scaleRatio, Phaser.AUTO, 'content', {
      preload: this.preload,
      create: this.create,
      update: this.update
    });
  }

  game: Phaser.Game;
  player: Phaser.Sprite;
  enemy: Phaser.Sprite;

  weapon: Weapon;
  bullets: Phaser.Group;
  bulletTime: number = 0;

  input: any = {
    cursors: {},
    actions: {}
  };

  preload() {
    this.game.load.image('logo', '../res/logo.png');
    this.game.load.image('player', '../res/player.png');
    this.game.load.image('enemy', '../res/enemy.png');
    this.game.load.image('bullet', '../res/bullet.png');
    //  Load our physics data exported from PhysicsEditor
    this.game.load.physics('bodies', '../res/bodies.json');
  }

  create() {
    // Maintain aspect ratio
    this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    // this.game.input.onDown.add(SimpleGame.prototype.fullscreen, this);

    //  Enable p2 physics
    this.game.physics.startSystem(Phaser.Physics.P2JS);
    //  Turn on impact events for the world, without this we get no collision callbacks
    this.game.physics.p2.setImpactEvents(true);

    // Create sprites
    this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.height - (48 * scaleRatio), 'player');    
    this.player.anchor.setTo(0.5, 0.5);
    this.player.scale.setTo(scaleRatio, scaleRatio);

    this.enemy = this.game.add.sprite(this.game.world.centerX , (48 * scaleRatio), 'enemy');
    this.enemy.anchor.setTo(0.5, 0.5);
    this.enemy.scale.setTo(scaleRatio, scaleRatio);

    this.game.physics.p2.enable([
      this.player,
      this.enemy
    ], debug);

    let playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.player.body.clearShapes();
    this.player.body.addPolygon({}, [[0, this.player.height],[this.player.width, this.player.height],[this.player.width/2, 0]]);
    this.player.body.fixedRotation = true;
    this.player.body.setCollisionGroup(playerCollisionGroup);

    let enemyCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.enemy.body.clearShapes();
    this.enemy.body.addPolygon({}, [[0, 0],[this.enemy.width, 0],[this.enemy.width/2, this.enemy.height]]);
    this.enemy.body.velocity.y = 200;
    this.enemy.body.fixedRotation = true;
    this.enemy.body.setCollisionGroup(enemyCollisionGroup);

    // Weapon
    this.weapon = new Weapon(this.game, this.player, enemyCollisionGroup);

    // Collisions
    this.enemy.body.collides([playerCollisionGroup], SimpleGame.prototype.destroyPlayer, this);
    this.enemy.body.collides([this.weapon.getCollisionGroup()]);
    this.player.body.collides([enemyCollisionGroup]);

    //  Game input
    this.input.cursors = this.game.input.keyboard.createCursorKeys();
    this.input.actions = this.game.input.keyboard.addKeys({
      'fire': Phaser.Keyboard.Z
    });
  }

  update() {
    // Movement
    if (this.player.alive) {
      if (this.input.cursors.left.isDown) {
        this.player.body.velocity.x = -200;
      } else if (this.input.cursors.right.isDown) {
        this.player.body.velocity.x = 200;
      } else {
        this.player.body.velocity.x = 0;
      }
      if (this.input.cursors.up.isDown) {
        this.player.body.velocity.y = -200;
      } else if (this.input.cursors.down.isDown) {
        this.player.body.velocity.y = 200;
      } else {
        this.player.body.velocity.y = 0;
      }

      // Fire
      if (this.input.actions.fire.isDown) {
        this.weapon.fire();
      }
    }
  }

  destroyPlayer(enemy: Phaser.Physics.P2.Body, other: Phaser.Physics.P2.Body) {
    console.log('kapoooow!');
    enemy.sprite.destroy();
    other.sprite.destroy();
  }

  // fullscreen() {
  //   if (this.game.scale.isFullScreen) {
  //       this.game.scale.stopFullScreen();
  //   } else {
  //       this.game.scale.startFullScreen(false);
  //   }
  // }
}

class Weapon {

  bulletTime: number;
  bullets: Phaser.Group;
  collisionGroup: Phaser.Physics.P2.CollisionGroup;

  constructor(private game: Phaser.Game, private sprite: Phaser.Sprite, private target: Phaser.Physics.P2.CollisionGroup) {
    this.bulletTime = 0;

    this.collisionGroup = this.game.physics.p2.createCollisionGroup();
    this.bullets = this.game.add.group();

    for (let i = 0; i < 40; i++) {
      let bullet: Phaser.Sprite = this.bullets.create(0, 0, 'bullet', 1, false);
      bullet.anchor.setTo(0.5, 0.5);
      bullet.scale.setTo(scaleRatio, scaleRatio);
      this.game.physics.p2.enable([
        bullet
      ], debug);
      bullet.body.clearShapes();
      bullet.body.addPolygon({}, [[0, bullet.height],[bullet.width, bullet.height],[bullet.width/2, 0]]);
      bullet.body.fixedRotation = true;
      bullet.body.setCollisionGroup(this.collisionGroup);
      bullet.body.collides([this.target], Weapon.prototype.destroyTarget, this);
    }
  }

  fire() {
    if (!this.bulletTime || this.game.time.now > this.bulletTime) {
      console.log('pew!');
      let bullet: Phaser.Sprite = this.bullets.getFirstExists(false);
      if (bullet) {
          bullet.reset(this.sprite.body.x, this.sprite.body.y);
          bullet.lifespan = 2500;
          bullet.body.velocity.y = -400;
          bullet.body.velocity.x = Math.random()*100 + (Math.random() > 0.5 ? 1 : -1);
          this.bulletTime = this.game.time.now + 100;
      }
    }
  }

  destroyTarget(bullet: Phaser.Physics.P2.Body, target: Phaser.Physics.P2.Body) {
    console.log('kabooooom!');
    bullet.sprite.destroy();
    target.sprite.destroy();
  }

  getCollisionGroup() {
    return this.collisionGroup;
  }
}

window.onload = () => {
  var game = new SimpleGame();
};
