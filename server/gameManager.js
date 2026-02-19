const GameState = require('./gameState');
const AI = require('./ai');
const CONSTANTS = require('../shared/constants');

class GameManager {
  constructor(io) {
    this.io = io;
    this.queue = [];
    this.games = new Map();
    this.playerGameMap = new Map();
  }

  addToQueue(socket, playerName) {
    if (this.queue.find(p => p.socket.id === socket.id)) return;
    this.queue.push({ socket, playerName: playerName || 'Anonyme' });
    socket.emit('queue_joined', { position: this.queue.length });
    if (this.queue.length >= 2) this.createGame();
  }

  createGame() {
    const p1 = this.queue.shift();
    const p2 = this.queue.shift();
    const gameId = 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    p1.socket.join(gameId);
    p2.socket.join(gameId);

    const gs = new GameState(gameId,
      { id: p1.socket.id, name: p1.playerName },
      { id: p2.socket.id, name: p2.playerName }
    );
    this.games.set(gameId, gs);
    this.playerGameMap.set(p1.socket.id, gameId);
    this.playerGameMap.set(p2.socket.id, gameId);

    p1.socket.emit('game_start', { gameId, playerNumber: 1, opponent: p2.playerName });
    p2.socket.emit('game_start', { gameId, playerNumber: 2, opponent: p1.playerName });
    this.startLoop(gameId);
  }

  // ===== SOLO vs IA =====
  createSoloGame(socket, playerName, difficulty) {
    const gameId = 'solo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    socket.join(gameId);

    const gs = new GameState(gameId,
      { id: socket.id, name: playerName || 'Joueur' },
      { id: 'AI', name: 'IA (' + difficulty + ')' }
    );
    const ai = new AI(difficulty);
    gs._ai = ai;
    gs._aiPlayerNumber = 2;
    gs._isSolo = true;

    this.games.set(gameId, gs);
    this.playerGameMap.set(socket.id, gameId);

    socket.emit('game_start', { gameId, playerNumber: 1, opponent: 'IA (' + difficulty + ')' });
    this.startLoop(gameId);
  }

  startLoop(gameId) {
    const ms = 1000 / CONSTANTS.TICK_RATE;
    const loop = setInterval(() => {
      const gs = this.games.get(gameId);
      if (!gs || gs.isOver) { clearInterval(loop); return; }

      // IA
      if (gs._isSolo && gs._ai) {
        const actions = gs._ai.update(ms / 1000, gs, gs._aiPlayerNumber);
        actions.forEach(a => {
          if (a.type === 'spawn_unit') gs.spawnUnit(gs._aiPlayerNumber, a.unitType);
          else if (a.type === 'build_turret') gs.buildTurret(gs._aiPlayerNumber, a.slot);
          else if (a.type === 'unlock_turret_slot') gs.unlockTurretSlot(gs._aiPlayerNumber, a.slot);
          else if (a.type === 'upgrade_age') gs.upgradeAge(gs._aiPlayerNumber);
          else if (a.type === 'special_attack') gs.specialAttack(gs._aiPlayerNumber);
        });
      }

      gs.update(ms / 1000);
      this.io.to(gameId).emit('game_state', gs.serialize());

      if (gs.isOver) {
        this.io.to(gameId).emit('game_over', { winner: gs.winner, reason: gs.winReason });
        this.cleanupGame(gameId);
      }
    }, ms);

    const gs = this.games.get(gameId);
    if (gs) gs.loopInterval = loop;
  }

  // ===== ACTIONS =====
  _getGame(socket) {
    const gid = this.playerGameMap.get(socket.id);
    if (!gid) return null;
    const gs = this.games.get(gid);
    if (!gs) return null;
    return { gs, pn: gs.getPlayerNumber(socket.id) };
  }

  handleSpawnUnit(socket, data) {
    const g = this._getGame(socket);
    if (g) g.gs.spawnUnit(g.pn, data.unitType);
  }
  handleBuildTurret(socket, data) {
    const g = this._getGame(socket);
    if (g) g.gs.buildTurret(g.pn, data.slot);
  }
  handleUnlockTurretSlot(socket, data) {
    const g = this._getGame(socket);
    if (g) g.gs.unlockTurretSlot(g.pn, data.slot);
  }
  handleUpgradeAge(socket) {
    const g = this._getGame(socket);
    if (g) g.gs.upgradeAge(g.pn);
  }
  handleSpecialAttack(socket) {
    const g = this._getGame(socket);
    if (g) g.gs.specialAttack(g.pn);
  }

  handleDisconnect(socket) {
    this.queue = this.queue.filter(p => p.socket.id !== socket.id);
    const gid = this.playerGameMap.get(socket.id);
    if (gid) {
      const gs = this.games.get(gid);
      if (gs && !gs.isOver) {
        gs.isOver = true;
        gs.winner = gs.getPlayerNumber(socket.id) === 1 ? 2 : 1;
        gs.winReason = 'Adversaire deconnecte';
        this.io.to(gid).emit('game_over', { winner: gs.winner, reason: gs.winReason });
        this.cleanupGame(gid);
      }
    }
  }

  cleanupGame(gid) {
    const gs = this.games.get(gid);
    if (gs) {
      if (gs.loopInterval) clearInterval(gs.loopInterval);
      this.playerGameMap.delete(gs.player1.id);
      this.playerGameMap.delete(gs.player2.id);
      this.games.delete(gid);
    }
  }
}

module.exports = GameManager;