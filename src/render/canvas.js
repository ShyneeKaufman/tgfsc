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
    for (let i = 0; i < 30; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 3 + 1,
        speedY: -(Math.random() * 0.8 + 0.2),
        speedX: Math.sin(Math.random() * Math.PI) * 0.4,
        alpha: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  castBobber() {
    this.bobber.active = true;
    this.bobber.x = this.width * 0.5;
    this.bobber.y = this.height * 0.2;
    this.bobber.targetY = this.height * 0.62;
    this.bobber.submerged = false;
    this.bobber.rippleRadius = 0;

    this.createSplash(this.bobber.x, this.bobber.targetY, 15);
  }

  nibbleBobber() {
    this.bobber.bobOffset = 18;
    this.bobber.submerged = true;
    this.createSplash(this.bobber.x, this.bobber.targetY + 8, 8);
  }

  retrieveBobber() {
    if (this.bobber.active) {
      this.createSplash(this.bobber.x, this.bobber.targetY, 12);
    }
    this.bobber.active = false;
  }

  createSplash(x, y, count = 10) {
    const biome = state.getCurrentBiome();
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        alpha: 1,
        color: biome.id === 'caldera' ? '#f97316' : '#ffffff',
        gravity: 0.18
      });
    }
  }

  update(dt = 0.016) {
    this.time += dt;

    // Bobber animation
    if (this.bobber.active) {
      this.bobber.y += (this.bobber.targetY - this.bobber.y) * 0.15;
      this.bobber.bobOffset *= 0.88;
      this.bobber.rippleRadius = (this.bobber.rippleRadius + 0.4) % 35;
    }

    // Update splash particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= 0.025;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update ambient particles
    for (const p of this.ambientParticles) {
      p.y += p.speedY;
      p.x += Math.sin(this.time * 2 + p.phase) * 0.5;
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
    skyGrad.addColorStop(0.6, biome.skyGradient[1]);
    skyGrad.addColorStop(1, biome.skyGradient[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // Sun / Moon / Celestial Glow
    const glowGrad = ctx.createRadialGradient(w * 0.5, h * 0.22, 10, w * 0.5, h * 0.22, 180);
    glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    glowGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // 2. Distant Horizon Islands / Mountains Silhouette
    ctx.fillStyle = 'rgba(10, 15, 29, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.52);
    ctx.quadraticCurveTo(w * 0.25, h * 0.46, w * 0.5, h * 0.50);
    ctx.quadraticCurveTo(w * 0.75, h * 0.44, w, h * 0.52);
    ctx.lineTo(w, h * 0.55);
    ctx.lineTo(0, h * 0.55);
    ctx.fill();

    // 3. Water Waves (Procedural sine layered mesh)
    const waterY = h * 0.52;
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
    waterGrad.addColorStop(0, biome.waterColor);
    waterGrad.addColorStop(1, biome.deepWaterColor);

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, waterY);

    const waveCount = 5;
    for (let x = 0; x <= w; x += 10) {
      const wave1 = Math.sin(x * 0.015 + this.time * 2.5) * 6;
      const wave2 = Math.cos(x * 0.03 - this.time * 1.8) * 3;
      const y = waterY + wave1 + wave2;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Secondary deep wave reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, waterY + 4);
    for (let x = 0; x <= w; x += 15) {
      const wave = Math.sin(x * 0.02 + this.time * 3) * 4;
      ctx.lineTo(x, waterY + 6 + wave);
    }
    ctx.lineTo(w, waterY + 14);
    ctx.lineTo(0, waterY + 14);
    ctx.fill();

    // 4. Ambient Floating Particles
    for (const p of this.ambientParticles) {
      ctx.fillStyle = biome.id === 'caldera' ? `rgba(251, 146, 60, ${p.alpha})` : `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Fishing Line and Bobber
    if (this.bobber.active) {
      const bx = this.bobber.x;
      const by = this.bobber.y + this.bobber.bobOffset + Math.sin(this.time * 4) * 3;

      // Fishing line (smooth catenary curve from bottom-right rod to bobber)
      const rodTipX = w * 0.88;
      const rodTipY = h * 0.95;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      ctx.quadraticCurveTo(w * 0.72, h * 0.45, bx, by);
      ctx.stroke();

      // Water ripples around bobber
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(bx, by + 4, this.bobber.rippleRadius, this.bobber.rippleRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Bobber body
      // Top half (Red/White or Biome themed)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bx, by, 7, Math.PI, 0, false);
      ctx.fill();

      // Bottom half
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI, false);
      ctx.fill();

      // Antenna
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by - 7);
      ctx.lineTo(bx, by - 14);
      ctx.stroke();

      // Antenna tip
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(bx, by - 14, 2.5, 0, Math.PI * 2);
      ctx.fill();
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
