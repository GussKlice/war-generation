// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
  console.log(`🔌 Joueur connecté: ${socket.id}`);
  
  // Matchmaking
  socket.on('find_game', (data) => {
    gameManager.addToQueue(socket, data.playerName);
  });
  
  // Actions de jeu
  socket.on('spawn_unit', (data) => {
    gameManager.handleSpawnUnit(socket, data);
  });
  
  socket.on('build_turret', (data) => {
    gameManager.handleBuildTurret(socket, data);
  });
  
  socket.on('upgrade_age', () => {
    gameManager.handleUpgradeAge(socket);
  });
  
  socket.on('special_attack', () => {
    gameManager.handleSpecialAttack(socket);
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ Joueur déconnecté: ${socket.id}`);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Wargeneration lancé sur le port ${PORT}`);
});