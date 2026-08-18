import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';

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
    this.perfectCatch = true; // Lost progress flag

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
            <div class="reeling-fish-badge" id="reelingFishName">🐟 Рыба на крючке</div>
            <div class="reeling-perfect-badge ${this.perfectCatch ? '' : 'hidden'}" id="reelingPerfectBadge">✨ PERFECT CATCH</div>
            <div class="reeling-progress-num" id="reelingProgressNum">20%</div>
          </div>

          <!-- Exact Fisch Minigame Track from Photo -->
          <div class="fisch-track-container">
            <span class="track-arrow left">▶</span>

            <div class="fisch-main-track" id="mainTrack">
              <!-- White Slider Bar with motion arrow -->
              <div class="fisch-white-bar" id="whiteBar">
                <div class="fisch-slider-arrow" id="sliderArrow">➔</div>
              </div>

              <!-- Fish Needle & Icon -->
              <div class="fisch-needle-container" id="fishNeedle">
                <div class="needle-indicator-line"></div>
                <div class="needle-fish-icon" id="needleFishIcon">🐟</div>
              </div>
            </div>

            <span class="track-arrow right">◀</span>
          </div>

          <!-- Bottom Progress Bar right underneath -->
          <div class="fisch-bottom-progress-track">
            <div class="fisch-bottom-progress-fill" id="bottomProgressFill"></div>
          </div>

          <div class="reeling-instructions">
            Удерживай экран, чтобы двигать ползунок вправо. Отпусти — влево!
          </div>
        </div>
      </div>
    `;

    this.overlay = this.container.querySelector('#reelingOverlay');
    this.panel = this.container.querySelector('#reelingPanel');
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
      this.whiteBar.classList.add('active-pull');
      this.sliderArrow.style.opacity = '1';
      this.sliderArrow.style.transform = 'scaleX(1)';
    };

    const handleInputEnd = (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.isHolding = false;
      this.whiteBar.classList.remove('active-pull');
      this.sliderArrow.style.opacity = '0.5';
      this.sliderArrow.style.transform = 'scaleX(-1)';
    };

    // Global listener when reeling is active
    window.addEventListener('mousedown', handleInputStart);
    window.addEventListener('mouseup', handleInputEnd);
    window.addEventListener('touchstart', handleInputStart, { passive: false });
    window.addEventListener('touchend', handleInputEnd, { passive: false });

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
    this.lockTimer = 1.0; // 1.0s intro lock

    // Calculate bar width based on rod control/resilience (30% base + rod bonus)
    const controlBonus = (rod.barSize - 0.22) * 100;
    this.barWidth = Math.max(24, Math.min(48, 30 + controlBonus));
    this.whiteBar.style.width = `${this.barWidth}%`;

    this.fishBehavior = fish.behavior || 'calm';
    this.fishNameBadge.textContent = `${fish.icon} ${fish.name}`;
    this.needleFishIcon.textContent = fish.icon;

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

    // Initial 1.0s lock warmup
    if (this.isLocked) {
      this.lockTimer -= dt;
      if (this.lockTimer <= 0) {
        this.isLocked = false;
      }
    }

    // 1. Slider Physics: Accelerates Right on Hold, Accelerates Left on Release
    const accelRight = 380; // %/s^2
    const accelLeft = 320;  // %/s^2
    const maxSpeed = 160;   // %/s
    const friction = 0.94;

    if (!this.isLocked) {
      if (this.isHolding) {
        this.barVel += accelRight * dt;
      } else {
        this.barVel -= accelLeft * dt;
      }
    }

    this.barVel = Math.max(-maxSpeed, Math.min(maxSpeed, this.barVel * friction));
    this.barPos += this.barVel * dt;

    // Bounce off walls
    const maxBarLeft = 100 - this.barWidth;
    if (this.barPos < 0) {
      this.barPos = 0;
      this.barVel = -this.barVel * 0.35; // Bounce with dampening
    } else if (this.barPos > maxBarLeft) {
      this.barPos = maxBarLeft;
      this.barVel = -this.barVel * 0.35;
    }

    // 2. Fish Movement AI (Resilience dampens fish vigorousness)
    const resilienceDamp = Math.max(0.4, 1.0 - (this.currentRod.resilience || 0.5) * 0.4);
    this.updateFishAI(dt, resilienceDamp);

    // 3. Check if Fish is Inside the White Slider
    const fishInside = (this.fishPos >= this.barPos && this.fishPos <= this.barPos + this.barWidth);
    this.isInside = fishInside;

    // 4. Progress Gain / Drain (14%/s gain, 12%/s drain)
    if (!this.isLocked) {
      if (fishInside) {
        this.progress += 14.5 * dt;
        if (Math.random() < 0.2) {
          sound.playReelClick();
          tg.impactLight();
        }
      } else {
        this.progress -= 11.5 * dt;
        this.perfectCatch = false;
        this.perfectBadge.classList.add('hidden');
      }
    }

    this.progress = Math.max(0, Math.min(100, this.progress));

    // 5. Check Win / Loss
    if (this.progress >= 100) {
      const fish = this.currentFish;
      const isPerfect = this.perfectCatch;
      this.stop();
      sound.playCatchFanfare();
      tg.notificationSuccess();
      this.onSuccess(fish, isPerfect);
      return;
    }

    if (this.progress <= 0 && !this.isLocked) {
      const fish = this.currentFish;
      this.stop();
      this.onFailed(fish);
      return;
    }

    this.updateDOM();
  }

  updateFishAI(dt, resilienceDamp) {
    this.fishTimer -= dt;

    if (this.fishTimer <= 0) {
      switch (this.fishBehavior) {
        case 'calm':
          this.fishTargetPos = 20 + Math.random() * 60;
          this.fishTimer = (1.2 + Math.random() * 1.5) * resilienceDamp;
          break;
        case 'darting':
          this.fishTargetPos = Math.random() < 0.5 ? (5 + Math.random() * 25) : (70 + Math.random() * 25);
          this.fishTimer = (0.6 + Math.random() * 0.8) * resilienceDamp;
          break;
        case 'thrashing':
          this.fishTargetPos = Math.max(10, Math.min(90, this.fishPos + (Math.random() - 0.5) * 70));
          this.fishTimer = (0.4 + Math.random() * 0.6) * resilienceDamp;
          break;
        case 'erratic':
          this.fishTargetPos = 5 + Math.random() * 90;
          this.fishTimer = (0.25 + Math.random() * 0.45) * resilienceDamp;
          break;
        default:
          this.fishTargetPos = 25 + Math.random() * 50;
          this.fishTimer = 1.0;
      }
    }

    // Smooth lerp fish position towards target
    const speed = (this.fishBehavior === 'erratic' ? 5.5 : (this.fishBehavior === 'darting' ? 4.5 : 2.8)) / resilienceDamp;
    this.fishPos += (this.fishTargetPos - this.fishPos) * speed * dt;
    this.fishPos = Math.max(3, Math.min(97, this.fishPos));
  }

  updateDOM() {
    this.whiteBar.style.left = `${this.barPos}%`;
    this.fishNeedle.style.left = `${this.fishPos}%`;
    this.bottomProgressFill.style.width = `${this.progress}%`;
    this.progressNum.textContent = `${Math.round(this.progress)}%`;

    if (this.isInside) {
      this.whiteBar.classList.add('inside-target');
      this.panel.classList.remove('danger');
    } else {
      this.whiteBar.classList.remove('inside-target');
      if (this.progress < 30) {
        this.panel.classList.add('danger');
      } else {
        this.panel.classList.remove('danger');
      }
    }
  }
}
