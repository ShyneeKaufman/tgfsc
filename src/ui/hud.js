import { state } from '../core/state.js';
import { tg } from '../core/telegram.js';
import { sound } from '../core/sound.js';
import { liveFeed } from '../core/liveFeed.js';
import { events } from '../core/events.js';
import { getIconSvg } from './icons.js';

export class HUD {
  constructor(container, onCastStart, onCastRelease, onShakeClick, onHookClick, onTabChange, onOpenDaily, onOpenRef, onOpenAdmin) {
    this.container = container;
    this.onCastStart = onCastStart;
    this.onCastRelease = onCastRelease;
    this.onShakeClick = onShakeClick;
    this.onHookClick = onHookClick;
    this.onTabChange = onTabChange;
    this.onOpenDaily = onOpenDaily;
    this.onOpenRef = onOpenRef;
    this.onOpenAdmin = onOpenAdmin;

    this.activeTab = 'fishing';
    this.castPower = 0;
    this.powerActive = false;
    this.powerDirection = 1;
    this.powerAnimId = null;

    this.render();
    this.bindEvents();
    state.subscribe(() => this.updateState());

    // Subscribe to catch events
    liveFeed.subscribe((event) => this.displayCatchEvent(event));

    // Subscribe to global event cycles
    events.subscribe((currentEvent, remainingTime) => this.updateGlobalEvent(currentEvent, remainingTime));
  }

  render() {
    const user = tg.getUser();
    const rod = state.getEquippedRod();
    const bait = state.getEquippedBait();
    const biome = state.getCurrentBiome();
    const expPct = Math.round((state.exp / state.getMaxExp()) * 100);

    this.container.innerHTML = `
      <!-- Top Catch / Status Ticker -->
      <div class="live-catch-ticker" id="liveCatchTicker">
        <div class="ticker-content" id="tickerContent">
          <span class="ticker-pulse">LOG</span>
          <span class="ticker-text" id="tickerText">Ready to cast line at ${biome.name}</span>
        </div>
      </div>

      <!-- Active Global Event / Weather Banner -->
      <div class="global-event-banner hidden" id="globalEventBanner">
        <span class="event-icon" id="eventIcon">${getIconSvg('zap', 18)}</span>
        <div class="event-info">
          <div class="event-title" id="eventTitle">ABYSSAL STORM</div>
          <div class="event-desc" id="eventDesc">+25 Luck & 2.5x Mutation Rates</div>
        </div>
        <div class="event-timer-badge" id="eventTimer">02:30</div>
      </div>

      <!-- Top Status Header -->
      <header class="game-header">
        <div class="header-left">
          <div class="user-badge">
            <div class="avatar-ring">${user.photoUrl ? `<img src="${user.photoUrl}" class="avatar-img"/>` : getIconSvg('anchor', 16)}</div>
            <div class="user-meta">
              <div class="user-name">${user.firstName || user.username}</div>
              <div class="level-pill">Lvl <span id="hudLevel">${state.level}</span></div>
            </div>
          </div>
          <div class="exp-bar-container">
            <div class="exp-bar-fill" id="hudExpFill" style="width: ${expPct}%"></div>
            <span class="exp-text" id="hudExpText">${state.exp} / ${state.getMaxExp()} XP</span>
          </div>
        </div>

        <div class="header-right">
          <div class="currency-badge coins" title="Coins (C$)">
            ${getIconSvg('coins', 13)}
            <span class="coin-value" id="hudCoins">${state.coins.toLocaleString('en-US')}</span>
          </div>
          <div class="currency-badge pearls" title="Abyssal Pearls">
            ${getIconSvg('gem', 13)}
            <span class="pearl-value" id="hudPearls">${state.pearls}</span>
          </div>
          <button class="header-action-btn" id="dailyBtn" title="Daily Rewards">
            ${getIconSvg('gift', 15)}
          </button>
          <button class="header-action-btn" id="refBtn" title="Invite Friends">
            ${getIconSvg('userPlus', 15)}
          </button>
          ${tg.isAdmin() ? `
            <button class="header-action-btn admin-btn-glow" id="adminBtn" title="Admin Console">
              ${getIconSvg('shield', 15)}
            </button>
          ` : ''}
          <button class="sound-toggle" id="soundToggleBtn" aria-label="Sound">
            ${sound.muted ? getIconSvg('mute', 14) : getIconSvg('volume', 14)}
          </button>
        </div>
      </header>

      <!-- Active Location & Gear Ribbon -->
      <div class="sub-header-ribbon">
        <div class="gear-pills-left">
          <div class="hud-pill location-pill" id="hudBiome">
            <span class="biome-icon">${getIconSvg(biome.iconKey || 'palmtree', 13)}</span>
            <span class="biome-name">${biome.name}</span>
          </div>
          <div class="hud-pill rod-pill" id="hudRodPill">
            <span>${getIconSvg(rod.iconKey || 'anchor', 12)}</span>
            <span class="gear-name">${rod.name}</span>
          </div>
          <div class="hud-pill bait-pill" id="hudBaitPill">
            <span>${getIconSvg(bait.iconKey || 'crosshair', 12)}</span>
            <span class="gear-name">${bait.name}</span>
          </div>
        </div>
        <div class="hud-pill streak-pill ${state.streak > 0 ? '' : 'hidden'}" id="hudStreakPill">
          <span class="streak-flame">${getIconSvg('flame', 13)}</span>
          <span class="streak-text" id="hudStreakText">Streak x${state.streak} (+${state.getStreakLuckBonus()}%)</span>
        </div>
      </div>

      <!-- Action Controls & Overlays -->
      <div class="action-controls-layer" id="actionLayer">
        <!-- Cast Meter Ring -->
        <div class="cast-meter-container hidden" id="castMeter">
          <div class="cast-meter-track">
            <div class="cast-zone perfect-zone"></div>
            <div class="cast-zone great-zone"></div>
            <div class="cast-cursor" id="castCursor"></div>
          </div>
          <div class="cast-meter-labels">
            <span>0%</span>
            <span class="perfect-label">PERFECT</span>
            <span>100%</span>
          </div>
        </div>

        <!-- Grade Popup (Perfect / Great / Good) -->
        <div class="cast-grade-popup hidden" id="castGradePopup">
          <span class="grade-text" id="gradeText">PERFECT!</span>
          <span class="grade-bonus" id="gradeBonus">+20 Luck</span>
        </div>

        <!-- Bite Indicator Banner -->
        <div class="bite-alert-banner hidden" id="biteAlertBanner">
          <span class="bite-icon">${getIconSvg('zap', 24)}</span>
          <span class="bite-title">FISH BITE!</span>
          <span class="bite-subtitle">TAP TO HOOK!</span>
        </div>

        <!-- Floating Shake / Interactive Layer -->
        <div class="shake-layer hidden" id="shakeLayer">
          <button class="btn-fisch-shake" id="shakeBtn">
            <span class="shake-text">SHAKE</span>
          </button>
        </div>

        <!-- Cast / Reel Primary Button -->
        <div class="cast-btn-wrapper" id="castBtnWrapper">
          <button class="btn-primary-cast" id="castBtn">
            <span class="cast-icon">${getIconSvg('crosshair', 18)}</span>
            <span class="cast-label" id="castBtnText">HOLD TO CAST</span>
          </button>
        </div>
      </div>

      <!-- Bottom Dock Navigation -->
      <nav class="bottom-dock">
        <button class="dock-tab active" data-tab="fishing" id="tabFishing">
          <span class="tab-icon">${getIconSvg('waves', 20)}</span>
          <span class="tab-label">Fish</span>
        </button>
        <button class="dock-tab" data-tab="backpack" id="tabBackpack">
          <span class="tab-icon">${getIconSvg('bag', 20)}</span>
          <span class="tab-label">Backpack</span>
          <span class="badge" id="hudBagBadge" style="display: ${state.inventory.length > 0 ? 'flex' : 'none'}">${state.inventory.length}</span>
        </button>
        <button class="dock-tab" data-tab="shop" id="tabShop">
          <span class="tab-icon">${getIconSvg('store', 20)}</span>
          <span class="tab-label">Shop</span>
        </button>
        <button class="dock-tab" data-tab="fishdex" id="tabFishdex">
          <span class="tab-icon">${getIconSvg('book', 20)}</span>
          <span class="tab-label">Bestiary</span>
        </button>
        <button class="dock-tab" data-tab="map" id="tabMap">
          <span class="tab-icon">${getIconSvg('map', 20)}</span>
          <span class="tab-label">Map</span>
        </button>
      </nav>
    `;

    this.castBtn = this.container.querySelector('#castBtn');
    this.castBtnText = this.container.querySelector('#castBtnText');
    this.castMeter = this.container.querySelector('#castMeter');
    this.castCursor = this.container.querySelector('#castCursor');
    this.castGradePopup = this.container.querySelector('#castGradePopup');
    this.gradeText = this.container.querySelector('#gradeText');
    this.biteBanner = this.container.querySelector('#biteAlertBanner');
    this.soundToggleBtn = this.container.querySelector('#soundToggleBtn');
    this.dailyBtn = this.container.querySelector('#dailyBtn');
    this.refBtn = this.container.querySelector('#refBtn');
    this.adminBtn = this.container.querySelector('#adminBtn');
    this.shakeLayer = this.container.querySelector('#shakeLayer');
    this.shakeBtn = this.container.querySelector('#shakeBtn');
    this.tickerText = this.container.querySelector('#tickerText');
    this.tickerContainer = this.container.querySelector('#liveCatchTicker');
    this.eventBanner = this.container.querySelector('#globalEventBanner');
    this.eventIcon = this.container.querySelector('#eventIcon');
    this.eventTitle = this.container.querySelector('#eventTitle');
    this.eventDesc = this.container.querySelector('#eventDesc');
    this.eventTimer = this.container.querySelector('#eventTimer');
  }

  displayCatchEvent(event) {
    if (!this.tickerText) return;

    const mutBadge = event.mutationId !== 'normal' ? `[${event.mutation}] ` : '';
    const locTag = `<span class="ticker-loc">${event.biomeName}</span>`;

    if (event.isLocal) {
      this.tickerText.innerHTML = `You caught <strong>${mutBadge}${event.fishName}</strong> (${event.weight} kg) at ${locTag} (+${event.price} C$)`;
    } else {
      this.tickerText.innerHTML = `<strong>${event.playerName}</strong> caught <strong>${mutBadge}${event.fishName}</strong> (${event.weight} kg) at ${locTag}`;
    }

    this.tickerContainer.classList.add('flash');
    setTimeout(() => {
      this.tickerContainer.classList.remove('flash');
    }, 1200);
  }

  updateGlobalEvent(currentEvent, remainingSecs) {
    if (!this.eventBanner) return;

    if (currentEvent) {
      const mins = Math.floor(remainingSecs / 60).toString().padStart(2, '0');
      const secs = (remainingSecs % 60).toString().padStart(2, '0');

      this.eventTitle.textContent = currentEvent.title;
      this.eventDesc.textContent = currentEvent.desc;
      this.eventTimer.textContent = `${mins}:${secs}`;
      this.eventBanner.style.borderColor = currentEvent.color;
      
      if (this.activeTab === 'fishing') {
        this.eventBanner.classList.remove('hidden');
      }
    } else {
      this.eventBanner.classList.add('hidden');
    }
  }

  bindEvents() {
    this.dailyBtn.addEventListener('click', () => this.onOpenDaily());
    this.refBtn.addEventListener('click', () => this.onOpenRef());
    if (this.adminBtn) {
      this.adminBtn.addEventListener('click', () => {
        if (this.onOpenAdmin) this.onOpenAdmin();
      });
    }

    // Sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.soundToggleBtn.innerHTML = isMuted ? getIconSvg('mute', 14) : getIconSvg('volume', 14);
      tg.selectionChanged();
    });

    // Hold-to-Cast Mechanics
    const startCastHold = (e) => {
      e.preventDefault();
      if (this.castBtn.classList.contains('waiting')) {
        this.onCastRelease(0, true);
        return;
      }
      if (this.castBtn.classList.contains('disabled') || this.powerActive) return;

      this.powerActive = true;
      this.castPower = 0;
      this.powerDirection = 1;
      this.castMeter.classList.remove('hidden');
      this.castBtnText.textContent = 'RELEASING...';
      this.castBtn.classList.add('holding');

      this.onCastStart();

      const animatePower = () => {
        if (!this.powerActive) return;

        this.castPower += this.powerDirection * 1.6;
        if (this.castPower >= 100) {
          this.castPower = 100;
          this.powerDirection = -1;
        } else if (this.castPower <= 0) {
          this.castPower = 0;
          this.powerDirection = 1;
        }

        this.castCursor.style.left = `${this.castPower}%`;
        this.powerAnimId = requestAnimationFrame(animatePower);
      };

      this.powerAnimId = requestAnimationFrame(animatePower);
    };

    const endCastHold = (e) => {
      e.preventDefault();
      if (!this.powerActive) return;

      this.powerActive = false;
      if (this.powerAnimId) cancelAnimationFrame(this.powerAnimId);

      this.castMeter.classList.add('hidden');
      this.castBtn.classList.remove('holding');

      // Calculate accuracy bonus
      let grade = 'GOOD';
      let bonusLuck = 5;

      if (this.castPower >= 85 && this.castPower <= 95) {
        grade = 'PERFECT!';
        bonusLuck = 25;
        state.stats.perfectCasts += 1;
        sound.playCatchFanfare();
        tg.notificationSuccess();
      } else if (this.castPower >= 70 && this.castPower <= 100) {
        grade = 'GREAT!';
        bonusLuck = 12;
        sound.playCoin();
        tg.impactMedium();
      } else {
        sound.playCast();
        tg.impactLight();
      }

      this.showGradePopup(grade, bonusLuck);
      this.onCastRelease(bonusLuck);
    };

    this.castBtn.addEventListener('mousedown', startCastHold);
    window.addEventListener('mouseup', endCastHold);

    this.castBtn.addEventListener('touchstart', startCastHold, { passive: false });
    window.addEventListener('touchend', endCastHold, { passive: false });

    // Shake Button tap
    this.shakeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onShakeClick();
    });

    // Bite Banner tap
    this.biteBanner.addEventListener('click', () => {
      this.onHookClick();
    });

    // Bottom Dock navigation
    const dockTabs = this.container.querySelectorAll('.dock-tab');
    dockTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabKey = tab.dataset.tab;
        dockTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tabKey;
        this.onTabChange(tabKey);
        sound.playClick();
        tg.selectionChanged();
      });
    });
  }

  showGradePopup(grade, bonusLuck) {
    this.gradeText.textContent = grade;
    this.gradeText.className = 'grade-text ' + grade.toLowerCase().replace('!', '');
    const bonusEl = this.container.querySelector('#gradeBonus');
    if (bonusEl) bonusEl.textContent = `+${bonusLuck} Luck`;

    this.castGradePopup.classList.remove('hidden');
    setTimeout(() => {
      this.castGradePopup.classList.add('hidden');
    }, 1100);
  }

  // --- External UI State Handlers ---
  setCastState(castState, customText) {
    if (!this.castBtn || !this.castBtnText) return;

    if (castState === 'waiting') {
      this.castBtn.classList.remove('disabled', 'holding', 'bite');
      this.castBtn.classList.add('waiting');
      this.castBtnText.textContent = customText || 'WAITING FOR BITE...';
      this.biteBanner?.classList.add('hidden');
      this.shakeLayer?.classList.remove('hidden');
      this.positionShakeButton();
    } else if (castState === 'bite') {
      this.castBtn.classList.remove('waiting', 'holding', 'disabled');
      this.castBtn.classList.add('bite');
      this.castBtnText.textContent = customText || 'BITE! HOOK NOW!';
      this.biteBanner?.classList.remove('hidden');
      this.shakeLayer?.classList.add('hidden');
    } else if (castState === 'reeling') {
      this.castBtn.classList.remove('waiting', 'holding', 'bite');
      this.castBtn.classList.add('disabled');
      this.castBtnText.textContent = customText || 'REELING FISH...';
      this.biteBanner?.classList.add('hidden');
      this.shakeLayer?.classList.add('hidden');
    } else { // 'idle'
      this.castBtn.classList.remove('waiting', 'holding', 'bite', 'disabled');
      this.castBtnText.textContent = customText || 'HOLD TO CAST';
      this.biteBanner?.classList.add('hidden');
      this.shakeLayer?.classList.add('hidden');
    }
  }

  setWaitingState(durationSecs) {
    this.setCastState('waiting');
  }

  setBiteState() {
    this.setCastState('bite');
  }

  setReelingState() {
    this.setCastState('reeling');
  }

  setIdleState() {
    this.setCastState('idle');
  }

  positionShakeButton() {
    if (!this.shakeBtn) return;
    const minX = 35;
    const maxX = 65;
    const minY = 42;
    const maxY = 62;

    const randX = minX + Math.random() * (maxX - minX);
    const randY = minY + Math.random() * (maxY - minY);

    this.shakeBtn.style.left = `${randX}%`;
    this.shakeBtn.style.top = `${randY}%`;
    this.shakeBtn.classList.add('pop');
    setTimeout(() => this.shakeBtn?.classList.remove('pop'), 200);
  }

  setActiveTab(tabKey) {
    const dockTabs = this.container.querySelectorAll('.dock-tab');
    dockTabs.forEach(tab => {
      if (tab.dataset.tab === tabKey) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    this.activeTab = tabKey;
    this.onTabChange(tabKey);
  }

  updateState() {
    const rod = state.getEquippedRod();
    const bait = state.getEquippedBait();
    const biome = state.getCurrentBiome();
    const expPct = Math.round((state.exp / state.getMaxExp()) * 100);

    const levelEl = this.container.querySelector('#hudLevel');
    if (levelEl) levelEl.textContent = state.level;

    const coinsEl = this.container.querySelector('#hudCoins');
    if (coinsEl) coinsEl.textContent = state.coins.toLocaleString('en-US');

    const pearlsEl = this.container.querySelector('#hudPearls');
    if (pearlsEl) pearlsEl.textContent = state.pearls;

    const expFillEl = this.container.querySelector('#hudExpFill');
    if (expFillEl) expFillEl.style.width = `${expPct}%`;

    const expTextEl = this.container.querySelector('#hudExpText');
    if (expTextEl) expTextEl.textContent = `${state.exp} / ${state.getMaxExp()} XP`;

    const bagBadge = this.container.querySelector('#hudBagBadge');
    if (bagBadge) {
      bagBadge.textContent = state.inventory.length;
      bagBadge.style.display = state.inventory.length > 0 ? 'flex' : 'none';
    }

    const biomeEl = this.container.querySelector('#hudBiome');
    if (biomeEl) {
      biomeEl.innerHTML = `<span class="biome-icon">${getIconSvg(biome.iconKey || 'palmtree', 13)}</span><span class="biome-name">${biome.name}</span>`;
    }

    const streakPill = this.container.querySelector('#hudStreakPill');
    const streakText = this.container.querySelector('#hudStreakText');
    if (streakPill && streakText) {
      if (state.streak > 0) {
        streakPill.classList.remove('hidden');
        streakText.textContent = `Streak x${state.streak} (+${state.getStreakLuckBonus()}%)`;
      } else {
        streakPill.classList.add('hidden');
      }
    }

    const rodPill = this.container.querySelector('#hudRodPill');
    if (rodPill) {
      rodPill.innerHTML = `<span>${getIconSvg(rod.iconKey || 'anchor', 12)}</span><span class="gear-name">${rod.name}</span>`;
    }

    const baitPill = this.container.querySelector('#hudBaitPill');
    if (baitPill) {
      const baitCountStr = bait.id === 'none' ? '' : ` (${state.baits[bait.id] || 0})`;
      baitPill.innerHTML = `<span>${getIconSvg(bait.iconKey || 'crosshair', 12)}</span><span class="gear-name">${bait.name}${baitCountStr}</span>`;
    }
  }
}
