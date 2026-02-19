// client/js/ui.js
class UI {
  constructor() {
    this.screens = {
      menu: document.getElementById('menu-screen'),
      game: document.getElementById('game-screen'),
      gameover: document.getElementById('gameover-screen')
    };
  }

  showScreen(screenName) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[screenName].classList.add('active');
  }

  showQueue() {
    document.getElementById('queue-status').classList.remove('hidden');
    document.getElementById('btn-play').classList.add('hidden');
  }

  hideQueue() {
    document.getElementById('queue-status').classList.add('hidden');
    document.getElementById('btn-play').classList.remove('hidden');
  }

  // ===== Définitions des unités par âge (miroir du serveur) =====
  getUnitDefs(age) {
    const UNITS = {
      0: {
        MELEE:  { name: 'Caveman',     cost: 50,   icon: '🪓' },
        RANGED: { name: 'Slinger',     cost: 75,   icon: '🪨' },
        TANK:   { name: 'Dino Rider',  cost: 150,  icon: '🦕' }
      },
      1: {
        MELEE:  { name: 'Swordsman',   cost: 100,  icon: '⚔️' },
        RANGED: { name: 'Archer',      cost: 125,  icon: '🏹' },
        TANK:   { name: 'Knight',      cost: 250,  icon: '🐴' }
      },
      2: {
        MELEE:  { name: 'Musketeer',   cost: 200,  icon: '🔫' },
        RANGED: { name: 'Cannoneer',   cost: 250,  icon: '💣' },
        TANK:   { name: 'Cavalry',     cost: 400,  icon: '🐎' }
      },
      3: {
        MELEE:  { name: 'Marine',      cost: 350,  icon: '🎖️' },
        RANGED: { name: 'Sniper',      cost: 400,  icon: '🎯' },
        TANK:   { name: 'Tank',        cost: 700,  icon: '🛡️' }
      },
      4: {
        MELEE:  { name: 'Cyborg',      cost: 600,  icon: '🤖' },
        RANGED: { name: 'Laser Troop', cost: 700,  icon: '🔮' },
        TANK:   { name: 'Mech',        cost: 1200, icon: '🦾' }
      }
    };
    return UNITS[age] || UNITS[0];
  }

  getTurretDef(age) {
    const TURRETS = {
      0: { name: 'Rock Turret',   cost: 200 },
      1: { name: 'Arrow Tower',   cost: 400 },
      2: { name: 'Cannon Tower',  cost: 600 },
      3: { name: 'Machine Gun',   cost: 900 },
      4: { name: 'Laser Tower',   cost: 1500 }
    };
    return TURRETS[age] || TURRETS[0];
  }

  // ===== Mettre à jour les boutons d'unités =====
  updateUnitButtons(player) {
    const defs = this.getUnitDefs(player.age);

    // MELEE
    const btnMelee = document.getElementById('btn-melee');
    btnMelee.querySelector('.unit-icon').textContent = defs.MELEE.icon;
    btnMelee.querySelector('.unit-name').textContent = defs.MELEE.name;
    btnMelee.querySelector('.unit-cost').textContent = `${defs.MELEE.cost}g`;
    btnMelee.classList.toggle('disabled', player.gold < defs.MELEE.cost);

    // RANGED
    const btnRanged = document.getElementById('btn-ranged');
    btnRanged.querySelector('.unit-icon').textContent = defs.RANGED.icon;
    btnRanged.querySelector('.unit-name').textContent = defs.RANGED.name;
    btnRanged.querySelector('.unit-cost').textContent = `${defs.RANGED.cost}g`;
    btnRanged.classList.toggle('disabled', player.gold < defs.RANGED.cost);

    // TANK
    const btnTank = document.getElementById('btn-tank');
    btnTank.querySelector('.unit-icon').textContent = defs.TANK.icon;
    btnTank.querySelector('.unit-name').textContent = defs.TANK.name;
    btnTank.querySelector('.unit-cost').textContent = `${defs.TANK.cost}g`;
    btnTank.classList.toggle('disabled', player.gold < defs.TANK.cost);

    // Turret buttons
    const turretDef = this.getTurretDef(player.age);
    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`btn-turret-${i}`);
      if (player.turrets[i] !== null) {
        btn.textContent = '✅ Construit';
        btn.classList.add('disabled');
      } else {
        btn.innerHTML = `🗼 ${turretDef.name}<br><span class="unit-cost">${turretDef.cost}g</span><span class="hotkey">[${['Q','W','E'][i]}]</span>`;
        btn.classList.toggle('disabled', player.gold < turretDef.cost);
      }
    }
  }

  // ===== Mettre à jour la queue d'entraînement =====
  updateTrainingQueue(player) {
    const container = document.getElementById('queue-items');
    container.innerHTML = '';

    if (player.trainingQueue.length === 0) {
      container.innerHTML = '<span style="color:#666;font-size:0.8em;">Vide</span>';
      return;
    }

    player.trainingQueue.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'queue-item';
      
      const defs = this.getUnitDefs(player.age);
      const icon = defs[item.unitType]?.icon || '❓';
      
      div.innerHTML = `${icon} <span class="queue-timer">${item.timeLeft}s</span>`;
      
      if (index === 0) {
        div.style.borderLeft = '3px solid #ffd700';
      }
      
      container.appendChild(div);
    });
  }

  // ===== Mettre à jour tout le HUD =====
  updateHUD(gameState, myPlayerNumber) {
    if (!gameState) return;

    const p1 = gameState.player1;
    const p2 = gameState.player2;
    const me = myPlayerNumber === 1 ? p1 : p2;

    const AGE_NAMES = ['Âge de Pierre', 'Moyen-Âge', 'Renaissance', 'Ère Moderne', 'Futur'];
    const AGE_UPGRADE_COST = [0, 500, 1500, 4000, 10000];

    // Noms
    document.getElementById('p1-name').textContent = p1.name;
    document.getElementById('p2-name').textContent = p2.name;

    // Barres de vie
    const p1Percent = Math.max(0, (p1.baseHp / p1.baseMaxHp) * 100);
    const p2Percent = Math.max(0, (p2.baseHp / p2.baseMaxHp) * 100);
    document.getElementById('p1-hp-bar').style.width = `${p1Percent}%`;
    document.getElementById('p2-hp-bar').style.width = `${p2Percent}%`;
    document.getElementById('p1-hp-text').textContent = `${Math.max(0, p1.baseHp)}/${p1.baseMaxHp}`;
    document.getElementById('p2-hp-text').textContent = `${Math.max(0, p2.baseHp)}/${p2.baseMaxHp}`;

    // Âges
    document.getElementById('p1-age').textContent = AGE_NAMES[p1.age];
    document.getElementById('p2-age').textContent = AGE_NAMES[p2.age];

    // Timer
    const minutes = Math.floor(gameState.gameTime / 60);
    const seconds = gameState.gameTime % 60;
    document.getElementById('timer-text').textContent =
      `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Or
    document.getElementById('gold-amount').textContent = Math.floor(me.gold);

    // Boutons d'unités et tourelles
    this.updateUnitButtons(me);

    // Queue d'entraînement
    this.updateTrainingQueue(me);

    // Bouton d'évolution d'âge
    const nextAge = me.age + 1;
    const upgradeBtn = document.getElementById('btn-upgrade-age');
    if (nextAge <= 4) {
      document.getElementById('upgrade-cost').textContent = `${AGE_UPGRADE_COST[nextAge]}g`;
      upgradeBtn.classList.toggle('disabled', me.gold < AGE_UPGRADE_COST[nextAge]);
    } else {
      document.getElementById('upgrade-cost').textContent = 'MAX';
      upgradeBtn.classList.add('disabled');
    }

    // Bouton spécial
    const specialBtn = document.getElementById('btn-special');
    if (me.specialCooldown > 0) {
      specialBtn.classList.add('disabled');
      specialBtn.innerHTML = `💥 Spécial<br><span class="upgrade-cost">${Math.ceil(me.specialCooldown)}s</span>`;
    } else {
      specialBtn.classList.toggle('disabled', me.gold < 500);
      specialBtn.innerHTML = `💥 Spécial<br><span class="upgrade-cost">500g</span><span class="hotkey">[F]</span>`;
    }
  }

  // ===== Afficher l'écran de fin =====
  showGameOver(winner, myPlayerNumber, reason) {
    this.showScreen('gameover');
    
    const title = document.getElementById('gameover-title');
    const reasonEl = document.getElementById('gameover-reason');

    if (winner === myPlayerNumber) {
      title.textContent = '🏆 VICTOIRE !';
      title.className = 'victory';
    } else {
      title.textContent = '💀 DÉFAITE...';
      title.className = 'defeat';
    }

    reasonEl.textContent = reason || 'La partie est terminée';
  }
}