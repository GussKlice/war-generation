const CONSTANTS = require('../shared/constants');

class AI {
  constructor(difficulty) {
    this.difficulty = difficulty || 'normal';
    this.spawnTimer = 0;
    this.thinkTimer = 0;
    this.cfg = this.loadConfig(this.difficulty);
  }

  loadConfig(d) {
    const cfgs = {
      easy:       { thinkCD: 3.0, spawnCD: 4.0, mistake: 0.30, upgRatio: 2.0, turretC: 0.15, specC: 0.10 },
      normal:     { thinkCD: 2.0, spawnCD: 2.5, mistake: 0.12, upgRatio: 1.4, turretC: 0.35, specC: 0.25 },
      hard:       { thinkCD: 1.2, spawnCD: 1.5, mistake: 0.03, upgRatio: 1.1, turretC: 0.55, specC: 0.45 },
      impossible: { thinkCD: 0.5, spawnCD: 0.8, mistake: 0.00, upgRatio: 1.0, turretC: 0.80, specC: 0.60 }
    };
    return cfgs[d] || cfgs.normal;
  }

  update(dt, gameState, pn) {
    const actions = [];
    this.thinkTimer += dt;
    this.spawnTimer += dt;

    if (this.thinkTimer >= this.cfg.thinkCD) {
      this.thinkTimer = 0;
      if (Math.random() >= this.cfg.mistake) {
        actions.push(...this.think(gameState, pn));
      }
    }
    if (this.spawnTimer >= this.cfg.spawnCD) {
      this.spawnTimer = 0;
      if (Math.random() >= this.cfg.mistake) {
        const a = this.pickUnit(gameState, pn);
        if (a) actions.push(a);
      }
    }
    return actions;
  }

  think(gs, pn) {
    const me = gs.getPlayer(pn);
    const opp = gs.getOpponent(pn);
    const actions = [];

    // Évoluer d'âge
    if (me.age < 4) {
      const cost = CONSTANTS.AGE_UPGRADE_COST[me.age + 1];
      if (me.gold >= cost * this.cfg.upgRatio) {
        actions.push({ type: 'upgrade_age' });
        return actions;
      }
    }

    // Débloquer slot tourelle
    for (let i = 0; i < 3; i++) {
      if (!me.turretSlots[i]) {
        if (me.gold >= CONSTANTS.TURRET_SLOT_COSTS[i] && Math.random() < this.cfg.turretC) {
          actions.push({ type: 'unlock_turret_slot', slot: i });
        }
        break;
      }
    }

    // Construire tourelle
    for (let i = 0; i < 3; i++) {
      if (me.turretSlots[i] && !me.turrets[i]) {
        const cost = CONSTANTS.TURRETS[me.age].cost;
        if (me.gold >= cost && Math.random() < this.cfg.turretC) {
          actions.push({ type: 'build_turret', slot: i });
          break;
        }
      }
    }

    // Attaque spéciale
    if (me.specialCooldown <= 0 && me.gold >= CONSTANTS.SPECIAL_ATTACK_COST) {
      const myHp = me.baseHp / me.baseMaxHp;
      if ((opp.units.length >= 5 || myHp < 0.3) && Math.random() < this.cfg.specC) {
        actions.push({ type: 'special_attack' });
      }
    }

    return actions;
  }

  pickUnit(gs, pn) {
    const me = gs.getPlayer(pn);
    const opp = gs.getOpponent(pn);
    const defs = CONSTANTS.UNITS[me.age];
    if (!defs) return null;

    let type;
    const myHp = me.baseHp / me.baseMaxHp;

    if (opp.units.length > me.units.length + 3 || myHp < 0.35) {
      type = me.gold >= defs.TANK.cost ? 'TANK' : 'MELEE';
    } else {
      const r = Math.random();
      if (r < 0.4) type = 'MELEE';
      else if (r < 0.75) type = 'RANGED';
      else type = 'TANK';
    }

    if (me.gold >= defs[type].cost) {
      return { type: 'spawn_unit', unitType: type };
    }
    return null;
  }
}

module.exports = AI;