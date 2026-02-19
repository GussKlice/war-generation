// shared/constants.js
const CONSTANTS = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 400,
  
  // Âges
  AGES: {
    STONE: 0,
    MEDIEVAL: 1,
    RENAISSANCE: 2,
    MODERN: 3,
    FUTURE: 4
  },
  
  AGE_NAMES: ['Âge de Pierre', 'Moyen-Âge', 'Renaissance', 'Ère Moderne', 'Futur'],
  
  AGE_UPGRADE_COST: [0, 500, 1500, 4000, 10000],
  
  // Unités par âge
  UNITS: {
    // ÂGE DE PIERRE
    0: {
      MELEE: { name: 'Caveman', hp: 50, attack: 10, speed: 1.5, cost: 50, trainTime: 3000, range: 30 },
      RANGED: { name: 'Slinger', hp: 30, attack: 8, speed: 1.2, cost: 75, trainTime: 4000, range: 150 },
      TANK: { name: 'Dino Rider', hp: 120, attack: 15, speed: 0.8, cost: 150, trainTime: 6000, range: 30 }
    },
    // MOYEN-ÂGE
    1: {
      MELEE: { name: 'Swordsman', hp: 80, attack: 18, speed: 1.5, cost: 100, trainTime: 3000, range: 30 },
      RANGED: { name: 'Archer', hp: 45, attack: 14, speed: 1.2, cost: 125, trainTime: 4000, range: 200 },
      TANK: { name: 'Knight', hp: 200, attack: 25, speed: 0.8, cost: 250, trainTime: 6000, range: 30 }
    },
    // RENAISSANCE
    2: {
      MELEE: { name: 'Musketeer', hp: 100, attack: 30, speed: 1.5, cost: 200, trainTime: 3000, range: 30 },
      RANGED: { name: 'Cannoneer', hp: 60, attack: 25, speed: 1.0, cost: 250, trainTime: 5000, range: 250 },
      TANK: { name: 'Cavalry', hp: 300, attack: 40, speed: 1.0, cost: 400, trainTime: 7000, range: 30 }
    },
    // ÈRE MODERNE
    3: {
      MELEE: { name: 'Marine', hp: 150, attack: 45, speed: 1.8, cost: 350, trainTime: 3000, range: 30 },
      RANGED: { name: 'Sniper', hp: 80, attack: 50, speed: 1.0, cost: 400, trainTime: 5000, range: 300 },
      TANK: { name: 'Tank', hp: 500, attack: 60, speed: 0.6, cost: 700, trainTime: 8000, range: 30 }
    },
    // FUTUR
    4: {
      MELEE: { name: 'Cyborg', hp: 250, attack: 70, speed: 2.0, cost: 600, trainTime: 3000, range: 30 },
      RANGED: { name: 'Laser Trooper', hp: 120, attack: 80, speed: 1.2, cost: 700, trainTime: 5000, range: 350 },
      TANK: { name: 'Mech', hp: 800, attack: 100, speed: 0.5, cost: 1200, trainTime: 10000, range: 30 }
    }
  },
  
  // Tourelles
  TURRETS: {
    0: { name: 'Rock Turret', hp: 200, attack: 12, range: 180, cost: 200, fireRate: 2000 },
    1: { name: 'Arrow Tower', hp: 300, attack: 20, range: 220, cost: 400, fireRate: 1500 },
    2: { name: 'Cannon Tower', hp: 400, attack: 35, range: 260, cost: 600, fireRate: 2500 },
    3: { name: 'Machine Gun', hp: 500, attack: 50, range: 300, cost: 900, fireRate: 800 },
    4: { name: 'Laser Tower', hp: 700, attack: 80, range: 350, cost: 1500, fireRate: 600 }
  },
  
  // Base
  BASE_HP: 1000,
  BASE_POSITIONS: { player1: 50, player2: 1150 },
  
  TURRET_SLOTS: 3,
  
  // Économie
  STARTING_GOLD: 200,
  GOLD_PER_KILL_MULTIPLIER: 0.5,
  PASSIVE_GOLD_RATE: 10, // or par seconde
  
  // Réseau
  TICK_RATE: 20, // 20 updates/seconde
  
  // Attaque spéciale
  SPECIAL_ATTACK_COST: 500,
  SPECIAL_ATTACK_DAMAGE: 200,
  SPECIAL_ATTACK_COOLDOWN: 30000,
};

if (typeof module !== 'undefined') module.exports = CONSTANTS;