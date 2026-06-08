import api from './api';

const unwrap = (r) => r?.data?.data || r?.data;

export const createOrder = async (payload) => {
    const r = await api.post('/orders', payload);
    const d = r?.data || {};
    return d.order || d.data?.order || d;
};

export const fetchMyOrders = async () => {
    const r = await api.get('/orders/myorders');
    const d = r?.data;
    return Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
};

export const fetchOrderById = async (id) => {
    const r = await api.get(`/orders/${id}`);
    return r?.data?.data || r?.data;
};

export const markOrderPaid = async (id, payload) => {
    const r = await api.put(`/orders/${id}/pay`, payload);
    return r?.data;
};
