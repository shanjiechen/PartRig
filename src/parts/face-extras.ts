import { ink, mix, rgba, shade } from '../core/color';
import { wrapAngle, lerp, smooth } from '../core/math';
import { circle, cyl, decal, facingOf, fs, hp, star, type RenderCtx, type XY } from '../render/context';
import { faceOutline, type FaceDef } from './faces';

// ---------------- Beards ----------------

type Line = (a: number) => number;
export interface BeardDef {
  id: string;
  name: string;
  region?: { line: Line; bulk: number; down?: number; stubble?: boolean };
  stache?: 'basic' | 'handlebar' | 'fu' | 'thin';
  chin?: 'goatee' | 'circle' | 'point' | 'long' | 'braid';
}

const fullLine: Line = (a) => (Math.abs(a) < 1.75 ? lerp(0.56, 0.12, smooth(Math.min(1, Math.abs(a) / 1.6))) : 9);
const strapLine: Line = (a) => (Math.abs(a) < 1.7 ? lerp(0.9, 0.2, smooth(Math.min(1, Math.abs(a) / 1.6))) : 9);
const muttonLine: Line = (a) => {
  const x = Math.abs(a);
  return x > 0.75 && x < 1.75 ? lerp(0.75, 0.15, smooth(Math.min(1, (x - 0.75) / 0.9))) : 9;
};

export const BEARDS: BeardDef[] = [
  { id: 'none', name: '无' },
  { id: 'stubble', name: '胡茬', region: { line: fullLine, bulk: 0, stubble: true } },
  { id: 'stache', name: '八字胡', stache: 'basic' },
  { id: 'handlebar', name: '翘胡子', stache: 'handlebar' },
  { id: 'pencil', name: '一字胡', stache: 'thin' },
  { id: 'goatee', name: '山羊胡', chin: 'goatee' },
  { id: 'full', name: '络腮胡', region: { line: fullLine, bulk: 0.06, down: 0.1 }, stache: 'basic' },
  { id: 'wizard', name: '长须', region: { line: fullLine, bulk: 0.06, down: 0.1 }, stache: 'basic', chin: 'long' },
  { id: 'strap', name: '下巴胡', region: { line: strapLine, bulk: 0.05, down: 0.05 } },
  { id: 'mutton', name: '连鬓胡', region: { line: muttonLine, bulk: 0.06 } },
  { id: 'circle', name: '圈胡', stache: 'basic', chin: 'circle' },
  { id: 'point', name: '尖胡', stache: 'basic', chin: 'point' },
  { id: 'fu', name: '八撇长胡', stache: 'fu' },
  { id: 'dwarf', name: '矮人辫胡', region: { line: fullLine, bulk: 0.08, down: 0.1 }, stache: 'basic', chin: 'braid' },
];

/** Region beard: area below a line on the face, clipped to a slightly grown face outline. */
export function drawBeardRegion(rc: RenderCtx, b: BeardDef, face: FaceDef, color: string) {
  if (!b.region) return;
  const { ctx, head: h } = rc;
  const r = b.region;
  const pts: XY[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / 48 - h.yaw;
    pts.push(hp(h, cyl(a, r.line(wrapAngle(a)))));
  }
  const region = () => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.lineTo(pts[pts.length - 1].x, h.R * 6);
    ctx.lineTo(pts[0].x, h.R * 6);
    ctx.closePath();
  };
  ctx.save();
  faceOutline(ctx, face, h, r.bulk, r.down ?? 0);
  ctx.clip();
  region();
  if (r.stubble) {
    ctx.fillStyle = rgba(color, 0.3);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = rgba(color, 0.55);
    for (let i = 0; i < 70; i++) {
      const x = ((i * 37) % 23) / 23 - 0.5, y = ((i * 53) % 19) / 19;
      circle(ctx, x * h.R * 2, y * h.R * 1.2, 0.22);
      ctx.fill();
    }
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.save();
    ctx.clip();
    faceOutline(ctx, face, h, r.bulk, r.down ?? 0);
    ctx.strokeStyle = ink(color);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = ink(color);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBeardDetails(rc: RenderCtx, b: BeardDef, color: string) {
  const { ctx } = rc;
  const ic = ink(color);
  if (b.stache) {
    decal(rc, 0, 0.585, () => {
      ctx.beginPath();
      for (const s of [-1, 1]) {
        if (b.stache === 'basic') {
          ctx.moveTo(0, -0.6);
          ctx.quadraticCurveTo(1.6 * s, -1.4, 2.8 * s, 0.6);
          ctx.quadraticCurveTo(1.3 * s, 0.2, 0, 0.35);
        } else if (b.stache === 'handlebar') {
          ctx.moveTo(0, -0.5);
          ctx.quadraticCurveTo(2 * s, -1.1, 3.1 * s, -0.1);
          ctx.quadraticCurveTo(4.2 * s, -0.6, 3.7 * s, -1.9);
          ctx.quadraticCurveTo(4.8 * s, 0.4, 2.6 * s, 0.4);
          ctx.quadraticCurveTo(1.3 * s, 0.35, 0, 0.3);
        } else if (b.stache === 'fu') {
          ctx.moveTo(0, -0.5);
          ctx.quadraticCurveTo(2 * s, -1.0, 2.4 * s, 0.4);
          ctx.lineTo(2.7 * s, 6.5);
          ctx.quadraticCurveTo(2.2 * s, 7.2, 1.8 * s, 6.3);
          ctx.lineTo(1.7 * s, 0.7);
          ctx.quadraticCurveTo(1 * s, 0.3, 0, 0.3);
        } else {
          ctx.moveTo(0.3 * s, -0.1);
          ctx.quadraticCurveTo(1.5 * s, -0.5, 2.3 * s, 0.1);
          ctx.quadraticCurveTo(1.5 * s, 0.2, 0.3 * s, 0.3);
        }
        ctx.closePath();
      }
      fs(ctx, color, ic, 0.55);
    }, { min: -0.3, minScale: 0.45 });
  }
  if (b.chin) {
    decal(rc, 0, 0.86, () => {
      ctx.beginPath();
      switch (b.chin) {
        case 'goatee':
          ctx.moveTo(-1.3, 0);
          ctx.quadraticCurveTo(0, -0.5, 1.3, 0);
          ctx.quadraticCurveTo(1.2, 2.6, 0, 3.4);
          ctx.quadraticCurveTo(-1.2, 2.6, -1.3, 0);
          break;
        case 'circle':
          ctx.moveTo(-1.4, 0);
          ctx.quadraticCurveTo(0, -0.5, 1.4, 0);
          ctx.quadraticCurveTo(1.2, 2.2, 0, 2.6);
          ctx.quadraticCurveTo(-1.2, 2.2, -1.4, 0);
          ctx.moveTo(-2.9, -4.3);
          ctx.quadraticCurveTo(-2.9, -1.2, -1.1, 0.4);
          ctx.lineTo(-0.7, -0.2);
          ctx.quadraticCurveTo(-2.1, -1.8, -2.1, -4.1);
          ctx.moveTo(2.9, -4.3);
          ctx.quadraticCurveTo(2.9, -1.2, 1.1, 0.4);
          ctx.lineTo(0.7, -0.2);
          ctx.quadraticCurveTo(2.1, -1.8, 2.1, -4.1);
          break;
        case 'point':
          ctx.moveTo(-2.8, -1);
          ctx.quadraticCurveTo(-2.4, 2.6, 0, 5.5);
          ctx.quadraticCurveTo(2.4, 2.6, 2.8, -1);
          ctx.quadraticCurveTo(0, 0.4, -2.8, -1);
          break;
        case 'long':
          ctx.moveTo(-5.2, -2.5);
          ctx.bezierCurveTo(-5.6, 6, -2, 12, 0.6, 17);
          ctx.bezierCurveTo(1.4, 11, 5.4, 6, 5.2, -2.5);
          ctx.quadraticCurveTo(0, 0.5, -5.2, -2.5);
          break;
        case 'braid':
          ctx.moveTo(-5.2, -2.5);
          ctx.bezierCurveTo(-5.4, 3, -2.5, 6, -1.4, 7);
          ctx.lineTo(1.4, 7);
          ctx.bezierCurveTo(2.5, 6, 5.4, 3, 5.2, -2.5);
          ctx.quadraticCurveTo(0, 0.5, -5.2, -2.5);
          break;
      }
      ctx.closePath();
      fs(ctx, color, ic, 0.6);
      if (b.chin === 'long') {
        ctx.beginPath();
        ctx.moveTo(-2, 2);
        ctx.quadraticCurveTo(-1.5, 7, 0, 11);
        ctx.moveTo(2, 2);
        ctx.quadraticCurveTo(1.8, 6, 0.8, 10);
        fs(ctx, null, shade(color, -0.3), 0.4);
      }
      if (b.chin === 'braid') {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(0, 8 + i * 2, 1.4 - i * 0.18, 1.2, 0, 0, Math.PI * 2);
          fs(ctx, color, ic, 0.45);
        }
        ctx.beginPath();
        ctx.rect(-1.3, 15.2, 2.6, 1.2);
        fs(ctx, '#d9a53a', '#7a5a1a', 0.4);
      }
    }, { min: -0.3, minScale: 0.5 });
  }
}

// ---------------- Face marks ----------------

export interface MarkDef {
  id: string;
  name: string;
  draw: ((rc: RenderCtx, skin: string) => void) | null;
}

const both = (rc: RenderCtx, a: number, v: number, fn: (m: number) => void) => {
  decal(rc, a, v, () => fn(1), { mirror: 1, min: 0.05 });
  decal(rc, -a, v, () => fn(-1), { mirror: -1, min: 0.05 });
};

export const MARKS: MarkDef[] = [
  { id: 'none', name: '无', draw: null },
  {
    id: 'freckles', name: '雀斑',
    draw: (rc, skin) => both(rc, 0.55, 0.5, () => {
      const c = rc.ctx;
      c.fillStyle = rgba(mix(skin, '#8a4a2a', 0.6), 0.75);
      for (const [x, y] of [[-1.2, -0.6], [0, -0.9], [1.1, -0.4], [-0.5, 0.5], [0.7, 0.7]]) {
        circle(c, x, y, 0.32);
        c.fill();
      }
    }),
  },
  {
    id: 'blush', name: '腮红',
    draw: (rc) => both(rc, 0.58, 0.53, () => {
      const c = rc.ctx;
      c.beginPath();
      c.ellipse(0, 0, 2.8, 1.5, 0, 0, Math.PI * 2);
      fs(c, 'rgba(255,110,140,0.5)', null);
      c.beginPath();
      for (let i = -1; i <= 1; i++) {
        c.moveTo(i * 1.1 - 0.4, 0.6);
        c.lineTo(i * 1.1 + 0.4, -0.6);
      }
      fs(c, null, 'rgba(220,60,90,0.8)', 0.35);
    }),
  },
  {
    id: 'eyescar', name: '眼疤',
    draw: (rc) => decal(rc, 0.37, 0.3, () => {
      const c = rc.ctx;
      c.beginPath();
      c.moveTo(-0.8, -6.5);
      c.lineTo(0.8, 6.5);
      for (let i = -2; i <= 2; i++) {
        c.moveTo(-1.3 + i * 0.2, i * 2.4 - 0.2);
        c.lineTo(1.3 + i * 0.2, i * 2.4 + 0.2);
      }
      fs(c, null, '#b04850', 0.55);
    }, { min: 0.05 }),
  },
  {
    id: 'xscar', name: '十字疤',
    draw: (rc) => decal(rc, -0.62, 0.55, () => {
      const c = rc.ctx;
      c.beginPath();
      c.moveTo(-1.6, -1.6); c.lineTo(1.6, 1.6);
      c.moveTo(1.6, -1.6); c.lineTo(-1.6, 1.6);
      fs(c, null, '#b04850', 0.6);
    }, { min: 0.05, mirror: -1 }),
  },
  {
    id: 'tearmole', name: '泪痣',
    draw: (rc) => decal(rc, 0.5, 0.52, () => { circle(rc.ctx, 0, 0, 0.45); fs(rc.ctx, '#3a2228', null); }, { min: 0.05 }),
  },
  {
    id: 'mole', name: '美人痣',
    draw: (rc) => decal(rc, -0.25, 0.74, () => { circle(rc.ctx, 0, 0, 0.45); fs(rc.ctx, '#3a2228', null); }, { min: 0.05 }),
  },
  {
    id: 'tribal', name: '部落纹',
    draw: (rc) => both(rc, 0.6, 0.5, () => {
      const c = rc.ctx;
      c.beginPath();
      c.moveTo(-1.8, -0.9); c.lineTo(1.6, -1.3);
      c.moveTo(-1.8, 0.7); c.lineTo(1.6, 0.3);
      fs(c, null, '#3a6ad0', 0.8);
    }),
  },
  {
    id: 'whiskers', name: '猫须',
    draw: (rc) => both(rc, 0.55, 0.6, () => {
      const c = rc.ctx;
      c.beginPath();
      c.moveTo(-1.5, -0.8); c.lineTo(2, -1.4);
      c.moveTo(-1.5, 0); c.lineTo(2.2, 0);
      c.moveTo(-1.5, 0.8); c.lineTo(2, 1.4);
      fs(c, null, '#4a2228', 0.4);
    }),
  },
  {
    id: 'bandage', name: '创可贴',
    draw: (rc) => decal(rc, -0.58, 0.52, () => {
      const c = rc.ctx;
      c.save();
      c.rotate(-0.4);
      c.beginPath();
      c.roundRect(-2.8, -1.1, 5.6, 2.2, 1);
      fs(c, '#f3dcb3', '#a88a5a', 0.4);
      c.beginPath();
      c.rect(-0.9, -1.1, 1.8, 2.2);
      fs(c, '#e8c895', null);
      c.restore();
    }, { min: 0.05, mirror: -1 }),
  },
  {
    id: 'star', name: '星星贴',
    draw: (rc) => decal(rc, 0.56, 0.5, () => { star(rc.ctx, 0, 0, 1.8); fs(rc.ctx, '#ffd33a', '#b8862a', 0.4); }, { min: 0.05 }),
  },
  {
    id: 'bindi', name: '额心印',
    draw: (rc) => decal(rc, 0, 0.13, () => {
      const c = rc.ctx;
      c.beginPath();
      c.moveTo(0, -1.3); c.lineTo(0.8, 0); c.lineTo(0, 1.3); c.lineTo(-0.8, 0); c.closePath();
      fs(c, '#e0304a', '#7a1a2a', 0.35);
    }, { min: 0.05 }),
  },
  {
    id: 'darkcircle', name: '黑眼圈',
    draw: (rc) => both(rc, 0.37, 0.52, () => {
      const c = rc.ctx;
      c.beginPath();
      c.moveTo(-2.6, -0.4); c.quadraticCurveTo(0, 1.4, 2.6, -0.4);
      fs(c, null, 'rgba(110,70,140,0.55)', 0.8);
    }),
  },
  {
    id: 'warpaint', name: '战纹',
    draw: (rc) => both(rc, 0.6, 0.48, () => {
      const c = rc.ctx;
      c.beginPath();
      c.moveTo(-1.8, -1.6); c.lineTo(1.8, -0.6); c.lineTo(-1.2, 0.6); c.closePath();
      c.moveTo(-1.8, 1.0); c.lineTo(1.6, 1.4); c.lineTo(-1.0, 2.2); c.closePath();
      fs(c, '#d8323c', null);
    }),
  },
  {
    id: 'sweat', name: '汗滴',
    draw: (rc) => decal(rc, 0.78, 0.0, () => {
      const c = rc.ctx;
      c.beginPath();
      c.moveTo(0, -2.2);
      c.quadraticCurveTo(1.6, 0.4, 0, 1.3);
      c.quadraticCurveTo(-1.6, 0.4, 0, -2.2);
      fs(c, '#8fd4ff', '#3a8ac0', 0.45);
      circle(c, -0.35, 0.2, 0.3);
      fs(c, '#ffffff', null);
    }, { min: 0.05 }),
  },
];

// ---------------- Ears ----------------

export interface EarDef {
  id: string;
  name: string;
  kind: 'side' | 'top' | 'none';
  /** 'skin' | 'hair' | custom color */
  tone: 'skin' | 'hair' | 'fin';
  /** Side ears that poke out through the hair instead of being covered by it. */
  overHair?: boolean;
  draw: (ctx: CanvasRenderingContext2D, fill: string, inner: string, front: boolean) => void;
}

const inkFill = (c: CanvasRenderingContext2D, fill: string) => fs(c, fill, ink(fill), 0.8);

function sideEar(scale: number): EarDef['draw'] {
  return (c, fill, inner) => {
    c.save();
    c.scale(scale, scale);
    c.beginPath();
    c.moveTo(-0.5, -2.6);
    c.bezierCurveTo(3.4, -3.8, 3.6, 2.6, -0.3, 2.4);
    c.closePath();
    inkFill(c, fill);
    c.beginPath();
    c.moveTo(0.4, -1.3);
    c.quadraticCurveTo(2.2, -1.2, 1.1, 1.1);
    fs(c, null, inner, 0.55);
    c.restore();
  };
}

function elfEar(tipX: number, tipY: number): EarDef['draw'] {
  return (c, fill, inner) => {
    c.beginPath();
    c.moveTo(-0.5, -2.2);
    c.quadraticCurveTo(tipX * 0.5, tipY * 0.9, tipX, tipY);
    c.quadraticCurveTo(tipX * 0.45, 2.4, -0.3, 2.4);
    c.closePath();
    inkFill(c, fill);
    c.beginPath();
    c.moveTo(0.5, -0.8);
    c.quadraticCurveTo(tipX * 0.45, tipY * 0.55, tipX * 0.75, tipY * 0.8);
    fs(c, null, inner, 0.5);
  };
}

function pointyTop(bw: number, tx: number, ty: number): EarDef['draw'] {
  return (c, fill, inner, front) => {
    c.beginPath();
    c.moveTo(-bw, 1.5);
    c.quadraticCurveTo(-bw * 0.6, ty * 0.5, tx, ty);
    c.quadraticCurveTo(bw * 0.9, ty * 0.4, bw, 1.5);
    c.closePath();
    inkFill(c, fill);
    if (front) {
      c.beginPath();
      c.moveTo(-bw * 0.55, 1);
      c.quadraticCurveTo(-bw * 0.3, ty * 0.45, tx * 0.8, ty * 0.68);
      c.quadraticCurveTo(bw * 0.5, ty * 0.35, bw * 0.55, 1);
      c.closePath();
      fs(c, inner, null);
    }
  };
}

export const EARS: EarDef[] = [
  { id: 'human', name: '普通耳', kind: 'side', tone: 'skin', draw: sideEar(1) },
  { id: 'small', name: '小耳朵', kind: 'side', tone: 'skin', draw: sideEar(0.75) },
  { id: 'big', name: '招风耳', kind: 'side', tone: 'skin', draw: sideEar(1.4) },
  { id: 'elf', name: '精灵耳', kind: 'side', tone: 'skin', overHair: true, draw: elfEar(6.8, -5.5) },
  { id: 'longelf', name: '长精灵耳', kind: 'side', tone: 'skin', overHair: true, draw: elfEar(10.5, -4.2) },
  {
    id: 'fin', name: '鱼鳍耳', kind: 'side', tone: 'fin', overHair: true,
    draw: (c, fill, inner) => {
      c.beginPath();
      c.moveTo(-0.4, -2.8);
      c.quadraticCurveTo(3, -5.5, 6, -4);
      c.quadraticCurveTo(4.6, -1, 5.6, 2);
      c.quadraticCurveTo(2.4, 3, -0.4, 2.4);
      c.closePath();
      inkFill(c, fill);
      c.beginPath();
      c.moveTo(0.3, -1.5); c.lineTo(5, -3.4);
      c.moveTo(0.3, 0); c.lineTo(4.6, -0.6);
      c.moveTo(0.3, 1.3); c.lineTo(4.8, 1.6);
      fs(c, null, inner, 0.5);
    },
  },
  {
    id: 'dog', name: '垂耳', kind: 'side', tone: 'hair', overHair: true,
    draw: (c, fill) => {
      c.beginPath();
      c.moveTo(-0.8, -4);
      c.bezierCurveTo(4.5, -5, 6, 5.5, 2.4, 8);
      c.quadraticCurveTo(0, 8.6, -0.6, 4.5);
      c.closePath();
      inkFill(c, fill);
    },
  },
  { id: 'cat', name: '猫耳', kind: 'top', tone: 'hair', draw: pointyTop(3.2, 1.2, -6.2) },
  { id: 'fox', name: '狐耳', kind: 'top', tone: 'hair', draw: pointyTop(3.6, 1.6, -8.8) },
  { id: 'wolf', name: '狼耳', kind: 'top', tone: 'hair', draw: pointyTop(3.4, 2.2, -7.2) },
  {
    id: 'bunny', name: '兔耳', kind: 'top', tone: 'hair',
    draw: (c, fill, inner, front) => {
      c.beginPath();
      c.moveTo(-1.8, 1.5);
      c.bezierCurveTo(-3.4, -8, -0.8, -14.5, 0.8, -13.5);
      c.bezierCurveTo(2.8, -12.5, 3.1, -6, 1.8, 1.5);
      c.closePath();
      inkFill(c, fill);
      if (front) {
        c.beginPath();
        c.moveTo(-0.7, 0.5);
        c.bezierCurveTo(-1.8, -7, -0.4, -11.5, 0.6, -11);
        c.bezierCurveTo(1.7, -10, 1.8, -6, 0.9, 0.5);
        c.closePath();
        fs(c, inner, null);
      }
    },
  },
  {
    id: 'bear', name: '熊耳', kind: 'top', tone: 'hair',
    draw: (c, fill, inner, front) => {
      circle(c, 0, -1.8, 3.3);
      inkFill(c, fill);
      if (front) {
        circle(c, 0, -1.5, 1.8);
        fs(c, inner, null);
      }
    },
  },
  {
    id: 'mouse', name: '鼠耳', kind: 'top', tone: 'hair',
    draw: (c, fill, inner, front) => {
      circle(c, 1, -2.8, 4.8);
      inkFill(c, fill);
      if (front) {
        circle(c, 1, -2.6, 3.1);
        fs(c, inner, null);
      }
    },
  },
  { id: 'none', name: '隐藏', kind: 'none', tone: 'skin', draw: () => {} },
];

const EAR_SIDE_V = 0.28;
const EAR_TOP = { a: 0.62, v: -0.7 };

/**
 * Draw ears for one phase: 'back' = behind the head, 'mid' = side ears over the face (under hair),
 * 'over' = side ears poking through hair, 'top' = top ears in front.
 */
export function drawEars(rc: RenderCtx, e: EarDef, phase: 'back' | 'mid' | 'over' | 'top', hide: boolean) {
  if (e.kind === 'none') return;
  const h = rc.head;
  const { ctx } = rc;
  const fill = e.tone === 'skin' ? rc.pal.skin : e.tone === 'hair' ? rc.pal.hair : mix(rc.pal.skin, '#4fb6d8', 0.55);
  const inner = e.tone === 'hair' ? '#f7b6c4' : shade(fill, -0.25);
  for (const side of [1, -1]) {
    if (e.kind === 'side') {
      const a = (side * Math.PI) / 2;
      const f = facingOf(h, a);
      const isFront = f > 0.2;
      const want = e.overHair ? (f > -0.3 ? 'over' : 'back') : isFront ? 'mid' : 'back';
      if (phase !== want) continue;
      let s = Math.sin(a + h.yaw);
      if (Math.abs(s) < 0.5) s = 0.5 * (s !== 0 ? Math.sign(s) : -Math.sign(Math.sin(h.yaw)) || 1);
      const p = hp(h, [Math.sin(a) * 0.97, -EAR_SIDE_V, Math.cos(a) * 0.97]);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(s, 1);
      e.draw(ctx, fill, inner, true);
      ctx.restore();
    } else {
      if (hide) continue;
      const a = side * EAR_TOP.a;
      const f = facingOf(h, a);
      const base = hp(h, [Math.sin(a) * 0.72, -EAR_TOP.v, Math.cos(a) * 0.72]);
      const isFront = base.z > 0;
      if ((phase === 'top') !== isFront || phase === 'mid' || phase === 'over') continue;
      const mirror = Math.sign(Math.sin(a + h.yaw)) || side;
      ctx.save();
      ctx.translate(base.x, base.y);
      ctx.rotate(mirror * 0.18);
      ctx.scale(mirror * Math.max(0.45, Math.abs(f)), 1);
      e.draw(ctx, fill, inner, f > 0);
      ctx.restore();
    }
  }
}
