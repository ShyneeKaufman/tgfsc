import { state } from './state.js';
import { tg } from './telegram.js';

class LiveFeedManager {
  constructor() {
    this.listeners = new Set();
    this.lastTimestamp = Date.now() - 60000;
    this.seenCatchIds = new Set();
    this.pollIntervalId = null;

    this.startLiveSync();
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

  async broadcastLocalCatch(catchItem, isPerfect) {
    const user = tg.getUser();
    const biome = state.getCurrentBiome();
    const playerId = user.id ? `tg_${user.id}` : `local_${state.stats.totalCaught}`;
    const playerName = user.firstName || user.username || 'Вы';

    const event = {
      id: `local_${Date.now()}`,
      isLocal: true,
      playerId,
      playerName,
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

    this.seenCatchIds.add(event.id);
    this.emit(event);

    // Send to real global server feed
    try {
      await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          playerName,
          fishName: catchItem.fish.name,
          rarity: catchItem.fish.rarity,
          mutation: catchItem.mutation.name,
          mutationId: catchItem.mutation.id,
          weight: catchItem.weight,
          price: catchItem.price,
          biomeName: biome.name,
          isPerfect
        })
      });
    } catch (err) {
      // Offline fallback, silently ignore
    }
  }

  startLiveSync() {
    const fetchLatestCatches = async () => {
      try {
        const res = await fetch(`/api/feed?since=${this.lastTimestamp}`);
        if (!res.ok) return;

        const data = await res.json();
        const user = tg.getUser();
        const myPlayerId = user.id ? `tg_${user.id}` : null;

        if (data.catches && Array.isArray(data.catches)) {
          for (const item of data.catches) {
            if (this.seenCatchIds.has(item.id)) continue;
            this.seenCatchIds.add(item.id);

            if (item.timestamp > this.lastTimestamp) {
              this.lastTimestamp = item.timestamp;
            }

            // If it's another real player, emit to ticker!
            const isLocal = myPlayerId && item.playerId === myPlayerId;
            if (!isLocal) {
              this.emit({
                id: item.id,
                isLocal: false,
                playerName: item.playerName,
                fishName: item.fishName,
                rarity: item.rarity,
                mutation: item.mutation,
                mutationId: item.mutationId,
                weight: item.weight,
                price: item.price,
                biomeName: item.biomeName,
                timestamp: item.timestamp
              });
            }
          }
        }
      } catch (err) {
        // network silent
      }
    };

    // Poll every 6 seconds for real catches from other players
    this.pollIntervalId = setInterval(fetchLatestCatches, 6000);
    // Initial fetch after 2s
    setTimeout(fetchLatestCatches, 2000);
  }
}

export const liveFeed = new LiveFeedManager();
