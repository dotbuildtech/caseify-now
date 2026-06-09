'use client';
import { useState, useEffect } from 'react';
import { CATEGORIES } from '@/utils/constants';
import { adminListCategoryBrands, adminSetCategoryBrands, adminListBrands } from '@/services/adminApi';
import { useToast } from '@/components/ui/Toast';
import { Save, Link2, X } from 'lucide-react';

export default function CategoryBrandsPage() {
    const toast = useToast();
    const [allBrands, setAllBrands] = useState([]);
    const [links, setLinks] = useState([]);
    const [selected, setSelected] = useState({});
    const [saving, setSaving] = useState(false);
    const [changed, setChanged] = useState({});

    useEffect(() => {
        adminListBrands({ isActive: 'true' }).then(setAllBrands).catch(() => {});
        adminListCategoryBrands().then((data) => {
            setLinks(data);
            const map = {};
            data.forEach((l) => {
                if (!map[l.categoryName]) map[l.categoryName] = [];
                map[l.categoryName].push(l.BrandId);
            });
            setSelected(map);
        }).catch(() => {});
    }, []);

    const toggleBrand = (cat, brandId) => {
        setSelected((prev) => {
            const current = prev[cat] || [];
            const next = current.includes(brandId)
                ? current.filter((id) => id !== brandId)
                : [...current, brandId];
            return { ...prev, [cat]: next };
        });
        setChanged((prev) => ({ ...prev, [cat]: true }));
    };

    const selectAll = (cat) => {
        setSelected((prev) => ({ ...prev, [cat]: allBrands.map((b) => b.id) }));
        setChanged((prev) => ({ ...prev, [cat]: true }));
    };

    const clearAll = (cat) => {
        setSelected((prev) => ({ ...prev, [cat]: [] }));
        setChanged((prev) => ({ ...prev, [cat]: true }));
    };

    const saveCategory = async (cat) => {
        setSaving(true);
        try {
            const ids = selected[cat] || [];
            await adminSetCategoryBrands(cat, ids);
            setChanged((prev) => ({ ...prev, [cat]: false }));
            toast.success(`Saved brands for ${cat}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl">Category → Brand Links</h1>
                    <p className="mt-1 text-xs text-text-light">Assign which brands are available for each category</p>
                </div>
            </div>

            {CATEGORIES.map((cat) => {
                const catBrands = selected[cat.name] || [];
                const hasChanged = changed[cat.name];
                return (
                    <div key={cat.name} className="border border-border bg-surface p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-display text-lg">{cat.name}</h3>
                                <p className="text-[11px] text-text-light">{catBrands.length} brand{catBrands.length !== 1 ? 's' : ''} selected</p>
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
                            {allBrands.map((b) => {
                                const isSelected = catBrands.includes(b.id);
                                return (
                                    <button
                                        key={b.id}
                                        onClick={() => toggleBrand(cat.name, b.id)}
                                        className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors text-left ${
                                            isSelected
                                                ? 'bg-ink text-cream border-ink'
                                                : 'border-border bg-cream text-ink hover:border-ink'
                                        }`}
                                    >
                                        {isSelected ? <Link2 className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0 opacity-0" />}
                                        {b.name}
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
