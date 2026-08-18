import { sound } from './sound.js';
import { tg } from './telegram.js';

export const GLOBAL_EVENTS = [
  {
    id: 'golden_hour',
    title: 'ЗОЛОТОЙ ЧАС',
    iconKey: 'sparkles',
    desc: '+50% к цене всей рыбы и +15 к Удаче',
    luckBonus: 15,
    priceMultiplier: 1.5,
    expMultiplier: 1.0,
    mutationBonus: 0,
    durationMs: 180000, // 3 mins
    color: '#f59e0b'
  },
  {
    id: 'abyssal_storm',
    title: 'ШТОРМ БЕЗДНЫ',
    iconKey: 'zap',
    desc: 'Шанс редких мутаций увеличен в 2.5 раза',
    luckBonus: 25,
    priceMultiplier: 1.2,
    expMultiplier: 1.2,
    mutationBonus: 40,
    durationMs: 180000,
    color: '#c084fc'
  },
  {
    id: 'aurora_blessing',
    title: 'СИЯНИЕ АВРОРЫ',
    iconKey: 'sparkle',
    desc: '+100% к опыту и мгновенная поклевка',
    luckBonus: 10,
    priceMultiplier: 1.0,
    expMultiplier: 2.0,
    mutationBonus: 15,
    durationMs: 180000,
    color: '#22d3ee'
  },
  {
    id: 'caldera_surge',
    title: 'ВУЛКАНИЧЕСКИЙ ВСПЛЕСК',
    iconKey: 'flame',
    desc: 'Легендарные рыбы поднялись из глубин',
    luckBonus: 35,
    priceMultiplier: 1.4,
    expMultiplier: 1.5,
    mutationBonus: 25,
    durationMs: 180000,
    color: '#f43f5e'
  }
];

class EventManager {
  constructor() {
    this.currentEvent = null;
    this.remainingTime = 0;
    this.listeners = new Set();

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

  startCycle() {
    // Start an event every 2 to 4 minutes
    const triggerRandomEvent = () => {
      const randomEvent = GLOBAL_EVENTS[Math.floor(Math.random() * GLOBAL_EVENTS.length)];
      this.currentEvent = randomEvent;
      this.remainingTime = Math.round(randomEvent.durationMs / 1000);

      sound.playCatchFanfare();
      tg.notificationSuccess();
      this.notify();

      const timerInterval = setInterval(() => {
        this.remainingTime -= 1;
        this.notify();
        if (this.remainingTime <= 0) {
          clearInterval(timerInterval);
          this.currentEvent = null;
          this.notify();

          // Schedule next event in 45-90 seconds
          const nextDelay = 45000 + Math.random() * 45000;
          setTimeout(triggerRandomEvent, nextDelay);
        }
      }, 1000);
    };

    // First event after 15 seconds of play
    setTimeout(triggerRandomEvent, 15000);
  }
}

export const events = new EventManager();
