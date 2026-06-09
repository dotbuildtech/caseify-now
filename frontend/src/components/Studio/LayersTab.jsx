'use client';
import { Trash2, Copy, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import ImageEditor from './ImageEditor';

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
    const { layers, selectedLayerId, setSelectedLayerId, selectedLayer, updateLayer, removeLayer, duplicateLayer, moveLayer, clearAll } = useStudio();

    return (
        <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Layers · {layers.length}</p>
                {layers.length > 0 && (
                    <button onClick={clearAll} className="text-[10px] font-medium uppercase tracking-[0.15em] text-red-500 hover:text-red-600">
                        Clear all
                    </button>
                )}
            </div>

            {layers.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-6 text-center">
                    <p className="text-[11px] text-stone-400">No layers yet. Add elements from the other tabs.</p>
                </div>
            ) : (
                <ul className="space-y-1">
                    {[...layers].reverse().map((layer) => (
                        <li
                            key={layer.id}
                            onClick={() => setSelectedLayerId(layer.id)}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${selectedLayerId === layer.id ? 'border-stone-900 bg-stone-900 text-white shadow-md' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'}`}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { opacity: (layer.opacity ?? 1) === 0 ? 1 : 0 }); }}
                                className={`p-1 rounded transition-colors ${selectedLayerId === layer.id ? 'hover:bg-white/20' : 'hover:bg-stone-100'}`}
                                aria-label="Toggle visibility"
                            >
                                {(layer.opacity ?? 1) === 0 ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                            <LayerIcon type={layer.type} emoji={layer.emoji} />
                            <div className="flex-1 min-w-0 text-xs">
                                <LayerName layer={layer} />
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }} className={`p-1 rounded transition-colors ${selectedLayerId === layer.id ? 'hover:bg-white/20' : 'hover:bg-stone-100'}`} aria-label="Move up"><ChevronUp className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }} className={`p-1 rounded transition-colors ${selectedLayerId === layer.id ? 'hover:bg-white/20' : 'hover:bg-stone-100'}`} aria-label="Move down"><ChevronDown className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} className={`p-1 rounded transition-colors ${selectedLayerId === layer.id ? 'hover:bg-white/20' : 'hover:bg-stone-100'}`} aria-label="Duplicate"><Copy className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className={`p-1 rounded transition-colors ${selectedLayerId === layer.id ? 'hover:bg-white/20' : 'hover:bg-red-300'}`} aria-label="Delete"><Trash2 className="h-3 w-3" /></button>
                        </li>
                    ))}
                </ul>
            )}

            {selectedLayer && (
                <div className="mt-4 space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Selected layer</p>

                    {selectedLayer.type === 'text' && (
                        <>
                            <input
                                value={selectedLayer.text}
                                onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                                className="input-luxe rounded-xl border-stone-200 bg-white text-sm focus:border-stone-400"
                            />
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">Size · {selectedLayer.size}px</label>
                                <input type="range" min={16} max={120} value={selectedLayer.size} onChange={(e) => updateLayer(selectedLayer.id, { size: Number(e.target.value) })} className="mt-1 w-full accent-stone-900" />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">Color</label>
                                <input type="color" value={selectedLayer.color} onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })} className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-stone-200" />
                            </div>
                        </>
                    )}

                    {selectedLayer.type === 'sticker' && (
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">Size · {selectedLayer.size || 60}px</label>
                            <input type="range" min={30} max={200} value={selectedLayer.size || 60} onChange={(e) => updateLayer(selectedLayer.id, { size: Number(e.target.value) })} className="mt-1 w-full accent-stone-900" />
                        </div>
                    )}

                    {selectedLayer.type === 'image' && (
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">Size · {Math.round((selectedLayer.scale || 1) * 100)}%</label>
                            <input type="range" min={0.3} max={3} step={0.05} value={selectedLayer.scale || 1} onChange={(e) => updateLayer(selectedLayer.id, { scale: Number(e.target.value) })} className="mt-1 w-full accent-stone-900" />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">Opacity · {Math.round((selectedLayer.opacity ?? 1) * 100)}%</label>
                        <input type="range" min={0} max={1} step={0.05} value={selectedLayer.opacity ?? 1} onChange={(e) => updateLayer(selectedLayer.id, { opacity: Number(e.target.value) })} className="mt-1 w-full accent-stone-900" />
                    </div>

                    <button onClick={() => removeLayer(selectedLayer.id)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-red-500 transition-all duration-200 hover:bg-red-500 hover:text-white">
                        <Trash2 className="h-3 w-3" /> Delete layer
                    </button>
                </div>
            )}

            <ImageEditor />
        </div>
    );
}
