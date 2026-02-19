// server/gameState.js
const CONSTANTS = require('../shared/constants');

let unitIdCounter = 0;

class GameState {
  constructor(gameId, player1, player2) {
    this.gameId = gameId;
    this.isOver = false;
    this.winner = null;
    this.winReason = null;
    this.loopInterval = null;
    this.gameTime = 0;
    
    this.player1 = {
      id: player1.id,
      name: player1.name,
      gold: CONSTANTS.STARTING_GOLD,
      age: 0,
      baseHp: CONSTANTS.BASE_HP,
      baseMaxHp: CONSTANTS.BASE_HP,
      units: [],
      turrets: [null, null, null], // 3 slots
      xp: 0,
      specialCooldown: 0,
      trainingQueue: []
    };
    
    this.player2 = {
      id: player2.id,
      name: player2.name,
      gold: CONSTANTS.STARTING_GOLD,
      age: 0,
      baseHp: CONSTANTS.BASE_HP,
      baseMaxHp: CONSTANTS.BASE_HP,
      units: [],
      turrets: [null, null, null],
      xp: 0,
      specialCooldown: 0,
      trainingQueue: []
    };
  }
  
  getPlayerNumber(socketId) {
    if (socketId === this.player1.id) return 1;
    if (socketId === this.player2.id) return 2;
    return null;
  }
  
  getPlayer(playerNumber) {
    return playerNumber === 1 ? this.player1 : this.player2;
  }
  
  getOpponent(playerNumber) {
    return playerNumber === 1 ? this.player2 : this.player1;
  }
  
  // ===== SPAWN UNIT =====
  spawnUnit(playerNumber, unitType) {
    const player = this.getPlayer(playerNumber);
    const unitDef = CONSTANTS.UNITS[player.age]?.[unitType];
    
    if (!unitDef) return false;
    if (player.gold < unitDef.cost) return false;
    
    player.gold -= unitDef.cost;
    
    // Ajouter à la queue d'entraînement
    player.trainingQueue.push({
      unitType,
      timeLeft: unitDef.trainTime / 1000,
      age: player.age
    });
    
    return true;
  }
  
  // ===== BUILD TURRET =====
  buildTurret(playerNumber, slot) {
    const player = this.getPlayer(playerNumber);
    
    if (slot < 0 || slot >= CONSTANTS.TURRET_SLOTS) return false;
    if (player.turrets[slot] !== null) return false;
    
    const turretDef = CONSTANTS.TURRETS[player.age];
    if (player.gold < turretDef.cost) return false;
    
    player.gold -= turretDef.cost;
    
    const baseX = playerNumber === 1 ? CONSTANTS.BASE_POSITIONS.player1 : CONSTANTS.BASE_POSITIONS.player2;
    const turretOffset = playerNumber === 1 ? 60 + slot * 50 : -60 - slot * 50;
    
    player.turrets[slot] = {
      ...turretDef,
      currentHp: turretDef.hp,
      x: baseX + turretOffset,
      y: CONSTANTS.CANVAS_HEIGHT - 120 - slot * 30,
      lastFireTime: 0,
      age: player.age
    };
    
    return true;
  }
  
  // ===== UPGRADE AGE =====
  upgradeAge(playerNumber) {
    const player = this.getPlayer(playerNumber);
    const nextAge = player.age + 1;
    
    if (nextAge > 4) return false;
    
    const cost = CONSTANTS.AGE_UPGRADE_COST[nextAge];
    if (player.gold < cost) return false;
    
    player.gold -= cost;
    player.age = nextAge;
    
    // Augmenter la vie de la base
    const hpBonus = 500 * nextAge;
    player.baseMaxHp = CONSTANTS.BASE_HP + hpBonus;
    player.baseHp = Math.min(player.baseHp + hpBonus / 2, player.baseMaxHp);
    
    return true;
  }
  
  // ===== SPECIAL ATTACK =====
  specialAttack(playerNumber) {
    const player = this.getPlayer(playerNumber);
    const opponent = this.getOpponent(playerNumber);
    
    if (player.gold < CONSTANTS.SPECIAL_ATTACK_COST) return false;
    if (player.specialCooldown > 0) return false;
    
    player.gold -= CONSTANTS.SPECIAL_ATTACK_COST;
    player.specialCooldown = CONSTANTS.SPECIAL_ATTACK_COOLDOWN / 1000;
    
    // Dégâts à toutes les unités ennemies
    const damage = CONSTANTS.SPECIAL_ATTACK_DAMAGE * (1 + player.age * 0.5);
    opponent.units.forEach(unit => {
      unit.hp -= damage * 0.5;
    });
    
    // Dégâts à la base ennemie
    opponent.baseHp -= damage * 0.3;
    
    return true;
  }
  
  // ===== GAME UPDATE =====
  update(deltaTime) {
    if (this.isOver) return;
    
    this.gameTime += deltaTime;
    
    // Revenus passifs
    this.player1.gold += CONSTANTS.PASSIVE_GOLD_RATE * deltaTime;
    this.player2.gold += CONSTANTS.PASSIVE_GOLD_RATE * deltaTime;
    
    // Cooldowns
    if (this.player1.specialCooldown > 0) this.player1.specialCooldown -= deltaTime;
    if (this.player2.specialCooldown > 0) this.player2.specialCooldown -= deltaTime;
    
    // Training queues
    this.processTrainingQueue(1, deltaTime);
    this.processTrainingQueue(2, deltaTime);
    
    // Déplacer les unités
    this.moveUnits(1);
    this.moveUnits(2);
    
    // Combat
    this.processCombat(deltaTime);
    
    // Tourelles
    this.processTurrets(1, deltaTime);
    this.processTurrets(2, deltaTime);
    
    // Attaque de base
    this.processBaseAttack(1);
    this.processBaseAttack(2);
    
    // Nettoyer les unités mortes
    this.cleanupDeadUnits(1);
    this.cleanupDeadUnits(2);
    
    // Vérifier victoire
    this.checkVictory();
  }
  
  processTrainingQueue(playerNumber, deltaTime) {
    const player = this.getPlayer(playerNumber);
    
    if (player.trainingQueue.length === 0) return;
    
    const training = player.trainingQueue[0];
    training.timeLeft -= deltaTime;
    
    if (training.timeLeft <= 0) {
      player.trainingQueue.shift();
      
      // Créer l'unité
      const unitDef = CONSTANTS.UNITS[training.age]?.[training.unitType];
      if (unitDef) {
        const baseX = playerNumber === 1 ? CONSTANTS.BASE_POSITIONS.player1 + 80 : CONSTANTS.BASE_POSITIONS.player2 - 80;
        
        player.units.push({
          id: ++unitIdCounter,
          type: training.unitType,
          age: training.age,
          ...unitDef,
          hp: unitDef.hp,
          maxHp: unitDef.hp,
          x: baseX,
          y: CONSTANTS.CANVAS_HEIGHT - 80,
          direction: playerNumber === 1 ? 1 : -1,
          attacking: false,
          attackCooldown: 0,
          target: null
        });
      }
    }
  }
  
  moveUnits(playerNumber) {
    const player = this.getPlayer(playerNumber);
    
    player.units.forEach(unit => {
      if (!unit.attacking) {
        unit.x += unit.speed * unit.direction;
      }
    });
  }
  
  processCombat(deltaTime) {
    // Unités du joueur 1 vs joueur 2
    this.player1.units.forEach(unit1 => {
      unit1.attacking = false;
      unit1.attackCooldown = Math.max(0, (unit1.attackCooldown || 0) - deltaTime);
      
      // Chercher la cible la plus proche
      let closestEnemy = null;
      let closestDist = Infinity;
      
      this.player2.units.forEach(unit2 => {
        const dist = Math.abs(unit1.x - unit2.x);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = unit2;
        }
      });
      
      if (closestEnemy && closestDist <= unit1.range) {
        unit1.attacking = true;
        if (unit1.attackCooldown <= 0) {
          closestEnemy.hp -= unit1.attack;
          unit1.attackCooldown = 1; // 1 seconde entre chaque attaque
          
          if (closestEnemy.hp <= 0) {
            this.player1.gold += closestEnemy.cost * CONSTANTS.GOLD_PER_KILL_MULTIPLIER;
            this.player1.xp += closestEnemy.cost;
          }
        }
      }
    });
    
    // Unités du joueur 2 vs joueur 1 (même logique)
    this.player2.units.forEach(unit2 => {
      unit2.attacking = false;
      unit2.attackCooldown = Math.max(0, (unit2.attackCooldown || 0) - deltaTime);
      
      let closestEnemy = null;
      let closestDist = Infinity;
      
      this.player1.units.forEach(unit1 => {
        const dist = Math.abs(unit2.x - unit1.x);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = unit1;
        }
      });
      
      if (closestEnemy && closestDist <= unit2.range) {
        unit2.attacking = true;
        if (unit2.attackCooldown <= 0) {
          closestEnemy.hp -= unit2.attack;
          unit2.attackCooldown = 1;
          
          if (closestEnemy.hp <= 0) {
            this.player2.gold += closestEnemy.cost * CONSTANTS.GOLD_PER_KILL_MULTIPLIER;
            this.player2.xp += closestEnemy.cost;
          }
        }
      }
    });
  }
  
  processTurrets(playerNumber, deltaTime) {
    const player = this.getPlayer(playerNumber);
    const opponent = this.getOpponent(playerNumber);
    
    player.turrets.forEach(turret => {
      if (!turret) return;
      
      turret.lastFireTime = (turret.lastFireTime || 0) + deltaTime * 1000;
      
      // Chercher une cible
      let target = null;
      let minDist = Infinity;
      
      opponent.units.forEach(unit => {
        const dist = Math.abs(turret.x - unit.x);
        if (dist <= turret.range && dist < minDist) {
          minDist = dist;
          target = unit;
        }
      });
      
      if (target && turret.lastFireTime >= turret.fireRate) {
        target.hp -= turret.attack;
        turret.lastFireTime = 0;
        
        if (target.hp <= 0) {
          player.gold += target.cost * CONSTANTS.GOLD_PER_KILL_MULTIPLIER * 0.5;
        }
      }
    });
  }
  
  processBaseAttack(playerNumber) {
    const opponent = this.getOpponent(playerNumber);
    const player = this.getPlayer(playerNumber);
    
    const baseX = playerNumber === 1 ? CONSTANTS.BASE_POSITIONS.player1 : CONSTANTS.BASE_POSITIONS.player2;
    
    // Les unités ennemies attaquent la base
    opponent.units.forEach(unit => {
      const dist = Math.abs(unit.x - baseX);
      if (dist <= unit.range) {
        unit.attacking = true;
        if (unit.attackCooldown <= 0) {
          player.baseHp -= unit.attack;
          unit.attackCooldown = 1;
        }
      }
    });
  }
  
  cleanupDeadUnits(playerNumber) {
    const player = this.getPlayer(playerNumber);
    player.units = player.units.filter(unit => unit.hp > 0);
  }
  
  checkVictory() {
    if (this.player1.baseHp <= 0) {
      this.isOver = true;
      this.winner = 2;
      this.winReason = 'Base détruite';
    } else if (this.player2.baseHp <= 0) {
      this.isOver = true;
      this.winner = 1;
      this.winReason = 'Base détruite';
    }
  }
  
  getSerializedState() {
    return {
      gameTime: Math.floor(this.gameTime),
      player1: {
        name: this.player1.name,
        gold: Math.floor(this.player1.gold),
        age: this.player1.age,
        baseHp: Math.floor(this.player1.baseHp),
        baseMaxHp: this.player1.baseMaxHp,
        units: this.player1.units.map(u => ({
          id: u.id, type: u.type, age: u.age, name: u.name,
          hp: Math.floor(u.hp), maxHp: u.maxHp,
          x: Math.floor(u.x), y: u.y,
          attacking: u.attacking, direction: u.direction
        })),
        turrets: this.player1.turrets,
        xp: Math.floor(this.player1.xp),
        specialCooldown: Math.max(0, Math.floor(this.player1.specialCooldown)),
        trainingQueue: this.player1.trainingQueue.map(t => ({
          unitType: t.unitType,
          timeLeft: Math.max(0, t.timeLeft.toFixed(1))
        }))
      },
      player2: {
        name: this.player2.name,
        gold: Math.floor(this.player2.gold),
        age: this.player2.age,
        baseHp: Math.floor(this.player2.baseHp),
        baseMaxHp: this.player2.baseMaxHp,
        units: this.player2.units.map(u => ({
          id: u.id, type: u.type, age: u.age, name: u.name,
          hp: Math.floor(u.hp), maxHp: u.maxHp,
          x: Math.floor(u.x), y: u.y,
          attacking: u.attacking, direction: u.direction
        })),
        turrets: this.player2.turrets,
        xp: Math.floor(this.player2.xp),
        specialCooldown: Math.max(0, Math.floor(this.player2.specialCooldown)),
        trainingQueue: this.player2.trainingQueue.map(t => ({
          unitType: t.unitType,
          timeLeft: Math.max(0, t.timeLeft.toFixed(1))
        }))
      }
    };
  }
}

module.exports = GameState;