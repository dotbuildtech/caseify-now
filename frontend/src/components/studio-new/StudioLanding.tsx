'use client';
import { useState, useEffect } from 'react';
import { useStudioStore } from '@/store/studioStore';
import { fetchBrands, fetchModelsByBrand, fetchStudioProductsByModel } from '@/services/studioApi';
import { adminGetTemplateByProductId } from '@/services/adminApi';
import { formatINR, cn } from '@/lib/utils';
import { ChevronLeft, Smartphone, Package, Sparkles, Percent } from 'lucide-react';

interface BrandItem {
  id: number;
  name: string;
  slug: string;
  logo?: string;
}

interface ModelItem {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

interface ProductItem {
  id: number;
  name: string;
  description?: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  discount?: string;
  studioModelId: number;
  Material?: { id: number; name: string; slug: string; price: number };
}

function getDiscountPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

export default function StudioLanding() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const setBrand = useStudioStore((s) => s.setBrand);
  const setModelId = useStudioStore((s) => s.setModelId);
  const setSelectedProduct = useStudioStore((s) => s.setSelectedProduct);
  const setBackgroundImage = useStudioStore((s) => s.setBackgroundImage);
  const resetCanvas = useStudioStore((s) => s.resetCanvas);
  const enterStudio = useStudioStore((s) => s.enterStudio);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBrands();
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
          setBrands(data as BrandItem[]);
        } else if (Array.isArray(data)) {
          setBrands(data.map((name: string) => ({ id: 0, name, slug: name.toLowerCase(), logo: '' })));
        }
      } catch {
        setBrands([]);
      }
      setLoading(false);
    })();
  }, []);

  const handleBrandClick = async (brand: BrandItem) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setProducts([]);
    setModelsLoading(true);
    try {
      const data = await fetchModelsByBrand(brand.name);
      setModels(data || []);
    } catch {
      setModels([]);
    }
    setModelsLoading(false);
  };

  const handleModelClick = async (model: ModelItem) => {
    setSelectedModel(model);
    setProductsLoading(true);
    try {
      const data = await fetchStudioProductsByModel(model.id);
      setProducts(data || []);
    } catch {
      setProducts([]);
    }
    setProductsLoading(false);
  };

  const handleSelectProduct = async (product: ProductItem) => {
    setSelectedProduct(product);
    setBrand(selectedBrand?.name || null);
    setModelId(selectedModel?.slug || null);
    resetCanvas();
    try {
      const store = useStudioStore;
      store.getState().setTemplateRegionsLoading(true);
      const template = await adminGetTemplateByProductId(product.id);
      if (template?.editableAreas) {
        store.getState().setEditableRegions(template.editableAreas);
        store.getState().setTemplateOriginalDimensions(
          template.originalWidth || 3000,
          template.originalHeight || 3000
        );
        if (template.visibleBounds) {
          store.getState().setVisibleBounds(template.visibleBounds);
        } else {
          store.getState().setVisibleBounds(null);
        }
        if (template.templateImage) {
          setBackgroundImage(template.templateImage);
        }
      } else {
        store.getState().setEditableRegions([]);
        store.getState().setVisibleBounds(null);
      }
    } catch {
      useStudioStore.getState().setEditableRegions([]);
    }
    enterStudio();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          {(selectedBrand || selectedModel) && (
            <button onClick={() => { if (selectedModel) { setSelectedModel(null); setProducts([]); } else { setSelectedBrand(null); setModels([]); } }} className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Customize Your Case</h1>
            <p className="text-xs text-muted-foreground">
              {!selectedBrand && 'Choose your phone brand'}
              {selectedBrand && !selectedModel && `Select ${selectedBrand.name} model`}
              {selectedBrand && selectedModel && 'Choose a template to customize'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* BRAND GRID */}
        {!selectedBrand && (
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {brands.map((brand) => (
                <button
                  key={brand.id || brand.slug}
                  onClick={() => handleBrandClick(brand)}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-accent/60 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/10 transition-all duration-300 group-hover:bg-accent">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-2.5" />
                    ) : (
                      <Smartphone className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight group-hover:text-primary transition-colors">{brand.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* MODEL GRID */}
        {selectedBrand && !selectedModel && (
          <section>
            {modelsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No models found for {selectedBrand.name}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelClick(model)}
                    className="group flex flex-col items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative w-full aspect-[4/5] rounded-xl bg-gradient-to-br from-accent/50 via-accent/30 to-accent/10 flex items-center justify-center overflow-hidden ring-1 ring-border/50 group-hover:ring-primary/20 transition-all duration-300">
                      {model.image ? (
                        <img src={model.image} alt={model.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-400" />
                      ) : (
                        <Smartphone className="h-10 w-10 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                      )}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight group-hover:text-primary transition-colors">{model.name}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PRODUCT / TEMPLATE GRID */}
        {selectedBrand && selectedModel && (
          <section>
            {productsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No templates available for this model yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.map((product) => {
                  const discountPct = getDiscountPercent(product.price, product.compareAtPrice);
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="group text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="relative aspect-[4/5] bg-accent/30 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        {discountPct && (
                          <span className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md">
                            <Percent className="h-2.5 w-2.5" /> {discountPct}% OFF
                          </span>
                        )}
                        {product.Material && (
                          <span className="absolute top-2.5 right-2.5 z-10 bg-background/90 backdrop-blur-sm text-[10px] font-medium px-2 py-0.5 rounded-md text-muted-foreground">
                            {product.Material.name}
                          </span>
                        )}
                        {!discountPct && !product.compareAtPrice && (
                          <span className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-1 rounded-lg shadow-sm">
                            <Sparkles className="h-2.5 w-2.5" /> New
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 space-y-1.5">
                        <p className="text-sm font-semibold truncate">{product.name}</p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-base font-bold tabular-nums">{formatINR(product.price)}</span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-xs text-muted-foreground line-through tabular-nums">{formatINR(product.compareAtPrice)}</span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{product.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
