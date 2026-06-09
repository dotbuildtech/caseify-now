'use client';
import { useStudio } from '@/context/StudioContext';

export default function ImageEditor() {
    const { selectedLayer, updateLayer } = useStudio();

    if (!selectedLayer || selectedLayer.type !== 'image') return null;

    const filters = selectedLayer.filters || { brightness: 100, contrast: 100, saturation: 100, blur: 0 };

    const updateFilter = (key, value) => {
        updateLayer(selectedLayer.id, {
            filters: { ...filters, [key]: Number(value) }
        });
    };

    const controls = [
        { key: 'brightness', label: 'Brightness', min: 0, max: 200, value: filters.brightness ?? 100, unit: '%' },
        { key: 'contrast', label: 'Contrast', min: 0, max: 200, value: filters.contrast ?? 100, unit: '%' },
        { key: 'saturation', label: 'Saturation', min: 0, max: 200, value: filters.saturation ?? 100, unit: '%' },
        { key: 'blur', label: 'Blur', min: 0, max: 20, value: filters.blur ?? 0, unit: 'px' }
    ];

    return (
        <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4 animate-fadeIn">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Image adjustments</p>
            {controls.map((c) => (
                <div key={c.key}>
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-500">{c.label}</label>
                        <span className="text-[10px] tabular-nums text-stone-400">{c.value}{c.unit}</span>
                    </div>
                    <input
                        type="range"
                        min={c.min}
                        max={c.max}
                        step={c.key === 'blur' ? 0.5 : 1}
                        value={c.value}
                        onChange={(e) => updateFilter(c.key, e.target.value)}
                        className="mt-1 w-full accent-stone-900"
                    />
                </div>
            ))}
            <button
                onClick={() => updateLayer(selectedLayer.id, { filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 } })}
                className="w-full rounded-lg border border-stone-200 bg-white py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700"
            >
                Reset filters
            </button>
        </div>
    );
}
