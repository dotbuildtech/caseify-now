'use client';
import { Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';

const LayerIcon = ({ type, emoji }) => {
    if (type === 'sticker') return <span className="text-lg">{emoji}</span>;
    if (type === 'image') return <span className="text-xs">🖼</span>;
    return <span className="font-display text-xs">T</span>;
};

const LayerName = ({ layer }) => {
    if (layer.type === 'text') return <span className="truncate">{layer.text || 'Text'}</span>;
    if (layer.type === 'sticker') return <span className="truncate">{layer.emoji} Sticker</span>;
    if (layer.type === 'image') return <span className="truncate">Image layer</span>;
    return null;
};

export default function LayersTab() {
    const { layers, selectedLayerId, setSelectedLayerId, updateLayer, removeLayer, duplicateLayer, moveLayer, clearAll } = useStudio();
    const selected = layers.find((l) => l.id === selectedLayerId);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="label-luxe">Layers · {layers.length}</h3>
                {layers.length > 0 && (
                    <button onClick={clearAll} className="text-[10px] font-medium uppercase tracking-[0.18em] text-error hover:underline">
                        Clear all
                    </button>
                )}
            </div>

            {layers.length === 0 ? (
                <p className="border border-dashed border-border bg-background-light p-6 text-center text-xs text-text-light">
                    No layers yet. Add elements from the other tabs.
                </p>
            ) : (
                <ul className="space-y-1">
                    {[...layers].reverse().map((layer) => (
                        <li
                            key={layer.id}
                            onClick={() => setSelectedLayerId(layer.id)}
                            className={`flex cursor-pointer items-center gap-2 border px-2 py-2 ${selectedLayerId === layer.id ? 'border-ink bg-ink text-cream' : 'border-border bg-background-light hover:border-ink'}`}
                        >
                            <LayerIcon type={layer.type} emoji={layer.emoji} />
                            <div className="flex-1 text-xs">
                                <LayerName layer={layer} />
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }} className="p-1 hover:opacity-70" aria-label="Move up"><ChevronUp className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }} className="p-1 hover:opacity-70" aria-label="Move down"><ChevronDown className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} className="p-1 hover:opacity-70" aria-label="Duplicate"><Copy className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="p-1 hover:opacity-70" aria-label="Delete"><Trash2 className="h-3 w-3" /></button>
                        </li>
                    ))}
                </ul>
            )}

            {selected && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <h3 className="label-luxe">Selected layer</h3>

                    {selected.type === 'text' && (
                        <>
                            <input
                                value={selected.text}
                                onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                                className="input-luxe"
                            />
                            <div>
                                <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Size · {selected.size}px</label>
                                <input type="range" min={16} max={120} value={selected.size} onChange={(e) => updateLayer(selected.id, { size: Number(e.target.value) })} className="mt-1 w-full" />
                            </div>
                            <div>
                                <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Color</label>
                                <input type="color" value={selected.color} onChange={(e) => updateLayer(selected.id, { color: e.target.value })} className="mt-1 h-10 w-full cursor-pointer border border-border" />
                            </div>
                        </>
                    )}

                    {(selected.type === 'sticker' || selected.type === 'image') && (
                        <div>
                            <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Size</label>
                            <input type="range" min={30} max={200} value={selected.size || 60} onChange={(e) => updateLayer(selected.id, { size: Number(e.target.value) })} className="mt-1 w-full" />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Opacity · {Math.round((selected.opacity ?? 1) * 100)}%</label>
                        <input type="range" min={0.1} max={1} step={0.05} value={selected.opacity ?? 1} onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) })} className="mt-1 w-full" />
                    </div>

                    <button onClick={() => removeLayer(selected.id)} className="flex w-full items-center justify-center gap-2 border border-error bg-error/5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-error hover:bg-error hover:text-cream">
                        <Trash2 className="h-3 w-3" /> Delete layer
                    </button>
                </div>
            )}
        </div>
    );
}
