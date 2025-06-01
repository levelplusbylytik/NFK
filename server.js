import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Game state
const players = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Handle new player joining
  socket.on('playerJoin', (playerData) => {
    players.set(socket.id, {
      id: socket.id,
      x: playerData.x,
      y: playerData.y,
      rotation: playerData.rotation,
      health: 100
    });
    
    // Send current players to the new player
    socket.emit('currentPlayers', Array.from(players.values()));
    
    // Notify other players about the new player
    socket.broadcast.emit('newPlayer', players.get(socket.id));
  });

  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    const player = players.get(socket.id);
    if (player) {
      player.x = movementData.x;
      player.y = movementData.y;
      player.rotation = movementData.rotation;
      socket.broadcast.emit('playerMoved', player);
    }
  });

  // Handle player shooting
  socket.on('playerShoot', (shootData) => {
    socket.broadcast.emit('playerShot', {
      playerId: socket.id,
      ...shootData
    });
  });

  // Handle player hit
  socket.on('playerHit', (hitData) => {
    const player = players.get(hitData.targetId);
    if (player) {
      player.health -= hitData.damage;
      if (player.health <= 0) {
        io.emit('playerDied', hitData.targetId);
        players.delete(hitData.targetId);
      } else {
        io.emit('playerHealthUpdate', {
          id: hitData.targetId,
          health: player.health
        });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    players.delete(socket.id);
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 