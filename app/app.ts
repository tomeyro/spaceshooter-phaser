var scaleRatio: number = 1;

class SimpleGame {
  constructor() {
    var windowSize = {width: 480, height: 800};
    let scaleX = (window.innerWidth / windowSize.width) * window.devicePixelRatio;
    let scaleY = (window.innerHeight / windowSize.height) * window.devicePixelRatio;
    scaleRatio = (scaleY < scaleX) ? scaleY : scaleX;
    this.game = new Phaser.Game(windowSize.width*scaleRatio, windowSize.height*scaleRatio, Phaser.AUTO, 'content', {
      preload: this.preload,
      create: this.create,
      update: this.update,
      render: this.render
    });
  }

  game: Phaser.Game;
  player: Phaser.Sprite;
  enemy: Phaser.Sprite;
  bullet: Phaser.Sprite;

  preload() {
    this.game.load.image('logo', '../res/logo.png');
    this.game.load.image('player', '../res/player.png');
    this.game.load.image('enemy', '../res/enemy.png');
    this.game.load.image('bullet', '../res/bullet.png');
  }

  create() {
    this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.height - (48 * scaleRatio), 'player');
    this.player.scale.setTo(scaleRatio, scaleRatio);
    this.player.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.player);

    this.enemy = this.game.add.sprite(this.game.world.centerX , (48 * scaleRatio), 'enemy');
    this.enemy.scale.setTo(scaleRatio, scaleRatio);
    this.enemy.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.enemy);
    this.enemy.body.velocity.set(0, 150);

    this.bullet = this.game.add.sprite(this.player.position.x, this.player.position.y - (48 * scaleRatio), 'bullet');
    this.bullet.scale.setTo(scaleRatio, scaleRatio);
    this.bullet.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.bullet);
    this.bullet.body.velocity.set(0, -50);
  }

  update() {
    this.game.physics.arcade.collide(this.player, this.enemy);
    this.game.physics.arcade.collide(this.enemy, this.bullet, SimpleGame.prototype.destroyEnemy, null, this);
  }

  destroyEnemy(enemy: Phaser.Sprite, bullet: Phaser.Sprite) {
    console.log('kabooooom!');
    enemy.destroy();
    bullet.destroy();
  }

  render() {
    this.game.debug.body(this.player);
    this.game.debug.body(this.enemy);
    this.game.debug.body(this.bullet);
  }
}

window.onload = () => {
  var game = new SimpleGame();
};
