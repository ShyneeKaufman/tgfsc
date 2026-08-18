import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { getIconSvg } from '../ui/icons.js';

export class ReelingMinigame {
  constructor(container, onSuccess, onFailed) {
    this.container = container;
    this.onSuccess = onSuccess;
    this.onFailed = onFailed;

    this.active = false;
    this.isHolding = false;
    this.isLocked = false;
    this.lockTimer = 0;

    // Bar physics (0 to 100 range)
    this.barPos = 35;        // Left edge %
    this.barWidth = 30;      // Width % (affected by rod control)
    this.barVel = 0;         // Velocity in %/s

    // Fish physics (0 to 100 range)
    this.fishPos = 50;       // Center %
    this.fishTargetPos = 50;
    this.fishVel = 0;
    this.fishTimer = 0;
    this.fishBehavior = 'calm';

    // Progress
    this.progress = 20;      // 0 to 100 %
    this.isInside = false;
    this.perfectCatch = true;

    this.currentFish = null;
    this.currentRod = null;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="fisch-reeling-overlay hidden" id="reelingOverlay">
        <div class="fisch-reeling-panel" id="reelingPanel">
          
          <!-- Top Telemetry Row -->
          <div class="reeling-status-row">
            <div class="reeling-fish-badge" id="reelingFishName">Рыба на крючке</div>
            <div class="reeling-perfect-badge ${this.perfectCatch ? '' : 'hidden'}" id="reelingPerfectBadge">
              <span class="perfect-badge-icon">${getIconSvg('sparkles', 11)}</span> PERFECT CATCH
            </div>
            <div class="reeling-progress-num" id="reelingProgressNum">20%</div>
          </div>

          <!-- Exact Fisch Minigame Track from User Photo -->
          <div class="fisch-track-container">
            <span class="track-arrow left">▶</span>

            <div class="fisch-main-track" id="mainTrack">
              <!-- White Slider Bar with motion arrow -->
              <div class="fisch-white-bar" id="whiteBar">
                <div class="fisch-slider-arrow" id="sliderArrow">→</div>
              </div>

              <!-- Vertical Stick / Needle with tilted fish on top (точно как на фото) -->
              <div class="fisch-needle" id="fishNeedle">
                <div class="needle-fish-icon" id="needleFishIcon">
                  ${getIconSvg('fish', 16)}
                </div>
                <div class="needle-stick"></div>
              </div>
            </div>

            <span class="track-arrow right">◀</span>
          </div>

          <!-- Bottom Slim Progress Bar Under Track -->
          <div class="fisch-bottom-progress-track">
            <div class="fisch-bottom-progress-fill" id="bottomProgressFill" style="width: 20%"></div>
          </div>

          <div class="reeling-hint-text">
            Удерживайте для движения вправо. Отпустите для движения влево.
          </div>
        </div>
      </div>
    `;

    this.overlay = this.container.querySelector('#reelingOverlay');
    this.whiteBar = this.container.querySelector('#whiteBar');
    this.sliderArrow = this.container.querySelector('#sliderArrow');
    this.fishNeedle = this.container.querySelector('#fishNeedle');
    this.needleFishIcon = this.container.querySelector('#needleFishIcon');
    this.bottomProgressFill = this.container.querySelector('#bottomProgressFill');
    this.progressNum = this.container.querySelector('#reelingProgressNum');
    this.fishNameBadge = this.container.querySelector('#reelingFishName');
    this.perfectBadge = this.container.querySelector('#reelingPerfectBadge');
  }

  bindEvents() {
    const handleInputStart = (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.isHolding = true;
      sound.playReelClick();
      tg.impactLight();
    };

    const handleInputEnd = (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.isHolding = false;
    };

    // Touch and mouse listeners
    document.addEventListener('mousedown', (e) => {
      if (this.active) handleInputStart(e);
    });
    document.addEventListener('mouseup', (e) => {
      if (this.active) handleInputEnd(e);
    });

    document.addEventListener('touchstart', (e) => {
      if (this.active) handleInputStart(e);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (this.active) handleInputEnd(e);
    }, { passive: false });

    // Keyboard Space support
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.active && !this.isHolding) {
        handleInputStart(e);
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.active) {
        handleInputEnd(e);
      }
    });
  }

  start(fish, rod) {
    this.active = true;
    this.isHolding = false;
    this.currentFish = fish;
    this.currentRod = rod;

    // Reset physics
    this.barPos = 35;
    this.barVel = 0;
    this.fishPos = 50;
    this.fishTargetPos = 50;
    this.fishVel = 0;
    this.fishTimer = 0;
    this.progress = 20; // Starts at 20%
    this.perfectCatch = true;
    this.isLocked = true;
    this.lockTimer = 0.8; // Brief 0.8s intro lock

    // Calculate bar width based on rod control/resilience (30% base + rod bonus)
    const controlBonus = (rod.barSize - 0.22) * 100;
    this.barWidth = Math.max(22, Math.min(46, 28 + controlBonus));
    this.whiteBar.style.width = `${this.barWidth}%`;

    this.fishBehavior = fish.behavior || 'calm';
    this.fishNameBadge.textContent = fish.name;
    this.needleFishIcon.innerHTML = getIconSvg('fish', 16);

    this.container.classList.remove('hidden');
    this.overlay.classList.remove('hidden');
    this.perfectBadge.classList.remove('hidden');
    this.updateDOM();

    sound.playReelClick();
    tg.impactMedium();
  }

  stop() {
    this.active = false;
    this.isHolding = false;
    this.overlay.classList.add('hidden');
    this.container.classList.add('hidden');
  }

  update(dt) {
    if (!this.active) return;

    // 1. Intro Lock Timer
    if (this.isLocked) {
      this.lockTimer -= dt;
      if (this.lockTimer <= 0) {
        this.isLocked = false;
      }
    }

    // 2. Bar Motion Physics (Faster, Snappier & Highly Responsive)
    // Holding = fast right acceleration; Released = fast left recoil
    const accelRight = 680; // % / s^2 (Much faster!)
    const accelLeft = -580; // % / s^2 (Fast recoil!)
    const maxSpeed = 260;   // % / s (Snappy high top speed!)
    const friction = 0.92;

    if (this.isHolding) {
      this.barVel += accelRight * dt;
      this.sliderArrow.textContent = '→';
    } else {
      this.barVel += accelLeft * dt;
      this.sliderArrow.textContent = '←';
    }

    this.barVel *= Math.pow(friction, dt * 60);
    this.barVel = Math.max(-maxSpeed, Math.min(maxSpeed, this.barVel));
    this.barPos += this.barVel * dt;

    // Wall Bounces / Clamping
    if (this.barPos < 0) {
      this.barPos = 0;
      this.barVel = 0;
    } else if (this.barPos + this.barWidth > 100) {
      this.barPos = 100 - this.barWidth;
      this.barVel = 0;
    }

    // 3. Fish AI Physics
    if (!this.isLocked) {
      this.updateFishAI(dt);
    }

    // 4. Collision Check: Is Fish Needle inside White Slider Bar?
    const barLeft = this.barPos;
    const barRight = this.barPos + this.barWidth;
    this.isInside = (this.fishPos >= barLeft && this.fishPos <= barRight);

    // 5. Progress Calculation
    const progressGainRate = 16.0; // % per sec
    const progressDrainRate = 12.0; // % per sec

    if (this.isInside) {
      this.progress += progressGainRate * dt;
      if (Math.random() < 0.1) tg.impactLight();
    } else {
      this.progress -= progressDrainRate * dt;
      this.perfectCatch = false;
      this.perfectBadge.classList.add('hidden');
    }

    this.progress = Math.max(0, Math.min(100, this.progress));

    // 6. Check Win / Loss Conditions
    if (this.progress >= 100) {
      this.stop();
      this.onSuccess(this.currentFish, this.perfectCatch);
      return;
    } else if (this.progress <= 0) {
      this.stop();
      this.onFailed(this.currentFish);
      return;
    }

    this.updateDOM();
  }

  updateFishAI(dt) {
    this.fishTimer -= dt;

    const rodResilience = this.currentRod ? this.currentRod.resilience : 1.0;
    const resilienceDampener = Math.max(0.4, 1.0 - (rodResilience - 1.0) * 0.4);

    if (this.fishTimer <= 0) {
      let switchInterval = 1.2;
      let moveSpeed = 40;

      switch (this.fishBehavior) {
        case 'calm':
          switchInterval = 1.4 + Math.random() * 1.0;
          this.fishTargetPos = 20 + Math.random() * 60;
          moveSpeed = (30 + Math.random() * 20) * resilienceDampener;
          break;
        case 'erratic':
          switchInterval = 0.5 + Math.random() * 0.6;
          this.fishTargetPos = 10 + Math.random() * 80;
          moveSpeed = (55 + Math.random() * 35) * resilienceDampener;
          break;
        case 'thrashing':
          switchInterval = 0.3 + Math.random() * 0.4;
          this.fishTargetPos = Math.random() > 0.5 ? 88 : 12;
          moveSpeed = (75 + Math.random() * 45) * resilienceDampener;
          break;
        default:
          switchInterval = 1.0;
          this.fishTargetPos = 15 + Math.random() * 70;
          moveSpeed = 40 * resilienceDampener;
      }

      this.fishTimer = switchInterval;
      this.fishSpeed = moveSpeed;
    }

    // Smooth movement towards target position
    const diff = this.fishTargetPos - this.fishPos;
    const step = (diff > 0 ? 1 : -1) * (this.fishSpeed || 40) * dt;

    if (Math.abs(diff) < Math.abs(step)) {
      this.fishPos = this.fishTargetPos;
    } else {
      this.fishPos += step;
    }

    this.fishPos = Math.max(5, Math.min(95, this.fishPos));
  }

  updateDOM() {
    this.whiteBar.style.left = `${this.barPos}%`;
    this.fishNeedle.style.left = `${this.fishPos}%`;

    const roundedProg = Math.round(this.progress);
    this.bottomProgressFill.style.width = `${roundedProg}%`;
    this.progressNum.textContent = `${roundedProg}%`;

    if (this.isInside) {
      this.whiteBar.classList.add('active-hit');
      this.needleFishIcon.style.color = '#38bdf8';
    } else {
      this.whiteBar.classList.remove('active-hit');
      this.needleFishIcon.style.color = '#94a3b8';
    }
  }
}
