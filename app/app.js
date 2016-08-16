var scaleRatio = 1;
var SimpleGame = (function () {
    function SimpleGame() {
        this.bulletTime = 0;
        this.input = {
            cursors: {},
            actions: {}
        };
        var windowSize = { width: 480, height: 800 };
        this.game = new Phaser.Game(windowSize.width, windowSize.height, Phaser.AUTO, 'content', {
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
        this.game.input.onDown.add(SimpleGame.prototype.fullscreen, this);
        //  Enable p2 physics
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        // Create sprites
        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.height - (48 * scaleRatio), 'player');
        this.player.anchor.setTo(0.5, 0.5);
        this.enemy = this.game.add.sprite(this.game.world.centerX, (48 * scaleRatio), 'enemy');
        this.enemy.anchor.setTo(0.5, 0.5);
        this.game.physics.p2.enable([
            this.player,
            this.enemy
        ], true);
        this.player.body.clearShapes();
        this.player.body.loadPolygon('bodies', 'player');
        this.enemy.body.clearShapes();
        this.enemy.body.loadPolygon('bodies', 'enemy');
        this.enemy.body.velocity.y = 200;
        //  Our players bullets
        this.bullets = this.game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.P2JS;
        //  All 40 of them
        this.bullets.createMultiple(40, 'bullet');
        this.bullets.setAll('anchor.x', 0.5);
        this.bullets.setAll('anchor.y', 0.5);
        //  Game input
        this.input.cursors = this.game.input.keyboard.createCursorKeys();
        this.input.actions = this.game.input.keyboard.addKeys({
            'space': Phaser.Keyboard.SPACEBAR
        });
    };
    SimpleGame.prototype.fullscreen = function () {
        // if (this.game.scale.isFullScreen) {
        //     this.game.scale.stopFullScreen();
        // } else {
        //     this.game.scale.startFullScreen(false);
        // }
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
        // Fire
        // if (this.input.actions.space.isDown) {
        //   console.log(this.input.actions.space);
        //   console.log('espacio', this.bulletTime);
        //   SimpleGame.prototype.fire.apply(this);
        // }
    };
    SimpleGame.prototype.destroyEnemy = function (enemy, bullet) {
        console.log('kabooooom!');
        enemy.destroy();
        bullet.destroy();
    };
    SimpleGame.prototype.fire = function () {
        // if (!this.bulletTime || this.game.time.now > this.bulletTime) {
        //   let bullet: Phaser.Sprite = this.bullets.getFirstExists(false);
        //   if (bullet) {
        //       bullet.reset(this.player.body.x + (24 * scaleRatio), this.player.body.y - (12 * scaleRatio));
        //       bullet.lifespan = 2500;
        //       bullet.rotation = this.player.rotation;
        //       bullet.body.velocity.set(0, -400);
        //       this.bulletTime = this.game.time.now + 100;
        //       console.log(this.bulletTime);
        //   }
        // }
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
