import {
  createElement,
  Fish,
  Waves,
  Compass,
  ShoppingBag,
  Store,
  BookOpen,
  Map,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Gift,
  UserPlus,
  Flame,
  Zap,
  Crosshair,
  ChevronRight,
  X,
  Copy,
  Send,
  Check,
  Gem,
  Coins,
  Anchor,
  Palmtree,
  Eye,
  Shield,
  Activity,
  Info,
  Lock,
  RotateCcw,
  Sparkle
} from 'lucide';

const ICONS = {
  fish: Fish,
  waves: Waves,
  compass: Compass,
  bag: ShoppingBag,
  store: Store,
  book: BookOpen,
  map: Map,
  sparkles: Sparkles,
  sparkle: Sparkle,
  trophy: Trophy,
  users: Users,
  volume: Volume2,
  mute: VolumeX,
  gift: Gift,
  userPlus: UserPlus,
  flame: Flame,
  zap: Zap,
  crosshair: Crosshair,
  chevronRight: ChevronRight,
  close: X,
  copy: Copy,
  send: Send,
  check: Check,
  gem: Gem,
  coins: Coins,
  anchor: Anchor,
  palmtree: Palmtree,
  eye: Eye,
  shield: Shield,
  activity: Activity,
  info: Info,
  lock: Lock,
  rotate: RotateCcw
};

export function getIconSvg(name, size = 18, className = '', extraAttrs = {}) {
  const iconDef = ICONS[name] || ICONS.fish;
  const svgEl = createElement(iconDef, {
    width: size,
    height: size,
    class: `lucide-icon lucide-${name} ${className}`.trim(),
    'stroke-width': 2,
    ...extraAttrs
  });
  return svgEl.outerHTML;
}

export { ICONS };
