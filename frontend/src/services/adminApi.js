import api, { clearApiCache } from './api';

const unwrap = (r) => r?.data?.data ?? r?.data;

// ---------- Products (admin) ----------
export const adminListProducts = async (params = {}) => {
    const p = { limit: 50, sort: '-createdAt', includeInactive: true, ...params };
    const r = await api.get('/products', { params: p });
    const d = r.data;
    return {
        data: Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []),
        pagination: d?.pagination || null
    };
};

export const adminGetProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);

export const adminCreateProduct = (payload) =>
    api.post('/products', payload).then((r) => { clearApiCache(); return r.data; });

export const adminUpdateProduct = (id, payload) =>
    api.put(`/products/${id}`, payload).then((r) => { clearApiCache(); return r.data; });

export const adminDeleteProduct = (id, { force = false } = {}) =>
    api.delete(`/products/${id}`, { params: force ? { force: 'true' } : {} })
        .then((r) => { clearApiCache(); return r.data; });

export const adminLowStockProducts = () =>
    api.get('/products/low-stock').then((r) => r.data);

export const adminAddProductImage = (id, url) =>
    api.post(`/products/${id}/images`, { url }).then((r) => { clearApiCache(); return r.data; });

export const adminRemoveProductImage = (id, url) =>
    api.delete(`/products/${id}/images`, { params: { url } })
        .then((r) => { clearApiCache(); return r.data; });

// ---------- Orders (admin) ----------
export const adminListOrders = () => api.get('/orders').then((r) => r.data);

export const adminUpdateOrderStatus = (id, status) =>
    api.put(`/orders/${id}/status`, { status }).then((r) => r.data);

// ---------- Users (admin) ----------
export const adminListUsers = (params = {}) =>
    api.get('/auth/users', { params }).then((r) => r.data);

// ---------- Invoices (admin) ----------
export const adminGetInvoiceByOrder = (orderId) =>
    api.get(`/financial/invoices/by-order/${orderId}`).then((r) => r.data);

export const adminGenerateInvoice = (payload) =>
    api.post('/financial/invoices', payload).then((r) => r.data);

export const adminDownloadInvoice = (invoiceId) =>
    api.get(`/financial/invoices/${invoiceId}/download`, { responseType: 'blob' }).then((r) => r.data);

// ---------- Inventory (admin) ----------
export const adminListInventory = () => api.get('/inventory').then((r) => r.data);

export const adminUpdateStock = (id, { change, reason }) =>
    api.put(`/inventory/${id}`, { change, reason }).then((r) => r.data);

// ---------- Analytics (admin) ----------
export const adminSalesAnalytics = () => api.get('/analytics/sales').then((r) => r.data);

export const adminCustomerAnalytics = () => api.get('/analytics/customers').then((r) => r.data);

// ---------- Financial dashboard (admin) ----------
export const adminFinancialDashboard = (params = {}) =>
    api.get('/financial/dashboard', { params }).then((r) => r.data);

export const adminRevenueAnalytics = (params = {}) =>
    api.get('/financial/revenue', { params }).then((r) => r.data);

export const adminProfitLoss = (params = {}) =>
    api.get('/financial/profit-loss', { params }).then((r) => r.data);
