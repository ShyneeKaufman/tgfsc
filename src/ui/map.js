import { state } from '../core/state.js';
import { BIOMES } from '../data/biomes.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { getIconSvg } from './icons.js';

export class MapView {
  constructor(container, onTravelSuccess) {
    this.container = container;
    this.onTravelSuccess = onTravelSuccess;

    this.render();
    state.subscribe(() => this.update());
  }

  render() {
    this.container.innerHTML = `
      <div class="view-panel map-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-icon">${getIconSvg('map', 20)}</span>
            <h2>КАРТА ЭКСПЕДИЦИЙ</h2>
          </div>
          <div class="active-location-pill">
            Сейчас: ${state.getCurrentBiome().name}
          </div>
        </div>

        <div class="biomes-grid" id="biomesGrid">
          ${this.renderBiomes()}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderBiomes() {
    return BIOMES.map(biome => {
      const isCurrent = state.currentBiome === biome.id;
      const isUnlocked = state.unlockedBiomes.includes(biome.id);
      const isLevelLocked = state.level < biome.requiredLevel;

      let actionHTML = '';
      if (isCurrent) {
        actionHTML = `<button class="btn-biome-action current" disabled>${getIconSvg('anchor', 14)} Текущая локация</button>`;
      } else if (isUnlocked) {
        actionHTML = `<button class="btn-biome-action travel-btn" data-action="travel" data-id="${biome.id}">Отплыть</button>`;
      } else if (isLevelLocked) {
        actionHTML = `<button class="btn-biome-action locked" disabled>${getIconSvg('lock', 13)} Требуется ${biome.requiredLevel} уровень</button>`;
      } else {
        const canAfford = state.coins >= biome.travelCost;
        actionHTML = `
          <button class="btn-biome-action unlock-btn ${canAfford ? '' : 'cant-afford'}" data-action="unlock" data-id="${biome.id}" ${canAfford ? '' : 'disabled'}>
            Открыть: ${biome.travelCost.toLocaleString('ru-RU')} монет
          </button>
        `;
      }

      return `
        <div class="biome-card ${isCurrent ? 'current-biome' : ''}" style="background: linear-gradient(145deg, ${biome.skyGradient[0]}, ${biome.skyGradient[1]})">
          <div class="biome-water-preview" style="background: ${biome.waterColor}"></div>
          
          <div class="biome-card-content">
            <div class="biome-header-row">
              <span class="biome-big-icon">${getIconSvg(biome.iconKey || 'palmtree', 26)}</span>
              <div class="biome-title-group">
                <h3 class="biome-title">${biome.name}</h3>
                <span class="biome-req-level">Уровень: ${biome.requiredLevel}</span>
              </div>
            </div>

            <p class="biome-desc">${biome.description}</p>
            <blockquote class="biome-lore">"${biome.lore}"</blockquote>

            <div class="biome-card-footer">
              ${actionHTML}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    const grid = this.container.querySelector('#biomesGrid');
    grid?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'travel') {
        if (state.travelTo(id)) {
          sound.playSplash();
          tg.impactMedium();
          this.onTravelSuccess(id);
        }
      } else if (action === 'unlock') {
        if (state.unlockBiome(id)) {
          sound.playCoin();
          tg.notificationSuccess();
          this.onTravelSuccess(id);
        } else {
          tg.notificationError();
        }
      }
    });
  }

  update() {
    const grid = this.container.querySelector('#biomesGrid');
    if (grid) grid.innerHTML = this.renderBiomes();
  }
}
