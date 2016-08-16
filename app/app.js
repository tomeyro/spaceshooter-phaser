var scaleRatio = 1;
var SimpleGame = (function () {
    function SimpleGame() {
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
    };
    SimpleGame.prototype.create = function () {
        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.height - (48 * scaleRatio), 'player');
        this.player.scale.setTo(scaleRatio, scaleRatio);
        this.player.anchor.setTo(0.5, 0.5);
        this.game.physics.arcade.enable(this.player);
        this.enemy = this.game.add.sprite(this.game.world.centerX, (48 * scaleRatio), 'enemy');
        this.enemy.scale.setTo(scaleRatio, scaleRatio);
        this.enemy.anchor.setTo(0.5, 0.5);
        this.game.physics.arcade.enable(this.enemy);
        this.enemy.body.velocity.set(0, 150);
        this.bullet = this.game.add.sprite(this.player.position.x, this.player.position.y - (48 * scaleRatio), 'bullet');
        this.bullet.scale.setTo(scaleRatio, scaleRatio);
        this.bullet.anchor.setTo(0.5, 0.5);
        this.game.physics.arcade.enable(this.bullet);
        this.bullet.body.velocity.set(0, -50);
    };
    SimpleGame.prototype.update = function () {
        this.game.physics.arcade.collide(this.player, this.enemy);
        this.game.physics.arcade.collide(this.enemy, this.bullet, SimpleGame.prototype.destroyEnemy, null, this);
    };
    SimpleGame.prototype.destroyEnemy = function (enemy, bullet) {
        console.log('kabooooom!');
        enemy.destroy();
        bullet.destroy();
    };
    SimpleGame.prototype.render = function () {
        this.game.debug.body(this.player);
        this.game.debug.body(this.enemy);
        this.game.debug.body(this.bullet);
    };
    return SimpleGame;
}());
window.onload = function () {
    var game = new SimpleGame();
};
