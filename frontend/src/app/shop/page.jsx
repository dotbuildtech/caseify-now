'use client';
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchProducts } from '@/services/productApi';
import { fetchCachedFilters } from '@/services/filterCache';
import ProductCard from '@/components/product/ProductCard';
import SearchBar from '@/components/shop/SearchBar';
import { CATEGORIES, FORM_FIELD_LABELS } from '@/utils/constants';
import { Smartphone, Shield, Zap, Headphones, Battery, Cable, Watch, Search, SlidersHorizontal, X, RotateCcw, ChevronDown } from 'lucide-react';

const ICON_MAP = { Smartphone, Shield, Zap, Headphones, Battery, Cable, Watch };

const SORTS = [
    { v: 'newest', label: 'Newest First', sort: '-createdAt' },
    { v: 'price_asc', label: 'Price: Low to High', sort: 'price' },
    { v: 'price_desc', label: 'Price: High to Low', sort: '-price' },
    { v: 'name_asc', label: 'Name: A to Z', sort: 'name' },
    { v: 'name_desc', label: 'Name: Z to A', sort: '-name' }
];

function ActiveFilters({ filters, onRemove, onClear }) {
    const chips = [];
    if (filters.q) chips.push({ key: 'q', label: `"${filters.q}"` });
    if (filters.category) chips.push({ key: 'category', label: filters.category });
    if (filters.brand) chips.push({ key: 'brand', label: filters.brand });
    if (filters.phoneModel) chips.push({ key: 'phoneModel', label: filters.phoneModel });
    if (filters.priceMin || filters.priceMax) chips.push({ key: 'price_range', label: `₹${filters.priceMin || 0}–₹${filters.priceMax || '∞'}` });
    if (filters.inStock) chips.push({ key: 'inStock', label: 'In Stock' });
    Object.entries(filters).forEach(([k, v]) => {
        if (['q', 'category', 'brand', 'phoneModel', 'priceMin', 'priceMax', 'inStock', 'materials', 'sort'].includes(k)) return;
        if (v) {
            const label = FORM_FIELD_LABELS[k] || k.replace(/_/g, ' ');
            chips.push({ key: k, label: `${label}: ${v}` });
        }
    });
    if (chips.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Filters:</span>
            {chips.map((c) => (
                <button key={c.key} onClick={() => onRemove(c.key)} className="flex items-center gap-1 border border-border px-2.5 py-1 text-[11px] hover:border-ink transition-colors">
                    {c.label}
                    <X className="h-3 w-3" strokeWidth={2} />
                </button>
            ))}
            <button onClick={onClear} className="flex items-center gap-1 text-[11px] text-text-light hover:text-error transition-colors">
                <RotateCcw className="h-3 w-3" /> Clear all
            </button>
        </div>
    );
}

function ShopContent() {
    const params = useSearchParams();
    const router = useRouter();

    const [q, setQ] = useState(params.get('q') || '');
    const [category, setCategory] = useState(params.get('category') || '');
    const [brand, setBrand] = useState(params.get('brand') || '');
    const [phoneModel, setPhoneModel] = useState(params.get('phoneModel') || '');
    const [priceMin, setPriceMin] = useState(params.get('priceMin') || '');
    const [priceMax, setPriceMax] = useState(params.get('priceMax') || '');
    const [inStock, setInStock] = useState(params.get('inStock') === 'true');
    const [sort, setSort] = useState(params.get('sort') || 'newest');
    const [attrFilters, setAttrFilters] = useState({});
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [filterOptions, setFilterOptions] = useState({});

    const catConfig = useMemo(() => {
        if (!category) return null;
        return CATEGORIES.find((c) => c.name === category) || null;
    }, [category]);

    const filterFields = catConfig?.filterFields || [];
    const attrKeys = catConfig?.attrKeys || [];

    useEffect(() => {
        if (!category) {
            setBrands([]);
            setModels([]);
            setFilterOptions({});
            return;
        }
        fetchCachedFilters({ category }).then((data) => {
            if (data.brands) setBrands(data.brands);
            if (data.models) setModels(data.models);
            if (data.filterOptions) setFilterOptions(data.filterOptions);
        }).catch(() => {});
    }, [category]);

    useEffect(() => {
        if (!brand || !filterFields.includes('model')) { setModels([]); return; }
        setModelsLoading(true);
        const found = brands.find((b) => b.name === brand || String(b.id) === brand);
        if (found) {
            fetch(`/api/brands/${found.id}/models?category=${encodeURIComponent(category || '')}`)
                .then((r) => r.json())
                .then((d) => setModels(d.data || []))
                .catch(() => setModels([]))
                .finally(() => setModelsLoading(false));
        } else {
            setModels([]);
            setModelsLoading(false);
        }
    }, [brand, brands, category]);

    const filterParams = useMemo(() => {
        const p = { limit: 50 };
        if (q) p.q = q;
        if (category) p.category = category;
        if (brand) p.brand = brand;
        if (phoneModel) p.phoneModel = phoneModel;
        if (priceMin) p.priceMin = Number(priceMin);
        if (priceMax) p.priceMax = Number(priceMax);
        if (inStock) p.inStock = true;
        const s = SORTS.find((x) => x.v === sort);
        if (s) p.sort = s.sort;
        Object.entries(attrFilters).forEach(([k, v]) => { if (v) p[k] = v; });
        return p;
    }, [q, category, brand, phoneModel, priceMin, priceMax, inStock, sort, attrFilters]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const d = await fetchProducts(filterParams);
            setProducts(d.data || []);
            setTotal(d.total || 0);
        } catch { setProducts([]); setTotal(0); }
        finally { setLoading(false); }
    }, [filterParams]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        const t = setTimeout(() => {
            const sp = new URLSearchParams();
            if (q) sp.set('q', q);
            if (category) sp.set('category', category);
            if (brand) sp.set('brand', brand);
            if (phoneModel) sp.set('phoneModel', phoneModel);
            if (priceMin) sp.set('priceMin', priceMin);
            if (priceMax) sp.set('priceMax', priceMax);
            if (inStock) sp.set('inStock', 'true');
            if (sort && sort !== 'newest') sp.set('sort', sort);
            const qs = sp.toString();
            const url = qs ? `/shop?${qs}` : '/shop';
            router.replace(url, { scroll: false });
        }, 500);
        return () => clearTimeout(t);
    }, [q, category, brand, phoneModel, priceMin, priceMax, inStock, sort]);

    const handleCategoryChange = (cat) => {
        setCategory(cat);
        setBrand('');
        setPhoneModel('');
        setAttrFilters({});
    };

    const clearFilters = () => {
        setQ(''); setCategory(''); setBrand(''); setPhoneModel('');
        setPriceMin(''); setPriceMax(''); setInStock(false); setSort('newest'); setAttrFilters({});
    };

    const removeFilter = (key) => {
        if (key === 'q') setQ('');
        else if (key === 'category') setCategory('');
        else if (key === 'brand') { setBrand(''); setPhoneModel(''); }
        else if (key === 'phoneModel') setPhoneModel('');
        else if (key === 'price_range') { setPriceMin(''); setPriceMax(''); }
        else if (key === 'inStock') setInStock(false);
        else if (key === 'sort') setSort('newest');
        else setAttrFilters((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };

    const hasActiveFilters = q || category || brand || phoneModel || priceMin || priceMax || inStock || Object.values(attrFilters).some(Boolean);

    const [brandSearch, setBrandSearch] = useState('');
    const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
    const brandRef = useRef(null);

    useEffect(() => {
        const handle = (e) => { if (brandRef.current && !brandRef.current.contains(e.target)) setBrandDropdownOpen(false); };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const filteredBrands = useMemo(() => {
        if (!brandSearch) return brands;
        const s = brandSearch.toLowerCase();
        return brands.filter((b) => b.name.toLowerCase().includes(s));
    }, [brands, brandSearch]);

    const renderAttrFilter = (attrKey) => {
        const options = filterOptions[attrKey] || [];
        const value = attrFilters[attrKey] || '';
        const label = FORM_FIELD_LABELS[attrKey] || attrKey;
        return (
            <div key={attrKey} className="pb-4 border-b border-border last:border-0">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-light mb-2">{label}</h4>
                <select value={value} onChange={(e) => setAttrFilters((prev) => ({ ...prev, [attrKey]: e.target.value }))} className="input-luxe text-xs">
                    <option value="">All {label}</option>
                    {options.map((opt) => <option key={opt.id} value={opt.value}>{opt.label || opt.value}</option>)}
                </select>
            </div>
        );
    };

    const renderFilters = () => {
        const items = [];
        for (const field of filterFields) {
            if (field === 'brand') {
                items.push(
                    <div key="brand" className="pb-4 border-b border-border last:border-0">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-light mb-2">Brand</h4>
                        <div ref={brandRef} className="relative">
                            <button onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
                                className="input-luxe text-xs flex items-center justify-between w-full">
                                <span className={brand ? '' : 'text-text-light'}>{brand || 'All Brands'}</span>
                                <ChevronDown className={`h-3 w-3 transition-transform ${brandDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {brandDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-border bg-surface shadow-lg max-h-56 overflow-hidden">
                                    <div className="p-2 border-b border-border">
                                        <input value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)}
                                            placeholder="Search brands..."
                                            className="w-full border border-border bg-background-light px-2 py-1.5 text-xs outline-none"
                                            autoFocus />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                        <button onClick={() => { setBrand(''); setPhoneModel(''); setBrandDropdownOpen(false); setBrandSearch(''); }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-background-light transition-colors ${!brand ? 'bg-ink text-cream' : ''}`}>
                                            All Brands
                                        </button>
                                        {filteredBrands.map((b) => (
                                            <button key={b.id} onClick={() => { setBrand(b.name); setPhoneModel(''); setBrandDropdownOpen(false); setBrandSearch(''); }}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-background-light transition-colors ${brand === b.name ? 'bg-ink text-cream' : ''}`}>
                                                {b.name}
                                            </button>
                                        ))}
                                        {filteredBrands.length === 0 && (
                                            <p className="px-3 py-2 text-xs text-text-light">No brands found</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            } else if (field === 'model') {
                items.push(
                    <div key="model" className="pb-4 border-b border-border last:border-0">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-light mb-2">Model</h4>
                        <select value={phoneModel} onChange={(e) => setPhoneModel(e.target.value)}
                            disabled={!brand} className={`input-luxe text-xs ${!brand ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            <option value="">{!brand ? 'Select brand first' : modelsLoading ? 'Loading...' : 'All Models'}</option>
                            {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                    </div>
                );
            }
        }
        for (const attrKey of attrKeys) {
            items.push(renderAttrFilter(attrKey));
        }
        return items;
    };

    return (
        <div className="min-h-screen bg-background-light/30">
            <div className="container-luxe py-8 md:py-12">
                <div className="mb-8">
                    <span className="eyebrow">— Our Store</span>
                    <h1 className="mt-3 font-display text-3xl leading-[1.05] tracking-editorial md:text-5xl">
                        {category || 'All Products'}
                    </h1>
                    <p className="mt-2 text-xs text-text-light max-w-lg">
                        {catConfig ? `Browse our collection of ${category.toLowerCase()}.` : 'Browse premium mobile accessories for every device.'}
                    </p>
                </div>

                <div className="overflow-x-auto -mx-4 px-4 mb-8 scrollbar-hide">
                    <div className="flex gap-2 min-w-max pb-2">
                        <button onClick={() => handleCategoryChange('')}
                            className={`whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] border transition-colors ${!category ? 'bg-ink text-cream border-ink' : 'bg-surface text-text-light border-border hover:border-ink'}`}>
                            All
                        </button>
                        {CATEGORIES.map((c) => {
                            const IconComp = ICON_MAP[c.icon];
                            return (
                                <button key={c.id} onClick={() => handleCategoryChange(c.name)}
                                    className={`whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] border transition-colors flex items-center gap-2 ${category === c.name ? 'bg-ink text-cream border-ink' : 'bg-surface text-text-light border-border hover:border-ink'}`}>
                                    {IconComp && <IconComp className="h-3.5 w-3.5" strokeWidth={1.5} />}
                                    {c.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="md:hidden mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center border border-border bg-surface px-3 py-2.5 focus-within:border-ink">
                            <Search className="h-4 w-4 text-text-light shrink-0" />
                            <input value={q} onChange={(e) => setQ(e.target.value)}
                                placeholder="Search..." className="w-full bg-transparent px-2 text-sm outline-none placeholder:text-text-light" />
                        </div>
                        <button onClick={() => setMobileFilterOpen(true)} className="btn-ghost !px-3 !py-2.5 flex items-center gap-2 text-xs">
                            <SlidersHorizontal className="h-4 w-4" /> Filters
                        </button>
                    </div>
                </div>

                {mobileFilterOpen && (
                    <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileFilterOpen(false)}>
                        <div className="absolute inset-0 bg-ink/30" />
                        <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface border-l border-border overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.18em]">Filters</h3>
                                <button onClick={() => setMobileFilterOpen(false)} className="p-1"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="pb-4 border-b border-border">
                                    <SearchBar value={q} onChange={setQ} />
                                </div>
                                <div className="pb-4 border-b border-border">
                                    <label className="flex cursor-pointer items-center gap-2 text-xs">
                                        <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 accent-ink" />
                                        <span>In stock only</span>
                                    </label>
                                </div>
                                {renderFilters()}
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="w-full btn-ghost text-xs">
                                        <RotateCcw className="h-3 w-3" /> Clear all filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
                    <aside className="hidden md:block">
                        <div className="sticky top-28 border border-border bg-surface p-5 max-h-[calc(100vh-8rem)] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="pb-4 border-b border-border">
                                    <SearchBar value={q} onChange={setQ} />
                                </div>
                                <div className="pb-4 border-b border-border">
                                    <label className="flex cursor-pointer items-center gap-2 text-xs">
                                        <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 accent-ink" />
                                        <span>In stock only</span>
                                    </label>
                                </div>
                                {renderFilters()}
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="w-full btn-ghost text-xs">
                                        <RotateCcw className="h-3 w-3" /> Clear all filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </aside>

                    <div className="min-w-0">
                        <div className="hidden md:flex items-center justify-between mb-6">
                            <p className="text-xs text-text-light">{loading ? 'Searching...' : `${total} ${total === 1 ? 'product' : 'products'} found`}</p>
                            <div className="flex items-center gap-3">
                                <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-luxe !py-2 text-xs">
                                    {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <ActiveFilters filters={{ q, category, brand, phoneModel, priceMin, priceMax, inStock, sort, ...attrFilters }} onRemove={removeFilter} onClear={clearFilters} />

                        {loading ? (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i}>
                                        <div className="aspect-[3/4] bg-background-light animate-pulse" />
                                        <div className="mt-3 h-4 w-2/3 bg-background-light animate-pulse" />
                                        <div className="mt-2 h-3 w-1/3 bg-background-light animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="border border-dashed border-border bg-surface p-12 text-center">
                                <h3 className="font-display text-2xl">No products found.</h3>
                                <p className="mt-2 text-xs text-text-light">Try adjusting your search or filter criteria.</p>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="mt-4 btn-ghost text-xs">
                                        <RotateCcw className="h-3 w-3" /> Clear all filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
                                    {products.map((p) => <ProductCard key={p.id || p.slug} p={p} />)}
                                </div>
                                <div className="mt-8 text-center text-xs text-text-light">
                                    Showing {products.length} of {total} products
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="container-luxe py-20"><div className="h-96 bg-background-light animate-pulse" /></div>}>
            <ShopContent />
        </Suspense>
    );
}
