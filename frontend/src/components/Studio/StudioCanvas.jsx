'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useStudio } from '@/context/StudioContext';
import { getStickerById, getMaterialById } from '@/utils/studio';

const PhoneFrame = ({ material, phone }) => {
    const finish = material.id;
    const bezel = finish === 'glossy-hardshell' ? '#0a0a0a' : finish === 'saffiano-leather' ? '#3a1d17' : finish === 'aurora-translucent' ? '#9ad7ff' : '#1f1f23';
    return (
        <div
            className="pointer-events-none absolute inset-0"
            style={{
                background: `linear-gradient(135deg, ${bezel} 0%, ${bezel} 100%)`,
                boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.04), inset 0 0 0 6px rgba(0,0,0,0.2), 0 30px 60px -20px rgba(0,0,0,0.5)',
                borderRadius: '14% / 8%'
            }}
        >
            <div className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-black/40" />
            <div className="absolute right-3 top-12 h-12 w-12 rounded-xl bg-black/30" />
            {phone.magSafe && (
                <div className="absolute bottom-4 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border border-white/10 bg-white/5" />
            )}
        </div>
    );
};

export default function StudioCanvas({ onCapture }) {
    const { form, layers, selectedLayerId, setSelectedLayerId, updateLayer, addTextLayer, phone, material } = useStudio();
    const containerRef = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [resizing, setResizing] = useState(null);
    const [rotation, setRotation] = useState(null);

    const capture = useCallback(async () => {
        if (!containerRef.current) return null;
        try {
            const html2canvas = (await import('html-to-image')).default;
            const dataUrl = await html2canvas.toPng(containerRef.current, { pixelRatio: 2, backgroundColor: 'transparent' });
            return dataUrl;
        } catch (e) {
            return null;
        }
    }, []);

    useEffect(() => {
        if (onCapture) onCapture.current = capture;
    }, [capture, onCapture]);

    const startDrag = (e, layer) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedLayerId(layer.id);
        const rect = containerRef.current.getBoundingClientRect();
        const startX = e.clientX || e.touches?.[0]?.clientX || 0;
        const startY = e.clientY || e.touches?.[0]?.clientY || 0;
        setDragging({ id: layer.id, startX, startY, startLayerX: layer.x, startLayerY: layer.y, rect });
    };

    const onPointerMove = (e) => {
        if (dragging) {
            const x = e.clientX || e.touches?.[0]?.clientX || 0;
            const y = e.clientY || e.touches?.[0]?.clientY || 0;
            const dx = ((x - dragging.startX) / dragging.rect.width) * 100;
            const dy = ((y - dragging.startY) / dragging.rect.height) * 100;
            updateLayer(dragging.id, {
                x: Math.max(0, Math.min(100, dragging.startLayerX + dx)),
                y: Math.max(0, Math.min(100, dragging.startLayerY + dy))
            });
        } else if (resizing) {
            const x = e.clientX || e.touches?.[0]?.clientX || 0;
            const y = e.clientY || e.touches?.[0]?.clientY || 0;
            const dx = ((x - resizing.startX) / resizing.rect.width) * 100;
            const dy = ((y - resizing.startY) / resizing.rect.height) * 100;
            const factor = 1 + (dx + dy) / 50;
            const newScale = Math.max(0.3, Math.min(3, resizing.startScale * factor));
            updateLayer(resizing.id, { scale: newScale });
        } else if (rotation) {
            const rect = containerRef.current.getBoundingClientRect();
            const cx = rect.left + (rotation.layer.x / 100) * rect.width;
            const cy = rect.top + (rotation.layer.y / 100) * rect.height;
            const x = e.clientX || e.touches?.[0]?.clientX || 0;
            const y = e.clientY || e.touches?.[0]?.clientY || 0;
            const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI) + 90;
            updateLayer(rotation.id, { rotation: Math.round(angle) });
        }
    };

    const onPointerUp = () => {
        setDragging(null);
        setResizing(null);
        setRotation(null);
    };

    return (
        <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[14%/8%] bg-ink shadow-2xl">
                <div
                    ref={containerRef}
                    className="relative h-full w-full touch-none select-none"
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                    onClick={() => setSelectedLayerId(null)}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background: form.bgImage
                                ? `url(${form.bgImage}) center/cover no-repeat`
                                : form.bgColor
                        }}
                    />

                    <PhoneFrame material={material} phone={phone} />

                    <div className="pointer-events-none absolute inset-0 rounded-[14%/8%]" style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.25)' }} />

                    {layers.map((layer) => {
                        const isSelected = layer.id === selectedLayerId;
                        return (
                            <div
                                key={layer.id}
                                onPointerDown={(e) => startDrag(e, layer)}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                className={`absolute select-none ${isSelected ? 'ring-2 ring-bronze ring-offset-2 ring-offset-ink' : ''}`}
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
                                    <div style={{ fontSize: `${layer.size}px`, lineHeight: 1 }}>{layer.emoji}</div>
                                )}
                                {layer.type === 'image' && (
                                    <img src={layer.url} alt="" style={{ width: `${layer.width}%`, display: 'block' }} draggable={false} />
                                )}

                                {isSelected && (
                                    <>
                                        <button
                                            onPointerDown={(e) => { e.stopPropagation(); setResizing({ id: layer.id, startX: e.clientX, startY: e.clientY, startScale: layer.scale || 1, rect: containerRef.current.getBoundingClientRect() }); }}
                                            className="absolute -right-2 -bottom-2 h-4 w-4 rounded-full border-2 border-cream bg-bronze"
                                            aria-label="Resize"
                                        />
                                        <button
                                            onPointerDown={(e) => { e.stopPropagation(); setRotation({ id: layer.id, layer, startX: e.clientX, startY: e.clientY, startRotation: layer.rotation || 0 }); }}
                                            className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-cream bg-ink"
                                            aria-label="Rotate"
                                        />
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {layers.length === 0 && !form.bgImage && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-cream/40">
                                <p className="font-display text-lg">Tap a tool to start</p>
                                <p className="mt-1 text-xs">Upload · AI · Text · Stickers</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.32em] text-text-light">Live preview · {phone.label}</p>
        </div>
    );
}
