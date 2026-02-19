class Network {
  constructor() {
    this.socket = io();
  }
  on(e, cb) { this.socket.on(e, cb); }
  emit(e, d) { this.socket.emit(e, d); }
  findGame(name) { this.emit('find_game', { playerName: name }); }
  playSolo(name, difficulty) { this.emit('play_solo', { playerName: name, difficulty: difficulty }); }
  spawnUnit(t) { this.emit('spawn_unit', { unitType: t }); }
  buildTurret(s) { this.emit('build_turret', { slot: s }); }
  unlockTurretSlot(s) { this.emit('unlock_turret_slot', { slot: s }); }
  upgradeAge() { this.emit('upgrade_age'); }
  specialAttack() { this.emit('special_attack'); }
}