import { RARITIES } from '../data/mutations.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { state } from '../core/state.js';

export class CatchModal {
  constructor(container, onKeep, onSell) {
    this.container = container;
    this.onKeep = onKeep;
    this.onSell = onSell;
    this.currentCatch = null;

    this.setupDOM();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div class="catch-modal-backdrop hidden" id="catchBackdrop">
        <div class="catch-card" id="catchCard">
          <!-- Animated Light Rays & Glow FX -->
          <div class="rarity-rays" id="rarityRays"></div>

          <!-- Rarity Tag Header -->
          <div class="catch-header">
            <span class="rarity-tag" id="catchRarityTag">РЕДКОСТЬ</span>
            <div class="exp-reward-tag" id="catchExpTag">+50 XP</div>
          </div>

          <!-- Fish Icon / Sprite Stage -->
          <div class="fish-display-stage">
            <div class="fish-ring-glow" id="fishRingGlow"></div>
            <div class="fish-hero-icon" id="catchFishIcon">🐟</div>
          </div>

          <!-- Mutation Badge -->
          <div class="mutation-badge hidden" id="catchMutationBadge">
            <span class="mutation-text" id="catchMutationText">✨ Золотая</span>
          </div>

          <!-- Fish Titles -->
          <div class="catch-info">
            <h2 class="catch-name" id="catchFishName">Морской Окунь</h2>
            <div class="catch-lore" id="catchFishLore">Обычный обитатель прибрежных скал.</div>
          </div>

          <!-- Caught Stats Grid -->
          <div class="catch-stats-grid">
            <div class="stat-box">
              <span class="stat-label">ВЕС</span>
              <div class="stat-val-group">
                <span class="stat-value" id="catchWeight">3.45</span>
                <span class="stat-unit">кг</span>
              </div>
              <span class="record-indicator hidden" id="newRecordPill">⭐ РЕКОРД!</span>
            </div>

            <div class="stat-box">
              <span class="stat-label">СТОИМОСТЬ</span>
              <div class="stat-val-group">
                <span class="stat-value coin-val" id="catchPrice">120</span>
                <span class="stat-unit">🪙</span>
              </div>
              <span class="multiplier-tag" id="catchMultiplier">1.0x</span>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="catch-actions">
            <button class="btn-action btn-sell" id="btnCatchSell">
              <span class="btn-icon">💰</span>
              <span class="btn-text">Продать (+<span id="btnSellVal">120</span>🪙)</span>
            </button>
            <button class="btn-action btn-keep" id="btnCatchKeep">
              <span class="btn-icon">🎒</span>
              <span class="btn-text">В садок</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.backdrop = this.container.querySelector('#catchBackdrop');
    this.card = this.container.querySelector('#catchCard');
    this.rarityTag = this.container.querySelector('#catchRarityTag');
    this.expTag = this.container.querySelector('#catchExpTag');
    this.fishIcon = this.container.querySelector('#catchFishIcon');
    this.ringGlow = this.container.querySelector('#fishRingGlow');
    this.mutationBadge = this.container.querySelector('#catchMutationBadge');
    this.mutationText = this.container.querySelector('#catchMutationText');
    this.fishName = this.container.querySelector('#catchFishName');
    this.fishLore = this.container.querySelector('#catchFishLore');
    this.weightVal = this.container.querySelector('#catchWeight');
    this.priceVal = this.container.querySelector('#catchPrice');
    this.sellVal = this.container.querySelector('#btnSellVal');
    this.multiplierTag = this.container.querySelector('#catchMultiplier');
    this.recordPill = this.container.querySelector('#newRecordPill');

    this.btnSell = this.container.querySelector('#btnCatchSell');
    this.btnKeep = this.container.querySelector('#btnCatchKeep');

    this.btnSell.addEventListener('click', () => {
      if (!this.currentCatch) return;
      sound.playCoin();
      tg.impactMedium();
      this.hide();
      this.onSell(this.currentCatch);
    });

    this.btnKeep.addEventListener('click', () => {
      if (!this.currentCatch) return;
      sound.playClick();
      tg.selectionChanged();
      this.hide();
      this.onKeep(this.currentCatch);
    });
  }

  show(fishCatch) {
    this.currentCatch = fishCatch;
    const { fish, weight, mutation, price, exp, isNewRecord } = fishCatch;
    const rarityDef = RARITIES[fish.rarity] || RARITIES.common;

    // Set UI elements
    this.rarityTag.textContent = rarityDef.name.toUpperCase();
    this.rarityTag.style.background = rarityDef.color;
    this.rarityTag.style.color = '#0a0f1d';

    this.expTag.textContent = `+${exp} XP`;
    this.fishIcon.textContent = fish.icon || '🐟';
    let displayName = fish.name;
    if (mutation.prefix) {
      const cleanPrefix = mutation.name.replace(/[^а-яёА-ЯЁa-zA-Z]/g, '').trim();
      if (!displayName.toLowerCase().includes(cleanPrefix.toLowerCase())) {
        displayName = `${mutation.prefix} ${displayName}`;
      } else {
        displayName = `${mutation.prefix.split(' ')[0]} ${displayName}`;
      }
    }
    this.fishName.textContent = displayName;
    this.fishLore.textContent = fish.description || mutation.description;

    this.weightVal.textContent = weight.toFixed(2);
    this.priceVal.textContent = price.toLocaleString('ru-RU');
    this.sellVal.textContent = price.toLocaleString('ru-RU');
    this.multiplierTag.textContent = `${mutation.multiplier}x`;

    if (mutation.id !== 'normal') {
      this.mutationBadge.classList.remove('hidden');
      this.mutationText.textContent = mutation.prefix || mutation.name;
      this.mutationBadge.style.borderColor = mutation.color;
      this.mutationBadge.style.boxShadow = mutation.glow;
    } else {
      this.mutationBadge.classList.add('hidden');
    }

    if (isNewRecord) {
      this.recordPill.classList.remove('hidden');
    } else {
      this.recordPill.classList.add('hidden');
    }

    this.ringGlow.style.background = `radial-gradient(circle, ${rarityDef.color}88 0%, rgba(0,0,0,0) 70%)`;
    this.card.style.borderColor = rarityDef.borderColor;

    // Check if backpack full
    if (state.inventory.length >= state.backpackCapacity) {
      this.btnKeep.disabled = true;
      this.btnKeep.classList.add('disabled');
      this.btnKeep.querySelector('.btn-text').textContent = 'Садок полон!';
    } else {
      this.btnKeep.disabled = false;
      this.btnKeep.classList.remove('disabled');
      this.btnKeep.querySelector('.btn-text').textContent = 'В садок';
    }

    this.backdrop.classList.remove('hidden');
    sound.playCatchFanfare(fish.rarity);
    tg.notificationSuccess();
  }

  hide() {
    this.backdrop.classList.add('hidden');
    this.currentCatch = null;
  }
}
