'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useStudio } from '@/context/StudioContext';
import { FONTS } from '@/utils/studio';

const CameraCutout = ({ model }) => {
    if (!model?.cameraCutout) return null;
    const c = model.cameraCutout;
    const isHolePunch = c.w < 10 && c.h < 10 && Math.abs(c.w - c.h) < 2;
    return (
        <div
            className="pointer-events-none absolute z-30"
            style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: `${c.w}%`,
                height: `${c.h}%`,
                borderRadius: isHolePunch ? '50%' : '30%',
                background: isHolePunch
                    ? 'radial-gradient(circle, rgba(0,0,0,0.95) 30%, rgba(20,20,20,0.8) 70%, rgba(0,0,0,0.3) 100%)'
                    : 'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.4) 100%)',
                boxShadow: isHolePunch
                    ? '0 0 0 2px rgba(0,0,0,0.6), inset 0 0 6px rgba(0,0,0,0.8)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.08)'
            }}
        >
            {!isHolePunch && (
                <>
                    <div className="absolute left-[25%] top-[25%] h-[20%] w-[15%] rounded-full bg-black/60 ring-1 ring-white/10" />
                    <div className="absolute right-[25%] top-[20%] h-[18%] w-[15%] rounded-full bg-black/60 ring-1 ring-white/10" />
                    <div className="absolute bottom-[25%] left-[30%] h-[15%] w-[12%] rounded-full bg-black/60 ring-1 ring-white/10" />
                </>
            )}
        </div>
    );
};

const SafeZoneOverlay = ({ model, show }) => {
    if (!model?.safeZone || !show) return null;
    const s = model.safeZone;
    return (
        <div
            className="pointer-events-none absolute z-25 rounded-[13%/7%] border-2 border-dashed border-green-500/40 bg-green-500/5 transition-opacity duration-300"
            style={{
                top: `${s.top}%`,
                bottom: `${s.bottom}%`,
                left: `${s.left}%`,
                right: `${s.right}%`
            }}
        >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold uppercase tracking-[0.15em] text-green-600/60">Safe print area</span>
        </div>
    );
};

const PhoneFrame = ({ material }) => {
    const bezel = material?.bezel || '#1f1f23';
    return (
        <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
                background: `linear-gradient(145deg, ${bezel}cc 0%, ${bezel} 50%, ${bezel}dd 100%)`,
                boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.06), inset 0 0 0 5px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.3)',
                borderRadius: '14% / 8%'
            }}
        >
            <div className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-black/40 ring-1 ring-white/5" />
            <div className="absolute bottom-5 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm" />
        </div>
    );
};

export default function StudioCanvas({ onCapture }) {
    const { form, layers, selectedLayerId, setSelectedLayerId, updateLayer, model, material } = useStudio();
    const containerRef = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [resizing, setResizing] = useState(null);
    const [rotation, setRotation] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [showSafeZone, setShowSafeZone] = useState(false);

    useEffect(() => { setTimeout(() => setLoaded(true), 300); }, []);

    const capture = useCallback(async () => {
        if (!containerRef.current) return null;
        try {
            const html2canvas = (await import('html-to-image')).default;
            const dataUrl = await html2canvas.toPng(containerRef.current, { pixelRatio: 2, backgroundColor: 'transparent' });
            return dataUrl;
        } catch { return null; }
    }, []);

    useEffect(() => {
        if (onCapture) onCapture.current = capture;
    }, [capture, onCapture]);

    const getLayerCenter = (layer) => {
        const rect = containerRef.current.getBoundingClientRect();
        return {
            cx: rect.left + (layer.x / 100) * rect.width,
            cy: rect.top + (layer.y / 100) * rect.height,
            rectW: rect.width,
            rectH: rect.height
        };
    };

    const handlePointerDown = (e, layer) => {
        e.stopPropagation(); e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        setSelectedLayerId(layer.id);
        const { cx, cy, rectW, rectH } = getLayerCenter(layer);
        setDragging({ id: layer.id, pointerId: e.pointerId, startLayerX: layer.x, startLayerY: layer.y, startClientX: e.clientX, startClientY: e.clientY, rectW, rectH });
    };

    const handleResizeStart = (e, layer) => {
        e.stopPropagation(); e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        const { cx, cy } = getLayerCenter(layer);
        const startDist = Math.sqrt(Math.pow(e.clientX - cx, 2) + Math.pow(e.clientY - cy, 2));
        setResizing({ id: layer.id, pointerId: e.pointerId, startScale: layer.scale || 1, startDist: Math.max(startDist, 1), layerCenterX: cx, layerCenterY: cy });
    };

    const handleRotateStart = (e, layer) => {
        e.stopPropagation(); e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        const { cx, cy } = getLayerCenter(layer);
        setRotation({ id: layer.id, pointerId: e.pointerId, startRotation: layer.rotation || 0, layerCenterX: cx, layerCenterY: cy });
    };

    const handlePointerMove = (e) => {
        if (dragging) {
            const dx = ((e.clientX - dragging.startClientX) / dragging.rectW) * 100;
            const dy = ((e.clientY - dragging.startClientY) / dragging.rectH) * 100;
            updateLayer(dragging.id, { x: Math.max(0, Math.min(100, dragging.startLayerX + dx)), y: Math.max(0, Math.min(100, dragging.startLayerY + dy)) });
        }
        if (resizing) {
            const newDist = Math.sqrt(Math.pow(e.clientX - resizing.layerCenterX, 2) + Math.pow(e.clientY - resizing.layerCenterY, 2));
            const factor = newDist / resizing.startDist;
            updateLayer(resizing.id, { scale: Math.round(Math.max(0.3, Math.min(3, resizing.startScale * factor)) * 100) / 100 });
        }
        if (rotation) {
            const angle = Math.atan2(e.clientY - rotation.layerCenterY, e.clientX - rotation.layerCenterX) * (180 / Math.PI) + 90;
            updateLayer(rotation.id, { rotation: Math.round(angle) });
        }
    };

    const handlePointerUp = (e) => {
        if (dragging) { e.currentTarget?.releasePointerCapture?.(dragging.pointerId); }
        if (resizing) { e.currentTarget?.releasePointerCapture?.(resizing.pointerId); }
        if (rotation) { e.currentTarget?.releasePointerCapture?.(rotation.pointerId); }
        setDragging(null); setResizing(null); setRotation(null);
    };

    const getImageFilter = (layer) => {
        if (layer.type !== 'image' || !layer.filters) return {};
        const f = layer.filters;
        const parts = [];
        if (f.brightness !== undefined && f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
        if (f.contrast !== undefined && f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
        if (f.saturation !== undefined && f.saturation !== 100) parts.push(`saturate(${f.saturation}%)`);
        if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
        return parts.length > 0 ? { filter: parts.join(' ') } : {};
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className={`relative mx-auto w-full max-w-[260px] sm:max-w-[320px] max-h-[50vh] sm:max-h-[65vh] lg:max-h-none transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative aspect-[9/19.5] overflow-hidden rounded-[13%/7%] bg-stone-900 shadow-2xl shadow-stone-900/30">
                    <div
                        ref={containerRef}
                        className="relative h-full w-full select-none"
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onClick={(e) => { if (e.target === containerRef.current) setSelectedLayerId(null); }}
                    >
                        <div
                            className="absolute inset-0 transition-colors duration-500"
                            style={{
                                background: form.bgImage
                                    ? `url(${form.bgImage}) center/cover no-repeat`
                                    : form.bgColor
                            }}
                        />

                        <div className="pointer-events-none absolute inset-0 z-20 rounded-[13%/7%]" style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.2)' }} />

                        {layers.map((layer) => {
                            const isSelected = layer.id === selectedLayerId;
                            return (
                                <div
                                    key={layer.id}
                                    onPointerDown={(e) => handlePointerDown(e, layer)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                    className={`absolute z-30 touch-none select-none transition-shadow duration-200 ${isSelected ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black/0' : ''}`}
                                    style={{
                                        left: `${layer.x}%`,
                                        top: `${layer.y}%`,
                                        transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg) scale(${layer.scale || 1})`,
                                        opacity: layer.opacity ?? 1,
                                        cursor: 'move'
                                    }}
                                >
                                    {layer.type === 'text' && (
                                        <div style={{
                                            color: layer.color,
                                            fontSize: `${layer.size}px`,
                                            fontFamily: FONTS.find(f => f.id === layer.font)?.family || 'var(--font-sans)',
                                            fontWeight: layer.bold ? 700 : 500,
                                            textAlign: 'center',
                                            textTransform: layer.uppercase ? 'uppercase' : 'none',
                                            letterSpacing: `${layer.letterSpacing || 0}px`,
                                            whiteSpace: 'nowrap',
                                            textShadow: '0 1px 8px rgba(0,0,0,0.3)'
                                        }}>{layer.text}</div>
                                    )}
                                    {layer.type === 'sticker' && (
                                        <div style={{ fontSize: `${layer.size}px`, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{layer.emoji}</div>
                                    )}
                                    {layer.type === 'image' && (
                                        <img
                                            src={layer.url}
                                            alt=""
                                            style={{ width: `${layer.baseWidth || 120}px`, display: 'block', borderRadius: '4px', ...getImageFilter(layer) }}
                                            draggable={false}
                                        />
                                    )}

                                    {isSelected && (
                                        <>
                                            <button onPointerDown={(e) => handleResizeStart(e, layer)} className="absolute -right-2 -bottom-2 h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow touch-none" aria-label="Resize" />
                                            <button onPointerDown={(e) => handleRotateStart(e, layer)} className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-white bg-stone-800 shadow touch-none" aria-label="Rotate" />
                                        </>
                                    )}
                                </div>
                            );
                        })}

                        <CameraCutout model={model} />
                        <SafeZoneOverlay model={model} show={showSafeZone} />
                        <PhoneFrame material={material} />

                        {layers.length === 0 && !form.bgImage && (
                            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
                                <div className="text-center text-white/30">
                                    <p className="font-display text-lg">Start designing</p>
                                    <p className="mt-1 text-[11px]">Pick a tool from the sidebar →</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                    {model?.label || 'Custom Phone Case'} · {material?.label || 'Select material'}
                </p>
                <button
                    onClick={() => setShowSafeZone((v) => !v)}
                    className={`rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors ${showSafeZone ? 'border-green-500 bg-green-50 text-green-600' : 'border-stone-200 text-stone-400 hover:border-stone-400'}`}
                >
                    Safe zone
                </button>
            </div>
        </div>
    );
}
