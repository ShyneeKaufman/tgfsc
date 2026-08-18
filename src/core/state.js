import { RODS } from '../data/rods.js';
import { BAITS } from '../data/baits.js';
import { BIOMES } from '../data/biomes.js';
import { StorageManager } from './storage.js';
import { tg } from './telegram.js';

class GameState {
  constructor() {
    this.listeners = new Set();
    this.castLuckBonus = 0;

    // Load from LocalStorage / Cookies
    const saved = StorageManager.load();
    this.applyData(saved);

    // Async sync with Telegram CloudStorage
    this.syncCloud();
  }

  async syncCloud() {
    try {
      const cloudData = await StorageManager.loadFromCloud();
      if (cloudData) {
        if ((cloudData.coins || 0) >= this.coins && (cloudData.level || 1) >= this.level) {
          this.applyData(cloudData);
          this.notify();
        }
      }
    } catch (e) {
      console.warn('Cloud sync failed:', e);
    }
  }

  migrateRod(id) {
    const map = {
      starter_rod: 'flimsy_rod',
      iron_rod: 'carbon_rod',
      neon_rod: 'fast_rod',
      golden_rod: 'lucky_rod',
      abyssal_rod: 'destiny_rod'
    };
    return map[id] || id;
  }

  migrateBiome(id) {
    const map = {
      coast: 'moosewood',
      reef: 'roslit',
      abyss: 'depths',
      caldera: 'sunstone'
    };
    return map[id] || id;
  }

  applyData(data) {
    if (data) {
      this.coins = data.coins ?? 50;
      this.pearls = data.pearls ?? 0;
      this.level = data.level ?? 1;
      this.exp = data.exp ?? 0;
      
      const rawRod = data.equippedRodId ?? 'flimsy_rod';
      this.equippedRodId = this.migrateRod(rawRod);

      this.equippedBaitId = data.equippedBaitId ?? 'none';
      
      const rawOwnedRods = data.ownedRods ?? ['flimsy_rod'];
      this.ownedRods = Array.isArray(rawOwnedRods) 
        ? rawOwnedRods.map(r => this.migrateRod(r)) 
        : ['flimsy_rod'];
      if (!this.ownedRods.includes('flimsy_rod')) this.ownedRods.unshift('flimsy_rod');

      this.baits = data.baits ?? { none: 999999, worm: 5 };
      this.inventory = Array.isArray(data.inventory) ? data.inventory : [];
      this.backpackCapacity = Infinity; // Infinite backpack!

      const rawBiome = data.currentBiome ?? 'moosewood';
      this.currentBiome = this.migrateBiome(rawBiome);

      const rawUnlocked = data.unlockedBiomes ?? ['moosewood'];
      this.unlockedBiomes = Array.isArray(rawUnlocked) 
        ? rawUnlocked.map(b => this.migrateBiome(b)) 
        : ['moosewood'];
      if (!this.unlockedBiomes.includes('moosewood')) this.unlockedBiomes.unshift('moosewood');

      this.fishdex = data.fishdex ?? {};
      this.streak = data.streak ?? 0;
      this.dailyStreak = data.dailyStreak ?? 0;
      this.lastDailyClaim = data.lastDailyClaim ?? 0;
      this.stats = data.stats ?? {
        totalCaught: 0,
        totalCoinsEarned: 0,
        heaviestFish: 0,
        perfectCasts: 0
      };
    } else {
      this.coins = 50;
      this.pearls = 0;
      this.level = 1;
      this.exp = 0;
      this.equippedRodId = 'flimsy_rod';
      this.equippedBaitId = 'none';
      this.ownedRods = ['flimsy_rod'];
      this.baits = { none: 999999, worm: 5 };
      this.inventory = [];
      this.backpackCapacity = Infinity; // Infinite backpack!
      this.currentBiome = 'moosewood';
      this.unlockedBiomes = ['moosewood'];
      this.fishdex = {};
      this.streak = 0;
      this.dailyStreak = 0;
      this.lastDailyClaim = 0;
      this.stats = {
        totalCaught: 0,
        totalCoinsEarned: 0,
        heaviestFish: 0,
        perfectCasts: 0
      };
    }
  }

  save() {
    StorageManager.save({
      coins: this.coins,
      pearls: this.pearls,
      level: this.level,
      exp: this.exp,
      equippedRodId: this.equippedRodId,
      equippedBaitId: this.equippedBaitId,
      ownedRods: this.ownedRods,
      baits: this.baits,
      inventory: this.inventory,
      backpackCapacity: Infinity,
      currentBiome: this.currentBiome,
      unlockedBiomes: this.unlockedBiomes,
      fishdex: this.fishdex,
      streak: this.streak,
      dailyStreak: this.dailyStreak,
      lastDailyClaim: this.lastDailyClaim,
      stats: this.stats
    });
    this.notify();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      try {
        fn(this);
      } catch (e) {
        console.error('State listener error', e);
      }
    }
  }

  // --- Getters ---
  getMaxExp() {
    return Math.round(100 * Math.pow(1.3, this.level - 1));
  }

  getEquippedRod() {
    return RODS.find(r => r.id === this.equippedRodId) || RODS[0];
  }

  getEquippedBait() {
    return BAITS.find(b => b.id === this.equippedBaitId) || BAITS[0];
  }

  getCurrentBiome() {
    return BIOMES.find(b => b.id === this.currentBiome) || BIOMES[0];
  }

  getStreakLuckBonus() {
    return Math.min(30, this.streak * 2);
  }

  incrementStreak() {
    this.streak += 1;
    this.save();
  }

  resetStreak() {
    if (this.streak > 0) {
      this.streak = 0;
      this.save();
    }
  }

  // --- Progress Actions ---
  addExp(amount) {
    this.exp += amount;
    let leveledUp = false;

    while (this.exp >= this.getMaxExp()) {
      this.exp -= this.getMaxExp();
      this.level += 1;
      this.pearls += 3;
      leveledUp = true;
    }

    if (leveledUp) {
      tg.notificationSuccess();
    }
    this.save();
    return leveledUp;
  }

  addCoins(amount) {
    this.coins += amount;
    this.stats.totalCoinsEarned += amount;
    this.save();
  }

  spendCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  addPearls(amount) {
    this.pearls += amount;
    this.save();
  }

  spendPearls(amount) {
    if (this.pearls >= amount) {
      this.pearls -= amount;
      this.save();
      return true;
    }
    return false;
  }

  // --- Inventory & Fish Caught ---
  addFish(fishItem) {
    // Infinite backpack: always allow adding!
    this.inventory.unshift(fishItem);
    this.stats.totalCaught += 1;
    if (fishItem.weight > this.stats.heaviestFish) {
      this.stats.heaviestFish = fishItem.weight;
    }

    const fishId = fishItem.fish?.id || fishItem.fishId || 'unknown';
    // Update Bestiary
    const dex = this.fishdex[fishId] || {
      discovered: true,
      count: 0,
      maxWeight: 0,
      mutations: []
    };

    dex.count += 1;
    dex.maxWeight = Math.max(dex.maxWeight, fishItem.weight);
    if (fishItem.mutation && !dex.mutations.includes(fishItem.mutation.id)) {
      dex.mutations.push(fishItem.mutation.id);
    }
    this.fishdex[fishId] = dex;

    this.save();
    return true;
  }

  removeFish(instanceId) {
    const idx = this.inventory.findIndex(f => f.instanceId === instanceId);
    if (idx !== -1) {
      const removed = this.inventory.splice(idx, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  sellFish(instanceId) {
    const item = this.removeFish(instanceId);
    if (item) {
      this.addCoins(item.price);
      return item.price;
    }
    return 0;
  }

  sellAllFish() {
    if (this.inventory.length === 0) return 0;
    const total = this.inventory.reduce((sum, f) => sum + f.price, 0);
    this.inventory = [];
    this.addCoins(total);
    return total;
  }

  // --- Equipment & Shop ---
  buyRod(rodId) {
    const rod = RODS.find(r => r.id === rodId);
    if (!rod || this.ownedRods.includes(rodId)) return false;
    if (this.level < rod.levelReq) return false;

    if (rod.pearlPrice > 0) {
      if (!this.spendPearls(rod.pearlPrice)) return false;
    }
    if (rod.price > 0) {
      if (!this.spendCoins(rod.price)) return false;
    }

    this.ownedRods.push(rodId);
    this.equippedRodId = rodId;
    this.save();
    return true;
  }

  equipRod(rodId) {
    if (this.ownedRods.includes(rodId)) {
      this.equippedRodId = rodId;
      this.save();
      return true;
    }
    return false;
  }

  buyBait(baitId, quantity = 1) {
    const bait = BAITS.find(b => b.id === baitId);
    if (!bait) return false;

    const totalCost = bait.price * quantity;
    const totalPearlCost = bait.pearlPrice * quantity;

    if (totalPearlCost > 0) {
      if (!this.spendPearls(totalPearlCost)) return false;
    }
    if (totalCost > 0) {
      if (!this.spendCoins(totalCost)) return false;
    }

    const addedAmount = bait.amount * quantity;
    this.baits[baitId] = (this.baits[baitId] || 0) + addedAmount;
    if (this.equippedBaitId === 'none') {
      this.equippedBaitId = baitId;
    }
    this.save();
    return true;
  }

  equipBait(baitId) {
    if (baitId === 'none' || (this.baits[baitId] && this.baits[baitId] > 0)) {
      this.equippedBaitId = baitId;
      this.save();
      return true;
    }
    return false;
  }

  consumeBait() {
    if (this.equippedBaitId !== 'none') {
      if (this.baits[this.equippedBaitId] > 0) {
        this.baits[this.equippedBaitId] -= 1;
        if (this.baits[this.equippedBaitId] <= 0) {
          this.equippedBaitId = 'none';
        }
        this.save();
      }
    }
  }

  // --- Travel ---
  travelTo(biomeId) {
    const biome = BIOMES.find(b => b.id === biomeId);
    if (!biome) return false;
    if (this.level < biome.levelReq) return false;

    if (!this.unlockedBiomes.includes(biomeId)) {
      this.unlockedBiomes.push(biomeId);
    }
    this.currentBiome = biomeId;
    this.save();
    return true;
  }
}

export const state = new GameState();
