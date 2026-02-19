// client/js/network.js
class Network {
  constructor() {
    this.socket = io();
    this.callbacks = {};
  }
  
  on(event, callback) {
    this.socket.on(event, callback);
  }
  
  emit(event, data) {
    this.socket.emit(event, data);
  }
  
  findGame(playerName) {
    this.socket.emit('find_game', { playerName });
  }
  
  spawnUnit(unitType) {
    this.socket.emit('spawn_unit', { unitType });
  }
  
  buildTurret(slot) {
    this.socket.emit('build_turret', { slot });
  }
  
  upgradeAge() {
    this.socket.emit('upgrade_age');
  }
  
  specialAttack() {
    this.socket.emit('special_attack');
  }
}