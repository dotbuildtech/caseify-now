'use client';
import { useState, useEffect } from 'react';
import { useStudioStore } from '@/store/studioStore';
import ColorPicker from '../shared/ColorPicker';
import Slider from '../shared/Slider';
import { FONTS, POPULAR_FONTS, loadGoogleFonts } from '@/lib/fonts';
import { FONT_CATEGORIES } from '@/lib/constants';
import { FontCategory } from '@/types/studio';
import { cn } from '@/lib/utils';
import { Search, Plus } from 'lucide-react';

const SAMPLE_TEXTS = ['Your Story', 'Stay Wild', 'Be Kind', 'Love', 'Create', 'Dream', 'Luminous', 'Eternal', 'Radiant', 'Fearless'];

export default function TextTool() {
  const addLayer = useStudioStore((s) => s.addLayer);
  const [text, setText] = useState('Your Story');
  const [fontFamily, setFontFamily] = useState('inter');
  const [fontSize, setFontSize] = useState(48);
  const [fontWeight, setFontWeight] = useState(500);
  const [color, setColor] = useState('#0A0A0A');
  const [uppercase, setUppercase] = useState(true);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategory, setFontCategory] = useState<FontCategory | 'all' | 'popular'>('popular');

  useEffect(() => {
    const font = FONTS.find(f => f.id === fontFamily);
    if (font) loadGoogleFonts([font.family]);
  }, []);

  const filteredFonts = fontCategory === 'popular'
    ? POPULAR_FONTS.filter(f => f.family.toLowerCase().includes(fontSearch.toLowerCase()))
    : FONTS.filter(f => {
        const matchCat = fontCategory === 'all' || f.category === fontCategory;
        return matchCat && f.family.toLowerCase().includes(fontSearch.toLowerCase());
      });

  const handleAdd = () => {
    if (!text.trim()) return;
    addLayer({
      type: 'text',
      text,
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight: 1.2,
      color,
      uppercase,
      alignment,
      opacity: 1,
      rotation: 0,
      x: 50, y: 150,
      width: 200, height: 60,
      visible: true, locked: false, name: text.slice(0, 20),
      blendMode: 'normal', flipX: false, flipY: false,
      curved: false, curveRadius: 0,
      stroke: undefined, shadow: undefined, gradient: undefined,
    } as any);
  };

  const loadFont = (fontId: string) => {
    setFontFamily(fontId);
    const font = FONTS.find(f => f.id === fontId);
    if (font) loadGoogleFonts([font.family]);
  };

  return (
    <div className="space-y-4">
      {/* Quick text presets */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick add</h4>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_TEXTS.map((t) => (
            <button key={t} onClick={() => setText(t)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-all hover:border-foreground hover:text-foreground">
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Text input */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Custom text</h4>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Type your text..."
          className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
        />
      </div>

      {/* Font search */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Font</h4>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={fontSearch}
            onChange={(e) => setFontSearch(e.target.value)}
            placeholder="Search 70+ fonts..."
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs outline-none focus:border-foreground"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none mb-1.5">
          <button onClick={() => setFontCategory('popular')} className={cn('shrink-0 px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all', fontCategory === 'popular' ? 'bg-foreground text-background' : 'bg-accent text-muted-foreground hover:text-foreground')}>Popular</button>
          {FONT_CATEGORIES.filter(c => c.id !== 'popular').map((cat) => (
            <button key={cat.id} onClick={() => setFontCategory(cat.id as FontCategory)} className={cn('shrink-0 px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all', fontCategory === cat.id ? 'bg-foreground text-background' : 'bg-accent text-muted-foreground hover:text-foreground')}>
              {cat.name}
            </button>
          ))}
        </div>
        <div className="max-h-[140px] overflow-y-auto space-y-0.5 rounded-lg border border-border p-1">
          {filteredFonts.map((font) => (
            <button
              key={font.id}
              onClick={() => loadFont(font.id)}
              className={cn('w-full text-left px-3 py-2 rounded-md text-sm transition-all', fontFamily === font.id ? 'bg-foreground text-background' : 'hover:bg-accent')}
              style={{ fontFamily: font.family }}
            >
              {font.family}
            </button>
          ))}
        </div>
      </div>

      {/* Size & Weight */}
      <div className="grid grid-cols-2 gap-2">
        <Slider label="Size" value={fontSize} min={8} max={200} suffix="px" onChange={setFontSize} />
        <Slider label="Weight" value={fontWeight} min={100} max={900} step={100} onChange={setFontWeight} />
      </div>

      {/* Color */}
      <ColorPicker label="Color" value={color} onChange={setColor} />

      {/* Spacing */}
      <Slider label="Letter Spacing" value={letterSpacing} min={-5} max={20} step={0.5} suffix="px" onChange={setLetterSpacing} />

      {/* Alignment */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Alignment</h4>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button key={a} onClick={() => setAlignment(a)}
              className={cn('flex-1 h-8 rounded-lg border text-[10px] font-medium uppercase transition-all', alignment === a ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground')}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Case toggle */}
      <div className="flex gap-2">
        <button onClick={() => setUppercase(!uppercase)}
          className={cn('flex-1 h-8 rounded-lg border text-[10px] font-semibold uppercase tracking-wider transition-all', uppercase ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground')}>
          AA
        </button>
      </div>

      {/* Add button */}
      <button onClick={handleAdd}
        className="w-full h-10 rounded-xl bg-foreground text-background text-xs font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <Plus className="h-3.5 w-3.5" /> Add Text Layer
      </button>
    </div>
  );
}
