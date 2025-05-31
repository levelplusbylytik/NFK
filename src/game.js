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
let bulletText;
let bulletCount = 20;
let bulletWarning;
let isReloading = false;
let reloadText;
let reloadKey;

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
  platforms.create(50, 250, "ground");
  platforms.create(750, 220, "ground");
  platforms.create(850, -20, "ground");
  platforms.create(650, -20, "ground");
  platforms.create(450, -20, "ground");
  platforms.create(250, -20, "ground");
  platforms.create(850, 820, "ground");
  platforms.create(650, 820, "ground");
  platforms.create(450, 820, "ground");
  platforms.create(250, 820, "ground");

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
  this.input.on("pointerdown", (pointer) => {
    if (pointer.leftButtonDown()) {
      shootBullet.call(this);
    }
  });
  bulletWarning = this.add.text(400, 16, "out of bullets", {
    fontSize: "32px",
    fill: "#FF0000",
    stroke: "#000",
    strokeThickness: 4,
  });
  bulletText = this.add.text(16, 16, "Bullets: 20", {
    fontSize: "24px",
    fill: "#fff",
    stroke: "#000",
    strokeThickness: 4,
  });
  bulletText.setScrollFactor(0);
  bulletWarning.setScrollFactor(0);
  bulletWarning.setOrigin(0.5, 0);
  bulletWarning.setVisible(false);

  reloadText = this.add.text(400, 50, "reloading...", {
    fontSize: "24px",
    fill: "#fff",
    stroke: "#000",
    strokeThickness: 4,

  });
  reloadText.setScrollFactor(0);
  reloadText.setOrigin(0.5, 0);
  reloadText.setVisible(false);

  reloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
}
function update() {
  //mouvment
  if (Phaser.Input.Keyboard.JustDown(reloadKey) && !isReloading && bulletCount < 20) {
    reloadBullets.call(this);
  }
  if (cursors.left.isDown || wasdKeys.left.isDown) {
    player.setVelocityX(-160);
    facing = "left";
  } else if (cursors.right.isDown || wasdKeys.right.isDown) {
    player.setVelocityX(160);
    facing = "right";
  } else {
    player.setVelocityX(0);
  }

  if ((cursors.up.isDown || wasdKeys.up.isDown) && player.body.touching.down) {
    player.setVelocityY(-400);
  }
  // if (this.input.keyboard.checkDown(cursors.space, 300)) {
  //   shootBullet.call(this);
  // }
}
function shootBullet() {
  const bullet = bullets.get(player.x, player.y);
  if (bullet && bulletCount > 0) {
    bulletCount--;
    updauteBulleUI();
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.allowGravity = false;
    const pointer = this.input.activePointer;
    const targetX = pointer.x + this.cameras.main.scrollX;
    const targetY = pointer.y + this.cameras.main.scrollY;
    const angle = Phaser.Math.Angle.Between(
      player.x,
      player.y,
      targetX,
      targetY
    );
    const speed = 400;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    const bulletOffset = 20;
    const bulletX = player.x + Math.cos(angle) * bulletOffset;
    const bulletY = player.y + Math.sin(angle) * bulletOffset;
    bullet.setPosition(bulletX, bulletY);
    bullet.setVelocity(velocityX, velocityY);
    facing = Math.cos(angle) > 0 ? "right" : "left";
    this.time.delayedCall(1500, () => {
      bullets.killAndHide(bullet);
      if (bullet.active) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
        bulletCount++;
        updauteBulleUI();
      }
    });
    bullet.setPosition(player.x, player.y);
  }
}
function updauteBulleUI() {
  bulletText.setText(`bullets: ${bulletCount}`);
  bulletWarning.setVisible(bulletCount === 0);
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
function reloadBullets() {
  if (isReloading) return; // Prevent multiple reloads

  isReloading = true;
  reloadText.setVisible(true);

  // Create a progress bar for reloading
  const reloadBar = this.add.graphics();
  reloadBar.setScrollFactor(0);
  
  // Position the reload bar below the reload text
  const barWidth = 200;
  const barHeight = 20;
  const barX = 400 - barWidth/2;
  const barY = 80;

  // Reload animation
  this.tweens.add({
    targets: reloadBar,
    onStart: () => {
      reloadBar.clear();
      reloadBar.fillStyle(0x666666);
      reloadBar.fillRect(barX, barY, barWidth, barHeight);
    },
    onUpdate: () => {
      reloadBar.clear();
      reloadBar.fillStyle(0x666666);
      reloadBar.fillRect(barX, barY, barWidth, barHeight);
      reloadBar.fillStyle(0xffff00);
      reloadBar.fillRect(barX, barY, barWidth * (this.tweens.getProgress()), barHeight);
    },
    duration: 2000, // 2 seconds reload time
    onComplete: () => {
      // Reset bullet count to max
      bulletCount = 20;
      updauteBulleUI.call(this);
      
      // Clean up
      reloadBar.destroy();
      reloadText.setVisible(false);
      isReloading = false;
    }
  });
}