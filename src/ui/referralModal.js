import { state } from '../core/state.js';
import { tg } from '../core/telegram.js';
import { sound } from '../core/sound.js';

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
              <span class="ref-big-icon">🤝</span>
              <div>
                <h3>Пригласи Друзей</h3>
                <p>Получай +5 💎 Жемчужин за каждого друга!</p>
              </div>
            </div>
            <button class="btn-close-ref" id="closeRefBtn">✕</button>
          </div>

          <div class="ref-perks-card">
            <div class="perk-row">
              <span>💎</span>
              <div>
                <strong>+5 Жемчуга Бездны</strong>
                <small>Мгновенно на твой баланс за каждого приглашенного</small>
              </div>
            </div>
            <div class="perk-row">
              <span>🪙</span>
              <div>
                <strong>+500 Монет другу</strong>
                <small>Твой друг получит стартовый капитал на снасти</small>
              </div>
            </div>
          </div>

          <div class="ref-link-box">
            <input type="text" readonly value="${inviteUrl}" id="refLinkInput" class="ref-link-input"/>
            <button class="btn-copy-ref" id="copyRefBtn">Копировать</button>
          </div>

          <div class="ref-footer">
            <button class="btn-share-tg" id="shareTgBtn">
              <span>✈️</span> ПОДЕЛИТЬСЯ В TELEGRAM
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
      this.copyBtn.textContent = 'Скопировано! ✓';
      sound.playClick();
      tg.notificationSuccess();
      setTimeout(() => {
        this.copyBtn.textContent = 'Копировать';
      }, 2000);
    });

    this.shareBtn.addEventListener('click', () => {
      const shareText = encodeURIComponent('🎣 Погнали рыбачить в TG-Fisch! Лови редких мутантов и вытаскивай легендарную рыбу прямо в Telegram:');
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
