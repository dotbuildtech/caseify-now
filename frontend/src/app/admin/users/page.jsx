'use client';
import { useEffect, useState } from 'react';
import { Search, User, ShieldCheck } from 'lucide-react';
import { adminListUsers } from '@/services/adminApi';
import { formatDate } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

export default function AdminUsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        adminListUsers({ page, limit: 20 })
            .then((d) => {
                if (!mounted) return;
                setUsers(d?.data || []);
                setPagination(d?.pagination || null);
            })
            .catch((e) => toast.error(e.response?.data?.message || 'Failed to load users'))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [page, toast]);

    const filtered = q.trim()
        ? users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()))
        : users;

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Users</h2>
                    <p className="mt-1 text-xs text-text-light">{pagination ? `${pagination.total} total` : ''}</p>
                </div>
                <div className="flex items-center border border-border bg-surface px-3 focus-within:border-ink">
                    <Search className="h-4 w-4 text-text-light" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Filter on this page…"
                        className="w-64 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-text-light"
                    />
                </div>
            </div>

            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-background-light animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-text-light">No users.</div>
                ) : (
                    <ul className="divide-y divide-border">
                        {filtered.map((u) => (
                            <li key={u.id} className="flex items-center justify-between gap-3 p-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center ${u.role === 'admin' ? 'bg-bronze text-cream' : 'bg-background-light text-text-light'}`}>
                                        {u.role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{u.name}</p>
                                        <p className="truncate text-xs text-text-light">{u.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${u.role === 'admin' ? 'border-bronze text-bronze' : 'border-border text-text-light'}`}>
                                        {u.role}
                                    </span>
                                    <span className="hidden text-[11px] text-text-light md:inline">{formatDate(u.createdAt)}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-ghost disabled:opacity-30">← Prev</button>
                    <span className="text-xs text-text-light">Page {pagination.page} of {pagination.totalPages}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext} className="btn-ghost disabled:opacity-30">Next →</button>
                </div>
            )}
        </>
    );
}
