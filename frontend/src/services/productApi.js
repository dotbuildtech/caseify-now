import api from './api';

const normalize = (d) => {
    if (!d) return { data: [], total: 0 };
    if (Array.isArray(d)) return { data: d, total: d.length };
    if (Array.isArray(d.data)) {
        return { data: d.data, total: d.pagination?.total ?? d.data.length };
    }
    return { data: [], total: 0 };
};

export const fetchProducts = async (params = {}) => {
    const p = { limit: 50 };
    if (params.q) p.q = params.q;
    if (params.search && !params.q) p.q = params.search;
    if (params.category) p.category = params.category;
    if (params.brand) p.brand = params.brand;
    if (params.priceMin != null) p.priceMin = params.priceMin;
    if (params.priceMax != null) p.priceMax = params.priceMax;
    if (params.minPrice != null && params.priceMin == null) p.priceMin = params.minPrice;
    if (params.maxPrice != null && params.priceMax == null) p.priceMax = params.maxPrice;
    if (params.isFeatured != null) p.isFeatured = params.isFeatured;
    if (params.featured != null && params.isFeatured == null) p.isFeatured = params.featured;
    if (params.inStock != null) p.inStock = params.inStock;
    if (params.tags) p.tags = params.tags;
    if (params.sort) {
        p.sort = params.sort;
    } else if (params.sortBy) {
        p.sort = params.order === 'desc' ? `-${params.sortBy}` : params.sortBy;
    } else {
        p.sort = '-createdAt';
    }
    if (params.page) p.page = params.page;
    if (params.limit) p.limit = params.limit;
    const res = await api.get('/products', { params: p });
    return normalize(res.data);
};

export const fetchProductById = (id) => api.get(`/products/${id}`).then((r) => r.data);

export const searchProducts = (q) => api.get('/products/search', { params: { q } }).then((r) => r.data);

export const fetchFeaturedProducts = () =>
    api.get('/products', { params: { isFeatured: true, limit: 8 } }).then((r) => normalize(r.data));
