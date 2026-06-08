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
        <div className="space-y-5">
            <div>
                <h3 className="label-luxe">Quick add</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {SAMPLE_TEXTS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setText(s)}
                            className="border border-border bg-background-light px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light hover:border-ink hover:text-ink"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="label-luxe">Custom text</h3>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type something..."
                    className="input-luxe mt-2"
                />
            </div>

            <div>
                <h3 className="label-luxe">Font</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                    {FONTS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFont(f.id)}
                            style={{ fontFamily: f.family }}
                            className={`border px-3 py-2 text-sm ${font === f.id ? 'border-ink bg-ink text-cream' : 'border-border hover:border-ink'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="label-luxe">Color</h3>
                <div className="mt-2 grid grid-cols-9 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            style={{ background: c }}
                            className={`aspect-square border ${color === c ? 'border-ink ring-2 ring-ink ring-offset-1' : 'border-border'}`}
                            aria-label={c}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="label-luxe">Size · {size}px</h3>
                <input type="range" min={20} max={120} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-2 w-full" />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setUppercase(!uppercase)}
                    className={`flex-1 border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] ${uppercase ? 'border-ink bg-ink text-cream' : 'border-border'}`}
                >
                    AA
                </button>
                <button
                    onClick={() => setBold(!bold)}
                    className={`flex-1 border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${bold ? 'border-ink bg-ink text-cream' : 'border-border'}`}
                >
                    B
                </button>
            </div>

            <button
                onClick={handleAdd}
                className="btn-primary w-full"
            >
                Add Text Layer
            </button>
        </div>
    );
}
