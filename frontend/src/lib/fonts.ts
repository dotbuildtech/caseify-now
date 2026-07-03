import type { FontItem } from '@/types/studio';

export const FONTS: FontItem[] = [
  { id: 'inter', family: 'Inter', category: 'sans', variants: ['100','200','300','400','500','600','700','800','900'], popular: true },
  { id: 'poppins', family: 'Poppins', category: 'sans', variants: ['100','200','300','400','500','600','700','800','900'], popular: true },
  { id: 'roboto', family: 'Roboto', category: 'sans', variants: ['100','300','400','500','700','900'], popular: true },
  { id: 'opensans', family: 'Open Sans', category: 'sans', variants: ['300','400','500','600','700','800'], popular: true },
  { id: 'montserrat', family: 'Montserrat', category: 'sans', variants: ['100','200','300','400','500','600','700','800','900'], popular: true },
  { id: 'lato', family: 'Lato', category: 'sans', variants: ['100','300','400','700','900'], popular: true },
  { id: 'nunito', family: 'Nunito', category: 'sans', variants: ['200','300','400','500','600','700','800','900'], popular: true },
  { id: 'raleway', family: 'Raleway', category: 'sans', variants: ['100','200','300','400','500','600','700','800','900'], popular: true },
  { id: 'notosans', family: 'Noto Sans', category: 'sans', variants: ['100','200','300','400','500','600','700','800','900'], popular: true },
  { id: 'ubuntu', family: 'Ubuntu', category: 'sans', variants: ['300','400','500','700'], popular: true },
  { id: 'merriweather', family: 'Merriweather', category: 'serif', variants: ['300','400','700','900'], popular: true },
  { id: 'playfair', family: 'Playfair Display', category: 'serif', variants: ['400','500','600','700','800','900'], popular: true },
  { id: 'lora', family: 'Lora', category: 'serif', variants: ['400','500','600','700'], popular: true },
  { id: 'cormorant', family: 'Cormorant Garamond', category: 'serif', variants: ['300','400','500','600','700'], popular: true },
  { id: 'times-new-roman', family: 'Times New Roman', category: 'serif', variants: ['400','700'], popular: true },
  { id: 'georgia', family: 'Georgia', category: 'serif', variants: ['400','700'], popular: true },
  { id: 'palatino', family: 'Palatino Linotype', category: 'serif', variants: ['400','700'], popular: true },
  { id: 'dancing-script', family: 'Dancing Script', category: 'handwriting', variants: ['400','500','600','700'], popular: true },
  { id: 'caveat', family: 'Caveat', category: 'handwriting', variants: ['400','500','600','700'], popular: true },
  { id: 'great-vibes', family: 'Great Vibes', category: 'handwriting', variants: ['400'], popular: true },
  { id: 'pacifico', family: 'Pacifico', category: 'handwriting', variants: ['400'], popular: true },
  { id: 'satisfy', family: 'Satisfy', category: 'handwriting', variants: ['400'], popular: true },
  { id: 'indie-flower', family: 'Indie Flower', category: 'handwriting', variants: ['400'], popular: false },
  { id: 'permanent-marker', family: 'Permanent Marker', category: 'handwriting', variants: ['400'], popular: true },
  { id: 'oswald', family: 'Oswald', category: 'display', variants: ['200','300','400','500','600','700'], popular: true },
  { id: 'bebas', family: 'Bebas Neue', category: 'display', variants: ['400'], popular: true },
  { id: 'anton', family: 'Anton', category: 'display', variants: ['400'], popular: true },
  { id: 'impact', family: 'Impact', category: 'display', variants: ['400'], popular: true },
  { id: 'fraunces', family: 'Fraunces', category: 'display', variants: ['100','200','300','400','500','600','700','800','900'], popular: false },
  { id: 'jetbrains-mono', family: 'JetBrains Mono', category: 'mono', variants: ['100','200','300','400','500','600','700','800'], popular: true },
  { id: 'fira-code', family: 'Fira Code', category: 'mono', variants: ['300','400','500','600','700'], popular: true },
  { id: 'space-mono', family: 'Space Mono', category: 'mono', variants: ['400','700'], popular: false },
  { id: 'source-code-pro', family: 'Source Code Pro', category: 'mono', variants: ['200','300','400','500','600','700','800','900'], popular: false },
  { id: 'dm-sans', family: 'DM Sans', category: 'modern', variants: ['400','500','700'], popular: true },
  { id: 'jakarta', family: 'Plus Jakarta Sans', category: 'modern', variants: ['200','300','400','500','600','700','800'], popular: true },
  { id: 'manrope', family: 'Manrope', category: 'modern', variants: ['200','300','400','500','600','700','800'], popular: true },
  { id: 'clash-display', family: 'Clash Display', category: 'modern', variants: ['200','300','400','500','600','700'], popular: false },
  { id: 'press-start', family: 'Press Start 2P', category: 'gaming', variants: ['400'], popular: false },
  { id: 'orbitron', family: 'Orbitron', category: 'gaming', variants: ['400','500','600','700','800','900'], popular: false },
  { id: 'audiowide', family: 'Audiowide', category: 'gaming', variants: ['400'], popular: false },
  { id: 'monoton', family: 'Monoton', category: 'gaming', variants: ['400'], popular: false },
  { id: 'cormorant-sc', family: 'Cormorant SC', category: 'luxury', variants: ['300','400','500','600','700'], popular: false },
  { id: 'baskerville', family: 'Libre Baskerville', category: 'luxury', variants: ['400','700'], popular: false },
  { id: 'cinzel', family: 'Cinzel', category: 'luxury', variants: ['400','500','600','700','800','900'], popular: false },
  { id: 'tangerine', family: 'Tangerine', category: 'luxury', variants: ['400','700'], popular: false },
  { id: 'rubik-glitch', family: 'Rubik Glitch', category: 'neon', variants: ['400'], popular: false },
  { id: 'rubik-moonrocks', family: 'Rubik Moonrocks', category: 'neon', variants: ['400'], popular: false },
  { id: 'major-mono', family: 'Major Mono Display', category: 'neon', variants: ['400'], popular: false },
  { id: 'helvetica-neue', family: 'Helvetica Neue', category: 'minimal', variants: ['100','300','400','500','700','900'], popular: true },
  { id: 'proxima-nova', family: 'Proxima Nova', category: 'minimal', variants: ['300','400','500','600','700','800'], popular: false },
  { id: 'avenir', family: 'Avenir', category: 'minimal', variants: ['300','400','500','600','700','900'], popular: false },
  { id: 'gotham', family: 'Gotham', category: 'minimal', variants: ['100','300','400','500','700','900'], popular: false },
  { id: 'century-gothic', family: 'Century Gothic', category: 'minimal', variants: ['400','700'], popular: false },
  { id: 'futura', family: 'Futura', category: 'minimal', variants: ['400','700'], popular: false },
  { id: 'trebuchet', family: 'Trebuchet MS', category: 'minimal', variants: ['400','700'], popular: false },
  { id: 'avenir-next', family: 'Avenir Next', category: 'minimal', variants: ['400','500','600','700'], popular: false },
];

export const FONTS_BY_CATEGORY = FONTS.reduce<Record<string, FontItem[]>>((acc, font) => {
  if (!acc[font.category]) acc[font.category] = [];
  acc[font.category].push(font);
  return acc;
}, {});

export const POPULAR_FONTS = FONTS.filter(f => f.popular);

export const FONT_LIST_GOOGLE = FONTS.filter(f => !['times-new-roman','georgia','palatino','impact','helvetica-neue','proxima-nova','avenir','gotham','century-gothic','futura','trebuchet','avenir-next','clash-display'].includes(f.id)).map(f => f.family);

export function loadGoogleFonts(fonts: string[]) {
  const families = fonts.filter(f => FONT_LIST_GOOGLE.includes(f));
  if (families.length === 0) return;
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f.replace(/ /g, '+')}:wght@100;200;300;400;500;600;700;800;900`).join('&')}&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

export function getFontFamilyCSS(id: string): string {
  const font = FONTS.find(f => f.id === id);
  return font?.family || 'Inter';
}
