'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Copy, GripVertical, Pen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditableAreaData, AreaType, AreaShapeType } from '@/types/studio';
import AreaPropertiesPanel from './AreaPropertiesPanel';

interface Props {
  imageUrl: string;
  onAreasChange?: (areas: EditableAreaData[]) => void;
  initialAreas?: EditableAreaData[];
  originalWidth?: number;
  originalHeight?: number;
  onImageDimensions?: (width: number, height: number) => void;
}

const HANDLE_SIZE = 10;
const RESIZE_HANDLES = [
  { id: 'nw' as const, cursor: 'nwse-resize', style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 } },
  { id: 'n' as const, cursor: 'ns-resize', style: { top: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2 } },
  { id: 'ne' as const, cursor: 'nesw-resize', style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 } },
  { id: 'e' as const, cursor: 'ew-resize', style: { top: '50%', right: -HANDLE_SIZE / 2, marginTop: -HANDLE_SIZE / 2 } },
  { id: 'se' as const, cursor: 'nwse-resize', style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 } },
  { id: 's' as const, cursor: 'ns-resize', style: { bottom: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2 } },
  { id: 'sw' as const, cursor: 'nesw-resize', style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 } },
  { id: 'w' as const, cursor: 'ew-resize', style: { top: '50%', left: -HANDLE_SIZE / 2, marginTop: -HANDLE_SIZE / 2 } },
];

function getAreaBorderRadius(area: EditableAreaData, scale: number): string | undefined {
  const all = (area.borderRadius || 0) * scale;
  const top = (area.borderRadiusTop || 0) * scale;
  const bottom = (area.borderRadiusBottom || 0) * scale;
  if (all > 0 && top === 0 && bottom === 0) return `${all}px`;
  if (top > 0 && bottom > 0) return `${top}px ${top}px ${bottom}px ${bottom}px`;
  if (top > 0) return `${top}px ${top}px 0 0`;
  if (bottom > 0) return `0 0 ${bottom}px ${bottom}px`;
  if (all > 0) return `${all}px`;
  return undefined;
}

function generatePolygonClipPath(x: number, y: number, w: number, h: number, sides: number): string {
  const cx = x + w / 2, cy = y + h / 2;
  const rx = w / 2, ry = h / 2;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * (360 / sides) - 90) * Math.PI / 180;
    pts.push(`${cx + rx * Math.cos(angle)}px ${cy + ry * Math.sin(angle)}px`);
  }
  return `polygon(${pts.join(', ')})`;
}

function computeBoundingBox(points: { x: number; y: number }[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

// Chaikin's corner-cutting: replaces each edge with 2 points at 1/4 and 3/4
// This removes jaggies while staying very close to the original shape.
function chaikinSmooth(pts: { x: number; y: number }[], iterations: number): { x: number; y: number }[] {
  let points = pts;
  for (let iter = 0; iter < iterations; iter++) {
    const next: { x: number; y: number }[] = [];
    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      const nextPt = points[(i + 1) % points.length];
      next.push({ x: curr.x + 0.25 * (nextPt.x - curr.x), y: curr.y + 0.25 * (nextPt.y - curr.y) });
      next.push({ x: curr.x + 0.75 * (nextPt.x - curr.x), y: curr.y + 0.75 * (nextPt.y - curr.y) });
    }
    points = next;
  }
  return points;
}

// Convert smooth points to Catmull-Rom cubic bezier commands.
// Catmull-Rom passes through all control points with C1 continuity.
function catmullRomToBezier(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 3) {
    // Fallback: straight lines
    const parts = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`);
    parts.push('Z');
    return parts.join(' ');
  }

  // For Catmull-Rom, we need implicit start/end tangents.
  // Duplicate first and last points to handle boundaries.
  const cpts = [pts[0], ...pts, pts[n - 1]];
  const parts: string[] = [];

  for (let i = 1; i < cpts.length - 2; i++) {
    const p0 = cpts[i - 1], p1 = cpts[i], p2 = cpts[i + 1], p3 = cpts[i + 2];
    // Tension = 0.5 (standard Catmull-Rom)
    const t = 0.5;
    const cp1x = p1.x + (p2.x - p0.x) * t / 3;
    const cp1y = p1.y + (p2.y - p0.y) * t / 3;
    const cp2x = p2.x - (p3.x - p1.x) * t / 3;
    const cp2y = p2.y - (p3.y - p1.y) * t / 3;

    if (i === 1) {
      parts.push(`M ${p1.x} ${p1.y}`);
    }
    parts.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }

  parts.push('Z');
  return parts.join(' ');
}

function normalizePathData(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';

  // Apply Chaikin smoothing (2 iterations) to remove jaggies
  const smoothed = points.length <= 4 ? points : chaikinSmooth(points, 2);

  // Normalize to 0-1 bounding box
  const { minX, minY, maxX, maxY } = computeBoundingBox(smoothed);
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const normalized = smoothed.map(p => ({
    x: (p.x - minX) / w,
    y: (p.y - minY) / h,
  }));

  // If very few points, use simple lines
  if (normalized.length < 6) {
    const parts = normalized.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`);
    parts.push('Z');
    return parts.join(' ');
  }

  // Use Catmull-Rom for smooth cubic bezier curves
  return catmullRomToBezier(normalized);
}

export default function TemplateEditor({ imageUrl, onAreasChange, initialAreas, originalWidth: ow, originalHeight: oh, onImageDimensions }: Props) {
  const [areas, setAreas] = useState<EditableAreaData[]>(initialAreas || []);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawBtn, setDrawBtn] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSz, setImgSz] = useState({ w: ow || 3000, h: oh || 3000 });

  // Path drawing state
  const [pathBtn, setPathBtn] = useState(false);
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [pathHover, setPathHover] = useState<{ x: number; y: number } | null>(null);
  const pathPointsRef = useRef<{ x: number; y: number }[]>([]);

  const cont = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLDivElement>(null);
  const scale = useRef(1);
  const off = useRef({ x: 0, y: 0 });
  const nid = useRef(-1);
  const drawMode = useRef(false);
  const drawing = useRef(false);
  const drawStart = useRef({ x: 0, y: 0 });
  const drawId = useRef<number | null>(null);

  // Ref-based area storage for mutation without re-render cycles
  const areasRef = useRef<EditableAreaData[]>(initialAreas || []);

  // initialAreas: use only on first mount, never overwrite local edits
  const initDone = useRef(false);
  useEffect(() => {
    if (initialAreas && initialAreas.length > 0 && !initDone.current) {
      setAreas(initialAreas);
      areasRef.current = initialAreas;
      initDone.current = true;
    }
  }, [initialAreas]);

  // onAreasChange: debounced to prevent circular update loops
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!onAreasChange) return;
    if (drawing.current) return; // skip sync during active interaction
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      onAreasChange(areas);
      syncTimer.current = null;
    }, 300);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [areas, onAreasChange]);

  // Sync ref when state changes (but not during draw)
  useEffect(() => {
    if (!drawing.current) areasRef.current = areas;
  }, [areas]);

  // Load image dimensions — use actual image size as the coordinate space
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || ow || 3000;
      const h = img.naturalHeight || oh || 3000;
      setImgSz({ w, h });
      setImageLoaded(true);
      onImageDimensions?.(w, h);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Coordinate space = actual image dimensions (if loaded) or fallback to prop/3000
  const origW = imageLoaded ? imgSz.w : (ow || 3000);
  const origH = imageLoaded ? imgSz.h : (oh || 3000);

  // Responsive scale — matches CSS background-size: contain (uniform scale, no distortion)
  useEffect(() => {
    if (!imageLoaded || !cont.current) return;
    const upd = () => {
      const r = cont.current?.getBoundingClientRect();
      if (!r) return;
      const s = Math.min(r.width / origW, r.height / origH, 1);
      scale.current = s;
      // Center the canvas within the container (letterboxing)
      off.current = { x: (r.width - origW * s) / 2, y: (r.height - origH * s) / 2 };
    };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(cont.current);
    return () => ro.disconnect();
  }, [imageLoaded, origW, origH]);

  const toCv = useCallback((cx: number, cy: number) => {
    const r = cv.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (cx - r.left) / scale.current, y: (cy - r.top) / scale.current };
  }, []);

  // Cancel path drawing
  const cancelPath = useCallback(() => {
    pathBtnRef.current = false;
    setPathBtn(false);
    pathPointsRef.current = [];
    setPathPoints([]);
    setPathHover(null);
  }, []);

  const pathBtnRef = useRef(false);

  // Canvas pointer events - raw DOM listeners via useEffect to survive re-renders
  useEffect(() => {
    const el = cv.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      if (drawing.current) return;
      const t = e.target as HTMLElement;
      if (t.closest('.area-handle') || t.closest('.rotate-handle') || t.closest('.editable-area')) return;

      // Path drawing mode
      if (pathBtnRef.current) {
        e.preventDefault();
        const p = toCv(e.clientX, e.clientY);
        const pts = pathPointsRef.current;

        // Check if clicking near first point (close path)
        if (pts.length >= 3) {
          const first = pts[0];
          const dist = Math.sqrt((p.x - first.x) ** 2 + (p.y - first.y) ** 2);
          if (dist < 15 / scale.current) {
            // Close path and create area
            const pathData = normalizePathData(pts);
            const { minX, minY, maxX, maxY } = computeBoundingBox(pts);
            nid.current -= 1;
            const id = nid.current;
            const area: EditableAreaData = {
              id, name: `Path ${areasRef.current.length + 1}`,
              areaType: 'image', shapeType: 'custom',
              x: minX, y: minY, width: maxX - minX, height: maxY - minY,
              rotation: 0, borderRadius: 0, borderRadiusTop: 0, borderRadiusBottom: 0,
              pathData,
              allowRotation: true, allowFlip: true,
              lockAspectRatio: false, isRequired: false, isVisible: true, isEnabled: true,
              zIndex: areasRef.current.length, opacity: 1, sortOrder: areasRef.current.length,
            };
            const next = [...areasRef.current, area];
            areasRef.current = next;
            setAreas(next);
            setSelectedId(id);
            cancelPath();
            return;
          }
        }

        // Add point
        const newPts = [...pts, p];
        pathPointsRef.current = newPts;
        setPathPoints(newPts);
        return;
      }

      // Regular rectangle draw mode
      if (drawMode.current) {
        e.preventDefault();
        drawMode.current = false;
        setDrawBtn(false);
        const p = toCv(e.clientX, e.clientY);
        nid.current -= 1;
        const id = nid.current;
        drawId.current = id;
        drawStart.current = { x: p.x, y: p.y };
        drawing.current = true;

        const area: EditableAreaData = {
          id, name: `Area ${areasRef.current.length + 1}`,
          areaType: 'image', shapeType: 'rectangle',
          x: p.x, y: p.y, width: 0, height: 0,
          rotation: 0, borderRadius: 0, borderRadiusTop: 0, borderRadiusBottom: 0,
          allowRotation: true, allowFlip: true,
          lockAspectRatio: false, isRequired: false, isVisible: true, isEnabled: true,
          zIndex: areasRef.current.length, opacity: 1, sortOrder: areasRef.current.length,
        };
        const next = [...areasRef.current, area];
        areasRef.current = next;
        setAreas(next);
        setSelectedId(id);
        return;
      }

      setSelectedId(null);
    };

    const onMove = (e: PointerEvent) => {
      // Path drawing ghost line
      if (pathBtnRef.current) {
        const p = toCv(e.clientX, e.clientY);
        setPathHover(p);
        return;
      }

      if (!drawing.current || drawId.current == null) return;
      e.preventDefault();
      const p = toCv(e.clientX, e.clientY);
      const ox = drawStart.current.x;
      const oy = drawStart.current.y;
      const dx = p.x - ox;
      const dy = p.y - oy;

      const list = areasRef.current.map(a => {
        if (a.id !== drawId.current) return a;
        return {
          ...a,
          x: dx < 0 ? ox + dx : ox,
          y: dy < 0 ? oy + dy : oy,
          width: Math.max(Math.abs(dx), 10),
          height: Math.max(Math.abs(dy), 10),
        };
      });
      areasRef.current = list;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setAreas([...areasRef.current]);
        });
      }
    };

    const onUp = () => {
      if (drawing.current) {
        drawing.current = false;
        drawId.current = null;
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        setAreas([...areasRef.current]);
      }
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [toCv, cancelPath]);

  // Double-click to close path
  useEffect(() => {
    const el = cv.current;
    if (!el || !pathBtn) return;
    const onDblClick = (e: MouseEvent) => {
      const pts = pathPointsRef.current;
      if (pts.length < 3) return;
      e.preventDefault();
      const pathData = normalizePathData(pts);
      const { minX, minY, maxX, maxY } = computeBoundingBox(pts);
      nid.current -= 1;
      const id = nid.current;
      const area: EditableAreaData = {
        id, name: `Path ${areasRef.current.length + 1}`,
        areaType: 'image', shapeType: 'custom',
        x: minX, y: minY, width: maxX - minX, height: maxY - minY,
        rotation: 0, borderRadius: 0, borderRadiusTop: 0, borderRadiusBottom: 0,
        pathData,
        allowRotation: true, allowFlip: true,
        lockAspectRatio: false, isRequired: false, isVisible: true, isEnabled: true,
        zIndex: areasRef.current.length, opacity: 1, sortOrder: areasRef.current.length,
      };
      const next = [...areasRef.current, area];
      areasRef.current = next;
      setAreas(next);
      setSelectedId(id);
      cancelPath();
    };
    el.addEventListener('dblclick', onDblClick);
    return () => el.removeEventListener('dblclick', onDblClick);
  }, [pathBtn, cancelPath]);

  // Escape to cancel path
  useEffect(() => {
    if (!pathBtn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelPath();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pathBtn, cancelPath]);

  const rafRef = useRef<number | null>(null);

  // Area move via raw DOM listeners
  const areaMoveStart = useRef(new Map<number, { ox: number; oy: number; sx: number; sy: number }>());

  const handleAreaDown = useCallback((e: React.PointerEvent, id: number) => {
    e.stopPropagation();
    const a = areasRef.current.find(x => x.id === id);
    if (!a) return;
    setSelectedId(id);
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    areaMoveStart.current.set(id, { ox: a.x, oy: a.y, sx: e.clientX, sy: e.clientY });

    const onMove = (ev: PointerEvent) => {
      const rec = areaMoveStart.current.get(id);
      if (!rec) return;
      const dx = (ev.clientX - rec.sx) / scale.current;
      const dy = (ev.clientY - rec.sy) / scale.current;
      areasRef.current = areasRef.current.map(x =>
        x.id === id ? { ...x, x: rec.ox + dx, y: rec.oy + dy } : x
      );
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setAreas([...areasRef.current]);
        });
      }
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      areaMoveStart.current.delete(id);
      areasRef.current = [...areasRef.current];
      setAreas([...areasRef.current]);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  }, []);

  // Resize via raw DOM listeners
  const resizeStart = useRef(new Map<number, { ox: number; oy: number; ow: number; oh: number; sx: number; sy: number }>());

  const handleResizeDown = useCallback((e: React.PointerEvent, id: number, handleId: string) => {
    e.stopPropagation();
    const a = areasRef.current.find(x => x.id === id);
    if (!a) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    resizeStart.current.set(id, { ox: a.x, oy: a.y, ow: a.width, oh: a.height, sx: e.clientX, sy: e.clientY });

    const onMove = (ev: PointerEvent) => {
      const rec = resizeStart.current.get(id);
      if (!rec) return;
      const dx = (ev.clientX - rec.sx) / scale.current;
      const dy = (ev.clientY - rec.sy) / scale.current;
      areasRef.current = areasRef.current.map(a => {
        if (a.id !== id) return a;
        let x = a.x, y = a.y, w = a.width, h = a.height;
        if (handleId.includes('w')) { x = rec.ox + dx; w = rec.ow - dx; }
        if (handleId.includes('e')) { w = rec.ow + dx; }
        if (handleId.includes('n')) { y = rec.oy + dy; h = rec.oh - dy; }
        if (handleId.includes('s')) { h = rec.oh + dy; }
        if (w < 20) { w = 20; if (handleId.includes('w')) x = rec.ox + rec.ow - 20; }
        if (h < 20) { h = 20; if (handleId.includes('n')) y = rec.oy + rec.oh - 20; }
        return { ...a, x, y, width: w, height: h };
      });
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setAreas([...areasRef.current]);
        });
      }
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      resizeStart.current.delete(id);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setAreas([...areasRef.current]);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  }, []);

  // Rotate via raw DOM listeners
  const rotStart = useRef(new Map<number, { cx: number; cy: number; origR: number }>());

  const handleRotateDown = useCallback((e: React.PointerEvent, id: number) => {
    e.stopPropagation();
    const a = areasRef.current.find(x => x.id === id);
    if (!a) return;
    const r = cv.current?.getBoundingClientRect();
    if (!r) return;
    const s = scale.current;
    rotStart.current.set(id, {
      cx: r.left + (a.x + a.width / 2) * s,
      cy: r.top + (a.y + a.height / 2) * s,
      origR: a.rotation,
    });
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const rec = rotStart.current.get(id);
      if (!rec) return;
      const angle = Math.atan2(ev.clientY - rec.cy, ev.clientX - rec.cx) * (180 / Math.PI) + 90;
      areasRef.current = areasRef.current.map(a =>
        a.id === id ? { ...a, rotation: Math.round(angle) } : a
      );
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setAreas([...areasRef.current]);
        });
      }
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      rotStart.current.delete(id);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setAreas([...areasRef.current]);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  }, []);

  const updArea = useCallback((id: number, patch: Partial<EditableAreaData>) => {
    setAreas(prev => { const n = prev.map(a => a.id === id ? { ...a, ...patch } : a); areasRef.current = n; return n; });
  }, []);

  const delArea = useCallback((id: number) => {
    setAreas(prev => { const n = prev.filter(a => a.id !== id); areasRef.current = n; return n; });
    setSelectedId(p => p === id ? null : p);
  }, []);

  const dupArea = useCallback((id: number) => {
    const a = areasRef.current.find(x => x.id === id);
    if (!a) return;
    nid.current -= 1;
    const na = { ...a, id: nid.current, name: `${a.name} (copy)`, x: a.x + 20, y: a.y + 20, sortOrder: areasRef.current.length };
    setAreas(prev => { const n = [...prev, na]; areasRef.current = n; return n; });
    setSelectedId(nid.current);
  }, []);

  const sel = useMemo(() => areas.find(a => a.id === selectedId) || null, [areas, selectedId]);

  const renderPathPreview = () => {
    if (!pathBtn || pathPoints.length === 0) return null;
    const pts = pathPoints;
    const s = scale.current;
    const hoverPt = pathHover;
    const ptsStr = pts.map(p => `${p.x * s},${p.y * s}`).join(' ');

    // Compute smoothed curve in screen coordinates for preview
    const showSmooth = pts.length > 4;
    let smoothScreenD = '';
    if (showSmooth) {
      const displayPts = chaikinSmooth(pts, 2);
      const { minX, minY, maxX, maxY } = computeBoundingBox(displayPts);
      const bw = maxX - minX || 1;
      const bh = maxY - minY || 1;
      const normalizedPreview = displayPts.map(p => ({ x: (p.x - minX) / bw, y: (p.y - minY) / bh }));
      if (normalizedPreview.length >= 6) {
        const nd = catmullRomToBezier(normalizedPreview);
        // Convert normalized + transform into screen coordinates
        const vbox = `viewBox="0 0 1 1"`;
        smoothScreenD = nd;
      }
    }

    const fillOpacity = Math.min(0.06 + pts.length * 0.01, 0.12);

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-50" style={{ left: 0, top: 0, overflow: 'visible' }}>
        {/* Straight-line skeleton — ALWAYS visible so user sees the outline */}
        {pts.map((p, i) => {
          if (i === 0) return null;
          return (
            <line key={`ln-${i}`} x1={pts[i-1].x * s} y1={pts[i-1].y * s} x2={p.x * s} y2={p.y * s}
              stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" />
          );
        })}
        {/* Close-to-first hint (dashed) */}
        {pts.length >= 3 && (
          <line x1={pts[pts.length-1].x * s} y1={pts[pts.length-1].y * s}
            x2={pts[0].x * s} y2={pts[0].y * s}
            stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" strokeLinecap="round" opacity={0.5} />
        )}
        {/* Ghost line to hover */}
        {hoverPt && pts.length > 0 && (
          <line x1={pts[pts.length-1].x * s} y1={pts[pts.length-1].y * s}
            x2={hoverPt.x * s} y2={hoverPt.y * s}
            stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" />
        )}
        {/* Filled polygon (raw points) — always visible */}
        {pts.length >= 3 && (
          <polygon points={ptsStr} fill={`rgba(59,130,246,${fillOpacity})`} stroke="none" />
        )}
        {/* Smooth overlay — shown as a thinner, paler ghost on top of the solid skeleton */}
        {pts.length >= 3 && showSmooth && smoothScreenD && (() => {
          const displayPts = chaikinSmooth(pts, 2);
          const { minX, minY, maxX, maxY } = computeBoundingBox(displayPts);
          const bw = maxX - minX || 1;
          const bh = maxY - minY || 1;
          const ns = displayPts.map(p => ({ x: (p.x - minX) / bw, y: (p.y - minY) / bh }));
          return (
            <path
              d={catmullRomToBezier(ns)}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 3"
              opacity={0.7}
              transform={`translate(${minX * s}, ${minY * s}) scale(${bw * s}, ${bh * s})`}
            />
          );
        })()}
        {/* Points */}
        {pts.map((p, i) => (
          <circle key={`pt-${i}`} cx={p.x * s} cy={p.y * s} r={i === 0 ? 5 : 4}
            fill={i === 0 ? '#3b82f6' : 'white'}
            stroke="#3b82f6" strokeWidth={2} />
        ))}
        {/* Close hint on first point */}
        {pts.length >= 3 && hoverPt && (() => {
          const dist = Math.sqrt((hoverPt.x - pts[0].x) ** 2 + (hoverPt.y - pts[0].y) ** 2);
          if (dist < 15 / scale.current) {
            return (
              <circle cx={pts[0].x * s} cy={pts[0].y * s} r={8}
                fill="none" stroke="#22c55e" strokeWidth={2} strokeDasharray="3 2" />
            );
          }
          return null;
        })()}
      </svg>
    );
  };

  return (
    <div className="border border-border bg-surface rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-background-light/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light">
          Template Editor{areas.length > 0 && <span className="ml-2 text-primary font-mono">({areas.length})</span>}
        </h3>
        <div className="flex items-center gap-2">
          {imageLoaded && !drawBtn && !pathBtn && (
            <>
              <button type="button" onClick={() => { drawMode.current = true; setDrawBtn(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              ><Plus className="h-3.5 w-3.5" /> Draw Rectangle</button>
              <button type="button" onClick={() => { pathBtnRef.current = true; setPathBtn(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              ><Pen className="h-3.5 w-3.5" /> Draw Path</button>
            </>
          )}
          {(drawBtn || pathBtn) && (
            <button type="button" onClick={() => { if (pathBtn) cancelPath(); drawMode.current = false; setDrawBtn(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 text-error rounded-lg text-xs font-medium animate-pulse"
            >Cancel</button>
          )}
          {selectedId != null && <>
            <button type="button" onClick={() => dupArea(selectedId)} className="p-1.5 rounded-md text-text-light hover:text-foreground hover:bg-accent transition-colors"><Copy className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => delArea(selectedId)} className="p-1.5 rounded-md text-error/70 hover:text-error hover:bg-error/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </>}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row" style={{ minHeight: '400px' }}>
        <div ref={cont} className="flex-1 relative overflow-hidden" style={{
          minHeight: '400px',
          backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
          backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px',
        }}>
          {imageUrl && <div ref={cv} className="absolute select-none" style={{
            left: off.current.x, top: off.current.y,
            width: origW * scale.current, height: origH * scale.current,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            cursor: drawBtn ? 'crosshair' : pathBtn ? 'crosshair' : 'default',
          }}>
            <img src={imageUrl} alt="" className="pointer-events-none block w-full h-full" draggable={false} />
            {areas.map(area => {
              const isSel = area.id === selectedId;
              const s = scale.current;
              const isCustom = area.shapeType === 'custom';
              return (
                <div key={area.id} className={cn('editable-area absolute border-2 touch-none',
                  isSel ? 'border-primary bg-primary/10' : 'border-primary/40 bg-primary/5 hover:border-primary/60')}
                  style={{
                    left: area.x * s, top: area.y * s, width: area.width * s, height: area.height * s,
                    transform: `rotate(${area.rotation || 0}deg)`,
                    opacity: area.isVisible ? (area.opacity ?? 1) : 0.3,
                    zIndex: isSel ? 999 : (area.zIndex || 0) + 10,
                    cursor: drawBtn || pathBtn ? 'crosshair' : 'grab',
                    ...(!isCustom && area.shapeType === 'polygon' ? { clipPath: generatePolygonClipPath(0, 0, area.width * s, area.height * s, area.polygonSides || 3) } : {}),
                    borderRadius: !isCustom && area.shapeType !== 'polygon' ? getAreaBorderRadius(area, s) : undefined,
                    overflow: isCustom || area.backgroundColor ? 'hidden' : undefined,
                  }}
                  onPointerDown={e => handleAreaDown(e, area.id!)}
                >
                  {/* Background color */}
                  {area.backgroundColor && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ backgroundColor: area.backgroundColor }}
                    />
                  )}
                  {/* Custom path areas: render the path as SVG overlay */}
                  {isCustom && area.pathData && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 1 1`} preserveAspectRatio="none">
                      <path
                        d={area.pathData}
                        fill="rgba(59,130,246,0.08)"
                        stroke={isSel ? '#3b82f6' : 'rgba(59,130,246,0.5)'}
                        strokeWidth={isSel ? 0.01 : 0.005}
                      />
                    </svg>
                  )}
                  {/* Guide text */}
                  {area.guideText && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <span className="text-[9px] font-medium text-primary/60 bg-white/80 px-1.5 py-0.5 rounded text-center max-w-[90%] leading-tight">
                        {area.guideText}
                      </span>
                    </div>
                  )}
                  {!area.backgroundColor && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-medium text-primary/70 bg-white/80 px-1.5 py-0.5 rounded truncate max-w-[90%]">
                        {isCustom ? `✧ ${area.name}` : (area.width > 0 ? area.name : 'Draw...')}
                      </span>
                    </div>
                  )}
                  {isSel && <>
                    {RESIZE_HANDLES.map(h => (
                      <div key={h.id} className="area-handle absolute z-50 bg-white border-2 border-primary rounded-full shadow-md hover:scale-125 transition-transform touch-none"
                        style={{ cursor: h.cursor, width: HANDLE_SIZE, height: HANDLE_SIZE, ...h.style }}
                        onPointerDown={e => handleResizeDown(e, area.id!, h.id)}
                      />
                    ))}
                    <div className="rotate-handle absolute z-50 w-3 h-3 bg-foreground/80 border-2 border-white rounded-full shadow-md cursor-grab active:cursor-grabbing touch-none hover:bg-foreground transition-colors"
                      style={{ bottom: -24, left: '50%', marginLeft: -6 }}
                      onPointerDown={e => handleRotateDown(e, area.id!)}
                    />
                  </>}
                </div>
              );
            })}
            {/* Path drawing preview overlay */}
            {renderPathPreview()}
          </div>}
          {!imageUrl && <div className="absolute inset-0 flex items-center justify-center text-sm text-text-light">Upload a template image to begin editing</div>}
          {imageUrl && areas.length === 0 && !drawBtn && !pathBtn &&
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-text-light/60 bg-white/80 px-3 py-1.5 rounded-full">Click a draw button then click on the template</span>
            </div>
          }
          {pathBtn && pathPoints.length === 0 &&
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-primary/70 bg-white/90 px-3 py-1.5 rounded-full shadow-sm border border-primary/20">
                Click to add points — click first point or double-click to close path — Esc to cancel
              </span>
            </div>
          }
        </div>
        {sel && <AreaPropertiesPanel area={sel}
          onUpdate={p => { if (selectedId != null) updArea(selectedId, p); }}
          onDelete={() => { if (selectedId != null) delArea(selectedId); }}
          onDuplicate={() => { if (selectedId != null) dupArea(selectedId); }}
        />}
      </div>
      {areas.length > 0 && <div className="border-t border-border p-2 bg-background-light/30">
        <div className="flex flex-wrap gap-1.5">
          {areas.map(area => (
            <button key={area.id} type="button" onClick={() => setSelectedId(area.id!)}
              className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors',
                area.id === selectedId ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-background text-text-light border border-border hover:border-text-light'
              )}
            ><GripVertical className="h-2.5 w-2.5" />
              <span className="truncate max-w-[80px]">{area.shapeType === 'custom' ? `✧ ${area.name}` : area.name}</span>
              <span className="text-[8px] opacity-60 uppercase">{(area.shapeType === 'custom' ? 'path' : area.shapeType)}</span>
            </button>
          ))}
        </div>
      </div>}
    </div>
  );
}
