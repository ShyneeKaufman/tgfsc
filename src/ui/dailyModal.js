import { state } from '../core/state.js';
import { DAILY_REWARDS } from '../data/dailyRewards.js';
import { sound } from '../core/sound.js';
import { tg } from '../core/telegram.js';
import { getIconSvg } from './icons.js';

export class DailyModal {
  constructor(container) {
    this.container = container;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="daily-modal-backdrop hidden" id="dailyModalBackdrop">
        <div class="daily-card" id="dailyCard">
          <div class="daily-header">
            <div class="daily-title-group">
              <span class="daily-big-icon">${getIconSvg('gift', 24)}</span>
              <div>
                <h3>Daily Rewards</h3>
                <p>Log in every day to claim exclusive currency and premium baits.</p>
              </div>
            </div>
            <button class="btn-close-daily" id="closeDailyBtn">${getIconSvg('x', 18)}</button>
          </div>

          <div class="daily-grid" id="dailyGrid"></div>

          <div class="daily-footer">
            <button class="btn-claim-daily" id="claimDailyBtn">Claim Reward</button>
          </div>
        </div>
      </div>
    `;

    this.backdrop = this.container.querySelector('#dailyModalBackdrop');
    this.grid = this.container.querySelector('#dailyGrid');
    this.claimBtn = this.container.querySelector('#claimDailyBtn');
    this.closeBtn = this.container.querySelector('#closeDailyBtn');

    this.bindEvents();
  }

  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.hide());
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.hide();
    });

    this.claimBtn.addEventListener('click', () => {
      this.claimReward();
    });
  }

  isClaimAvailable() {
    const lastClaim = state.lastDailyClaim || 0;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return (now - lastClaim) >= oneDayMs || lastClaim === 0;
  }

  show() {
    this.updateGrid();
    this.backdrop.classList.remove('hidden');
    sound.playClick();
    tg.selectionChanged();
  }

  hide() {
    this.backdrop.classList.add('hidden');
  }

  updateGrid() {
    const currentStreak = (state.dailyStreak || 0) % 7;
    const canClaim = this.isClaimAvailable();

    this.grid.innerHTML = DAILY_REWARDS.map((reward, index) => {
      const isClaimed = index < currentStreak;
      const isCurrent = index === currentStreak;

      let statusClass = 'locked';
      let statusText = 'Locked';

      if (isClaimed) {
        statusClass = 'claimed';
        statusText = 'Claimed';
      } else if (isCurrent) {
        statusClass = canClaim ? 'available' : 'waiting';
        statusText = canClaim ? 'Ready' : 'Tomorrow';
      }

      return `
        <div class="daily-box ${statusClass} ${reward.day === 7 ? 'grand-box' : ''}">
          <div class="daily-day-label">${reward.title}</div>
          <div class="daily-box-icon">${getIconSvg(reward.iconKey || 'coins', 22)}</div>
          <div class="daily-box-reward">${reward.rewardText}</div>
          <div class="daily-box-status">${statusText}</div>
        </div>
      `;
    }).join('');

    if (canClaim) {
      this.claimBtn.disabled = false;
      this.claimBtn.textContent = `Claim Day ${currentStreak + 1} Reward`;
      this.claimBtn.classList.remove('disabled');
    } else {
      this.claimBtn.disabled = true;
      this.claimBtn.textContent = 'Reward Already Claimed Today';
      this.claimBtn.classList.add('disabled');
    }
  }

  claimReward() {
    if (!this.isClaimAvailable()) return;

    const streakIdx = (state.dailyStreak || 0) % 7;
    const reward = DAILY_REWARDS[streakIdx];

    state.addCoins(reward.coins);
    if (reward.pearls > 0) state.addPearls(reward.pearls);
    if (reward.baitId && reward.baitCount > 0) {
      state.baits[reward.baitId] = (state.baits[reward.baitId] || 0) + reward.baitCount;
    }

    state.dailyStreak = (state.dailyStreak || 0) + 1;
    state.lastDailyClaim = Date.now();
    state.save();

    sound.playCatchFanfare();
    tg.notificationSuccess();

    this.updateGrid();
  }
}
