import { state } from '../core/state.js';
import { RODS } from '../data/rods.js';
import { BAITS } from '../data/baits.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { getIconSvg } from './icons.js';

export class ShopView {
  constructor(container) {
    this.container = container;
    this.currentSubTab = 'rods';

    this.render();
    state.subscribe(() => this.update());
  }

  render() {
    this.container.innerHTML = `
      <div class="view-panel shop-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-icon">${getIconSvg('store', 20)}</span>
            <h2>МАГАЗИН СНАСТЕЙ</h2>
          </div>
          <div class="shop-subtabs">
            <button class="subtab-btn active" data-subtab="rods">Удочки</button>
            <button class="subtab-btn" data-subtab="baits">Наживки</button>
          </div>
        </div>

        <div class="shop-items-container" id="shopItemsContainer">
          ${this.currentSubTab === 'rods' ? this.renderRods() : this.renderBaits()}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderRods() {
    return RODS.map(rod => {
      const isOwned = state.ownedRods.includes(rod.id);
      const isEquipped = state.equippedRodId === rod.id;
      const isLevelLocked = state.level < rod.requiredLevel;

      let btnHTML = '';
      if (isEquipped) {
        btnHTML = `<button class="btn-shop-action equipped" disabled>${getIconSvg('check', 14)} Экипировано</button>`;
      } else if (isOwned) {
        btnHTML = `<button class="btn-shop-action equip-btn" data-action="equip-rod" data-id="${rod.id}">Экипировать</button>`;
      } else if (isLevelLocked) {
        btnHTML = `<button class="btn-shop-action locked" disabled>${getIconSvg('lock', 13)} Требуется ${rod.requiredLevel} уровень</button>`;
      } else {
        const canAffordCoins = rod.price === 0 || state.coins >= rod.price;
        const canAffordPearls = rod.pearlPrice === 0 || state.pearls >= rod.pearlPrice;
        const canAfford = canAffordCoins && canAffordPearls;

        const priceParts = [];
        if (rod.price > 0) priceParts.push(`${rod.price.toLocaleString('ru-RU')} монет`);
        if (rod.pearlPrice > 0) priceParts.push(`${rod.pearlPrice} жемчужин`);

        btnHTML = `
          <button class="btn-shop-action buy-btn ${canAfford ? '' : 'cant-afford'}" data-action="buy-rod" data-id="${rod.id}" ${canAfford ? '' : 'disabled'}>
            Купить: ${priceParts.join(' + ')}
          </button>
        `;
      }

      return `
        <div class="shop-card rod-card ${isEquipped ? 'equipped-card' : ''}">
          <div class="shop-card-main">
            <div class="shop-item-icon-box">
              <span class="shop-icon">${getIconSvg(rod.iconKey || 'anchor', 24)}</span>
            </div>
            <div class="shop-item-details">
              <div class="shop-item-name">${rod.name}</div>
              <p class="shop-item-desc">${rod.description}</p>
              
              <!-- Stat bars -->
              <div class="stat-pills-row">
                <div class="stat-pill">Удача: +${rod.luck}</div>
                <div class="stat-pill">Зона контроля: ${Math.round(rod.barSize * 100)}%</div>
                <div class="stat-pill">Макс. вес: ${rod.maxWeight} кг</div>
              </div>
            </div>
          </div>
          <div class="shop-card-footer">
            ${btnHTML}
          </div>
        </div>
      `;
    }).join('');
  }

  renderBaits() {
    return BAITS.map(bait => {
      const isEquipped = state.equippedBaitId === bait.id;
      const count = state.baits[bait.id] || 0;

      let actionHTML = '';
      if (bait.id === 'none') {
        actionHTML = `
          <button class="btn-shop-action ${isEquipped ? 'equipped' : 'equip-btn'}" data-action="equip-bait" data-id="none">
            ${isEquipped ? `${getIconSvg('check', 14)} Выбрано` : 'Выбрать'}
          </button>
        `;
      } else {
        const canAfford = state.coins >= bait.price;
        actionHTML = `
          <div class="bait-actions-group">
            <button class="btn-shop-action buy-btn ${canAfford ? '' : 'cant-afford'}" data-action="buy-bait" data-id="${bait.id}" ${canAfford ? '' : 'disabled'}>
              +${bait.amount} шт. (${bait.price} монет)
            </button>
            ${count > 0 ? `
              <button class="btn-shop-action ${isEquipped ? 'equipped' : 'equip-btn'}" data-action="equip-bait" data-id="${bait.id}">
                ${isEquipped ? `${getIconSvg('check', 14)} Выбрано` : 'Выбрать'}
              </button>
            ` : ''}
          </div>
        `;
      }

      return `
        <div class="shop-card bait-card ${isEquipped ? 'equipped-card' : ''}">
          <div class="shop-card-main">
            <div class="shop-item-icon-box">
              <span class="shop-icon">${getIconSvg(bait.iconKey || 'crosshair', 24)}</span>
            </div>
            <div class="shop-item-details">
              <div class="shop-item-name-row">
                <span class="shop-item-name">${bait.name}</span>
                ${bait.id !== 'none' ? `<span class="stock-badge">Запас: ${count} шт.</span>` : ''}
              </div>
              <p class="shop-item-desc">${bait.description}</p>
              
              <div class="stat-pills-row">
                ${bait.luckBonus > 0 ? `<div class="stat-pill">Удача: +${bait.luckBonus}</div>` : ''}
                ${bait.speedMultiplier < 1 ? `<div class="stat-pill">Клев: +${Math.round((1 - bait.speedMultiplier) * 100)}%</div>` : ''}
                ${bait.mutationBonus > 0 ? `<div class="stat-pill">Мутации: +${Math.round(bait.mutationBonus * 100)}%</div>` : ''}
              </div>
            </div>
          </div>
          <div class="shop-card-footer">
            ${actionHTML}
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    // Subtabs
    const subtabs = this.container.querySelectorAll('.subtab-btn');
    subtabs.forEach(btn => {
      btn.addEventListener('click', () => {
        subtabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSubTab = btn.dataset.subtab;
        sound.playClick();
        this.update();
      });
    });

    // Action clicks
    const container = this.container.querySelector('#shopItemsContainer');
    container?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'equip-rod') {
        state.equipRod(id);
        sound.playClick();
      } else if (action === 'buy-rod') {
        if (state.buyRod(id)) {
          sound.playCoin();
        }
      } else if (action === 'buy-bait') {
        if (state.buyBait(id)) {
          sound.playCoin();
        }
      } else if (action === 'equip-bait') {
        state.equipBait(id);
        sound.playClick();
      }
    });
  }

  update() {
    const container = this.container.querySelector('#shopItemsContainer');
    if (container) {
      container.innerHTML = this.currentSubTab === 'rods' ? this.renderRods() : this.renderBaits();
    }
  }
}
