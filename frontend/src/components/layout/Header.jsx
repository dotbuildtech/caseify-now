'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, User, Search, Menu, X, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { NAV_LINKS, SITE, CATEGORIES } from '@/utils/constants';
import { useRouter, usePathname } from 'next/navigation';
import { searchProducts } from '@/services/productApi';

export default function Header() {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestRef = useRef(null);
    const { count } = useCart();
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const debounceRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchSuggestions = useCallback(async (term) => {
        if (term.length < 2) { setSuggestions([]); return; }
        try {
            const res = await searchProducts(term);
            const data = Array.isArray(res) ? res : (res?.data || []);
            setSuggestions(data.slice(0, 6));
        } catch { setSuggestions([]); }
    }, []);

    const onSearchChange = (e) => {
        const v = e.target.value;
        setQ(v);
        setShowSuggestions(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(v), 250);
    };

    const submitSearch = (e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
        setOpen(false);
        setShowSuggestions(false);
    };

    const goToProduct = (id) => {
        router.push(`/product/${id}`);
        setQ('');
        setShowSuggestions(false);
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
            <div className="container-luxe flex h-16 items-center justify-between gap-6">
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center bg-ink text-cream">
                        <span className="font-display text-lg font-bold">D</span>
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="font-display text-lg font-semibold tracking-editorial">{SITE.name}</span>
                        <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-text-light">Official Store</span>
                    </div>
                </Link>

                <nav className="hidden items-center gap-8 lg:flex">
                    {NAV_LINKS.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`text-xs font-medium uppercase tracking-[0.18em] transition-colors ${pathname === l.href ? 'text-bronze' : 'text-ink hover:text-bronze'}`}
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div ref={suggestRef} className="hidden md:block relative">
                        <form onSubmit={submitSearch}>
                            <div className="flex items-center border border-border bg-surface px-3 py-2 focus-within:border-ink">
                                <Search className="h-4 w-4 text-text-light shrink-0" />
                                <input
                                    value={q}
                                    onChange={onSearchChange}
                                    placeholder="Search..."
                                    className="ml-2 w-32 bg-transparent text-sm outline-none placeholder:text-text-light lg:w-44"
                                />
                            </div>
                        </form>
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 border border-border bg-surface shadow-lg z-50">
                                {suggestions.map((p) => (
                                    <button key={p.id} onClick={() => goToProduct(p.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left hover:bg-background-light transition-colors border-b border-border last:border-0">
                                        {p.images?.[0] && (
                                            <img src={p.images[0]} alt="" className="h-8 w-8 object-cover border border-border" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{p.name}</p>
                                            <p className="text-text-light">₹{Number(p.price).toLocaleString('en-IN')}</p>
                                        </div>
                                    </button>
                                ))}
                                <button onClick={submitSearch} className="w-full px-3 py-2 text-xs text-text-light hover:bg-background-light text-center border-t border-border">
                                    View all results →
                                </button>
                            </div>
                        )}
                    </div>
                    {user ? (
                        <div className="hidden md:flex items-center gap-2">
                            {user.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className={`flex items-center gap-1 border px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors ${pathname?.startsWith('/admin') ? 'border-bronze text-bronze' : 'border-border text-ink hover:border-bronze hover:text-bronze'}`}
                                    title="Admin dashboard"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" /> Admin
                                </Link>
                            )}
                            <Link href="/my-account" className="btn-ghost !px-2 !py-2" title="My Account">
                                <User className="h-5 w-5" />
                            </Link>
                            <button onClick={logout} className="btn-ghost !px-2 !py-2" title="Logout">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="hidden md:inline-flex btn-ghost">
                            Sign In
                        </Link>
                    )}
                    <Link href="/cart" className="relative inline-flex items-center justify-center h-10 w-10 border border-border bg-surface transition-colors hover:border-ink">
                        <ShoppingBag className="h-4 w-4" />
                        {count > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze px-1 text-[10px] font-semibold text-cream">
                                {count}
                            </span>
                        )}
                    </Link>
                    <button onClick={() => setOpen(!open)} className="lg:hidden inline-flex h-10 w-10 items-center justify-center border border-border">
                        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="lg:hidden border-t border-border bg-surface">
                    <div className="container-luxe py-4 space-y-3">
                        <form onSubmit={submitSearch} className="flex items-center border border-border bg-surface px-3 py-2.5 mb-4">
                            <Search className="h-4 w-4 text-text-light shrink-0" />
                            <input value={q} onChange={onSearchChange} placeholder="Search products…" className="w-full bg-transparent px-2 text-sm outline-none placeholder:text-text-light" />
                        </form>
                        {NAV_LINKS.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                className="block py-2 text-sm font-medium uppercase tracking-[0.18em] text-ink hover:text-bronze"
                            >
                                {l.label}
                            </Link>
                        ))}
                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <Link href="/admin" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium uppercase tracking-[0.18em] text-bronze hover:text-ink">Admin</Link>
                                )}
                                <Link href="/my-account" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium uppercase tracking-[0.18em] text-ink hover:text-bronze">My Account</Link>
                                <button onClick={() => { logout(); setOpen(false); }} className="block py-2 text-sm font-medium uppercase tracking-[0.18em] text-ink hover:text-bronze">Logout</button>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium uppercase tracking-[0.18em] text-ink hover:text-bronze">Sign In</Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
