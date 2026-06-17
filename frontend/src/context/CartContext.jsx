'use client';
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { fetchCart, addToCart as apiAdd, updateCartItem as apiUpdate, removeCartItem as apiRemove, clearCart as apiClear } from '@/services/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const getItemQty = (i) => Number(i.quantity ?? i.qty ?? 0);
const getItemPrice = (i) => {
    if (i.priceAtAdd != null) return Number(i.priceAtAdd) || 0;
    if (i.price != null) return Number(i.price) || 0;
    if (i.Product?.price != null) return Number(i.Product.price) || 0;
    return 0;
};
const getItemProductId = (i) => i.ProductId ?? i.productId ?? i.Product?.id ?? null;
const getItemImage = (i) => {
    if (i.Product?.image) return i.Product.image;
    if (i.Product?.images?.length) {
        const first = i.Product.images[0];
        return typeof first === 'string' ? first : first?.url;
    }
    if (i.imageAtAdd) return i.imageAtAdd;
    if (i.designMeta?.thumbnail) return i.designMeta.thumbnail;
    return i.image || '';
};
const getItemName = (i) => i.Product?.name || i.nameAtAdd || i.name || '';
const getItemCategory = (i) => i.Product?.category || i.variantLabel || i.designMeta?.brand || i.category || '';

export function CartProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({ itemCount: 0, uniqueItems: 0, subtotal: 0, total: 0 });
    const [loading, setLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const pendingOps = useRef(0);

    const load = useCallback(async () => {
        if (authLoading) return;
        if (!user) {
            setItems([]);
            setSummary({ itemCount: 0, uniqueItems: 0, subtotal: 0, total: 0 });
            return;
        }
        setLoading(true);
        try {
            const data = await fetchCart();
            if (data) {
                setItems(Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []));
                if (data?.summary) setSummary(data.summary);
            }
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, authLoading]);

    useEffect(() => { load(); }, [load]);

    const addItem = useCallback(async (productId, quantity = 1, designMeta = null) => {
        const optimisticItem = {
            ProductId: productId,
            quantity,
            priceAtAdd: 0,
            nameAtAdd: 'Adding...',
            imageAtAdd: '',
            designMeta
        };
        setItems((prev) => [...prev, optimisticItem]);
        pendingOps.current += 1;

        try {
            const data = await apiAdd(productId, quantity, designMeta);
            pendingOps.current -= 1;
            if (data?.items) {
                setItems(data.items);
                if (data?.summary) setSummary(data.summary);
            } else if (pendingOps.current === 0) {
                await load();
            }
            return data;
        } catch (err) {
            pendingOps.current -= 1;
            setItems((prev) => prev.filter((it) => it !== optimisticItem));
            throw err;
        }
    }, [load]);

    const updateItem = useCallback(async (productId, quantity) => {
        setItems((prev) =>
            prev.map((it) =>
                getItemProductId(it) === productId ? { ...it, quantity } : it
            )
        );

        try {
            const data = await apiUpdate(productId, quantity);
            if (data?.items) {
                setItems(data.items);
                if (data?.summary) setSummary(data.summary);
            }
        } catch {
            await load();
        }
    }, [load]);

    const removeItem = useCallback(async (productId) => {
        const removed = [];
        setItems((prev) => {
            const kept = prev.filter((it) => {
                if (getItemProductId(it) === productId) {
                    removed.push(it);
                    return false;
                }
                return true;
            });
            return kept;
        });

        try {
            const data = await apiRemove(productId);
            if (data?.items) {
                setItems(data.items);
                if (data?.summary) setSummary(data.summary);
            }
        } catch {
            await load();
        }
    }, [load]);

    const clear = useCallback(async () => {
        setItems([]);
        setSummary({ itemCount: 0, uniqueItems: 0, subtotal: 0, total: 0 });
        try {
            await apiClear();
        } catch {
            await load();
        }
    }, [load]);

    const value = useMemo(() => {
        const count = items.reduce((s, i) => s + getItemQty(i), 0) || summary.itemCount || 0;
        const computed = items.reduce((s, i) => s + getItemQty(i) * getItemPrice(i), 0);
        const subtotal = items.length > 0 ? computed : (summary?.subtotal ?? 0);
        return {
            items, count, subtotal, summary, loading,
            addItem, updateItem, removeItem, clear, load,
            getItemQty, getItemPrice, getItemProductId,
            getItemImage, getItemName, getItemCategory,
            drawerOpen, setDrawerOpen
        };
    }, [items, summary, loading, addItem, updateItem, removeItem, clear, load, drawerOpen]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};
