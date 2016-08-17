/// <reference path="../libs/phaser.d.ts" />
var scaleRatio = 1;
var SimpleGame = (function () {
    function SimpleGame() {
        this.bulletTime = 0;
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
            update: this.update,
            render: this.render
        });
    }
    SimpleGame.prototype.preload = function () {
        this.game.load.image('logo', '../res/logo.png');
        this.game.load.image('player', '../res/player.png');
        this.game.load.image('enemy', '../res/enemy.png');
        this.game.load.image('bullet', '../res/bullet.png');
        //  Load our physics data exported from PhysicsEditor
        this.game.load.physics('bodies', '../res/bodies.json');
    };
    SimpleGame.prototype.create = function () {
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
        this.enemy = this.game.add.sprite(this.game.world.centerX, (48 * scaleRatio), 'enemy');
        this.enemy.anchor.setTo(0.5, 0.5);
        this.enemy.scale.setTo(scaleRatio, scaleRatio);
        this.game.physics.p2.enable([
            this.player,
            this.enemy
        ], true);
        var playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.player.body.clearShapes();
        this.player.body.addPolygon({}, [[0, this.player.height], [this.player.width, this.player.height], [this.player.width / 2, 0]]);
        this.player.body.fixedRotation = true;
        this.player.body.setCollisionGroup(playerCollisionGroup);
        var enemyCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.enemy.body.clearShapes();
        this.enemy.body.addPolygon({}, [[0, 0], [this.enemy.width, 0], [this.enemy.width / 2, this.enemy.height]]);
        this.enemy.body.velocity.y = 200;
        this.enemy.body.fixedRotation = true;
        this.enemy.body.setCollisionGroup(enemyCollisionGroup);
        //  Our players bullets
        var bulletsCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.bullets = this.game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.P2JS;
        for (var i = 0; i < 40; i++) {
            var bullet = this.bullets.create(0, 0, 'bullet', 1, false);
            bullet.anchor.setTo(0.5, 0.5);
            bullet.scale.setTo(scaleRatio, scaleRatio);
            this.game.physics.p2.enable([
                bullet
            ], true);
            bullet.body.clearShapes();
            bullet.body.addPolygon({}, [[0, bullet.height], [bullet.width, bullet.height], [bullet.width / 2, 0]]);
            bullet.body.fixedRotation = true;
            bullet.body.setCollisionGroup(bulletsCollisionGroup);
        }
        // Collisions
        this.enemy.body.collides([playerCollisionGroup], SimpleGame.prototype.destroyEnemy, this);
        this.player.body.collides([enemyCollisionGroup], SimpleGame.prototype.destroyEnemy, this);
        //  Game input
        this.input.cursors = this.game.input.keyboard.createCursorKeys();
        this.input.actions = this.game.input.keyboard.addKeys({
            'space': Phaser.Keyboard.SPACEBAR
        });
    };
    SimpleGame.prototype.fullscreen = function () {
        if (this.game.scale.isFullScreen) {
            this.game.scale.stopFullScreen();
        }
        else {
            this.game.scale.startFullScreen(false);
        }
    };
    SimpleGame.prototype.update = function () {
        // Collissions
        // this.game.physics.p2.collide(this.player, this.enemy);
        // this.game.physics.arcade.collide(this.enemy, this.bullets, SimpleGame.prototype.destroyEnemy, null, this);
        // Movement
        if (this.input.cursors.left.isDown) {
            this.player.body.velocity.x = -200;
        }
        else if (this.input.cursors.right.isDown) {
            this.player.body.velocity.x = 200;
        }
        else {
            this.player.body.velocity.x = 0;
        }
        if (this.input.cursors.up.isDown) {
            this.player.body.velocity.y = -200;
        }
        else if (this.input.cursors.down.isDown) {
            this.player.body.velocity.y = 200;
        }
        else {
            this.player.body.velocity.y = 0;
        }
        // Fire
        if (this.input.actions.space.isDown) {
            SimpleGame.prototype.fire.apply(this);
        }
    };
    SimpleGame.prototype.destroyEnemy = function (enemy, other) {
        console.log('kabooooom!');
        enemy.sprite.destroy();
        other.sprite.destroy();
    };
    SimpleGame.prototype.fire = function () {
        if (!this.bulletTime || this.game.time.now > this.bulletTime) {
            var bullet = this.bullets.getFirstExists(false);
            if (bullet) {
                bullet.reset(this.player.body.x + (24 * scaleRatio), this.player.body.y - (12 * scaleRatio));
                bullet.lifespan = 2500;
                bullet.body.velocity.y = -400;
                this.bulletTime = this.game.time.now + 100;
            }
        }
    };
    SimpleGame.prototype.render = function () {
        // this.game.debug.body(this.player);
        // this.game.debug.body(this.enemy);
        // this.game.debug.body(this.bullets);
    };
    return SimpleGame;
}());
window.onload = function () {
    var game = new SimpleGame();
};
