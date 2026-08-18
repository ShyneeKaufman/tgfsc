export const MUTATIONS = {
  normal: {
    id: 'normal',
    name: 'Normal',
    prefix: '',
    multiplier: 1.0,
    chance: 0.70,
    color: '#94a3b8',
    glow: 'none',
    description: 'A standard specimen without abnormalities.'
  },
  shiny: {
    id: 'shiny',
    name: 'Shiny',
    prefix: '✨ Shiny',
    multiplier: 1.8,
    chance: 0.12,
    color: '#38bdf8',
    glow: '0 0 12px rgba(56, 189, 248, 0.8)',
    description: 'Its scales reflect radiant, iridescent colors in the sunlight.'
  },
  golden: {
    id: 'golden',
    name: 'Golden',
    prefix: '👑 Golden',
    multiplier: 3.5,
    chance: 0.07,
    color: '#fbbf24',
    glow: '0 0 16px rgba(251, 191, 36, 0.9)',
    description: 'Coated in pure solid gold luster. Every merchant desires it!'
  },
  albino: {
    id: 'albino',
    name: 'Albino',
    prefix: '⚪ Albino',
    multiplier: 2.2,
    chance: 0.05,
    color: '#f1f5f9',
    glow: '0 0 10px rgba(241, 245, 249, 0.7)',
    description: 'An ultra-rare milky-white specimen with ruby eyes.'
  },
  gigantic: {
    id: 'gigantic',
    name: 'Gigantic',
    prefix: '🐋 Gigantic',
    multiplier: 2.8,
    chance: 0.03,
    color: '#a855f7',
    glow: '0 0 14px rgba(168, 85, 247, 0.8)',
    description: 'An abnormally massive fish that barely fits in your backpack.'
  },
  radioactive: {
    id: 'radioactive',
    name: 'Radioactive',
    prefix: '☢️ Radioactive',
    multiplier: 4.5,
    chance: 0.02,
    color: '#22c55e',
    glow: '0 0 18px rgba(34, 197, 94, 0.95)',
    description: 'Glows with pungent neon green bio-luminescent toxicity.'
  },
  abyssal: {
    id: 'abyssal',
    name: 'Abyssal',
    prefix: '🌌 Abyssal',
    multiplier: 7.0,
    chance: 0.008,
    color: '#ec4899',
    glow: '0 0 22px rgba(236, 72, 153, 1)',
    description: 'An ancient void mutation born in the deepest Mariana trenches.'
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic',
    prefix: '🌠 Cosmic',
    multiplier: 12.0,
    chance: 0.002,
    color: '#818cf8',
    glow: '0 0 25px rgba(129, 140, 248, 1)',
    description: 'Fell from distant stellar nebula clusters. Priceless treasure.'
  }
};

export const RARITIES = {
  common: {
    id: 'common',
    name: 'Common',
    color: '#94a3b8',
    bgGradient: 'linear-gradient(135deg, #1e293b, #334155)',
    borderColor: '#475569',
    dropWeight: 60,
    catchExp: 15
  },
  uncommon: {
    id: 'uncommon',
    name: 'Uncommon',
    color: '#4ade80',
    bgGradient: 'linear-gradient(135deg, #064e3b, #047857)',
    borderColor: '#10b981',
    dropWeight: 25,
    catchExp: 35
  },
  rare: {
    id: 'rare',
    name: 'Rare',
    color: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, #0c4a6e, #0284c7)',
    borderColor: '#38bdf8',
    dropWeight: 10,
    catchExp: 75
  },
  epic: {
    id: 'epic',
    name: 'Epic',
    color: '#c084fc',
    bgGradient: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
    borderColor: '#a855f7',
    dropWeight: 4,
    catchExp: 160
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    color: '#facc15',
    bgGradient: 'linear-gradient(135deg, #713f12, #ca8a04)',
    borderColor: '#eab308',
    dropWeight: 0.9,
    catchExp: 400
  },
  mythic: {
    id: 'mythic',
    name: 'Mythic',
    color: '#f43f5e',
    bgGradient: 'linear-gradient(135deg, #881337, #e11d48)',
    borderColor: '#f43f5e',
    dropWeight: 0.09,
    catchExp: 1000
  },
  abyssal: {
    id: 'abyssal',
    name: 'Abyssal',
    color: '#e879f9',
    bgGradient: 'linear-gradient(135deg, #3b0764, #701a75)',
    borderColor: '#d946ef',
    dropWeight: 0.01,
    catchExp: 2500
  }
};
