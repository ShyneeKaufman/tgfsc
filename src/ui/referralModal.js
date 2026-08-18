import { state } from '../core/state.js';
import { tg } from '../core/telegram.js';
import { sound } from '../core/sound.js';
import { getIconSvg } from './icons.js';

export class ReferralModal {
  constructor(container) {
    this.container = container;
    this.render();
  }

  render() {
    const user = tg.getUser();
    const botUser = 'fihfishingbot';
    const refCode = user.id ? `ref_${user.id}` : 'ref_angler';
    const inviteUrl = `https://t.me/${botUser}?start=${refCode}`;

    this.container.innerHTML = `
      <div class="ref-modal-backdrop hidden" id="refModalBackdrop">
        <div class="ref-card" id="refCard">
          <div class="ref-header">
            <div class="ref-title-group">
              <span class="ref-big-icon">${getIconSvg('userPlus', 24)}</span>
              <div>
                <h3>Invite Friends</h3>
                <p>Earn +5 Abyssal Pearls for every friend who joins your fleet.</p>
              </div>
            </div>
            <button class="btn-close-ref" id="closeRefBtn">${getIconSvg('x', 18)}</button>
          </div>

          <div class="ref-perks-card">
            <div class="perk-row">
              <span class="perk-icon-wrap">${getIconSvg('gem', 20)}</span>
              <div>
                <strong>+5 Abyssal Pearls</strong>
                <small>Credited directly when your friend starts fishing</small>
              </div>
            </div>
            <div class="perk-row">
              <span class="perk-icon-wrap">${getIconSvg('coins', 20)}</span>
              <div>
                <strong>+500 C$ Starter Bonus</strong>
                <small>Starter funds for your friend's first rods and baits</small>
              </div>
            </div>
          </div>

          <div class="ref-link-box">
            <input type="text" readonly value="${inviteUrl}" id="refLinkInput" class="ref-link-input"/>
            <button class="btn-copy-ref" id="copyRefBtn">
              ${getIconSvg('copy', 14)} Copy
            </button>
          </div>

          <div class="ref-footer">
            <button class="btn-share-tg" id="shareTgBtn">
              ${getIconSvg('send', 15)} Share in Telegram
            </button>
          </div>
        </div>
      </div>
    `;

    this.backdrop = this.container.querySelector('#refModalBackdrop');
    this.closeBtn = this.container.querySelector('#closeRefBtn');
    this.copyBtn = this.container.querySelector('#copyRefBtn');
    this.shareBtn = this.container.querySelector('#shareTgBtn');
    this.linkInput = this.container.querySelector('#refLinkInput');

    this.bindEvents(inviteUrl);
  }

  bindEvents(inviteUrl) {
    this.closeBtn.addEventListener('click', () => this.hide());
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.hide();
    });

    this.copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(inviteUrl);
      this.copyBtn.innerHTML = `${getIconSvg('check', 14)} Copied!`;
      sound.playClick();
      tg.notificationSuccess();
      setTimeout(() => {
        this.copyBtn.innerHTML = `${getIconSvg('copy', 14)} Copy`;
      }, 2000);
    });

    this.shareBtn.addEventListener('click', () => {
      const shareText = encodeURIComponent('Play TG-Fisch on Telegram! Catch legendary sea monsters, explore islands, and discover rare mutations!');
      const shareLink = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${shareText}`;
      
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(shareLink);
      } else {
        window.open(shareLink, '_blank');
      }
      
      sound.playClick();
      tg.impactMedium();
    });
  }

  show() {
    this.backdrop.classList.remove('hidden');
    sound.playClick();
    tg.selectionChanged();
  }

  hide() {
    this.backdrop.classList.add('hidden');
  }
}
