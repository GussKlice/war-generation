class Renderer {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width;
    this.H = canvas.height;
    this.time = 0;
    this.shakeAmount = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.trails = [];

    // Nuages
    this.clouds = [];
    for (var i = 0; i < 10; i++) {
      this.clouds.push({
        x: Math.random() * 1400 - 100,
        y: 15 + Math.random() * 80,
        w: 50 + Math.random() * 100,
        h: 15 + Math.random() * 20,
        s: 0.15 + Math.random() * 0.35,
        opacity: 0.08 + Math.random() * 0.15
      });
    }

    // Etoiles
    this.stars = [];
    for (var j = 0; j < 50; j++) {
      this.stars.push({ x: Math.random() * 1200, y: Math.random() * 120, s: Math.random() * 1.5 + 0.5 });
    }

    // Arbres
    this.trees = [];
    for (var k = 0; k < 12; k++) {
      var tx = 160 + Math.random() * 880;
      this.trees.push({ x: tx, type: Math.floor(Math.random() * 3), size: 0.7 + Math.random() * 0.6 });
    }

    // Poussière ambiante
    this.dust = [];
    for (var d = 0; d < 20; d++) {
      this.dust.push({
        x: Math.random() * 1200, y: 300 + Math.random() * 100,
        vx: 0.2 + Math.random() * 0.5, vy: -0.1 + Math.random() * 0.2,
        life: Math.random() * 200, maxLife: 200, size: 1 + Math.random() * 2
      });
    }

    // Cache pour les dégradés
    this._gradCache = {};

    // Précédent état pour détecter les changements
    this.prevState = null;
  }

  // ===========================
  //  RENDU PRINCIPAL
  // ===========================
  render(state, myPn) {
    if (!state) return;
    this.time += 0.016;
    var ctx = this.ctx;

    // Screen shake
    ctx.save();
    if (this.shakeAmount > 0) {
      var sx = (Math.random() - 0.5) * this.shakeAmount;
      var sy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(sx, sy);
      this.shakeAmount *= 0.9;
      if (this.shakeAmount < 0.5) this.shakeAmount = 0;
    }

    ctx.clearRect(-10, -10, this.W + 20, this.H + 20);

    // Fond
    this.drawSky(ctx, state);
    this.drawStars(ctx);
    this.drawClouds(ctx);
    this.drawMountains(ctx);
    this.drawGround(ctx);
    this.drawTrees(ctx);

    // Bases
    this.drawBase(ctx, 80, state.player1, 1);
    this.drawBase(ctx, 1120, state.player2, 2);

    // Trails
    this.drawTrails(ctx);

    // Unités (triées par Y pour profondeur)
    var allUnits = [];
    state.player1.units.forEach(function(u) { allUnits.push({ u: u, pn: 1 }); });
    state.player2.units.forEach(function(u) { allUnits.push({ u: u, pn: 2 }); });
    allUnits.sort(function(a, b) { return a.u.y - b.u.y; });
    var self = this;
    allUnits.forEach(function(item) { self.drawUnit(ctx, item.u, item.pn); });

    // Projectiles
    if (state.projectiles) {
      state.projectiles.forEach(function(p) { self.drawProjectile(ctx, p); });
    }

    // Effets
    this.drawDust(ctx);
    this.drawParticles(ctx);
    this.drawFloatingTexts(ctx);

    // Détecter changements
    this.detectEvents(state);
    this.prevState = state;

    ctx.restore();
  }

  // ===========================
  //  CIEL DYNAMIQUE
  // ===========================
  drawSky(ctx, state) {
    var cycle = (Math.sin(this.time * 0.05) + 1) / 2; // 0 à 1
    var g = ctx.createLinearGradient(0, 0, 0, 300);

    // Interpolation jour/nuit
    var r1 = Math.floor(20 + cycle * 100);
    var g1 = Math.floor(20 + cycle * 140);
    var b1 = Math.floor(60 + cycle * 140);
    var r2 = Math.floor(150 + cycle * 50);
    var g2 = Math.floor(120 + cycle * 80);
    var b2 = Math.floor(80 + cycle * 40);

    g.addColorStop(0, 'rgb(' + r1 + ',' + g1 + ',' + b1 + ')');
    g.addColorStop(0.6, 'rgb(' + r2 + ',' + g2 + ',' + b2 + ')');
    g.addColorStop(1, '#c9a96e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, 300);

    // Soleil/Lune
    var sunX = 600 + Math.cos(this.time * 0.05) * 400;
    var sunY = 60 + Math.sin(this.time * 0.05) * 40;

    if (cycle > 0.3) {
      // Soleil
      ctx.fillStyle = 'rgba(255,220,100,0.15)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,200,50,0.3)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe082';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Lune
      ctx.fillStyle = 'rgba(200,200,255,0.1)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dde';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawStars(ctx) {
    var cycle = (Math.sin(this.time * 0.05) + 1) / 2;
    if (cycle < 0.5) {
      var alpha = (0.5 - cycle) * 2;
      ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.6) + ')';
      var self = this;
      this.stars.forEach(function(s) {
        var twinkle = 0.5 + Math.sin(self.time * 3 + s.x) * 0.5;
        ctx.globalAlpha = alpha * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
  }

  // ===========================
  //  NUAGES
  // ===========================
  drawClouds(ctx) {
    var self = this;
    this.clouds.forEach(function(c) {
      c.x += c.s;
      if (c.x > 1300) c.x = -150;
      ctx.fillStyle = 'rgba(255,255,255,' + c.opacity + ')';
      // Forme organique
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.25, c.y - c.h * 0.2, c.w * 0.35, c.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x - c.w * 0.2, c.y + c.h * 0.15, c.w * 0.4, c.h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ===========================
  //  MONTAGNES PARALLAXE
  // ===========================
  drawMountains(ctx) {
    // Layer 1 - lointain
    ctx.fillStyle = '#1a2a2a';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    for (var x = 0; x <= this.W; x += 3) {
      var h = Math.sin(x * 0.005) * 50 + Math.cos(x * 0.011) * 30 + Math.sin(x * 0.003 + 2) * 20;
      ctx.lineTo(x, 180 + h);
    }
    ctx.lineTo(this.W, 290);
    ctx.fill();

    // Neige sur les sommets
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    for (var x2 = 0; x2 <= this.W; x2 += 3) {
      var h2 = Math.sin(x2 * 0.005) * 50 + Math.cos(x2 * 0.011) * 30 + Math.sin(x2 * 0.003 + 2) * 20;
      var peak = 180 + h2;
      if (peak < 200) ctx.lineTo(x2, peak);
      else ctx.lineTo(x2, 290);
    }
    ctx.lineTo(this.W, 290);
    ctx.fill();

    // Layer 2 - plus proche
    ctx.fillStyle = '#2d3d3d';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    for (var x3 = 0; x3 <= this.W; x3 += 3) {
      var h3 = Math.sin(x3 * 0.008 + 1) * 35 + Math.cos(x3 * 0.015) * 20;
      ctx.lineTo(x3, 230 + h3);
    }
    ctx.lineTo(this.W, 290);
    ctx.fill();

    // Layer 3 - collines
    ctx.fillStyle = '#3a4a3a';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    for (var x4 = 0; x4 <= this.W; x4 += 3) {
      var h4 = Math.sin(x4 * 0.012 + 3) * 20 + Math.cos(x4 * 0.02 + 1) * 10;
      ctx.lineTo(x4, 260 + h4);
    }
    ctx.lineTo(this.W, 290);
    ctx.fill();
  }

  // ===========================
  //  SOL DÉTAILLÉ
  // ===========================
  drawGround(ctx) {
    // Herbe
    var gg = ctx.createLinearGradient(0, 280, 0, 310);
    gg.addColorStop(0, '#5a7a3a');
    gg.addColorStop(1, '#4a6a2a');
    ctx.fillStyle = gg;
    ctx.fillRect(0, 280, this.W, 30);

    // Terre
    var tg = ctx.createLinearGradient(0, 310, 0, this.H);
    tg.addColorStop(0, '#6b5033');
    tg.addColorStop(0.3, '#5a4228');
    tg.addColorStop(1, '#4a3218');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 310, this.W, this.H - 310);

    // Brins d'herbe
    ctx.strokeStyle = '#6b9a3e';
    ctx.lineWidth = 1.5;
    for (var x = 0; x < this.W; x += 8) {
      var sway = Math.sin(this.time * 2 + x * 0.1) * 3;
      ctx.beginPath();
      ctx.moveTo(x, 282);
      ctx.quadraticCurveTo(x + sway, 272, x + sway * 1.5, 268 - Math.random() * 5);
      ctx.stroke();
    }

    // Chemin de terre
    ctx.fillStyle = '#7a6843';
    ctx.beginPath();
    ctx.moveTo(0, 388);
    for (var px = 0; px <= this.W; px += 20) {
      ctx.lineTo(px, 388 + Math.sin(px * 0.02) * 3);
    }
    for (var px2 = this.W; px2 >= 0; px2 -= 20) {
      ctx.lineTo(px2, 408 + Math.sin(px2 * 0.02) * 2);
    }
    ctx.fill();

    // Texture chemin
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (var i = 0; i < 40; i++) {
      var rx = (i * 31 + 7) % this.W;
      var ry = 390 + ((i * 17) % 15);
      ctx.fillRect(rx, ry, 3 + (i % 4), 2);
    }

    // Cailloux
    ctx.fillStyle = '#8a7a6a';
    for (var c = 0; c < 15; c++) {
      var cx = (c * 83 + 20) % this.W;
      var cy = 392 + (c * 7) % 12;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 2 + c % 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ===========================
  //  ARBRES DÉCORATIFS
  // ===========================
  drawTrees(ctx) {
    var self = this;
    this.trees.forEach(function(tree) {
      var x = tree.x;
      var s = tree.size;
      var baseY = 280;
      var sway = Math.sin(self.time * 1.5 + x * 0.05) * 2 * s;

      // Tronc
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 3 * s, baseY - 25 * s, 6 * s, 25 * s);

      // Feuillage
      if (tree.type === 0) {
        // Arbre rond
        ctx.fillStyle = '#3a6a2a';
        ctx.beginPath();
        ctx.arc(x + sway, baseY - 35 * s, 18 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a7a3a';
        ctx.beginPath();
        ctx.arc(x - 5 * s + sway, baseY - 40 * s, 12 * s, 0, Math.PI * 2);
        ctx.fill();
      } else if (tree.type === 1) {
        // Sapin
        ctx.fillStyle = '#2a5a1a';
        ctx.beginPath();
        ctx.moveTo(x + sway, baseY - 55 * s);
        ctx.lineTo(x - 15 * s, baseY - 10 * s);
        ctx.lineTo(x + 15 * s, baseY - 10 * s);
        ctx.fill();
        ctx.fillStyle = '#3a6a2a';
        ctx.beginPath();
        ctx.moveTo(x + sway * 0.8, baseY - 45 * s);
        ctx.lineTo(x - 12 * s, baseY - 18 * s);
        ctx.lineTo(x + 12 * s, baseY - 18 * s);
        ctx.fill();
      } else {
        // Buisson
        ctx.fillStyle = '#4a7a2a';
        ctx.beginPath();
        ctx.ellipse(x + sway, baseY - 12 * s, 15 * s, 12 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ===========================
  //  BASE / CHATEAU
  // ===========================
  drawBase(ctx, bx, player, pn) {
    var age = player.age;
    var h = 100 + age * 18;
    var w = 75 + age * 8;
    var by = 393 - h;
    var col = pn === 1
      ? ['#7a2a2a', '#944040', '#b85050', '#d46060']
      : ['#1a4a6a', '#2a5a7a', '#3a7a9a', '#4a9aba'];

    // Ombre du bâtiment
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(bx, 398, w * 0.7, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tours latérales (âge >= 1)
    if (age >= 1) {
      this._drawTower(ctx, bx - w / 2 - 8, by + 20, 18, h - 20, col, pn);
      this._drawTower(ctx, bx + w / 2 - 10, by + 20, 18, h - 20, col, pn);
    }

    // Mur principal avec dégradé
    var wg = ctx.createLinearGradient(bx - w / 2, 0, bx + w / 2, 0);
    wg.addColorStop(0, col[0]);
    wg.addColorStop(0.3, col[1]);
    wg.addColorStop(0.7, col[1]);
    wg.addColorStop(1, col[0]);
    ctx.fillStyle = wg;
    ctx.fillRect(bx - w / 2, by, w, h);

    // Texture briques
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (var row = 0; row < h; row += 10) {
      var off = (Math.floor(row / 10) % 2) * 8;
      for (var brickX = bx - w / 2 + off; brickX < bx + w / 2; brickX += 16) {
        ctx.strokeRect(brickX, by + row, 16, 10);
      }
    }

    // Ombrage vertical
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(bx - w / 2, by, 8, h);
    ctx.fillRect(bx + w / 2 - 8, by, 8, h);

    // Crénelages
    ctx.fillStyle = col[2];
    var cw = 8;
    for (var cx = bx - w / 2; cx < bx + w / 2; cx += cw * 2) {
      ctx.fillRect(cx, by - 8, cw, 8);
    }

    // Toit central (triangle)
    if (age >= 2) {
      ctx.fillStyle = col[3];
      ctx.beginPath();
      ctx.moveTo(bx - 20, by);
      ctx.lineTo(bx, by - 30 - age * 5);
      ctx.lineTo(bx + 20, by);
      ctx.fill();
    }

    // Porte
    var dw = 18 + age * 2;
    var dh = 28 + age * 3;
    ctx.fillStyle = '#2e1a0e';
    ctx.beginPath();
    ctx.moveTo(bx - dw / 2, 393);
    ctx.lineTo(bx - dw / 2, 393 - dh + 5);
    ctx.quadraticCurveTo(bx, 393 - dh - 8, bx + dw / 2, 393 - dh + 5);
    ctx.lineTo(bx + dw / 2, 393);
    ctx.fill();

    // Détails porte
    ctx.strokeStyle = '#5a4020';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, 393);
    ctx.lineTo(bx, 393 - dh + 5);
    ctx.stroke();

    // Poignée
    ctx.fillStyle = '#c8a83e';
    ctx.beginPath();
    ctx.arc(bx + dw / 5, 393 - dh / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Fenêtres lumineuses
    var winGlow = 0.6 + Math.sin(this.time * 2) * 0.15;
    ctx.fillStyle = 'rgba(255,230,120,' + winGlow + ')';
    ctx.shadowColor = 'rgba(255,200,50,0.4)';
    ctx.shadowBlur = 8;
    ctx.fillRect(bx - w / 3, by + 25, 10, 12);
    ctx.fillRect(bx + w / 3 - 10, by + 25, 10, 12);
    if (age >= 2) {
      ctx.fillRect(bx - w / 4, by + 50, 8, 10);
      ctx.fillRect(bx + w / 4 - 4, by + 50, 8, 10);
    }
    ctx.shadowBlur = 0;

    // Barreaux fenêtres
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - w / 3 + 5, by + 25);
    ctx.lineTo(bx - w / 3 + 5, by + 37);
    ctx.moveTo(bx + w / 3 - 5, by + 25);
    ctx.lineTo(bx + w / 3 - 5, by + 37);
    ctx.stroke();

    // Drapeau animé
    var flagY = age >= 2 ? by - 30 - age * 5 : by;
    ctx.fillStyle = '#222';
    ctx.fillRect(bx - 1, flagY, 2, -30);

    // Tissu du drapeau
    ctx.fillStyle = col[2];
    ctx.beginPath();
    ctx.moveTo(bx + 1, flagY - 30);
    var flagWave = Math.sin(this.time * 4) * 3;
    ctx.quadraticCurveTo(bx + 12, flagY - 27 + flagWave, bx + 22, flagY - 25);
    ctx.quadraticCurveTo(bx + 12, flagY - 20 + flagWave, bx + 1, flagY - 18);
    ctx.fill();

    // TOURELLES SUR LE TOIT
    var slots = [
      { x: bx - 25, y: by + 5 },
      { x: bx, y: by - (age >= 2 ? 25 + age * 5 : 5) },
      { x: bx + 25, y: by + 5 }
    ];

    for (var ti = 0; ti < 3; ti++) {
      this.drawTurretSlot(ctx, slots[ti].x, slots[ti].y, player, ti, pn);
    }

    // Barre de vie
    this.drawHPBar(ctx, bx, by - 55 - age * 5, w + 30, player.baseHp, player.baseMaxHp, pn);
  }

  _drawTower(ctx, x, y, w, h, col, pn) {
    ctx.fillStyle = col[0];
    ctx.fillRect(x, y, w, h);
    // Crénelage tour
    ctx.fillStyle = col[2];
    ctx.fillRect(x, y - 5, 5, 5);
    ctx.fillRect(x + w - 5, y - 5, 5, 5);
    ctx.fillRect(x + w / 2 - 2, y - 5, 5, 5);
    // Fenêtre tour
    ctx.fillStyle = 'rgba(255,230,120,0.5)';
    ctx.fillRect(x + w / 2 - 3, y + 15, 6, 8);
  }

  drawTurretSlot(ctx, sx, sy, player, index, pn) {
    if (player.turrets[index]) {
      var t = player.turrets[index];
      var tCol = pn === 1 ? '#c44' : '#48c';
      var dir = pn === 1 ? 1 : -1;

      // Plateforme
      ctx.fillStyle = '#555';
      ctx.fillRect(sx - 10, sy - 8, 20, 8);

      // Base tourelle
      ctx.fillStyle = '#666';
      ctx.fillRect(sx - 7, sy - 20, 14, 12);

      // Canon
      ctx.fillStyle = tCol;
      ctx.fillRect(sx - 5, sy - 26, 10, 8);

      // Bout du canon
      ctx.fillStyle = '#444';
      var cannonLen = 12 + t.age * 2;
      ctx.fillRect(sx + dir * 5, sy - 24, dir * cannonLen, 4);

      // Flamme de tir
      if (this.time % 0.8 < 0.15) {
        ctx.fillStyle = 'rgba(255,150,0,0.7)';
        ctx.beginPath();
        ctx.arc(sx + dir * (5 + cannonLen), sy - 22, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,100,0.5)';
        ctx.beginPath();
        ctx.arc(sx + dir * (5 + cannonLen), sy - 22, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (player.turretSlots[index]) {
      // Slot débloqué
      ctx.strokeStyle = 'rgba(80,200,80,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(sx - 12, sy - 26, 24, 22);
      ctx.setLineDash([]);

      ctx.fillStyle = '#5a5';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', sx, sy - 11);
    } else {
      // Slot verrouillé
      ctx.fillStyle = 'rgba(80,80,80,0.3)';
      ctx.fillRect(sx - 10, sy - 24, 20, 18);
      ctx.strokeStyle = 'rgba(100,100,100,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 10, sy - 24, 20, 18);

      ctx.fillStyle = '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', sx, sy - 12);
    }
  }

  // ===========================
  //  UNITÉS DÉTAILLÉES
  // ===========================
  drawUnit(ctx, unit, pn) {
    var x = unit.x;
    var groundY = 390;
    var bounce = unit.attacking ? 0 : Math.sin((unit.walkFrame || 0) * 3) * 2;
    var y = groundY + bounce;
    var dir = unit.direction;
    var size = unit.type === 'TANK' ? 17 : unit.type === 'RANGED' ? 12 : 13;
    var pCol = pn === 1 ? '#e74c3c' : '#3498db';

    // Ombre
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, groundY + 4, size * 0.9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    var bodyCol, darkCol;
    if (unit.type === 'MELEE') {
      bodyCol = pn === 1 ? '#c0392b' : '#2471a3';
      darkCol = pn === 1 ? '#922b21' : '#1a5276';
    } else if (unit.type === 'RANGED') {
      bodyCol = pn === 1 ? '#a93226' : '#2e86c1';
      darkCol = pn === 1 ? '#7b241c' : '#1b4f72';
    } else {
      bodyCol = pn === 1 ? '#784212' : '#1b4f72';
      darkCol = pn === 1 ? '#5a3210' : '#0e3352';
    }

    // JAMBES ANIMÉES
    var legOff = unit.attacking ? 0 : Math.sin((unit.walkFrame || 0) * 6) * 5;
    ctx.strokeStyle = darkCol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - size + 3);
    ctx.lineTo(x - 4 - legOff, y);
    ctx.moveTo(x + 4, y - size + 3);
    ctx.lineTo(x + 4 + legOff, y);
    ctx.stroke();

    // Bottes
    ctx.fillStyle = '#333';
    ctx.fillRect(x - 6 - legOff, y - 3, 5, 3);
    ctx.fillRect(x + 2 + legOff, y - 3, 5, 3);

    // CORPS
    var bodyGrad = ctx.createLinearGradient(x - size * 0.7, 0, x + size * 0.7, 0);
    bodyGrad.addColorStop(0, darkCol);
    bodyGrad.addColorStop(0.5, bodyCol);
    bodyGrad.addColorStop(1, darkCol);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(x, y - size - 2, size * 0.65, size * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ceinture
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - size * 0.6, y - size + 1, size * 1.2, 3);

    // BRAS
    ctx.strokeStyle = bodyCol;
    ctx.lineWidth = 3;
    var armSwing = unit.attacking ? Math.sin(this.time * 15) * 0.6 : Math.sin((unit.walkFrame || 0) * 3) * 0.3;

    // Bras arrière
    ctx.beginPath();
    ctx.moveTo(x - dir * 5, y - size - 5);
    ctx.lineTo(x - dir * (12 + Math.sin(armSwing) * 5), y - size + 3);
    ctx.stroke();

    // TÊTE
    ctx.fillStyle = '#f0c8a0';
    ctx.beginPath();
    ctx.arc(x, y - size * 2 - 3, size * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Yeux
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + dir * 3, y - size * 2 - 5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // CASQUE par âge
    this.drawHelmet(ctx, x, y - size * 2 - 3, size * 0.42, unit.age, pn, dir);

    // ARME
    if (unit.type === 'MELEE') {
      ctx.save();
      ctx.translate(x + dir * size * 0.5, y - size - 3);
      var sAngle = unit.attacking ? Math.sin(this.time * 18) * 0.8 : -0.3;
      ctx.rotate(sAngle * dir);

      // Manche
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dir * 14, -10);
      ctx.stroke();

      // Lame
      if (unit.age <= 1) {
        ctx.fillStyle = '#bbb';
        ctx.beginPath();
        ctx.moveTo(dir * 12, -12);
        ctx.lineTo(dir * 22, -18);
        ctx.lineTo(dir * 14, -8);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(dir * 12, -16, dir * 12, 4);
      }
      ctx.restore();
    } else if (unit.type === 'RANGED') {
      if (unit.age <= 1) {
        // Arc
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + dir * 8, y - size - 5, 10, -0.8 * dir, 0.8 * dir);
        ctx.stroke();
        // Corde
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + dir * 8 + Math.cos(-0.8) * 10 * dir, y - size - 5 + Math.sin(-0.8) * 10);
        ctx.lineTo(x + dir * 8 + Math.cos(0.8) * 10 * dir, y - size - 5 + Math.sin(0.8) * 10);
        ctx.stroke();
      } else {
        // Fusil/Arme
        ctx.fillStyle = '#555';
        ctx.fillRect(x + dir * 5, y - size - 7, dir * 18, 3);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + dir * 2, y - size - 8, dir * 8, 5);

        if (unit.attacking) {
          ctx.fillStyle = '#ff8';
          ctx.beginPath();
          ctx.arc(x + dir * 24, y - size - 6, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // TANK - Bouclier + arme lourde
      // Bouclier
      var shieldGrad = ctx.createLinearGradient(x + dir * size * 0.5, 0, x + dir * (size * 0.5 + 10), 0);
      shieldGrad.addColorStop(0, '#888');
      shieldGrad.addColorStop(0.5, '#aaa');
      shieldGrad.addColorStop(1, '#666');
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.ellipse(x + dir * (size * 0.7), y - size - 2, 6, size, 0, 0, Math.PI * 2);
      ctx.fill();

      // Emblème sur bouclier
      ctx.fillStyle = pCol;
      ctx.beginPath();
      ctx.arc(x + dir * (size * 0.7), y - size - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bras avant (devant l'arme)
    ctx.strokeStyle = bodyCol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + dir * 5, y - size - 5);
    ctx.lineTo(x + dir * (10 + Math.sin(armSwing) * 5), y - size + 1);
    ctx.stroke();

    // INDICATEUR JOUEUR (petit point)
    ctx.fillStyle = pCol;
    ctx.beginPath();
    ctx.arc(x, y - size * 2.8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Flash d'attaque
    if (unit.attacking) {
      ctx.fillStyle = 'rgba(255,255,100,0.15)';
      ctx.beginPath();
      ctx.arc(x, y - size, size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Barre de vie
    var hpP = unit.hp / unit.maxHp;
    var bw = size * 2.8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - bw / 2 - 1, y - size * 3 - 7, bw + 2, 6);
    var hpC = hpP > 0.5 ? '#2ecc71' : hpP > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpC;
    ctx.fillRect(x - bw / 2, y - size * 3 - 6, bw * hpP, 4);
  }

  drawHelmet(ctx, x, y, r, age, pn, dir) {
    var col = pn === 1 ? '#b03030' : '#2060a0';
    if (age === 0) {
      ctx.fillStyle = '#8B6914';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.5, r * 1.2, r * 0.5, 0, Math.PI, 0);
      ctx.fill();
    } else if (age === 1) {
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.2, r * 1.15, r * 0.85, 0, Math.PI, 0);
      ctx.fill();
      // Visière
      ctx.fillStyle = '#666';
      ctx.fillRect(x + dir * r * 0.2, y - r * 0.3, dir * r * 0.8, r * 0.5);
      // Plume
      ctx.fillStyle = col;
      ctx.fillRect(x - 1, y - r * 1.3, 2, r * 0.6);
    } else if (age === 2) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.3, r * 1.3, r * 0.5, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x - 2, y - r * 1.5, 4, r * 0.8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 1, y - r * 1.6, 2, r * 0.3);
    } else if (age === 3) {
      ctx.fillStyle = '#4a5a2a';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.2, r * 1.2, r * 0.75, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#3a4a1a';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x - r, y - r * 0.3);
      ctx.lineTo(x + r, y - r * 0.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#2a1a4a';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.15, r * 1.25, r * 0.9, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,200,255,0.35)';
      ctx.fillRect(x - r, y - r * 0.3, r * 2, r * 0.35);
      // Glow
      ctx.shadowColor = 'rgba(0,200,255,0.3)';
      ctx.shadowBlur = 5;
      ctx.fillRect(x - r, y - r * 0.3, r * 2, r * 0.35);
      ctx.shadowBlur = 0;
    }
  }

  // ===========================
  //  BARRE DE VIE DÉTAILLÉE
  // ===========================
  drawHPBar(ctx, x, y, w, hp, maxHp, pn) {
    var pct = Math.max(0, hp / maxHp);
    // Fond
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    this._roundRect(ctx, x - w / 2 - 1, y - 1, w + 2, 12, 4);
    ctx.fill();
    // Remplissage
    var hpC = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpC;
    ctx.beginPath();
    this._roundRect(ctx, x - w / 2, y, w * pct, 10, 3);
    ctx.fill();
    // Brillance
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x - w / 2 + 2, y + 1, w * pct - 4, 4);
    // Bordure
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, x - w / 2, y, w, 10, 3);
    ctx.stroke();
    // Texte
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(Math.max(0, hp)) + '/' + maxHp, x, y + 9);
  }

  _roundRect(ctx, x, y, w, h, r) {
    if (w < 0) w = 0;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
  }

  // ===========================
  //  PROJECTILES
  // ===========================
  drawProjectile(ctx, p) {
    var col = p.owner === 1 ? '#ff6b35' : '#00bcd4';

    // Traînée
    this.trails.push({ x: p.x, y: p.y, life: 10, color: col });

    // Glow
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTrails(ctx) {
    this.trails = this.trails.filter(function(t) {
      t.life--;
      ctx.globalAlpha = t.life / 10;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 2 * (t.life / 10), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return t.life > 0;
    });
  }

  // ===========================
  //  EFFETS
  // ===========================
  drawDust(ctx) {
    var self = this;
    this.dust.forEach(function(d) {
      d.x += d.vx;
      d.y += d.vy;
      d.life--;
      if (d.life <= 0) {
        d.x = Math.random() * 1200;
        d.y = 300 + Math.random() * 100;
        d.life = d.maxLife;
      }
      ctx.globalAlpha = (d.life / d.maxLife) * 0.15;
      ctx.fillStyle = '#c8b898';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  addParticle(x, y, color, count) {
    for (var i = 0; i < (count || 8); i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color: color,
        size: 1 + Math.random() * 3,
        type: Math.random() > 0.5 ? 'circle' : 'square'
      });
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x: x, y: y, text: text, color: color,
      life: 60, vy: -1.5
    });
  }

  shake(amount) {
    this.shakeAmount = amount;
  }

  drawParticles(ctx) {
    this.particles = this.particles.filter(function(p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.98;
      p.life--;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      } else {
        var s = p.size * (p.life / p.maxLife);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      return p.life > 0;
    });
  }

  drawFloatingTexts(ctx) {
    this.floatingTexts = this.floatingTexts.filter(function(ft) {
      ft.y += ft.vy;
      ft.life--;
      ctx.globalAlpha = ft.life / 60;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1;
      return ft.life > 0;
    });
  }

  // ===========================
  //  DÉTECTION ÉVÉNEMENTS
  // ===========================
  detectEvents(newState) {
    if (!this.prevState) return;

    var self = this;
    var oldP1 = {};
    var oldP2 = {};
    this.prevState.player1.units.forEach(function(u) { oldP1[u.id] = u; });
    this.prevState.player2.units.forEach(function(u) { oldP2[u.id] = u; });

    var newP1 = {};
    var newP2 = {};
    newState.player1.units.forEach(function(u) { newP1[u.id] = true; });
    newState.player2.units.forEach(function(u) { newP2[u.id] = true; });

    // Mort d'unités P1
    Object.keys(oldP1).forEach(function(id) {
      if (!newP1[id]) {
        var u = oldP1[id];
        self.addParticle(u.x, 388, '#e74c3c', 12);
        self.addParticle(u.x, 388, '#fff', 4);
        self.addFloatingText(u.x, 370, '💀', '#ff6b6b');
      }
    });

    // Mort d'unités P2
    Object.keys(oldP2).forEach(function(id) {
      if (!newP2[id]) {
        var u = oldP2[id];
        self.addParticle(u.x, 388, '#3498db', 12);
        self.addParticle(u.x, 388, '#fff', 4);
        self.addFloatingText(u.x, 370, '💀', '#5dade2');
      }
    });

    // Dégâts aux bases
    if (newState.player1.baseHp < this.prevState.player1.baseHp) {
      var dmg = this.prevState.player1.baseHp - newState.player1.baseHp;
      if (dmg > 20) {
        self.addParticle(80, 350, '#ff6b35', 8);
        self.shake(dmg > 100 ? 8 : 4);
        self.addFloatingText(80, 340, '-' + Math.floor(dmg), '#ff4444');
      }
    }
    if (newState.player2.baseHp < this.prevState.player2.baseHp) {
      var dmg2 = this.prevState.player2.baseHp - newState.player2.baseHp;
      if (dmg2 > 20) {
        self.addParticle(1120, 350, '#00bcd4', 8);
        self.shake(dmg2 > 100 ? 8 : 4);
        self.addFloatingText(1120, 340, '-' + Math.floor(dmg2), '#4444ff');
      }
    }
  }
}