'use client';
import { useState, useEffect } from 'react';
import { CATEGORIES } from '@/utils/constants';
import {
    adminListCategoryBrands, adminSetCategoryBrands, adminListBrands,
    adminListCategoryMaterials, adminSetCategoryMaterials, adminListMaterials
} from '@/services/adminApi';
import { useToast } from '@/components/ui/Toast';
import { Save, Link2, X, Layers } from 'lucide-react';

export default function CategoryBrandsPage() {
    const toast = useToast();
    const [tab, setTab] = useState('brands');
    const [allBrands, setAllBrands] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);
    const [brandSelected, setBrandSelected] = useState({});
    const [materialSelected, setMaterialSelected] = useState({});
    const [saving, setSaving] = useState(false);
    const [brandChanged, setBrandChanged] = useState({});
    const [materialChanged, setMaterialChanged] = useState({});

    useEffect(() => {
        adminListBrands({ isActive: 'true' }).then(setAllBrands).catch(() => toast.error('Failed to load brands'));
        adminListMaterials({ isActive: 'true' }).then(setAllMaterials).catch(() => toast.error('Failed to load materials'));
        adminListCategoryBrands().then((data) => {
            const map = {};
            data.forEach((l) => {
                if (!map[l.categoryName]) map[l.categoryName] = [];
                map[l.categoryName].push(l.BrandId);
            });
            setBrandSelected(map);
        }).catch(() => toast.error('Failed to load category brands'));
        adminListCategoryMaterials().then((data) => {
            const map = {};
            data.forEach((l) => {
                if (!map[l.categoryName]) map[l.categoryName] = [];
                map[l.categoryName].push(l.MaterialId);
            });
            setMaterialSelected(map);
        }).catch(() => toast.error('Failed to load category materials'));
    }, []);

    const toggleBrand = (cat, id) => {
        setBrandSelected((prev) => {
            const cur = prev[cat] || [];
            return { ...prev, [cat]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
        });
        setBrandChanged((prev) => ({ ...prev, [cat]: true }));
    };

    const toggleMaterial = (cat, id) => {
        setMaterialSelected((prev) => {
            const cur = prev[cat] || [];
            return { ...prev, [cat]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
        });
        setMaterialChanged((prev) => ({ ...prev, [cat]: true }));
    };

    const selectAll = (cat) => {
        const items = tab === 'brands' ? allBrands : allMaterials;
        if (tab === 'brands') {
            setBrandSelected((prev) => ({ ...prev, [cat]: items.map((i) => i.id) }));
            setBrandChanged((prev) => ({ ...prev, [cat]: true }));
        } else {
            setMaterialSelected((prev) => ({ ...prev, [cat]: items.map((i) => i.id) }));
            setMaterialChanged((prev) => ({ ...prev, [cat]: true }));
        }
    };

    const clearAll = (cat) => {
        if (tab === 'brands') {
            setBrandSelected((prev) => ({ ...prev, [cat]: [] }));
            setBrandChanged((prev) => ({ ...prev, [cat]: true }));
        } else {
            setMaterialSelected((prev) => ({ ...prev, [cat]: [] }));
            setMaterialChanged((prev) => ({ ...prev, [cat]: true }));
        }
    };

    const saveCategory = async (cat) => {
        setSaving(true);
        try {
            if (tab === 'brands') {
                await adminSetCategoryBrands(cat, brandSelected[cat] || []);
                setBrandChanged((prev) => ({ ...prev, [cat]: false }));
                toast.success(`Saved brands for ${cat}`);
            } else {
                await adminSetCategoryMaterials(cat, materialSelected[cat] || []);
                setMaterialChanged((prev) => ({ ...prev, [cat]: false }));
                toast.success(`Saved materials for ${cat}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const items = tab === 'brands' ? allBrands : allMaterials;
    const selected = tab === 'brands' ? brandSelected : materialSelected;
    const changed = tab === 'brands' ? brandChanged : materialChanged;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl">Category Links</h1>
                    <p className="mt-1 text-xs text-text-light">Assign brands and materials to each category</p>
                </div>
            </div>

            <div className="flex items-center gap-1 border-b border-border">
                <button onClick={() => setTab('brands')}
                    className={`px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] border-b-2 transition-colors ${tab === 'brands' ? 'border-ink text-ink' : 'border-transparent text-text-light hover:text-ink'}`}>
                    <Link2 className="h-3.5 w-3.5 inline mr-1.5" /> Brands
                </button>
                <button onClick={() => setTab('materials')}
                    className={`px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] border-b-2 transition-colors ${tab === 'materials' ? 'border-ink text-ink' : 'border-transparent text-text-light hover:text-ink'}`}>
                    <Layers className="h-3.5 w-3.5 inline mr-1.5" /> Materials
                </button>
            </div>

            {CATEGORIES.map((cat) => {
                const catSelected = selected[cat.name] || [];
                const hasChanged = changed[cat.name];
                return (
                    <div key={cat.name} className="border border-border bg-surface p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-display text-lg">{cat.name}</h3>
                                <p className="text-[11px] text-text-light">{catSelected.length} {tab === 'brands' ? 'brand' : 'material'}{catSelected.length !== 1 ? 's' : ''} selected</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => selectAll(cat.name)} className="text-[11px] underline underline-offset-2 hover:text-ink text-text-light">Select all</button>
                                <span className="text-text-light">|</span>
                                <button onClick={() => clearAll(cat.name)} className="text-[11px] underline underline-offset-2 hover:text-ink text-text-light">Clear</button>
                                <button
                                    onClick={() => saveCategory(cat.name)}
                                    disabled={saving || !hasChanged}
                                    className={`btn-primary text-xs !py-1.5 ${!hasChanged ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {items.map((item) => {
                                const isSelected = catSelected.includes(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => tab === 'brands' ? toggleBrand(cat.name, item.id) : toggleMaterial(cat.name, item.id)}
                                        className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors text-left ${
                                            isSelected
                                                ? 'bg-ink text-cream border-ink'
                                                : 'border-border bg-cream text-ink hover:border-ink'
                                        }`}
                                    >
                                        {isSelected
                                            ? (tab === 'brands' ? <Link2 className="h-3 w-3 shrink-0" /> : <Layers className="h-3 w-3 shrink-0" />)
                                            : <X className="h-3 w-3 shrink-0 opacity-0" />}
                                        {item.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
