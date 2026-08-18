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
              <h2 class="admin-title">ADMIN CONTROL PANEL</h2>
            </div>
            <button class="modal-close-btn" id="btnAdminClose">${getIconSvg('x', 18)}</button>
          </div>

          <div class="admin-user-info">
            <span>Admin ID: <strong>1952158452</strong></span>
            <span class="admin-status-tag">SUPERUSER GRANTED</span>
          </div>

          <!-- Navigation Subtabs -->
          <div class="admin-subtabs-row">
            <button class="admin-subtab active" data-tab="resources">Resources</button>
            <button class="admin-subtab" data-tab="gear">Gear & Islands</button>
            <button class="admin-subtab" data-tab="spawn">Spawn Fish</button>
            <button class="admin-subtab" data-tab="events">Events</button>
            <button class="admin-subtab" data-tab="logs">Server Logs</button>
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
            <div class="admin-section-title">${getIconSvg('coins', 14)} Coins (C$)</div>
            <div class="admin-btn-row">
              <button class="admin-btn" data-action="add-coins" data-val="5000">+5,000</button>
              <button class="admin-btn" data-action="add-coins" data-val="50000">+50,000</button>
              <button class="admin-btn gold" data-action="add-coins" data-val="1000000">+1,000,000</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('gem', 14)} Abyssal Pearls</div>
            <div class="admin-btn-row">
              <button class="admin-btn" data-action="add-pearls" data-val="10">+10</button>
              <button class="admin-btn" data-action="add-pearls" data-val="100">+100</button>
              <button class="admin-btn cyan" data-action="add-pearls" data-val="1000">+1,000</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('trophy', 14)} Level & EXP</div>
            <div class="admin-btn-row">
              <button class="admin-btn" data-action="add-level" data-val="1">+1 Level</button>
              <button class="admin-btn" data-action="add-level" data-val="10">+10 Levels</button>
              <button class="admin-btn cyan" data-action="set-level" data-val="50">Level 50</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('flame', 14)} Bite Streak</div>
            <div class="admin-btn-row">
              <button class="admin-btn" data-action="set-streak" data-val="10">Streak x10</button>
              <button class="admin-btn gold" data-action="set-streak" data-val="50">Streak x50</button>
              <button class="admin-btn red" data-action="set-streak" data-val="0">Reset</button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.currentTab === 'gear') {
      return `
        <div class="admin-grid">
          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('anchor', 14)} Rods Unlock</div>
            <p class="admin-hint">Instantly unlocks all 11 authentic Fisch rods.</p>
            <div class="admin-btn-row">
              <button class="admin-btn cyan" data-action="unlock-all-rods">Unlock All Rods</button>
              <button class="admin-btn" data-action="give-all-baits">+50 All Baits</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('map', 14)} Islands Access</div>
            <p class="admin-hint">Unlocks all 5 archipelago islands regardless of player level.</p>
            <div class="admin-btn-row">
              <button class="admin-btn gold" data-action="unlock-all-biomes">Unlock All Islands</button>
            </div>
          </div>

          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('book', 14)} Bestiary (100%)</div>
            <p class="admin-hint">Populates entries for all 37 fish species and legendary mutations.</p>
            <div class="admin-btn-row">
              <button class="admin-btn cyan" data-action="complete-bestiary">Complete Bestiary (100%)</button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.currentTab === 'spawn') {
      return `
        <div class="admin-spawn-card">
          <div class="admin-field-group">
            <label>Select Fish:</label>
            <select class="admin-select" id="spawnFishSelect">
              ${FISH_DATABASE.map(f => `
                <option value="${f.id}">[${f.rarity.toUpperCase()}] ${f.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="admin-field-group">
            <label>Mutation:</label>
            <select class="admin-select" id="spawnMutationSelect">
              ${Object.values(MUTATIONS).map(m => `
                <option value="${m.id}">${m.name} (${m.multiplier}x value)</option>
              `).join('')}
            </select>
          </div>

          <div class="admin-field-group">
            <label>Weight (kg) [0 = auto]:</label>
            <input type="number" class="admin-input" id="spawnWeightInput" value="0" step="0.1" min="0"/>
          </div>

          <button class="admin-action-btn-large" id="btnSpawnFish">
            ${getIconSvg('bag', 18)} Spawn Fish to Backpack
          </button>
        </div>
      `;
    }

    if (this.currentTab === 'events') {
      return `
        <div class="admin-grid">
          <div class="admin-section">
            <div class="admin-section-title">${getIconSvg('zap', 14)} Weather & Global Anomalies</div>
            <p class="admin-hint">Immediately activates a 3-minute global anomaly for all players.</p>
            <div class="admin-btn-list">
              <button class="admin-event-btn" data-event="abyssal_storm">
                <strong>Abyssal Storm</strong>
                <small>+25 Luck & 2.5x Mutation Rates</small>
              </button>
              <button class="admin-event-btn" data-event="golden_hour">
                <strong>Golden Hour</strong>
                <small>5.0x Golden Mutations & 2.0x Sell Value</small>
              </button>
              <button class="admin-event-btn" data-event="aurora_blessing">
                <strong>Aurora Blessing</strong>
                <small>+40 Luck & 2.0x Catch EXP</small>
              </button>
              <button class="admin-event-btn" data-event="caldera_surge">
                <strong>Caldera Surge</strong>
                <small>3.0x Mythical & Apex Titan Spawns</small>
              </button>
              <button class="admin-event-btn reset" data-event="clear">
                <strong>Stop Current Event</strong>
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
            <span>Recent server catches (/api/feed):</span>
            <button class="admin-btn small" id="btnRefreshLogs">Refresh</button>
          </div>
          <div class="admin-logs-view" id="adminLogsView">
            Loading live logs...
          </div>

          <div class="admin-danger-zone">
            <button class="admin-btn red" data-action="wipe-save">Wipe All Save Data</button>
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
          if (confirm('Wipe all local save data and restart?')) {
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
          weight = +(base * mutation.multiplier).toFixed(2);
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
        alert(`Spawned [${mutation.name}] ${fish.name} (${weight} kg) into backpack!`);
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
      logsView.textContent = 'Fetching logs from /api/feed...';
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
              caught <em>[${c.mutation}] ${c.fishName}</em> 
              weight: ${c.weight}kg • ${c.price}C$ • ${c.biomeName}
            </div>
          `;
        }).join('');
      } else {
        logsView.innerHTML = '<div class="empty-logs">No catches logged yet. Catch a fish!</div>';
      }
    } catch (e) {
      logsView.innerHTML = `<div class="error-logs">Error loading logs: ${e.message}</div>`;
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
