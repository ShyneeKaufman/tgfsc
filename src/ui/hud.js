import { state } from '../core/state.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';

export class HUD {
  constructor(container, onCastClick, onTabChange) {
    this.container = container;
    this.onCastClick = onCastClick;
    this.onTabChange = onTabChange;
    this.activeTab = 'fishing';
    this.castPower = 0;
    this.powerDirection = 1;
    this.powerActive = false;

    this.render();
    this.bindEvents();
    state.subscribe(() => this.updateState());
  }

  render() {
    const user = tg.getUser();
    const rod = state.getEquippedRod();
    const bait = state.getEquippedBait();
    const biome = state.getCurrentBiome();
    const expPct = Math.round((state.exp / state.getMaxExp()) * 100);

    this.container.innerHTML = `
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

      <!-- Active Location & Gear Ribbon -->
      <div class="sub-header-ribbon">
        <div class="biome-pill" id="hudBiome">
          <span class="biome-icon">${biome.icon}</span>
          <span class="biome-name">${biome.name}</span>
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

      <!-- Central Floating Cast / Action Area -->
      <div class="fishing-action-zone" id="fishingActionZone">
        <!-- Power Bar Meter (Active during casting hold) -->
        <div class="power-meter-container hidden" id="powerMeter">
          <div class="power-track">
            <div class="power-sweetspot"></div>
            <div class="power-cursor" id="powerCursor"></div>
          </div>
          <div class="power-label">СИЛА ЗАБРОСА</div>
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
          <div class="bite-pulse"></div>
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
    this.powerMeter = this.container.querySelector('#powerMeter');
    this.powerCursor = this.container.querySelector('#powerCursor');
    this.biteBanner = this.container.querySelector('#biteAlertBanner');
    this.soundToggleBtn = this.container.querySelector('#soundToggleBtn');
  }

  bindEvents() {
    // Sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      tg.selectionChanged();
    });

    // Cast button click
    this.castBtn.addEventListener('click', () => {
      this.onCastClick();
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
    } else if (status === 'waiting') {
      this.castBtn.classList.add('waiting');
      this.castBtn.classList.remove('bite', 'hidden');
      this.castBtnText.textContent = 'ОЖИДАНИЕ...';
      this.biteBanner.classList.add('hidden');
    } else if (status === 'bite') {
      this.castBtn.classList.remove('waiting', 'hidden');
      this.castBtn.classList.add('bite');
      this.castBtnText.textContent = 'ПОДСЕЧЬ!';
      this.biteBanner.classList.remove('hidden');
    } else if (status === 'reeling') {
      this.castBtn.classList.add('hidden');
      this.biteBanner.classList.add('hidden');
    }
  }

  updateState() {
    const rod = state.getEquippedRod();
    const bait = state.getEquippedBait();
    const biome = state.getCurrentBiome();
    const expPct = Math.round((state.exp / state.getMaxExp()) * 100);

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
