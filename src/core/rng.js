import { FISH_DATABASE } from '../data/fish.js';
import { MUTATIONS, RARITIES } from '../data/mutations.js';

export class RNG {
  // Rolls a fish from biome pool based on luck stats
  static rollFish(biomeId, rodLuck = 0, baitLuck = 0) {
    const totalLuck = rodLuck + baitLuck;
    const biomePool = FISH_DATABASE.filter(f => f.biome === biomeId);

    if (biomePool.length === 0) {
      return FISH_DATABASE[0];
    }

    // Calculate effective drop weights with luck modifier
    // Luck gives exponential boost to higher rarities
    const scoredPool = biomePool.map(fish => {
      const rarityDef = RARITIES[fish.rarity] || RARITIES.common;
      let weight = rarityDef.dropWeight;

      if (fish.rarity === 'uncommon') {
        weight *= (1 + totalLuck * 0.015);
      } else if (fish.rarity === 'rare') {
        weight *= (1 + totalLuck * 0.035);
      } else if (fish.rarity === 'epic') {
        weight *= (1 + totalLuck * 0.06);
      } else if (fish.rarity === 'legendary') {
        weight *= (1 + totalLuck * 0.09);
      } else if (fish.rarity === 'mythic' || fish.rarity === 'abyssal') {
        weight *= (1 + totalLuck * 0.12);
      }

      return { fish, weight };
    });

    const totalWeight = scoredPool.reduce((acc, item) => acc + item.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const item of scoredPool) {
      if (rand <= item.weight) {
        return item.fish;
      }
      rand -= item.weight;
    }

    return scoredPool[0].fish;
  }

  // Rolls mutation
  static rollMutation(baitMutationBonus = 0) {
    const roll = Math.random();
    const mutationKeys = Object.keys(MUTATIONS);

    // Cosmic, Abyssal, Radioactive, Gigantic, Golden, Albino, Shiny, Normal
    const sorted = [
      MUTATIONS.cosmic,
      MUTATIONS.abyssal,
      MUTATIONS.radioactive,
      MUTATIONS.gigantic,
      MUTATIONS.golden,
      MUTATIONS.albino,
      MUTATIONS.shiny
    ];

    for (const m of sorted) {
      const effectiveChance = m.chance * (1 + baitMutationBonus);
      if (roll <= effectiveChance) {
        return m;
      }
    }

    return MUTATIONS.normal;
  }

  // Rolls weight with standard distribution between min & max
  static rollWeight(fish, mutation) {
    const min = fish.minWeight;
    const max = fish.maxWeight;
    // Box-Muller normal distribution
    const u1 = Math.max(0.0001, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Scale to range [min, max]
    const mid = (min + max) / 2;
    const spread = (max - min) / 5;
    let weight = mid + z * spread;

    // Clamp
    weight = Math.max(min * 0.9, Math.min(max * 1.35, weight));

    // Mutation weight adjustments
    if (mutation.id === 'gigantic') {
      weight *= 1.8 + Math.random() * 0.6;
    } else if (mutation.id === 'cosmic') {
      weight *= 2.2 + Math.random() * 0.8;
    }

    return Number(weight.toFixed(2));
  }

  // Calculate market price
  static calculatePrice(fish, weight, mutation, rodLuck = 0) {
    const avgWeight = (fish.minWeight + fish.maxWeight) / 2;
    const weightFactor = Math.max(0.6, weight / avgWeight);
    const luckBonus = 1 + (rodLuck / 400);

    const price = fish.basePrice * weightFactor * mutation.multiplier * luckBonus;
    return Math.max(1, Math.round(price));
  }
}
