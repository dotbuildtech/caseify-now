import api from './api';

const unwrap = (r) => r?.data?.data || r?.data;

export const fetchCart = async () => {
    const r = await api.get('/cart');
    return unwrap(r);
};

export const fetchCartCount = async () => {
    const r = await api.get('/cart/count');
    return unwrap(r);
};

export const addToCart = async (productId, quantity = 1, designMeta = null) => {
    const body = { productId, quantity };
    if (designMeta) body.designMeta = designMeta;
    const r = await api.post('/cart', body);
    return unwrap(r);
};

export const updateCartItem = async (productId, quantity) => {
    const r = await api.put(`/cart/${productId}`, { quantity });
    return unwrap(r);
};

export const removeCartItem = async (productId) => {
    const r = await api.delete(`/cart/${productId}`);
    return unwrap(r);
};

export const clearCart = async () => {
    const r = await api.delete('/cart');
    return unwrap(r);
};
