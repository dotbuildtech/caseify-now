'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function SearchableSelect({ value, onChange, options, placeholder = 'Select...', className = '' }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));

    const selected = options.find((o) => o === value);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => { setOpen((v) => !v); setQ(''); }}
                className="input-luxe flex items-center justify-between gap-2 text-left"
            >
                <span className={selected ? '' : 'text-text-light opacity-60'}>{selected || placeholder}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-text-light transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 border border-border bg-surface shadow-lg">
                    <div className="flex items-center border-b border-border px-3">
                        <Search className="h-4 w-4 shrink-0 text-text-light" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-[120px] overflow-y-auto">
                        <li>
                            <button
                                type="button"
                                onClick={() => { onChange(''); setOpen(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-background-light ${!value ? 'bg-background-light font-medium' : 'text-text-light'}`}
                            >None</button>
                        </li>
                        {filtered.map((o) => (
                            <li key={o}>
                                <button
                                    type="button"
                                    onClick={() => { onChange(o); setOpen(false); }}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-background-light ${value === o ? 'bg-background-light font-medium' : ''}`}
                                >{o}</button>
                            </li>
                        ))}
                        {filtered.length === 0 && (
                            <li className="px-4 py-6 text-center text-xs text-text-light">No matches</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
