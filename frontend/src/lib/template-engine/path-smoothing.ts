interface Point {
  x: number;
  y: number;
}

export interface SmoothingConfig {
  cornerThreshold: number;
  curveThreshold: number;
  minSegmentLength: number;
}

const DEFAULT_CONFIG: SmoothingConfig = {
  cornerThreshold: 135,
  curveThreshold: 165,
  minSegmentLength: 4,
};

type PointType = 'corner' | 'transitional' | 'curve';

function preprocessPoints(points: Point[], tolerance: number): Point[] {
  if (points.length < 2) return [...points];
  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const dx = points[i].x - prev.x;
    const dy = points[i].y - prev.y;
    if (dx * dx + dy * dy > tolerance * tolerance) {
      result.push(points[i]);
    }
  }
  return result;
}

function normalize(v: Point): Point {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-10) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function angleBetween(v1: Point, v2: Point): number {
  const dot = Math.max(-1, Math.min(1, v1.x * v2.x + v1.y * v2.y));
  return Math.acos(dot) * (180 / Math.PI);
}

function computeAngle(points: Point[], i: number, n: number): number {
  const prev = points[(i - 1 + n) % n];
  const curr = points[i];
  const next = points[(i + 1) % n];
  const incoming = normalize({ x: curr.x - prev.x, y: curr.y - prev.y });
  const outgoing = normalize({ x: next.x - curr.x, y: next.y - curr.y });
  return angleBetween(incoming, outgoing);
}

function classifyPoint(points: Point[], i: number, n: number, config: SmoothingConfig): PointType {
  const angle = computeAngle(points, i, n);
  const prev = points[(i - 1 + n) % n];
  const curr = points[i];
  const next = points[(i + 1) % n];
  const prevLen = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
  const nextLen = Math.sqrt((next.x - curr.x) ** 2 + (next.y - curr.y) ** 2);
  if (angle < config.cornerThreshold) return 'corner';
  if (angle >= config.curveThreshold && prevLen > config.minSegmentLength && nextLen > config.minSegmentLength) return 'curve';
  return 'transitional';
}

function classifyPoints(points: Point[], config: SmoothingConfig): PointType[] {
  const n = points.length;
  return points.map((_, i) => classifyPoint(points, i, n, config));
}

interface Section {
  type: 'corner' | 'curve';
  start: number;
  end: number;
}

function findSections(types: PointType[]): Section[] {
  const n = types.length;
  const sections: Section[] = [];
  let i = 0;
  while (i < n) {
    if (types[i] === 'curve') {
      const start = i;
      while (i < n && types[i] === 'curve') i++;
      sections.push({ type: 'curve', start, end: i - 1 });
    } else {
      const start = i;
      while (i < n && types[i] !== 'curve') i++;
      sections.push({ type: 'corner', start, end: i - 1 });
    }
  }
  return sections;
}

interface BezierSegment {
  c1x: number; c1y: number;
  c2x: number; c2y: number;
  x: number; y: number;
}

function catmullRomSegment(p0: Point, p1: Point, p2: Point, p3: Point): BezierSegment {
  return {
    c1x: p1.x + (p2.x - p0.x) / 6,
    c1y: p1.y + (p2.y - p0.y) / 6,
    c2x: p2.x - (p3.x - p1.x) / 6,
    c2y: p2.y - (p3.y - p1.y) / 6,
    x: p2.x,
    y: p2.y,
  };
}

function computeBoundingBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

export function normalizePathAdaptive(
  rawPoints: Point[],
  config: SmoothingConfig = DEFAULT_CONFIG
): string {
  if (rawPoints.length < 2) return '';

  const cleaned = preprocessPoints(rawPoints, config.minSegmentLength);
  if (cleaned.length < 2) return '';

  const n = cleaned.length;
  const types = classifyPoints(cleaned, config);
  const sections = findSections(types);

  const cmds: string[] = [];
  cmds.push(`M ${cleaned[0].x} ${cleaned[0].y}`);

  for (const sec of sections) {
    if (sec.type === 'curve') {
      if (sec.start > 0) {
        cmds.push(`L ${cleaned[sec.start].x} ${cleaned[sec.start].y}`);
      }
      for (let j = sec.start + 1; j <= sec.end; j++) {
        const p0 = j >= 2 ? cleaned[j - 2] : (sec.start > 0 ? cleaned[sec.start - 1] : cleaned[0]);
        const p1 = cleaned[j - 1];
        const p2 = cleaned[j];
        const p3 = j + 1 < n ? cleaned[j + 1] : cleaned[sec.end];
        const seg = catmullRomSegment(p0, p1, p2, p3);
        cmds.push(`C ${seg.c1x} ${seg.c1y}, ${seg.c2x} ${seg.c2y}, ${seg.x} ${seg.y}`);
      }
    } else {
      for (let j = sec.start + 1; j <= sec.end; j++) {
        cmds.push(`L ${cleaned[j].x} ${cleaned[j].y}`);
      }
    }
  }

  cmds.push('Z');

  const bb = computeBoundingBox(cleaned);
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
      normalizedParts.push(`${op} ${x} ${y}`);
    } else if (op === 'C') {
      const parts: string[] = ['C'];
      for (let k = 1; k < tokens.length; k += 2) {
        const x = (parseFloat(tokens[k]) - bb.minX) / w;
        const y = (parseFloat(tokens[k + 1]) - bb.minY) / h;
        parts.push(`${x} ${y}`);
      }
      normalizedParts.push(parts.join(' '));
    }
  }

  return normalizedParts.join(' ');
}
