const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ['websocket', 'polling']
});

app.use(express.static(path.join(__dirname, '../client')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const gm = new GameManager(io);

io.on('connection', (socket) => {
  console.log('Connecte: ' + socket.id);

  socket.on('find_game', (data) => gm.addToQueue(socket, data.playerName));
  socket.on('play_solo', (data) => gm.createSoloGame(socket, data.playerName, data.difficulty));
  socket.on('spawn_unit', (data) => gm.handleSpawnUnit(socket, data));
  socket.on('build_turret', (data) => gm.handleBuildTurret(socket, data));
  socket.on('unlock_turret_slot', (data) => gm.handleUnlockTurretSlot(socket, data));
  socket.on('upgrade_age', () => gm.handleUpgradeAge(socket));
  socket.on('special_attack', () => gm.handleSpecialAttack(socket));
  socket.on('disconnect', () => {
    console.log('Deconnecte: ' + socket.id);
    gm.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('War Generation lance sur le port ' + PORT);
});