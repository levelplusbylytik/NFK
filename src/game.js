const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 },
      debug: true,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};
const game = new Phaser.Game(config);
let player, cursors, platforms;
function preload() {
  this.load.image(
    "ground",
    "https://labs.phaser.io/assets/sprites/platform.png"
  );
  this.load.image(
    "player",
    "https://labs.phaser.io/assets/sprites/phaser-dude.png"
  );
}
function create(){
  platforms = this.physics.add.staticGroup();
  platforms.create(400,580,"ground").setScale(2).refreshBody();
  platforms.create(600,450,"ground");
  // platforms.create(50,250,"ground");
  // platforms.create(750,220,"ground");

  player = this.physics.add.sprite(100, 450, "player");
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  
  this.physics.add.collider(player,platforms);
  cursors = this.input.keyboard.createCursorKeys();

}
function update(){
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
  } else {
    player.setVelocityX(0);
  }

  if ((cursors.up.isDown || cursors.space.isDown) && player.body.touching.down) {
    player.setVelocityY(-400);
  }
}
