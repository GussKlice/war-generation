class UI {
  constructor() {
    this.screens = {
      menu: document.getElementById('menu-screen'),
      game: document.getElementById('game-screen'),
      gameover: document.getElementById('gameover-screen')
    };
  }

  showScreen(name) {
    Object.values(this.screens).forEach(function (s) { s.classList.remove('active'); });
    this.screens[name].classList.add('active');
  }

  showQueue() {
    document.getElementById('queue-status').classList.remove('hidden');
    document.getElementById('btn-play').classList.add('hidden');
    document.querySelector('.solo-section').classList.add('hidden');
  }

  hideQueue() {
    document.getElementById('queue-status').classList.add('hidden');
    document.getElementById('btn-play').classList.remove('hidden');
    document.querySelector('.solo-section').classList.remove('hidden');
  }

  getUnitDefs(age) {
    var UNITS = {
      0: { MELEE: { name: 'Caveman', cost: 50, icon: '🪓' }, RANGED: { name: 'Slinger', cost: 75, icon: '🪨' }, TANK: { name: 'Dino Rider', cost: 150, icon: '🦕' } },
      1: { MELEE: { name: 'Swordsman', cost: 100, icon: '⚔️' }, RANGED: { name: 'Archer', cost: 125, icon: '🏹' }, TANK: { name: 'Knight', cost: 250, icon: '🐴' } },
      2: { MELEE: { name: 'Musketeer', cost: 200, icon: '🔫' }, RANGED: { name: 'Cannoneer', cost: 250, icon: '💣' }, TANK: { name: 'Cavalry', cost: 400, icon: '🐎' } },
      3: { MELEE: { name: 'Marine', cost: 350, icon: '🎖️' }, RANGED: { name: 'Sniper', cost: 400, icon: '🎯' }, TANK: { name: 'Tank', cost: 700, icon: '🛡️' } },
      4: { MELEE: { name: 'Cyborg', cost: 600, icon: '🤖' }, RANGED: { name: 'Laser', cost: 700, icon: '🔮' }, TANK: { name: 'Mech', cost: 1200, icon: '🦾' } }
    };
    return UNITS[age] || UNITS[0];
  }

  getTurretDef(age) {
    var T = {
      0: { name: 'Rock Turret', cost: 200 },
      1: { name: 'Arrow Tower', cost: 400 },
      2: { name: 'Cannon Tower', cost: 600 },
      3: { name: 'Machine Gun', cost: 900 },
      4: { name: 'Laser Tower', cost: 1500 }
    };
    return T[age] || T[0];
  }

  updateHUD(state, myPn) {
    if (!state) return;
    var p1 = state.player1;
    var p2 = state.player2;
    var me = myPn === 1 ? p1 : p2;
    var AGE_NAMES = ['Âge de Pierre', 'Moyen-Âge', 'Renaissance', 'Ère Moderne', 'Futur'];
    var AGE_COSTS = [0, 500, 1500, 4000, 10000];
    var SLOT_COSTS = [50, 150, 500];

    // Noms et HP
    document.getElementById('p1-name').textContent = p1.name;
    document.getElementById('p2-name').textContent = p2.name;
    var p1p = Math.max(0, (p1.baseHp / p1.baseMaxHp) * 100);
    var p2p = Math.max(0, (p2.baseHp / p2.baseMaxHp) * 100);
    document.getElementById('p1-hp-bar').style.width = p1p + '%';
    document.getElementById('p2-hp-bar').style.width = p2p + '%';
    document.getElementById('p1-hp-text').textContent = Math.max(0, p1.baseHp) + '/' + p1.baseMaxHp;
    document.getElementById('p2-hp-text').textContent = Math.max(0, p2.baseHp) + '/' + p2.baseMaxHp;
    document.getElementById('p1-age').textContent = AGE_NAMES[p1.age];
    document.getElementById('p2-age').textContent = AGE_NAMES[p2.age];

    // Timer
    var min = Math.floor(state.gameTime / 60);
    var sec = state.gameTime % 60;
    document.getElementById('timer-text').textContent = min + ':' + (sec < 10 ? '0' : '') + sec;

    // Gold
    document.getElementById('gold-amount').textContent = Math.floor(me.gold);

    // Unit buttons
    var defs = this.getUnitDefs(me.age);
    var types = ['MELEE', 'RANGED', 'TANK'];
    var btnIds = ['btn-melee', 'btn-ranged', 'btn-tank'];
    for (var i = 0; i < 3; i++) {
      var btn = document.getElementById(btnIds[i]);
      var def = defs[types[i]];
      btn.querySelector('.uicon').textContent = def.icon;
      btn.querySelector('.uname').textContent = def.name;
      btn.querySelector('.ucost').textContent = def.cost + 'g';
      if (me.gold < def.cost) btn.classList.add('disabled');
      else btn.classList.remove('disabled');
    }

    // Turret slot buttons
    var tDef = this.getTurretDef(me.age);
    for (var j = 0; j < 3; j++) {
      var tb = document.getElementById('btn-turret-' + j);
      if (me.turrets[j]) {
        tb.innerHTML = '✅ ' + me.turrets[j].name;
        tb.className = 'tbtn built disabled';
      } else if (me.turretSlots[j]) {
        tb.innerHTML = '🗼 ' + tDef.name + ' (' + tDef.cost + 'g)<span class="hkey">[' + ['Q','W','E'][j] + ']</span>';
        tb.className = 'tbtn unlocked';
        if (me.gold < tDef.cost) tb.classList.add('disabled');
      } else {
        var canUnlock = (j === 0) || me.turretSlots[j - 1];
        tb.innerHTML = '🔒 Slot ' + (j + 1) + ' (' + SLOT_COSTS[j] + 'g)<span class="hkey">[' + ['Q','W','E'][j] + ']</span>';
        tb.className = 'tbtn';
        if (!canUnlock || me.gold < SLOT_COSTS[j]) tb.classList.add('disabled');
      }
    }

    // Upgrade age
    var nextAge = me.age + 1;
    var upBtn = document.getElementById('btn-upgrade-age');
    if (nextAge <= 4) {
      document.getElementById('upgrade-cost').textContent = AGE_COSTS[nextAge] + 'g';
      if (me.gold < AGE_COSTS[nextAge]) upBtn.classList.add('disabled');
      else upBtn.classList.remove('disabled');
    } else {
      document.getElementById('upgrade-cost').textContent = 'MAX';
      upBtn.classList.add('disabled');
    }

    // Special
    var spBtn = document.getElementById('btn-special');
    if (me.specialCooldown > 0) {
      spBtn.classList.add('disabled');
      spBtn.innerHTML = '💥 ' + Math.ceil(me.specialCooldown) + 's';
    } else {
      spBtn.innerHTML = '💥 Spécial<span class="scost">500g</span><span class="hkey">[F]</span>';
      if (me.gold < 500) spBtn.classList.add('disabled');
      else spBtn.classList.remove('disabled');
    }

    // Training queue
    var qc = document.getElementById('queue-items');
    qc.innerHTML = '';
    if (me.trainingQueue.length === 0) {
      qc.innerHTML = '<span style="color:#555;font-size:.7em">Vide</span>';
    } else {
      var qdefs = this.getUnitDefs(me.age);
      me.trainingQueue.forEach(function (item, idx) {
        var d = document.createElement('div');
        d.className = 'qi';
        var icon = qdefs[item.unitType] ? qdefs[item.unitType].icon : '?';
        d.innerHTML = icon + ' <span class="qt">' + item.timeLeft + 's</span>';
        if (idx === 0) d.style.borderLeft = '2px solid #ffd700';
        qc.appendChild(d);
      });
    }
  }

  showGameOver(winner, myPn, reason) {
    this.showScreen('gameover');
    var title = document.getElementById('gameover-title');
    if (winner === myPn) {
      title.textContent = '🏆 VICTOIRE !';
      title.className = 'victory';
    } else {
      title.textContent = '💀 DÉFAITE...';
      title.className = 'defeat';
    }
    document.getElementById('gameover-reason').textContent = reason || 'Partie terminée';
  }
}