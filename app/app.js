var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../libs/phaser.d.ts" />
var scaleRatio = 1;
var debug = false;
var SimpleGame = (function () {
    function SimpleGame() {
        this.input = {
            cursors: {},
            actions: {}
        };
        var windowSize = { width: 480, height: 800 };
        var scaleX = (window.innerWidth / windowSize.width) * window.devicePixelRatio;
        var scaleY = (window.innerHeight / windowSize.height) * window.devicePixelRatio;
        scaleRatio = (scaleY < scaleX) ? scaleY : scaleX;
        this.game = new Phaser.Game(windowSize.width * scaleRatio, windowSize.height * scaleRatio, Phaser.AUTO, 'content', {
            preload: this.preload,
            create: this.create,
            update: this.update
        });
    }
    SimpleGame.prototype.preload = function () {
        this.game.load.image('player', '../res/player.png');
        this.game.load.image('enemy', '../res/enemy.png');
        this.game.load.image('bullet', '../res/bullet.png');
        this.game.load.audio('explosion', '../res/explosion.mp3');
        this.game.load.audio('laser', '../res/laser.mp3');
    };
    SimpleGame.prototype.create = function () {
        // Maintain aspect ratio
        // this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        // this.game.input.onDown.add(SimpleGame.prototype.fullscreen, this);
        //  Enable p2 physics
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        //  Turn on impact events for the world, without this we get no collision callbacks
        this.game.physics.p2.setImpactEvents(true);
        // Create sprites
        var playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.player = new PlayerShip(this.game, { x: this.game.world.centerX, y: this.game.world.height - (48 * scaleRatio) }, playerCollisionGroup);
        var enemyCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.enemies = this.game.add.group();
        for (var i = 0; i < 40; i++) {
            var enemy = new EnemyShip(this.game, { x: -48 * scaleRatio, y: -48 * scaleRatio }, enemyCollisionGroup);
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
    };
    SimpleGame.prototype.update = function () {
        var _this = this;
        // Create enemies
        if (this.game.time.now - this.lastEnemy > 1000) {
            var enemy = this.enemies.getFirstDead();
            if (enemy) {
                var x = this.game.world.width * Math.random();
                if (x <= enemy.width / 2) {
                    x = (enemy.width / 2) + (enemy.width / 4);
                }
                else if (x >= this.game.world.width - (enemy.width / 2)) {
                    x = this.game.world.width - (enemy.width / 2) - (enemy.width / 4);
                }
                enemy.reset(x, -enemy.height / 2);
                enemy.body.velocity.y = (400 - (200 * Math.random())) * scaleRatio;
                this.lastEnemy = this.game.time.now;
            }
        }
        this.enemies.forEachAlive(function (enemy) {
            if (enemy.alive && (enemy.y > (_this.game.world.height + enemy.height) || enemy.x < enemy.width / 2 || enemy.x > _this.game.world.width - (enemy.width / 2))) {
                enemy.alive = false;
            }
        }, this);
        if (this.player.sprite.alive) {
            // Movement
            if (this.input.cursors.left.isDown) {
                this.player.sprite.body.velocity.x = -(400 * scaleRatio);
            }
            else if (this.input.cursors.right.isDown) {
                this.player.sprite.body.velocity.x = (400 * scaleRatio);
            }
            else {
                this.player.sprite.body.velocity.x = 0;
            }
            if (this.input.cursors.up.isDown) {
                this.player.sprite.body.velocity.y = -(400 * scaleRatio);
            }
            else if (this.input.cursors.down.isDown) {
                this.player.sprite.body.velocity.y = (400 * scaleRatio);
            }
            else {
                this.player.sprite.body.velocity.y = 0;
            }
            // Fire
            if (this.input.actions.fire.isDown) {
                this.player.weapon.fire();
            }
        }
    };
    SimpleGame.prototype.destroyOnCollision = function (obj1, obj2) {
        if (obj1.sprite && obj1.sprite.alive) {
            obj1.sprite.kill();
        }
        if (obj2.sprite && obj2.sprite.alive) {
            obj2.sprite.kill();
        }
    };
    return SimpleGame;
}());
// Extend from Sprite
var Ship = (function () {
    function Ship(game, position, collisionGroup) {
        this.game = game;
        this.collisionGroup = collisionGroup;
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
    Ship.prototype.initParticleEmitter = function () {
        this.emitter = this.game.add.emitter(0, 0, 20);
        this.emitter.makeParticles(this.getSpriteKey());
        this.emitter.particleAnchor.setTo(0.5, 0.5);
        this.emitter.setAlpha(1, 0.1, 2000);
        this.emitter.setScale(scaleRatio / 2, scaleRatio / 4, scaleRatio / 2, scaleRatio / 4, 2000);
    };
    Ship.prototype.explode = function () {
        this.emitter.x = this.sprite.x;
        this.emitter.y = this.sprite.y;
        this.emitter.start(true, 2000, null, 10);
        this.game.sound.play("explosion");
        if (this.sprite && this.sprite.alive)
            this.sprite.kill();
    };
    Ship.prototype.collides = function (group, callback, callbackContext) {
        this.sprite.body.collides(group, callback, callbackContext);
    };
    Ship.prototype.addFireTarget = function (group, callback, callbackContext) {
        this.weapon.collides(group, callback, callbackContext);
    };
    Ship.prototype.getSpriteKey = function () {
        return "";
    };
    Ship.prototype.getBodyPolygon = function () {
        return [];
    };
    return Ship;
}());
var EnemyShip = (function (_super) {
    __extends(EnemyShip, _super);
    function EnemyShip() {
        _super.apply(this, arguments);
    }
    EnemyShip.prototype.getSpriteKey = function () {
        return "enemy";
    };
    EnemyShip.prototype.getBodyPolygon = function () {
        return [[0, 0], [this.sprite.width, 0], [this.sprite.width / 2, this.sprite.height]];
    };
    return EnemyShip;
}(Ship));
var PlayerShip = (function (_super) {
    __extends(PlayerShip, _super);
    function PlayerShip() {
        _super.apply(this, arguments);
    }
    PlayerShip.prototype.getSpriteKey = function () {
        return "player";
    };
    PlayerShip.prototype.getBodyPolygon = function () {
        return [[0, this.sprite.height], [this.sprite.width, this.sprite.height], [this.sprite.width / 2, 0]];
    };
    return PlayerShip;
}(Ship));
var Weapon = (function () {
    function Weapon(game, owner) {
        this.game = game;
        this.owner = owner;
        this.bulletTime = 0;
        this.collisionGroup = this.game.physics.p2.createCollisionGroup();
        this.bullets = this.game.add.group();
        for (var i = 0; i < 40; i++) {
            var bullet = this.bullets.create(0, 0, 'bullet', 1, false);
            bullet.anchor.setTo(0.5, 0.5);
            bullet.scale.setTo(scaleRatio, scaleRatio);
            this.game.physics.p2.enable([
                bullet
            ], debug);
            bullet.body.clearShapes();
            bullet.body.addPolygon({}, [[0, bullet.height], [bullet.width, bullet.height], [bullet.width / 2, 0]]);
            bullet.body.fixedRotation = true;
            bullet.body.setCollisionGroup(this.collisionGroup);
        }
    }
    Weapon.prototype.fire = function () {
        if (this.owner.sprite && this.owner.sprite.alive && (!this.bulletTime || this.game.time.now > this.bulletTime)) {
            var bullet = this.bullets.getFirstExists(false);
            if (bullet) {
                bullet.reset(this.owner.sprite.body.x, this.owner.sprite.body.y);
                bullet.body.velocity.y = -550 * scaleRatio;
                bullet.lifespan = ((this.owner.sprite.y / Math.abs(bullet.body.velocity.y)) * 1000) + 500;
                this.bulletTime = this.game.time.now + 250;
                this.game.sound.play("laser");
            }
        }
    };
    Weapon.prototype.collides = function (group, callback, callbackContext) {
        for (var k in this.bullets.children) {
            this.bullets.children[k].body.collides(group, callback, callbackContext);
        }
    };
    Weapon.prototype.getCollisionGroup = function () {
        return this.collisionGroup;
    };
    return Weapon;
}());
window.onload = function () {
    var game = new SimpleGame();
};
