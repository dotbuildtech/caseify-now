'use client';
import { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { toPng, toCanvas } from 'html-to-image';
import { useStudioStore } from '@/store/studioStore';
import CameraCutout from './CameraCutout';
import SafeZoneOverlay from './SafeZoneOverlay';
import TemplateRenderer from '@/components/shared/TemplateRenderer';

import { cn } from '@/lib/utils';
import { FONTS } from '@/lib/fonts';

const RESIZE_HANDLES = [
  { id: 'nw', cursor: 'nwse-resize', x: -5, y: -5, w: 10, h: 10 },
  { id: 'n', cursor: 'ns-resize', x: '50%', y: -5, w: 10, h: 10, mx: '-50%' },
  { id: 'ne', cursor: 'nesw-resize', right: -5, y: -5, w: 10, h: 10 },
  { id: 'e', cursor: 'ew-resize', right: -5, y: '50%', w: 10, h: 10, my: '-50%' },
  { id: 'se', cursor: 'nwse-resize', right: -5, bottom: -5, w: 10, h: 10 },
  { id: 's', cursor: 'ns-resize', x: '50%', bottom: -5, w: 10, h: 10, mx: '-50%' },
  { id: 'sw', cursor: 'nesw-resize', x: -5, bottom: -5, w: 10, h: 10 },
  { id: 'w', cursor: 'ew-resize', x: -5, y: '50%', w: 10, h: 10, my: '-50%' },
];

interface DragState { id: string; startX: number; startY: number; clientX: number; clientY: number; }
interface ResizeState { id: string; handleId: string; startX: number; startY: number; startW: number; startH: number; clientX: number; clientY: number; }
interface RotState { id: string; startRotation: number; cx: number; cy: number; }

export default function StudioCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const captureNodeRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const rotRef = useRef<RotState | null>(null);

  const store = useStudioStore;
  const layers = useStudioStore((s) => s.layers);
  const selectedLayerIds = useStudioStore((s) => s.selectedLayerIds);
  const background = useStudioStore((s) => s.background);
  const settings = useStudioStore((s) => s.settings);
  const modelId = useStudioStore((s) => s.modelId);
  const template = useStudioStore((s) => s.template);
  const phoneTemplate = useStudioStore((s) => s.phoneTemplate);
  const selectLayer = useStudioStore((s) => s.selectLayer);
  const updateLayer = useStudioStore((s) => s.updateLayer);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const setCaptureRef = useStudioStore((s) => s.setCaptureRef);
  const setCaptureThumbRef = useStudioStore((s) => s.setCaptureThumbRef);
  const setCanvasContainerSize = useStudioStore((s) => s.setCanvasContainerSize);
  const canvasContainerSize = useStudioStore((s) => s.canvasContainerSize);
  const editableRegions = useStudioStore((s) => s.editableRegions);
  const templateOriginalWidth = useStudioStore((s) => s.templateOriginalWidth);
  const templateOriginalHeight = useStudioStore((s) => s.templateOriginalHeight);

  const hasTemplate = editableRegions.length > 0;
  const templateAspectRatio = hasTemplate && templateOriginalWidth > 0 && templateOriginalHeight > 0
    ? templateOriginalWidth / templateOriginalHeight
    : null;

  useEffect(() => { setTimeout(() => setLoaded(true), 200); }, []);

  const measureContainer = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setCanvasContainerSize({ width, height });
      }
    });
  }, [setCanvasContainerSize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setCanvasContainerSize({ width, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasTemplate, templateAspectRatio, setCanvasContainerSize]);

  useLayoutEffect(() => { measureContainer(); }, [hasTemplate, templateAspectRatio, measureContainer]);

  useEffect(() => {
    setCaptureThumbRef(async () => {
      const el = captureNodeRef.current;
      if (!el) return null;
      const timeout = (ms: number) => new Promise((_, r) => setTimeout(r, ms));
      await Promise.race([document.fonts.ready, timeout(8000)]);
      try { return await toPng(el, { pixelRatio: 2, cacheBust: false, imagePlaceholder: '' }); } catch {}
      try { return await toPng(el, { pixelRatio: 1, cacheBust: false, imagePlaceholder: '' }); } catch {}
      try { const c = await toCanvas(el, { pixelRatio: 1, cacheBust: false }); return c.toDataURL('image/jpeg', 0.85); } catch { return null; }
    });
    setCaptureRef(async () => {
      const el = captureNodeRef.current;
      if (!el) return null;
      const timeout = (ms: number) => new Promise((_, r) => setTimeout(r, ms));
      await Promise.race([document.fonts.ready, timeout(8000)]);
      try { return await toPng(el, { pixelRatio: 2, cacheBust: false, imagePlaceholder: '' }); } catch {}
      try { const c = await toCanvas(el, { pixelRatio: 1, cacheBust: false }); return c.toDataURL('image/png'); } catch { return null; }
    });
    return () => { setCaptureRef(null); setCaptureThumbRef(null); };
  }, [setCaptureRef, setCaptureThumbRef]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (dragRef.current) {
        const d = dragRef.current;
        updateLayer(d.id, { x: d.startX + e.clientX - d.clientX, y: d.startY + e.clientY - d.clientY });
      }
      if (resizeRef.current) {
        const r = resizeRef.current;
        const dx = e.clientX - r.clientX;
        const dy = e.clientY - r.clientY;
        const patch: Record<string, number> = {};
        const h = r.handleId;
        if (h.includes('w')) { patch.x = r.startX + dx; patch.width = r.startW - dx; }
        if (h.includes('e')) { patch.width = r.startW + dx; }
        if (h.includes('n')) { patch.y = r.startY + dy; patch.height = r.startH - dy; }
        if (h.includes('s')) { patch.height = r.startH + dy; }
        if (patch.width !== undefined && patch.width < 10) { patch.width = 10; if (h.includes('w')) patch.x = r.startX + r.startW - 10; }
        if (patch.height !== undefined && patch.height < 10) { patch.height = 10; if (h.includes('n')) patch.y = r.startY + r.startH - 10; }
        updateLayer(r.id, patch);
      }
      if (rotRef.current) {
        const r = rotRef.current;
        const angle = Math.atan2(e.clientY - r.cy, e.clientX - r.cx) * (180 / Math.PI) + 90;
        updateLayer(r.id, { rotation: Math.round(angle) });
      }
    };
    const handleUp = () => {
      if (dragRef.current) { pushHistory('Move'); dragRef.current = null; }
      if (resizeRef.current) { pushHistory('Resize'); resizeRef.current = null; }
      if (rotRef.current) { pushHistory('Rotate'); rotRef.current = null; }
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [updateLayer, pushHistory]);

  const getBackgroundStyle = () => {
    if (background.fillType === 'image' && background.imageSrc) {
      return { backgroundImage: `url(${background.imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    if (background.fillType === 'gradient' && background.gradientStart && background.gradientEnd) {
      return { background: `linear-gradient(${background.gradientAngle || 0}deg, ${background.gradientStart}, ${background.gradientEnd})` };
    }
    return { background: background.color || '#FFFFFF' };
  };

  const handlePointerDown = (e: React.PointerEvent, layerId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const layer = layers.find(l => l.id === layerId);
    if (!layer || (layer as any).locked) return;
    const l = layer as any;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    selectLayer(layerId, e.shiftKey);
    dragRef.current = { id: layerId, startX: l.x, startY: l.y, clientX: e.clientX, clientY: e.clientY };
  };

  const handleResizeStart = (e: React.PointerEvent, layerId: string, handleId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const layer = layers.find(l => l.id === layerId);
    if (!layer || (layer as any).locked) return;
    const l = layer as any;
    selectLayer(layerId);
    resizeRef.current = {
      id: layerId, handleId,
      startX: l.x, startY: l.y,
      startW: l.width ?? l.w ?? 100,
      startH: l.height ?? l.h ?? 100,
      clientX: e.clientX, clientY: e.clientY,
    };
  };

  const handleRotateStart = (e: React.PointerEvent, layerId: string) => {
    e.stopPropagation();
    const layer = layers.find(l => l.id === layerId);
    if (!layer || (layer as any).locked) return;
    const l = layer as any;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    selectLayer(layerId);
    rotRef.current = {
      id: layerId,
      startRotation: l.rotation || 0,
      cx: rect.left + (l.x ?? 0) + (l.width ?? l.w ?? 100) / 2,
      cy: rect.top + (l.y ?? 0) + (l.height ?? l.h ?? 100) / 2,
    };
  };

  const getLayerSize = (layer: any) => ({
    w: layer.width ?? layer.w ?? 100,
    h: layer.height ?? layer.h ?? 100,
  });

  const renderLayerContent = (layer: any) => {
    if (!layer.visible) return null;
    const { w, h } = getLayerSize(layer);
    return (
      <div key={layer.id} style={{ width: w, height: h, overflow: 'hidden' }}>
        {layer.type === 'text' && (
          <div style={{
            color: layer.color || '#000',
            fontSize: layer.fontSize || 24,
            fontFamily: FONTS.find(f => f.id === layer.fontFamily)?.family || 'Inter',
            fontWeight: layer.fontWeight || 500,
            textAlign: layer.alignment || 'center',
            textTransform: layer.uppercase ? 'uppercase' : 'none',
            letterSpacing: `${layer.letterSpacing || 0}px`,
            lineHeight: layer.lineHeight || 1.2,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {layer.text || 'Text'}
          </div>
        )}
        {layer.type === 'sticker' && (
          <div className="flex items-center justify-center h-full w-full text-4xl drop-shadow-lg">
            {layer.emoji || '😊'}
          </div>
        )}
        {layer.type === 'image' && (
          <img
            src={layer.src} alt="" crossOrigin="anonymous"
            className="h-full w-full object-contain pointer-events-none"
            draggable={false}
            style={{
              filter: `brightness(${layer.filters?.brightness ?? 100}%) contrast(${layer.filters?.contrast ?? 100}%) saturate(${layer.filters?.saturation ?? 100}%) blur(${layer.filters?.blur ?? 0}px) hue-rotate(${layer.filters?.hue ?? 0}deg) sepia(${layer.filters?.sepia ?? 0}%) grayscale(${layer.filters?.grayscale ?? 0}%)`,
              borderRadius: `${layer.cornerRadius || 0}px`,
            }}
          />
        )}
        {layer.type === 'shape' && (
          <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
            {layer.shapeType === 'rectangle' && <rect x="0" y="0" width={w} height={h} rx={layer.cornerRadius || 0} fill={layer.fill || '#000'} stroke={layer.stroke || 'none'} strokeWidth={layer.strokeWidth || 0} />}
            {layer.shapeType === 'circle' && <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={layer.fill || '#000'} stroke={layer.stroke || 'none'} strokeWidth={layer.strokeWidth || 0} />}
            {layer.shapeType === 'triangle' && <polygon points={`${w / 2},0 ${w},${h} 0,${h}`} fill={layer.fill || '#000'} stroke={layer.stroke || 'none'} strokeWidth={layer.strokeWidth || 0} />}
            {layer.shapeType === 'star' && <polygon points={generateStarPoints(w, h)} fill={layer.fill || '#000'} stroke={layer.stroke || 'none'} strokeWidth={layer.strokeWidth || 0} />}
            {layer.shapeType === 'heart' && <path d={heartPath(w, h)} fill={layer.fill || '#000'} stroke={layer.stroke || 'none'} strokeWidth={layer.strokeWidth || 0} />}
            {layer.shapeType === 'hexagon' && <polygon points={hexagonPoints(w, h)} fill={layer.fill || '#000'} stroke={layer.stroke || 'none'} strokeWidth={layer.strokeWidth || 0} />}
          </svg>
        )}
      </div>
    );
  };

  const renderTemplateMode = () => {
    const tpl = phoneTemplate;
    const maskSvg = tpl?.mask;
    const safeAreaSvg = tpl?.safeArea;
    const bleedSvg = tpl?.bleed;
    const cameraSvg = tpl?.cameraCutout;
    const previewImg = tpl?.preview;

    return (
      <div
        className={cn('relative w-full mx-auto transition-all duration-700', loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}
        style={{ maxWidth: '420px', transform: `scale(${settings.zoom})` }}
      >
        <div ref={captureNodeRef} className="relative overflow-hidden bg-white shadow-2xl dark:shadow-black/40" style={{ borderRadius: '12px' }}>
          <div
            ref={containerRef}
            className="relative w-full select-none"
            style={{ aspectRatio: templateAspectRatio ? `${templateAspectRatio}` : '3/4' }}
            onPointerDown={() => selectLayer(null)}
          >
            {/* Layer 1: Background */}
            <div className="absolute inset-0" style={getBackgroundStyle()} />

            {/* Layer 2: Template image (if any) */}
            {previewImg && (
              <img
                src={previewImg}
                alt=""
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                style={{ objectFit: 'contain' }}
                draggable={false}
              />
            )}

            {/* Layer 3: User layers inside editable regions (clipped) */}
            {editableRegions.length > 0 && (
              <TemplateRenderer
                areas={editableRegions}
                containerWidth={canvasContainerSize.width}
                containerHeight={canvasContainerSize.height}
                originalWidth={templateOriginalWidth}
                originalHeight={templateOriginalHeight}
                showIndicators={false}
                templateImage={background.imageSrc}
              >
                {layers.filter(l => l.visible).map((layer) => {
                  const ll = layer as any;
                  return (
                    <div
                      key={layer.id}
                      className="absolute z-30 touch-none select-none"
                      style={{
                        left: ll.x, top: ll.y,
                        width: ll.width ?? ll.w ?? 100,
                        height: ll.height ?? ll.h ?? 100,
                        transform: `rotate(${ll.rotation || 0}deg) scaleX(${ll.flipX ? -1 : 1}) scaleY(${ll.flipY ? -1 : 1})`,
                        opacity: ll.opacity,
                        cursor: ll.locked ? 'default' : 'move',
                        mixBlendMode: ll.blendMode || 'normal',
                      }}
                      onPointerDown={(e) => handlePointerDown(e, layer.id)}
                      onClick={(e) => { e.stopPropagation(); selectLayer(layer.id, e.shiftKey); }}
                    >
                      {renderLayerContent(layer)}
                    </div>
                  );
                })}
              </TemplateRenderer>
            )}

            {/* Layer 4: User layers (unclipped, for free-form placement) */}
            {editableRegions.length === 0 && layers.filter(l => l.visible).map((layer) => {
              const ll = layer as any;
              return (
                <div
                  key={layer.id}
                  className="absolute z-30 touch-none select-none"
                  style={{
                    left: ll.x, top: ll.y,
                    width: ll.width ?? ll.w ?? 100,
                    height: ll.height ?? ll.h ?? 100,
                    transform: `rotate(${ll.rotation || 0}deg) scaleX(${ll.flipX ? -1 : 1}) scaleY(${ll.flipY ? -1 : 1})`,
                    opacity: ll.opacity,
                    cursor: ll.locked ? 'default' : 'move',
                    mixBlendMode: ll.blendMode || 'normal',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, layer.id)}
                  onClick={(e) => { e.stopPropagation(); selectLayer(layer.id, e.shiftKey); }}
                >
                  {renderLayerContent(layer)}
                </div>
              );
            })}

            {/* Layer 5: Safe zone overlay */}
            <SafeZoneOverlay
              safeZoneTop={template?.safeAreaTop}
              safeZoneBottom={template?.safeAreaBottom}
              safeZoneLeft={template?.safeAreaLeft}
              safeZoneRight={template?.safeAreaRight}
              cornerRadius={template?.cornerRadius}
              showSafeZone={settings.showSafeZone}
              showBleedArea={settings.showBleedArea}
              templateWidth={templateOriginalWidth}
              templateHeight={templateOriginalHeight}
            />

            {/* Layer 6: Camera cutout */}
            <CameraCutout
              cutoutSvg={cameraSvg}
              width={templateOriginalWidth}
              height={templateOriginalHeight}
            />

            {/* Layer 7: Grid overlay */}
            {settings.showGrid && (
              <div
                className="pointer-events-none absolute inset-0 z-15 opacity-20"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            )}

            {/* Selection handles */}
            <div className="absolute inset-0 z-40 pointer-events-none">
              {layers.filter(l => l.visible && selectedLayerIds.includes(l.id) && !(l as any).locked).map((layer) => {
                const ll = layer as any;
                return (
                  <div
                    key={`handle-${layer.id}`}
                    className="pointer-events-auto"
                    style={{
                      left: ll.x - 5, top: ll.y - 5,
                      width: (ll.width ?? ll.w ?? 100) + 10,
                      height: (ll.height ?? ll.h ?? 100) + 10,
                      position: 'absolute',
                      transform: `rotate(${ll.rotation || 0}deg)`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-sm ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none" />
                    {RESIZE_HANDLES.map((h) => (
                      <div
                        key={h.id}
                        onPointerDown={(e) => handleResizeStart(e, layer.id, h.id)}
                        className="absolute z-50 rounded-full bg-white border-2 border-primary shadow-lg hover:scale-125 transition-transform touch-none cursor-pointer"
                        style={{
                          cursor: h.cursor,
                          left: h.x ?? undefined,
                          right: h.right ?? undefined,
                          top: h.y ?? undefined,
                          bottom: h.bottom ?? undefined,
                          width: h.w + 4,
                          height: h.h + 4,
                          transform: `translate(${h.mx || '0'}, ${h.my || '0'})`,
                        }}
                      />
                    ))}
                    <div
                      onPointerDown={(e) => handleRotateStart(e, layer.id)}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-50 h-4 w-4 rounded-full border-2 border-white bg-foreground/80 shadow cursor-grab active:cursor-grabbing touch-none hover:bg-foreground transition-colors"
                    />
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {layers.length === 0 && !background.imageSrc && (
              <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
                <div className="text-center text-muted-foreground/40">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-sm font-medium">Start designing</p>
                  <p className="mt-1 text-[10px] opacity-60">Select a tool from the left sidebar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPhoneMode = () => (
    <div
      className={cn('relative w-full max-w-[320px] mx-auto transition-all duration-700', loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}
      style={{ transform: `scale(${settings.zoom})` }}
    >
      <div ref={captureNodeRef} className="relative aspect-[9/19.5] overflow-hidden rounded-[14%]/[8%] bg-foreground/5 shadow-2xl dark:shadow-black/40">
        <div ref={containerRef} className="relative h-full w-full select-none" onPointerDown={() => selectLayer(null)}>
          <div className="absolute inset-0" style={getBackgroundStyle()} />
          <div className="pointer-events-none absolute inset-0 z-20 rounded-[14%]/[8%]" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.06)' }} />
          {settings.showGrid && (
            <div className="pointer-events-none absolute inset-0 z-15 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          )}
          <div className="absolute inset-0">
            {layers.filter(l => l.visible).map((layer) => {
              const ll = layer as any;
              return (
                <div
                  key={layer.id}
                  className="absolute z-30 touch-none select-none"
                  style={{
                    left: ll.x, top: ll.y,
                    width: ll.width ?? ll.w ?? 100,
                    height: ll.height ?? ll.h ?? 100,
                    transform: `rotate(${ll.rotation || 0}deg) scaleX(${ll.flipX ? -1 : 1}) scaleY(${ll.flipY ? -1 : 1})`,
                    opacity: ll.opacity,
                    cursor: ll.locked ? 'default' : 'move',
                    mixBlendMode: ll.blendMode || 'normal',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, layer.id)}
                  onClick={(e) => { e.stopPropagation(); selectLayer(layer.id, e.shiftKey); }}
                >
                  {renderLayerContent(layer)}
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 z-40 pointer-events-none">
            {layers.filter(l => l.visible && selectedLayerIds.includes(l.id) && !(l as any).locked).map((layer) => {
              const ll = layer as any;
              return (
                <div
                  key={`sel-${layer.id}`}
                  className="pointer-events-auto absolute"
                  style={{
                    left: ll.x - 5, top: ll.y - 5,
                    width: (ll.width ?? ll.w ?? 100) + 10,
                    height: (ll.height ?? ll.h ?? 100) + 10,
                    transform: `rotate(${ll.rotation || 0}deg)`,
                  }}
                >
                  <div className="absolute inset-0 rounded-sm ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none" />
                  {RESIZE_HANDLES.map((h) => (
                    <div
                      key={h.id}
                      onPointerDown={(e) => handleResizeStart(e, layer.id, h.id)}
                      className="absolute z-50 rounded-full bg-white border-2 border-primary shadow-lg hover:scale-125 transition-transform touch-none cursor-pointer"
                      style={{
                        cursor: h.cursor,
                        left: h.x ?? undefined,
                        right: h.right ?? undefined,
                        top: h.y ?? undefined,
                        bottom: h.bottom ?? undefined,
                        width: h.w + 4,
                        height: h.h + 4,
                        transform: `translate(${h.mx || '0'}, ${h.my || '0'})`,
                      }}
                    />
                  ))}
                  <div
                    onPointerDown={(e) => handleRotateStart(e, layer.id)}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-50 h-4 w-4 rounded-full border-2 border-white bg-foreground/80 shadow cursor-grab active:cursor-grabbing touch-none hover:bg-foreground transition-colors"
                  />
                </div>
              );
            })}
          </div>
          <SafeZoneOverlay
            safeZoneTop={template?.safeAreaTop}
            safeZoneBottom={template?.safeAreaBottom}
            safeZoneLeft={template?.safeAreaLeft}
            safeZoneRight={template?.safeAreaRight}
            cornerRadius={template?.cornerRadius}
            showSafeZone={settings.showSafeZone}
            showBleedArea={settings.showBleedArea}
          />
          <CameraCutout
            cutoutSvg={phoneTemplate?.cameraCutout}
            width={templateOriginalWidth}
            height={templateOriginalHeight}
          />
          {layers.length === 0 && !background.imageSrc && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
              <div className="text-center text-muted-foreground/40">
                <div className="text-4xl mb-3">📱</div>
                <p className="text-sm font-medium">Start designing</p>
                <p className="mt-1 text-[10px] opacity-60">Select a tool from the left sidebar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return hasTemplate || phoneTemplate ? renderTemplateMode() : renderPhoneMode();
}

function generateStarPoints(w: number, h: number): string {
  const cx = w / 2, cy = h / 2;
  const outerR = Math.min(w, h) / 2, innerR = outerR * 0.4;
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    points.push(`${cx + outerR * Math.cos(angle)},${cy + outerR * Math.sin(angle)}`);
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
  }
  return points.join(' ');
}

function heartPath(w: number, h: number): string {
  const cx = w / 2;
  const topY = h * 0.2;
  const bottomY = h * 0.9;
  const sideX = w * 0.25;
  const curveX = w * 0.15;
  return [
    `M ${cx} ${bottomY}`,
    `C ${cx - w * 0.3} ${h * 0.6}, ${cx - w * 0.4} ${h * 0.35}, ${cx - sideX} ${topY + h * 0.05}`,
    `C ${cx - sideX - curveX} ${topY - h * 0.05}, ${cx - w * 0.1} ${topY - h * 0.1}, ${cx} ${topY + h * 0.1}`,
    `C ${cx + w * 0.1} ${topY - h * 0.1}, ${cx + sideX + curveX} ${topY - h * 0.05}, ${cx + sideX} ${topY + h * 0.05}`,
    `C ${cx + w * 0.4} ${h * 0.35}, ${cx + w * 0.3} ${h * 0.6}, ${cx} ${bottomY} Z`,
  ].join(' ');
}

function hexagonPoints(w: number, h: number): string {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2;
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * Math.PI / 180;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}
