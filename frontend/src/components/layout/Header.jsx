'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingBag, User, Search, Menu, X, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { NAV_LINKS, SITE } from '@/utils/constants';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const { count } = useCart();
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const submitSearch = (e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
        setOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
            <div className="container-luxe flex h-16 items-center justify-between gap-6">
                <Link href="/" className="flex items-center gap-2">
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
                    <form onSubmit={submitSearch} className="hidden md:flex items-center">
                        <div className="flex items-center border border-border bg-surface px-3 py-2 focus-within:border-ink">
                            <Search className="h-4 w-4 text-text-light" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search..."
                                className="ml-2 w-32 bg-transparent text-sm outline-none placeholder:text-text-light lg:w-44"
                            />
                        </div>
                    </form>
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
