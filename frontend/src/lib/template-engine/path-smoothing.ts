interface Point {
  x: number;
  y: number;
}

export interface SmoothingConfig {
  /**
   * Angle deflection threshold in degrees (0 to 180).
   * Turns with deflection > solidAngleThreshold are treated as solid/sharp corners.
   * Turns with deflection <= solidAngleThreshold are smoothly curved.
   * Default: 55 degrees (e.g. 90-deg box corners remain sharp, gentle curves stay smooth).
   */
  solidAngleThreshold?: number;
  /**
   * Minimum distance in pixels between consecutive points to filter out jitter/noise.
   * Default: 3
   */
  minSegmentLength?: number;
  /**
   * Smoothing strength factor (0.1 to 0.45).
   * Default: 0.33 (standard 1/3 Catmull-Rom Bézier factor).
   */
  tension?: number;
}

const DEFAULT_CONFIG: Required<SmoothingConfig> = {
  solidAngleThreshold: 55,
  minSegmentLength: 3,
  tension: 0.33,
};

function distSq(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

function dist(p1: Point, p2: Point): number {
  return Math.sqrt(distSq(p1, p2));
}

function cleanPoints(points: Point[], minDist: number): Point[] {
  if (points.length < 3) return [...points];
  const minDistSq = minDist * minDist;
  const res: Point[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = res[res.length - 1];
    if (distSq(points[i], prev) >= minDistSq) {
      res.push(points[i]);
    }
  }

  // Check if last point is too close to first point
  if (res.length > 3 && distSq(res[res.length - 1], res[0]) < minDistSq) {
    res.pop();
  }

  return res;
}

function normalizeVec(v: Point): Point {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-9) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function computeDeflectionAngle(pPrev: Point, pCurr: Point, pNext: Point): number {
  const vIn = normalizeVec({ x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y });
  const vOut = normalizeVec({ x: pNext.x - pCurr.x, y: pNext.y - pCurr.y });
  const dot = Math.max(-1, Math.min(1, vIn.x * vOut.x + vIn.y * vOut.y));
  return Math.acos(dot) * (180 / Math.PI);
}

export function computeBoundingBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Adaptive path normalizer:
 * 1. Guarantees first and last points meet exactly at closed loop P0.
 * 2. Solid/sharp angles (> solidAngleThreshold, e.g. 90° box corners) remain crisp straight edges.
 * 3. Gentle angle contours (<= solidAngleThreshold) are smoothly interpolated without overshoot.
 * 4. Outputs normalized 0..1 SVG path data compatible with viewBox="0 0 1 1".
 */
export function normalizePathAdaptive(
  rawPoints: Point[],
  customConfig?: SmoothingConfig
): string {
  if (!rawPoints || rawPoints.length < 3) return '';

  const config: Required<SmoothingConfig> = {
    solidAngleThreshold: customConfig?.solidAngleThreshold ?? DEFAULT_CONFIG.solidAngleThreshold,
    minSegmentLength: customConfig?.minSegmentLength ?? DEFAULT_CONFIG.minSegmentLength,
    tension: customConfig?.tension ?? DEFAULT_CONFIG.tension,
  };

  const pts = cleanPoints(rawPoints, config.minSegmentLength);
  const n = pts.length;
  if (n < 3) return '';

  // 1. Classify each vertex as solid/sharp (true) or smooth (false)
  const isSharp: boolean[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const pPrev = pts[(i - 1 + n) % n];
    const pCurr = pts[i];
    const pNext = pts[(i + 1) % n];
    const angle = computeDeflectionAngle(pPrev, pCurr, pNext);
    // If deflection is sharp (> threshold) or near-collinear (< 2 deg)
    isSharp[i] = angle > config.solidAngleThreshold || angle < 2.0;
  }

  // 2. Compute smooth unit tangent vectors for smooth vertices
  const tangents: Point[] = new Array(n);
  for (let i = 0; i < n; i++) {
    if (isSharp[i]) {
      tangents[i] = { x: 0, y: 0 };
    } else {
      const pPrev = pts[(i - 1 + n) % n];
      const pNext = pts[(i + 1) % n];
      tangents[i] = normalizeVec({ x: pNext.x - pPrev.x, y: pNext.y - pPrev.y });
    }
  }

  // 3. Build SVG Path Commands with exact loop closure
  const cmds: string[] = [];
  cmds.push(`M ${pts[0].x} ${pts[0].y}`);

  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const nextIdx = (i + 1) % n;
    const p2 = pts[nextIdx];
    const segLen = dist(p1, p2);

    const sharp1 = isSharp[i];
    const sharp2 = isSharp[nextIdx];

    if (sharp1 && sharp2) {
      // Both ends sharp -> straight line
      cmds.push(`L ${p2.x} ${p2.y}`);
    } else {
      // At least one end is smooth -> cubic Bezier curve with clamped tension
      const prevIdx = (i - 1 + n) % n;
      const nextNextIdx = (i + 2) % n;

      const lenPrev = dist(pts[prevIdx], p1);
      const lenNext = dist(p2, pts[nextNextIdx]);

      // Outgoing control handle at p1
      let c1: Point;
      if (sharp1) {
        const dir = normalizeVec({ x: p2.x - p1.x, y: p2.y - p1.y });
        c1 = {
          x: p1.x + dir.x * (segLen * config.tension * 0.5),
          y: p1.y + dir.y * (segLen * config.tension * 0.5),
        };
      } else {
        const handleLen = Math.min(segLen * config.tension, lenPrev * 0.4);
        c1 = {
          x: p1.x + tangents[i].x * handleLen,
          y: p1.y + tangents[i].y * handleLen,
        };
      }

      // Incoming control handle at p2
      let c2: Point;
      if (sharp2) {
        const dir = normalizeVec({ x: p1.x - p2.x, y: p1.y - p2.y });
        c2 = {
          x: p2.x + dir.x * (segLen * config.tension * 0.5),
          y: p2.y + dir.y * (segLen * config.tension * 0.5),
        };
      } else {
        const handleLen = Math.min(segLen * config.tension, lenNext * 0.4);
        c2 = {
          x: p2.x - tangents[nextIdx].x * handleLen,
          y: p2.y - tangents[nextIdx].y * handleLen,
        };
      }

      cmds.push(`C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`);
    }
  }

  // Exact closure
  cmds.push('Z');

  // 4. Normalize coordinates to 0..1 bounding box for responsive SVG template scaling
  const bb = computeBoundingBox(pts);
  const w = bb.maxX - bb.minX || 1;
  const h = bb.maxY - bb.minY || 1;

  const normalizedParts: string[] = [];
  for (const cmd of cmds) {
    const tokens = cmd.split(' ');
    const op = tokens[0];
    if (op === 'Z') {
      normalizedParts.push('Z');
    } else if (op === 'M' || op === 'L') {
      const x = (parseFloat(tokens[1]) - bb.minX) / w;
      const y = (parseFloat(tokens[2]) - bb.minY) / h;
      normalizedParts.push(`${op} ${Number(x.toFixed(5))} ${Number(y.toFixed(5))}`);
    } else if (op === 'C') {
      const c1x = (parseFloat(tokens[1]) - bb.minX) / w;
      const c1y = (parseFloat(tokens[2]) - bb.minY) / h;
      const c2x = (parseFloat(tokens[3]) - bb.minX) / w;
      const c2y = (parseFloat(tokens[4]) - bb.minY) / h;
      const ex = (parseFloat(tokens[5]) - bb.minX) / w;
      const ey = (parseFloat(tokens[6]) - bb.minY) / h;
      normalizedParts.push(
        `C ${Number(c1x.toFixed(5))} ${Number(c1y.toFixed(5))}, ${Number(c2x.toFixed(5))} ${Number(c2y.toFixed(5))}, ${Number(ex.toFixed(5))} ${Number(ey.toFixed(5))}`
      );
    }
  }

  return normalizedParts.join(' ');
}
