import { state } from '../core/state.js';

export class WaterCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.time = 0;

    // Bobber state
    this.bobber = {
      active: false,
      x: 0,
      y: 0,
      targetY: 0,
      bobOffset: 0,
      submerged: false,
      rippleRadius: 0
    };

    // Splash particles
    this.particles = [];

    // Ambient floating particles (bubbles / plankton / embers)
    this.ambientParticles = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initAmbientParticles();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    for (let i = 0; i < 35; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2.5 + 0.8,
        speedY: -(Math.random() * 0.7 + 0.15),
        speedX: Math.sin(Math.random() * Math.PI) * 0.35,
        alpha: Math.random() * 0.55 + 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  castBobber() {
    this.bobber.active = true;
    this.bobber.x = this.width * 0.5;
    this.bobber.y = this.height * 0.22;
    this.bobber.targetY = this.height * 0.62;
    this.bobber.submerged = false;
    this.bobber.rippleRadius = 0;

    this.createSplash(this.bobber.x, this.bobber.targetY, 18);
  }

  nibbleBobber() {
    this.bobber.bobOffset = 22;
    this.bobber.submerged = true;
    this.createSplash(this.bobber.x, this.bobber.targetY + 8, 12);
  }

  retrieveBobber() {
    if (this.bobber.active) {
      this.createSplash(this.bobber.x, this.bobber.targetY, 14);
    }
    this.bobber.active = false;
  }

  createSplash(x, y, count = 12) {
    const biome = state.getCurrentBiome();
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.85;
      const speed = Math.random() * 5.5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.2 + 1.2,
        alpha: 1,
        color: biome.id === 'caldera' ? '#f97316' : (biome.id === 'abyss' ? '#c084fc' : '#22d3ee'),
        gravity: 0.18
      });
    }
  }

  update(dt = 0.016) {
    this.time += dt;

    // Bobber animation
    if (this.bobber.active) {
      this.bobber.y += (this.bobber.targetY - this.bobber.y) * 0.14;
      this.bobber.bobOffset *= 0.86;
      this.bobber.rippleRadius = (this.bobber.rippleRadius + 0.45) % 40;
    }

    // Update splash particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= 0.024;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update ambient particles
    for (const p of this.ambientParticles) {
      p.y += p.speedY;
      p.x += Math.sin(this.time * 1.8 + p.phase) * 0.4;
      if (p.y < 0) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
    }
  }

  render() {
    const biome = state.getCurrentBiome();
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Sky & Horizon Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    skyGrad.addColorStop(0, biome.skyGradient[0]);
    skyGrad.addColorStop(0.5, biome.skyGradient[1]);
    skyGrad.addColorStop(1, biome.skyGradient[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // Celestial Glow
    const glowGrad = ctx.createRadialGradient(w * 0.5, h * 0.2, 8, w * 0.5, h * 0.2, 170);
    glowGrad.addColorStop(0, 'rgba(234, 246, 250, 0.2)');
    glowGrad.addColorStop(0.4, 'rgba(34, 211, 238, 0.08)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // 2. Horizon Archipelagos Silhouette
    ctx.fillStyle = 'rgba(6, 11, 20, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.52);
    ctx.quadraticCurveTo(w * 0.22, h * 0.45, w * 0.48, h * 0.49);
    ctx.quadraticCurveTo(w * 0.78, h * 0.43, w, h * 0.52);
    ctx.lineTo(w, h * 0.55);
    ctx.lineTo(0, h * 0.55);
    ctx.fill();

    // 3. Layered Oceanic Waves
    const waterY = h * 0.52;
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
    waterGrad.addColorStop(0, biome.waterColor);
    waterGrad.addColorStop(0.35, biome.deepWaterColor);
    waterGrad.addColorStop(1, '#040810');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, waterY);

    for (let x = 0; x <= w; x += 8) {
      const wave1 = Math.sin(x * 0.016 + this.time * 2.4) * 6.5;
      const wave2 = Math.cos(x * 0.032 - this.time * 1.6) * 3.5;
      const y = waterY + wave1 + wave2;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Sea Foam Crest Line
    ctx.strokeStyle = 'rgba(234, 246, 250, 0.22)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    for (let x = 0; x <= w; x += 8) {
      const wave = Math.sin(x * 0.016 + this.time * 2.4) * 6.5 + Math.cos(x * 0.032 - this.time * 1.6) * 3.5;
      ctx.lineTo(x, waterY + wave);
    }
    ctx.stroke();

    // Subsurface Light Shimmer
    ctx.fillStyle = 'rgba(34, 211, 238, 0.06)';
    ctx.beginPath();
    ctx.moveTo(0, waterY + 12);
    for (let x = 0; x <= w; x += 14) {
      const wave = Math.sin(x * 0.02 + this.time * 2.8) * 4;
      ctx.lineTo(x, waterY + 14 + wave);
    }
    ctx.lineTo(w, waterY + 28);
    ctx.lineTo(0, waterY + 28);
    ctx.fill();

    // 4. Ambient Floating Marine Plankton / Embers
    for (const p of this.ambientParticles) {
      const particleColor = biome.id === 'caldera'
        ? `rgba(249, 115, 22, ${p.alpha})`
        : (biome.id === 'abyss' ? `rgba(192, 132, 252, ${p.alpha})` : `rgba(34, 211, 238, ${p.alpha})`);
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Fishing Line & Tactical Bobber
    if (this.bobber.active) {
      const bx = this.bobber.x;
      const by = this.bobber.y + this.bobber.bobOffset + Math.sin(this.time * 3.8) * 3.5;

      const rodTipX = w * 0.88;
      const rodTipY = h * 0.95;

      // Line with subtle glow
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      ctx.quadraticCurveTo(w * 0.72, h * 0.44, bx, by);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(234, 246, 250, 0.85)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      ctx.quadraticCurveTo(w * 0.72, h * 0.44, bx, by);
      ctx.stroke();

      // Ripples
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(bx, by + 4, this.bobber.rippleRadius, this.bobber.rippleRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Bobber Body
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(bx, by, 7.5, Math.PI, 0, false);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(bx, by, 7.5, 0, Math.PI, false);
      ctx.fill();

      // Antenna
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by - 7);
      ctx.lineTo(bx, by - 16);
      ctx.stroke();

      // Antenna Tip (Glowing Amber Beacon)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bx, by - 16, 3, 0, Math.PI * 2);
      ctx.fill();

      // Fisch Red Exclamation Mark on Bite
      if (this.bobber.submerged) {
        ctx.save();
        ctx.fillStyle = '#f43f5e';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.font = 'bold 30px Syne, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(244, 63, 94, 0.9)';
        ctx.shadowBlur = 15;
        const exY = by - 32 + Math.sin(this.time * 12) * 4;
        ctx.strokeText('❗', bx, exY);
        ctx.fillText('❗', bx, exY);
        ctx.restore();
      }
    }

    // 6. Splash particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}
