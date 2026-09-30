import { ink, mix, rgba, shade } from '../core/color';
import { clamp, lerp, mulV, TAU, type Vec3 } from '../core/math';
import type { BoneName } from '../core/skeleton';
import type { BottomDef, ShoeDef, TopDef } from '../parts/clothing';
import { drawMotif, ribbon, type Motif } from '../parts/ornaments';
import { circle, drawLimb, fs, heart, hull, materialFill, OL, polyPath, projectWorld, smoothPath, star, type P2, type RenderCtx, type Seg, type XY } from './context';

// ---------------- Torso geometry ----------------

export interface Torso {
  p(a: number, h: number, out?: number): P2;
  nz(a: number, h: number): number;
  frontArc(h: number, out?: number): P2[];
  silhouette(): XY[];
}

export function makeTorso(rc: RenderCtx): Torso {
  const d = rc.dims;
  const prof: number[][] = [
    [-3.5, d.hipW * 0.9, 4.9], [-1.5, d.hipW, 5.3], [1, d.hipW * 0.97, 5.2], [4, d.waistW, d.waistD],
    [8, d.chestW, 5.2], [12, d.chestW * 1.02, 5.2], [14.5, d.shoulderW, 5.0], [16.3, d.shoulderW * 0.72, 4.3], [17.6, 3.4, 3.0],
  ];
  const radii = (h: number): [number, number] => {
    if (h <= prof[0][0]) return [prof[0][1], prof[0][2]];
    for (let i = 1; i < prof.length; i++) {
      if (h <= prof[i][0]) {
        const t = (h - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0]);
        return [lerp(prof[i - 1][1], prof[i][1], t), lerp(prof[i - 1][2], prof[i][2], t)];
      }
    }
    const l = prof[prof.length - 1];
    return [l[1], l[2]];
  };
  const frame = (h: number): [BoneName, number] => (h < 2 ? ['pelvis', h] : ['chest', h - 1]);
  const p = (a: number, h: number, out = 1) => {
    const [W, D] = radii(h);
    const [b, y] = frame(h);
    let depth = Math.cos(a) * D;
    if (d.bust > 0) {
      const angle = Math.atan2(Math.sin(a), Math.cos(a));
      const vertical = Math.exp(-Math.pow((h - 10) / 3.1, 2));
      const lobes = .66 * (Math.exp(-Math.pow((angle - .46) / .55, 2)) + Math.exp(-Math.pow((angle + .46) / .55, 2)));
      depth += d.bust * vertical * lobes * Math.max(0, Math.cos(a));
    }
    return rc.bp(b, [Math.sin(a) * W * out, y, depth * out]);
  };
  const nz = (a: number, h: number) => mulV(rc.rig[frame(h)[0]].rot, [Math.sin(a), 0, Math.cos(a)])[2];
  const frontArc = (h: number, out = 1) => {
    const pts: P2[] = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU;
      if (nz(a, h) > -0.05) pts.push(p(a, h, out));
    }
    return pts.sort((x, y) => x.x - y.x);
  };
  const silhouette = () => {
    const levels = [17.6, 16.3, 15.3, 14.5, 13, 11, 9, 7, 5, 3, 1, -1, -2.5, -3.5];
    const L: XY[] = [], R: XY[] = [];
    for (const h of levels) {
      let mn: P2 | null = null, mx: P2 | null = null;
      for (let i = 0; i < 20; i++) {
        const q = p((i / 20) * TAU, h);
        if (!mn || q.x < mn.x) mn = q;
        if (!mx || q.x > mx.x) mx = q;
      }
      L.push(mn!);
      R.push(mx!);
    }
    const bottom = frontArc(-3.5).filter((q) => q.x > L[L.length - 1].x && q.x < R[R.length - 1].x);
    return [...L, ...bottom, ...R.reverse()];
  };
  return { p, nz, frontArc, silhouette };
}

// ---------------- Torso drawing ----------------

function band(rc: RenderCtx, T: Torso, h0: number, h1: number, color: string, out = 1.03) {
  const a0 = T.frontArc(h0, out), a1 = T.frontArc(h1, out);
  if (a0.length < 2 || a1.length < 2) return;
  polyPath(rc.ctx, [...a0, ...a1.reverse()]);
  fs(rc.ctx, color, ink(color), OL * 0.8);
}

/** Vertical strip on the torso surface between azimuths a0..a1 (front or back). */
function vStrip(rc: RenderCtx, T: Torso, a0: number, a1: number, h0: number, h1: number, color: string, out = 1.04) {
  if (T.nz((a0 + a1) / 2, (h0 + h1) / 2) < 0.1) return;
  const pts: P2[] = [];
  const n = 6;
  for (let i = 0; i <= n; i++) pts.push(T.p(a0, lerp(h0, h1, i / n), out));
  for (let i = n; i >= 0; i--) pts.push(T.p(a1, lerp(h0, h1, i / n), out));
  polyPath(rc.ctx, pts);
  fs(rc.ctx, color, ink(color), OL * 0.8);
}

function surfPoly(rc: RenderCtx, T: Torso, pts: [number, number][], color: string, stroke: string | null = ink(color), out = 1.04) {
  const mid = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]);
  if (T.nz(mid[0], mid[1]) < 0.1) return;
  polyPath(rc.ctx, pts.map(([a, h]) => T.p(a, h, out)));
  fs(rc.ctx, color, stroke, OL * 0.8);
}

function surfLine(rc: RenderCtx, T: Torso, pts: [number, number][], color: string, lw: number, out = 1.04) {
  const { ctx } = rc;
  ctx.beginPath();
  let drawing = false;
  for (const [a, h] of pts) {
    if (T.nz(a, h) < 0.05) {
      drawing = false;
      continue;
    }
    const q = T.p(a, h, out);
    drawing ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
    drawing = true;
  }
  fs(ctx, null, color, lw);
}

function tDecal(rc: RenderCtx, T: Torso, a: number, h: number, draw: () => void) {
  const f = T.nz(a, h);
  if (f < 0.08) return;
  const q = T.p(a, h, 1.05);
  rc.ctx.save();
  rc.ctx.translate(q.x, q.y);
  if (rc.app.style === 'aistory') {
    const up = T.p(a, h + 1, 1.05);
    rc.ctx.rotate(Math.atan2(up.y - q.y, up.x - q.x) + Math.PI / 2);
  }
  rc.ctx.scale(Math.max(0.3, f), 1);
  draw();
  rc.ctx.restore();
}

export function drawTorso(rc: RenderCtx, top: TopDef, bottom: BottomDef) {
  const { ctx, pal } = rc;
  const T = makeTorso(rc);
  const sil = T.silhouette();
  const tc = pal.top, t2 = top.color2;
  smoothPath(ctx, sil);
  const center = T.p(0, 8);
  ctx.fillStyle = materialFill(ctx, pal.bottom, center.x, center.y, 15, .8);
  ctx.fill();
  ctx.save();
  smoothPath(ctx, sil);
  ctx.clip();

  if (bottom.pockets || bottom.kind === 'pants') {
    surfLine(rc, T, [[0, -3.5], [0, 0.5]], shade(pal.bottom, -0.3), 0.5);
  }

  const hem = T.frontArc(top.hem, 1.02);
  const reg: XY[] | null = hem.length >= 2
    ? [{ x: -999, y: hem[0].y }, ...hem, { x: 999, y: hem[hem.length - 1].y }, { x: 999, y: -999 }, { x: -999, y: -999 }]
    : null;
  if (reg) {
    polyPath(ctx, reg);
    ctx.fillStyle = materialFill(ctx, tc, center.x, center.y, 15, .85);
    ctx.fill();
    polyPath(ctx, hem, false);
    fs(ctx, null, ink(tc), OL);
  }

  if (top.armor) {
    for (const h of [6, 10]) surfLine(rc, T, Array.from({ length: 17 }, (_, i) => [-1.6 + i * 0.2, h] as [number, number]), shade(tc, -0.3), 0.6);
    surfLine(rc, T, Array.from({ length: 9 }, (_, i) => [-1.1 + i * 0.1, 13.5 - Math.abs(-1.1 + i * 0.1) * 2] as [number, number]), 'rgba(255,255,255,0.7)', 0.8);
  }
  if (top.stripes) for (const h of [4.2, 8.2, 12.2]) band(rc, T, h, h + 1.3, top.stripes, 1.02);
  if (top.open) {
    vStrip(rc, T, -0.34, 0.34, top.hem, 17.6, t2);
    surfLine(rc, T, [[-0.34, top.hem], [-0.34, 17.6]], ink(tc), 0.7);
    surfLine(rc, T, [[0.34, top.hem], [0.34, 17.6]], ink(tc), 0.7);
  }
  if (top.zipper) surfLine(rc, T, [[0, top.hem], [0, 17]], shade(tc, -0.4), 0.5);
  if (top.embroidery) {
    for (const a of [-.55, .55, Math.PI]) tDecal(rc, T, a, 8.6, () => drawMotif(ctx, top.embroidery!, 0, 0, 1.8, t2));
  }

  // Cloth falls over the chest, then gathers at the waist. Every mark is projected from the torso surface.
  for (const a of [-1.12, 1.12, Math.PI - .7, Math.PI + .7]) {
    surfLine(rc, T, [[a, 13], [a * .88, 8], [a * .93, 4]], rgba(ink(tc), .22), .34);
    surfLine(rc, T, [[a + .04, 12], [a * .88 + .04, 8], [a * .93 + .04, 4]], rgba(shade(tc, .65), .38), .3);
  }
  if (rc.dims.bust > 0) {
    for (const a of [-.48, .48]) {
      if (T.nz(a, 10) < .05) continue;
      const patch = Array.from({ length: 32 }, (_, i) => {
        const theta = i / 32 * TAU;
        return T.p(a + Math.cos(theta) * .52, 10 + Math.sin(theta) * 2.8, 1.01);
      });
      smoothPath(ctx, patch);
      const q = T.p(a, 10.4);
      const g = ctx.createRadialGradient(q.x - .55, q.y - .6, .1, q.x, q.y, 4.4);
      g.addColorStop(0, rgba(shade(tc, .6), top.armor ? .23 : .3));
      g.addColorStop(.5, rgba(shade(tc, .3), .1));
      g.addColorStop(1, rgba(ink(tc), .2));
      fs(ctx, g, null);
      const fold = Array.from({ length: 13 }, (_, i) => {
        const u = i / 12 * 2 - 1;
        return [a + u * .38, 7.7 + u * u * 1.05] as [number, number];
      });
      surfLine(rc, T, fold, rgba(ink(tc), .42), .42);
      surfLine(rc, T, fold.map(([angle, height]) => [angle, height - .15]), rgba(shade(tc, .7), .45), .22);
    }
  }
  if (top.pocket) surfPoly(rc, T, [[-0.62, 0], [-0.45, 5.2], [0.45, 5.2], [0.62, 0]], shade(tc, -0.06));
  if (bottom.straps) {
    for (const s of [-1, 1]) {
      vStrip(rc, T, s * 0.34, s * 0.56, 2, 16.6, pal.bottom);
      vStrip(rc, T, Math.PI + s * 0.34, Math.PI + s * 0.56, 2, 16.6, pal.bottom);
      tDecal(rc, T, s * 0.45, 12.5, () => { circle(ctx, 0, 0, 0.8); fs(ctx, bottom.color2 ?? '#f6d25a', '#6a5a1a', 0.4); });
    }
    vStrip(rc, T, -0.56, 0.56, 1, 9, pal.bottom);
  }
  if (top.belt) {
    const bh = top.skirt ? 2.2 : 1.6;
    band(rc, T, bh, bh + (top.collar === 'cross' ? 4.5 : 1.8), top.belt);
    if (top.collar !== 'cross') tDecal(rc, T, 0, bh + 0.9, () => { ctx.beginPath(); ctx.rect(-1.2, -1.1, 2.4, 2.2); fs(ctx, '#e8c050', '#6a5a1a', 0.5); });
  }
  if (top.sash) tDecal(rc, T, .15, 3, () => {
    ribbon(ctx, -.8, 0, 12, top.sash!, -.7);
    ribbon(ctx, .8, 0, 10, top.sash!, .5);
  });

  if (top.adventure) {
    const leather = top.adventure.strap;
    for (const offset of [0, Math.PI]) {
      surfPoly(rc, T, [[offset-.95,16.4],[offset-.68,16.4],[offset+1.05,1.1],[offset+.78,1.1]], leather, ink(leather));
      surfLine(rc, T, [[offset-.76,15.8],[offset+.08,9],[offset+.93,1.6]], rgba(shade(leather,.65),.4), .3);
    }
    band(rc,T,1.9,3.3,leather);
    tDecal(rc,T,.08,2.65,()=> {
      ctx.beginPath();ctx.roundRect(-1.3,-.8,2.6,1.6,.25);fs(ctx,'#c5ac6e','#615239',.4);
      ctx.beginPath();ctx.rect(-.65,-.4,1.3,.8);fs(ctx,shade(leather,-.2),null);
    });
    for (const sign of [-1,1]) {
      if (top.adventure.shoulder) surfPoly(rc,T,[[sign*.75,16.8],[sign*1.4,15],[sign*1.35,12.7],[sign*.84,13.9]], top.adventure.edge, ink(top.adventure.edge));
      surfLine(rc,T,[[sign*.85,12],[sign*.75,7],[sign*.9,4]], rgba(ink(tc),.35),.3);
    }
  }
  const skin = pal.skin;
  switch (top.collar) {
    case 'round':
      surfLine(rc, T, Array.from({ length: 13 }, (_, i) => [-1.2 + i * 0.2, 17.1 - Math.cos(-1.2 + i * 0.2) * 0.6] as [number, number]), shade(tc, -0.25), 0.9);
      break;
    case 'v':
      surfPoly(rc, T, [[-0.62, 17.8], [0, 13], [0.62, 17.8]], top.sleeveColor ?? skin);
      break;
    case 'square':
      surfPoly(rc, T, [[-0.75, 17.8], [-0.7, 15], [0.7, 15], [0.75, 17.8]], skin);
      break;
    case 'sailor':
      surfPoly(rc, T, [[-1.35, 17], [-0.4, 12.2], [0, 11], [0.4, 12.2], [1.35, 17]], t2);
      surfLine(rc, T, [[-1.15, 16.6], [-0.3, 12.6], [0, 11.7], [0.3, 12.6], [1.15, 16.6]], '#ffffff', 0.45);
      surfPoly(rc, T, [[-0.6, 17.8], [0, 13.2], [0.6, 17.8]], skin);
      vStrip(rc, T, Math.PI - 1, Math.PI + 1, 12, 17.2, t2);
      break;
    case 'cross':
      surfPoly(rc, T, [[-0.7, 17.8], [0.15, 11], [0.7, 17.8]], top.adventure ? t2 : skin);
      surfLine(rc, T, [[0.72, 17.6], [0.15, 11]], t2, 1.6);
      surfLine(rc, T, [[-0.72, 17.6], [0.55, 6.5]], t2, 1.6);
      break;
    case 'high':
      band(rc, T, 15.6, 17.6, shade(tc, -0.06), 1.06);
      break;
    case 'lapel':
      surfPoly(rc, T, [[-0.62, 17.8], [0, 9.5], [0.62, 17.8]], t2);
      for (const s of [-1, 1]) surfPoly(rc, T, [[s * 0.62, 17.8], [s * 0.85, 14.5], [s * 0.35, 13.6], [0, 9.5], [s * 0.3, 16]], shade(tc, -0.12));
      break;
    case 'hood':
      for (const s of [-1, 1]) {
        surfLine(rc, T, [[s * 0.3, 16.8], [s * 0.32, 12.5]], '#f4f2ee', 0.45);
        tDecal(rc, T, s * 0.32, 12.3, () => { circle(ctx, 0, 0, 0.5); fs(ctx, '#f4f2ee', '#8a8a8a', 0.3); });
      }
      break;
  }
  if (top.tie) {
    if (top.collar === 'sailor') {
      tDecal(rc, T, 0, 12, () => {
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(s * 2.6, -1.4);
          ctx.lineTo(s * 2.6, 1.4);
          ctx.closePath();
          fs(ctx, top.tie!, ink(top.tie!), 0.5);
        }
        ctx.beginPath();
        ctx.moveTo(-0.6, 0);
        ctx.lineTo(-1.3, 4);
        ctx.lineTo(0, 3.4);
        ctx.lineTo(1.3, 4);
        ctx.lineTo(0.6, 0);
        fs(ctx, top.tie!, ink(top.tie!), 0.5);
      });
    } else {
      surfPoly(rc, T, [[-0.08, 16.8], [-0.14, 11], [0, 9.8], [0.14, 11], [0.08, 16.8]], top.tie);
    }
  }
  if (top.buttons) {
    for (let i = 0; i < top.buttons; i++) {
      tDecal(rc, T, top.collar === 'lapel' ? 0.12 : 0, 3.5 + i * 3, () => { circle(ctx, 0, 0, 0.6); fs(ctx, t2, ink(t2), 0.35); });
    }
  }
  if (top.emblem) {
    tDecal(rc, T, 0, 9.5, () => {
      if (top.emblem === 'star') star(ctx, 0, 0, 2.2);
      else if (top.emblem === 'heart') heart(ctx, 0, 0, 2);
      else {
        ctx.beginPath();
        ctx.rect(-0.7, -2.6, 1.4, 5.2);
        ctx.rect(-2.2, -1.2, 4.4, 1.4);
      }
      fs(ctx, t2, ink(t2), 0.5);
    });
  }
  if (top.cape) for (const s of [-1, 1]) tDecal(rc, T, s * 0.55, 16.2, () => { circle(ctx, 0, 0, 0.9); fs(ctx, '#e8c050', '#6a5a1a', 0.4); });
  ctx.restore();
  ctx.save();
  if (reg && (bottom.kind === 'skirt' || top.skirt)) {
    polyPath(ctx, reg);
    ctx.clip();
  }
  smoothPath(ctx, sil);
  fs(ctx, null, ink(tc), OL);
  ctx.restore();
  if (top.adventure?.pouch) tDecal(rc,T,.98,1.4,()=> {
    const leather=top.adventure!.strap;
    ctx.beginPath();ctx.roundRect(-2,-1.7,4.5,4.3,.9);fs(ctx,materialFill(ctx,leather,0,0,3),ink(leather),.5);
    ctx.beginPath();ctx.moveTo(-2,-1.25);ctx.quadraticCurveTo(.2,1,2.5,-1.25);fs(ctx,null,shade(leather,-.35),.5);
    ctx.beginPath();ctx.moveTo(-1.5,.7);ctx.quadraticCurveTo(.2,1.4,1.95,.7);fs(ctx,null,rgba(shade(leather,.65),.5),.25);
    circle(ctx,.25,.05,.3);fs(ctx,'#c9b075',null);
  });
}

// ---------------- Skirts / cape / hood / neck ----------------

export function drawSkirt(
  rc: RenderCtx,
  y0: number,
  len: number,
  flare: number,
  color: string,
  o: { pleats?: boolean; puff?: boolean; plaid?: string; trim?: string; embroidery?: Motif } = {},
) {
  const { ctx } = rc;
  const d = rc.dims;
  const W0 = d.hipW + 0.7, D0 = 5.9;
  const pel = rc.rig.pelvis;
  const n = 28;
  const top: P2[] = [], bot: P2[] = [], botFront: { p: P2; a: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    top.push(rc.bp('pelvis', [Math.sin(a) * W0, y0, Math.cos(a) * D0]));
    const b = rc.bp('pelvis', [Math.sin(a) * W0 * flare, y0 - len, Math.cos(a) * D0 * flare]);
    bot.push(b);
    if (mulV(pel.rot, [Math.sin(a), 0, Math.cos(a)])[2] > -0.05) botFront.push({ p: b, a });
  }
  const shape = hull([...top, ...bot]);
  const layers = o.puff ? [shade(color, 0.35), color] : [color];
  layers.forEach((c, li) => {
    ctx.save();
    if (o.puff && li === 0) {
      ctx.translate(0, 0.8);
      ctx.scale(1.06, 1);
    }
    if (o.puff) {
      botFront.sort((x, y) => x.p.x - y.p.x);
      const hl = hull([...top, ...bot]);
      polyPath(ctx, hl);
      fs(ctx, materialFill(ctx, c, top[0].x, top[0].y, 18, .8), ink(c), OL);
    } else {
      polyPath(ctx, shape);
      const center = rc.bp('pelvis', [0, y0 - len * .4, 0]);
      fs(ctx, materialFill(ctx, c, center.x, center.y, Math.max(len, rc.dims.hipW * flare) * 1.4, .85), ink(color), OL);
    }
    ctx.restore();
  });
  botFront.sort((x, y) => x.p.x - y.p.x);
  ctx.save();
  polyPath(ctx, shape);
  ctx.clip();
  // Alternating lit and shaded gores preserve the skirt's volume as it turns.
  for (let i = 0; i < n; i += 2) {
    const a = (i / n) * TAU;
    if (mulV(pel.rot, [Math.sin(a), 0, Math.cos(a)])[2] < .05) continue;
    const next = (i + 1) % n, previous = (i + n - 1) % n;
    polyPath(ctx, [top[i], bot[i], bot[next], top[next]]);
    fs(ctx, rgba(ink(color), .1), null);
    polyPath(ctx, [top[i], bot[i], bot[previous], top[previous]]);
    fs(ctx, rgba(shade(color, .65), .17), null);
  }
  if (o.plaid) {
    ctx.strokeStyle = rgba(o.plaid, 0.7);
    ctx.lineWidth = 1.2;
    for (const f of [0.3, 0.65]) {
      const mid = hull([...top.map((p, i) => ({ x: lerp(p.x, bot[i].x, f), y: lerp(p.y, bot[i].y, f) }))]);
      polyPath(ctx, mid);
      ctx.stroke();
    }
  }
  if (o.pleats || o.plaid) {
    ctx.beginPath();
    for (let i = 0; i < n; i += 2) {
      const a = (i / n) * TAU;
      if (mulV(pel.rot, [Math.sin(a), 0, Math.cos(a)])[2] < 0.1) continue;
      ctx.moveTo(lerp(top[i].x, bot[i].x, 0.25), lerp(top[i].y, bot[i].y, 0.25));
      ctx.lineTo(bot[i].x, bot[i].y);
    }
    fs(ctx, null, o.plaid ? rgba(o.plaid, 0.8) : shade(color, -0.25), 0.5);
  }
  if (o.trim && botFront.length > 1) {
    polyPath(ctx, botFront.map((b) => b.p), false);
    fs(ctx, null, o.trim, 1.6);
  }
  if (o.embroidery) for (let i = 0; i < n; i += 4) {
    const a = (i / n) * TAU;
    if (mulV(pel.rot, [Math.sin(a), 0, Math.cos(a)])[2] < .15) continue;
    const p = { x: lerp(top[i].x, bot[i].x, .7), y: lerp(top[i].y, bot[i].y, .7) };
    drawMotif(ctx, o.embroidery, p.x, p.y, 1.3, o.trim ?? '#e8d4a1');
  }
  if (o.puff && botFront.length > 1) {
    ctx.beginPath();
    botFront.forEach(({ p }, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    fs(ctx, null, shade(color, 0.5), 1.2);
  }
  ctx.restore();
}

/** Pointed coat panels over a pale underlayer, following the Aistory traveler silhouette. */
export function drawAdventureSkirt(rc: RenderCtx, len: number, flare: number, color: string, trim: string) {
  drawSkirt(rc,1.2,len*.83,flare*.97,trim);
  const w=rc.dims.hipW+.6;
  const point=(a:number,y:number,f:number)=>rc.bp('pelvis',[Math.sin(a)*w*f,y,Math.cos(a)*6*f]);
  const panels=Array.from({length:8},(_,i)=> {
    const a=i*TAU/8;
    return {a,z:point(a,-len*.5,1.05).z};
  }).sort((a,b)=>a.z-b.z);
  for (const panel of panels) {
    const a=panel.a;
    polyPath(rc.ctx,[point(a-.39,1.25,1),point(a+.39,1.25,1),point(a+.48,-len*.69,flare),point(a+.03,-len*1.03,flare),point(a-.44,-len*.72,flare)]);
    const p=point(a,-len*.5,1);
    fs(rc.ctx,materialFill(rc.ctx,color,p.x,p.y,len,.8),ink(color),.5);
    polyPath(rc.ctx,[point(a+.48,-len*.69,flare),point(a+.03,-len*1.03,flare),point(a-.44,-len*.72,flare)],false);
    fs(rc.ctx,null,rgba(trim,.85),.45);
  }
}

export function drawCape(rc: RenderCtx, color: string) {
  const { ctx } = rc;
  const sw = rc.dims.shoulderW;
  const pts: Vec3[] = [
    [sw - 0.8, 15.8, -3.8], [sw + 1.5, 4, -6], [sw + 4.5, -14, -8.5],
    [2.5, -13.2, -9.5], [0, -14.2, -9.5], [-2.5, -13.2, -9.5],
    [-(sw + 4.5), -14, -8.5], [-(sw + 1.5), 4, -6], [-(sw - 0.8), 15.8, -3.8],
    [0, 16.5, -4.5],
  ];
  const sway = Math.sin(rc.time * 3) * 0.6;
  const proj = pts.map(([x, y, z]) => rc.bp('chest', [x + (y < 0 ? sway : 0), y, z]));
  smoothPath(ctx, proj);
  fs(ctx, color, ink(color), OL);
  const back = mulV(rc.rig.chest.rot, [0, 0, -1])[2] > 0;
  if (back) {
    ctx.beginPath();
    for (const x of [-4, 0, 4]) {
      const a = rc.bp('chest', [x * 0.6, 12, -6]), b = rc.bp('chest', [x * 1.4 + (x ? 0 : sway), -12, -9.2]);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    fs(ctx, null, shade(color, -0.25), 0.6);
  }
}

export function drawHood(rc: RenderCtx, color: string) {
  const pts: P2[] = [];
  for (let i = 0; i <= 4; i++) {
    const la = -Math.PI / 2 + (Math.PI * i) / 4;
    for (let k = 0; k < 16; k++) {
      const lo = (k / 16) * TAU;
      pts.push(rc.bp('chest', [Math.cos(la) * Math.sin(lo) * 6.2, 16.6 + Math.sin(la) * 3.2, -4.6 + Math.cos(la) * Math.cos(lo) * 3.4]));
    }
  }
  polyPath(rc.ctx, hull(pts));
  fs(rc.ctx, color, ink(color), OL);
}

export function drawNeck(rc: RenderCtx) {
  const a = rc.bp('chest', [0, 15, 0]), b = rc.bp('head', [0, 4, 0]);
  drawLimb(rc.ctx, [{ a, b, w: 4.6, color: shade(rc.pal.skin, -0.06) }]);
}

// ---------------- Arms ----------------

/** Each articulated section has its own depth; a raised hand must not bring the shoulder in front of the head. */
export function drawArm(rc: RenderCtx, side: 'L' | 'R', top: TopDef, section: 'upper' | 'forearm' | 'hand') {
  const { ctx, pal } = rc;
  const P = (b: BoneName) => projectWorld(rc.rig[b].pos);
  const s = P(`upperArm${side}`), e = P(`foreArm${side}`), w = P(`hand${side}`);
  const hc = rc.bp(`hand${side}`, [0, -1.4, 0]);
  const skin = pal.skin;
  const sc = top.sleeveColor ?? pal.top;
  const at = (a: XY, b: XY, t: number): XY => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

  if (section === 'hand') {
    circle(ctx, hc.x, hc.y, 2.5);
    const hand = top.gloves ?? skin;
    fs(ctx, materialFill(ctx, hand, hc.x, hc.y, 2.8, .7), ink(hand), OL);
    ctx.beginPath();
    ctx.arc(hc.x + .4, hc.y + .25, 1.4, .2, 1.45);
    fs(ctx, null, rgba(ink(hand), .28), .3);
    return;
  }
  drawLimb(ctx, section === 'upper'
    ? [{ a: s, b: e, w: 4.4, color: skin }]
    : [{ a: e, b: w, w: 4.0, color: skin }]);
  if (top.adventure?.shoulder) drawLimb(ctx, section === 'upper'
    ? [{ a: at(s,e,.55), b: e, w: 4.8, color: top.adventure.edge }]
    : [{ a: e, b: at(e,w,.9), w: 4.7, color: top.adventure.edge }]);
  const segs: Seg[] = [];
  switch (top.sleeve) {
    case 'short':
      if (section === 'upper') segs.push({ a: s, b: at(s, e, 0.7), w: 5.4, color: sc });
      break;
    case 'puff':
      break;
    case 'long':
      if (section === 'upper') segs.push({ a: s, b: e, w: 5.0, color: sc });
      else segs.push({ a: e, b: at(e, w, 0.9), w: 4.7, color: sc });
      break;
    case 'wide':
      if (section === 'upper') segs.push({ a: s, b: e, w: 5.4, color: sc });
      break;
  }
  if (segs.length) drawLimb(ctx, segs);
  if (top.sleeve === 'puff' && section === 'upper') {
    circle(ctx, lerp(s.x, e.x, 0.3), lerp(s.y, e.y, 0.3), 3.6);
    fs(ctx, materialFill(ctx, sc, lerp(s.x, e.x, .3), lerp(s.y, e.y, .3), 3.6), ink(sc), OL);
  }
  if (top.sleeve === 'wide' && section === 'forearm') {
    let dx = w.x - e.x, dy = w.y - e.y;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    const nx = -dy, ny = dx;
    const end = at(e, w, 1.05);
    polyPath(ctx, [
      { x: e.x + nx * 2.8, y: e.y + ny * 2.8 },
      { x: end.x + nx * 4.6, y: end.y + ny * 4.6 },
      { x: end.x - nx * 4.6, y: end.y - ny * 4.6 },
      { x: e.x - nx * 2.8, y: e.y - ny * 2.8 },
    ]);
    fs(ctx, materialFill(ctx, sc, e.x, e.y, Math.max(6, Math.hypot(w.x - e.x, w.y - e.y))), ink(sc), OL);
    const fold = at(e, end, .8);
    ctx.beginPath(); ctx.moveTo(e.x, e.y);
    ctx.quadraticCurveTo(fold.x + nx * 1.5, fold.y + ny * 1.5, end.x + nx * 2.7, end.y + ny * 2.7);
    fs(ctx, null, rgba(ink(sc), .3), .4);
    ctx.beginPath(); ctx.moveTo(e.x - nx, e.y - ny);
    ctx.quadraticCurveTo(fold.x - nx * 2, fold.y - ny * 2, end.x - nx * 3, end.y - ny * 3);
    fs(ctx, null, rgba(shade(sc, .7), .5), .45);
    ctx.beginPath();
    ctx.moveTo(end.x + nx * 4.4, end.y + ny * 4.4);
    ctx.lineTo(end.x - nx * 4.4, end.y - ny * 4.4);
    fs(ctx, null, top.color2, 1.3);
  }
  if (top.sleeve === 'long' && section === 'forearm') {
    drawLimb(ctx, [{ a: at(e, w, 0.72), b: at(e, w, 0.9), w: 5.1, color: top.armor ? top.color2 : shade(sc, -0.12) }]);
  }
  if (top.adventure && section === 'forearm' && top.sleeve!=='wide') {
    drawLimb(ctx,[{a:at(e,w,.4),b:at(e,w,.8),w:4.3,color:top.adventure.strap}]);
    drawLimb(ctx,[{a:at(e,w,.75),b:at(e,w,.82),w:4.5,color:shade(top.adventure.strap,.18)}]);
  }
  if (top.pauldron && section === 'upper') {
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - 0.4, 4, 3.4, 0, 0, TAU);
    fs(ctx, materialFill(ctx, top.pauldron, s.x, s.y - .4, 4.5), ink(top.pauldron), OL);
    ctx.beginPath();
    ctx.arc(s.x - 0.8, s.y - 1.3, 2, 3.6, 5.2);
    fs(ctx, null, 'rgba(255,255,255,0.7)', 0.7);
  }
}

// ---------------- Legs & shoes ----------------

export function drawLeg(rc: RenderCtx, side: 'L' | 'R', bottom: BottomDef, shoe: ShoeDef) {
  const { ctx, pal } = rc;
  const P = (b: BoneName) => projectWorld(rc.rig[b].pos);
  const hip = P(`thigh${side}`), knee = P(`shin${side}`), ankle = P(`foot${side}`);
  const at = (a: XY, b: XY, t: number): XY => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
  const skin = pal.skin;
  const legColor = bottom.stockings ?? skin;
  const wide = bottom.wide ?? 0;
  drawLimb(ctx, [
    { a: hip, b: knee, w: 5.6, color: legColor },
    { a: knee, b: ankle, w: 4.8, color: legColor },
  ]);
  if (bottom.kind === 'pants') {
    const pc = pal.bottom;
    const segs: Seg[] = [];
    if (bottom.cover <= 0) segs.push({ a: hip, b: at(hip, knee, clamp(1 + bottom.cover, 0.2, 1)), w: 6.4 + wide, color: pc });
    else segs.push({ a: hip, b: knee, w: 6.4 + wide, color: pc }, { a: knee, b: at(knee, ankle, bottom.cover), w: 5.6 + wide * 0.7, color: pc });
    drawLimb(ctx, segs);
    const endA = bottom.cover <= 0 ? at(hip, knee, clamp(1 + bottom.cover, 0.2, 1) - 0.12) : at(knee, ankle, bottom.cover - 0.12);
    const endB = bottom.cover <= 0 ? at(hip, knee, clamp(1 + bottom.cover, 0.2, 1)) : at(knee, ankle, bottom.cover);
    if (bottom.cuff) drawLimb(ctx, [{ a: endA, b: endB, w: (bottom.cover <= 0 ? 6.6 : 5.9) + wide * 0.7, color: bottom.cuff }]);
    if (bottom.stripe) {
      const off = side === 'L' ? 1.8 : -1.8;
      ctx.beginPath();
      ctx.moveTo(hip.x + off, hip.y + 1);
      ctx.lineTo(knee.x + off * 0.9, knee.y);
      ctx.lineTo(endB.x + off * 0.8, endB.y);
      fs(ctx, null, bottom.stripe, 0.7);
    }
    if (bottom.pockets) {
      const m = at(hip, knee, 0.55);
      ctx.beginPath();
      ctx.rect(m.x - 1.6, m.y - 1.4, 3.2, 2.8);
      fs(ctx, shade(pc, -0.08), ink(pc), 0.5);
    }
    if (bottom.embroidery) {
      const p = at(hip, knee, .65);
      drawMotif(ctx, bottom.embroidery, p.x, p.y, 1.15, bottom.color2 ?? '#e8d4a1');
    }
  }
  drawShoe(rc, side, shoe, ankle, knee);
}

function drawShoe(rc: RenderCtx, side: 'L' | 'R', s: ShoeDef, ankle: P2, knee: P2) {
  const { ctx, pal } = rc;
  const foot = `foot${side}` as BoneName;
  const fp = (v: Vec3) => rc.bp(foot, v);
  const wide = s.wide ?? 1;
  if (s.bare) {
    const skin = pal.skin;
    if (s.heel) drawLimb(ctx, [{ a: fp([0, -3.6, -1.2]), b: fp([0, -3.8, 3.4]), w: 2.6, color: s.color }]);
    drawLimb(ctx, [{ a: fp([0, -2.3, -1.0]), b: fp([0, -2.4, 3.0]), w: 4.4, color: skin }]);
    if (s.strap) {
      const a = fp([0, -1.6, 1.8]);
      ctx.beginPath();
      ctx.ellipse(a.x, a.y, 2.3, 0.9, 0, 0, TAU);
      fs(ctx, null, s.strap, 0.9);
    }
    return;
  }
  if (s.boot > 0) {
    const top = { x: lerp(ankle.x, knee.x, s.boot), y: lerp(ankle.y, knee.y, s.boot) };
    drawLimb(ctx, [{ a: ankle, b: top, w: 6.2 * wide, color: s.color }]);
    if (s.fur) drawLimb(ctx, [{ a: { x: lerp(ankle.x, top.x, 0.85), y: lerp(ankle.y, top.y, 0.85) }, b: top, w: 7.6 * wide, color: s.fur }]);
    if (s.metal) {
      circle(ctx, knee.x, knee.y + 0.5, 3.1);
      fs(ctx, s.color, ink(s.color), OL);
      circle(ctx, knee.x - 0.8, knee.y - 0.3, 1);
      fs(ctx, 'rgba(255,255,255,0.8)', null);
    }
  }
  drawLimb(ctx, [{ a: fp([0, -3.5, -1.3]), b: fp([0, -3.7, 3.6]), w: 2.4 * wide, color: s.sole }]);
  if (s.heel) drawLimb(ctx, [{ a: fp([0, -3.2, -1.3]), b: fp([0, -5.0, -1.1]), w: 1.8, color: s.sole }]);
  drawLimb(ctx, [{ a: fp([0, -2.3, -1.3]), b: fp([0, -2.5, s.toe === 'point' ? 4.2 : 3.4]), w: 5.2 * wide, color: s.color }]);
  if (mulV(rc.rig[foot].rot, [0, 0, 1])[2] > -.2) {
    const toe = [-1.7, -.9, 0, .9, 1.7].map(x => fp([x * wide, -1.15 - Math.abs(x) * .22, 2.5]));
    smoothPath(ctx, toe, false);
    fs(ctx, null, rgba(shade(s.color, .68), .48), .34);
    const seam = [-1.7, -.9, 0, .9, 1.7].map(x => fp([x * wide, -2.8 - Math.abs(x) * .12, 3.25]));
    smoothPath(ctx, seam, false);
    fs(ctx, null, rgba(ink(s.color), .42), .27);
  }
  if (s.toe === 'curl') {
    const a = fp([0, -2.4, 3.6]), b = fp([0, -0.6, 6.4]), c = fp([0, 0.6, 5.2]);
    drawLimb(ctx, [{ a, b, w: 2.2, color: s.color }, { a: b, b: c, w: 1.2, color: s.color }]);
    circle(ctx, c.x, c.y, 0.9);
    fs(ctx, '#f6d25a', '#6a5a1a', 0.4);
  }
  if (s.fur && s.boot === 0) {
    const a = fp([0, -1.2, 0.6]);
    circle(ctx, a.x, a.y, 2.4);
    fs(ctx, s.fur, ink(s.fur), 0.6);
  }
  if (s.laces) {
    const a = fp([0, -0.9, 1.2]);
    if (mulV(rc.rig[foot].rot, [0, 0, 1])[2] > -0.3) {
      ctx.beginPath();
      ctx.moveTo(a.x - 1.2, a.y - 0.4);
      ctx.lineTo(a.x + 1.2, a.y + 0.4);
      ctx.moveTo(a.x + 1.2, a.y - 0.4);
      ctx.lineTo(a.x - 1.2, a.y + 0.4);
      fs(ctx, null, s.laces, 0.5);
    }
  }
  if (s.embroidery) {
    const p = fp([0, -.8, 2]);
    drawMotif(ctx, s.embroidery, p.x, p.y, .85, '#efe1b6');
  }
}

export const skinShadow = (skin: string) => mix(skin, '#c0707a', 0.18);
