'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchProducts } from '@/services/productApi';
import ProductCard from '@/components/product/ProductCard';
import { PRODUCT_CATEGORIES } from '@/utils/constants';
const SORTS = [
    { v: 'featured', label: 'Featured', sort: '-createdAt' },
    { v: 'price_asc', label: 'Price: Low to High', sort: 'price' },
    { v: 'price_desc', label: 'Price: High to Low', sort: '-price' },
    { v: 'newest', label: 'Newest', sort: '-createdAt' }
];

export default function ShopPage() {
    const params = useSearchParams();
    const [q, setQ] = useState(params.get('q') || '');
    const [category, setCategory] = useState(params.get('category') || '');
    const [catSearch, setCatSearch] = useState('');
    const [brand, setBrand] = useState(params.get('brand') || '');
    const [minPrice, setMinPrice] = useState(params.get('priceMin') || params.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(params.get('priceMax') || params.get('maxPrice') || '');
    const [inStock, setInStock] = useState(params.get('inStock') === 'true');
    const [sort, setSort] = useState(params.get('sort') || 'featured');
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const p = { limit: 50 };
        if (q) p.q = q;
        if (category) p.category = category;
        if (brand) p.brand = brand;
        if (minPrice) p.priceMin = Number(minPrice);
        if (maxPrice) p.priceMax = Number(maxPrice);
        if (inStock) p.inStock = true;
        const s = SORTS.find((x) => x.v === sort);
        if (s) p.sort = s.sort;
        try {
            const d = await fetchProducts(p);
            setProducts(d.data || []);
            setTotal(d.total || 0);
        } catch {
            setProducts([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [q, category, brand, minPrice, maxPrice, inStock, sort]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mb-10">
                <span className="eyebrow">— Our Products</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                    Shop <span className="italic-display">the collection</span>.
                </h1>
                <p className="mt-4 max-w-md text-sm text-text-light">
                    Browse premium phone cases and accessories.
                </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
                <aside className="space-y-8">
                    <div>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search products..."
                            className="input-luxe"
                        />
                    </div>

                    <div>
                        <h3 className="label-luxe">Categories</h3>
                        <input
                            value={catSearch}
                            onChange={(e) => setCatSearch(e.target.value)}
                            placeholder="Search category..."
                            className="input-luxe !py-2 mb-2"
                        />
                        <ul className="space-y-1 text-sm max-h-[120px] overflow-y-auto">
                            <li>
                                <button
                                    onClick={() => setCategory('')}
                                    className={`w-full text-left px-2 py-1.5 transition-colors ${!category ? 'font-semibold text-ink bg-background-light' : 'text-text-light hover:text-ink hover:bg-background-light'}`}
                                >All Products</button>
                            </li>
                            {PRODUCT_CATEGORIES.filter((c) => c.toLowerCase().includes(catSearch.toLowerCase())).map((c) => (
                                <li key={c}>
                                    <button
                                        onClick={() => setCategory(c)}
                                        className={`w-full text-left px-2 py-1.5 transition-colors ${category === c ? 'font-semibold text-ink bg-background-light' : 'text-text-light hover:text-ink hover:bg-background-light'}`}
                                    >{c}</button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="label-luxe">Price Range</h3>
                        <div className="flex items-center gap-2">
                            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="input-luxe !py-3" />
                            <span className="text-text-light">—</span>
                            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="input-luxe !py-3" />
                        </div>
                    </div>

                    <div>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4" />
                            <span>In stock only</span>
                        </label>
                    </div>

                    <div>
                        <h3 className="label-luxe">Sort By</h3>
                        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-luxe">
                            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                        </select>
                    </div>
                </aside>

                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <p className="text-sm text-text-light">{total} {total === 1 ? 'product' : 'products'} found</p>
                        {(q || category || minPrice || maxPrice || inStock) && (
                            <button
                                onClick={() => { setQ(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setInStock(false); }}
                                className="text-xs uppercase tracking-[0.18em] text-text-light hover:text-bronze"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i}>
                                    <div className="aspect-[3/4] bg-background-light animate-pulse" />
                                    <div className="mt-4 h-4 w-2/3 bg-background-light animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="border border-dashed border-border bg-background-light p-12 text-center">
                            <h3 className="font-display text-2xl">No products found.</h3>
                            <p className="mt-2 text-sm text-text-light">Try different filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                            {products.map((p) => <ProductCard key={p.id || p.slug} p={p} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
