'use client';
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useStudio } from '@/context/StudioContext';
import { FONTS } from '@/utils/studio';
import { Undo2, Redo2 } from 'lucide-react';

const BACK_CAMERAS = {
    iphone: [
        { x: 2.5, y: 6, w: 34, h: 15, type: 'square-3', label: 'iPhone' },
        { x: 2.5, y: 6, w: 42, h: 16, type: 'square-2', label: 'iPhone Dual' },
    ],
    samsung: [
        { x: 2, y: 6, w: 24, h: 28, type: 'vertical-3', label: 'Samsung Triple' },
        { x: 2, y: 6, w: 20, h: 24, type: 'vertical-2', label: 'Samsung Dual' },
    ],
    pixel: [
        { x: 2, y: 6, w: 96, h: 11, type: 'bar', label: 'Pixel Bar' },
    ],
    oneplus: [
        { x: 2, y: 6, w: 28, h: 14, type: 'circle', label: 'OnePlus' },
    ],
    default: [
        { x: 2, y: 6, w: 28, h: 14, type: 'square-2', label: 'Default' },
    ]
};

function getBackCamera(deviceId) {
    if (!deviceId) return BACK_CAMERAS.default[0];
    if (deviceId.startsWith('iphone')) {
        const isPro = deviceId.includes('pro');
        return isPro ? BACK_CAMERAS.iphone[0] : BACK_CAMERAS.iphone[1];
    }
    if (deviceId.startsWith('galaxy')) {
        const isUltra = deviceId.includes('ultra');
        return isUltra ? BACK_CAMERAS.samsung[0] : BACK_CAMERAS.samsung[1];
    }
    if (deviceId.startsWith('pixel')) return BACK_CAMERAS.pixel[0];
    if (deviceId.startsWith('oneplus')) return BACK_CAMERAS.oneplus[0];
    return BACK_CAMERAS.default[0];
}

function getLensType(id) {
    if (!id) return 'default';
    const low = id.toLowerCase();
    if (low.startsWith('apple-iphone') || low.startsWith('iphone')) {
        return low.includes('pro') ? 'square-3' : 'square-2';
    }
    if (low.startsWith('galaxy')) {
        return low.includes('ultra') ? 'vertical-3' : 'vertical-2';
    }
    if (low.startsWith('pixel')) return 'bar';
    if (low.includes('oneplus')) return 'circle';
    return 'default';
}

const CameraBump = ({ model }) => {
    if (!model?.id) return null;

    const templateCutout = model.cameraCutout;
    const lensType = getLensType(model.id);
    const cam = templateCutout
        ? { x: templateCutout.x, y: templateCutout.y, w: templateCutout.w, h: templateCutout.h, type: lensType }
        : getBackCamera(model.id);
    if (!cam) return null;

    const renderLenses = () => {
        if (cam.type === 'square-3') {
            return (
                <>
                    <div className="absolute left-[15%] top-[18%] h-[28%] w-[24%] rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute right-[15%] top-[16%] h-[26%] w-[24%] rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute left-[50%] top-[55%] h-[24%] w-[22%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute right-[18%] bottom-[10%] h-[10%] w-[14%] rounded-sm bg-black/70 ring-1 ring-white/8" />
                </>
            );
        }
        if (cam.type === 'square-2') {
            return (
                <>
                    <div className="absolute left-[20%] top-[22%] h-[32%] w-[26%] rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute right-[20%] top-[20%] h-[30%] w-[26%] rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                </>
            );
        }
        if (cam.type === 'vertical-3') {
            return (
                <>
                    <div className="absolute left-[50%] top-[8%] h-[20%] w-[40%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute left-[50%] top-[36%] h-[20%] w-[40%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute left-[50%] top-[64%] h-[20%] w-[40%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute right-[12%] bottom-[4%] h-[12%] w-[30%] rounded-sm bg-black/70 ring-1 ring-white/8" />
                </>
            );
        }
        if (cam.type === 'vertical-2') {
            return (
                <>
                    <div className="absolute left-[50%] top-[14%] h-[26%] w-[46%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute left-[50%] top-[52%] h-[26%] w-[46%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute right-[10%] bottom-[5%] h-[10%] w-[28%] rounded-sm bg-black/70 ring-1 ring-white/8" />
                </>
            );
        }
        if (cam.type === 'bar') {
            return (
                <>
                    <div className="absolute left-[5%] top-[50%] -translate-y-1/2 h-[55%] w-[7%] rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute left-[16%] top-[50%] -translate-y-1/2 h-[55%] w-[7%] rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute left-[27%] top-[50%] -translate-y-1/2 h-[45%] w-[5%] rounded-sm bg-black/70 ring-1 ring-white/8" />
                </>
            );
        }
        if (cam.type === 'circle') {
            return (
                <>
                    <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 h-[45%] w-[35%] rounded-full bg-black/85 ring-1 ring-white/12 shadow-inner" />
                    <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 h-[30%] w-[22%] rounded-full bg-black/70 ring-1 ring-white/10" />
                </>
            );
        }
        return null;
    };

    return (
        <div
            className="pointer-events-none absolute z-30"
            style={{
                left: `${cam.x}%`,
                top: `${cam.y}%`,
                width: `${cam.w}%`,
                height: `${cam.h}%`,
                borderRadius: cam.type === 'bar' ? '8px' : cam.type === 'circle' ? '50%' : '18% / 28%',
                background: 'linear-gradient(145deg, rgba(180,185,200,0.35) 0%, rgba(140,145,160,0.25) 50%, rgba(100,105,120,0.35) 100%)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)'
            }}
        >
            <div className="absolute inset-0" style={{ borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)' }} />
            <div className="absolute -top-[3px] inset-x-[10%] h-[3px] bg-gradient-to-b from-white/4 to-transparent rounded-t-full" />
            {renderLenses()}
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
                background: `linear-gradient(160deg, ${bezel}11 0%, ${bezel}22 40%, ${bezel}33 100%)`,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.15)',
                borderRadius: '14% / 8%'
            }}
        />
    );
};

const RESIZE_HANDLES = [
    { id: 'nw', cursor: 'nwse-resize', x: -4, y: -4, w: 8, h: 8 },
    { id: 'n', cursor: 'ns-resize', x: '50%', y: -4, w: 8, h: 8, mx: '-50%' },
    { id: 'ne', cursor: 'nesw-resize', right: -4, y: -4, w: 8, h: 8 },
    { id: 'e', cursor: 'ew-resize', right: -4, y: '50%', w: 8, h: 8, my: '-50%' },
    { id: 'se', cursor: 'nwse-resize', right: -4, bottom: -4, w: 8, h: 8 },
    { id: 's', cursor: 'ns-resize', x: '50%', bottom: -4, w: 8, h: 8, mx: '-50%' },
    { id: 'sw', cursor: 'nesw-resize', x: -4, bottom: -4, w: 8, h: 8 },
    { id: 'w', cursor: 'ew-resize', x: -4, y: '50%', w: 8, h: 8, my: '-50%' },
];

export default function StudioCanvas({ onCapture }) {
    const { form, layers, selectedLayerId, setSelectedLayerId, updateLayer, model, material, undo, redo, canUndo, canRedo } = useStudio();
    const containerRef = useRef(null);
    const canvasDimsRef = useRef({ w: 260, h: 563 });
    const [loaded, setLoaded] = useState(false);
    const [showSafeZone, setShowSafeZone] = useState(false);
    const [drag, setDrag] = useState(null);
    const [resize, setResize] = useState(null);
    const [rotationState, setRotationState] = useState(null);
    const prevLayerCount = useRef(layers.length);

    useEffect(() => { setTimeout(() => setLoaded(true), 300); }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) canvasDimsRef.current = { w: width, h: height };
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useLayoutEffect(() => {
        if (layers.length > prevLayerCount.current) {
            const newLayer = layers[layers.length - 1];
            if (newLayer && newLayer._needsCenter) {
                const cw = canvasDimsRef.current.w;
                const ch = canvasDimsRef.current.h;
                const lw = newLayer.w || 120;
                const lh = newLayer.h || 120;
                updateLayer(newLayer.id, { x: Math.round((cw - lw) / 2), y: Math.round((ch - lh) / 2), _needsCenter: undefined });
            }
        }
        prevLayerCount.current = layers.length;
    }, [layers, updateLayer]);

    const capture = useCallback(async () => {
        const container = containerRef.current;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;

        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(rect.width * scale);
        canvas.height = Math.round(rect.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        const loadImg = (url) => new Promise((resolve) => {
            if (!url) { resolve(null); return; }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
        });

        if (form.bgImage) {
            const img = await loadImg(form.bgImage);
            if (img) {
                const ir = img.width / img.height;
                const br = rect.width / rect.height;
                let sx, sy, sw, sh;
                if (ir > br) { sh = img.height; sw = sh * br; sx = (img.width - sw) / 2; sy = 0; }
                else { sw = img.width; sh = sw / br; sx = 0; sy = (img.height - sh) / 2; }
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, rect.width, rect.height);
            }
        } else if (form.bgColor) {
            ctx.fillStyle = form.bgColor;
            ctx.fillRect(0, 0, rect.width, rect.height);
        }

        for (const layer of layers) {
            ctx.save();
            ctx.globalAlpha = layer.opacity ?? 1;
            const x = layer.x || 0, y = layer.y || 0;
            const w = layer.w || 120, h = layer.h || 120;
            const cx = x + w / 2, cy = y + h / 2;
            ctx.translate(cx, cy);
            ctx.rotate((layer.rotation || 0) * Math.PI / 180);
            ctx.translate(-cx, -cy);

            if (layer.type === 'text') {
                const ff = FONTS.find(f => f.id === layer.font)?.family || 'sans-serif';
                const resolved = ff.startsWith('var(') ? 'sans-serif' : ff;
                ctx.fillStyle = layer.color || '#000';
                ctx.font = `${layer.bold ? '700 ' : '500 '}${layer.size || 48}px ${resolved}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                try { ctx.letterSpacing = `${layer.letterSpacing || 0}px`; } catch {}
                const text = layer.uppercase ? (layer.text || '').toUpperCase() : (layer.text || '');
                const words = text.split(' ');
                const lines = [];
                let line = '';
                for (const word of words) {
                    const test = line ? `${line} ${word}` : word;
                    if (ctx.measureText(test).width > w && line) { lines.push(line); line = word; }
                    else { line = test; }
                }
                if (line) lines.push(line);
                const lh = (layer.size || 48) * 1.2;
                const sy = cy - ((lines.length - 1) * lh) / 2;
                lines.forEach((ln, i) => ctx.fillText(ln, cx, sy + i * lh));
            } else if (layer.type === 'sticker') {
                const sz = Math.min(h, w);
                ctx.font = `${sz}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(layer.emoji || '', cx, cy);
            } else if (layer.type === 'image' && layer.url) {
                const img = await loadImg(layer.url);
                if (img) {
                    const f = layer.filters;
                    if (f) {
                        const p = [];
                        if (f.brightness !== undefined && f.brightness !== 100) p.push(`brightness(${f.brightness}%)`);
                        if (f.contrast !== undefined && f.contrast !== 100) p.push(`contrast(${f.contrast}%)`);
                        if (f.saturation !== undefined && f.saturation !== 100) p.push(`saturate(${f.saturation}%)`);
                        if (f.blur > 0) p.push(`blur(${f.blur}px)`);
                        ctx.filter = p.length > 0 ? p.join(' ') : 'none';
                    }
                    ctx.drawImage(img, x, y, w, h);
                    ctx.filter = 'none';
                }
            }
            ctx.restore();
        }

        try { return canvas.toDataURL('image/png'); } catch { return null; }
    }, [form, layers]);

    useEffect(() => {
        if (onCapture) onCapture.current = capture;
    }, [capture, onCapture]);

    const handlePointerDown = (e, layer) => {
        e.stopPropagation(); e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        setSelectedLayerId(layer.id);
        setDrag({ id: layer.id, pointerId: e.pointerId, startX: layer.x, startY: layer.y, clientX: e.clientX, clientY: e.clientY });
    };

    const handleResizeStart = (e, layer, handleId) => {
        e.stopPropagation(); e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        setSelectedLayerId(layer.id);
        setResize({ id: layer.id, handleId, pointerId: e.pointerId, startX: layer.x, startY: layer.y, startW: layer.w, startH: layer.h, clientX: e.clientX, clientY: e.clientY });
    };

    const handleRotateStart = (e, layer) => {
        e.stopPropagation(); e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        const rect = containerRef.current.getBoundingClientRect();
        setRotationState({ id: layer.id, pointerId: e.pointerId, startRotation: layer.rotation || 0, cx: rect.left + layer.x + layer.w / 2, cy: rect.top + layer.y + layer.h / 2 });
    };

    const handlePointerMove = (e) => {
        if (drag) {
            const dx = e.clientX - drag.clientX;
            const dy = e.clientY - drag.clientY;
            updateLayer(drag.id, { x: drag.startX + dx, y: drag.startY + dy });
        }
        if (resize) {
            const dx = e.clientX - resize.clientX;
            const dy = e.clientY - resize.clientY;
            const patch = {};
            const h = resize.handleId;
            if (h.includes('w')) { patch.x = resize.startX + dx; patch.w = resize.startW - dx; }
            if (h.includes('e')) { patch.w = resize.startW + dx; }
            if (h.includes('n')) { patch.y = resize.startY + dy; patch.h = resize.startH - dy; }
            if (h.includes('s')) { patch.h = resize.startH + dy; }
            if (patch.w !== undefined && patch.w < 20) { patch.w = 20; if (h.includes('w')) patch.x = resize.startX + resize.startW - 20; }
            if (patch.h !== undefined && patch.h < 20) { patch.h = 20; if (h.includes('n')) patch.y = resize.startY + resize.startH - 20; }
            updateLayer(resize.id, patch);
        }
        if (rotationState) {
            const angle = Math.atan2(e.clientY - rotationState.cy, e.clientX - rotationState.cx) * (180 / Math.PI) + 90;
            updateLayer(rotationState.id, { rotation: Math.round(angle) });
        }
    };

    const handlePointerUp = (e) => {
        if (drag) { e.currentTarget?.releasePointerCapture?.(drag.pointerId); }
        if (resize) { e.currentTarget?.releasePointerCapture?.(resize.pointerId); }
        if (rotationState) { e.currentTarget?.releasePointerCapture?.(rotationState.pointerId); }
        setDrag(null); setResize(null); setRotationState(null);
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
        <div className="flex flex-col items-center w-full overflow-hidden mx-auto max-w-[180px] sm:max-w-[220px] lg:max-w-[260px]">
            <div className={`relative w-full transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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

                        <div className="pointer-events-none absolute inset-0 z-20 rounded-[13%/7%]" style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.08)' }} />

                        {layers.map((layer) => {
                            const isSelected = layer.id === selectedLayerId;
                            return (
                                <div
                                    key={layer.id}
                                    className={`absolute z-30 touch-none select-none ${isSelected ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black/0' : ''}`}
                                    style={{
                                        left: `${layer.x}px`,
                                        top: `${layer.y}px`,
                                        width: `${layer.w || 120}px`,
                                        height: `${layer.h || 120}px`,
                                        transform: `rotate(${layer.rotation || 0}deg)`,
                                        opacity: layer.opacity ?? 1,
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 cursor-move"
                                        onPointerDown={(e) => handlePointerDown(e, layer)}
                                        onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
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
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                lineHeight: 1.2,
                                                textShadow: '0 1px 4px rgba(0,0,0,0.25)'
                                            }}>{layer.text}</div>
                                        )}
                                        {layer.type === 'sticker' && (
                                            <div className="flex items-center justify-center h-full w-full" style={{ fontSize: `${Math.min(layer.h || 60, layer.w || 60)}px`, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{layer.emoji}</div>
                                        )}
                                        {layer.type === 'image' && (
                                            <img
                                                src={layer.url}
                                                alt=""
                                                className="h-full w-full object-contain"
                                                style={{ ...getImageFilter(layer) }}
                                                draggable={false}
                                            />
                                        )}
                                    </div>

                                    {isSelected && (
                                        <>
                                            {RESIZE_HANDLES.map((h) => (
                                                <div
                                                    key={h.id}
                                                    onPointerDown={(e) => handleResizeStart(e, layer, h.id)}
                                                    className="absolute z-40 rounded-full border-2 border-white bg-red-500 shadow touch-none"
                                                    style={{
                                                        cursor: h.cursor,
                                                        left: h.x ?? undefined,
                                                        right: h.right ?? undefined,
                                                        top: h.y ?? undefined,
                                                        bottom: h.bottom ?? undefined,
                                                        width: h.w,
                                                        height: h.h,
                                                        transform: `translate(${h.mx || '0'}, ${h.my || '0'})`,
                                                        margin: 0,
                                                    }}
                                                />
                                            ))}
                                            <div
                                                onPointerDown={(e) => handleRotateStart(e, layer)}
                                                className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-40 h-4 w-4 rounded-full border-2 border-white bg-stone-800 shadow cursor-grab active:cursor-grabbing touch-none"
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        })}

                        <CameraBump model={model} />
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

            <div className="mt-3 flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <Undo2 className="h-3 w-3" /> Undo
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <Redo2 className="h-3 w-3" /> Redo
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <p className="truncate text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                        {model?.label || 'Custom'} · {material?.label || 'Material'}
                    </p>
                    <button
                        onClick={() => setShowSafeZone((v) => !v)}
                        className={`rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] transition-colors ${showSafeZone ? 'border-green-500 bg-green-50 text-green-600' : 'border-stone-200 text-stone-400 hover:border-stone-400'}`}
                    >
                        Safe zone
                    </button>
                </div>
            </div>
        </div>
    );
}