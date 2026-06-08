'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);

    const show = useCallback((msg, type = 'success') => {
        const id = Date.now() + Math.random();
        setItems((p) => [...p, { id, msg, type }]);
        setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3000);
    }, []);

    const value = {
        success: (m) => show(m, 'success'),
        error: (m) => show(m, 'error')
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-6 right-6 z-[200] space-y-2">
                {items.map((t) => (
                    <div
                        key={t.id}
                        className={`flex min-w-[240px] items-center gap-3 border bg-surface px-4 py-3 shadow-lg ${
                            t.type === 'success' ? 'border-success' : 'border-error'
                        }`}
                    >
                        {t.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                            <XCircle className="h-4 w-4 text-error" />
                        )}
                        <p className="flex-1 text-sm">{t.msg}</p>
                        <button onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))} className="text-text-light hover:text-ink">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (ctx) return ctx;
    return { success: () => {}, error: () => {} };
}
