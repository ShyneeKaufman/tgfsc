import { state } from '../core/state.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { liveFeed } from '../core/liveFeed.js';

export class HUD {
  constructor(container, onCastStart, onCastRelease, onShakeClick, onHookClick, onTabChange) {
    this.container = container;
    this.onCastStart = onCastStart;
    this.onCastRelease = onCastRelease;
    this.onShakeClick = onShakeClick;
    this.onHookClick = onHookClick;
    this.onTabChange = onTabChange;

    this.activeTab = 'fishing';
    this.castPower = 0;
    this.powerActive = false;
    this.powerDirection = 1;
    this.powerAnimId = null;

    this.render();
    this.bindEvents();
    state.subscribe(() => this.updateState());

    // Subscribe to live feed ticker
    liveFeed.subscribe((event) => this.displayLiveCatch(event));
  }

  render() {
    const user = tg.getUser();
    const rod = state.getEquippedRod();
    const bait = state.getEquippedBait();
    const biome = state.getCurrentBiome();
    const expPct = Math.round((state.exp / state.getMaxExp()) * 100);
    const anglers = liveFeed.getAnglersForCurrentBiome();

    this.container.innerHTML = `
      <!-- Live Global Catch Ticker -->
      <div class="live-catch-ticker" id="liveCatchTicker">
        <div class="ticker-content" id="tickerContent">
          <span class="ticker-pulse">🔴 LIVE</span>
          <span class="ticker-text" id="tickerText">Океан спокоен... Забрасывайте удочки!</span>
        </div>
      </div>

      <!-- Top Status Header -->
      <header class="game-header">
        <div class="header-left">
          <div class="user-badge">
            <div class="avatar-ring">${user.photoUrl ? `<img src="${user.photoUrl}" class="avatar-img"/>` : '🎣'}</div>
            <div class="user-meta">
              <div class="user-name">${user.firstName || user.username}</div>
              <div class="level-pill">Ур. <span id="hudLevel">${state.level}</span></div>
            </div>
          </div>
          <div class="exp-bar-container">
            <div class="exp-bar-fill" id="hudExpFill" style="width: ${expPct}%"></div>
            <span class="exp-text" id="hudExpText">${state.exp} / ${state.getMaxExp()} XP</span>
          </div>
        </div>

        <div class="header-right">
          <div class="currency-badge coins" title="Монеты">
            <span class="coin-icon">🪙</span>
            <span class="coin-value" id="hudCoins">${state.coins.toLocaleString('ru-RU')}</span>
          </div>
          <div class="currency-badge pearls" title="Жемчуг Бездны">
            <span class="pearl-icon">💎</span>
            <span class="pearl-value" id="hudPearls">${state.pearls}</span>
          </div>
          <button class="sound-toggle" id="soundToggleBtn" aria-label="Звук">
            ${sound.muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <!-- Active Location, Online Anglers & Gear Ribbon -->
      <div class="sub-header-ribbon">
        <div class="ribbon-left">
          <div class="biome-pill" id="hudBiome">
            <span class="biome-icon">${biome.icon}</span>
            <span class="biome-name">${biome.name}</span>
          </div>
          
          <!-- Live Anglers at this location -->
          <div class="anglers-pill" id="hudAnglersPill" title="Рыбаки на этой локации">
            <span class="anglers-dot"></span>
            <span class="anglers-count" id="hudAnglersCount">👥 ${anglers.length + 1} онлайн</span>
          </div>

          <div class="streak-pill ${state.streak > 0 ? '' : 'hidden'}" id="hudStreakPill">
            <span>🔥</span>
            <span id="hudStreakText">Стрик x${state.streak}</span>
          </div>
        </div>

        <div class="gear-status">
          <div class="gear-item" id="hudRodPill" title="Текущая удочка">
            <span>${rod.icon}</span>
            <span class="gear-name">${rod.name}</span>
          </div>
          <div class="gear-item" id="hudBaitPill" title="Текущая наживка">
            <span>${bait.icon}</span>
            <span class="gear-name">${bait.name} ${state.equippedBaitId !== 'none' ? `(${state.baits[state.equippedBaitId] || 0})` : ''}</span>
          </div>
        </div>
      </div>

      <!-- Floating Fisch Shake Button Area -->
      <div class="fisch-shake-layer hidden" id="shakeLayer">
        <button class="btn-fisch-shake" id="shakeBtn">
          <span class="shake-inner">SHAKE! 💥</span>
        </button>
      </div>

      <!-- Central Floating Cast / Action Area -->
      <div class="fishing-action-zone" id="fishingActionZone">
        <!-- Fisch Cast Accuracy Meter -->
        <div class="cast-meter-container hidden" id="castMeter">
          <div class="cast-meter-track">
            <div class="cast-meter-zones">
              <div class="zone-meh"></div>
              <div class="zone-good"></div>
              <div class="zone-perfect"></div>
            </div>
            <div class="cast-meter-cursor" id="castCursor"></div>
          </div>
          <div class="cast-meter-labels">
            <span>0%</span>
            <span class="perfect-label">PERFECT</span>
            <span>100%</span>
          </div>
        </div>

        <!-- Cast Accuracy Grade Toast -->
        <div class="cast-grade-popup hidden" id="castGradePopup">
          <span class="grade-text" id="gradeText">PERFECT!!</span>
        </div>

        <!-- Big Cast Button -->
        <button class="btn-cast" id="castBtn">
          <div class="btn-cast-inner">
            <span class="cast-icon">🎣</span>
            <span class="cast-text" id="castBtnText">ЗАБРОСИТЬ</span>
          </div>
          <div class="cast-glow"></div>
        </button>

        <!-- Bite Notification Overlay -->
        <div class="bite-alert-banner hidden" id="biteAlertBanner">
          <div class="bite-content">
            <span class="bite-emoji">⚡</span>
            <span class="bite-title">КЛЮЁТ! ПОДСЕКАЙ!</span>
          </div>
        </div>
      </div>

      <!-- Bottom Dock Navigation -->
      <nav class="bottom-dock">
        <button class="dock-tab active" data-tab="fishing" id="tabFishing">
          <span class="tab-icon">🌊</span>
          <span class="tab-label">Вода</span>
        </button>
        <button class="dock-tab" data-tab="backpack" id="tabBackpack">
          <span class="tab-icon">🎒</span>
          <span class="tab-label">Садок</span>
          <span class="badge" id="hudBagBadge" style="display: ${state.inventory.length > 0 ? 'flex' : 'none'}">${state.inventory.length}</span>
        </button>
        <button class="dock-tab" data-tab="shop" id="tabShop">
          <span class="tab-icon">🏪</span>
          <span class="tab-label">Снасти</span>
        </button>
        <button class="dock-tab" data-tab="fishdex" id="tabFishdex">
          <span class="tab-icon">📖</span>
          <span class="tab-label">FishDex</span>
        </button>
        <button class="dock-tab" data-tab="map" id="tabMap">
          <span class="tab-icon">🗺️</span>
          <span class="tab-label">Карта</span>
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
    this.shakeLayer = this.container.querySelector('#shakeLayer');
    this.shakeBtn = this.container.querySelector('#shakeBtn');
    this.tickerText = this.container.querySelector('#tickerText');
    this.tickerContainer = this.container.querySelector('#liveCatchTicker');
  }

  displayLiveCatch(event) {
    if (!this.tickerText) return;

    const mutBadge = event.mutationId !== 'normal' ? `[${event.mutation}] ` : '';
    const locTag = `<span class="ticker-loc">${event.biomeName}</span>`;

    if (event.isLocal) {
      this.tickerText.innerHTML = `🌟 <strong>Вы</strong> выловили ${event.fishIcon} <strong>${mutBadge}${event.fishName}</strong> (${event.weight} кг) в ${locTag}! (+${event.price} 🪙)`;
    } else {
      this.tickerText.innerHTML = `🎣 <strong>${event.playerName}</strong> поймал ${event.fishIcon} <strong>${mutBadge}${event.fishName}</strong> (${event.weight} кг) в ${locTag}!`;
    }

    this.tickerContainer.classList.add('flash');
    setTimeout(() => {
      this.tickerContainer.classList.remove('flash');
    }, 1200);
  }

  bindEvents() {
    // Sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      tg.selectionChanged();
    });

    // Hold-to-Cast Mechanics
    const startCastHold = (e) => {
      e.preventDefault();
      if (this.castBtn.classList.contains('waiting')) {
        // Cancel cast
        this.onCastRelease(0, true);
        return;
      }
      if (this.castBtn.classList.contains('bite')) {
        // Hook
        this.onHookClick();
        return;
      }

      this.startPowerMeter();
      this.onCastStart();
    };

    const endCastHold = (e) => {
      if (!this.powerActive) return;
      e.preventDefault();
      const finalPower = this.stopPowerMeter();
      this.onCastRelease(finalPower, false);
    };

    this.castBtn.addEventListener('mousedown', startCastHold);
    this.castBtn.addEventListener('mouseup', endCastHold);
    this.castBtn.addEventListener('touchstart', startCastHold, { passive: false });
    this.castBtn.addEventListener('touchend', endCastHold, { passive: false });

    // Shake button click
    this.shakeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.relocateShakeButton();
      this.onShakeClick();
    });

    // Dock tabs
    const tabs = this.container.querySelectorAll('.dock-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.setActiveTab(target);
      });
    });
  }

  startPowerMeter() {
    this.powerActive = true;
    this.castPower = 0;
    this.powerDirection = 1;
    this.castMeter.classList.remove('hidden');

    const animatePower = () => {
      if (!this.powerActive) return;

      this.castPower += this.powerDirection * 2.8;
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
  }

  stopPowerMeter() {
    this.powerActive = false;
    if (this.powerAnimId) cancelAnimationFrame(this.powerAnimId);
    this.castMeter.classList.add('hidden');

    const accuracy = Math.round(this.castPower);
    this.showAccuracyGrade(accuracy);
    return accuracy;
  }

  showAccuracyGrade(accuracy) {
    let grade = 'Meh..';
    let color = '#94a3b8';

    if (accuracy >= 95) {
      grade = 'PERFECT!!';
      color = '#f59e0b';
      state.stats.perfectCasts += 1;
    } else if (accuracy >= 85) {
      grade = 'Amazing!';
      color = '#22d3ee';
    } else if (accuracy >= 70) {
      grade = 'Great!';
      color = '#10b981';
    } else if (accuracy >= 50) {
      grade = 'Good!';
      color = '#38bdf8';
    } else if (accuracy >= 30) {
      grade = 'Fine.';
      color = '#e2e8f0';
    }

    this.gradeText.textContent = grade;
    this.gradeText.style.color = color;
    this.castGradePopup.classList.remove('hidden');

    setTimeout(() => {
      this.castGradePopup.classList.add('hidden');
    }, 1400);
  }

  showShakeButton() {
    this.shakeLayer.classList.remove('hidden');
    this.relocateShakeButton();
  }

  hideShakeButton() {
    this.shakeLayer.classList.add('hidden');
  }

  relocateShakeButton() {
    const randomX = 15 + Math.random() * 65;
    const randomY = 25 + Math.random() * 40;

    this.shakeBtn.style.left = `${randomX}%`;
    this.shakeBtn.style.top = `${randomY}%`;

    sound.playClick();
    tg.impactLight();
  }

  setActiveTab(tabName) {
    this.activeTab = tabName;
    const tabs = this.container.querySelectorAll('.dock-tab');
    tabs.forEach(t => {
      if (t.dataset.tab === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    const actionZone = this.container.querySelector('#fishingActionZone');
    if (actionZone) {
      if (tabName === 'fishing') {
        actionZone.classList.remove('hidden');
      } else {
        actionZone.classList.add('hidden');
      }
    }

    sound.playClick();
    tg.selectionChanged();
    this.onTabChange(tabName);
  }

  setCastState(status, customText = null) {
    if (status === 'idle') {
      this.castBtn.classList.remove('waiting', 'bite', 'hidden');
      this.castBtnText.textContent = customText || 'ЗАБРОСИТЬ';
      this.biteBanner.classList.add('hidden');
      this.hideShakeButton();
    } else if (status === 'waiting') {
      this.castBtn.classList.add('waiting');
      this.castBtn.classList.remove('bite', 'hidden');
      this.castBtnText.textContent = 'ОЖИДАНИЕ...';
      this.biteBanner.classList.add('hidden');
      this.showShakeButton();
    } else if (status === 'bite') {
      this.castBtn.classList.remove('waiting', 'hidden');
      this.castBtn.classList.add('bite');
      this.castBtnText.textContent = 'ПОДСЕЧЬ!';
      this.biteBanner.classList.remove('hidden');
      this.hideShakeButton();
    } else if (status === 'reeling') {
      this.castBtn.classList.add('hidden');
      this.biteBanner.classList.add('hidden');
      this.hideShakeButton();
    }
  }

  updateState() {
    const rod = state.getEquippedRod();
    const bait = state.getEquippedBait();
    const biome = state.getCurrentBiome();
    const expPct = Math.round((state.exp / state.getMaxExp()) * 100);
    const anglers = liveFeed.getAnglersForCurrentBiome();

    const levelEl = this.container.querySelector('#hudLevel');
    if (levelEl) levelEl.textContent = state.level;

    const coinsEl = this.container.querySelector('#hudCoins');
    if (coinsEl) coinsEl.textContent = state.coins.toLocaleString('ru-RU');

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
      if (state.inventory.length >= state.backpackCapacity) {
        bagBadge.classList.add('full');
      } else {
        bagBadge.classList.remove('full');
      }
    }

    const biomeEl = this.container.querySelector('#hudBiome');
    if (biomeEl) {
      biomeEl.innerHTML = `<span class="biome-icon">${biome.icon}</span><span class="biome-name">${biome.name}</span>`;
    }

    const anglersCountEl = this.container.querySelector('#hudAnglersCount');
    if (anglersCountEl) {
      anglersCountEl.textContent = `👥 ${anglers.length + 1} онлайн`;
    }

    const streakPill = this.container.querySelector('#hudStreakPill');
    const streakText = this.container.querySelector('#hudStreakText');
    if (streakPill && streakText) {
      if (state.streak > 0) {
        streakPill.classList.remove('hidden');
        streakText.textContent = `Стрик x${state.streak} (+${state.getStreakLuckBonus()}%)`;
      } else {
        streakPill.classList.add('hidden');
      }
    }

    const rodPill = this.container.querySelector('#hudRodPill');
    if (rodPill) {
      rodPill.innerHTML = `<span>${rod.icon}</span><span class="gear-name">${rod.name}</span>`;
    }

    const baitPill = this.container.querySelector('#hudBaitPill');
    if (baitPill) {
      baitPill.innerHTML = `<span>${bait.icon}</span><span class="gear-name">${bait.name} ${state.equippedBaitId !== 'none' ? `(${state.baits[state.equippedBaitId] || 0})` : ''}</span>`;
    }
  }
}
