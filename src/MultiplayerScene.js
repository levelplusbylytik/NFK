import { io } from 'socket.io-client';

export default class MultiplayerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultiplayerScene' });
    this.players = new Map();
    this.socket = null;
    this.localPlayer = null;
    this.bulletCount = 20;
    this.isReloading = false;
  }

  preload() {
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

  init() {
    // Connect to the server
    this.socket = io(window.location.origin);
    
    // Set up socket event handlers
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    // Handle connection
    this.socket.on('connect', () => {
      console.log('Connected to server');
      // Send initial player data
      this.socket.emit('playerJoin', {
        x: 100,
        y: 450,
        rotation: 0
      });
    });

    // Handle current players
    this.socket.on('currentPlayers', (players) => {
      players.forEach((playerInfo) => {
        if (playerInfo.id !== this.socket.id) {
          this.addOtherPlayer(playerInfo);
        }
      });
    });

    // Handle new player
    this.socket.on('newPlayer', (playerInfo) => {
      this.addOtherPlayer(playerInfo);
    });

    // Handle player movement
    this.socket.on('playerMoved', (playerInfo) => {
      const otherPlayer = this.players.get(playerInfo.id);
      if (otherPlayer) {
        otherPlayer.x = playerInfo.x;
        otherPlayer.y = playerInfo.y;
        otherPlayer.rotation = playerInfo.rotation;
      }
    });

    // Handle player shooting
    this.socket.on('playerShot', (shootData) => {
      const otherPlayer = this.players.get(shootData.playerId);
      if (otherPlayer) {
        this.createBullet(otherPlayer.x, otherPlayer.y, shootData.angle);
      }
    });

    // Handle player hit
    this.socket.on('playerHealthUpdate', (data) => {
      const player = this.players.get(data.id);
      if (player) {
        player.health = data.health;
        // Update health display
        if (player.healthText) {
          player.healthText.setText(`Health: ${player.health}`);
        }
      }
    });

    // Handle player death
    this.socket.on('playerDied', (playerId) => {
      const player = this.players.get(playerId);
      if (player) {
        player.destroy();
        this.players.delete(playerId);
      }
    });

    // Handle player disconnect
    this.socket.on('playerDisconnected', (playerId) => {
      const player = this.players.get(playerId);
      if (player) {
        player.destroy();
        this.players.delete(playerId);
      }
    });
  }

  create() {
    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 580, "ground").setScale(2).refreshBody();
    this.platforms.create(600, 450, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");
    this.platforms.create(850, -20, "ground");
    this.platforms.create(650, -20, "ground");
    this.platforms.create(450, -20, "ground");
    this.platforms.create(250, -20, "ground");
    this.platforms.create(850, 820, "ground");
    this.platforms.create(650, 820, "ground");
    this.platforms.create(450, 820, "ground");
    this.platforms.create(250, 820, "ground");

    // Create local player
    this.localPlayer = this.physics.add.sprite(100, 450, "player");
    this.localPlayer.setBounce(0.2);
    this.localPlayer.setCollideWorldBounds(true);
    this.physics.add.collider(this.localPlayer, this.platforms);

    // Add health display for local player
    this.localPlayer.health = 100;
    this.localPlayer.healthText = this.add.text(16, 16, "Health: 100", {
      fontSize: "24px",
      fill: "#fff",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.localPlayer.healthText.setScrollFactor(0);

    // Add bullet UI
    this.bulletText = this.add.text(16, 50, "Bullets: 20", {
      fontSize: "24px",
      fill: "#fff",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.bulletText.setScrollFactor(0);

    this.bulletWarning = this.add.text(400, 16, "out of bullets", {
      fontSize: "32px",
      fill: "#FF0000",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.bulletWarning.setScrollFactor(0);
    this.bulletWarning.setOrigin(0.5, 0);
    this.bulletWarning.setVisible(false);

    this.reloadText = this.add.text(400, 50, "reloading...", {
      fontSize: "24px",
      fill: "#fff",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.reloadText.setScrollFactor(0);
    this.reloadText.setOrigin(0.5, 0);
    this.reloadText.setVisible(false);

    // Set up input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.reloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Set up shooting
    this.bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 20,
    });
    this.lastFired = 0;

    // Set up bullet collisions
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      bullet.destroy();
    });

    // Set up shooting input
    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.shootBullet(pointer);
      }
    });
  }

  update() {
    if (!this.localPlayer) return;

    // Handle reloading
    if (Phaser.Input.Keyboard.JustDown(this.reloadKey) && !this.isReloading && this.bulletCount < 20) {
      this.reloadBullets();
    }

    // Handle movement
    let moved = false;
    if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
      this.localPlayer.setVelocityX(-160);
      moved = true;
    } else if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
      this.localPlayer.setVelocityX(160);
      moved = true;
    } else {
      this.localPlayer.setVelocityX(0);
    }

    if ((this.cursors.up.isDown || this.wasdKeys.up.isDown) && this.localPlayer.body.touching.down) {
      this.localPlayer.setVelocityY(-400);
      moved = true;
    }

    // Update player rotation to face mouse
    const pointer = this.input.activePointer;
    const targetX = pointer.x + this.cameras.main.scrollX;
    const targetY = pointer.y + this.cameras.main.scrollY;
    const angle = Phaser.Math.Angle.Between(
      this.localPlayer.x,
      this.localPlayer.y,
      targetX,
      targetY
    );
    this.localPlayer.rotation = angle;

    // Send movement update to server if player moved
    if (moved) {
      this.socket.emit("playerMovement", {
        x: this.localPlayer.x,
        y: this.localPlayer.y,
        rotation: this.localPlayer.rotation,
      });
    }

    // Update health text position for local player
    this.localPlayer.healthText.setPosition(this.localPlayer.x - 30, this.localPlayer.y - 30);
  }

  shootBullet(pointer) {
    const time = this.time.now;
    if (time > this.lastFired && this.bulletCount > 0) {
      const bullet = this.bullets.get(this.localPlayer.x, this.localPlayer.y);
      if (bullet) {
        this.lastFired = time + 200;
        this.bulletCount--;
        this.updateBulletUI();

        const targetX = pointer.x + this.cameras.main.scrollX;
        const targetY = pointer.y + this.cameras.main.scrollY;
        const angle = Phaser.Math.Angle.Between(
          this.localPlayer.x,
          this.localPlayer.y,
          targetX,
          targetY
        );

        // Emit shooting event to server
        this.socket.emit("playerShoot", {
          angle: angle,
          x: this.localPlayer.x,
          y: this.localPlayer.y,
        });

        // Create local bullet
        this.createBullet(this.localPlayer.x, this.localPlayer.y, angle);
      }
    }
  }

  createBullet(x, y, angle) {
    const bullet = this.bullets.get(x, y);
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.allowGravity = false;

      const speed = 400;
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      bullet.setPosition(x, y);
      bullet.setVelocity(velocityX, velocityY);

      this.time.delayedCall(1500, () => {
        if (bullet.active) {
          bullet.setActive(false);
          bullet.setVisible(false);
          this.bulletCount++;
          this.updateBulletUI();
        }
      });
    }
  }

  updateBulletUI() {
    this.bulletText.setText(`Bullets: ${this.bulletCount}`);
    this.bulletWarning.setVisible(this.bulletCount === 0);
  }

  reloadBullets() {
    if (this.isReloading) return;

    this.isReloading = true;
    this.reloadText.setVisible(true);

    const reloadBar = this.add.graphics();
    reloadBar.setScrollFactor(0);

    const barWidth = 200;
    const barHeight = 20;
    const barX = 400 - barWidth / 2;
    const barY = 80;

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
        reloadBar.fillRect(barX, barY, barWidth * this.tweens.getProgress(), barHeight);
      },
      duration: 2000,
      onComplete: () => {
        this.bulletCount = 20;
        this.updateBulletUI();
        reloadBar.destroy();
        this.reloadText.setVisible(false);
        this.isReloading = false;
      },
    });
  }

  addOtherPlayer(playerInfo) {
    const otherPlayer = this.physics.add.sprite(playerInfo.x, playerInfo.y, 'player');
    otherPlayer.setBounce(0.2);
    otherPlayer.setCollideWorldBounds(true);
    otherPlayer.health = playerInfo.health;
    otherPlayer.rotation = playerInfo.rotation;

    // Add health display for other player
    otherPlayer.healthText = this.add.text(playerInfo.x, playerInfo.y - 30, `Health: ${playerInfo.health}`, {
      fontSize: '16px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 3
    });

    this.physics.add.collider(otherPlayer, this.platforms);
    this.players.set(playerInfo.id, otherPlayer);
  }
} 