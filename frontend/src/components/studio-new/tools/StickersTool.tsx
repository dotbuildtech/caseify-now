'use client';
import { useState } from 'react';
import { useStudioStore } from '@/store/studioStore';
import { STICKER_CATEGORIES, ALL_STICKERS, searchStickers } from '@/lib/stickers';
import type { StickerItem } from '@/types/studio';
import { cn } from '@/lib/utils';
import { Search, Heart } from 'lucide-react';

export default function StickersTool() {
  const addLayer = useStudioStore((s) => s.addLayer);
  const [category, setCategory] = useState('emoji');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('dotbuild_fav_stickers') || '[]'); } catch { return []; }
  });

  const saveFavorites = (ids: string[]) => {
    setFavorites(ids);
    localStorage.setItem('dotbuild_fav_stickers', JSON.stringify(ids));
  };

  const toggleFavorite = (id: string) => {
    saveFavorites(favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id]);
  };

  const handleAdd = (sticker: StickerItem) => {
    addLayer({
      type: 'sticker',
      stickerId: sticker.id,
      emoji: sticker.emoji,
      category: sticker.category,
      color: undefined,
      size: 80,
      opacity: 1,
      rotation: 0,
      x: 50, y: 150,
      width: 80, height: 80,
      visible: true, locked: false, name: sticker.label,
      blendMode: 'normal', flipX: false, flipY: false,
    } as any);
  };

  const stickers = search
    ? searchStickers(search)
    : category === 'favorites'
      ? ALL_STICKERS.filter(s => favorites.includes(s.id))
      : STICKER_CATEGORIES.find(c => c.id === category)?.stickers || [];

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {favorites.length > 0 && (
          <button onClick={() => setCategory('favorites')}
            className={cn('shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all', category === 'favorites' ? 'bg-foreground text-background' : 'bg-accent text-muted-foreground hover:text-foreground')}>
            <Heart className="h-3 w-3" /> Saved
          </button>
        )}
        {STICKER_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={cn('shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all', category === cat.id ? 'bg-foreground text-background' : 'bg-accent text-muted-foreground hover:text-foreground')}>
            <span>{cat.icon}</span> {cat.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stickers..."
          className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs outline-none focus:border-foreground"
        />
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-4 gap-1.5 max-h-[320px] overflow-y-auto">
        {stickers.map((sticker) => {
          const isFav = favorites.includes(sticker.id);
          return (
            <button
              key={sticker.id}
              onClick={() => handleAdd(sticker)}
              className="group relative aspect-square flex items-center justify-center rounded-xl border border-border bg-accent/30 text-2xl shadow-sm transition-all hover:border-foreground hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              title={sticker.label}
            >
              <span className="transition-transform duration-200 group-hover:scale-125">{sticker.emoji}</span>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(sticker.id); }}
                className={cn(
                  'absolute top-1 right-1 p-0.5 rounded-full transition-all opacity-0 group-hover:opacity-100',
                  isFav ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                )}
              >
                <Heart className={cn('h-3 w-3', isFav && 'fill-current')} />
              </button>
            </button>
          );
        })}
        {stickers.length === 0 && (
          <div className="col-span-4 py-8 text-center text-[11px] text-muted-foreground/60">
            {search ? 'No stickers found' : 'No stickers in this category'}
          </div>
        )}
      </div>
    </div>
  );
}
