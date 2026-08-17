import { state } from '../core/state.js';
import { FISH_DATABASE } from '../data/fish.js';
import { BIOMES } from '../data/biomes.js';
import { RARITIES, MUTATIONS } from '../data/mutations.js';
import { sound } from '../core/sound.js';

export class FishDexView {
  constructor(container) {
    this.container = container;
    this.selectedBiome = 'all';

    this.render();
    state.subscribe(() => this.update());
  }

  render() {
    const totalSpecies = FISH_DATABASE.length;
    const discoveredCount = Object.keys(state.fishdex).length;
    const totalProgressPct = Math.round((discoveredCount / totalSpecies) * 100);

    this.container.innerHTML = `
      <div class="view-panel fishdex-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-icon">📖</span>
            <h2>FISHDEX ЭНЦИКЛОПЕДИЯ</h2>
          </div>
          <div class="progress-pill">
            ${discoveredCount} / ${totalSpecies} (${totalProgressPct}%)
          </div>
        </div>

        <!-- Overall Progress Header Card -->
        <div class="fishdex-progress-card">
          <div class="fishdex-bar-wrap">
            <div class="fishdex-bar-fill" style="width: ${totalProgressPct}%"></div>
          </div>
          <div class="fishdex-stats-summary">
            <span>Всего поймано рыб: <strong>${state.stats.totalCaught} шт.</strong></span>
            <span>Рекордный вес: <strong>${state.stats.heaviestFish.toFixed(2)} кг</strong></span>
          </div>
        </div>

        <!-- Biome Filter Tabs -->
        <div class="biome-filters-row">
          <button class="biome-filter-btn active" data-biome="all">Все локации</button>
          ${BIOMES.map(b => `
            <button class="biome-filter-btn" data-biome="${b.id}">${b.icon} ${b.name}</button>
          `).join('')}
        </div>

        <!-- Dex Grid -->
        <div class="dex-grid" id="dexGrid">
          ${this.renderDexGrid()}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderDexGrid() {
    let speciesList = [...FISH_DATABASE];
    if (this.selectedBiome !== 'all') {
      speciesList = speciesList.filter(f => f.biome === this.selectedBiome);
    }

    return speciesList.map(fish => {
      const record = state.fishdex[fish.id];
      const isDiscovered = !!record;
      const rarityDef = RARITIES[fish.rarity] || RARITIES.common;

      if (!isDiscovered) {
        return `
          <div class="dex-card undiscovered">
            <div class="dex-icon-box">
              <span class="dex-silhouette">❓</span>
            </div>
            <div class="dex-info">
              <div class="dex-name">???</div>
              <div class="dex-rarity" style="color: ${rarityDef.color}">${rarityDef.name.toUpperCase()}</div>
              <div class="dex-hint">Ещё не поймана в водах</div>
            </div>
          </div>
        `;
      }

      return `
        <div class="dex-card discovered" style="border-color: ${rarityDef.borderColor}">
          <div class="dex-card-top">
            <div class="dex-icon-box" style="background: radial-gradient(circle, ${rarityDef.color}33 0%, transparent 70%)">
              <span class="dex-icon">${fish.icon}</span>
            </div>
            <div class="dex-badge-rarity" style="background: ${rarityDef.color}">${rarityDef.name}</div>
          </div>
          
          <div class="dex-info">
            <h4 class="dex-name">${fish.name}</h4>
            <p class="dex-desc">${fish.description}</p>

            <div class="dex-records-row">
              <div class="record-item">
                <span>Поймано:</span>
                <strong>${record.count} раз</strong>
              </div>
              <div class="record-item">
                <span>Макс. вес:</span>
                <strong>${record.maxWeight.toFixed(2)} кг</strong>
              </div>
            </div>

            <!-- Discovered Mutations Badges -->
            ${record.mutations && record.mutations.length > 0 ? `
              <div class="dex-mutations-tag-row">
                ${record.mutations.map(mId => {
                  const m = MUTATIONS[mId];
                  return m ? `<span class="dex-mut-pill" style="color: ${m.color}">${m.prefix || m.name}</span>` : '';
                }).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    const filters = this.container.querySelectorAll('.biome-filter-btn');
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedBiome = btn.dataset.biome;
        sound.playClick();
        this.update();
      });
    });
  }

  update() {
    const grid = this.container.querySelector('#dexGrid');
    if (grid) grid.innerHTML = this.renderDexGrid();
  }
}
