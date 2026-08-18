import { sound } from './sound.js';
import { tg } from './telegram.js';

export const GLOBAL_EVENTS = [
  {
    id: 'golden_hour',
    title: 'GOLDEN HOUR',
    iconKey: 'sparkles',
    desc: '+50% fish sell price & +15 Luck',
    luckBonus: 15,
    priceMultiplier: 1.5,
    expMultiplier: 1.0,
    mutationBonus: 0,
    durationMs: 180000, // 3 mins
    color: '#f59e0b'
  },
  {
    id: 'abyssal_storm',
    title: 'ABYSSAL STORM',
    iconKey: 'zap',
    desc: 'Mutation rates increased by 2.5x & +25 Luck',
    luckBonus: 25,
    priceMultiplier: 1.2,
    expMultiplier: 1.2,
    mutationBonus: 40,
    durationMs: 180000,
    color: '#c084fc'
  },
  {
    id: 'aurora_blessing',
    title: 'AURORA BLESSING',
    iconKey: 'sparkle',
    desc: '+100% EXP & rapid fish bite attraction',
    luckBonus: 10,
    priceMultiplier: 1.0,
    expMultiplier: 2.0,
    mutationBonus: 15,
    durationMs: 180000,
    color: '#22d3ee'
  },
  {
    id: 'caldera_surge',
    title: 'CALDERA SURGE',
    iconKey: 'flame',
    desc: 'Mythical and apex titans surfaced from the depths',
    luckBonus: 35,
    priceMultiplier: 1.4,
    expMultiplier: 1.5,
    mutationBonus: 25,
    durationMs: 180000,
    color: '#f43f5e'
  }
];

export const EVENT_PRESETS = {
  abyssal_storm: GLOBAL_EVENTS.find(e => e.id === 'abyssal_storm'),
  golden_hour: GLOBAL_EVENTS.find(e => e.id === 'golden_hour'),
  aurora_blessing: GLOBAL_EVENTS.find(e => e.id === 'aurora_blessing'),
  caldera_surge: GLOBAL_EVENTS.find(e => e.id === 'caldera_surge')
};

class EventManager {
  constructor() {
    this.currentEvent = null;
    this.remainingTime = 0;
    this.listeners = new Set();
    this.timerInterval = null;

    this.startCycle();
  }

  getCurrentEvent() {
    return this.currentEvent;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      try {
        fn(this.currentEvent, this.remainingTime);
      } catch (e) {
        console.error('EventManager listener error', e);
      }
    }
  }

  triggerEvent(eventObj) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.currentEvent = eventObj;
    this.remainingTime = Math.round(eventObj.durationMs / 1000);
    this.notify();

    this.timerInterval = setInterval(() => {
      this.remainingTime -= 1;
      this.notify();
      if (this.remainingTime <= 0) {
        clearInterval(this.timerInterval);
        this.currentEvent = null;
        this.notify();
      }
    }, 1000);
  }

  clearEvent() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.currentEvent = null;
    this.remainingTime = 0;
    this.notify();
  }

  startCycle() {
    const triggerRandomEvent = () => {
      const randomEvent = GLOBAL_EVENTS[Math.floor(Math.random() * GLOBAL_EVENTS.length)];
      this.triggerEvent(randomEvent);

      sound.playCatchFanfare();
      tg.notificationSuccess();

      const nextDelay = randomEvent.durationMs + 45000 + Math.random() * 45000;
      setTimeout(triggerRandomEvent, nextDelay);
    };

    setTimeout(triggerRandomEvent, 25000);
  }
}

export const events = new EventManager();
