'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus, Truck, ShieldCheck, Heart, ShoppingBag, Check, AlertCircle } from 'lucide-react';
import { fetchProductById, fetchProducts } from '@/services/productApi';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/utils/format';
import ProductCard, { getProductImage, getProductPrice, getProductOriginalPrice } from '@/components/product/ProductCard';
import { isDeviceSpecificCategory } from '@/utils/constants';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';

export default function ProductPage() {
    const { id } = useParams();
    const router = useRouter();
    const { addItem, setDrawerOpen } = useCart();
    const { user, loading: authLoading } = useAuth();
    const toast = useToast();
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [qty, setQty] = useState(1);
    const [activeImg, setActiveImg] = useState(0);
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchProductById(id)
            .then((d) => { if (mounted) { setProduct(d?.data || d); setActiveImg(0); } })
            .catch(() => { if (mounted) setProduct(null); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [id]);

    useEffect(() => {
        if (!product?.category) return;
        let mounted = true;
        fetchProducts({ category: product.category, limit: 5 })
            .then((d) => {
                if (!mounted) return;
                const list = (d.data || []).filter((p) => (p.id || p.slug) !== (product.id || product.slug)).slice(0, 4);
                setRelated(list);
            })
            .catch(() => { if (mounted) setRelated([]); });
        return () => { mounted = false; };
    }, [product?.id, product?.category, product?.slug]);

    const handleAdd = async () => {
        if (authLoading) return;
        if (!user) {
            router.push('/login?redirect=/product/' + id);
            return;
        }
        if (!product) return;
        try {
            setAdding(true);
            await addItem(product.id, qty);
            toast.success('Added to cart');
            setDrawerOpen(true);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to add');
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="container-luxe py-20">
                <div className="grid gap-10 md:grid-cols-2">
                    <div className="aspect-square bg-background-light animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-6 w-1/3 bg-background-light animate-pulse" />
                        <div className="h-10 w-3/4 bg-background-light animate-pulse" />
                        <div className="h-8 w-1/4 bg-background-light animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }
    if (!product) {
        return <div className="container-luxe py-20 text-center"><h1 className="font-display text-3xl">Product not found</h1></div>;
    }

    const images = Array.isArray(product.images) && product.images.length
        ? product.images.map((i) => typeof i === 'string' ? i : i?.url).filter(Boolean)
        : [getProductImage(product)].filter(Boolean);
    const fallbackImg = 'https://images.unsplash.com/photo-1526738549149-8e07ead6a224?auto=format&fit=crop&w=800&q=70';
    if (!images.length) images.push(fallbackImg);

    const sale = getProductPrice(product);
    const original = getProductOriginalPrice(product);
    const inStock = product.stock > 0;
    const lowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

    return (
        <div className="container-luxe py-10 md:py-16">
            <div className="grid gap-10 md:grid-cols-2 md:gap-16">
                <div>
                    <div className="relative aspect-square overflow-hidden bg-background-light">
                        <SmartImage
                            src={images[activeImg]}
                            alt={product.name}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                        />
                        {lowStock && (
                            <span className="absolute right-3 top-3 z-10 bg-ink/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cream">
                                Only {product.stock} left
                            </span>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="mt-4 grid grid-cols-5 gap-2">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImg(i)}
                                    className={`relative aspect-square overflow-hidden border-2 ${i === activeImg ? 'border-ink' : 'border-transparent'}`}
                                >
                                    <SmartImage src={img} alt="" fill sizes="100px" className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <span className="eyebrow">{product.category}</span>
                    <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
                    {(product.brand || product.phoneModel) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-light">
                            {product.brand && <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium">{product.brand}</span>}
                            {product.phoneModel && <span className="flex items-center gap-1 text-[11px]">
                                <span className="text-text-light/60">Compatible:</span> {product.phoneModel}
                            </span>}
                        </div>
                    )}
                    {isDeviceSpecificCategory(product.category) && (
                        <p className="mt-2 text-[11px] text-text-light/60 italic">This product is designed for specific devices. Please ensure compatibility before purchasing.</p>
                    )}

                    <div className="mt-6 flex items-baseline gap-3">
                        <span className="font-display text-3xl font-semibold tabular-nums">{formatINR(sale)}</span>
                        {original && <span className="text-lg text-text-light line-through tabular-nums">{formatINR(original)}</span>}
                        {original && (
                            <span className="bg-bronze px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cream">
                                Save {Math.round((1 - sale / original) * 100)}%
                            </span>
                        )}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                        {inStock ? (
                            <span className="flex items-center gap-1 text-success"><Check className="h-3.5 w-3.5" /> In stock</span>
                        ) : (
                            <span className="flex items-center gap-1 text-error"><AlertCircle className="h-3.5 w-3.5" /> Out of stock</span>
                        )}
                        {product.sku && <span className="text-text-light">· SKU: {product.sku}</span>}
                    </div>

                    <p className="mt-6 text-sm leading-relaxed text-text-light md:text-base">{product.description}</p>

                    <div className="mt-8">
                        <label className="label-luxe">Quantity</label>
                        <div className="inline-flex items-center border border-border">
                            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 text-ink hover:bg-background-light"><Minus className="h-4 w-4 mx-auto" /></button>
                            <span className="h-12 w-14 text-center text-sm font-semibold tabular-nums leading-[3rem]">{qty}</span>
                            <button onClick={() => setQty((q) => Math.min(99, q + 1))} className="h-12 w-12 text-ink hover:bg-background-light"><Plus className="h-4 w-4 mx-auto" /></button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={handleAdd}
                            disabled={adding || !inStock}
                            className="btn-primary flex-1 disabled:opacity-50"
                        >
                            {!inStock ? 'Out of stock' : adding ? 'Adding...' : (<><ShoppingBag className="h-3 w-3" /> Add to Cart</>)}
                        </button>
                        <Link href="/customize" className="btn-secondary">Customize</Link>
                    </div>

                    <div className="mt-10 grid grid-cols-3 gap-3 border-t border-border pt-8">
                        {[
                            { Icon: Truck, t: 'Free Shipping', s: 'Above ₹500' },
                            { Icon: ShieldCheck, t: 'Secure Payment', s: 'UPI & Card' },
                            { Icon: Heart, t: 'Easy Returns', s: '30 days' }
                        ].map(({ Icon, t, s }) => (
                            <div key={t} className="text-center">
                                <Icon className="mx-auto h-5 w-5 text-ink" strokeWidth={1.25} />
                                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em]">{t}</p>
                                <p className="mt-0.5 text-[10px] text-text-light">{s}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {related.length > 0 && (
                <section className="mt-20 md:mt-28">
                    <span className="eyebrow">— You may also like</span>
                    <h2 className="mt-4 font-display text-3xl md:text-4xl">
                        Similar products <span className="italic-display">you might love</span>.
                    </h2>
                    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                        {related.map((p) => <ProductCard key={p.id || p.slug} p={p} />)}
                    </div>
                </section>
            )}
        </div>
    );
}
