// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {};
const blocks = [];

function getRandomHatColor() {
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Serve a simple message on the root route
app.get('/', (req, res) => {
  res.send('Server is running');
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Assign a random hat color on join
  const hatColor = getRandomHatColor();

  // Add player to players object
  players[socket.id] = {
    position: [0, 0.5, 0],
    hatColor,
  };

  // Send current players and blocks to the new player
  socket.emit('players', players);
  socket.emit('blocks', blocks);

  // Notify others about the new player
  socket.broadcast.emit('playerJoined', { id: socket.id, position: players[socket.id].position, hatColor });

  // Receive position updates
  socket.on('update', (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      io.emit('players', players);
    }
  });

  // Chat messages
  socket.on('chat', (msg) => {
    io.emit('chat', msg);
  });

  // Block placement
  socket.on('placeBlock', (data) => {
    blocks.push(data);
    io.emit('placeBlock', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    delete players[socket.id];
    io.emit('removePlayer', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});