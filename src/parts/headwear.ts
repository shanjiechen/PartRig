import { ink, shade } from '../core/color';
import { lerp, smooth, TAU, type Vec3 } from '../core/math';
import { circle, fs, hp, hull, OL, polyPath, surf, tubePath, type P2, type RenderCtx } from '../render/context';
import { drawCap } from './hair';

export type Phase = 'back' | 'front';

export interface HatDef {
  id: string;
  name: string;
  color: string;
  color2: string;
  hideTufts?: boolean;
  hideTopEars?: boolean;
  draw: ((rc: RenderCtx, phase: Phase, c: string, c2: string, puff: number) => void) | null;
}

const ring = (rc: RenderCtx, y: number, r: number, n = 28, off: Vec3 = [0, 0, 0]): P2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU;
    return hp(rc.head, [Math.sin(a) * r + off[0], y + off[1], Math.cos(a) * r + off[2]]);
  });

function fillPts(rc: RenderCtx, pts: P2[], color: string) {
  polyPath(rc.ctx, pts);
  fs(rc.ctx, color, ink(color), OL);
}
const fillHull = (rc: RenderCtx, pts: P2[], color: string) => fillPts(rc, hull(pts), color);

/** Visible (front-facing) half of a band between two rings. */
function frontBand(rc: RenderCtx, y0: number, y1: number, r0: number, r1: number, color: string) {
  const n = 36;
  const lo: P2[] = [], hi: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const p0 = hp(rc.head, [Math.sin(a) * r0, y0, Math.cos(a) * r0]);
    const p1 = hp(rc.head, [Math.sin(a) * r1, y1, Math.cos(a) * r1]);
    if (p0.z > -0.5) lo.push(p0);
    if (p1.z > -0.5) hi.push(p1);
  }
  if (lo.length < 2 || hi.length < 2) return;
  lo.sort((a, b) => a.x - b.x);
  hi.sort((a, b) => b.x - a.x);
  fillPts(rc, [...lo, ...hi], color);
}

/** Thick 3D polyline; only the runs on the requested side of the head (by depth) are drawn. */
function stroke3D(rc: RenderCtx, pts3: Vec3[], width: number, color: string, phase: Phase) {
  const { ctx } = rc;
  const pts = pts3.map((q) => hp(rc.head, q));
  const runs: P2[][] = [];
  let cur: P2[] = [];
  for (const p of pts) {
    const want = phase === 'front' ? p.z >= 0 : p.z < 0;
    if (want) cur.push(p);
    else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [lw, col] of [[width + OL * 2, ink(color)], [width, color]] as const) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    for (const r of runs) {
      if (r.length < 2) continue;
      polyPath(ctx, r, false);
      ctx.stroke();
    }
  }
}

function flower(ctx: CanvasRenderingContext2D, p: P2, r: number, color: string) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    circle(ctx, p.x + Math.cos(a) * r * 0.6, p.y + Math.sin(a) * r * 0.6, r * 0.55);
    fs(ctx, color, ink(color), 0.45);
  }
  circle(ctx, p.x, p.y, r * 0.4);
  fs(ctx, '#ffd84a', '#a8801a', 0.4);
}

function meridians(rc: RenderCtx, puff: number, color: string, step: number, vMax: number) {
  const { ctx } = rc;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  for (let a = -Math.PI; a < Math.PI; a += step) {
    ctx.beginPath();
    let started = false;
    for (let v = -0.98; v <= vMax; v += 0.08) {
      const p = hp(rc.head, surf(a, v, 1 + puff));
      if (p.z < 0) {
        started = false;
        continue;
      }
      started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      started = true;
    }
    ctx.stroke();
  }
}

export const HATS: HatDef[] = [
  { id: 'none', name: '无', color: '#000', color2: '#000', draw: null },
  {
    id: 'cap', name: '棒球帽', color: '#d9443f', color2: '#f4f2ee', hideTufts: true,
    draw: (rc, phase, c, c2, puff) => {
      const h = rc.head;
      const R0 = 1.06 * (1 + puff * 0.6);
      const visorFront = hp(h, [0, 0.2, 1.5]).z > 0;
      const visor = () => {
        const pts: P2[] = [];
        for (let i = 0; i <= 12; i++) {
          const a = -1.15 + (2.3 * i) / 12;
          pts.push(hp(h, [Math.sin(a) * R0, 0.28, Math.cos(a) * R0]));
        }
        for (let i = 12; i >= 0; i--) {
          const a = -1.15 + (2.3 * i) / 12;
          const ext = 0.48 * Math.cos(a * 1.1);
          pts.push(hp(h, [Math.sin(a) * (R0 + ext * 0.4), 0.22, Math.cos(a) * R0 + ext]));
        }
        fillPts(rc, pts, c2);
      };
      if (phase === 'back') {
        if (!visorFront) visor();
        return;
      }
      drawCap(rc, (a) => -0.24 + (0.1 * Math.abs(a)) / Math.PI, puff + 0.06, c, {
        pattern: () => meridians(rc, puff + 0.06, shade(c, -0.2), Math.PI / 3, -0.25),
      });
      const b = hp(h, [0, 1.02 + puff * 0.9, 0]);
      circle(rc.ctx, b.x, b.y, 1.1);
      fs(rc.ctx, c2, ink(c2), 0.5);
      if (visorFront) visor();
    },
  },
  {
    id: 'tophat', name: '礼帽', color: '#2e2a36', color2: '#d9443f', hideTufts: true,
    draw: (rc, phase, c, c2, puff) => {
      if (phase === 'back') return;
      const y0 = 0.62 + puff * 0.6;
      fillPts(rc, ring(rc, y0, 1.28), c);
      fillHull(rc, [...ring(rc, y0, 0.76), ...ring(rc, y0 + 1.15, 0.8)], c);
      frontBand(rc, y0, y0 + 0.24, 0.77, 0.775, c2);
      fillPts(rc, ring(rc, y0 + 1.15, 0.8), shade(c, 0.15));
    },
  },
  {
    id: 'witch', name: '巫师帽', color: '#5a3a8a', color2: '#f6d25a', hideTufts: true,
    draw: (rc, phase, c, c2, puff) => {
      if (phase === 'back') return;
      const h = rc.head;
      const y0 = 0.5 + puff * 0.6;
      fillPts(rc, ring(rc, y0, 1.62), c);
      const tip: Vec3 = [0, y0 + 1.5, -0.3];
      fillHull(rc, [...ring(rc, y0, 0.88), hp(h, tip)], c);
      frontBand(rc, y0, y0 + 0.24, 0.885, 0.76, '#2e2a36');
      const bk = hp(h, [0, y0 + 0.12, 0.84]);
      if (bk.z > 0) {
        rc.ctx.beginPath();
        rc.ctx.rect(bk.x - 1.4, bk.y - 1.4, 2.8, 2.8);
        fs(rc.ctx, c2, ink(c2), 0.6);
      }
      const bend = [hp(h, [0, y0 + 1.4, -0.26]), hp(h, [0.05, y0 + 1.68, -0.65]), hp(h, [0.25, y0 + 1.6, -1.05])];
      tubePath(rc.ctx, bend, [0.3 * h.R, 0.17 * h.R, 0.03 * h.R]);
      fs(rc.ctx, c, ink(c), OL);
      const st = hp(h, [0.25, y0 + 1.6, -1.05]);
      circle(rc.ctx, st.x, st.y, 1.1);
      fs(rc.ctx, c2, ink(c2), 0.5);
    },
  },
  {
    id: 'beanie', name: '毛线帽', color: '#6fb8ee', color2: '#f4f2ee', hideTufts: true,
    draw: (rc, phase, c, c2, puff) => {
      if (phase === 'back') return;
      const p = puff + 0.08;
      drawCap(rc, () => -0.1, p, c, { pattern: () => meridians(rc, p, shade(c, -0.15), 0.28, -0.1) });
      drawCap(rc, () => 0.12, p + 0.05, c2, { topLine: () => -0.14 });
      const pp = hp(rc.head, [0, 1.12 + p, -0.05]);
      const { ctx } = rc;
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const a = (i / 20) * TAU;
        const r = rc.head.R * 0.3 * (1 + (i % 2 ? 0.12 : 0));
        ctx.lineTo(pp.x + Math.cos(a) * r, pp.y + Math.sin(a) * r);
      }
      ctx.closePath();
      fs(ctx, c2, ink(c2), 0.6);
    },
  },
  {
    id: 'straw', name: '草帽', color: '#ecc76a', color2: '#d9443f', hideTufts: true,
    draw: (rc, phase, c, c2, puff) => {
      if (phase === 'back') return;
      const y0 = 0.42 + puff * 0.6;
      fillPts(rc, ring(rc, y0, 1.8), c);
      for (const r of [1.25, 1.55]) {
        polyPath(rc.ctx, ring(rc, y0, r));
        fs(rc.ctx, null, shade(c, -0.15), 0.4);
      }
      fillHull(rc, [...ring(rc, y0, 0.9), ...ring(rc, y0 + 0.32, 0.84), ...ring(rc, y0 + 0.55, 0.62), ...ring(rc, y0 + 0.64, 0.3)], c);
      frontBand(rc, y0, y0 + 0.2, 0.9, 0.87, c2);
    },
  },
  {
    id: 'crown', name: '王冠', color: '#f5c542', color2: '#d9323c',
    draw: (rc, phase, c, c2, puff) => {
      if (phase === 'back') return;
      const { ctx } = rc;
      const h = rc.head;
      const r = 0.6, y0 = 0.72 + puff * 0.8, y1 = y0 + 0.3;
      const spikes = Array.from({ length: 5 }, (_, k) => {
        const a = (k / 5) * TAU;
        const tip = hp(h, [r * 1.05 * Math.sin(a), y1 + 0.42, r * 1.05 * Math.cos(a)]);
        return {
          tip,
          pts: [hp(h, [r * Math.sin(a - 0.42), y1 - 0.02, r * Math.cos(a - 0.42)]), tip, hp(h, [r * Math.sin(a + 0.42), y1 - 0.02, r * Math.cos(a + 0.42)])],
        };
      });
      const spike = (s: (typeof spikes)[number]) => {
        fillPts(rc, s.pts, c);
        circle(ctx, s.tip.x, s.tip.y, 1);
        fs(ctx, c, ink(c), 0.5);
      };
      spikes.filter((s) => s.tip.z < 0).forEach(spike);
      fillHull(rc, [...ring(rc, y0, r), ...ring(rc, y1, r)], c);
      fillPts(rc, ring(rc, y1, r), shade(c, -0.35));
      frontBand(rc, y0, y1, r, r, c);
      spikes.filter((s) => s.tip.z >= 0).forEach(spike);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        const g = hp(h, [r * 1.02 * Math.sin(a), (y0 + y1) / 2, r * 1.02 * Math.cos(a)]);
        if (g.z <= 0) continue;
        circle(ctx, g.x, g.y, 0.9);
        fs(ctx, k % 2 ? '#3a86d8' : c2, '#5a2a1a', 0.4);
      }
    },
  },
  {
    id: 'tiara', name: '公主头冠', color: '#e8e4f0', color2: '#ee6aa6',
    draw: (rc, phase, c, c2, puff) => {
      const pts: Vec3[] = [];
      for (let a = -1.25; a <= 1.25; a += 0.1) pts.push(surf(a, -0.52, 1.04 + puff));
      stroke3D(rc, pts, 1.1, c, phase);
      const p = hp(rc.head, surf(0, -0.58, 1.05 + puff));
      if ((p.z >= 0) !== (phase === 'front')) return;
      const { ctx } = rc;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(Math.max(0.35, Math.abs(Math.cos(rc.head.yaw))), 1);
      ctx.beginPath();
      ctx.moveTo(-3.2, 1);
      ctx.lineTo(-2.3, -1.6);
      ctx.lineTo(-1.1, 0);
      ctx.lineTo(0, -3.2);
      ctx.lineTo(1.1, 0);
      ctx.lineTo(2.3, -1.6);
      ctx.lineTo(3.2, 1);
      ctx.closePath();
      fs(ctx, c, ink(c), 0.5);
      circle(ctx, 0, -0.3, 0.9);
      fs(ctx, c2, ink(c2), 0.4);
      ctx.restore();
    },
  },
  {
    id: 'wreath', name: '花环', color: '#f5a3c0', color2: '#6cbf5a',
    draw: (rc, phase, c, c2, puff) => {
      const R = 0.86 + puff;
      const y = (a: number) => 0.6 + puff * 0.6 + 0.08 * Math.cos(a);
      const leaf: Vec3[] = [];
      for (let a = 0; a <= TAU + 0.01; a += 0.15) leaf.push([Math.sin(a) * R, y(a), Math.cos(a) * R]);
      stroke3D(rc, leaf, 1.4, c2, phase);
      const cols = [c, '#ffffff', '#ffd84a', shade(c, 0.35)];
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU;
        const p = hp(rc.head, [Math.sin(a) * R * 1.02, y(a), Math.cos(a) * R * 1.02]);
        if ((p.z >= 0) !== (phase === 'front')) continue;
        flower(rc.ctx, p, 2.1, cols[k % cols.length]);
      }
    },
  },
  {
    id: 'hairpin', name: '发簪', color: '#e0b040', color2: '#d9323c',
    draw: (rc, phase, c, c2, puff) => {
      const h = rc.head;
      const o = 1 + puff;
      const a: Vec3 = [0.72 * o, 0.52 * o, -0.62 * o], b: Vec3 = [-0.6 * o, 0.92 * o, -0.5 * o];
      const mid = hp(h, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
      if ((mid.z >= 0) !== (phase === 'front')) return;
      const { ctx } = rc;
      const pa = hp(h, [a[0] * 1.25, a[1] * 0.85, a[2] * 1.1]), pb = hp(h, b);
      ctx.lineCap = 'round';
      for (const [lw, col] of [[1.6, ink(c)], [1.0, c]] as const) {
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
      flower(ctx, pb, 2.3, c2);
      ctx.beginPath();
      ctx.moveTo(pb.x, pb.y);
      ctx.lineTo(pb.x - 0.5, pb.y + 5);
      fs(ctx, null, c, 0.4);
      for (let i = 1; i <= 3; i++) {
        circle(ctx, pb.x - 0.17 * i, pb.y + 1.7 * i, 0.55);
        fs(ctx, i === 3 ? c2 : c, ink(c), 0.3);
      }
    },
  },
  {
    id: 'bow', name: '蝴蝶结', color: '#e8505b', color2: '#ffffff',
    draw: (rc, phase, c, c2, puff) => {
      const h = rc.head;
      const q: Vec3 = [0.62 * (1 + puff), 0.8 * (1 + puff), 0.2];
      const p = hp(h, q);
      if ((p.z >= -2) !== (phase === 'front')) return;
      const { ctx } = rc;
      const f = Math.cos(0.7 + h.yaw);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(0.3);
      ctx.scale(Math.max(0.4, Math.abs(f)), 1);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(s * 4.5, -4.5, s * 5, 0);
        ctx.quadraticCurveTo(s * 4.5, 3.5, 0, 0);
        fs(ctx, c, ink(c), 0.6);
        ctx.beginPath();
        ctx.moveTo(s * 0.6, 0.8);
        ctx.lineTo(s * 2.2, 5);
        ctx.lineTo(s * 1.2, 4.6);
        fs(ctx, null, ink(c), 0.5);
      }
      circle(ctx, 0, 0, 1.3);
      fs(ctx, c, ink(c), 0.5);
      ctx.restore();
    },
  },
  {
    id: 'headband', name: '发带', color: '#f08c3a', color2: '#f4f2ee',
    draw: (rc, phase, c, c2, puff) => {
      const pts: Vec3[] = [];
      for (let t = -1.75; t <= 1.75; t += 0.08) {
        const x = Math.sin(t), y = Math.cos(t), z = 0.35;
        const l = Math.hypot(x, y, z);
        const s = (1.02 + puff) / l;
        pts.push([x * s, y * s, z * s]);
      }
      stroke3D(rc, pts, 0.15 * rc.head.R, c, phase);
    },
  },
  {
    id: 'horns', name: '恶魔角', color: '#4a3848', color2: '#8a6a88',
    draw: (rc, phase, c, c2, puff) => {
      const h = rc.head;
      const o = 1 + puff * 0.5;
      for (const s of [1, -1]) {
        const q: Vec3[] = [[s * 0.42 * o, 0.8 * o, 0.3], [s * 0.74 * o, 1.12 * o, 0.22], [s * 0.82 * o, 1.45 * o, 0.02], [s * 0.64 * o, 1.72 * o, -0.2]];
        const pts = q.map((v) => hp(h, v));
        if ((pts[0].z >= 0) !== (phase === 'front')) continue;
        tubePath(rc.ctx, pts, [0.3 * h.R, 0.24 * h.R, 0.14 * h.R, 0.02]);
        fs(rc.ctx, c, ink(c), OL);
        rc.ctx.beginPath();
        for (let i = 1; i < 3; i++) {
          const m = pts[i];
          rc.ctx.moveTo(m.x - 1.6, m.y + 0.6);
          rc.ctx.lineTo(m.x + 1.6, m.y - 0.3);
        }
        fs(rc.ctx, null, c2, 0.5);
      }
    },
  },
  {
    id: 'halo', name: '天使光环', color: '#ffe066', color2: '#ffffff',
    draw: (rc, phase, c, c2, puff) => {
      if (phase === 'back') return;
      const { ctx } = rc;
      const pts = ring(rc, 1.5 + puff + 0.05 * Math.sin(rc.time * 2.5), 0.62, 32);
      ctx.save();
      ctx.shadowColor = c;
      ctx.shadowBlur = 8;
      polyPath(ctx, pts);
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
      polyPath(ctx, pts);
      ctx.strokeStyle = c2;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    },
  },
  {
    id: 'bandana', name: '头巾', color: '#d9443f', color2: '#ffffff', hideTufts: true,
    draw: (rc, phase, c, c2, puff) => {
      const h = rc.head;
      const p = puff + 0.06;
      const knot = hp(h, [0, 0.25, -1.12 - puff]);
      const knotDraw = () => {
        const { ctx } = rc;
        for (const s of [1, -1]) {
          const t = [hp(h, [0, 0.22, -1.15 - puff]), hp(h, [s * 0.25, -0.3, -1.3 - puff]), hp(h, [s * 0.38, -0.8, -1.25 - puff])];
          tubePath(ctx, t, [0.2 * h.R, 0.17 * h.R, 0.06 * h.R]);
          fs(ctx, c, ink(c), OL);
        }
        circle(ctx, knot.x, knot.y, 0.2 * h.R);
        fs(ctx, c, ink(c), OL);
      };
      if (phase === 'back') {
        if (knot.z < 0) knotDraw();
        return;
      }
      drawCap(rc, (a) => lerp(-0.08, 0.32, smooth(Math.abs(a) / Math.PI)), p, c, {
        pattern: () => {
          rc.ctx.fillStyle = c2;
          for (let a = -Math.PI; a < Math.PI; a += 0.45)
            for (const v of [-0.85, -0.55, -0.25, 0.05]) {
              const q = hp(h, surf(a + v * 0.5, v, 1 + p));
              if (q.z < 0) continue;
              circle(rc.ctx, q.x, q.y, 0.75);
              rc.ctx.fill();
            }
        },
      });
      if (knot.z >= 0) knotDraw();
    },
  },
  {
    id: 'helmet', name: '骑士头盔', color: '#b8c2cc', color2: '#d9443f', hideTufts: true, hideTopEars: true,
    draw: (rc, phase, c, c2, puff) => {
      const h = rc.head;
      const plume = () => {
        const pts = [hp(h, [0, 1.12 + puff, 0.1]), hp(h, [0, 1.48 + puff, -0.35]), hp(h, [0, 1.38 + puff, -0.95]), hp(h, [0, 0.95 + puff, -1.35])];
        tubePath(rc.ctx, pts, [0.3 * h.R, 0.38 * h.R, 0.3 * h.R, 0.08 * h.R]);
        fs(rc.ctx, c2, ink(c2), OL);
      };
      if (phase === 'back') return;
      drawCap(rc, (a) => {
        const x = Math.abs(a);
        return x < 0.75 ? 0.0 : x < 1.2 ? lerp(0.0, 0.95, smooth((x - 0.75) / 0.45)) : 0.95;
      }, puff + 0.1, c, { shine: true });
      const f = Math.cos(h.yaw);
      if (f > -0.1) {
        const p = hp(h, surf(0, 0.12, 1.1 + puff));
        rc.ctx.save();
        rc.ctx.translate(p.x, p.y);
        rc.ctx.scale(Math.max(0.35, f), 1);
        rc.ctx.beginPath();
        rc.ctx.roundRect(-1.2, -4.5, 2.4, 10, 1);
        fs(rc.ctx, c, ink(c), 0.6);
        rc.ctx.restore();
      }
      plume();
    },
  },
  {
    id: 'beret', name: '贝雷帽', color: '#8e2f3f', color2: '#2e2a36', hideTufts: true,
    draw: (rc, phase, c, c2, puff) => {
      if (phase === 'back') return;
      const h = rc.head;
      const cx = 0.15, cy = 0.9 + puff, rr = 1.02 + puff, tilt = -0.25;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const pt = (x: number, y: number, z: number) => hp(h, [x * ct - y * st + cx, x * st + y * ct + cy, z - 0.05]);
      const pts: P2[] = [];
      for (let i = 0; i <= 6; i++) {
        const la = -Math.PI / 2 + (Math.PI * i) / 6;
        for (let k = 0; k < 20; k++) {
          const lo = (k / 20) * TAU;
          pts.push(pt(Math.cos(la) * Math.sin(lo) * rr, Math.sin(la) * 0.28, Math.cos(la) * Math.cos(lo) * rr));
        }
      }
      fillHull(rc, pts, c);
      const s = pt(0, 0.3, 0);
      circle(rc.ctx, s.x, s.y, 0.9);
      fs(rc.ctx, c2, ink(c2), 0.5);
    },
  },
];
