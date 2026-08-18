const STORAGE_KEY = 'tg_fisch_save_v1';

export class StorageManager {
  static isCloudSupported() {
    try {
      const wa = window.Telegram?.WebApp;
      if (!wa || !wa.CloudStorage) return false;
      if (typeof wa.isVersionAtLeast === 'function') {
        return wa.isVersionAtLeast('6.9');
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  static load() {
    // 1. LocalStorage
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error', e);
    }

    // 2. Cookie fallback
    try {
      const match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY + '=([^;]+)'));
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[2]));
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Cookie fallback read error', e);
    }

    return null;
  }

  static async loadFromCloud() {
    return new Promise((resolve) => {
      if (!this.isCloudSupported()) {
        resolve(null);
        return;
      }

      try {
        window.Telegram.WebApp.CloudStorage.getItem(STORAGE_KEY, (err, value) => {
          if (err || !value) {
            resolve(null);
            return;
          }
          try {
            const data = JSON.parse(value);
            resolve(data);
          } catch (e) {
            resolve(null);
          }
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  static save(stateData) {
    if (!stateData) return;
    const serialized = JSON.stringify(stateData);

    // 1. LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.warn('LocalStorage write error', e);
    }

    // 2. Cookie fallback (30 days)
    try {
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(serialized)};path=/;max-age=2592000;SameSite=Lax`;
    } catch (e) {
      console.warn('Cookie write error', e);
    }

    // 3. Telegram CloudStorage (Bot API 6.9+)
    if (this.isCloudSupported()) {
      try {
        window.Telegram.WebApp.CloudStorage.setItem(STORAGE_KEY, serialized, (err) => {
          if (err) console.warn('TG CloudStorage save error:', err);
        });
      } catch (e) {
        console.warn('TG CloudStorage setItem exception:', e);
      }
    }
  }

  static clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      document.cookie = `${STORAGE_KEY}=;path=/;max-age=0`;
      if (this.isCloudSupported()) {
        window.Telegram.WebApp.CloudStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to clear save', e);
    }
  }
}
