// client/js/game.js
class Game {
  constructor(network, renderer, ui) {
    this.network = network;
    this.renderer = renderer;
    this.ui = ui;

    this.myPlayerNumber = null;
    this.gameState = null;
    this.isRunning = false;
    this.animationFrameId = null;

    // Stocker les unités précédentes pour détecter les morts (particules)
    this.prevUnitsP1 = new Set();
    this.prevUnitsP2 = new Set();
  }

  // ===== INITIALISER UNE PARTIE =====
  start(playerNumber, opponentName) {
    this.myPlayerNumber = playerNumber;
    this.isRunning = true;
    this.ui.showScreen('game');
    this.gameLoop();
    
    console.log(`🎮 Partie lancée ! Je suis le joueur ${playerNumber} contre ${opponentName}`);
  }

  // ===== BOUCLE DE RENDU (côté client) =====
  gameLoop() {
    if (!this.isRunning) return;

    this.renderer.render(this.gameState, this.myPlayerNumber);
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  // ===== RECEVOIR L'ÉTAT DU SERVEUR =====
  onGameState(state) {
    // Détecter les unités mortes pour les particules
    this.detectDeaths(state);
    this.gameState = state;
    this.ui.updateHUD(state, this.myPlayerNumber);
  }

  // ===== DÉTECTER LES MORTS POUR EFFETS VISUELS =====
  detectDeaths(newState) {
    if (!this.gameState) return;

    const oldP1Ids = new Set(this.gameState.player1.units.map(u => u.id));
    const newP1Ids = new Set(newState.player1.units.map(u => u.id));
    const oldP2Ids = new Set(this.gameState.player2.units.map(u => u.id));
    const newP2Ids = new Set(newState.player2.units.map(u => u.id));

    // Unités P1 mortes
    this.gameState.player1.units.forEach(u => {
      if (!newP1Ids.has(u.id)) {
        this.renderer.addParticle(u.x, 240, '#e74c3c', 8);
      }
    });

    // Unités P2 mortes
    this.gameState.player2.units.forEach(u => {
      if (!newP2Ids.has(u.id)) {
        this.renderer.addParticle(u.x, 240, '#3498db', 8);
      }
    });
  }

  // ===== ACTIONS DU JOUEUR =====
  spawnUnit(type) {
    if (!this.isRunning) return;
    this.network.spawnUnit(type);
  }

  buildTurret(slot) {
    if (!this.isRunning) return;
    this.network.buildTurret(slot);
  }

  upgradeAge() {
    if (!this.isRunning) return;
    this.network.upgradeAge();
  }

  specialAttack() {
    if (!this.isRunning) return;
    this.network.specialAttack();
  }

  // ===== FIN DE PARTIE =====
  onGameOver(data) {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.ui.showGameOver(data.winner, this.myPlayerNumber, data.reason);
  }

  // ===== NETTOYAGE =====
  destroy() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.gameState = null;
    this.myPlayerNumber = null;
  }
}