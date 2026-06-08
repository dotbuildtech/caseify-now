'use client';
import { useStudio } from '@/context/StudioContext';
import { COLOR_PALETTE } from '@/utils/studio';

export default function ColorTab() {
    const { form, updateForm } = useStudio();

    return (
        <div className="space-y-5">
            <div>
                <h3 className="label-luxe">Background color</h3>
                <div className="mt-2 grid grid-cols-9 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                        <button
                            key={c}
                            onClick={() => updateForm({ bgColor: c, bgImage: null })}
                            style={{ background: c }}
                            className={`aspect-square border ${form.bgColor === c ? 'border-ink ring-2 ring-ink ring-offset-1' : 'border-border'}`}
                            aria-label={c}
                        />
                    ))}
                </div>
                <button
                    onClick={() => updateForm({ bgColor: 'transparent', bgImage: null })}
                    className="mt-2 w-full border border-border bg-background-light px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-text-light hover:border-ink"
                >
                    Clear
                </button>
            </div>

            <div>
                <h3 className="label-luxe">Custom color</h3>
                <div className="mt-2 flex items-center gap-3">
                    <input
                        type="color"
                        value={form.bgColor}
                        onChange={(e) => updateForm({ bgColor: e.target.value, bgImage: null })}
                        className="h-12 w-12 cursor-pointer border border-border"
                    />
                    <input
                        type="text"
                        value={form.bgColor}
                        onChange={(e) => updateForm({ bgColor: e.target.value })}
                        className="input-luxe flex-1"
                    />
                </div>
            </div>
        </div>
    );
}
