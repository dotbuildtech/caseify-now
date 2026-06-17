const PUBLIC_PRODUCT_FIELDS = new Set([
    'id', 'name', 'slug', 'description', 'price', 'compareAtPrice',
    'category', 'phoneModel', 'brand', 'image', 'images', 'isFeatured',
    'isDeviceSpecific', 'tags', 'materials', 'attributes', 'variants',
    'stock', 'lowStockThreshold'
]);

const sanitizeProduct = (product) => {
    if (!product) return product;
    const json = typeof product.toJSON === 'function' ? product.toJSON() : product;
    const sanitized = {};
    for (const key of PUBLIC_PRODUCT_FIELDS) {
        if (key in json) sanitized[key] = json[key];
    }
    if (json.variants && Array.isArray(json.variants)) {
        sanitized.variants = json.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            image: v.image,
            attributes: v.attributes,
            sortOrder: v.sortOrder,
            stock: v.stock
        }));
    }
    return sanitized;
};

const sanitizeProductList = (products) => {
    if (!Array.isArray(products)) return [];
    return products.map(sanitizeProduct);
};

const sanitizeOrder = (order) => {
    if (!order) return order;
    const json = typeof order.toJSON === 'function' ? order.toJSON() : order;
    return {
        id: json.id,
        items: json.items || [],
        shippingAddress: json.shippingAddress,
        paymentMethod: json.paymentMethod,
        itemsPrice: json.itemsPrice,
        taxPrice: json.taxPrice,
        shippingPrice: json.shippingPrice,
        totalPrice: json.totalPrice,
        isPaid: json.isPaid,
        paidAt: json.paidAt,
        orderStatus: json.orderStatus,
        isDelivered: json.isDelivered,
        deliveredAt: json.deliveredAt,
        createdAt: json.createdAt,
        updatedAt: json.updatedAt
    };
};

module.exports = { sanitizeProduct, sanitizeProductList, sanitizeOrder };
