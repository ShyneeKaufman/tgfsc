const STORAGE_KEY = 'tg_fisch_save_v1';

export class StorageManager {
  static load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load local state', e);
    }
    return null;
  }

  static save(stateData) {
    try {
      const serialized = JSON.stringify(stateData);
      localStorage.setItem(STORAGE_KEY, serialized);

      // Also attempt Telegram CloudStorage if available
      if (window.Telegram?.WebApp?.CloudStorage) {
        window.Telegram.WebApp.CloudStorage.setItem(STORAGE_KEY, serialized, (err) => {
          if (err) console.warn('TG CloudStorage save error:', err);
        });
      }
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }

  static clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (window.Telegram?.WebApp?.CloudStorage) {
        window.Telegram.WebApp.CloudStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to clear save', e);
    }
  }
}
