// client/js/main.js
(function () {
  'use strict';

  // ===== INITIALISATION =====
  const network = new Network();
  const canvas = document.getElementById('game-canvas');
  const renderer = new Renderer(canvas);
  const ui = new UI();
  let game = null;

  // ===== MENU - CHERCHER UNE PARTIE =====
  document.getElementById('btn-play').addEventListener('click', () => {
    const name = document.getElementById('player-name').value.trim() || 'Anonymous';
    network.findGame(name);
    ui.showQueue();
  });

  // Appuyer sur Entrée pour lancer
  document.getElementById('player-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btn-play').click();
    }
  });

  // ===== ÉVÉNEMENTS RÉSEAU =====

  // En file d'attente
  network.on('queue_joined', (data) => {
    console.log(`📋 En attente... Position: ${data.position}`);
  });

  // Partie trouvée !
  network.on('game_start', (data) => {
    console.log(`🎮 Partie trouvée ! ID: ${data.gameId}`);
    ui.hideQueue();
    
    game = new Game(network, renderer, ui);
    game.start(data.playerNumber, data.opponent);
  });

  // Mise à jour de l'état
  network.on('game_state', (state) => {
    if (game) {
      game.onGameState(state);
    }
  });

  // Fin de partie
  network.on('game_over', (data) => {
    console.log(`🏁 Partie terminée ! Gagnant: Joueur ${data.winner}`);
    if (game) {
      game.onGameOver(data);
    }
  });

  // ===== CONTRÔLES - BOUTONS =====

  // Unités
  document.getElementById('btn-melee').addEventListener('click', () => {
    if (game) game.spawnUnit('MELEE');
  });

  document.getElementById('btn-ranged').addEventListener('click', () => {
    if (game) game.spawnUnit('RANGED');
  });

  document.getElementById('btn-tank').addEventListener('click', () => {
    if (game) game.spawnUnit('TANK');
  });

  // Tourelles
  document.getElementById('btn-turret-0').addEventListener('click', () => {
    if (game) game.buildTurret(0);
  });

  document.getElementById('btn-turret-1').addEventListener('click', () => {
    if (game) game.buildTurret(1);
  });

  document.getElementById('btn-turret-2').addEventListener('click', () => {
    if (game) game.buildTurret(2);
  });

  // Évolution & Spécial
  document.getElementById('btn-upgrade-age').addEventListener('click', () => {
    if (game) game.upgradeAge();
  });

  document.getElementById('btn-special').addEventListener('click', () => {
    if (game) game.specialAttack();
  });

  // Rejouer
  document.getElementById('btn-rematch').addEventListener('click', () => {
    if (game) game.destroy();
    game = null;
    ui.showScreen('menu');
    ui.hideQueue();
  });

  // ===== CONTRÔLES - CLAVIER =====
  document.addEventListener('keydown', (e) => {
    if (!game || !game.isRunning) return;

    switch (e.key) {
      // Unités
      case '1':
      case '&': // clavier FR
        game.spawnUnit('MELEE');
        break;
      case '2':
      case 'é':
        game.spawnUnit('RANGED');
        break;
      case '3':
      case '"':
        game.spawnUnit('TANK');
        break;

      // Tourelles
      case 'q':
      case 'Q':
      case 'a': // QWERTY
      case 'A':
        game.buildTurret(0);
        break;
      case 'w':
      case 'W':
      case 'z': // AZERTY
      case 'Z':
        game.buildTurret(1);
        break;
      case 'e':
      case 'E':
        game.buildTurret(2);
        break;

      // Évolution
      case 'r':
      case 'R':
        game.upgradeAge();
        break;

      // Attaque spéciale
      case 'f':
      case 'F':
        game.specialAttack();
        break;
    }
  });

  // ===== GESTION DU REDIMENSIONNEMENT =====
  function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(1200, window.innerWidth - 20);
    const ratio = 400 / 1200;
    
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = `${maxWidth * ratio}px`;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  console.log('⚔️ Wargeneration chargé !');
})();