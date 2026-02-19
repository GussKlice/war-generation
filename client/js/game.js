class Game {
  constructor(network, renderer, ui) {
    this.network = network;
    this.renderer = renderer;
    this.ui = ui;
    this.myPn = null;
    this.state = null;
    this.isRunning = false;
    this.rafId = null;
  }

  start(playerNumber, opponent) {
    this.myPn = playerNumber;
    this.isRunning = true;
    this.ui.showScreen('game');
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;
    this.renderer.render(this.state, this.myPn);
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  onState(state) {
    this.detectDeaths(state);
    this.state = state;
    this.ui.updateHUD(state, this.myPn);
  }

  detectDeaths(newState) {
    if (!this.state) return;
    var oldP1 = {};
    var oldP2 = {};
    this.state.player1.units.forEach(function (u) { oldP1[u.id] = u; });
    this.state.player2.units.forEach(function (u) { oldP2[u.id] = u; });
    var newP1 = {};
    var newP2 = {};
    newState.player1.units.forEach(function (u) { newP1[u.id] = true; });
    newState.player2.units.forEach(function (u) { newP2[u.id] = true; });

    var self = this;
    Object.keys(oldP1).forEach(function (id) {
      if (!newP1[id]) self.renderer.addParticle(oldP1[id].x, 388, '#e74c3c', 10);
    });
    Object.keys(oldP2).forEach(function (id) {
      if (!newP2[id]) self.renderer.addParticle(oldP2[id].x, 388, '#3498db', 10);
    });
  }

  spawnUnit(t) { if (this.isRunning) this.network.spawnUnit(t); }
  buildTurret(s) { if (this.isRunning) this.network.buildTurret(s); }
  unlockSlot(s) { if (this.isRunning) this.network.unlockTurretSlot(s); }
  upgradeAge() { if (this.isRunning) this.network.upgradeAge(); }
  specialAttack() { if (this.isRunning) this.network.specialAttack(); }

  onGameOver(data) {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.ui.showGameOver(data.winner, this.myPn, data.reason);
  }

  destroy() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.state = null;
    this.myPn = null;
  }
}