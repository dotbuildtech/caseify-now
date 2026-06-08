'use client';
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
const getItemProductId = (i) => i.ProductId ?? i.productId ?? i.Product?.id ?? i.id;
const getItemImage = (i) => {
    if (i.Product?.image) return i.Product.image;
    if (i.Product?.images?.length) {
        const first = i.Product.images[0];
        return typeof first === 'string' ? first : first?.url;
    }
    return i.image || '';
};
const getItemName = (i) => i.Product?.name || i.name || '';
const getItemCategory = (i) => i.Product?.category || i.category || '';

export function CartProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({ itemCount: 0, uniqueItems: 0, subtotal: 0, total: 0 });
    const [loading, setLoading] = useState(false);

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
            setItems(Array.isArray(data?.items) ? data.items : []);
            if (data?.summary) setSummary(data.summary);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user, authLoading]);

    useEffect(() => { load(); }, [load]);

    const addItem = async (productId, quantity = 1) => {
        const data = await apiAdd(productId, quantity);
        await load();
        return data;
    };

    const updateItem = async (productId, quantity) => {
        await apiUpdate(productId, quantity);
        await load();
    };

    const removeItem = async (productId) => {
        await apiRemove(productId);
        await load();
    };

    const clear = async () => {
        await apiClear();
        await load();
    };

    const value = useMemo(() => {
        const count = items.reduce((s, i) => s + getItemQty(i), 0) || summary.itemCount || 0;
        const subtotal = items.reduce((s, i) => s + getItemQty(i) * getItemPrice(i), 0) || summary.subtotal || 0;
        return {
            items,
            count,
            subtotal,
            summary,
            loading,
            addItem,
            updateItem,
            removeItem,
            clear,
            load,
            getItemQty,
            getItemPrice,
            getItemProductId,
            getItemImage,
            getItemName,
            getItemCategory
        };
    }, [items, summary, loading]);

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
