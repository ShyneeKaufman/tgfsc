import { state } from './state.js';

class LiveFeedManager {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(event) {
    for (const fn of this.listeners) {
      try {
        fn(event);
      } catch (e) {
        console.error('LiveFeed listener error', e);
      }
    }
  }

  broadcastLocalCatch(catchItem, isPerfect) {
    const biome = state.getCurrentBiome();
    const event = {
      isLocal: true,
      playerName: 'Вы',
      isPerfect,
      fishName: catchItem.fish.name,
      rarity: catchItem.fish.rarity,
      mutation: catchItem.mutation.name,
      mutationId: catchItem.mutation.id,
      weight: catchItem.weight,
      price: catchItem.price,
      isNewRecord: catchItem.isNewRecord,
      biomeName: biome.name,
      timestamp: Date.now()
    };
    this.emit(event);
  }
}

export const liveFeed = new LiveFeedManager();
