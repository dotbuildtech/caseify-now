'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Mail, MailOpen, Trash2, Send, Clock, User, ChevronLeft } from 'lucide-react';
import { listMessages, getMessage, markAsRead, markAsUnread, replyToMessage, deleteMessage } from '@/services/contactApi';
import { useToast } from '@/components/ui/Toast';

export default function AdminMessagesPage() {
    const toast = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;
    const [messages, setMessages] = useState([]);
    const [selected, setSelected] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('all');

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filter === 'unread') params.isRead = 'false';
            if (filter === 'read') params.isRead = 'true';
            const data = await listMessages(params);
            setMessages(data.data || []);
            setUnreadCount(data.unreadCount || 0);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch {
            toastRef.current?.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    const openMessage = async (msg) => {
        try {
            const data = await getMessage(msg.id);
            setSelected(data);
            setReplyText('');
            fetchMessages();
        } catch {
            toast.error('Failed to load message');
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selected) return;
        setSending(true);
        try {
            await replyToMessage(selected.id, replyText.trim());
            toast.success('Reply sent');
            setReplyText('');
            setSelected(null);
            fetchMessages();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const handleToggleRead = async (msg) => {
        try {
            if (msg.isRead) {
                await markAsUnread(msg.id);
            } else {
                await markAsRead(msg.id);
            }
            fetchMessages();
        } catch { toast.error('Failed to update'); }
    };

    const handleDelete = async (msg) => {
        if (!confirm('Delete this message?')) return;
        try {
            await deleteMessage(msg.id);
            if (selected?.id === msg.id) setSelected(null);
            fetchMessages();
        } catch { toast.error('Failed to delete'); }
    };

    const refreshUnread = async () => {
        try {
            const data = await listMessages({ page: 1, limit: 1, isRead: 'false' });
            setUnreadCount(data.unreadCount || 0);
        } catch {}
    };

    const formatDate = (d) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <span className="eyebrow">— Inbox</span>
                    <h2 className="mt-2 font-display text-3xl tracking-editorial">
                        Messages {unreadCount > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-bronze px-2.5 py-0.5 text-xs font-medium text-cream">
                                {unreadCount} new
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {['all', 'unread', 'read'].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] border transition-colors ${filter === f ? 'border-ink bg-ink text-cream' : 'border-border text-text-light hover:border-ink'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                <div className="border border-border bg-surface">
                    {loading ? (
                        <div className="p-8 text-center text-text-light">Loading...</div>
                    ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-text-light">No messages found</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => openMessage(msg)}
                                    className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-background-light ${selected?.id === msg.id ? 'bg-background-light border-l-2 border-ink' : ''} ${!msg.isRead ? 'font-medium' : ''}`}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        {msg.isRead ? (
                                            <MailOpen className="h-4 w-4 text-text-light" strokeWidth={1.5} />
                                        ) : (
                                            <Mail className="h-4 w-4 text-bronze" strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-sm">{msg.name}</p>
                                            <span className="shrink-0 text-[10px] text-text-light">{formatDate(msg.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-text-light truncate mt-0.5">{msg.subject || 'No subject'}</p>
                                        <p className="text-xs text-text-light/70 truncate mt-0.5">{msg.message.slice(0, 80)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border p-4">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs text-text-light hover:text-ink disabled:opacity-30">← Prev</button>
                            <span className="text-xs text-text-light">Page {page} of {totalPages}</span>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="text-xs text-text-light hover:text-ink disabled:opacity-30">Next →</button>
                        </div>
                    )}
                </div>

                <div className="border border-border bg-surface h-fit">
                    {!selected ? (
                        <div className="flex items-center justify-center p-12 text-center text-text-light">
                            <div>
                                <Mail className="mx-auto h-8 w-8 mb-4" strokeWidth={1} />
                                <p>Select a message to view</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between border-b border-border p-4">
                                <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-text-light hover:text-ink">
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </button>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleToggleRead(selected)} className="text-[10px] text-text-light hover:text-ink">
                                        {selected.isRead ? 'Mark unread' : 'Mark read'}
                                    </button>
                                    <button onClick={() => handleDelete(selected)} className="text-[10px] text-error hover:underline">Delete</button>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-text-light" strokeWidth={1.5} />
                                        <span className="font-medium">{selected.name}</span>
                                        <span className="text-text-light">{selected.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-text-light">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDate(selected.createdAt)}</span>
                                    </div>
                                </div>
                                {selected.subject && (
                                    <p className="text-sm font-medium border-t border-border pt-4">{selected.subject}</p>
                                )}
                                <p className="text-sm text-text-light whitespace-pre-wrap">{selected.message}</p>

                                {selected.replyMessage && (
                                    <div className="border-t border-border pt-4">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-bronze mb-2">Reply Sent</p>
                                        <p className="text-sm text-ink whitespace-pre-wrap">{selected.replyMessage}</p>
                                        <p className="text-xs text-text-light mt-1">{formatDate(selected.repliedAt)}</p>
                                    </div>
                                )}

                                <form onSubmit={handleReply} className="border-t border-border pt-4 space-y-3">
                                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Send Reply via Email</p>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        rows={5}
                                        placeholder="Write your reply..."
                                        className="input-luxe resize-none"
                                    />
                                    <button type="submit" disabled={sending || !replyText.trim()} className="btn-primary inline-flex items-center gap-2 text-sm">
                                        {sending ? 'Sending...' : (
                                            <>
                                                Send Reply <Send className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
