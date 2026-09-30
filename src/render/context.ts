import { ink, shade } from '../core/color';
import { addV, clamp, mulV, type Vec3 } from '../core/math';
import type { BodyDims, BoneName, Rig } from '../core/skeleton';
import type { Appearance } from '../core/types';

export const CAM_PITCH = 0.22;
export const OL = 0.62;
const CP = Math.cos(CAM_PITCH), SP = Math.sin(CAM_PITCH);

export interface P2 {
  x: number;
  y: number;
  z: number;
}

/** World (y up, z toward viewer) -> screen space in world units (y down). z is depth (bigger = nearer). */
export function projectWorld(w: Vec3): P2 {
  return { x: w[0], y: -(w[1] * CP - w[2] * SP), z: w[2] };
}

export interface Palette {
  skin: string;
  hair: string;
  eye: string;
  top: string;
  bottom: string;
  shoes: string;
  headwear: string;
}

export interface HeadView {
  cx: number;
  cy: number;
  roll: number;
  yaw: number;
  pitch: number;
  R: number;
  sx: number;
  sy: number;
  /** World depth of head center. */
  z: number;
  cY: number;
  sY: number;
  cP: number;
  sP: number;
}

export interface RenderCtx {
  ctx: CanvasRenderingContext2D;
  app: Appearance;
  rig: Rig;
  dims: BodyDims;
  yaw: number;
  time: number;
  fx: Record<string, number>;
  pal: Palette;
  head: HeadView;
  prop: string;
  bw(bone: BoneName, local: Vec3): Vec3;
  bp(bone: BoneName, local: Vec3): P2;
}

export function makeHeadView(rig: Rig, dims: BodyDims, sx: number, sy: number): HeadView {
  const hb = rig.head;
  const R = dims.headR;
  const center = addV(hb.pos, mulV(hb.rot, [0, R * sy * 0.8, 0]));
  const p = projectWorld(center);
  const M = hb.rot;
  const pitch = Math.asin(clamp(M[7], -1, 1));
  const yaw = Math.atan2(-M[6], M[8]);
  const roll = Math.atan2(-M[1], M[4]);
  const P = pitch + CAM_PITCH;
  return {
    cx: p.x, cy: p.y, roll, yaw, pitch, R, sx, sy, z: p.z,
    cY: Math.cos(yaw), sY: Math.sin(yaw), cP: Math.cos(P), sP: Math.sin(P),
  };
}

/** Project a head-local point (units of head radius, y up, z forward) into the rolled head frame. */
export function hp(h: HeadView, q: Vec3): P2 {
  const x = q[0] * h.sx * h.R, y = q[1] * h.sy * h.R, z = q[2] * h.sx * h.R;
  const X = x * h.cY + z * h.sY;
  const Z1 = -x * h.sY + z * h.cY;
  const y2 = y * h.cP - Z1 * h.sP;
  const Z2 = y * h.sP + Z1 * h.cP;
  return { x: X, y: -y2, z: Z2 };
}

/** Point on the head sphere at azimuth a (0 = face front, + toward character's left) and v (down, -1 top..1 bottom). */
export function surf(a: number, v: number, out = 1): Vec3 {
  const r = Math.sqrt(Math.max(0, 1 - v * v));
  return [Math.sin(a) * r * out, -v * out, Math.cos(a) * r * out];
}

/** Point on a head-aligned cylinder (used for hairlines/caps). */
export function cyl(a: number, v: number, out = 1): Vec3 {
  return [Math.sin(a) * out, -v, Math.cos(a) * out];
}

export const facingOf = (h: HeadView, a: number) => Math.cos(a + h.yaw);

export function withHead(rc: RenderCtx, fn: () => void) {
  const { ctx, head } = rc;
  ctx.save();
  ctx.translate(head.cx, head.cy);
  ctx.rotate(-head.roll);
  fn();
  ctx.restore();
}

/** Draw a flat decal on the head surface. Local decal space: +x is the "outer" side after mirroring, y down. */
export function decal(
  rc: RenderCtx,
  a: number,
  v: number,
  draw: (f: number) => void,
  opt: { min?: number; out?: number; mirror?: number; pow?: number; minScale?: number } = {},
) {
  const h = rc.head;
  const f = facingOf(h, a);
  if (f < (opt.min ?? -0.1)) return;
  const p = hp(h, surf(a, v, opt.out ?? 1));
  const s = Math.max(opt.minScale ?? 0.3, Math.pow(Math.max(f, 0.001), opt.pow ?? 1));
  const { ctx } = rc;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(s * (opt.mirror ?? 1), 1);
  draw(f);
  ctx.restore();
}

// ---------- generic 2D helpers ----------

export interface XY {
  x: number;
  y: number;
}

export function fs(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient | null, stroke?: string | null, lw = OL) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke !== null) {
    ctx.strokeStyle = stroke ?? (typeof fill === 'string' ? ink(fill) : '#3a2028');
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

/** Soft cel lighting shared by fabric, skin, and small accessories. Coordinates are in the current drawing frame. */
export function materialFill(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, radius: number, contrast = 1) {
  const r = Math.max(.1, radius);
  const g = ctx.createRadialGradient(x - r * .32, y - r * .4, r * .05, x, y, r * 1.25);
  g.addColorStop(0, shade(color, .24 * contrast));
  g.addColorStop(.42, shade(color, .06 * contrast));
  g.addColorStop(.78, color);
  g.addColorStop(1, shade(color, -.22 * contrast));
  return g;
}

export function polyPath(ctx: CanvasRenderingContext2D, pts: XY[], close = true) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  if (close) ctx.closePath();
}

export function smoothPath(ctx: CanvasRenderingContext2D, pts: XY[], close = true) {
  const n = pts.length;
  ctx.beginPath();
  if (n < 3) return polyPath(ctx, pts, close);
  if (close) {
    const m0 = mid(pts[n - 1], pts[0]);
    ctx.moveTo(m0.x, m0.y);
    for (let i = 0; i < n; i++) {
      const p = pts[i], m = mid(p, pts[(i + 1) % n]);
      ctx.quadraticCurveTo(p.x, p.y, m.x, m.y);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n - 1; i++) {
      const m = mid(pts[i], pts[i + 1]);
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
    }
    ctx.lineTo(pts[n - 1].x, pts[n - 1].y);
  }
}

export const mid = (a: XY, b: XY): XY => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function hull<T extends XY>(pts: T[]): T[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cross = (o: XY, a: XY, b: XY) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: T[] = [], upper: T[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

export interface Seg {
  a: XY;
  b: XY;
  w: number;
  color: string;
}

/** Draw connected capsules with a shared outline pass so joints have no seams. */
export function drawLimb(ctx: CanvasRenderingContext2D, segs: Seg[]) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of segs) {
    ctx.strokeStyle = ink(s.color);
    ctx.lineWidth = s.w + OL * 2;
    ctx.beginPath();
    ctx.moveTo(s.a.x, s.a.y);
    ctx.lineTo(s.b.x, s.b.y);
    ctx.stroke();
  }
  for (const s of segs) {
    const minX = Math.min(s.a.x, s.b.x), minY = Math.min(s.a.y, s.b.y);
    const maxX = Math.max(s.a.x, s.b.x), maxY = Math.max(s.a.y, s.b.y);
    const g = ctx.createLinearGradient(minX - s.w / 2, minY, maxX + s.w / 2, maxY + s.w / 3);
    g.addColorStop(0, shade(s.color, .22));
    g.addColorStop(.38, s.color);
    g.addColorStop(1, shade(s.color, -.18));
    ctx.strokeStyle = g;
    ctx.lineWidth = s.w;
    ctx.beginPath();
    ctx.moveTo(s.a.x, s.a.y);
    ctx.lineTo(s.b.x, s.b.y);
    ctx.stroke();
  }
}

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2);
}

/** Tapered tube through screen points with per-point widths. */
export function tubePath(ctx: CanvasRenderingContext2D, pts: XY[], widths: number[]) {
  const n = pts.length;
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = widths[i] / 2;
    left.push({ x: pts[i].x - dy * w, y: pts[i].y + dx * w });
    right.push({ x: pts[i].x + dy * w, y: pts[i].y - dx * w });
  }
  smoothPath(ctx, [...left, ...right.reverse()], true);
}

export function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n = 5, inner = 0.45, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = rot + (i * Math.PI) / n;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  ctx.closePath();
}
