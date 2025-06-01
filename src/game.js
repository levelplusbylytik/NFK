import MultiplayerScene from './MultiplayerScene.js';

// Game configuration
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
  scene: [MultiplayerScene],
  // Add any additional game settings here
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: false,
  roundPixels: true
};

// Initialize the game
const game = new Phaser.Game(config);

// Export the game instance if needed elsewhere
export default game;