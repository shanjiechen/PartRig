import { ink, rgba } from '../core/color';
import { hash, TAU, type Vec3 } from '../core/math';
import { circle, drawLimb, fs, OL, polyPath, projectWorld, star, type P2, type RenderCtx, type XY } from './context';

export interface WeaponDef {
  id: string;
  name: string;
  hand: 'L' | 'R';
  /** Hand-local tip/base used for motion trails. */
  tip?: Vec3;
  base?: Vec3;
  draw: ((rc: RenderCtx, P: (v: Vec3) => P2) => void) | null;
}

const G = -1.4; // grip passes through the fist center

function blade(ctx: CanvasRenderingContext2D, a: XY, b: XY, w: number, tipLen: number, color: string) {
  let dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.6) {
    circle(ctx, b.x, b.y, w * 0.6);
    fs(ctx, color, ink(color), OL);
    return;
  }
  dx /= len;
  dy /= len;
  const nx = -dy * (w / 2), ny = dx * (w / 2);
  const t = Math.min(tipLen, len * 0.5);
  const c = { x: b.x - dx * t, y: b.y - dy * t };
  polyPath(ctx, [
    { x: a.x + nx, y: a.y + ny }, { x: c.x + nx, y: c.y + ny }, b,
    { x: c.x - nx, y: c.y - ny }, { x: a.x - nx, y: a.y - ny },
  ]);
  fs(ctx, color, ink(color), OL);
  ctx.beginPath();
  ctx.moveTo(a.x + dx * 1, a.y + dy * 1);
  ctx.lineTo(c.x, c.y);
  fs(ctx, null, 'rgba(255,255,255,0.75)', w * 0.18);
}

const shaft = (ctx: CanvasRenderingContext2D, a: XY, b: XY, w: number, color: string) => drawLimb(ctx, [{ a, b, w, color }]);

export const WEAPONS: WeaponDef[] = [
  { id: 'auto', name: '随动作', hand: 'R', draw: null },
  { id: 'none', name: '空手', hand: 'R', draw: null },
  {
    id: 'sword', name: '长剑', hand: 'R', tip: [0, G, 17], base: [0, G, 3],
    draw: (rc, P) => {
      const { ctx } = rc;
      shaft(ctx, P([0, G, -2.4]), P([0, G, 1.6]), 1.5, '#6b4430');
      circle(ctx, P([0, G, -2.8]).x, P([0, G, -2.8]).y, 1.1);
      fs(ctx, '#e8c050', '#6a5a1a', 0.5);
      blade(ctx, P([0, G, 2]), P([0, G, 17]), 2.2, 2.4, '#e4ebf2');
      shaft(ctx, P([-2.6, G, 1.8]), P([2.6, G, 1.8]), 1.3, '#e8c050');
    },
  },
  {
    id: 'spear', name: '长矛', hand: 'R', tip: [0, G, 25], base: [0, G, 12],
    draw: (rc, P) => {
      const { ctx } = rc;
      shaft(ctx, P([0, G, -12]), P([0, G, 20]), 1.3, '#8b5a3c');
      blade(ctx, P([0, G, 19.5]), P([0, G, 25.5]), 2.6, 3, '#dfe6ee');
      const t = P([0, G, 19]);
      circle(ctx, t.x, t.y, 1.1);
      fs(ctx, '#d9443f', '#6a1a1a', 0.5);
    },
  },
  {
    id: 'axe', name: '战斧', hand: 'R', tip: [0, -7, 11], base: [0, G, 5],
    draw: (rc, P) => {
      const { ctx } = rc;
      shaft(ctx, P([0, G, -3]), P([0, G, 13.5]), 1.5, '#8b5a3c');
      polyPath(ctx, [P([0, -2, 9]), P([0, -6.8, 7.2]), P([0, -7.6, 11.2]), P([0, -6.8, 15]), P([0, -2, 13.2])]);
      fs(ctx, '#cfd6de', ink('#cfd6de'), OL);
      polyPath(ctx, [P([0, -2, 13.2]), P([0, 1.5, 12.2]), P([0, 1.5, 10]), P([0, -2, 9])]);
      fs(ctx, '#9aa3ad', ink('#9aa3ad'), OL * 0.8);
    },
  },
  {
    id: 'dagger', name: '匕首', hand: 'R', tip: [0, G, 9], base: [0, G, 2],
    draw: (rc, P) => {
      const { ctx } = rc;
      shaft(ctx, P([0, G, -1.8]), P([0, G, 1.2]), 1.3, '#3b3a44');
      blade(ctx, P([0, G, 1.5]), P([0, G, 9]), 1.7, 2, '#e4ebf2');
      shaft(ctx, P([-1.6, G, 1.4]), P([1.6, G, 1.4]), 1, '#e8c050');
    },
  },
  {
    id: 'staff', name: '法杖', hand: 'R', tip: [0, G, 17], base: [0, G, 10],
    draw: (rc, P) => {
      const { ctx } = rc;
      shaft(ctx, P([0, G, -13]), P([0, G, 14.5]), 1.5, '#8b5a3c');
      for (const x of [-1.6, 1.6]) shaft(ctx, P([0, G, 13.5]), P([x, G, 17.5]), 0.8, '#6b4430');
      const o = P([0, G, 16.6]);
      const glow = rc.fx.glow ?? 0;
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 4 + glow * 5);
      g.addColorStop(0, rgba('#bff4ff', 0.6 + glow * 0.4));
      g.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = g;
      circle(ctx, o.x, o.y, 4 + glow * 5);
      ctx.fill();
      circle(ctx, o.x, o.y, 2.2);
      fs(ctx, '#6fd8ff', '#1a5a8a', 0.6);
      circle(ctx, o.x - 0.7, o.y - 0.7, 0.6);
      fs(ctx, '#ffffff', null);
    },
  },
  {
    id: 'wand', name: '魔杖', hand: 'R', tip: [0, G, 9], base: [0, G, 3],
    draw: (rc, P) => {
      const { ctx } = rc;
      shaft(ctx, P([0, G, -1.5]), P([0, G, 8]), 0.9, '#3b2a4a');
      const t = P([0, G, 9]);
      star(ctx, t.x, t.y, 2.2 + (rc.fx.glow ?? 0) * 1.2);
      fs(ctx, '#ffe066', '#a8801a', 0.5);
    },
  },
  {
    id: 'bow', name: '弓', hand: 'L',
    draw: (rc, P) => {
      const { ctx } = rc;
      const pts: P2[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = -1 + i / 8;
        pts.push(P([0, G - 4.2 * (1 - t * t) + 1.2 * t * t, 11.5 * t]));
      }
      const draw = rc.fx.draw ?? 0;
      const top = pts[16], bot = pts[0];
      const hand = projectWorld(rc.bw('handR', [0, G, 0]));
      const pull = { x: bot.x + (top.x - bot.x) / 2, y: bot.y + (top.y - bot.y) / 2 };
      const sp = { x: pull.x + (hand.x - pull.x) * draw, y: pull.y + (hand.y - pull.y) * draw };
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(sp.x, sp.y);
      ctx.lineTo(bot.x, bot.y);
      fs(ctx, null, '#f4f2ee', 0.35);
      ctx.lineCap = 'round';
      for (const [lw, c] of [[2.2, '#3a2418'], [1.4, '#9a5b32']] as const) {
        polyPath(ctx, pts, false);
        ctx.strokeStyle = c;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
      if (draw > 0.15) {
        const head = P([0, G - 6.5, 0]);
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(head.x, head.y);
        fs(ctx, null, '#8b5a3c', 0.6);
        circle(ctx, head.x, head.y, 0.8);
        fs(ctx, '#cfd6de', '#3a3a44', 0.3);
      }
    },
  },
  {
    id: 'potion', name: '药水', hand: 'R',
    draw: (rc, P) => {
      const { ctx } = rc;
      const b = P([0, G, 1.6]);
      shaft(ctx, P([0, G, 2.8]), P([0, G, 4.4]), 1.3, '#cfe8f0');
      const c = P([0, G, 4.8]);
      circle(ctx, c.x, c.y, 0.8);
      fs(ctx, '#8b5a3c', '#3a2418', 0.4);
      circle(ctx, b.x, b.y, 2.2);
      fs(ctx, '#ff6f9a', '#7a1f3a', 0.6);
      circle(ctx, b.x - 0.7, b.y - 0.7, 0.6);
      fs(ctx, '#ffffff', null);
    },
  },
  {
    id: 'shield', name: '剑盾', hand: 'L',
    draw: (rc, P) => {
      const { ctx } = rc;
      const c = P([0, -2.2, 0.5]);
      const f = Math.abs(rc.rig.handL.rot[7]) * 0.2;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 5.2 - f, 5.8, 0, 0, TAU);
      fs(ctx, '#3f6fb0', ink('#3f6fb0'), OL);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 3.8 - f, 4.4, 0, 0, TAU);
      fs(ctx, null, '#e8c050', 1);
      star(ctx, c.x, c.y, 1.8);
      fs(ctx, '#e8c050', '#6a5a1a', 0.4);
    },
  },
];

// ---------------- Effects ----------------

export interface Trail {
  tips: P2[];
  bases: P2[];
}

export function drawEffects(rc: RenderCtx, weapon: WeaponDef | undefined, trail: Trail | null) {
  const { ctx, fx } = rc;
  const slash = fx.slash ?? 0;
  if (trail && slash > 0.05 && trail.tips.length > 2) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, slash * 1.4);
    polyPath(ctx, [...trail.tips, ...[...trail.bases].reverse()]);
    const a = trail.tips[0], b = trail.tips[trail.tips.length - 1];
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(140,210,255,0)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
  const thrust = fx.thrust ?? 0;
  if (trail && thrust > 0.05 && trail.tips.length) {
    const t = trail.tips[0], b = trail.bases[0];
    const dx = t.x - b.x, dy = t.y - b.y;
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    ctx.strokeStyle = `rgba(255,255,255,${thrust})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const o of [-3, 0, 3]) {
      ctx.moveTo(t.x + nx * o - (dx / l) * 2, t.y + ny * o - (dy / l) * 2);
      ctx.lineTo(t.x + nx * o - (dx / l) * 12, t.y + ny * o - (dy / l) * 12);
    }
    ctx.stroke();
  }

  const handMid = (): P2 => {
    const a = rc.bp('handL', [0, -1.4, 0]), b = rc.bp('handR', [0, -1.4, 0]);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: Math.max(a.z, b.z) };
  };
  const orb = weapon?.id === 'staff' ? rc.bp('handR', [0, G, 16.6]) : weapon?.id === 'wand' ? rc.bp('handR', [0, G, 9]) : handMid();
  const glow = fx.glow ?? 0;
  if (glow > 0.05 && weapon?.id !== 'staff') {
    const r = 3 + glow * 5;
    const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * 1.6);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, 'rgba(160,120,255,0.8)');
    g.addColorStop(1, 'rgba(120,80,255,0)');
    ctx.fillStyle = g;
    circle(ctx, orb.x, orb.y, r * 1.6);
    ctx.fill();
  }
  if (glow > 0.05) {
    for (let i = 0; i < 5; i++) {
      const a = rc.time * 4 + (i / 5) * TAU;
      star(ctx, orb.x + Math.cos(a) * (6 + glow * 3), orb.y + Math.sin(a) * (3 + glow * 2), 0.9 * glow, 4, 0.4, 0);
      fs(ctx, '#fff6b0', null);
    }
  }
  const burst = fx.burst ?? 0;
  if (burst > 0.03) {
    const k = 1 - burst;
    ctx.strokeStyle = `rgba(180,140,255,${burst})`;
    ctx.lineWidth = 2 * burst + 0.4;
    circle(ctx, orb.x, orb.y, 4 + k * 16);
    ctx.stroke();
    const fwd = projectWorld([Math.sin(rc.yaw) * 60 * k, 0, Math.cos(rc.yaw) * 60 * k]);
    const p0 = projectWorld([0, 0, 0]);
    const bx = orb.x + fwd.x - p0.x, by = orb.y + fwd.y - p0.y;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, 5);
    g.addColorStop(0, `rgba(255,255,255,${burst})`);
    g.addColorStop(1, 'rgba(150,110,255,0)');
    ctx.fillStyle = g;
    circle(ctx, bx, by, 5);
    ctx.fill();
  }

  const arrow = fx.arrow ?? 0;
  if (arrow > 0.01 && arrow < 0.99) {
    const start = rc.bw('handL', [0, G, 0]);
    const dir: Vec3 = [Math.sin(rc.yaw), 0, Math.cos(rc.yaw)];
    const d = arrow * 90;
    const a = projectWorld([start[0] + dir[0] * d, start[1], start[2] + dir[2] * d]);
    const b = projectWorld([start[0] + dir[0] * (d - 9), start[1], start[2] + dir[2] * (d - 9)]);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(a.x, a.y);
    fs(ctx, null, '#8b5a3c', 0.8);
    circle(ctx, a.x, a.y, 1);
    fs(ctx, '#cfd6de', '#3a3a44', 0.3);
  }

  const sparkle = fx.sparkle ?? 0;
  if (sparkle > 0.03) {
    const c = rc.bp('chest', [0, 8, 0]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + rc.time * 1.5;
      const r = 12 + hash(i) * 8;
      const y = c.y - ((rc.time * 12 + i * 7) % 30) + 10;
      star(ctx, c.x + Math.cos(a) * r, y, (0.8 + hash(i + 3)) * sparkle * 1.6, 4, 0.35, 0);
      fs(ctx, i % 2 ? '#a8ffcf' : '#fff6b0', null);
    }
  }

  const flash = fx.flash ?? 0;
  if (flash > 0.2) {
    const c = rc.bp('chest', [0, 10, 6]);
    star(ctx, c.x + 3, c.y - 4, 7 * flash, 8, 0.45, rc.time);
    fs(ctx, `rgba(255,240,150,${flash})`, `rgba(255,120,60,${flash})`, 0.8);
  }
}
