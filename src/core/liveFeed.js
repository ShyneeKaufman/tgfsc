import { state } from './state.js';
import { FISH_DATABASE } from '../data/fish.js';
import { MUTATIONS } from '../data/mutations.js';
import { BIOMES } from '../data/biomes.js';

class LiveFeedManager {
  constructor() {
    this.listeners = new Set();
    this.anglersByBiome = {
      coast: [
        { name: 'Nemo_99', avatar: '🐠', level: 3 },
        { name: 'CaptainJack', avatar: '⚓', level: 7 },
        { name: 'SeaBreeze', avatar: '⛵', level: 2 },
        { name: 'FisherKing', avatar: '👑', level: 5 }
      ],
      reef: [
        { name: 'CoralDiver', avatar: '🤿', level: 6 },
        { name: 'SharkHunter', avatar: '🦈', level: 9 },
        { name: 'AquaStar', avatar: '⭐', level: 8 }
      ],
      abyss: [
        { name: 'AbyssWalker', avatar: '🌌', level: 12 },
        { name: 'KrakenSeeker', avatar: '🐙', level: 15 }
      ],
      caldera: [
        { name: 'LavaCaster', avatar: '🔥', level: 18 },
        { name: 'MagmaLord', avatar: '🌋', level: 22 }
      ]
    };

    this.startSimulation();
  }

  getAnglersForCurrentBiome() {
    const current = state.currentBiome;
    return this.anglersByBiome[current] || [];
  }

  getAnglersCount(biomeId) {
    const list = this.anglersByBiome[biomeId] || [];
    return list.length + (biomeId === state.currentBiome ? 1 : 0);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emitCatch(catchEvent) {
    for (const fn of this.listeners) {
      try {
        fn(catchEvent);
      } catch (e) {
        console.error('LiveFeed listener error', e);
      }
    }
  }

  broadcastLocalCatch(catchItem, isPerfect) {
    const user = state.stats;
    const biome = state.getCurrentBiome();
    const event = {
      isLocal: true,
      playerName: 'Вы',
      isPerfect,
      fishName: catchItem.fish.name,
      fishIcon: catchItem.fish.icon,
      rarity: catchItem.fish.rarity,
      mutation: catchItem.mutation.name,
      mutationId: catchItem.mutation.id,
      weight: catchItem.weight,
      price: catchItem.price,
      biomeName: biome.name,
      timestamp: Date.now()
    };
    this.emitCatch(event);
  }

  startSimulation() {
    // Generate periodic live catch announcements from other online anglers
    const simulateCatch = () => {
      const biomeKeys = Object.keys(this.anglersByBiome);
      const randomBiomeKey = biomeKeys[Math.floor(Math.random() * biomeKeys.length)];
      const anglers = this.anglersByBiome[randomBiomeKey];
      if (!anglers || anglers.length === 0) return;

      const randomAngler = anglers[Math.floor(Math.random() * anglers.length)];
      const biomeFish = FISH_DATABASE.filter(f => f.biome === randomBiomeKey);
      if (biomeFish.length === 0) return;

      const randomFish = biomeFish[Math.floor(Math.random() * biomeFish.length)];
      const mutationsList = Object.values(MUTATIONS);
      const randomMutation = Math.random() < 0.25
        ? mutationsList[Math.floor(Math.random() * mutationsList.length)]
        : MUTATIONS.normal;

      const baseWeight = (randomFish.minWeight + randomFish.maxWeight) * 0.5;
      const weight = +(baseWeight * (0.85 + Math.random() * 0.3) * randomMutation.weightMultiplier).toFixed(2);
      const biomeObj = BIOMES.find(b => b.id === randomBiomeKey) || BIOMES[0];

      const event = {
        isLocal: false,
        playerName: `@${randomAngler.name}`,
        isPerfect: Math.random() < 0.3,
        fishName: randomFish.name,
        fishIcon: randomFish.icon,
        rarity: randomFish.rarity,
        mutation: randomMutation.name,
        mutationId: randomMutation.id,
        weight,
        price: Math.round(randomFish.basePrice * randomMutation.multiplier),
        biomeName: biomeObj.name,
        timestamp: Date.now()
      };

      this.emitCatch(event);

      // Next simulated catch in 7 to 18 seconds
      const nextDelay = 7000 + Math.random() * 11000;
      setTimeout(simulateCatch, nextDelay);
    };

    setTimeout(simulateCatch, 3500);
  }
}

export const liveFeed = new LiveFeedManager();
