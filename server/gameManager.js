// server/gameManager.js
const GameState = require('./gameState');
const CONSTANTS = require('../shared/constants');

class GameManager {
  constructor(io) {
    this.io = io;
    this.queue = [];
    this.games = new Map(); // gameId -> GameState
    this.playerGameMap = new Map(); // socketId -> gameId
  }
  
  addToQueue(socket, playerName) {
    // Vérifier si déjà dans la queue
    if (this.queue.find(p => p.socket.id === socket.id)) return;
    
    this.queue.push({ socket, playerName: playerName || 'Anonymous' });
    socket.emit('queue_joined', { position: this.queue.length });
    
    console.log(`📋 File d'attente: ${this.queue.length} joueur(s)`);
    
    // Essayer de créer une partie
    if (this.queue.length >= 2) {
      this.createGame();
    }
  }
  
  createGame() {
    const player1 = this.queue.shift();
    const player2 = this.queue.shift();
    
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Créer la room
    player1.socket.join(gameId);
    player2.socket.join(gameId);
    
    // Créer l'état du jeu
    const gameState = new GameState(gameId, {
      id: player1.socket.id,
      name: player1.playerName
    }, {
      id: player2.socket.id,
      name: player2.playerName
    });
    
    this.games.set(gameId, gameState);
    this.playerGameMap.set(player1.socket.id, gameId);
    this.playerGameMap.set(player2.socket.id, gameId);
    
    // Notifier les joueurs
    player1.socket.emit('game_start', {
      gameId,
      playerNumber: 1,
      opponent: player2.playerName
    });
    
    player2.socket.emit('game_start', {
      gameId,
      playerNumber: 2,
      opponent: player1.playerName
    });
    
    console.log(`🎮 Partie créée: ${gameId} | ${player1.playerName} vs ${player2.playerName}`);
    
    // Démarrer la boucle de jeu
    this.startGameLoop(gameId);
  }
  
  startGameLoop(gameId) {
    const intervalMs = 1000 / CONSTANTS.TICK_RATE;
    
    const loop = setInterval(() => {
      const game = this.games.get(gameId);
      if (!game || game.isOver) {
        clearInterval(loop);
        return;
      }
      
      // Mettre à jour l'état du jeu
      game.update(intervalMs / 1000);
      
      // Envoyer l'état aux joueurs
      const state = game.getSerializedState();
      this.io.to(gameId).emit('game_state', state);
      
      // Vérifier fin de partie
      if (game.isOver) {
        this.io.to(gameId).emit('game_over', {
          winner: game.winner,
          reason: game.winReason
        });
        this.cleanupGame(gameId);
      }
    }, intervalMs);
    
    const game = this.games.get(gameId);
    if (game) game.loopInterval = loop;
  }
  
  handleSpawnUnit(socket, data) {
    const gameId = this.playerGameMap.get(socket.id);
    if (!gameId) return;
    
    const game = this.games.get(gameId);
    if (!game) return;
    
    const playerNumber = game.getPlayerNumber(socket.id);
    game.spawnUnit(playerNumber, data.unitType);
  }
  
  handleBuildTurret(socket, data) {
    const gameId = this.playerGameMap.get(socket.id);
    if (!gameId) return;
    
    const game = this.games.get(gameId);
    if (!game) return;
    
    const playerNumber = game.getPlayerNumber(socket.id);
    game.buildTurret(playerNumber, data.slot);
  }
  
  handleUpgradeAge(socket) {
    const gameId = this.playerGameMap.get(socket.id);
    if (!gameId) return;
    
    const game = this.games.get(gameId);
    if (!game) return;
    
    const playerNumber = game.getPlayerNumber(socket.id);
    game.upgradeAge(playerNumber);
  }
  
  handleSpecialAttack(socket) {
    const gameId = this.playerGameMap.get(socket.id);
    if (!gameId) return;
    
    const game = this.games.get(gameId);
    if (!game) return;
    
    const playerNumber = game.getPlayerNumber(socket.id);
    game.specialAttack(playerNumber);
  }
  
  handleDisconnect(socket) {
    // Retirer de la queue
    this.queue = this.queue.filter(p => p.socket.id !== socket.id);
    
    // Gérer la déconnexion en jeu
    const gameId = this.playerGameMap.get(socket.id);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game && !game.isOver) {
        game.isOver = true;
        game.winner = game.getPlayerNumber(socket.id) === 1 ? 2 : 1;
        game.winReason = 'disconnect';
        
        this.io.to(gameId).emit('game_over', {
          winner: game.winner,
          reason: 'Adversaire déconnecté'
        });
        
        this.cleanupGame(gameId);
      }
    }
  }
  
  cleanupGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      if (game.loopInterval) clearInterval(game.loopInterval);
      this.playerGameMap.delete(game.player1.id);
      this.playerGameMap.delete(game.player2.id);
      this.games.delete(gameId);
    }
  }
}

module.exports = GameManager;