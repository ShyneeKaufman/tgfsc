export const RODS = [
  {
    id: 'starter_rod',
    name: 'Бамбуковая удочка',
    icon: '🎋',
    price: 0,
    pearlPrice: 0,
    requiredLevel: 1,
    luck: 0,
    lureSpeed: 1.0,      // bite time multiplier (lower = faster)
    resilience: 1.0,     // sweetspot control responsiveness
    barSize: 0.22,       // size of sweetspot (0.1 to 0.45)
    maxWeight: 25.0,     // kg
    description: 'Простая самодельная удочка. Хватит для карасей у берега.'
  },
  {
    id: 'reinforced_rod',
    name: 'Усиленный спиннинг',
    icon: '🎣',
    price: 350,
    pearlPrice: 0,
    requiredLevel: 3,
    luck: 12,
    lureSpeed: 0.85,
    resilience: 1.15,
    barSize: 0.25,
    maxWeight: 65.0,
    description: 'Упругий фиберглассовый бланк. Рыба клюет быстрее и надежнее.'
  },
  {
    id: 'carbon_rod',
    name: 'Карбоновый жезл',
    icon: '⚡',
    price: 1200,
    pearlPrice: 0,
    requiredLevel: 6,
    luck: 25,
    lureSpeed: 0.70,
    resilience: 1.30,
    barSize: 0.28,
    maxWeight: 180.0,
    description: 'Сверхлегкий углепластик. Позволяет легко удерживать юркую рыбу.'
  },
  {
    id: 'magnetic_rod',
    name: 'Магнитный траулер',
    icon: '🧲',
    price: 3500,
    pearlPrice: 15,
    requiredLevel: 10,
    luck: 45,
    lureSpeed: 0.60,
    resilience: 1.45,
    barSize: 0.30,
    maxWeight: 450.0,
    description: 'Притягивает сокровища и редчайшие мутации со дна океана.'
  },
  {
    id: 'magma_rod',
    name: 'Вулканический бур',
    icon: '🔥',
    price: 8500,
    pearlPrice: 40,
    requiredLevel: 15,
    luck: 70,
    lureSpeed: 0.50,
    resilience: 1.65,
    barSize: 0.32,
    maxWeight: 1200.0,
    description: 'Выкована в жерле вулкана. Выдерживает лавовых хищников и титанов.'
  },
  {
    id: 'midas_rod',
    name: 'Жезл Царя Мидаса',
    icon: '👑',
    price: 25000,
    pearlPrice: 100,
    requiredLevel: 20,
    luck: 110,
    lureSpeed: 0.40,
    resilience: 1.85,
    barSize: 0.35,
    maxWeight: 3500.0,
    description: 'Каждое прикосновение увеличивает шанс поймать Золотую или Сияющую рыбу.'
  },
  {
    id: 'abyssal_rod',
    name: 'Глубинный Левиафан',
    icon: '🌌',
    price: 75000,
    pearlPrice: 250,
    requiredLevel: 25,
    luck: 160,
    lureSpeed: 0.30,
    resilience: 2.10,
    barSize: 0.38,
    maxWeight: 10000.0,
    description: 'Сплетена из щупалец Кракена и темной материи Бездны.'
  }
];
