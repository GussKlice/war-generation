(function () {
  var network = new Network();
  var canvas = document.getElementById('game-canvas');
  var renderer = new Renderer(canvas);
  var ui = new UI();
  var game = null;

  // ===== MENU =====
  document.getElementById('btn-play').addEventListener('click', function () {
    var name = document.getElementById('player-name').value.trim() || 'Anonyme';
    network.findGame(name);
    ui.showQueue();
  });

  document.getElementById('player-name').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('btn-play').click();
  });

  // ===== SOLO vs IA =====
  document.querySelectorAll('.btn-diff').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = document.getElementById('player-name').value.trim() || 'Joueur';
      var diff = btn.getAttribute('data-diff');
      network.playSolo(name, diff);
    });
  });

  // ===== EVENTS RESEAU =====
  network.on('queue_joined', function () { });

  network.on('game_start', function (data) {
    ui.hideQueue();
    game = new Game(network, renderer, ui);
    game.start(data.playerNumber, data.opponent);
  });

  network.on('game_state', function (state) {
    if (game) game.onState(state);
  });

  network.on('game_over', function (data) {
    if (game) game.onGameOver(data);
  });

  // ===== BOUTONS UNITES =====
  document.getElementById('btn-melee').addEventListener('click', function () {
    if (game) game.spawnUnit('MELEE');
  });
  document.getElementById('btn-ranged').addEventListener('click', function () {
    if (game) game.spawnUnit('RANGED');
  });
  document.getElementById('btn-tank').addEventListener('click', function () {
    if (game) game.spawnUnit('TANK');
  });

  // ===== BOUTONS TOURELLES (slot unlock OU build) =====
  function handleTurretClick(slot) {
    if (!game || !game.state) return;
    var me = game.myPn === 1 ? game.state.player1 : game.state.player2;
    if (!me.turretSlots[slot]) {
      game.unlockSlot(slot);
    } else if (!me.turrets[slot]) {
      game.buildTurret(slot);
    }
  }

  document.getElementById('btn-turret-0').addEventListener('click', function () { handleTurretClick(0); });
  document.getElementById('btn-turret-1').addEventListener('click', function () { handleTurretClick(1); });
  document.getElementById('btn-turret-2').addEventListener('click', function () { handleTurretClick(2); });

  // ===== BOUTONS SPECIAUX =====
  document.getElementById('btn-upgrade-age').addEventListener('click', function () {
    if (game) game.upgradeAge();
  });
  document.getElementById('btn-special').addEventListener('click', function () {
    if (game) game.specialAttack();
  });

  // ===== REJOUER =====
  document.getElementById('btn-rematch').addEventListener('click', function () {
    if (game) game.destroy();
    game = null;
    ui.showScreen('menu');
    ui.hideQueue();
  });

  // ===== CLAVIER =====
  document.addEventListener('keydown', function (e) {
    if (!game || !game.isRunning) return;
    switch (e.key) {
      case '1': case '&': game.spawnUnit('MELEE'); break;
      case '2': case 'é': game.spawnUnit('RANGED'); break;
      case '3': case '"': game.spawnUnit('TANK'); break;
      case 'q': case 'Q': case 'a': case 'A': handleTurretClick(0); break;
      case 'w': case 'W': case 'z': case 'Z': handleTurretClick(1); break;
      case 'e': case 'E': handleTurretClick(2); break;
      case 'r': case 'R': game.upgradeAge(); break;
      case 'f': case 'F': game.specialAttack(); break;
    }
  });

  // ===== RESIZE =====
  function resize() {
    var maxW = Math.min(1200, window.innerWidth - 10);
    canvas.style.width = maxW + 'px';
    canvas.style.height = (maxW * 500 / 1200) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();
})();