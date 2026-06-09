'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import SmartImage from '@/components/ui/SmartImage';
import api from '@/services/api';

export default function SearchBar({ value, onChange, className = '' }) {
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (value?.length >= 2) {
                api.get('/products/search', { params: { q: value } })
                    .then((r) => { const d = r.data?.data; if (Array.isArray(d)) { setSuggestions(d.slice(0, 6)); setOpen(true); } })
                    .catch(() => { setSuggestions([]); });
            } else { setSuggestions([]); setOpen(false); }
        }, 250);
        return () => clearTimeout(timer);
    }, [value]);

    useEffect(() => {
        const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <div className="flex items-center border border-border bg-surface px-3 focus-within:border-ink transition-colors">
                <Search className="h-4 w-4 text-text-light shrink-0" />
                <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    placeholder="Search by name, brand, or keyword…"
                    className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-text-light" />
                {value && <button onClick={() => { onChange(''); setSuggestions([]); setOpen(false); }} className="p-0.5"><X className="h-3.5 w-3.5 text-text-light" /></button>}
            </div>
            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-border bg-surface shadow-lg max-h-80 overflow-y-auto">
                    {suggestions.map((p) => (
                        <Link key={p.id} href={`/product/${p.slug || p.id}`} onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-background-light transition-colors border-b border-border last:border-0">
                            <div className="h-10 w-10 shrink-0 bg-background-light overflow-hidden">
                                {p.image && <SmartImage src={p.image} alt="" width={40} height={40} className="object-cover w-full h-full" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{p.name}</p>
                                <p className="text-[11px] text-text-light">₹{p.price}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
