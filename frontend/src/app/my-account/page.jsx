'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Package, MapPin, Heart, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchProfile } from '@/services/authApi';
import { formatDate } from '@/utils/format';

export default function MyAccountPage() {
    const router = useRouter();
    const { user: ctxUser, loading: authLoading, logout } = useAuth();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        if (!ctxUser) { router.push('/login?redirect=/my-account'); return; }
        let mounted = true;
        fetchProfile()
            .then((d) => { if (mounted) setProfile(d?.data || d || ctxUser); })
            .catch(() => { if (mounted) setProfile(ctxUser); });
        return () => { mounted = false; };
    }, [ctxUser, authLoading, router]);

    if (!profile) return <div className="container-luxe py-20"><div className="h-32 bg-background-light animate-pulse" /></div>;

    const memberSince = profile.createdAt || profile.created_at;

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mb-10">
                <span className="eyebrow">— Your Account</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                    My <span className="italic-display">Account</span>.
                </h1>
            </div>

            <div className="grid gap-6 md:grid-cols-[280px_1fr]">
                <aside className="h-fit border border-border bg-surface p-4">
                    <div className="flex items-center gap-3 border-b border-border p-3">
                        <div className="flex h-12 w-12 items-center justify-center bg-ink text-cream">
                            <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{profile.name}</p>
                            <p className="truncate text-xs text-text-light">{profile.email}</p>
                        </div>
                    </div>
                    <nav className="mt-2 space-y-1">
                        <Link href="/my-account" className="flex items-center gap-3 border-l-2 border-ink bg-background-light px-3 py-2 text-sm font-medium">
                            <User className="h-4 w-4" /> Profile
                        </Link>
                        <Link href="/orders" className="flex items-center gap-3 px-3 py-2 text-sm text-text-light hover:bg-background-light">
                            <Package className="h-4 w-4" /> My Orders
                        </Link>
                        <Link href="/track" className="flex items-center gap-3 px-3 py-2 text-sm text-text-light hover:bg-background-light">
                            <MapPin className="h-4 w-4" /> Track Order
                        </Link>
                        <Link href="/customize" className="flex items-center gap-3 px-3 py-2 text-sm text-text-light hover:bg-background-light">
                            <Heart className="h-4 w-4" /> My Designs
                        </Link>
                    </nav>
                    <button onClick={() => { logout(); router.push('/'); }} className="mt-4 flex w-full items-center gap-3 border-t border-border px-3 py-3 text-sm text-text-light hover:text-error">
                        <LogOut className="h-4 w-4" /> Logout
                    </button>
                </aside>

                <div className="space-y-6">
                    <div className="border border-border bg-surface p-6">
                        <h2 className="font-display text-2xl">Profile</h2>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between border-b border-border pb-2"><dt className="text-text-light">Name</dt><dd className="font-medium">{profile.name}</dd></div>
                            <div className="flex justify-between border-b border-border pb-2"><dt className="text-text-light">Email</dt><dd className="font-medium">{profile.email}</dd></div>
                            {profile.phone && <div className="flex justify-between border-b border-border pb-2"><dt className="text-text-light">Phone</dt><dd className="font-medium">{profile.phone}</dd></div>}
                            {profile.role && <div className="flex justify-between border-b border-border pb-2"><dt className="text-text-light">Role</dt><dd className="font-medium capitalize">{profile.role}</dd></div>}
                            {memberSince && <div className="flex justify-between"><dt className="text-text-light">Member since</dt><dd className="font-medium">{formatDate(memberSince)}</dd></div>}
                        </dl>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Link href="/orders" className="border border-border bg-surface p-6 transition-colors hover:border-ink">
                            <Package className="h-6 w-6 text-ink" strokeWidth={1.25} />
                            <h3 className="mt-4 font-display text-xl">My Orders</h3>
                            <p className="mt-2 text-sm text-text-light">View and track all your orders</p>
                        </Link>
                        <Link href="/customize" className="border border-border bg-surface p-6 transition-colors hover:border-ink">
                            <Heart className="h-6 w-6 text-ink" strokeWidth={1.25} />
                            <h3 className="mt-4 font-display text-xl">My Designs</h3>
                            <p className="mt-2 text-sm text-text-light">Open the design studio</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
