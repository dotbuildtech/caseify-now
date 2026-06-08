'use client';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { generateDesign } from '@/services/aiApi';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';

const SUGGESTIONS = [
    'pastel floral pattern',
    'minimal black & white',
    'anime sunset',
    'luxury gold marble',
    'abstract watercolor',
    'geometric triangles'
];

export default function AITab() {
    const { form, updateForm, addImageLayer } = useStudio();
    const toast = useToast();
    const [generating, setGenerating] = useState(false);
    const [results, setResults] = useState(null);

    const generate = async (prompt) => {
        const p = (prompt ?? form.aiPrompt ?? '').trim();
        if (!p) { toast.error('Enter a prompt first'); return; }
        try {
            setGenerating(true);
            const res = await generateDesign(p);
            setResults(res);
            updateForm({ aiPrompt: p });
            toast.success('Designs generated');
        } catch {
            toast.error('Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h3 className="label-luxe flex items-center gap-2"><Sparkles className="h-3 w-3" /> AI Prompt</h3>
                <textarea
                    value={form.aiPrompt}
                    onChange={(e) => updateForm({ aiPrompt: e.target.value })}
                    placeholder="e.g. pastel sakura pattern, vintage floral..."
                    className="input-luxe mt-2 min-h-[80px] resize-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            onClick={() => { updateForm({ aiPrompt: s }); generate(s); }}
                            className="border border-border bg-background-light px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light hover:border-ink hover:text-ink"
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => generate()}
                    disabled={generating}
                    className="btn-primary mt-3 w-full disabled:opacity-50"
                >
                    {generating ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</> : <><Sparkles className="h-3 w-3" /> Generate</>}
                </button>
            </div>

            {results && (
                <div>
                    <h3 className="label-luxe">Pick a layout</h3>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { updateForm({ bgImage: results.primary }); toast.success('Applied as background'); }}
                            className="relative aspect-square overflow-hidden border-2 border-bronze"
                        >
                            <SmartImage src={results.primary} alt="Primary" fill sizes="50vw" className="object-cover" />
                            <span className="absolute left-1 top-1 bg-bronze px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-cream">Main</span>
                        </button>
                        {results.variants.slice(0, 5).map((v) => (
                            <button
                                key={v.id}
                                onClick={() => { updateForm({ bgImage: v.url }); addImageLayer(v.url); toast.success('Added as layer'); }}
                                className="group relative aspect-square overflow-hidden border border-border"
                            >
                                <SmartImage src={v.url} alt="" fill sizes="50vw" className="object-cover transition-transform group-hover:scale-110" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
