import { state } from '../core/state.js';
import { RARITIES } from '../data/mutations.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { getIconSvg } from './icons.js';

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
            <span class="panel-icon">${getIconSvg('bag', 20)}</span>
            <h2>BACKPACK</h2>
          </div>
          <div class="capacity-pill" id="bagCapacityText">
            ${state.inventory.length} items (Infinite)
          </div>
        </div>

        <!-- Bulk Sell & Value Summary -->
        <div class="backpack-stats-card">
          <div class="bag-summary-info">
            <span class="summary-label">Total Catch Value:</span>
            <span class="summary-value" id="totalBagVal">${this.calcTotalValue()} C$</span>
          </div>

          <div class="backpack-actions-row">
            <button class="btn-sell-all" id="btnSellAll" ${state.inventory.length === 0 ? 'disabled' : ''}>
              <span class="sell-all-icon">${getIconSvg('coins', 16)}</span>
              <span class="sell-all-text">Sell All Catch</span>
            </button>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="filter-chips-row">
          <button class="chip active" data-filter="all">All (${state.inventory.length})</button>
          <button class="chip" data-filter="rare">Rare+</button>
          <button class="chip" data-filter="mutations">Mutations</button>
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
    return state.inventory.reduce((sum, f) => sum + f.price, 0).toLocaleString('en-US');
  }

  renderFishGrid() {
    if (state.inventory.length === 0) {
      return `
        <div class="empty-bag-placeholder">
          <span class="empty-icon">${getIconSvg('bag', 32)}</span>
          <p>Backpack is empty</p>
          <small>Cast your line into the water to catch fish.</small>
        </div>
      `;
    }

    let items = [...state.inventory];
    if (this.filter === 'rare') {
      items = items.filter(f => ['rare', 'epic', 'legendary', 'mythic', 'abyssal'].includes(f.fish.rarity));
    } else if (this.filter === 'mutations') {
      items = items.filter(f => f.mutation && f.mutation.id !== 'normal');
    }

    if (items.length === 0) {
      return `<div class="empty-bag-placeholder"><p>No fish matching current filter</p></div>`;
    }

    return items.map(item => {
      const rarityDef = RARITIES[item.fish.rarity] || RARITIES.common;
      const isMutated = item.mutation && item.mutation.id !== 'normal';

      return `
        <div class="fish-card-item ${isMutated ? 'mutated' : ''}" 
             data-instance-id="${item.instanceId}" 
             style="border-color: ${rarityDef.borderColor}">
          
          ${isMutated ? `<span class="card-mutation-badge" style="background: ${item.mutation.color}">${item.mutation.prefix || item.mutation.name}</span>` : ''}

          <div class="fish-card-sprite">
            <span class="card-fish-icon" style="color: ${rarityDef.color}">${getIconSvg('fish', 28)}</span>
          </div>

          <div class="fish-card-meta">
            <div class="fish-card-name">${item.fish.name}</div>
            <div class="fish-card-sub">
              <span class="card-weight">${item.weight} kg</span>
              <span class="card-price">${getIconSvg('coins', 11)} ${item.price}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    // Filter chips
    const chips = this.container.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.filter = chip.dataset.filter;
        this.refreshGrid();
        sound.playClick();
        tg.selectionChanged();
      });
    });

    // Sell all button
    const btnSellAll = this.container.querySelector('#btnSellAll');
    if (btnSellAll) {
      btnSellAll.addEventListener('click', () => {
        if (state.inventory.length === 0) return;
        state.sellAllFish();
        sound.playCoin();
        tg.notificationSuccess();
        this.update();
      });
    }

    // Fish item click delegation
    const grid = this.container.querySelector('#fishGrid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.fish-card-item');
        if (!card) return;
        const instanceId = card.dataset.instanceId;
        const item = state.inventory.find(f => f.instanceId === instanceId);
        if (item) {
          this.showItemDetail(item);
        }
      });
    }
  }

  showItemDetail(item) {
    this.selectedItem = item;
    const modal = this.container.querySelector('#itemDetailModal');
    const card = this.container.querySelector('#detailCard');
    const rarityDef = RARITIES[item.fish.rarity] || RARITIES.common;
    const isMutated = item.mutation && item.mutation.id !== 'normal';

    let displayName = item.fish.name;
    if (isMutated) {
      displayName = `${item.mutation.prefix || item.mutation.name} ${item.fish.name}`;
    }

    card.innerHTML = `
      <div class="detail-header">
        <span class="detail-rarity" style="background: ${rarityDef.color}">${rarityDef.name.toUpperCase()}</span>
        <button class="detail-close-btn" id="detailCloseBtn">${getIconSvg('x', 16)}</button>
      </div>

      <div class="detail-sprite">
        <span class="detail-fish-icon" style="color: ${rarityDef.color}">${getIconSvg('fish', 56)}</span>
      </div>

      ${isMutated ? `
        <div class="detail-mutation-tag" style="border-color: ${item.mutation.color}; color: ${item.mutation.color}">
          Mutation: ${item.mutation.name} (${item.mutation.multiplier}x value)
        </div>
      ` : ''}

      <h3 class="detail-name">${displayName}</h3>
      <p class="detail-desc">${item.fish.description}</p>

      <div class="detail-stats-row">
        <div class="detail-stat">
          <span>Weight</span>
          <strong>${item.weight} kg</strong>
        </div>
        <div class="detail-stat">
          <span>Value</span>
          <strong>${getIconSvg('coins', 14)} ${item.price.toLocaleString('en-US')} C$</strong>
        </div>
      </div>

      <div class="detail-actions">
        <button class="btn-detail-sell" id="btnSingleSell">
          ${getIconSvg('coins', 16)} Sell for ${item.price.toLocaleString('en-US')} C$
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
    sound.playClick();
    tg.impactLight();

    // Bind modal actions
    card.querySelector('#detailCloseBtn').addEventListener('click', () => {
      modal.classList.add('hidden');
      this.selectedItem = null;
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        this.selectedItem = null;
      }
    });

    card.querySelector('#btnSingleSell').addEventListener('click', () => {
      state.sellFish(item.instanceId);
      sound.playCoin();
      tg.impactMedium();
      modal.classList.add('hidden');
      this.selectedItem = null;
      this.update();
    });
  }

  refreshGrid() {
    const grid = this.container.querySelector('#fishGrid');
    if (grid) {
      grid.innerHTML = this.renderFishGrid();
    }
  }

  update() {
    const capEl = this.container.querySelector('#bagCapacityText');
    if (capEl) {
      capEl.textContent = `${state.inventory.length} items (Infinite)`;
    }

    const valEl = this.container.querySelector('#totalBagVal');
    if (valEl) {
      valEl.textContent = `${this.calcTotalValue()} C$`;
    }

    const btnSellAll = this.container.querySelector('#btnSellAll');
    if (btnSellAll) {
      btnSellAll.disabled = state.inventory.length === 0;
    }

    const filterChips = this.container.querySelectorAll('.chip');
    if (filterChips.length >= 3) {
      filterChips[0].textContent = `All (${state.inventory.length})`;
    }

    this.refreshGrid();
  }
}
