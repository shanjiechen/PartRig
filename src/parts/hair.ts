import { ink, mix, shade } from '../core/color';
import { lerp, smooth, wrapAngle, type Vec3 } from '../core/math';
import { circle, cyl, fs, hp, OL, smoothPath, surf, tubePath, type RenderCtx, type XY } from '../render/context';

type Line = (a: number) => number;

export interface Tuft {
  a: number;
  v: number;
  len: number;
  w: number;
  lean?: number;
  round?: boolean;
}
export interface HairTube {
  pts: Vec3[];
  w: number[];
  tie?: boolean;
  braid?: boolean;
}
export interface HairBun {
  at: Vec3;
  r: number;
}
export interface HairDef {
  id: string;
  name: string;
  cap?: { line: Line; puff: number };
  under?: Line;
  tufts?: Tuft[];
  back?: { len: number; w: number; wave?: number; cut: 'point' | 'straight' | 'round' };
  tubes?: HairTube[];
  buns?: HairBun[];
  ahoge?: boolean;
}

const H = Math.PI / 2;

/** Hairline v(a): a = local azimuth (0 = front), v = how far down the hair edge reaches (-1 top .. 1 chin). */
function hl(front: number, side: number, back: number, o: { jag?: number; n?: number; part?: number; span?: number } = {}): Line {
  return (a) => {
    const x = Math.abs(a);
    let v = x < H ? lerp(front, side, smooth(x / H)) : lerp(side, back, smooth(Math.min(1, (x - H) / H)));
    if (o.part) v += o.part * Math.sin(a) * Math.max(0, 1 - x / 2);
    const span = o.span ?? 1.4;
    if (o.jag && x < span) v += (o.jag * (1 - Math.abs(Math.sin(a * (o.n ?? 8)))) - o.jag * 0.4) * (1 - x / span);
    return v;
  };
}

const mirrorTube = (t: HairTube): HairTube => ({ ...t, pts: t.pts.map(([x, y, z]) => [-x, y, z] as Vec3) });

const twinTail: HairTube = {
  pts: [[0.78, 0.5, -0.3], [1.15, 0.4, -0.35], [1.35, -0.1, -0.3], [1.3, -0.8, -0.25], [1.1, -1.45, -0.2]],
  w: [0.3, 0.42, 0.46, 0.38, 0.08],
  tie: true,
};

function ring(v: number, len: number, w: number, step: number, from = -Math.PI, to = Math.PI, lean = 0): Tuft[] {
  const out: Tuft[] = [];
  for (let a = from; a <= to + 1e-6; a += step) out.push({ a, v, len, w, lean });
  return out;
}

const afroTufts: Tuft[] = [];
for (const [v, n] of [[-0.9, 5], [-0.5, 10], [-0.1, 12], [0.3, 12]] as const) {
  for (let i = 0; i < n; i++) afroTufts.push({ a: (i / n) * Math.PI * 2 + v, v, len: 0.12, w: 0.55, round: true });
}

export const HAIRS: HairDef[] = [
  { id: 'bald', name: '光头' },
  { id: 'buzz', name: '寸头', under: hl(-0.5, 0.15, 0.55) },
  {
    id: 'short', name: '碎短发',
    cap: { line: hl(-0.05, 0.4, 0.55, { jag: 0.18, n: 7 }), puff: 0.1 },
    tufts: [
      { a: 2.5, v: 0.05, len: 0.28, w: 0.4, lean: -0.2 },
      { a: -2.5, v: 0.05, len: 0.28, w: 0.4, lean: -0.2 },
      { a: Math.PI, v: 0.2, len: 0.25, w: 0.4, lean: -0.3 },
    ],
  },
  {
    id: 'spiky', name: '刺猬头',
    cap: { line: hl(-0.15, 0.25, 0.5, { jag: 0.22, n: 6 }), puff: 0.12 },
    tufts: [
      ...ring(-0.62, 0.5, 0.8, 0.7, -2.8, 2.8, 0.35),
      ...ring(-0.15, 0.42, 0.75, 0.55, 1.9, 4.4, 0.1),
      { a: 0, v: -0.92, len: 0.55, w: 0.85, lean: 0.2 },
      { a: 0.9, v: -0.05, len: 0.3, w: 0.6, lean: 0.1 },
      { a: -0.9, v: -0.05, len: 0.3, w: 0.6, lean: 0.1 },
    ],
  },
  { id: 'sidepart', name: '三七分', cap: { line: hl(-0.05, 0.4, 0.55, { part: -0.4, jag: 0.06, n: 10 }), puff: 0.1 } },
  { id: 'bowl', name: '锅盖头', cap: { line: hl(0.04, 0.45, 0.55, { jag: 0.04, n: 20 }), puff: 0.17 } },
  {
    id: 'pompadour', name: '飞机头',
    cap: { line: hl(-0.42, 0.2, 0.5), puff: 0.08 },
    tufts: [
      { a: 0, v: -0.62, len: 0.35, w: 0.95, lean: 0.25, round: true },
      { a: 0.5, v: -0.62, len: 0.3, w: 0.75, lean: 0.2, round: true },
      { a: -0.5, v: -0.62, len: 0.3, w: 0.75, lean: 0.2, round: true },
    ],
  },
  {
    id: 'mohawk', name: '莫西干',
    under: hl(-0.45, 0.2, 0.55),
    tufts: [
      { a: 0, v: -0.45, len: 0.42, w: 0.7, lean: 0.3 },
      { a: 0, v: -0.78, len: 0.5, w: 0.75, lean: 0.2 },
      { a: 0, v: -0.99, len: 0.55, w: 0.75 },
      { a: Math.PI, v: -0.78, len: 0.5, w: 0.75, lean: 0.2 },
      { a: Math.PI, v: -0.45, len: 0.45, w: 0.7, lean: 0.25 },
      { a: Math.PI, v: -0.1, len: 0.35, w: 0.6, lean: 0.2 },
    ],
  },
  { id: 'bob', name: '波波头', cap: { line: hl(0.02, 0.95, 0.9, { jag: 0.05, n: 12 }), puff: 0.16 } },
  {
    id: 'long', name: '长直发',
    cap: { line: hl(0.03, 1.05, 1.0, { jag: 0.1, n: 9 }), puff: 0.12 },
    back: { len: 1.5, w: 1.0, cut: 'point' },
  },
  {
    id: 'ponytail', name: '马尾',
    cap: { line: hl(-0.02, 0.45, 0.45, { jag: 0.14, n: 8 }), puff: 0.08 },
    tubes: [{
      pts: [[0, 0.5, -0.9], [0, 0.4, -1.3], [0, -0.1, -1.45], [0, -0.7, -1.35], [0, -1.35, -1.15]],
      w: [0.36, 0.48, 0.5, 0.4, 0.1],
      tie: true,
    }],
  },
  {
    id: 'twintail', name: '双马尾',
    cap: { line: hl(0.02, 0.5, 0.6, { jag: 0.1, n: 9 }), puff: 0.1 },
    tubes: [twinTail, mirrorTube(twinTail)],
  },
  {
    id: 'bun', name: '丸子头',
    cap: { line: hl(0.0, 0.45, 0.55, { jag: 0.08, n: 9 }), puff: 0.08 },
    buns: [{ at: [0, 1.08, -0.35], r: 0.42 }],
  },
  {
    id: 'twinbun', name: '双丸子',
    cap: { line: hl(0.02, 0.5, 0.55, { jag: 0.08, n: 9 }), puff: 0.08 },
    buns: [{ at: [0.66, 0.82, -0.15], r: 0.36 }, { at: [-0.66, 0.82, -0.15], r: 0.36 }],
  },
  {
    id: 'braid', name: '麻花辫',
    cap: { line: hl(0.0, 0.5, 0.6, { jag: 0.06, n: 10 }), puff: 0.08 },
    tubes: [{
      pts: [[0, 0.1, -1.0], [0, -0.35, -1.12], [0, -0.95, -1.08], [0, -1.6, -0.95]],
      w: [0.42, 0.4, 0.34, 0.16],
      braid: true,
      tie: true,
    }],
  },
  { id: 'afro', name: '爆炸头', cap: { line: hl(-0.25, 0.35, 0.6), puff: 0.3 }, tufts: afroTufts },
  {
    id: 'wavy', name: '大波浪',
    cap: { line: hl(0.02, 1.0, 1.0, { jag: 0.08, n: 7 }), puff: 0.18 },
    back: { len: 1.35, w: 1.18, wave: 0.12, cut: 'round' },
  },
  {
    id: 'hime', name: '公主切',
    cap: {
      line: (a) => {
        const x = Math.abs(a);
        return x < 0.95 ? 0.06 : x < 1.4 ? 0.85 : 1.0;
      },
      puff: 0.12,
    },
    back: { len: 1.6, w: 1.0, cut: 'straight' },
  },
  {
    id: 'ahoge', name: '呆毛短发',
    cap: { line: hl(0.0, 0.5, 0.55, { jag: 0.14, n: 8 }), puff: 0.12 },
    ahoge: true,
  },
];

// ---------------- rendering ----------------

export interface CapOpts {
  topLine?: Line;
  shine?: boolean;
  pattern?: () => void;
  outline?: boolean;
}

/** Fill the head-covering region above a hairline (used by hair and cap-like hats). */
export function drawCap(rc: RenderCtx, line: Line, puff: number, color: string, o: CapOpts = {}) {
  const { ctx, head: h } = rc;
  const rx = h.R * h.sx * (1 + puff), ry = h.R * h.sy * (1 + puff * 0.9);
  const oy = -h.R * h.sy * puff * 0.45;
  const sample = (fn: Line) => {
    const pts: XY[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = -H + (Math.PI * i) / 64 - h.yaw;
      pts.push(hp(h, cyl(a, fn(wrapAngle(a)), 1 + puff)));
    }
    return pts;
  };
  const low = sample(line);
  const high = o.topLine ? sample(o.topLine) : null;
  const region = () => {
    ctx.beginPath();
    low.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    if (high) for (let i = high.length - 1; i >= 0; i--) ctx.lineTo(high[i].x, high[i].y);
    else {
      ctx.lineTo(low[low.length - 1].x, -h.R * 5);
      ctx.lineTo(low[0].x, -h.R * 5);
    }
    ctx.closePath();
  };
  const L = h.R * 1.9;
  const side = (dir: 1 | -1) => {
    // right side goes down, left side goes up (keeps clockwise winding for the union clip)
    if (dir === 1) ctx.bezierCurveTo(rx, oy + L * 0.45, rx * 0.93, oy + L * 0.8, rx * 0.8, oy + L);
    else ctx.bezierCurveTo(-rx * 0.93, oy + L * 0.8, -rx, oy + L * 0.45, -rx, oy);
  };
  const clip = () => {
    ctx.beginPath();
    ctx.ellipse(0, oy, rx, ry, 0, 0, Math.PI * 2);
    ctx.moveTo(-rx, oy);
    ctx.lineTo(rx, oy);
    side(1);
    ctx.lineTo(-rx * 0.8, oy + L);
    side(-1);
    ctx.closePath();
  };
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(-rx * 0.8, oy + L);
    side(-1);
    ctx.ellipse(0, oy, rx, ry, 0, Math.PI, Math.PI * 2);
    side(1);
  };
  ctx.save();
  clip();
  ctx.clip();
  region();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (o.pattern) o.pattern();
  if (o.shine) {
    ctx.beginPath();
    ctx.ellipse(-rx * 0.12, oy - ry * 0.35, rx * 0.62, ry * 0.3, -0.15, Math.PI * 1.05, Math.PI * 1.75);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = ry * 0.09;
    ctx.lineCap = 'round';
    ctx.setLineDash([ry * 0.18, ry * 0.08]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  outline();
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = OL * 2;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  low.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  if (high) {
    ctx.moveTo(high[0].x, high[0].y);
    high.forEach((p) => ctx.lineTo(p.x, p.y));
  }
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = OL;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

export function drawTuft(rc: RenderCtx, t: Tuft, puff: number, color: string) {
  const { ctx, head: h } = rc;
  const base = hp(h, surf(t.a, t.v, 1 + puff * 0.7));
  const tip = hp(h, surf(t.a, t.v - (t.lean ?? 0), 1 + puff * 0.7 + t.len));
  const w = t.w * h.R * 0.5;
  if (t.round) {
    circle(ctx, (base.x + tip.x) / 2, (base.y + tip.y) / 2, w);
    fs(ctx, color, ink(color), OL);
    return;
  }
  const dx = tip.x - base.x, dy = tip.y - base.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const nx = -dy / len, ny = dx / len;
  ctx.beginPath();
  ctx.moveTo(base.x + nx * w, base.y + ny * w);
  ctx.quadraticCurveTo(base.x + dx * 0.55 + nx * w * 0.35, base.y + dy * 0.55 + ny * w * 0.35, tip.x, tip.y);
  ctx.quadraticCurveTo(base.x + dx * 0.5 - nx * w * 0.2, base.y + dy * 0.5 - ny * w * 0.2, base.x - nx * w, base.y - ny * w);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = OL;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function drawHairTube(rc: RenderCtx, t: HairTube, color: string) {
  const { ctx, head: h } = rc;
  const pts = t.pts.map((q) => hp(h, q));
  const widths = t.w.map((w) => w * h.R);
  tubePath(ctx, pts, widths);
  fs(ctx, color, ink(color), OL);
  if (t.braid) {
    ctx.save();
    tubePath(ctx, pts, widths);
    ctx.clip();
    ctx.strokeStyle = shade(color, -0.3);
    ctx.lineWidth = 0.6;
    for (let i = 0; i < pts.length - 1; i++) {
      for (let k = 0; k < 3; k++) {
        const u = (k + 0.5) / 3;
        const x = lerp(pts[i].x, pts[i + 1].x, u), y = lerp(pts[i].y, pts[i + 1].y, u);
        const w = lerp(widths[i], widths[i + 1], u) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - w, y - w * 0.4);
        ctx.quadraticCurveTo(x, y + w * 0.5, x + w, y - w * 0.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else {
    smoothPath(ctx, pts.slice(1), false);
    fs(ctx, null, shade(color, -0.22), 0.5);
  }
  if (t.tie) {
    circle(ctx, pts[0].x, pts[0].y, widths[0] * 0.38);
    fs(ctx, '#e8505b', '#7a1f2a', 0.6);
  }
}

export function drawBun(rc: RenderCtx, b: HairBun, color: string) {
  const { ctx, head: h } = rc;
  const p = hp(h, b.at);
  const r = b.r * h.R * h.sx;
  circle(ctx, p.x, p.y, r);
  fs(ctx, color, ink(color), OL);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 0.6, -2.4, 0.2);
  ctx.arc(p.x + r * 0.1, p.y + r * 0.05, r * 0.3, 0.2, 3);
  fs(ctx, null, shade(color, -0.25), 0.5);
  ctx.beginPath();
  ctx.arc(p.x - r * 0.3, p.y - r * 0.35, r * 0.28, 3.4, 4.8);
  fs(ctx, null, 'rgba(255,255,255,0.5)', 0.8);
}

export function drawAhoge(rc: RenderCtx, color: string) {
  const { ctx, head: h } = rc;
  const pts = [hp(h, [0, 1.08, 0.05]), hp(h, [0.05, 1.45, 0.1]), hp(h, [0.35, 1.5, 0.15]), hp(h, [0.42, 1.28, 0.2])];
  tubePath(ctx, pts, [0.16 * h.R, 0.12 * h.R, 0.07 * h.R, 0.01]);
  fs(ctx, color, ink(color), OL);
}

/** Long hair hanging behind the head (a separately depth-sorted layer). */
export function drawBackHair(rc: RenderCtx, d: HairDef, color: string) {
  const b = d.back;
  if (!b) return;
  const { ctx, head: h } = rc;
  const puff = d.cap?.puff ?? 0.1;
  const n = 8;
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = lerp(-0.1, 1 + b.len, t);
    const W = (1 + puff) * b.w * (1 + 0.1 * t);
    let min: XY | null = null, max: XY | null = null;
    for (let k = 0; k <= 12; k++) {
      const a = H + (Math.PI * k) / 12;
      const p = hp(h, [Math.sin(a) * W, -v, Math.cos(a) * W * 0.8 - 0.1]);
      if (!min || p.x < min.x) min = p;
      if (!max || p.x > max.x) max = p;
    }
    const wave = b.wave ? Math.sin(v * 5) * b.wave * h.R : 0;
    left.push({ x: min!.x + wave, y: min!.y });
    right.push({ x: max!.x + wave, y: max!.y });
  }
  const bl = left[n], br = right[n];
  const bottom: XY[] = [];
  const spikes = 5;
  for (let i = 1; i < spikes * 2; i++) {
    const u = i / (spikes * 2);
    const x = lerp(bl.x, br.x, u), y = lerp(bl.y, br.y, u);
    if (b.cut === 'point') bottom.push({ x, y: y - (i % 2 ? 0 : h.R * 0.18) });
    else if (b.cut === 'round') bottom.push({ x, y: y + Math.sin(u * Math.PI) * h.R * 0.12 });
    else bottom.push({ x, y });
  }
  const outline = [...left, ...bottom, ...[...right].reverse()];
  const fill = shade(color, -0.1);
  smoothPath(ctx, outline, true);
  ctx.fillStyle = fill;
  ctx.fill();
  smoothPath(ctx, outline.slice(1, -1), false);
  fs(ctx, null, ink(color), OL);
  ctx.beginPath();
  for (const s of [0.3, 0.5, 0.7]) {
    const a = { x: lerp(left[2].x, right[2].x, s), y: lerp(left[2].y, right[2].y, s) };
    const e = { x: lerp(bl.x, br.x, s), y: lerp(bl.y, br.y, s) - h.R * 0.15 };
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(a.x + (e.x - a.x) * 0.3 + 1, (a.y + e.y) / 2, e.x, e.y);
  }
  fs(ctx, null, shade(color, -0.3), 0.5);
}

export const stubbleColor = (skin: string, hair: string) => mix(skin, hair, 0.55);
