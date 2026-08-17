import { state } from './core/state.js';
import { tg } from './core/telegram.js';
import { sound } from './core/sound.js';
import { RNG } from './core/rng.js';
import { RARITIES } from './data/mutations.js';

import { WaterCanvas } from './render/canvas.js';
import { ReelingMinigame } from './render/minigame.js';

import { HUD } from './ui/hud.js';
import { CatchModal } from './ui/catchModal.js';
import { BackpackView } from './ui/backpack.js';
import { ShopView } from './ui/shop.js';
import { FishDexView } from './ui/fishdex.js';
import { MapView } from './ui/map.js';

class GameApp {
  constructor() {
    this.gameState = 'idle'; // 'idle' | 'waiting' | 'bite' | 'reeling'
    this.biteTimeout = null;
    this.missTimeout = null;
    this.pendingCatch = null;

    this.init();
  }

  init() {
    // 1. Setup Canvas
    const canvasEl = document.getElementById('waterCanvas');
    this.canvas = new WaterCanvas(canvasEl);

    // 2. Setup Reeling Minigame
    const minigameContainer = document.getElementById('minigameContainer');
    this.minigame = new ReelingMinigame(
      minigameContainer,
      (fish) => this.handleCatchSuccess(fish),
      (fish) => this.handleCatchFailed(fish)
    );

    // 3. Setup Catch Modal
    const catchModalContainer = document.getElementById('catchModalContainer');
    this.catchModal = new CatchModal(
      catchModalContainer,
      (catchItem) => this.handleKeepFish(catchItem),
      (catchItem) => this.handleSellFish(catchItem)
    );

    // 4. Setup HUD
    const hudContainer = document.getElementById('hudContainer');
    this.hud = new HUD(
      hudContainer,
      () => this.handleCastAction(),
      (tab) => this.handleTabChange(tab)
    );

    // 5. Setup Views Container
    this.viewPanelContainer = document.getElementById('viewPanelContainer');
    this.backpackView = new BackpackView(document.createElement('div'));
    this.shopView = new ShopView(document.createElement('div'));
    this.fishdexView = new FishDexView(document.createElement('div'));
    this.mapView = new MapView(
      document.createElement('div'),
      (biomeId) => this.handleTravelSuccess(biomeId)
    );

    // Start 60fps Loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    // Init sound on first user gesture
    const initAudioOnInteraction = () => {
      sound.init();
      window.removeEventListener('click', initAudioOnInteraction);
      window.removeEventListener('touchstart', initAudioOnInteraction);
    };
    window.addEventListener('click', initAudioOnInteraction);
    window.addEventListener('touchstart', initAudioOnInteraction);
  }

  handleCastAction() {
    sound.ensureContext();

    if (this.gameState === 'idle') {
      this.startCasting();
    } else if (this.gameState === 'waiting') {
      // Cancel cast
      this.cancelCasting();
    } else if (this.gameState === 'bite') {
      // Hook the fish!
      this.hookFish();
    }
  }

  startCasting() {
    this.gameState = 'waiting';
    this.hud.setCastState('waiting');

    sound.playCast();
    tg.impactMedium();
    this.canvas.castBobber();

    const rod = state.getEquippedRod();
    const bait = state.getEquippedBait();

    // Calculate dynamic bite time (1.8s to 4.5s modulated by gear speed)
    const baseWait = 1.8 + Math.random() * 2.7;
    const effectiveWait = Math.max(1.0, baseWait * rod.lureSpeed * bait.speedMultiplier) * 1000;

    this.biteTimeout = setTimeout(() => {
      this.triggerBite();
    }, effectiveWait);
  }

  cancelCasting() {
    if (this.biteTimeout) clearTimeout(this.biteTimeout);
    if (this.missTimeout) clearTimeout(this.missTimeout);

    this.gameState = 'idle';
    this.hud.setCastState('idle');
    this.canvas.retrieveBobber();
    sound.playSplash();
  }

  triggerBite() {
    if (this.gameState !== 'waiting') return;

    this.gameState = 'bite';
    this.hud.setCastState('bite');
    this.canvas.nibbleBobber();

    sound.playBite();
    tg.notificationWarning();

    // Player has 2.4 seconds to react and hook
    this.missTimeout = setTimeout(() => {
      this.handleMissedBite();
    }, 2400);
  }

  handleMissedBite() {
    if (this.gameState !== 'bite') return;

    this.gameState = 'idle';
    this.hud.setCastState('idle', 'УПЛЫЛА! ЗАБРОСИТЬ СНОВА');
    this.canvas.retrieveBobber();
    sound.playSplash();
    tg.notificationError();
  }

  hookFish() {
    if (this.missTimeout) clearTimeout(this.missTimeout);

    const rod = state.getEquippedRod();
    const bait = state.getEquippedBait();

    // Roll fish, mutation, weight, price
    const fish = RNG.rollFish(state.currentBiome, rod.luck, bait.luckBonus);
    const mutation = RNG.rollMutation(bait.mutationBonus);
    const weight = RNG.rollWeight(fish, mutation);
    const price = RNG.calculatePrice(fish, weight, mutation, rod.luck);
    const exp = (RARITIES[fish.rarity] || RARITIES.common).catchExp;

    const previousRecord = state.fishdex[fish.id]?.maxWeight || 0;
    const isNewRecord = weight > previousRecord;

    this.pendingCatch = {
      instanceId: `catch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fish,
      weight,
      mutation,
      price,
      exp,
      isNewRecord,
      timestamp: Date.now()
    };

    // Consume bait
    state.consumeBait();

    // Start Fisch Reeling Minigame
    this.gameState = 'reeling';
    this.hud.setCastState('reeling');
    this.minigame.start(fish, rod);
  }

  handleCatchSuccess(fish) {
    this.gameState = 'idle';
    this.hud.setCastState('idle');
    this.canvas.retrieveBobber();

    if (this.pendingCatch) {
      // Award EXP immediately
      state.addExp(this.pendingCatch.exp);
      // Show spectacular modal
      this.catchModal.show(this.pendingCatch);
    }
  }

  handleCatchFailed(fish) {
    this.gameState = 'idle';
    this.hud.setCastState('idle', 'СОРВАЛАСЬ! ЗАБРОСИТЬ СНОВА');
    this.canvas.retrieveBobber();
    sound.playSplash();
    tg.notificationError();
    this.pendingCatch = null;
  }

  handleKeepFish(catchItem) {
    const success = state.addFish(catchItem);
    if (!success) {
      // Inventory was full, auto sell
      state.addCoins(catchItem.price);
    }
    this.pendingCatch = null;
  }

  handleSellFish(catchItem) {
    state.addCoins(catchItem.price);
    // Still record in FishDex!
    const dex = state.fishdex[catchItem.fish.id] || {
      discovered: true,
      count: 0,
      maxWeight: 0,
      mutations: []
    };
    dex.count += 1;
    dex.maxWeight = Math.max(dex.maxWeight, catchItem.weight);
    if (!dex.mutations.includes(catchItem.mutation.id)) {
      dex.mutations.push(catchItem.mutation.id);
    }
    state.fishdex[catchItem.fish.id] = dex;
    state.stats.totalCaught += 1;
    state.save();

    this.pendingCatch = null;
  }

  handleTabChange(tabName) {
    if (tabName === 'fishing') {
      this.viewPanelContainer.classList.add('hidden');
      this.viewPanelContainer.innerHTML = '';
      return;
    }

    this.viewPanelContainer.innerHTML = '';
    this.viewPanelContainer.classList.remove('hidden');

    if (tabName === 'backpack') {
      this.backpackView.update();
      this.viewPanelContainer.appendChild(this.backpackView.container);
    } else if (tabName === 'shop') {
      this.shopView.update();
      this.viewPanelContainer.appendChild(this.shopView.container);
    } else if (tabName === 'fishdex') {
      this.fishdexView.update();
      this.viewPanelContainer.appendChild(this.fishdexView.container);
    } else if (tabName === 'map') {
      this.mapView.update();
      this.viewPanelContainer.appendChild(this.mapView.container);
    }
  }

  handleTravelSuccess(biomeId) {
    this.hud.setActiveTab('fishing');
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Update canvas water & bobber
    this.canvas.update(dt);
    this.canvas.render();

    // Update minigame physics
    this.minigame.update(dt);

    requestAnimationFrame(this.loop);
  }
}

// Start game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
