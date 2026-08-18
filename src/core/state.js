import { StorageManager } from './storage.js';
import { RODS } from '../data/rods.js';
import { BAITS } from '../data/baits.js';
import { BIOMES } from '../data/biomes.js';
import { tg } from './telegram.js';

class GameState {
  constructor() {
    this.listeners = new Set();
    this.streak = 0;
    this.castLuckBonus = 0; // Granted by Perfect Cast
    this.loadInitialState();
    this.syncCloud();
  }

  loadInitialState() {
    const saved = StorageManager.load();
    this.applyData(saved);
  }

  async syncCloud() {
    try {
      const cloudData = await StorageManager.loadFromCloud();
      if (cloudData) {
        // If cloud data is richer or more advanced, apply it
        if ((cloudData.coins || 0) >= this.coins && (cloudData.level || 1) >= this.level) {
          this.applyData(cloudData);
          this.notify();
        }
      }
    } catch (e) {
      console.warn('Cloud sync failed:', e);
    }
  }

  applyData(data) {
    if (data) {
      this.coins = data.coins ?? 50;
      this.pearls = data.pearls ?? 0;
      this.level = data.level ?? 1;
      this.exp = data.exp ?? 0;
      this.equippedRodId = data.equippedRodId ?? 'starter_rod';
      this.equippedBaitId = data.equippedBaitId ?? 'none';
      this.ownedRods = data.ownedRods ?? ['starter_rod'];
      this.baits = data.baits ?? { none: 999999, worm: 5 };
      this.inventory = data.inventory ?? [];
      this.backpackCapacity = data.backpackCapacity ?? 15;
      this.currentBiome = data.currentBiome ?? 'coast';
      this.unlockedBiomes = data.unlockedBiomes ?? ['coast'];
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
      this.equippedRodId = 'starter_rod';
      this.equippedBaitId = 'none';
      this.ownedRods = ['starter_rod'];
      this.baits = { none: 999999, worm: 5 };
      this.inventory = [];
      this.backpackCapacity = 15;
      this.currentBiome = 'coast';
      this.unlockedBiomes = ['coast'];
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
      backpackCapacity: this.backpackCapacity,
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
    // 2% luck bonus per streak, capped at +30%
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
    if (this.inventory.length >= this.backpackCapacity) {
      return false;
    }

    this.inventory.unshift(fishItem);
    this.stats.totalCaught += 1;
    if (fishItem.weight > this.stats.heaviestFish) {
      this.stats.heaviestFish = fishItem.weight;
    }

    // Update FishDex
    const dex = this.fishdex[fishItem.fishId] || {
      discovered: true,
      count: 0,
      maxWeight: 0,
      mutations: []
    };

    dex.count += 1;
    dex.maxWeight = Math.max(dex.maxWeight, fishItem.weight);
    if (!dex.mutations.includes(fishItem.mutation.id)) {
      dex.mutations.push(fishItem.mutation.id);
    }
    this.fishdex[fishItem.fishId] = dex;

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
    tg.notificationSuccess();
    this.save();
    return total;
  }

  upgradeBackpack() {
    const cost = Math.round(150 * Math.pow(1.6, (this.backpackCapacity - 15) / 5));
    if (this.spendCoins(cost)) {
      this.backpackCapacity += 5;
      tg.notificationSuccess();
      this.save();
      return true;
    }
    return false;
  }

  getBackpackUpgradeCost() {
    return Math.round(150 * Math.pow(1.6, (this.backpackCapacity - 15) / 5));
  }

  // --- Gear Actions ---
  equipRod(rodId) {
    if (this.ownedRods.includes(rodId)) {
      this.equippedRodId = rodId;
      tg.selectionChanged();
      this.save();
      return true;
    }
    return false;
  }

  buyRod(rodId) {
    const rod = RODS.find(r => r.id === rodId);
    if (!rod || this.ownedRods.includes(rodId)) return false;

    if (this.level < rod.requiredLevel) return false;

    if (rod.pearlPrice > 0 && this.pearls < rod.pearlPrice) return false;
    if (rod.price > 0 && this.coins < rod.price) return false;

    if (rod.price > 0) this.coins -= rod.price;
    if (rod.pearlPrice > 0) this.pearls -= rod.pearlPrice;

    this.ownedRods.push(rodId);
    this.equippedRodId = rodId;
    tg.notificationSuccess();
    this.save();
    return true;
  }

  equipBait(baitId) {
    if (baitId === 'none' || (this.baits[baitId] && this.baits[baitId] > 0)) {
      this.equippedBaitId = baitId;
      tg.selectionChanged();
      this.save();
      return true;
    }
    return false;
  }

  buyBait(baitId) {
    const bait = BAITS.find(b => b.id === baitId);
    if (!bait || bait.id === 'none') return false;

    if (this.spendCoins(bait.price)) {
      this.baits[baitId] = (this.baits[baitId] || 0) + bait.amount;
      this.equippedBaitId = baitId;
      tg.notificationSuccess();
      this.save();
      return true;
    }
    return false;
  }

  consumeBait() {
    if (this.equippedBaitId === 'none') return;
    if (this.baits[this.equippedBaitId] > 0) {
      this.baits[this.equippedBaitId] -= 1;
      if (this.baits[this.equippedBaitId] <= 0) {
        this.equippedBaitId = 'none';
      }
      this.save();
    }
  }

  // --- Travel Actions ---
  unlockBiome(biomeId) {
    const biome = BIOMES.find(b => b.id === biomeId);
    if (!biome || this.unlockedBiomes.includes(biomeId)) return false;

    if (this.level < biome.requiredLevel) return false;

    if (this.spendCoins(biome.travelCost)) {
      this.unlockedBiomes.push(biomeId);
      this.currentBiome = biomeId;
      tg.notificationSuccess();
      this.save();
      return true;
    }
    return false;
  }

  travelTo(biomeId) {
    if (this.unlockedBiomes.includes(biomeId)) {
      this.currentBiome = biomeId;
      tg.selectionChanged();
      this.save();
      return true;
    }
    return false;
  }
}

export const state = new GameState();
