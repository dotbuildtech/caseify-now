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
export const adminListOrders = () => api.get('/orders').then((r) => r.data?.data || r.data);

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

// ---------- Brands (admin) ----------
export const adminListBrands = (params = {}) =>
    api.get('/brands', { params }).then((r) => r.data?.data || []);

export const adminGetBrand = (id) =>
    api.get(`/brands/${id}`).then((r) => r.data);

export const adminCreateBrand = (payload) =>
    api.post('/brands', payload).then((r) => { clearApiCache(); return r.data; });

export const adminUpdateBrand = (id, payload) =>
    api.put(`/brands/${id}`, payload).then((r) => { clearApiCache(); return r.data; });

export const adminDeleteBrand = (id) =>
    api.delete(`/brands/${id}`).then((r) => { clearApiCache(); return r.data; });

export const adminGetBrandModels = (brandId) =>
    api.get(`/brands/${brandId}/models`).then((r) => r.data?.data || []);

// ---------- Device Models (admin) ----------
export const adminListDeviceModels = (params = {}) =>
    api.get('/device-models', { params }).then((r) => r.data?.data || []);

export const adminGetDeviceModel = (id) =>
    api.get(`/device-models/${id}`).then((r) => r.data);

export const adminCreateDeviceModel = (payload) =>
    api.post('/device-models', payload).then((r) => { clearApiCache(); return r.data; });

export const adminUpdateDeviceModel = (id, payload) =>
    api.put(`/device-models/${id}`, payload).then((r) => { clearApiCache(); return r.data; });

export const adminDeleteDeviceModel = (id) =>
    api.delete(`/device-models/${id}`).then((r) => { clearApiCache(); return r.data; });

// ---------- Dashboard composite endpoint (admin) ----------
export const adminGetDashboard = () =>
    api.get('/admin/dashboard').then((r) => r.data);

// ---------- Financial dashboard (admin) ----------
export const adminFinancialDashboard = (params = {}) =>
    api.get('/financial/dashboard', { params }).then((r) => r.data);

export const adminRevenueAnalytics = (params = {}) =>
    api.get('/financial/revenue', { params }).then((r) => r.data);

export const adminProfitLoss = (params = {}) =>
    api.get('/financial/profit-loss', { params }).then((r) => r.data);

// ---------- Category-Brand associations (admin) ----------
export const adminListCategoryBrands = () =>
    api.get('/category-brands').then((r) => r.data?.data || []);

export const adminGetCategoryBrands = (categoryName) =>
    api.get(`/category-brands/${encodeURIComponent(categoryName)}`).then((r) => r.data?.data || []);

export const adminSetCategoryBrands = (categoryName, brandIds) =>
    api.post('/category-brands/bulk', { categoryName, brandIds })
        .then((r) => { clearApiCache(); return r.data?.data || []; });

export const adminAddCategoryBrand = (categoryName, BrandId) =>
    api.post('/category-brands', { categoryName, BrandId })
        .then((r) => { clearApiCache(); return r.data; });

export const adminRemoveCategoryBrand = (id) =>
    api.delete(`/category-brands/${id}`).then((r) => { clearApiCache(); return r.data; });

// ---------- Materials (admin) ----------
export const adminListMaterials = (params = {}) =>
    api.get('/materials', { params }).then((r) => r.data?.data || []);

export const adminGetMaterial = (id) =>
    api.get(`/materials/${id}`).then((r) => r.data);

export const adminCreateMaterial = (payload) =>
    api.post('/materials', payload).then((r) => { clearApiCache(); return r.data; });

export const adminUpdateMaterial = (id, payload) =>
    api.put(`/materials/${id}`, payload).then((r) => { clearApiCache(); return r.data; });

export const adminDeleteMaterial = (id) =>
    api.delete(`/materials/${id}`).then((r) => { clearApiCache(); return r.data; });

// ---------- Category-Material associations (admin) ----------
export const adminListCategoryMaterials = () =>
    api.get('/category-materials').then((r) => r.data?.data || []);

export const adminGetCategoryMaterials = (categoryName) =>
    api.get(`/category-materials/${encodeURIComponent(categoryName)}`).then((r) => r.data?.data || []);

export const adminSetCategoryMaterials = (categoryName, materialIds) =>
    api.post('/category-materials/bulk', { categoryName, materialIds })
        .then((r) => { clearApiCache(); return r.data?.data || []; });
