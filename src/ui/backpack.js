import { state } from '../core/state.js';
import { RARITIES } from '../data/mutations.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';

export class BackpackView {
  constructor(container) {
    this.container = container;
    this.filter = 'all';
    this.selectedItem = null;

    this.render();
    state.subscribe(() => this.update());
  }

  render() {
    this.container.innerHTML = `
      <div class="view-panel backpack-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-icon">🎒</span>
            <h2>РЫБНЫЙ САДОК</h2>
          </div>
          <div class="capacity-pill" id="bagCapacityText">
            ${state.inventory.length} / ${state.backpackCapacity}
          </div>
        </div>

        <!-- Bulk Sell & Capacity Bar -->
        <div class="backpack-stats-card">
          <div class="bag-capacity-meter">
            <div class="capacity-fill" id="bagCapacityFill" style="width: ${(state.inventory.length / state.backpackCapacity) * 100}%"></div>
          </div>

          <div class="backpack-actions-row">
            <button class="btn-sell-all" id="btnSellAll" ${state.inventory.length === 0 ? 'disabled' : ''}>
              <span class="sell-all-icon">💰</span>
              <span class="sell-all-text">ПРОДАТЬ ВСЁ (<span id="totalBagVal">${this.calcTotalValue()}</span>🪙)</span>
            </button>

            <button class="btn-upgrade-bag" id="btnUpgradeBag" title="Расширить садок">
              <span>➕ +5 мест</span>
              <small id="bagUpgradeCost">${state.getBackpackUpgradeCost()}🪙</small>
            </button>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="filter-chips-row">
          <button class="chip active" data-filter="all">Все (${state.inventory.length})</button>
          <button class="chip" data-filter="rare">Редкие+ </button>
          <button class="chip" data-filter="mutations">Мутации ✨</button>
        </div>

        <!-- Fish Grid -->
        <div class="fish-grid" id="fishGrid">
          ${this.renderFishGrid()}
        </div>

        <!-- Single Item Detail Popup Modal -->
        <div class="item-detail-modal hidden" id="itemDetailModal">
          <div class="detail-card" id="detailCard">
            <!-- Populated on click -->
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  calcTotalValue() {
    return state.inventory.reduce((sum, f) => sum + f.price, 0).toLocaleString('ru-RU');
  }

  renderFishGrid() {
    if (state.inventory.length === 0) {
      return `
        <div class="empty-bag-placeholder">
          <span class="empty-icon">🪣</span>
          <p>Твой садок пуст</p>
          <small>Забрось удочку в воду, чтобы поймать первую рыбу!</small>
        </div>
      `;
    }

    let items = [...state.inventory];
    if (this.filter === 'rare') {
      items = items.filter(f => ['rare', 'epic', 'legendary', 'mythic', 'abyssal'].includes(f.fish.rarity));
    } else if (this.filter === 'mutations') {
      items = items.filter(f => f.mutation.id !== 'normal');
    }

    if (items.length === 0) {
      return `<div class="empty-bag-placeholder"><p>Нет рыбы по выбранному фильтру</p></div>`;
    }

    return items.map(item => {
      const rarityDef = RARITIES[item.fish.rarity] || RARITIES.common;
      let displayName = item.fish.name;
      if (item.mutation.prefix) {
        const cleanPrefix = item.mutation.name.replace(/[^а-яёА-ЯЁa-zA-Z]/g, '').trim();
        if (!displayName.toLowerCase().includes(cleanPrefix.toLowerCase())) {
          displayName = `${item.mutation.prefix} ${displayName}`;
        } else {
          displayName = `${item.mutation.prefix.split(' ')[0]} ${displayName}`;
        }
      }

      return `
        <div class="fish-card" data-id="${item.instanceId}" style="border-color: ${rarityDef.borderColor}">
          <div class="card-rarity-strip" style="background: ${rarityDef.color}"></div>
          <div class="card-icon-box">
            <span class="card-fish-icon">${item.fish.icon || '🐟'}</span>
            ${item.mutation.id !== 'normal' ? `<span class="card-mutation-badge" style="background: ${item.mutation.color}">${item.mutation.name}</span>` : ''}
          </div>
          <div class="card-info">
            <div class="card-name">${displayName}</div>
            <div class="card-meta">
              <span class="card-weight">⚖️ ${item.weight.toFixed(2)} кг</span>
              <span class="card-price">🪙 ${item.price.toLocaleString('ru-RU')}</span>
            </div>
          </div>
          <button class="btn-quick-sell" data-sell-id="${item.instanceId}" title="Продать">💰</button>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    // Sell All Button
    const btnSellAll = this.container.querySelector('#btnSellAll');
    btnSellAll?.addEventListener('click', () => {
      const earned = state.sellAllFish();
      if (earned > 0) {
        sound.playCoin();
      }
    });

    // Upgrade Bag Button
    const btnUpgrade = this.container.querySelector('#btnUpgradeBag');
    btnUpgrade?.addEventListener('click', () => {
      if (state.upgradeBackpack()) {
        sound.playCoin();
      } else {
        sound.playClick();
        tg.notificationError();
      }
    });

    // Filter chips
    const chips = this.container.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.filter = chip.dataset.filter;
        sound.playClick();
        this.update();
      });
    });

    // Grid item interactions (quick sell & detail view)
    const grid = this.container.querySelector('#fishGrid');
    grid?.addEventListener('click', (e) => {
      const sellBtn = e.target.closest('.btn-quick-sell');
      if (sellBtn) {
        e.stopPropagation();
        const id = sellBtn.dataset.sellId;
        state.sellFish(id);
        sound.playCoin();
        tg.impactLight();
        return;
      }

      const card = e.target.closest('.fish-card');
      if (card) {
        const id = card.dataset.id;
        const item = state.inventory.find(f => f.instanceId === id);
        if (item) {
          this.showItemDetail(item);
        }
      }
    });
  }

  showItemDetail(item) {
    const modal = this.container.querySelector('#itemDetailModal');
    const card = this.container.querySelector('#detailCard');
    const rarityDef = RARITIES[item.fish.rarity] || RARITIES.common;

    card.innerHTML = `
      <div class="detail-header" style="border-bottom: 2px solid ${rarityDef.color}">
        <span class="detail-rarity" style="color: ${rarityDef.color}">${rarityDef.name.toUpperCase()}</span>
        <button class="btn-close-detail" id="btnCloseDetail">✕</button>
      </div>
      <div class="detail-body">
        <div class="detail-icon-wrap" style="background: radial-gradient(circle, ${rarityDef.color}44 0%, transparent 70%)">
          <span class="detail-icon">${item.fish.icon || '🐟'}</span>
        </div>
        <h3>${item.mutation.prefix ? `${item.mutation.prefix} ${item.fish.name}` : item.fish.name}</h3>
        <p class="detail-desc">${item.fish.description || ''}</p>

        <div class="detail-stats-list">
          <div class="detail-row"><span>Вес экземпляра:</span><strong>${item.weight} кг</strong></div>
          <div class="detail-row"><span>Мутация:</span><strong style="color: ${item.mutation.color}">${item.mutation.name} (${item.mutation.multiplier}x)</strong></div>
          <div class="detail-row"><span>Рыночная цена:</span><strong class="coin-val">${item.price.toLocaleString('ru-RU')} 🪙</strong></div>
        </div>

        <button class="btn-detail-sell" id="btnDetailSell">
          💰 Продать за ${item.price.toLocaleString('ru-RU')} 🪙
        </button>
      </div>
    `;

    modal.classList.remove('hidden');

    card.querySelector('#btnCloseDetail').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    card.querySelector('#btnDetailSell').addEventListener('click', () => {
      state.sellFish(item.instanceId);
      sound.playCoin();
      modal.classList.add('hidden');
    });
  }

  update() {
    const capacityText = this.container.querySelector('#bagCapacityText');
    if (capacityText) capacityText.textContent = `${state.inventory.length} / ${state.backpackCapacity}`;

    const capacityFill = this.container.querySelector('#bagCapacityFill');
    if (capacityFill) capacityFill.style.width = `${(state.inventory.length / state.backpackCapacity) * 100}%`;

    const totalVal = this.container.querySelector('#totalBagVal');
    if (totalVal) totalVal.textContent = this.calcTotalValue();

    const sellAllBtn = this.container.querySelector('#btnSellAll');
    if (sellAllBtn) sellAllBtn.disabled = state.inventory.length === 0;

    const upgradeCost = this.container.querySelector('#bagUpgradeCost');
    if (upgradeCost) upgradeCost.textContent = `${state.getBackpackUpgradeCost()}🪙`;

    const grid = this.container.querySelector('#fishGrid');
    if (grid) grid.innerHTML = this.renderFishGrid();
  }
}
