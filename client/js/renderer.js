class Renderer {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.clouds = [];
    this.time = 0;
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * 1200,
        y: 20 + Math.random() * 60,
        w: 60 + Math.random() * 80,
        s: 0.2 + Math.random() * 0.3
      });
    }
  }

  render(state, myPn) {
    if (!state) return;
    this.time += 0.016;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1200, 500);

    this.drawSky(ctx);
    this.drawClouds(ctx);
    this.drawMountains(ctx);
    this.drawGround(ctx);
    this.drawBase(ctx, 80, state.player1, 1);
    this.drawBase(ctx, 1120, state.player2, 2);
    state.player1.units.forEach(u => this.drawUnit(ctx, u, 1));
    state.player2.units.forEach(u => this.drawUnit(ctx, u, 2));
    if (state.projectiles) {
      state.projectiles.forEach(p => this.drawProjectile(ctx, p));
    }
    this.drawParticles(ctx);
  }

  drawSky(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 280);
    g.addColorStop(0, '#1a1a4e');
    g.addColorStop(0.5, '#3a506b');
    g.addColorStop(1, '#c9a96e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1200, 280);
  }

  drawClouds(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.clouds.forEach(c => {
      c.x += c.s;
      if (c.x > 1250) c.x = -100;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x - 20, c.y + 8, c.w * 0.6, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawMountains(ctx) {
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.moveTo(0, 280);
    for (let x = 0; x <= 1200; x += 60) {
      ctx.lineTo(x, 200 + Math.sin(x * 0.008) * 40 + Math.cos(x * 0.015) * 25);
    }
    ctx.lineTo(1200, 280);
    ctx.fill();

    ctx.fillStyle = '#3d4f4f';
    ctx.beginPath();
    ctx.moveTo(0, 280);
    for (let x = 0; x <= 1200; x += 40) {
      ctx.lineTo(x, 240 + Math.sin(x * 0.012 + 1) * 25 + Math.cos(x * 0.02) * 15);
    }
    ctx.lineTo(1200, 280);
    ctx.fill();
  }

  drawGround(ctx) {
    const g = ctx.createLinearGradient(0, 280, 0, 500);
    g.addColorStop(0, '#5a7247');
    g.addColorStop(0.15, '#4a6238');
    g.addColorStop(0.4, '#6b5033');
    g.addColorStop(1, '#5a4228');
    ctx.fillStyle = g;
    ctx.fillRect(0, 280, 1200, 220);

    ctx.strokeStyle = '#6b8a4e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < 1200; x += 5) {
      const h = 280 + Math.sin(x * 0.3) * 2;
      ctx.moveTo(x, h);
      ctx.lineTo(x, h - 4 - Math.random() * 3);
    }
    ctx.stroke();

    ctx.fillStyle = '#7a6843';
    ctx.fillRect(0, 390, 1200, 20);
    ctx.fillStyle = '#8a7853';
    ctx.fillRect(0, 392, 1200, 2);
  }

  drawBase(ctx, bx, player, pn) {
    const age = player.age;
    const h = 90 + age * 15;
    const w = 70 + age * 5;
    const by = 395 - h;
    const col = pn === 1
      ? ['#8b3a3a', '#a04040', '#c04848']
      : ['#2a5a7a', '#3a6a8a', '#4a8aaa'];

    // Ombre
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(bx - w / 2 - 5, 395, w + 10, 8);

    // Mur
    const wg = ctx.createLinearGradient(bx - w / 2, by, bx + w / 2, by);
    wg.addColorStop(0, col[0]);
    wg.addColorStop(0.5, col[1]);
    wg.addColorStop(1, col[0]);
    ctx.fillStyle = wg;
    ctx.fillRect(bx - w / 2, by, w, h);

    // Briques
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let row = 0; row < h; row += 12) {
      const offset = (row / 12) % 2 === 0 ? 0 : 10;
      for (let cx = bx - w / 2 + offset; cx < bx + w / 2; cx += 20) {
        ctx.strokeRect(cx, by + row, 20, 12);
      }
    }

    // Toit
    ctx.fillStyle = col[2];
    ctx.beginPath();
    ctx.moveTo(bx - w / 2 - 12, by);
    ctx.lineTo(bx, by - 25 - age * 5);
    ctx.lineTo(bx + w / 2 + 12, by);
    ctx.fill();

    // Porte
    ctx.fillStyle = '#3e2723';
    const dw = 16 + age * 2;
    const dh = 24 + age * 3;
    ctx.fillRect(bx - dw / 2, 395 - dh, dw, dh);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(bx + dw / 4, 395 - dh / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Fenêtres
    ctx.fillStyle = '#f9e466';
    ctx.fillRect(bx - w / 3, by + 20, 8, 8);
    ctx.fillRect(bx + w / 3 - 8, by + 20, 8, 8);
    if (age >= 2) {
      ctx.fillRect(bx - w / 4, by + 40, 8, 8);
      ctx.fillRect(bx + w / 4, by + 40, 8, 8);
    }

    // Drapeau
    ctx.fillStyle = '#333';
    ctx.fillRect(bx - 1, by - 25 - age * 5, 2, -25);
    ctx.fillStyle = col[2];
    ctx.fillRect(bx + 1, by - 50 - age * 5, 18, 10);

    // TOURELLES SUR LE TOIT
    var slots = [
      { x: bx - 22, y: by - 5 },
      { x: bx, y: by - 25 - age * 5 + 5 },
      { x: bx + 22, y: by - 5 }
    ];

    for (var i = 0; i < 3; i++) {
      var sx = slots[i].x;
      var sy = slots[i].y;

      if (player.turrets[i]) {
        // Tourelle construite
        var tAge = player.turrets[i].age;
        var tCol = pn === 1 ? '#d44' : '#48a';

        // Base tourelle
        ctx.fillStyle = '#555';
        ctx.fillRect(sx - 8, sy - 15, 16, 15);

        // Canon
        ctx.fillStyle = tCol;
        ctx.fillRect(sx - 6, sy - 22, 12, 10);

        // Bout du canon
        var dir = pn === 1 ? 1 : -1;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx + dir * 6, sy - 20, dir * 14, 4);

        // Flamme si tir récent
        if (this.time % 1 < 0.3) {
          ctx.fillStyle = 'rgba(255,200,0,0.6)';
          ctx.beginPath();
          ctx.arc(sx + dir * 20, sy - 18, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (player.turretSlots[i]) {
        // Slot débloqué mais vide
        ctx.strokeStyle = '#4a4';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(sx - 10, sy - 22, 20, 18);
        ctx.setLineDash([]);
        ctx.fillStyle = '#4a4';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+', sx, sy - 10);
      } else {
        // Slot verrouillé
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(sx - 10, sy - 22, 20, 18);
        ctx.setLineDash([]);
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', sx, sy - 8);
      }
    }

    // Barre de vie base
    var hpPct = Math.max(0, player.baseHp / player.baseMaxHp);
    var barW = w + 20;
    ctx.fillStyle = '#222';
    ctx.fillRect(bx - barW / 2, by - 55 - age * 5, barW, 10);
    var hpCol = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpCol;
    ctx.fillRect(bx - barW / 2, by - 55 - age * 5, barW * hpPct, 10);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - barW / 2, by - 55 - age * 5, barW, 10);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(player.baseHp) + '/' + player.baseMaxHp, bx, by - 47 - age * 5);
  }

  drawUnit(ctx, unit, pn) {
    var x = unit.x;
    var groundY = 388;
    var bounce = unit.attacking ? 0 : Math.sin((unit.walkFrame || 0) * 3) * 3;
    var y = groundY + bounce;
    var pCol = pn === 1 ? '#e74c3c' : '#3498db';
    var size = unit.type === 'TANK' ? 16 : unit.type === 'RANGED' ? 11 : 12;

    // Ombre
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, groundY + 5, size * 0.8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corps
    var bodyCol;
    if (unit.type === 'MELEE') bodyCol = pn === 1 ? '#c0392b' : '#2471a3';
    else if (unit.type === 'RANGED') bodyCol = pn === 1 ? '#a93226' : '#1a5276';
    else bodyCol = pn === 1 ? '#922b21' : '#154360';

    // Jambes
    var legOff = unit.attacking ? 0 : Math.sin((unit.walkFrame || 0) * 6) * 4;
    ctx.strokeStyle = bodyCol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - size + 5);
    ctx.lineTo(x - 3 - legOff, y);
    ctx.moveTo(x + 3, y - size + 5);
    ctx.lineTo(x + 3 + legOff, y);
    ctx.stroke();

    // Torse
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.ellipse(x, y - size - 2, size * 0.7, size * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tête
    ctx.fillStyle = '#f5cba7';
    ctx.beginPath();
    ctx.arc(x, y - size * 2 - 2, size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Casque / chapeau par âge
    this.drawHelmet(ctx, x, y - size * 2 - 2, size * 0.45, unit.age, pn);

    // Arme
    var dir = unit.direction;
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;

    if (unit.type === 'MELEE') {
      var swingAngle = unit.attacking ? Math.sin(this.time * 15) * 0.5 : 0;
      ctx.save();
      ctx.translate(x + dir * size * 0.5, y - size);
      ctx.rotate(swingAngle * dir);
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dir * 18, -12);
      ctx.stroke();
      ctx.fillStyle = '#ccc';
      ctx.fillRect(dir * 14, -16, dir * 8, 4);
      ctx.restore();
    } else if (unit.type === 'RANGED') {
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + dir * size * 0.5, y - size - 6);
      ctx.lineTo(x + dir * (size + 10), y - size - 6);
      ctx.stroke();
      if (unit.attacking) {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(x + dir * (size + 12), y - size - 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Tank - bouclier
      ctx.fillStyle = '#666';
      ctx.fillRect(x + dir * size * 0.6 - 4, y - size * 2, 8, size * 1.5);
      ctx.fillStyle = pCol;
      ctx.fillRect(x + dir * size * 0.6 - 3, y - size * 2 + 2, 6, size * 1.5 - 4);
    }

    // Indicateur joueur
    ctx.fillStyle = pCol;
    ctx.beginPath();
    ctx.arc(x, y - size * 2.8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Flash d'attaque
    if (unit.attacking) {
      ctx.fillStyle = 'rgba(255,255,100,0.25)';
      ctx.beginPath();
      ctx.arc(x, y - size, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Barre de vie
    var hpPct = unit.hp / unit.maxHp;
    var bw = size * 2.5;
    ctx.fillStyle = '#222';
    ctx.fillRect(x - bw / 2, y - size * 3 - 5, bw, 4);
    var hpC = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpC;
    ctx.fillRect(x - bw / 2, y - size * 3 - 5, bw * hpPct, 4);
  }

  drawHelmet(ctx, x, y, r, age, pn) {
    var col = pn === 1 ? '#c0392b' : '#2471a3';
    if (age === 0) {
      // Cheveux ébouriffés
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.7, r * 1.1, r * 0.5, 0, Math.PI, 0);
      ctx.fill();
    } else if (age === 1) {
      // Casque médiéval
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.3, r * 1.1, r * 0.8, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x - 1, y - r * 1.2, 2, r * 0.5);
    } else if (age === 2) {
      // Chapeau renaissance
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.5, r * 1.3, r * 0.4, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x - r * 0.2, y - r * 1.5, r * 0.4, r);
    } else if (age === 3) {
      // Casque moderne
      ctx.fillStyle = '#556b2f';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.3, r * 1.1, r * 0.7, 0, Math.PI, 0);
      ctx.fill();
    } else {
      // Visière futuriste
      ctx.fillStyle = '#4a148c';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.2, r * 1.2, r * 0.8, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,255,255,0.4)';
      ctx.fillRect(x - r, y - r * 0.3, r * 2, r * 0.3);
    }
  }

  drawProjectile(ctx, p) {
    var col = p.owner === 1 ? '#ff6b35' : '#00bcd4';
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,200,0.5)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  addParticle(x, y, color, count) {
    for (var i = 0; i < (count || 5); i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 4 - 1,
        life: 30,
        color: color,
        size: Math.random() * 3 + 1
      });
    }
  }

  drawParticles(ctx) {
    this.particles = this.particles.filter(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life--;
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return p.life > 0;
    });
  }
}