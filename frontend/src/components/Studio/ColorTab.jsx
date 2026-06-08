'use client';
import { useStudio } from '@/context/StudioContext';
import { COLOR_PALETTE } from '@/utils/studio';

export default function ColorTab() {
    const { form, updateForm } = useStudio();

    return (
        <div className="space-y-5 animate-fadeIn">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">Background color</p>
                <div className="grid grid-cols-9 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                        <button
                            key={c}
                            onClick={() => updateForm({ bgColor: c, bgImage: null })}
                            style={{ background: c }}
                            className={`aspect-square rounded-lg border transition-all duration-200 ${form.bgColor === c && !form.bgImage ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-2' : 'border-stone-200 hover:scale-110'}`}
                            aria-label={c}
                        />
                    ))}
                </div>
                <button
                    onClick={() => updateForm({ bgColor: 'transparent', bgImage: null })}
                    className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500 transition-all duration-200 hover:border-stone-400 hover:text-stone-800"
                >
                    Clear background
                </button>
            </div>

            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">Custom color</p>
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={form.bgColor}
                        onChange={(e) => updateForm({ bgColor: e.target.value, bgImage: null })}
                        className="h-12 w-12 cursor-pointer rounded-xl border border-stone-200"
                    />
                    <input
                        type="text"
                        value={form.bgColor}
                        onChange={(e) => updateForm({ bgColor: e.target.value })}
                        className="input-luxe flex-1 rounded-xl border-stone-200 bg-stone-50 text-sm focus:border-stone-400 focus:bg-white"
                    />
                </div>
            </div>
        </div>
    );
}
