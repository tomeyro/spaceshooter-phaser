/// <reference path="../libs/phaser.d.ts" />

var scaleRatio: number = 1;
var debug = false;

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

  player: PlayerShip;

  enemies: Phaser.Group;
  lastEnemy: number;

  input: any = {
    cursors: {},
    actions: {}
  };

  preload() {
    this.game.load.image('player', '../res/player.png');
    this.game.load.image('enemy', '../res/enemy.png');
    this.game.load.image('bullet', '../res/bullet.png');

    this.game.load.audio('explosion', '../res/explosion.mp3');
    this.game.load.audio('laser', '../res/laser.mp3');
  }

  create() {
    // Maintain aspect ratio
    // this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    // this.game.input.onDown.add(SimpleGame.prototype.fullscreen, this);

    //  Enable p2 physics
    this.game.physics.startSystem(Phaser.Physics.P2JS);
    //  Turn on impact events for the world, without this we get no collision callbacks
    this.game.physics.p2.setImpactEvents(true);

    // Create sprites
    let playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.player = new PlayerShip(this.game, {x: this.game.world.centerX, y: this.game.world.height - (48 * scaleRatio)}, playerCollisionGroup);

    let enemyCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.enemies = this.game.add.group();
    for (let i = 0; i < 40; i++) {
      var enemy = new EnemyShip(this.game, {x: -48 * scaleRatio, y: - 48 * scaleRatio}, enemyCollisionGroup);
      enemy.collides([this.player.weapon.getCollisionGroup(), playerCollisionGroup]);
      enemy.sprite.kill();
      this.enemies.add(enemy.sprite);
    }
    this.lastEnemy = 0;

    // Collisions
    this.player.addFireTarget([enemyCollisionGroup], SimpleGame.prototype.destroyOnCollision, this);
    this.player.collides([enemyCollisionGroup], SimpleGame.prototype.destroyOnCollision, this);

    //  Game input
    this.input.cursors = this.game.input.keyboard.createCursorKeys();
    this.input.actions = this.game.input.keyboard.addKeys({
      'fire': Phaser.Keyboard.Z
    });
  }

  update() {
    // Create enemies
    if (this.game.time.now - this.lastEnemy > 1000) {
      let enemy = <Phaser.Sprite> this.enemies.getFirstDead();
      if (enemy) {
        let x = this.game.world.width * Math.random();
        if (x <= enemy.width / 2) {
          x = (enemy.width / 2) + (enemy.width / 4);
        } else if (x >= this.game.world.width - (enemy.width / 2)) {
          x = this.game.world.width - (enemy.width / 2) - (enemy.width / 4);
        }
        enemy.reset(x, -enemy.height / 2);
        enemy.body.velocity.y = (400 - (200 * Math.random())) * scaleRatio;
        this.lastEnemy = this.game.time.now;
      }
    }
    this.enemies.forEachAlive((enemy: Phaser.Sprite) => {
      if (enemy.alive && (enemy.y > (this.game.world.height + enemy.height) || enemy.x < enemy.width / 2 || enemy.x > this.game.world.width - (enemy.width / 2))) {
        enemy.alive = false;
      }
    }, this);

    if (this.player.sprite.alive) {
      // Movement
      if (this.input.cursors.left.isDown) {
        this.player.sprite.body.velocity.x = -(400 * scaleRatio);
      } else if (this.input.cursors.right.isDown) {
        this.player.sprite.body.velocity.x = (400 * scaleRatio);
      } else {
        this.player.sprite.body.velocity.x = 0;
      }
      if (this.input.cursors.up.isDown) {
        this.player.sprite.body.velocity.y = -(400 * scaleRatio);
      } else if (this.input.cursors.down.isDown) {
        this.player.sprite.body.velocity.y = (400 * scaleRatio);
      } else {
        this.player.sprite.body.velocity.y = 0;
      }

      // Fire
      if (this.input.actions.fire.isDown) {
        this.player.weapon.fire();
      }
    }
  }

  destroyOnCollision(obj1: Phaser.Physics.P2.Body, obj2: Phaser.Physics.P2.Body) {
    if (obj1.sprite && obj1.sprite.alive) {
      obj1.sprite.kill();
    }
    if (obj2.sprite && obj2.sprite.alive) {
      obj2.sprite.kill();
    }
  }

  // fullscreen() {
  //   if (this.game.scale.isFullScreen) {
  //       this.game.scale.stopFullScreen();
  //   } else {
  //       this.game.scale.startFullScreen(false);
  //   }
  // }
}

// Extend from Sprite
class Ship {
  sprite: Phaser.Sprite;
  emitter: Phaser.Particles.Arcade.Emitter;

  weapon: Weapon;

  constructor(private game: Phaser.Game, position: {x: number, y: number}, private collisionGroup?: Phaser.Physics.P2.CollisionGroup) {
    this.sprite = this.game.add.sprite(position.x, position.y, this.getSpriteKey());
    this.sprite.anchor.setTo(0.5, 0.5);
    this.sprite.scale.setTo(scaleRatio, scaleRatio);

    this.game.physics.p2.enable([
      this.sprite
    ], debug);
    
    this.sprite.body.clearShapes();
    this.sprite.body.addPolygon({}, this.getBodyPolygon());
    this.sprite.body.x = this.sprite.x;
    this.sprite.body.y = this.sprite.y;
    this.sprite.body.fixedRotation = true;

    if (!this.collisionGroup) {
      this.collisionGroup = this.game.physics.p2.createCollisionGroup();
    }
    this.sprite.body.setCollisionGroup(this.collisionGroup);

    this.weapon = new Weapon(this.game, this);

    this.initParticleEmitter();
    this.sprite.events.onKilled.add(Ship.prototype.explode, this);
  }

  initParticleEmitter() {
    this.emitter = this.game.add.emitter(0, 0, 20);
    this.emitter.makeParticles(this.getSpriteKey());
    this.emitter.particleAnchor.setTo(0.5, 0.5);
    this.emitter.setAlpha(1, 0.1, 2000);
    this.emitter.setScale(scaleRatio / 2, scaleRatio / 4, scaleRatio / 2, scaleRatio / 4, 2000);
  }

  explode() {
    this.emitter.x = this.sprite.x;
    this.emitter.y = this.sprite.y;
    this.emitter.start(true, 2000, null, 10);
    this.game.sound.play("explosion");
    if (this.sprite && this.sprite.alive)
      this.sprite.kill();
  }

  collides(group: Phaser.Physics.P2.CollisionGroup | Phaser.Physics.P2.CollisionGroup[], callback?: Function, callbackContext?: any) {
    this.sprite.body.collides(group, callback, callbackContext);
  }

  addFireTarget(group: Phaser.Physics.P2.CollisionGroup | Phaser.Physics.P2.CollisionGroup[], callback?: Function, callbackContext?: any) {
    this.weapon.collides(group, callback, callbackContext);
  }

  getSpriteKey() : string {
    return "";
  }

  getBodyPolygon() : number[][] {
    return [];
  }
}
class EnemyShip extends Ship {
  getSpriteKey() : string {
    return "enemy";
  }

  getBodyPolygon() : number[][] {
    return [[0, 0], [this.sprite.width, 0], [this.sprite.width / 2, this.sprite.height]];
  }
}
class PlayerShip extends Ship {
  getSpriteKey() : string {
    return "player";
  }

  getBodyPolygon() : number[][] {
    return [[0, this.sprite.height], [this.sprite.width, this.sprite.height], [this.sprite.width / 2, 0]];
  }
}

class Weapon {
  bulletTime: number;
  bullets: Phaser.Group;
  collisionGroup: Phaser.Physics.P2.CollisionGroup;

  constructor(private game: Phaser.Game, private owner: Ship) {
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
    }
  }

  fire() {
    if (this.owner.sprite && this.owner.sprite.alive && (!this.bulletTime || this.game.time.now > this.bulletTime)) {
      let bullet: Phaser.Sprite = this.bullets.getFirstExists(false);
      if (bullet) {
        bullet.reset(this.owner.sprite.body.x, this.owner.sprite.body.y);
        bullet.body.velocity.y = -550 * scaleRatio;
        bullet.lifespan = ((this.owner.sprite.y / Math.abs(bullet.body.velocity.y)) * 1000) + 500;
        this.bulletTime = this.game.time.now + 250;
        this.game.sound.play("laser");
      }
    }
  }

  collides(group: Phaser.Physics.P2.CollisionGroup | Phaser.Physics.P2.CollisionGroup[], callback?: Function, callbackContext?: any) {
    for (let k in this.bullets.children) {
      (<Phaser.Sprite> this.bullets.children[k]).body.collides(group, callback, callbackContext);
    }
  }

  getCollisionGroup() {
    return this.collisionGroup;
  }
}

window.onload = () => {
  var game = new SimpleGame();
};
