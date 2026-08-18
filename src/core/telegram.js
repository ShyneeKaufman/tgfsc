class TelegramBridge {
  constructor() {
    this.tg = window.Telegram?.WebApp || null;
    this.isAvailable = !!this.tg;
    this.adminIds = [1952158452, '1952158452'];
    this.init();
  }

  init() {
    if (!this.tg) {
      console.log('Telegram WebApp not detected. Running in standalone browser mode.');
      return;
    }

    try {
      this.tg.ready();
      this.tg.expand();
      this.tg.enableClosingConfirmation?.();

      if (this.tg.setHeaderColor) {
        this.tg.setHeaderColor('#0a0f1d');
      }
      if (this.tg.setBackgroundColor) {
        this.tg.setBackgroundColor('#0a0f1d');
      }
    } catch (e) {
      console.warn('Telegram init error:', e);
    }
  }

  getUser() {
    if (this.tg?.initDataUnsafe?.user) {
      const u = this.tg.initDataUnsafe.user;
      return {
        id: u.id,
        username: u.username || 'Рыбак',
        firstName: u.first_name || 'Рыбак',
        lastName: u.last_name || '',
        photoUrl: u.photo_url || null
      };
    }
    return {
      id: 1952158452, // Default admin id in standalone mode
      username: 'ShyneeKaufman',
      firstName: 'Капитан',
      lastName: '',
      photoUrl: null
    };
  }

  isAdmin() {
    const user = this.getUser();
    if (user.id && this.adminIds.includes(user.id)) {
      return true;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1952158452' || params.get('admin') === 'true') {
        return true;
      }
    } catch (e) {}
    return false;
  }

  // --- Haptic Feedback ---
  impactLight() {
    this.tg?.HapticFeedback?.impactOccurred('light');
  }

  impactMedium() {
    this.tg?.HapticFeedback?.impactOccurred('medium');
  }

  impactHeavy() {
    this.tg?.HapticFeedback?.impactOccurred('heavy');
  }

  impactRigid() {
    this.tg?.HapticFeedback?.impactOccurred('rigid');
  }

  notificationSuccess() {
    this.tg?.HapticFeedback?.notificationOccurred('success');
  }

  notificationWarning() {
    this.tg?.HapticFeedback?.notificationOccurred('warning');
  }

  notificationError() {
    this.tg?.HapticFeedback?.notificationOccurred('error');
  }

  selectionChanged() {
    this.tg?.HapticFeedback?.selectionChanged();
  }
}

export const tg = new TelegramBridge();
