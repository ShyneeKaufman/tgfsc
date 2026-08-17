export const BIOMES = [
  {
    id: 'coast',
    name: 'Лазурная Бухта',
    icon: '🏝️',
    requiredLevel: 1,
    travelCost: 0,
    waterColor: '#0ea5e9',
    deepWaterColor: '#0284c7',
    skyGradient: ['#0f172a', '#1e293b', '#0369a1'],
    particles: 'bubble',
    description: 'Спокойные прибрежные воды, полные окуней, тунцов и ракушек.',
    lore: 'Идеальное место для новичков и спокойной медитативной рыбалки.'
  },
  {
    id: 'reef',
    name: 'Затонувший Риф',
    icon: '🪸',
    requiredLevel: 5,
    travelCost: 200,
    waterColor: '#06b6d4',
    deepWaterColor: '#0e7490',
    skyGradient: ['#042f2e', '#115e59', '#0d9488'],
    particles: 'plankton',
    description: 'Пестрые кораллы, морские коньки и мурены. Вода прозрачна как стекло.',
    lore: 'Остатки древнего затонувшего флота, обросшие кораллами.'
  },
  {
    id: 'abyss',
    name: 'Марианская Бездна',
    icon: '🌌',
    requiredLevel: 12,
    travelCost: 1500,
    waterColor: '#8b5cf6',
    deepWaterColor: '#4c1d95',
    skyGradient: ['#020617', '#0f172a', '#3b0764'],
    particles: 'void',
    description: 'Глубины без единого луча солнца. Рыбы с собственными фонарями и клыками.',
    lore: 'Давление здесь сокрушает сталь, а из тьмы наблюдают колоссальные тени.'
  },
  {
    id: 'caldera',
    name: 'Лавовая Кальдера',
    icon: '🌋',
    requiredLevel: 20,
    travelCost: 5000,
    waterColor: '#f97316',
    deepWaterColor: '#c2410c',
    skyGradient: ['#450a0a', '#7f1d1d', '#991b1b'],
    particles: 'ember',
    description: 'Кипящая вулканическая магма. Рыбы плавают в раскаленном базальте.',
    lore: 'Жар испаряет обычную леску. Только закаленные рыбаки осмелятся ступить сюда.'
  }
];
