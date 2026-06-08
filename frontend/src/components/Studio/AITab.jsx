'use client';
import { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { generateDesign } from '@/services/aiApi';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';

const SUGGESTIONS = [
    'Pastel floral pattern',
    'Minimal black & white',
    'Anime sunset scene',
    'Luxury gold marble',
    'Abstract watercolor',
    'Geometric triangles'
];

export default function AITab() {
    const { form, updateForm, addImageLayer } = useStudio();
    const toast = useToast();
    const [generating, setGenerating] = useState(false);
    const [results, setResults] = useState(null);
    const [prompt, setPrompt] = useState(form.aiPrompt || '');

    const generate = async (p) => {
        const text = (p ?? prompt ?? '').trim();
        if (!text) { toast.error('Describe your design first'); return; }
        try {
            setGenerating(true);
            updateForm({ aiPrompt: text });
            setPrompt(text);
            const res = await generateDesign(text);
            setResults(res);
            toast.success('Design generated');
        } catch {
            toast.error('Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-5 animate-fadeIn">
            <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(prompt); } }}
                    placeholder="Describe your dream case…&#10;&#10;e.g. pastel cherry blossoms on matte black,&#10;minimal line art portrait, cosmic galaxy swirl…"
                    className="input-luxe min-h-[100px] resize-none rounded-xl border-stone-200 bg-stone-50 text-sm leading-relaxed placeholder:text-stone-300 focus:border-stone-400 focus:bg-white"
                />
                <Wand2 className="absolute right-4 top-4 h-4 w-4 text-stone-300" />
            </div>

            <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s}
                        onClick={() => generate(s)}
                        className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-medium text-stone-500 transition-all duration-200 hover:border-stone-400 hover:text-stone-800 hover:shadow-sm"
                    >
                        {s}
                    </button>
                ))}
            </div>

            <button
                onClick={() => generate()}
                disabled={generating || !prompt.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-stone-900/10 transition-all duration-300 hover:bg-stone-800 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
                {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                    <><Sparkles className="h-4 w-4" /> Generate design</>
                )}
            </button>

            {results && (
                <div className="animate-slideUp">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Results</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { updateForm({ bgImage: results.primary }); toast.success('Applied as background'); }}
                            className="group relative aspect-square overflow-hidden rounded-xl border-2 border-red-500/40 ring-2 ring-red-500/20"
                        >
                            <SmartImage src={results.primary} alt="Main" fill sizes="50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                            <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">Main</span>
                        </button>
                        {results.variants.slice(0, 3).map((v) => (
                            <button
                                key={v.id}
                                onClick={() => { updateForm({ bgImage: v.url }); addImageLayer(v.url); toast.success('Design applied'); }}
                                className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200"
                            >
                                <SmartImage src={v.url} alt="" fill sizes="50vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
