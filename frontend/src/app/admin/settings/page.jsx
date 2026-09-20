'use client';
import { useState, useEffect } from 'react';
import { Truck, Percent, Save, Loader2, ShieldCheck, HelpCircle, CheckCircle2 } from 'lucide-react';
import { adminGetSettings, adminUpdateSettings } from '@/services/adminApi';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/format';

export default function AdminSettingsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        shippingFee: 49,
        freeShippingThreshold: 500,
        defaultGstRate: 18
    });

    useEffect(() => {
        adminGetSettings()
            .then((data) => {
                if (data) {
                    setSettings({
                        shippingFee: Number(data.shippingFee ?? 49),
                        freeShippingThreshold: Number(data.freeShippingThreshold ?? 500),
                        defaultGstRate: Number(data.defaultGstRate ?? 18)
                    });
                }
            })
            .catch(() => {
                toast.error('Failed to load store settings');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (field) => (e) => {
        const val = e.target.value;
        setSettings((prev) => ({
            ...prev,
            [field]: val === '' ? '' : Number(val)
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const shippingFee = Number(settings.shippingFee);
        const freeShippingThreshold = Number(settings.freeShippingThreshold);
        const defaultGstRate = Number(settings.defaultGstRate);

        if (isNaN(shippingFee) || shippingFee < 0) {
            toast.error('Shipping fee must be 0 or higher');
            return;
        }
        if (isNaN(freeShippingThreshold) || freeShippingThreshold < 0) {
            toast.error('Free shipping threshold must be 0 or higher');
            return;
        }
        if (isNaN(defaultGstRate) || defaultGstRate < 0 || defaultGstRate > 100) {
            toast.error('Default GST rate must be between 0% and 100%');
            return;
        }

        setSaving(true);
        try {
            await adminUpdateSettings({
                shippingFee,
                freeShippingThreshold,
                defaultGstRate
            });
            toast.success('Store policies updated successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-text-light">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-bronze mb-2" />
                <p className="text-xs uppercase tracking-[0.18em]">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <span className="eyebrow">— Configuration</span>
                    <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
                        Shipping & <span className="italic-display">Tax Settings</span>
                    </h1>
                    <p className="mt-1 text-xs text-text-light">
                        Configure global delivery costs, free shipping rules, and standard tax rates.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Shipping Configuration Card */}
                <div className="border border-border bg-surface p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink/5 text-ink">
                            <Truck className="h-5 w-5" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="font-display text-lg font-semibold text-ink">Shipping Fees & Thresholds</h2>
                            <p className="text-xs text-text-light">Control customer delivery charges across India</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="label-luxe">
                                Standard Shipping Fee (INR) *
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-text-light font-semibold">
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={settings.shippingFee}
                                    onChange={handleChange('shippingFee')}
                                    className="input-luxe pl-8 tabular-nums rounded-lg"
                                    placeholder="49"
                                />
                            </div>
                            <p className="mt-1.5 text-[11px] text-text-light">
                                Charged on orders when the total subtotal is below the free shipping threshold.
                            </p>
                        </div>

                        <div>
                            <label className="label-luxe">
                                Free Shipping Threshold (INR) *
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-text-light font-semibold">
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={settings.freeShippingThreshold}
                                    onChange={handleChange('freeShippingThreshold')}
                                    className="input-luxe pl-8 tabular-nums rounded-lg"
                                    placeholder="500"
                                />
                            </div>
                            <p className="mt-1.5 text-[11px] text-text-light">
                                Orders with subtotal equal to or exceeding this amount receive 100% free delivery.
                            </p>
                        </div>
                    </div>

                    {/* Live Preview Box */}
                    <div className="mt-6 rounded-lg bg-background-light/50 border border-border p-4 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-text-light">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span>
                                Live Policy: Orders under <strong>{formatINR(settings.freeShippingThreshold || 0)}</strong> pay <strong>{formatINR(settings.shippingFee || 0)}</strong>. Orders above <strong>{formatINR(settings.freeShippingThreshold || 0)}</strong> get <strong>FREE SHIPPING</strong>.
                            </span>
                        </div>
                    </div>
                </div>

                {/* GST Tax Configuration Card */}
                <div className="border border-border bg-surface p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink/5 text-ink">
                            <Percent className="h-5 w-5" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="font-display text-lg font-semibold text-ink">Goods & Services Tax (GST)</h2>
                            <p className="text-xs text-text-light">Set store-wide fallback tax rate</p>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <label className="label-luxe">
                            Default Store GST Rate (%) *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                required
                                value={settings.defaultGstRate}
                                onChange={handleChange('defaultGstRate')}
                                className="input-luxe pr-8 tabular-nums rounded-lg"
                                placeholder="18"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-text-light font-semibold">
                                %
                            </span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-text-light">
                            This rate is applied by default unless an individual product specifies its own custom GST rate.
                        </p>
                    </div>

                    <div className="mt-6 rounded-lg bg-amber-500/5 border border-amber-500/20 p-4 text-xs text-ink/80 flex items-start gap-2.5">
                        <HelpCircle size={16} className="text-bronze shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-ink">Per-Product Custom GST Rates</p>
                            <p className="mt-0.5 text-text-light">
                                You can also customize the GST rate on any individual item when creating or editing products in the <strong>Products</strong> or <strong>Custom Designs</strong> catalogue.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.18em]"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Saving Changes...</span>
                            </>
                        ) : (
                            <>
                                <Save size={15} />
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
