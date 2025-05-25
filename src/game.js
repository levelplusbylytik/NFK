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
let player, cursors, platforms, wasdKeys;
let bullets,
  lastFired = 0,
  facing = "right";
function preload() {
  this.load.setBaseURL("https://cdn.phaserfiles.com/v385");
  this.load.spritesheet("player_handgun", "assets/sprites/player_handgun.png", {
    frameWidth: 66,
    frameHeight: 60,
  });
  this.load.image(
    "ground",
    "https://labs.phaser.io/assets/sprites/platform.png"
  );
  this.load.image(
    "enemy",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQav_4t7q1euOhOYXkMfCk-zXm7-Fc_THwMLA&s"
  );

  this.load.image(
    "player",
    "https://labs.phaser.io/assets/sprites/phaser-dude.png"
  );
  this.load.image("bullet", "https://labs.phaser.io/assets/sprites/bullet.png");
}
function create() {
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 580, "ground").setScale(2).refreshBody();
  platforms.create(600, 450, "ground");
  platforms.create(50,250,"ground");
  platforms.create(750,220,"ground");

  player = this.physics.add.sprite(100, 450, "player");
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.physics.add.collider(player, platforms);
  cursors = this.input.keyboard.createCursorKeys();
  wasdKeys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });
  bullets = this.physics.add.group({
    defaultKey: "bullet",
    maxSize: 20,
  });
  this.enemies = this.physics.add.group();
  const enemy1 = this.enemies.create(600, 450, "enemy");
  enemy1.displayWidth = 64;
  enemy1.displayHeight = 64;
  enemy1.health = 3;
  enemy1.setCollideWorldBounds(true);
  this.physics.add.collider(enemy1, platforms);

  const enemy2 = this.enemies.create(300, 150, "enemy");
  enemy2.displayWidth = 64;
  enemy2.displayHeight = 64;
  enemy2.health = 2;
  enemy2.setCollideWorldBounds(true);
  this.physics.add.collider(enemy2, platforms);

  // Bullet-enemy collision
  this.physics.add.overlap(bullets, this.enemies, bulletHitsEnemy, null, this);
  this.input.on("pointerdown", (pointer)=>{
    if(pointer.leftButtonDown()){
      shootBullet.call(this)
    }

  })
}
function update() {
  //mouvment
  if (cursors.left.isDown || wasdKeys.left.isDown) {
    player.setVelocityX(-160);
    facing = "left";
  } else if (cursors.right.isDown || wasdKeys.right.isDown) {
    player.setVelocityX(160);
    facing = "right";
  } else {
    player.setVelocityX(0);
  }

  if (
    (cursors.up.isDown || cursors.space.isDown || wasdKeys.up.isDown) &&
    player.body.touching.down
  ) {
    player.setVelocityY(-400);
  }
  if (this.input.keyboard.checkDown(cursors.space, 300)) {
    shootBullet.call(this);
  }
}
function shootBullet() {
  const bullet = bullets.get(player.x, player.y);
  if (bullet) {
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.allowGravity = false;
    const pointer = this.input.activePointer;
    const targetX = pointer.x + this.cameras.main.scrollX;
    const targetY = pointer.y + this.cameras.main.scrollY;
    const angle = Phaser.Math.Angle.Between(player.x, player.y , targetX, targetY);
    const speed = 400;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    const bulletOffset = 20;
    const bulletX = player.x + (Math.cos(angle) * bulletOffset);
    const bulletY = player.y + (Math.sin(angle) * bulletOffset);
    bullet.setPosition(bulletX, bulletY);
    bullet.setVelocity(velocityX, velocityY);
    facing = Math.cos(angle) > 0 ? "right":"left";
     this.time.delayedCall(1500, () => {
       bullets.killAndHide(bullet);
       bullet.body.enable = false;
     });
    bullet.setPosition(player.x, player.y);
  }
}
function bulletHitsEnemy(bullet, enemy) {
  enemy.health--;
  bullets.killAndHide(bullet);
  bullet.body.enable = false;
  if (enemy.health <= 0) {
    enemy.disableBody(true, true);
  }
  enemy.setTint(0xff0000);
}
