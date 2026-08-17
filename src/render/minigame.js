import { tg } from '../core/telegram.js';
import { sound } from '../core/sound.js';

export class ReelingMinigame {
  constructor(containerElement, onCatch, onEscape) {
    this.container = containerElement;
    this.onCatch = onCatch;
    this.onEscape = onEscape;

    this.active = false;
    this.fish = null;
    this.rod = null;

    // Simulation state (0.0 to 1.0 normalized coordinates)
    this.barPos = 0.35;        // Sweetspot left position
    this.barVelocity = 0;
    this.barSize = 0.25;       // Normalized width of the player's sweetspot

    this.fishPos = 0.5;       // Fish position
    this.fishTarget = 0.5;
    this.fishVelocity = 0;
    this.fishMoveTimer = 0;

    this.progress = 0.35;      // 0.0 to 1.0 (starts at 35%)
    this.isHolding = false;    // User input state
    this.inSweetspot = false;
    this.soundTimer = 0;
    this.hapticTimer = 0;

    // Tension & difficulty
    this.tension = 0;

    this.setupDOM();
    this.bindEvents();
    this.stop();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div class="fisch-minigame-wrapper">
        <div class="minigame-header">
          <div class="reeling-title">ВЫВАЖИВАНИЕ</div>
          <div class="progress-percent" id="reelingPercent">35%</div>
        </div>

        <!-- Catch Progress Bar -->
        <div class="progress-track">
          <div class="progress-fill" id="progressFill"></div>
        </div>

        <!-- Main Fisch Reeling Track -->
        <div class="reel-track" id="reelTrack">
          <!-- Player Sweetspot Bar -->
          <div class="player-bar" id="playerBar">
            <div class="bar-glow"></div>
          </div>
          <!-- Target Fish -->
          <div class="target-fish" id="targetFish">
            <span class="fish-sprite" id="fishSprite">🐟</span>
          </div>
        </div>

        <!-- Action / Touch Control Area -->
        <div class="reel-instruction">
          <span class="reel-hint">Удерживай кнопку, чтобы двигать ползунок</span>
        </div>
      </div>
    `;

    this.wrapper = this.container.querySelector('.fisch-minigame-wrapper');
    this.progressFillEl = this.container.querySelector('#progressFill');
    this.progressPercentEl = this.container.querySelector('#reelingPercent');
    this.playerBarEl = this.container.querySelector('#playerBar');
    this.targetFishEl = this.container.querySelector('#targetFish');
    this.fishSpriteEl = this.container.querySelector('#fishSprite');
    this.reelTrackEl = this.container.querySelector('#reelTrack');
  }

  bindEvents() {
    const handlePressStart = (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.isHolding = true;
      tg.impactLight();
    };

    const handlePressEnd = (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.isHolding = false;
    };

    // Touch & Mouse
    window.addEventListener('mousedown', handlePressStart);
    window.addEventListener('mouseup', handlePressEnd);
    window.addEventListener('touchstart', handlePressStart, { passive: false });
    window.addEventListener('touchend', handlePressEnd, { passive: false });

    // Keyboard Space / Enter
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.active) {
          e.preventDefault();
          this.isHolding = true;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.active) {
          e.preventDefault();
          this.isHolding = false;
        }
      }
    });
  }

  start(fish, rod) {
    this.active = true;
    this.fish = fish;
    this.rod = rod;

    // Configure stats
    this.barSize = Math.max(0.12, Math.min(0.48, rod.barSize || 0.25));
    this.barPos = 0.5 - this.barSize / 2;
    this.barVelocity = 0;
    this.isHolding = false;

    this.fishPos = 0.5;
    this.fishTarget = 0.5;
    this.fishMoveTimer = 0;

    this.progress = 0.35;
    this.tension = 0;

    this.fishSpriteEl.textContent = fish.icon || '🐟';
    this.playerBarEl.style.width = `${this.barSize * 100}%`;
    this.container.classList.remove('hidden');

    sound.playReelClick();
    tg.impactMedium();
  }

  stop() {
    this.active = false;
    this.isHolding = false;
    this.container.classList.add('hidden');
  }

  updateFishAI(dt) {
    this.fishMoveTimer -= dt;

    if (this.fishMoveTimer <= 0) {
      // Pick new target position based on behavior
      const speedMod = this.fish.difficulty || 1.0;

      if (this.fish.behavior === 'calm') {
        this.fishTarget = 0.15 + Math.random() * 0.7;
        this.fishMoveTimer = 0.9 / speedMod + Math.random() * 0.8;
      } else if (this.fish.behavior === 'darting') {
        // Sudden darts to edges
        this.fishTarget = Math.random() < 0.5 ? 0.05 + Math.random() * 0.2 : 0.75 + Math.random() * 0.2;
        this.fishMoveTimer = 0.45 / speedMod + Math.random() * 0.4;
      } else if (this.fish.behavior === 'thrashing') {
        // High frequency jitter
        this.fishTarget = Math.random() * 0.9 + 0.05;
        this.fishMoveTimer = 0.25 / speedMod + Math.random() * 0.3;
      } else {
        // Erratic / Mythic
        this.fishTarget = Math.random() * 0.9 + 0.05;
        this.fishMoveTimer = 0.18 / speedMod + Math.random() * 0.25;
      }
    }

    // Move fish smoothly towards target
    const speed = (this.fish.difficulty || 1.0) * 1.8;
    const diff = this.fishTarget - this.fishPos;
    this.fishPos += diff * Math.min(1.0, speed * dt * 4.5);

    // Clamp
    this.fishPos = Math.max(0.02, Math.min(0.98, this.fishPos));
  }

  updatePlayerBar(dt) {
    const resilience = this.rod.resilience || 1.0;
    const liftForce = 2.4 * resilience;
    const gravity = 2.1;

    if (this.isHolding) {
      this.barVelocity += liftForce * dt;
    } else {
      this.barVelocity -= gravity * dt;
    }

    // Dampening / friction
    this.barVelocity *= Math.pow(0.85, dt * 60);

    this.barPos += this.barVelocity * dt;

    // Bounce off walls
    if (this.barPos < 0) {
      this.barPos = 0;
      this.barVelocity = -this.barVelocity * 0.25;
    } else if (this.barPos + this.barSize > 1.0) {
      this.barPos = 1.0 - this.barSize;
      this.barVelocity = -this.barVelocity * 0.25;
    }
  }

  updateProgress(dt) {
    const fishCenter = this.fishPos;
    const barLeft = this.barPos;
    const barRight = this.barPos + this.barSize;

    this.inSweetspot = (fishCenter >= barLeft && fishCenter <= barRight);

    if (this.inSweetspot) {
      const fillRate = 0.22; // ~4.5 seconds of sustained catch
      this.progress += fillRate * dt;
      this.playerBarEl.classList.add('in-target');
      this.wrapper.classList.remove('danger');

      // Periodic reeling sound & haptics
      this.soundTimer += dt;
      if (this.soundTimer >= 0.14) {
        this.soundTimer = 0;
        sound.playReelClick();
      }

      this.hapticTimer += dt;
      if (this.hapticTimer >= 0.22) {
        this.hapticTimer = 0;
        tg.impactLight();
      }
    } else {
      const drainRate = 0.18;
      this.progress -= drainRate * dt;
      this.playerBarEl.classList.remove('in-target');
      this.wrapper.classList.add('danger');

      this.soundTimer += dt;
      if (this.soundTimer >= 0.3) {
        this.soundTimer = 0;
        tg.impactRigid();
      }
    }

    // Clamp progress
    this.progress = Math.max(0, Math.min(1.0, this.progress));

    // Check Win / Loss conditions
    if (this.progress >= 1.0) {
      this.stop();
      this.onCatch(this.fish);
    } else if (this.progress <= 0.0) {
      this.stop();
      this.onEscape(this.fish);
    }
  }

  update(dt = 0.016) {
    if (!this.active) return;

    this.updateFishAI(dt);
    this.updatePlayerBar(dt);
    this.updateProgress(dt);

    this.render();
  }

  render() {
    // Render progress
    const pct = Math.round(this.progress * 100);
    this.progressFillEl.style.width = `${pct}%`;
    this.progressPercentEl.textContent = `${pct}%`;

    if (this.inSweetspot) {
      this.progressFillEl.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    } else {
      this.progressFillEl.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
    }

    // Render bar and fish positions
    this.playerBarEl.style.left = `${this.barPos * 100}%`;
    this.targetFishEl.style.left = `${this.fishPos * 100}%`;
  }
}
