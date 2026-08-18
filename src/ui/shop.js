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
            <h2>TACKLE SHOP</h2>
          </div>
          <div class="shop-subtabs">
            <button class="subtab-btn ${this.currentSubTab === 'rods' ? 'active' : ''}" data-subtab="rods">Rods</button>
            <button class="subtab-btn ${this.currentSubTab === 'baits' ? 'active' : ''}" data-subtab="baits">Baits</button>
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
      const isLevelLocked = state.level < rod.levelReq;

      let btnHTML = '';
      if (isEquipped) {
        btnHTML = `<button class="btn-shop-action equipped" disabled>${getIconSvg('check', 14)} Equipped</button>`;
      } else if (isOwned) {
        btnHTML = `<button class="btn-shop-action equip-btn" data-action="equip-rod" data-id="${rod.id}">Equip</button>`;
      } else if (isLevelLocked) {
        btnHTML = `<button class="btn-shop-action locked" disabled>${getIconSvg('lock', 13)} Requires Level ${rod.levelReq}</button>`;
      } else {
        const canAffordCoins = rod.price === 0 || state.coins >= rod.price;
        const canAffordPearls = rod.pearlPrice === 0 || state.pearls >= rod.pearlPrice;
        const canAfford = canAffordCoins && canAffordPearls;

        const priceParts = [];
        if (rod.price > 0) priceParts.push(`${rod.price.toLocaleString('en-US')} C$`);
        if (rod.pearlPrice > 0) priceParts.push(`${rod.pearlPrice} Pearls`);

        btnHTML = `
          <button class="btn-shop-action buy-btn ${canAfford ? '' : 'cant-afford'}" data-action="buy-rod" data-id="${rod.id}" ${canAfford ? '' : 'disabled'}>
            Buy: ${priceParts.join(' + ')}
          </button>
        `;
      }

      const lureSpeedPct = Math.round((1 - rod.lureSpeed) * 100);
      const lureSpeedText = lureSpeedPct >= 0 ? `+${lureSpeedPct}%` : `${lureSpeedPct}%`;

      return `
        <div class="shop-card rod-card ${isEquipped ? 'equipped-card' : ''}">
          <div class="shop-card-main">
            <div class="shop-item-icon-box">
              <span class="shop-icon">${getIconSvg(rod.iconKey || 'anchor', 24)}</span>
            </div>
            <div class="shop-item-details">
              <div class="shop-item-header-row">
                <div class="shop-item-name">${rod.name}</div>
                <span class="rod-english-sub">${rod.badge}</span>
              </div>
              <p class="shop-item-desc">${rod.description}</p>
              
              <!-- Stat pills -->
              <div class="stat-pills-row">
                <div class="stat-pill">Luck: +${rod.luck}</div>
                <div class="stat-pill">Lure Speed: ${lureSpeedText}</div>
                <div class="stat-pill">Control Bar: ${Math.round(rod.barSize * 100)}%</div>
                <div class="stat-pill">Max Weight: ${rod.maxWeight.toLocaleString('en-US')} kg</div>
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
        if (isEquipped) {
          actionHTML = `<button class="btn-shop-action equipped" disabled>${getIconSvg('check', 14)} Selected</button>`;
        } else {
          actionHTML = `<button class="btn-shop-action equip-btn" data-action="equip-bait" data-id="${bait.id}">Select</button>`;
        }
      } else {
        const canAffordCoins = bait.price === 0 || state.coins >= bait.price;
        const canAffordPearls = bait.pearlPrice === 0 || state.pearls >= bait.pearlPrice;
        const canAfford = canAffordCoins && canAffordPearls;

        const priceParts = [];
        if (bait.price > 0) priceParts.push(`${bait.price} C$`);
        if (bait.pearlPrice > 0) priceParts.push(`${bait.pearlPrice} Pearls`);

        actionHTML = `
          <div class="bait-actions-group">
            ${count > 0 ? `
              <button class="btn-shop-action ${isEquipped ? 'equipped' : 'equip-btn'}" data-action="equip-bait" data-id="${bait.id}" ${isEquipped ? 'disabled' : ''}>
                ${isEquipped ? `${getIconSvg('check', 14)} In Hand` : 'Equip'}
              </button>
            ` : ''}
            <button class="btn-shop-action buy-btn ${canAfford ? '' : 'cant-afford'}" data-action="buy-bait" data-id="${bait.id}" ${canAfford ? '' : 'disabled'}>
              +${bait.amount} pcs (${priceParts.join(' + ')})
            </button>
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
              <div class="shop-item-header-row">
                <div class="shop-item-name">${bait.name}</div>
                <span class="item-count-badge">${bait.id === 'none' ? '∞' : `${count} pcs`}</span>
              </div>
              <p class="shop-item-desc">${bait.description}</p>
              
              <!-- Stat pills -->
              <div class="stat-pills-row">
                ${bait.luckBonus > 0 ? `<div class="stat-pill">Luck: +${bait.luckBonus}</div>` : ''}
                ${bait.speedMultiplier < 1.0 ? `<div class="stat-pill">Speed: +${Math.round((1 - bait.speedMultiplier) * 100)}%</div>` : ''}
                ${bait.mutationBonus > 0 ? `<div class="stat-pill">Mutations: +${bait.mutationBonus}%</div>` : ''}
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
    // Sub-tab toggles
    const subtabs = this.container.querySelectorAll('.subtab-btn');
    subtabs.forEach(btn => {
      btn.addEventListener('click', () => {
        subtabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSubTab = btn.dataset.subtab;
        this.update();
        sound.playClick();
        tg.selectionChanged();
      });
    });

    // Action clicks delegation
    const container = this.container.querySelector('#shopItemsContainer');
    container?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'buy-rod') {
        if (state.buyRod(id)) {
          sound.playCoin();
          tg.notificationSuccess();
          this.update();
        }
      } else if (action === 'equip-rod') {
        if (state.equipRod(id)) {
          sound.playClick();
          tg.selectionChanged();
          this.update();
        }
      } else if (action === 'buy-bait') {
        if (state.buyBait(id)) {
          sound.playCoin();
          tg.impactMedium();
          this.update();
        }
      } else if (action === 'equip-bait') {
        if (state.equipBait(id)) {
          sound.playClick();
          tg.selectionChanged();
          this.update();
        }
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
