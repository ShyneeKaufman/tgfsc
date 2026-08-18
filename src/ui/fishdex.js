import { FISH_DATABASE } from '../data/fish.js';
import { BIOMES } from '../data/biomes.js';
import { RARITIES, MUTATIONS } from '../data/mutations.js';
import { state } from '../core/state.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { getIconSvg } from './icons.js';

export class FishDexView {
  constructor(container) {
    this.container = container;
    this.activeBiomeFilter = 'all';

    this.render();
    state.subscribe(() => this.update());
  }

  render() {
    const totalFish = FISH_DATABASE.length;
    const discoveredCount = Object.keys(state.fishdex).filter(id => state.fishdex[id]?.discovered).length;
    const completionPct = Math.round((discoveredCount / totalFish) * 100);

    this.container.innerHTML = `
      <div class="view-panel fishdex-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-icon">${getIconSvg('book', 20)}</span>
            <h2>BESTIARY</h2>
          </div>
          <div class="completion-pill" id="dexCompletionPill">
            ${discoveredCount} / ${totalFish} (${completionPct}%)
          </div>
        </div>

        <!-- Bestiary Progress Bar -->
        <div class="bestiary-progress-card">
          <div class="bestiary-progress-header">
            <span class="progress-title">Archipelago Fauna Research</span>
            <span class="progress-pct" id="dexPctText">${completionPct}%</span>
          </div>
          <div class="bestiary-progress-track">
            <div class="bestiary-progress-fill" id="dexProgressFill" style="width: ${completionPct}%"></div>
          </div>
        </div>

        <!-- Location Filter Chips -->
        <div class="filter-chips-row horizontal-scroll">
          <button class="chip ${this.activeBiomeFilter === 'all' ? 'active' : ''}" data-biome="all">All Regions</button>
          ${BIOMES.map(b => `
            <button class="chip ${this.activeBiomeFilter === b.id ? 'active' : ''}" data-biome="${b.id}">
              ${b.name}
            </button>
          `).join('')}
        </div>

        <!-- Bestiary Grid -->
        <div class="dex-grid" id="dexGrid">
          ${this.renderBestiaryGrid()}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderBestiaryGrid() {
    let list = FISH_DATABASE;
    if (this.activeBiomeFilter !== 'all') {
      list = list.filter(f => f.biome === this.activeBiomeFilter);
    }

    return list.map(fish => {
      const entry = state.fishdex[fish.id];
      const isDiscovered = Boolean(entry && entry.discovered);
      const rarityDef = RARITIES[fish.rarity] || RARITIES.common;
      const biomeObj = BIOMES.find(b => b.id === fish.biome) || BIOMES[0];

      if (!isDiscovered) {
        return `
          <div class="dex-card locked">
            <div class="dex-sprite-stage locked">
              <span class="locked-icon">${getIconSvg('lock', 24)}</span>
            </div>
            <div class="dex-info">
              <div class="dex-name locked">???</div>
              <div class="dex-sub-tag">${biomeObj.name}</div>
              <div class="dex-rarity-pill locked">${rarityDef.name.toUpperCase()}</div>
            </div>
          </div>
        `;
      }

      const count = entry.count || 1;
      const maxWeight = (entry.maxWeight || 0).toFixed(2);
      const discoveredMutations = entry.mutations || [];

      return `
        <div class="dex-card unlocked" style="border-color: ${rarityDef.borderColor}">
          <div class="dex-sprite-stage">
            <span class="dex-fish-icon" style="color: ${rarityDef.color}">
              ${getIconSvg('fish', 36)}
            </span>
          </div>

          <div class="dex-info">
            <div class="dex-header-row">
              <h3 class="dex-name">${fish.name}</h3>
              <span class="dex-rarity-pill" style="background: ${rarityDef.color}">${rarityDef.name.toUpperCase()}</span>
            </div>

            <div class="dex-english-name">${biomeObj.name}</div>
            <p class="dex-desc">${fish.description}</p>

            <div class="dex-stats-row">
              <div class="dex-stat">
                <span>Caught:</span> <strong>${count} pcs</strong>
              </div>
              <div class="dex-stat">
                <span>Record:</span> <strong>${maxWeight} kg</strong>
              </div>
            </div>

            ${discoveredMutations.length > 0 ? `
              <div class="dex-mutations-row">
                <span class="dex-mut-label">Mutations:</span>
                ${discoveredMutations.map(mId => {
                  const mut = MUTATIONS[mId] || { name: mId, color: '#38bdf8' };
                  return `<span class="dex-mut-pill" style="background: ${mut.color}22; border-color: ${mut.color}; color: ${mut.color}">${mut.name}</span>`;
                }).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    const chips = this.container.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeBiomeFilter = chip.dataset.biome;
        this.update();
        sound.playClick();
        tg.selectionChanged();
      });
    });
  }

  update() {
    const totalFish = FISH_DATABASE.length;
    const discoveredCount = Object.keys(state.fishdex).filter(id => state.fishdex[id]?.discovered).length;
    const completionPct = Math.round((discoveredCount / totalFish) * 100);

    const pill = this.container.querySelector('#dexCompletionPill');
    if (pill) pill.textContent = `${discoveredCount} / ${totalFish} (${completionPct}%)`;

    const pctText = this.container.querySelector('#dexPctText');
    if (pctText) pctText.textContent = `${completionPct}%`;

    const fill = this.container.querySelector('#dexProgressFill');
    if (fill) fill.style.width = `${completionPct}%`;

    const grid = this.container.querySelector('#dexGrid');
    if (grid) grid.innerHTML = this.renderBestiaryGrid();
  }
}
