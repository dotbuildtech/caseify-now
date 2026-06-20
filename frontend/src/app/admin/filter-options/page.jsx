'use client';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
    adminListFilterOptions,
    adminCreateFilterOption,
    adminUpdateFilterOption,
    adminDeleteFilterOption
} from '@/services/adminApi';

const FILTER_GROUPS = [
    { key: 'protectorType', label: 'Protector Types', desc: 'Screen protector types (Tempered Glass, Privacy Glass, etc.)' },
    { key: 'connectorType', label: 'Charger Connector Types', desc: 'Charger connector types (USB-A, USB-C, Lightning)' },
    { key: 'chargingSpeed', label: 'Charger Wattages', desc: 'Charging speeds/wattages (10W, 18W, 20W, etc.)' },
    { key: 'cableType', label: 'Cable Types', desc: 'Cable categories (Charging Cable, Data Cable, OTG Cable, etc.)' },
    { key: 'cableConnector', label: 'Cable Connectors', desc: 'Cable connector types (USB-A to Type-C, Type-C to Type-C, etc.)' },
    { key: 'earphoneType', label: 'Earphone Types', desc: 'Earphone/earbud categories (Wired, TWS, Neckband, Over-Ear)' },
    { key: 'capacity', label: 'Power Bank Capacities', desc: 'Power bank capacities (5000mAh, 10000mAh, etc.)' }
];

const GROUP_MAP = Object.fromEntries(FILTER_GROUPS.map((g) => [g.key, g]));

export default function FilterOptionsPage() {
    const toast = useToast();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [newValues, setNewValues] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const loadOptions = async () => {
        setLoading(true);
        try {
            const data = await adminListFilterOptions();
            setOptions(data);
        } catch {
            toast.error('Failed to load filter options');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOptions(); }, []);

    const grouped = useMemo(() => {
        const map = {};
        for (const g of FILTER_GROUPS) {
            map[g.key] = options.filter((o) => o.key === g.key);
        }
        return map;
    }, [options]);

    const handleAdd = async (key) => {
        const value = newValues[key]?.trim();
        if (!value) return;
        try {
            await adminCreateFilterOption({ key, value, label: value });
            toast.success('Added');
            setNewValues((prev) => ({ ...prev, [key]: '' }));
            loadOptions();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add');
        }
    };

    const handleUpdate = async (id) => {
        if (!editValue.trim()) return;
        try {
            await adminUpdateFilterOption(id, { value: editValue.trim(), label: editValue.trim() });
            toast.success('Updated');
            setEditingId(null);
            setEditValue('');
            loadOptions();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this filter option?')) return;
        try {
            await adminDeleteFilterOption(id);
            toast.success('Deleted');
            loadOptions();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const startEdit = (opt) => {
        setEditingId(opt.id);
        setEditValue(opt.value);
    };

    const toggleGroup = (key) => {
        setExpandedGroup(expandedGroup === key ? null : key);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h1 className="font-display text-2xl">Filter Options</h1>
                <p className="text-xs text-text-light">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-2xl">Filter Options</h1>
                <p className="mt-1 text-xs text-text-light">Manage dynamic filter values for all categories</p>
            </div>

            <div className="space-y-4">
                {FILTER_GROUPS.map((group) => {
                    const groupOptions = grouped[group.key] || [];
                    const isExpanded = expandedGroup === group.key;
                    return (
                        <div key={group.key} className="border border-border bg-surface">
                            <button
                                onClick={() => toggleGroup(group.key)}
                                className="flex w-full items-center justify-between p-4 hover:bg-background-light/50 transition-colors"
                            >
                                <div className="text-left">
                                    <h3 className="font-display text-base">{group.label}</h3>
                                    <p className="mt-0.5 text-[11px] text-text-light">{group.desc}</p>
                                    <span className="mt-1 inline-block text-[10px] text-text-light uppercase tracking-wider">
                                        {groupOptions.length} option{groupOptions.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-text-light" /> : <ChevronDown className="h-4 w-4 text-text-light" />}
                            </button>

                            {isExpanded && (
                                <div className="border-t border-border p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            value={newValues[group.key] || ''}
                                            onChange={(e) => setNewValues((prev) => ({ ...prev, [group.key]: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(group.key); } }}
                                            placeholder="Add new option..."
                                            className="input-luxe flex-1"
                                        />
                                        <button
                                            onClick={() => handleAdd(group.key)}
                                            disabled={!newValues[group.key]?.trim()}
                                            className="btn-primary !px-4 disabled:opacity-50"
                                        >
                                            <Plus className="h-4 w-4" /> Add
                                        </button>
                                    </div>

                                    {groupOptions.length === 0 ? (
                                        <p className="text-xs text-text-light py-4 text-center">No options yet. Add one above.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {groupOptions.map((opt) => (
                                                <div key={opt.id} className="flex items-center justify-between group px-3 py-2 border border-border bg-background-light/30">
                                                    {editingId === opt.id ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <input
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(opt.id); if (e.key === 'Escape') { setEditingId(null); } }}
                                                                className="input-luxe flex-1 text-sm"
                                                                autoFocus
                                                            />
                                                            <button onClick={() => handleUpdate(opt.id)} className="p-1 text-success hover:text-success/80"><Check className="h-4 w-4" /></button>
                                                            <button onClick={() => setEditingId(null)} className="p-1 text-text-light hover:text-ink"><X className="h-4 w-4" /></button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-sm">{opt.label || opt.value}</span>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEdit(opt)} className="p-1.5 text-text-light hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                                                                <button onClick={() => handleDelete(opt.id)} className="p-1.5 text-text-light hover:text-error"><Trash2 className="h-3.5 w-3.5" /></button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
