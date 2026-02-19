// client/js/renderer.js
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
  }
  
  drawBackground() {
    const ctx = this.ctx;
    
    // Ciel
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 250);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.canvas.width, 250);
    
    // Sol
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 250, this.canvas.width, 20);
    
    // Herbe
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(0, 270, this.canvas.width, this.canvas.height - 270);
  }
  
  drawBase(x, hp, maxHp, age, playerNumber) {
    const ctx = this.ctx;
    const baseWidth = 60;
    const baseHeight = 80 + age * 10;
    const baseY = 260 - baseHeight;
    
    // Couleurs par joueur
    const colors = playerNumber === 1 
      ? ['#c0392b', '#e74c3c', '#922B21'] 
      : ['#2980b9', '#3498db', '#1F618D'];
    
    // Base structure
    ctx.fillStyle = colors[0];
    ctx.fillRect(x - baseWidth/2, baseY, baseWidth, baseHeight);
    
    // Toit
    ctx.fillStyle = colors[2];
    ctx.beginPath();
    ctx.moveTo(x - baseWidth/2 - 10, baseY);
    ctx.lineTo(x, baseY - 30);
    ctx.lineTo(x + baseWidth/2 + 10, baseY);
    ctx.fill();
    
    // Porte
    ctx.fillStyle = '#5D4E37';
    ctx.fillRect(x - 10, baseY + baseHeight - 30, 20, 30);
    
    // Fenêtres
    ctx.fillStyle = '#F1C40F';
    ctx.fillRect(x - 20, baseY + 15, 10, 10);
    ctx.fillRect(x + 10, baseY + 15, 10, 10);
    
    // Drapeau
    ctx.fillStyle = '#333';
    ctx.fillRect(x - 2, baseY - 30, 4, -20);
    ctx.fillStyle = colors[1];
    ctx.fillRect(x + 2, baseY - 50, 20, 12);
    
    // Barre de vie
    const hpPercent = hp / maxHp;
    const barWidth = 70;
    ctx.fillStyle = '#333';
    ctx.fillRect(x - barWidth/2, baseY - 60, barWidth, 8);
    
    const hpColor = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x - barWidth/2, baseY - 60, barWidth * hpPercent, 8);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barWidth/2, baseY - 60, barWidth, 8);
  }
  
  drawUnit(unit, playerNumber) {
    const ctx = this.ctx;
    const x = unit.x;
    const y = 240; // Position Y fixe au sol
    
    // Couleurs par joueur et type
    const playerColor = playerNumber === 1 ? '#e74c3c' : '#3498db';
    const typeColors = {
      MELEE: '#e67e22',
      RANGED: '#9b59b6',
      TANK: '#34495e'
    };
    
    const size = unit.type === 'TANK' ? 18 : 12;
    
    // Corps
    ctx.fillStyle = typeColors[unit.type] || playerColor;
    ctx.beginPath();
    ctx.arc(x, y - size, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Indicateur joueur
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(x, y - size * 2 - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Arme
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    if (unit.type === 'MELEE') {
      // Épée
      const dir = unit.direction;
      ctx.beginPath();
      ctx.moveTo(x + dir * size, y - size);
      ctx.lineTo(x + dir * (size + 15), y - size - 10);
      ctx.stroke();
    } else if (unit.type === 'RANGED') {
      // Arc / Arme
      const dir = unit.direction;
      ctx.beginPath();
      ctx.moveTo(x + dir * size, y - size - 5);
      ctx.lineTo(x + dir * (size + 12), y - size - 5);
      ctx.stroke();
    }
    
    // Animation d'attaque
    if (unit.attacking) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y - size, size + 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Barre de vie unité
    const hpPercent = unit.hp / unit.maxHp;
    const barW = size * 2;
    ctx.fillStyle = '#333';
    ctx.fillRect(x - barW/2, y - size * 2 - 15, barW, 4);
    
    const hpColor = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x - barW/2, y - size * 2 - 15, barW * hpPercent, 4);
  }
  
  drawTurret(turret, playerNumber) {
    if (!turret) return;
    
    const ctx = this.ctx;
    const x = turret.x;
    const y = turret.y || 220;
    const color = playerNumber === 1 ? '#c0392b' : '#2980b9';
    
    // Base de la tourelle
    ctx.fillStyle = '#555';
    ctx.fillRect(x - 12, y, 24, 30);
    
    // Tourelle
    ctx.fillStyle = color;
    ctx.fillRect(x - 8, y - 15, 16, 20);
    
    // Canon
    ctx.fillStyle = '#333';
    const dir = playerNumber === 1 ? 1 : -1;
    ctx.fillRect(x, y - 10, dir * 20, 4);
  }
  
  addParticle(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 30,
        color,
        size: Math.random() * 3 + 1
      });
    }
  }
  
  updateAndDrawParticles() {
    const ctx = this.ctx;
    
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
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
  
  render(gameState, myPlayerNumber) {
    this.clear();
    
    if (!gameState) return;
    
    const p1 = gameState.player1;
    const p2 = gameState.player2;
    
    // Bases
    this.drawBase(50, p1.baseHp, p1.baseMaxHp, p1.age, 1);
    this.drawBase(1150, p2.baseHp, p2.baseMaxHp, p2.age, 2);
    
    // Tourelles
    p1.turrets.forEach(t => this.drawTurret(t, 1));
    p2.turrets.forEach(t => this.drawTurret(t, 2));
    
    // Unités
    p1.units.forEach(u => this.drawUnit(u, 1));
    p2.units.forEach(u => this.drawUnit(u, 2));
    
    // Particules
    this.updateAndDrawParticles();
  }
}