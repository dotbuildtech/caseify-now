'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useStudio } from '@/context/StudioContext';

const PhoneFrame = ({ material, phone }) => {
    const finish = material.id;
    const bezel = finish === 'glossy-hardshell' ? '#0a0a0a' : finish === 'saffiano-leather' ? '#3a1d17' : finish === 'aurora-translucent' ? '#7ec8f8' : '#1f1f23';
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
            <div className="absolute right-4 top-14 h-14 w-14 rounded-2xl bg-black/25 ring-1 ring-white/5 shadow-inner" />
            {phone.magSafe && (
                <div className="absolute bottom-5 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm" />
            )}
        </div>
    );
};

export default function StudioCanvas({ onCapture }) {
    const { form, layers, selectedLayerId, setSelectedLayerId, updateLayer, phone, material } = useStudio();
    const containerRef = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [resizing, setResizing] = useState(null);
    const [rotation, setRotation] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => { setTimeout(() => setLoaded(true), 300); }, []);

    const capture = useCallback(async () => {
        if (!containerRef.current) return null;
        try {
            const html2canvas = (await import('html-to-image')).default;
            const dataUrl = await html2canvas.toPng(containerRef.current, { pixelRatio: 2, backgroundColor: 'transparent' });
            return dataUrl;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        if (onCapture) onCapture.current = capture;
    }, [capture, onCapture]);

    const handlePointerDown = (e, layer) => {
        e.stopPropagation();
        e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        setSelectedLayerId(layer.id);
        const rect = containerRef.current.getBoundingClientRect();
        setDragging({
            id: layer.id,
            pointerId: e.pointerId,
            startLayerX: layer.x,
            startLayerY: layer.y,
            startClientX: e.clientX,
            startClientY: e.clientY,
            rectW: rect.width,
            rectH: rect.height,
            rectLeft: rect.left,
            rectTop: rect.top
        });
    };

    const handleResizeStart = (e, layer) => {
        e.stopPropagation();
        e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        setResizing({
            id: layer.id,
            pointerId: e.pointerId,
            startScale: layer.scale || 1,
            startClientX: e.clientX,
            startClientY: e.clientY,
            rectW: containerRef.current.getBoundingClientRect().width,
            rectH: containerRef.current.getBoundingClientRect().height
        });
    };

    const handleRotateStart = (e, layer) => {
        e.stopPropagation();
        e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        setRotation({
            id: layer.id,
            pointerId: e.pointerId,
            layer,
            startRotation: layer.rotation || 0,
            startClientX: e.clientX,
            startClientY: e.clientY,
            rect: containerRef.current.getBoundingClientRect()
        });
    };

    const handlePointerMove = (e) => {
        if (dragging) {
            const dx = ((e.clientX - dragging.startClientX) / dragging.rectW) * 100;
            const dy = ((e.clientY - dragging.startClientY) / dragging.rectH) * 100;
            updateLayer(dragging.id, {
                x: Math.max(0, Math.min(100, dragging.startLayerX + dx)),
                y: Math.max(0, Math.min(100, dragging.startLayerY + dy))
            });
        }
        if (resizing) {
            const dx = ((e.clientX - resizing.startClientX) / resizing.rectW) * 100;
            const dy = ((e.clientY - resizing.startClientY) / resizing.rectH) * 100;
            const factor = 1 + (dx + dy) / 50;
            updateLayer(resizing.id, { scale: Math.max(0.3, Math.min(3, resizing.startScale * factor)) });
        }
        if (rotation) {
            const rect = rotation.rect;
            const cx = rect.left + (rotation.layer.x / 100) * rect.width;
            const cy = rect.top + (rotation.layer.y / 100) * rect.height;
            const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
            updateLayer(rotation.id, { rotation: Math.round(angle) });
        }
    };

    const handlePointerUp = (e) => {
        if (dragging) { e.currentTarget?.releasePointerCapture?.(dragging.pointerId); }
        if (resizing) { e.currentTarget?.releasePointerCapture?.(resizing.pointerId); }
        if (rotation) { e.currentTarget?.releasePointerCapture?.(rotation.pointerId); }
        setDragging(null);
        setResizing(null);
        setRotation(null);
    };

    return (
        <div className={`relative mx-auto w-full max-w-[320px] transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[13%/7%] bg-stone-900 shadow-2xl shadow-stone-900/30">
                <div
                    ref={containerRef}
                    className="relative h-full w-full touch-none select-none"
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
                                className={`absolute z-30 select-none touch-none transition-shadow duration-200 ${isSelected ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black/0' : ''}`}
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
                                        fontFamily: layer.font === 'serif' ? 'var(--font-display)' : layer.font === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)',
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
                                    <img src={layer.url} alt="" style={{ width: `${layer.width}%`, display: 'block', borderRadius: '4px' }} draggable={false} />
                                )}

                                {isSelected && (
                                    <>
                                        <button
                                            onPointerDown={(e) => handleResizeStart(e, layer)}
                                            className="absolute -right-2 -bottom-2 h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow touch-none"
                                            aria-label="Resize"
                                        />
                                        <button
                                            onPointerDown={(e) => handleRotateStart(e, layer)}
                                            className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-white bg-stone-800 shadow touch-none"
                                            aria-label="Rotate"
                                        />
                                    </>
                                )}
                            </div>
                        );
                    })}

                    <PhoneFrame material={material} phone={phone} />

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
            <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">{phone.label} · {material.label}</p>
        </div>
    );
}
