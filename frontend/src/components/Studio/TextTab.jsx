'use client';
import { useState } from 'react';
import { useStudio } from '@/context/StudioContext';
import { FONTS, COLOR_PALETTE } from '@/utils/studio';

const SAMPLE_TEXTS = ['Your Story', 'Hello World', 'Stay Wild', 'Be Kind', 'Love', 'Breathe', 'Create', '2026'];

export default function TextTab() {
    const { addTextLayer, updateForm } = useStudio();
    const [text, setText] = useState('Your Story');
    const [font, setFont] = useState('serif');
    const [color, setColor] = useState('#0A0A0A');
    const [size, setSize] = useState(48);
    const [uppercase, setUppercase] = useState(true);
    const [bold, setBold] = useState(false);

    const handleAdd = () => {
        if (!text.trim()) return;
        addTextLayer(text);
        updateForm({ text });
    };

    return (
        <div className="space-y-5 animate-fadeIn">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">Quick add</p>
                <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_TEXTS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setText(s)}
                            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-medium text-stone-500 transition-all duration-200 hover:border-stone-400 hover:text-stone-800"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">Custom text</p>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                    placeholder="Type something..."
                    className="input-luxe rounded-xl border-stone-200 bg-stone-50 text-sm focus:border-stone-400 focus:bg-white"
                />
            </div>

            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">Font</p>
                <div className="grid grid-cols-3 gap-2">
                    {FONTS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFont(f.id)}
                            style={{ fontFamily: f.family }}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${font === f.id ? 'border-stone-900 bg-stone-900 text-white shadow-md' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">Color</p>
                <div className="grid grid-cols-9 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            style={{ background: c }}
                            className={`aspect-square rounded-lg border transition-all duration-200 ${color === c ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-2' : 'border-stone-200 hover:scale-110'}`}
                            aria-label={c}
                        />
                    ))}
                </div>
            </div>

            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">Size · {size}px</p>
                <input type="range" min={20} max={120} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-stone-900" />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setUppercase(!uppercase)}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-200 ${uppercase ? 'border-stone-900 bg-stone-900 text-white shadow-md' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
                >
                    AA
                </button>
                <button
                    onClick={() => setBold(!bold)}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-200 ${bold ? 'border-stone-900 bg-stone-900 text-white shadow-md' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
                >
                    B
                </button>
            </div>

            <button
                onClick={handleAdd}
                className="w-full rounded-xl bg-stone-900 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-stone-900/10 transition-all duration-300 hover:bg-stone-800 hover:shadow-xl active:scale-[0.98]"
            >
                Add Text Layer
            </button>
        </div>
    );
}
