import { state } from '../core/state.js';
import { FISH_DATABASE } from '../data/fish.js';
import { MUTATIONS } from '../data/mutations.js';
import { RODS } from '../data/rods.js';
import { BAITS } from '../data/baits.js';
import { BIOMES } from '../data/biomes.js';
import { events, EVENT_PRESETS } from '../core/events.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { getIconSvg } from './icons.js';

export class AdminModal {
  constructor(container) {
    this.container = container;
    this.currentTab = 'resources';
    this.logs = [];

    this.setupDOM();
    this.bindEvents();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div class="admin-modal-backdrop hidden" id="adminBackdrop">
        <div class="admin-panel-card">
          <!-- Admin Header -->
          <div class="admin-header">
            <div class="admin-title-group">
              <span class="admin-badge">${getIconSvg('shield', 16)} DEV CONSOLE</span>
              <h2 class="admin-title">ПАНЕЛЬ УПРАВЛЕНИЯ</h2>
            </div>
            <button class="modal-close-btn" id="btnAdminClose">${getIconSvg('x', 18)}</button>
          </div>

          <div class="admin-user-info">
            <span>Админ ID: <strong>1952158452</strong></span>
            <span class="admin-status-tag">ДОСТУП РАЗРЕШЕН</span>
          </div>

          <!-- Navigation Subtabs -->
          <div class="admin-subtabs-row">
            <button class="admin-subtab active" data-tab="resources">Ресурсы</button>
            <button class="admin-subtab" data-tab="gear">Снасти & Локации</button>
            <button class="admin-subtab" data-tab="spawn">Спавн Рыбы</button>
            <button class="admin-subtab" data-tab="events">События</button>
            <button class="admin-subtab" data-tab="logs">Логи Сервера</button>
          </div>

          <!-- Dynamic Tab Content Area -->
          <div class="admin-content-area" id="adminContentArea">
            ${this.renderTabContent()}
          </div>
        </div>
      </div>
    `;

    this.backdrop = this.container.querySelector('#adminBackdrop');
    this.btnClose = this.container.querySelector('#btnAdminClose');
    this.contentArea = this.container.querySelector('#adminContentArea');
  }

  renderTabContent() {
    if (this.currentTab === 'resources') {
      return `
        <div class="admin-grid">
          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('coins', 14)} Монеты (C$)</div>
            <div class="admin-btn-row">
              <button class="admin-btn" data-action="add-coins" data-val="5000">+5 000</button>
              <button class="admin-btn" data-action="add-coins" data-val="50000">+50 000</button>
              <button class="admin-btn gold" data-action="add-coins" data-val="1000000">+1 000 000</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('gem', 14)} Жемчуг Бездны</div>
            <div class="admin-btn-row">
              <button class="admin-btn" data-action="add-pearls" data-val="10">+10</button>
              <button class="admin-btn" data-action="add-pearls" data-val="100">+100</button>
              <button class="admin-btn cyan" data-action="add-pearls" data-val="1000">+1 000</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('trophy', 14)} Уровень & Опыт</div>
            <div class="admin-btn-row">
              <button class="admin-btn" data-action="add-level" data-val="1">+1 Уровень</button>
              <button class="admin-btn" data-action="add-level" data-val="10">+10 Уровней</button>
              <button class="admin-btn cyan" data-action="set-level" data-val="50">Уровень 50</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('flame', 14)} Стрик поклевок</div>
            <div class="admin-btn-row">
              <button class="admin-btn" data-action="set-streak" data-val="10">Стрик x10</button>
              <button class="admin-btn gold" data-action="set-streak" data-val="50">Стрик x50</button>
              <button class="admin-btn red" data-action="set-streak" data-val="0">Сбросить</button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.currentTab === 'gear') {
      return `
        <div class="admin-grid">
          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('anchor', 14)} Разблокировка снастей</div>
            <p class="admin-hint">Мгновенно открывает все 11 аутентичных удочек из Fisch.</p>
            <div class="admin-btn-row">
              <button class="admin-btn cyan" data-action="unlock-all-rods">Открыть все удочки</button>
              <button class="admin-btn" data-action="give-all-baits">+50 всех наживок</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('map', 14)} Доступ к локациям</div>
            <p class="admin-hint">Открывает все 5 островов архипелага без ограничений по уровню.</p>
            <div class="admin-btn-row">
              <button class="admin-btn gold" data-action="unlock-all-biomes">Открыть все острова</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('book', 14)} Бестиарий (100%)</div>
            <p class="admin-hint">Заполняет записи всех 37 видов рыб и легендарных созданий.</p>
            <div class="admin-btn-row">
              <button class="admin-btn cyan" data-action="complete-bestiary">Заполнить Бестиарий на 100%</button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.currentTab === 'spawn') {
      return `
        <div class="admin-spawn-card">
          <div class="admin-field-group">
            <label>Выберите рыбу:</label>
            <select class="admin-select" id="spawnFishSelect">
              ${FISH_DATABASE.map(f => `
                <option value="${f.id}">[${f.rarity.toUpperCase()}] ${f.name} (${f.englishName})</option>
              `).join('')}
            </select>
          </div>

          <div class="admin-field-group">
            <label>Мутация:</label>
            <select class="admin-select" id="spawnMutationSelect">
              ${Object.values(MUTATIONS).map(m => `
                <option value="${m.id}">${m.name} (${m.multiplier}x стоимость)</option>
              `).join('')}
            </select>
          </div>

          <div class="admin-field-group">
            <label>Вес (кг) [0 = авто]:</label>
            <input type="number" class="admin-input" id="spawnWeightInput" value="0" step="0.1" min="0"/>
          </div>

          <button class="admin-action-btn-large" id="btnSpawnFish">
            ${getIconSvg('bag', 18)} Выдать рыбу в садок
          </button>
        </div>
      `;
    }

    if (this.currentTab === 'events') {
      return `
        <div class="admin-grid">
          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('zap', 14)} Запуск погодных аномалий</div>
            <p class="admin-hint">Мгновенно активирует глобальное событие на 3 минуты для всех.</p>
            <div class="admin-btn-list">
              <button class="admin-event-btn" data-event="abyssal_storm">
                <strong>Шторм Бездны</strong>
                <small>+25 к Удаче и мутации x2.5</small>
              </button>
              <button class="admin-event-btn" data-event="golden_hour">
                <strong>Золотой Час</strong>
                <small>Золотые мутации x5.0 и цена x2.0</small>
              </button>
              <button class="admin-event-btn" data-event="aurora_blessing">
                <strong>Благословение Авроры</strong>
                <small>+40 к Удаче и опыт x2.0</small>
              </button>
              <button class="admin-event-btn" data-event="caldera_surge">
                <strong>Извержение Кальдеры</strong>
                <small>Шанс мифической рыбы x3.0</small>
              </button>
              <button class="admin-event-btn reset" data-event="clear">
                <strong>Остановить текущее событие</strong>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.currentTab === 'logs') {
      return `
        <div class="admin-logs-card">
          <div class="admin-logs-header">
            <span>Логи последних уловов на сервере (/api/feed):</span>
            <button class="admin-btn small" id="btnRefreshLogs">Обновить</button>
          </div>
          <div class="admin-logs-view" id="adminLogsView">
            Загрузка логов...
          </div>

          <div class="admin-danger-zone">
            <button class="admin-btn red" data-action="wipe-save">Очистить все сохранение (Wipe)</button>
          </div>
        </div>
      `;
    }

    return '';
  }

  bindEvents() {
    this.btnClose.addEventListener('click', () => this.hide());
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.hide();
    });

    // Subtabs
    this.container.addEventListener('click', (e) => {
      const tab = e.target.closest('.admin-subtab');
      if (!tab) return;

      this.container.querySelectorAll('.admin-subtab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this.currentTab = tab.dataset.tab;
      this.contentArea.innerHTML = this.renderTabContent();

      if (this.currentTab === 'logs') {
        this.fetchServerLogs();
      }

      sound.playClick();
      tg.selectionChanged();
    });

    // Actions delegation
    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const val = btn.dataset.val;

      switch (action) {
        case 'add-coins':
          state.addCoins(parseInt(val, 10));
          sound.playCoin();
          tg.notificationSuccess();
          break;
        case 'add-pearls':
          state.addPearls(parseInt(val, 10));
          sound.playCoin();
          tg.notificationSuccess();
          break;
        case 'add-level':
          state.level += parseInt(val, 10);
          state.save();
          sound.playCoin();
          tg.notificationSuccess();
          break;
        case 'set-level':
          state.level = parseInt(val, 10);
          state.save();
          sound.playCoin();
          tg.notificationSuccess();
          break;
        case 'set-streak':
          state.streak = parseInt(val, 10);
          state.save();
          sound.playClick();
          break;
        case 'unlock-all-rods':
          state.ownedRods = RODS.map(r => r.id);
          state.save();
          sound.playCoin();
          tg.notificationSuccess();
          break;
        case 'give-all-baits':
          BAITS.forEach(b => {
            if (b.id !== 'none') {
              state.baits[b.id] = (state.baits[b.id] || 0) + 50;
            }
          });
          state.save();
          sound.playCoin();
          tg.notificationSuccess();
          break;
        case 'unlock-all-biomes':
          state.unlockedBiomes = BIOMES.map(b => b.id);
          state.save();
          sound.playCoin();
          tg.notificationSuccess();
          break;
        case 'complete-bestiary':
          FISH_DATABASE.forEach(f => {
            state.fishdex[f.id] = {
              discovered: true,
              count: 10,
              maxWeight: +(f.maxWeight * 1.3).toFixed(2),
              mutations: ['golden', 'shiny', 'dark', 'albino', 'electric']
            };
          });
          state.save();
          sound.playCoin();
          tg.notificationSuccess();
          break;
        case 'wipe-save':
          if (confirm('Сбросить весь прогресс?')) {
            localStorage.clear();
            document.cookie = "tg_fisch_save_v1=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            location.reload();
          }
          break;
      }
    });

    // Spawn fish
    this.container.addEventListener('click', (e) => {
      if (e.target.id === 'btnSpawnFish' || e.target.closest('#btnSpawnFish')) {
        const fishId = this.container.querySelector('#spawnFishSelect')?.value;
        const mutationId = this.container.querySelector('#spawnMutationSelect')?.value;
        let weight = parseFloat(this.container.querySelector('#spawnWeightInput')?.value || '0');

        const fish = FISH_DATABASE.find(f => f.id === fishId);
        const mutation = MUTATIONS[mutationId] || MUTATIONS.normal;

        if (!fish) return;

        if (!weight || weight <= 0) {
          const base = (fish.minWeight + fish.maxWeight) * 0.5;
          weight = +(base * mutation.weightMultiplier).toFixed(2);
        }

        const price = Math.round(fish.basePrice * mutation.multiplier);
        const catchItem = {
          instanceId: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          fish,
          weight,
          mutation,
          price,
          exp: 50,
          timestamp: Date.now()
        };

        state.addFish(catchItem);
        sound.playCoin();
        tg.notificationSuccess();
        alert(`Рыба [${mutation.name}] ${fish.name} (${weight} кг) добавлена в садок!`);
      }
    });

    // Event triggers
    this.container.addEventListener('click', (e) => {
      const eventBtn = e.target.closest('[data-event]');
      if (!eventBtn) return;

      const eventKey = eventBtn.dataset.event;
      if (eventKey === 'clear') {
        events.clearEvent();
      } else if (EVENT_PRESETS[eventKey]) {
        events.triggerEvent(EVENT_PRESETS[eventKey]);
      }
      sound.playSplash();
      tg.notificationSuccess();
    });

    // Refresh logs
    this.container.addEventListener('click', (e) => {
      if (e.target.id === 'btnRefreshLogs') {
        this.fetchServerLogs();
      }
    });
  }

  async fetchServerLogs() {
    const logsView = this.container.querySelector('#adminLogsView');
    if (!logsView) return;

    try {
      logsView.textContent = 'Загрузка логов с /api/feed...';
      const res = await fetch('/api/feed');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (data.catches && data.catches.length > 0) {
        logsView.innerHTML = data.catches.map(c => {
          const time = new Date(c.timestamp).toLocaleTimeString();
          return `
            <div class="log-entry">
              <span class="log-time">[${time}]</span>
              <strong class="log-user">${c.playerName}</strong> (${c.playerId}) 
              поймал <em>[${c.mutation}] ${c.fishName}</em> 
              вес: ${c.weight}кг • ${c.price}C$ • ${c.biomeName}
            </div>
          `;
        }).join('');
      } else {
        logsView.innerHTML = '<div class="empty-logs">Лайв-логов пока нет. Совершите улов!</div>';
      }
    } catch (e) {
      logsView.innerHTML = `<div class="error-logs">Ошибка получения логов: ${e.message}</div>`;
    }
  }

  show() {
    this.backdrop.classList.remove('hidden');
    this.contentArea.innerHTML = this.renderTabContent();
    sound.playClick();
    tg.impactMedium();
  }

  hide() {
    this.backdrop.classList.add('hidden');
  }
}
