export const BAITS = [
  {
    id: 'none',
    name: 'Без наживки',
    iconKey: 'crosshair',
    price: 0,
    amount: 999999,
    luckBonus: 0,
    speedMultiplier: 1.0,
    mutationBonus: 0,
    preferredBiome: null,
    description: 'Голый крючок. Клевать будет дольше, а рыба чаще обычная.'
  },
  {
    id: 'worm',
    name: 'Дождевой червь',
    iconKey: 'activity',
    price: 50,
    amount: 15,
    luckBonus: 10,
    speedMultiplier: 0.8,
    mutationBonus: 0.05,
    preferredBiome: 'coast',
    description: 'Классическая наживка. Ускоряет поклевку на 20%.'
  },
  {
    id: 'glow_shrimp',
    name: 'Светящаяся креветка',
    iconKey: 'sparkles',
    price: 220,
    amount: 10,
    luckBonus: 30,
    speedMultiplier: 0.65,
    mutationBonus: 0.15,
    preferredBiome: 'reef',
    description: 'Мерцает в толще воды. Значительно привлекает редких рыб.'
  },
  {
    id: 'bioluminescent_squid',
    name: 'Глубинный кальмар',
    iconKey: 'eye',
    price: 750,
    amount: 8,
    luckBonus: 65,
    speedMultiplier: 0.5,
    mutationBonus: 0.35,
    preferredBiome: 'abyss',
    description: 'Любимое лакомство глубоководных чудовищ и абиссальных рыб.'
  },
  {
    id: 'magma_crab',
    name: 'Лавовый краб',
    iconKey: 'flame',
    price: 1800,
    amount: 6,
    luckBonus: 95,
    speedMultiplier: 0.4,
    mutationBonus: 0.50,
    preferredBiome: 'caldera',
    description: 'Жаропрочный панцирь. Необходим для ловли лавовых левиафанов.'
  },
  {
    id: 'golden_fly',
    name: 'Золотая стрекоза',
    iconKey: 'trophy',
    price: 5000,
    amount: 5,
    luckBonus: 150,
    speedMultiplier: 0.3,
    mutationBonus: 0.80,
    preferredBiome: null,
    description: 'Легендарная приманка. Огромный шанс поймать Золотую или Космическую мутацию.'
  }
];
