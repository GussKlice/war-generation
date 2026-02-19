const CONSTANTS = require('../shared/constants');
let uid = 0;

class GameState {
  constructor(gameId, p1, p2) {
    this.gameId = gameId;
    this.isOver = false;
    this.winner = null;
    this.winReason = null;
    this.loopInterval = null;
    this.gameTime = 0;
    this.projectiles = [];

    const mk = (p) => ({
      id: p.id, name: p.name,
      gold: CONSTANTS.STARTING_GOLD, age: 0,
      baseHp: CONSTANTS.BASE_HP, baseMaxHp: CONSTANTS.BASE_HP,
      units: [],
      turretSlots: [false, false, false],
      turrets: [null, null, null],
      xp: 0, specialCooldown: 0,
      trainingQueue: []
    });
    this.player1 = mk(p1);
    this.player2 = mk(p2);
  }

  getPlayerNumber(sid) {
    if (sid === this.player1.id) return 1;
    if (sid === this.player2.id) return 2;
    return null;
  }
  getPlayer(n) { return n === 1 ? this.player1 : this.player2; }
  getOpponent(n) { return n === 1 ? this.player2 : this.player1; }

  unlockTurretSlot(pn, slot) {
    const p = this.getPlayer(pn);
    if (slot < 0 || slot >= 3) return false;
    if (p.turretSlots[slot]) return false;
    if (slot > 0 && !p.turretSlots[slot - 1]) return false;
    const cost = CONSTANTS.TURRET_SLOT_COSTS[slot];
    if (p.gold < cost) return false;
    p.gold -= cost;
    p.turretSlots[slot] = true;
    return true;
  }

  buildTurret(pn, slot) {
    const p = this.getPlayer(pn);
    if (slot < 0 || slot >= 3) return false;
    if (!p.turretSlots[slot]) return false;
    if (p.turrets[slot]) return false;
    const def = CONSTANTS.TURRETS[p.age];
    if (p.gold < def.cost) return false;
    p.gold -= def.cost;
    const baseX = pn === 1 ? CONSTANTS.BASE_POSITIONS.player1 : CONSTANTS.BASE_POSITIONS.player2;
    p.turrets[slot] = {
      ...def, currentHp: def.hp, age: p.age, slot,
      x: baseX, lastFireTime: 9999
    };
    return true;
  }

  spawnUnit(pn, unitType) {
    const p = this.getPlayer(pn);
    const def = CONSTANTS.UNITS[p.age]?.[unitType];
    if (!def || p.gold < def.cost) return false;
    p.gold -= def.cost;
    p.trainingQueue.push({ unitType, timeLeft: def.trainTime / 1000, age: p.age });
    return true;
  }

  upgradeAge(pn) {
    const p = this.getPlayer(pn);
    if (p.age >= 4) return false;
    const cost = CONSTANTS.AGE_UPGRADE_COST[p.age + 1];
    if (p.gold < cost) return false;
    p.gold -= cost;
    p.age++;
    const bonus = 500 * p.age;
    p.baseMaxHp = CONSTANTS.BASE_HP + bonus;
    p.baseHp = Math.min(p.baseHp + bonus / 2, p.baseMaxHp);
    return true;
  }

  specialAttack(pn) {
    const p = this.getPlayer(pn);
    const o = this.getOpponent(pn);
    if (p.gold < CONSTANTS.SPECIAL_ATTACK_COST || p.specialCooldown > 0) return false;
    p.gold -= CONSTANTS.SPECIAL_ATTACK_COST;
    p.specialCooldown = CONSTANTS.SPECIAL_ATTACK_COOLDOWN / 1000;
    const dmg = CONSTANTS.SPECIAL_ATTACK_DAMAGE * (1 + p.age * 0.5);
    o.units.forEach(u => { u.hp -= dmg * 0.5; });
    o.baseHp -= dmg * 0.3;
    return true;
  }

  update(dt) {
    if (this.isOver) return;
    this.gameTime += dt;
    this.player1.gold += CONSTANTS.PASSIVE_GOLD_RATE * dt;
    this.player2.gold += CONSTANTS.PASSIVE_GOLD_RATE * dt;
    if (this.player1.specialCooldown > 0) this.player1.specialCooldown -= dt;
    if (this.player2.specialCooldown > 0) this.player2.specialCooldown -= dt;

    this.processQueue(1, dt);
    this.processQueue(2, dt);
    this.moveUnits(1);
    this.moveUnits(2);
    this.combat(dt);
    this.turretsFire(1, dt);
    this.turretsFire(2, dt);
    this.baseAttack(1, dt);
    this.baseAttack(2, dt);
    this.updateProjectiles(dt);
    this.cleanup(1);
    this.cleanup(2);
    this.checkWin();
  }

  processQueue(pn, dt) {
    const p = this.getPlayer(pn);
    if (!p.trainingQueue.length) return;
    p.trainingQueue[0].timeLeft -= dt;
    if (p.trainingQueue[0].timeLeft <= 0) {
      const t = p.trainingQueue.shift();
      const def = CONSTANTS.UNITS[t.age]?.[t.unitType];
      if (def) {
        const bx = pn === 1 ? CONSTANTS.BASE_POSITIONS.player1 + 60 : CONSTANTS.BASE_POSITIONS.player2 - 60;
        p.units.push({
          id: ++uid, type: t.unitType, age: t.age, name: def.name,
          hp: def.hp, maxHp: def.hp, attack: def.attack,
          speed: def.speed, range: def.range, cost: def.cost,
          x: bx, y: CONSTANTS.GROUND_Y,
          direction: pn === 1 ? 1 : -1,
          attacking: false, attackCooldown: 0,
          walkFrame: 0
        });
      }
    }
  }

  moveUnits(pn) {
    this.getPlayer(pn).units.forEach(u => {
      if (!u.attacking) {
        u.x += u.speed * u.direction;
        u.walkFrame = (u.walkFrame || 0) + 0.1;
      }
    });
  }

  combat(dt) {
    this._fight(this.player1, this.player2, dt, 1);
    this._fight(this.player2, this.player1, dt, 2);
  }

  _fight(atk, def, dt, atkPn) {
    atk.units.forEach(u => {
      u.attacking = false;
      u.attackCooldown = Math.max(0, (u.attackCooldown || 0) - dt);
      let closest = null, minD = Infinity;
      def.units.forEach(e => {
        const d = Math.abs(u.x - e.x);
        if (d < minD) { minD = d; closest = e; }
      });
      if (closest && minD <= u.range) {
        u.attacking = true;
        if (u.attackCooldown <= 0) {
          closest.hp -= u.attack;
          u.attackCooldown = 1;
          if (u.range > 50) {
            this.projectiles.push({
              x: u.x, y: CONSTANTS.GROUND_Y - 20,
              tx: closest.x, ty: CONSTANTS.GROUND_Y - 15,
              speed: 8, owner: atkPn, age: u.age
            });
          }
          if (closest.hp <= 0) {
            atk.gold += closest.cost * CONSTANTS.GOLD_PER_KILL_MULTIPLIER;
            atk.xp += closest.cost;
          }
        }
      }
    });
  }

  turretsFire(pn, dt) {
    const p = this.getPlayer(pn);
    const o = this.getOpponent(pn);
    p.turrets.forEach((t, i) => {
      if (!t) return;
      t.lastFireTime += dt * 1000;
      let target = null, minD = Infinity;
      o.units.forEach(u => {
        const d = Math.abs(t.x - u.x);
        if (d <= t.range && d < minD) { minD = d; target = u; }
      });
      if (target && t.lastFireTime >= t.fireRate) {
        target.hp -= t.attack;
        t.lastFireTime = 0;
        const ty = CONSTANTS.GROUND_Y - 100 - i * 30;
        this.projectiles.push({
          x: t.x, y: ty,
          tx: target.x, ty: CONSTANTS.GROUND_Y - 15,
          speed: 6, owner: pn, age: t.age
        });
        if (target.hp <= 0) {
          p.gold += target.cost * CONSTANTS.GOLD_PER_KILL_MULTIPLIER * 0.5;
        }
      }
    });
  }

  baseAttack(pn, dt) {
    const p = this.getPlayer(pn);
    const o = this.getOpponent(pn);
    const bx = pn === 1 ? CONSTANTS.BASE_POSITIONS.player1 : CONSTANTS.BASE_POSITIONS.player2;
    o.units.forEach(u => {
      if (Math.abs(u.x - bx) <= u.range + 30) {
        u.attacking = true;
        if (u.attackCooldown <= 0) {
          p.baseHp -= u.attack;
          u.attackCooldown = 1;
        }
      }
    });
  }

  updateProjectiles(dt) {
    this.projectiles = this.projectiles.filter(p => {
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) return false;
      p.x += (dx / dist) * p.speed;
      p.y += (dy / dist) * p.speed;
      return true;
    });
  }

  cleanup(pn) {
    this.getPlayer(pn).units = this.getPlayer(pn).units.filter(u => u.hp > 0);
  }

  checkWin() {
    if (this.player1.baseHp <= 0) {
      this.isOver = true; this.winner = 2; this.winReason = 'Base detruite';
    } else if (this.player2.baseHp <= 0) {
      this.isOver = true; this.winner = 1; this.winReason = 'Base detruite';
    }
  }

  serialize() {
    const s = (p) => ({
      name: p.name, gold: Math.floor(p.gold), age: p.age,
      baseHp: Math.floor(Math.max(0, p.baseHp)), baseMaxHp: p.baseMaxHp,
      xp: Math.floor(p.xp),
      specialCooldown: Math.max(0, Math.ceil(p.specialCooldown)),
      turretSlots: p.turretSlots,
      turrets: p.turrets,
      units: p.units.map(u => ({
        id: u.id, type: u.type, age: u.age, name: u.name,
        hp: Math.floor(u.hp), maxHp: u.maxHp,
        x: Math.round(u.x), y: u.y,
        direction: u.direction, attacking: u.attacking,
        walkFrame: u.walkFrame || 0
      })),
      trainingQueue: p.trainingQueue.map(t => ({
        unitType: t.unitType, timeLeft: Math.max(0, +t.timeLeft.toFixed(1))
      }))
    });
    return {
      gameTime: Math.floor(this.gameTime),
      player1: s(this.player1),
      player2: s(this.player2),
      projectiles: this.projectiles.map(p => ({
        x: Math.round(p.x), y: Math.round(p.y), owner: p.owner, age: p.age
      }))
    };
  }
}

module.exports = GameState;