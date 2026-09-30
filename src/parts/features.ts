import { ink, rgba, shade } from '../core/color';
import { circle, fs, heart, star } from '../render/context';

const LINE = '#382632';

// ---------------- Eyes ----------------

type EyeShape = 'round' | 'almond' | 'sharp' | 'droop' | 'half';
export interface EyeDef {
  id: string;
  name: string;
  kind: 'normal' | 'dot' | 'happy' | 'line' | 'swirl';
  shape?: EyeShape;
  w?: number;
  h?: number;
  iris?: number;
  pupil?: 'round' | 'small' | 'slit' | 'star' | 'heart' | 'none';
  hl?: number;
  lash?: boolean;
}

export const EYES: EyeDef[] = [
  { id: 'big', name: '大圆眼', kind: 'normal', shape: 'round', w: 3.3, h: 4.2, iris: 0.78, pupil: 'round', hl: 2 },
  { id: 'sparkle', name: '闪亮眼', kind: 'normal', shape: 'round', w: 3.5, h: 4.5, iris: 0.84, pupil: 'round', hl: 3 },
  { id: 'dot', name: '豆豆眼', kind: 'dot', w: 2.6, h: 3.2 },
  { id: 'happy', name: '眯眯眼', kind: 'happy', w: 3.0, h: 3.0 },
  { id: 'sleepy', name: '困倦眼', kind: 'normal', shape: 'half', w: 3.3, h: 3.6, iris: 0.72, pupil: 'round', hl: 1 },
  { id: 'sharp', name: '凌厉眼', kind: 'normal', shape: 'sharp', w: 3.4, h: 3.4, iris: 0.62, pupil: 'small', hl: 1 },
  { id: 'droop', name: '下垂眼', kind: 'normal', shape: 'droop', w: 3.3, h: 3.8, iris: 0.72, pupil: 'round', hl: 2 },
  { id: 'cat', name: '猫瞳', kind: 'normal', shape: 'almond', w: 3.4, h: 3.9, iris: 0.82, pupil: 'slit', hl: 1 },
  { id: 'star', name: '星星眼', kind: 'normal', shape: 'round', w: 3.4, h: 4.3, iris: 0.82, pupil: 'star', hl: 1 },
  { id: 'heart', name: '爱心眼', kind: 'normal', shape: 'round', w: 3.4, h: 4.3, iris: 0.82, pupil: 'heart', hl: 1 },
  { id: 'narrow', name: '细长眼', kind: 'normal', shape: 'almond', w: 3.5, h: 2.3, iris: 0.6, pupil: 'round', hl: 1 },
  { id: 'blank', name: '呆萌眼', kind: 'normal', shape: 'round', w: 3.2, h: 4.0, iris: 0.72, pupil: 'none', hl: 0 },
  { id: 'line', name: '线条眼', kind: 'line', w: 2.8, h: 2 },
  { id: 'swirl', name: '晕眩眼', kind: 'swirl', w: 3.2, h: 3.6 },
  { id: 'gem', name: '宝石眼', kind: 'normal', shape: 'almond', w: 3.5, h: 4.4, iris: 0.88, pupil: 'small', hl: 3, lash: true },
];

function eyeCurve(s: EyeShape, w: number, h: number): number[] {
  switch (s) {
    case 'almond':
      return [-w, 0.25 * h, -0.6 * w, -1.25 * h, 0.6 * w, -1.25 * h, w, -0.05 * h, 0.6 * w, 1.15 * h, -0.6 * w, 1.15 * h];
    case 'sharp':
      return [-w, 0.35 * h, -0.5 * w, -1.1 * h, 0.5 * w, -1.35 * h, w, -0.55 * h, 0.7 * w, 0.95 * h, -0.5 * w, 1.15 * h];
    case 'droop':
      return [-w, -0.35 * h, -0.5 * w, -1.35 * h, 0.5 * w, -1.15 * h, w, 0.3 * h, 0.5 * w, 1.15 * h, -0.6 * w, 0.95 * h];
    case 'half':
      return [-w, -0.1 * h, -0.5 * w, -0.45 * h, 0.5 * w, -0.45 * h, w, -0.1 * h, 0.7 * w, 1.2 * h, -0.7 * w, 1.2 * h];
    default:
      return [-w, 0.05 * h, -w, -1.3 * h, w, -1.3 * h, w, 0.05 * h, w, 1.25 * h, -w, 1.25 * h];
  }
}

export interface ExprState {
  blink: boolean;
  female: boolean;
  hurt: boolean;
  joy: boolean;
}

export function drawEye(ctx: CanvasRenderingContext2D, d: EyeDef, color: string, st: ExprState) {
  const w = (d.w ?? 3.2) * (st.female ? 1.16 : 1.1), h = (d.h ?? 4) * 1.08;
  let kind: string = d.kind;
  if (st.hurt) kind = 'hurt';
  else if (st.joy && kind === 'normal') kind = 'happy';
  else if (st.blink && (kind === 'normal' || kind === 'dot')) kind = 'closed';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = LINE;
  switch (kind) {
    case 'happy':
      ctx.beginPath();
      ctx.moveTo(-w * 0.9, h * 0.35);
      ctx.quadraticCurveTo(0, -h * 0.75, w * 0.9, h * 0.35);
      ctx.lineWidth = 1.3;
      ctx.stroke();
      return;
    case 'closed':
      ctx.beginPath();
      ctx.moveTo(-w, h * 0.1);
      ctx.quadraticCurveTo(0, h * 0.7, w, h * 0.1);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (st.female || d.lash) {
        ctx.beginPath();
        ctx.moveTo(w * 0.9, h * 0.15);
        ctx.lineTo(w * 1.3, -h * 0.05);
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      return;
    case 'line':
      ctx.beginPath();
      ctx.moveTo(-w * 0.9, h * 0.2);
      ctx.lineTo(w * 0.9, h * 0.2);
      ctx.lineWidth = 1.3;
      ctx.stroke();
      return;
    case 'dot':
      ctx.beginPath();
      ctx.ellipse(0, h * 0.1, w * 0.42, h * 0.5, 0, 0, Math.PI * 2);
      fs(ctx, '#2a1e24', null);
      circle(ctx, -w * 0.1, -h * 0.12, w * 0.15);
      fs(ctx, '#ffffff', null);
      return;
    case 'swirl': {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * Math.PI * 3.5;
        const r = (i / 40) * w * 0.95;
        const x = Math.cos(t) * r, y = Math.sin(t) * r * (h / w) + h * 0.1;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.lineWidth = 0.8;
      ctx.stroke();
      return;
    }
    case 'hurt':
      ctx.beginPath();
      ctx.moveTo(w * 0.8, -h * 0.45);
      ctx.lineTo(-w * 0.6, h * 0.1);
      ctx.lineTo(w * 0.8, h * 0.6);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      return;
  }

  const c = eyeCurve(d.shape ?? 'round', w, h);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(c[0], c[1]);
    ctx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
    ctx.bezierCurveTo(c[8], c[9], c[10], c[11], c[0], c[1]);
    ctx.closePath();
  };
  path();
  const sclera = ctx.createLinearGradient(0, -h, 0, h);
  sclera.addColorStop(0, '#d9d5e9');
  sclera.addColorStop(.42, '#fffafa');
  sclera.addColorStop(1, '#fffdf6');
  ctx.fillStyle = sclera;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const ir = w * (d.iris ?? 0.75);
  const ih = Math.min(h * 1.05, ir * 1.25);
  const cx = -w * 0.05, cy = h * 0.12;
  const g = ctx.createLinearGradient(0, cy - ih, 0, cy + ih);
  g.addColorStop(0, shade(color, -0.5));
  g.addColorStop(0.55, color);
  g.addColorStop(1, shade(color, 0.45));
  ctx.beginPath();
  ctx.ellipse(cx, cy, ir, ih, 0, 0, Math.PI * 2);
  fs(ctx, g, shade(color, -0.55), 0.5);
  // Fine iris spokes and the lower reflection give the eyes depth at both preview and export sizes.
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 18; i++) {
    const a = Math.PI * 2 * i / 18;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * ir * .55, cy + Math.sin(a) * ih * .55);
    ctx.lineTo(cx + Math.cos(a) * ir * .88, cy + Math.sin(a) * ih * .88);
    fs(ctx, null, rgba(shade(color, i % 2 ? .55 : -.5), .35), .18);
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy + ih * .12, ir * .8, ih * .73, 0, .15, Math.PI - .15);
  fs(ctx, null, rgba(shade(color, .72), .65), .45);
  ctx.restore();
  const pc = shade(color, -0.72);
  switch (d.pupil) {
    case 'round':
      ctx.beginPath();
      ctx.ellipse(cx, cy + ih * 0.08, ir * 0.45, ih * 0.45, 0, 0, Math.PI * 2);
      fs(ctx, pc, null);
      break;
    case 'small':
      circle(ctx, cx, cy + ih * 0.05, ir * 0.3);
      fs(ctx, pc, null);
      break;
    case 'slit':
      ctx.beginPath();
      ctx.ellipse(cx, cy, ir * 0.16, ih * 0.82, 0, 0, Math.PI * 2);
      fs(ctx, pc, null);
      break;
    case 'star':
      star(ctx, cx, cy + ih * 0.05, ir * 0.72, 5, 0.45);
      fs(ctx, '#fff6b0', null);
      break;
    case 'heart':
      heart(ctx, cx, cy + ih * 0.05, ir * 0.6);
      fs(ctx, '#ff4f8b', null);
      break;
  }
  const hl = d.hl ?? 1;
  if (hl >= 1) {
    ctx.beginPath();
    ctx.ellipse(cx - ir * 0.35, cy - ih * 0.42, ir * 0.34, ih * 0.28, -0.4, 0, Math.PI * 2);
    fs(ctx, '#ffffff', null);
  }
  if (hl >= 2) {
    circle(ctx, cx + ir * 0.38, cy + ih * 0.45, ir * 0.15);
    fs(ctx, 'rgba(255,255,255,0.9)', null);
  }
  if (hl >= 3) {
    star(ctx, cx + ir * 0.4, cy - ih * 0.2, ir * 0.22, 4, 0.35, 0);
    fs(ctx, '#ffffff', null);
  }
  ctx.restore();
  // upper lid
  ctx.beginPath();
  ctx.moveTo(c[0], c[1]);
  ctx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = st.female ? 1.12 : 1.02;
  ctx.stroke();
  // lower lid
  path();
  ctx.lineWidth = 0.32;
  ctx.stroke();
  if (st.female || d.lash) {
    ctx.beginPath();
    ctx.moveTo(c[6], c[7]);
    ctx.lineTo(c[6] + w * 0.4, c[7] - h * 0.3);
    ctx.moveTo(c[6] - w * 0.2, c[7] - h * 0.5);
    ctx.lineTo(c[6] + w * 0.22, c[7] - h * 0.85);
    ctx.lineWidth = 0.55;
    ctx.stroke();
  }
}

// ---------------- Brows ----------------

export interface BrowDef {
  id: string;
  name: string;
  kind: 'shape' | 'dots' | 'bushy' | 'cut' | 'none';
  w?: number;
  t?: number;
  arch?: number;
  tilt?: number;
  taper?: number;
  raise?: number;
}

export const BROWS: BrowDef[] = [
  { id: 'natural', name: '自然眉', kind: 'shape', w: 2.8, t: 1.0, arch: 0.5, taper: 0.5 },
  { id: 'thick', name: '粗眉', kind: 'shape', w: 3.0, t: 1.8, arch: 0.4, taper: 0.7 },
  { id: 'thin', name: '细眉', kind: 'shape', w: 2.9, t: 0.55, arch: 0.6, taper: 0.3 },
  { id: 'arched', name: '弯月眉', kind: 'shape', w: 3.0, t: 0.9, arch: 1.2, taper: 0.4 },
  { id: 'angry', name: '怒眉', kind: 'shape', w: 2.9, t: 1.3, arch: 0.1, tilt: 1.0, taper: 0.5 },
  { id: 'worried', name: '八字眉', kind: 'shape', w: 2.8, t: 1.0, arch: 0.2, tilt: -1.0, taper: 0.5 },
  { id: 'flat', name: '平直眉', kind: 'shape', w: 3.0, t: 1.1, arch: 0, taper: 0.9 },
  { id: 'maro', name: '麻吕眉', kind: 'dots' },
  { id: 'sword', name: '剑眉', kind: 'shape', w: 3.1, t: 1.3, arch: 0.3, tilt: 0.6, taper: 0.15 },
  { id: 'bushy', name: '浓密眉', kind: 'bushy', w: 3.0, t: 1.7, arch: 0.5, taper: 0.8 },
  { id: 'short', name: '短眉', kind: 'shape', w: 1.8, t: 1.2, arch: 0.3, taper: 0.8 },
  { id: 'raised', name: '挑眉', kind: 'shape', w: 2.8, t: 1.0, arch: 0.6, taper: 0.5, raise: 1.3 },
  { id: 'cut', name: '断眉', kind: 'cut', w: 2.9, t: 1.2, arch: 0.4, taper: 0.5 },
  { id: 'none', name: '无眉', kind: 'none' },
];

export function drawBrow(ctx: CanvasRenderingContext2D, d: BrowDef, color: string, mirror: number, skin: string, angry: boolean) {
  if (d.kind === 'none') return;
  if (d.kind === 'dots') {
    ctx.beginPath();
    ctx.ellipse(-0.6, 0, 1.2, 0.85, 0, 0, Math.PI * 2);
    fs(ctx, color, null);
    return;
  }
  const w = d.w ?? 2.8, t = d.t ?? 1, arch = d.arch ?? 0.5, taper = d.taper ?? 0.5;
  const tilt = (d.tilt ?? 0) + (angry ? 0.7 : 0);
  const dy = d.raise && mirror < 0 ? -d.raise : 0;
  ctx.save();
  ctx.translate(0, dy);
  ctx.beginPath();
  ctx.moveTo(-w, tilt - t / 2);
  ctx.quadraticCurveTo(0, -2 * arch - t / 2, w, -tilt - (t * taper) / 2);
  ctx.lineTo(w, -tilt + (t * taper) / 2);
  ctx.quadraticCurveTo(0, -2 * arch + t / 2, -w, tilt + t / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.3;
  ctx.stroke();
  if (d.kind === 'bushy') {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const x = -w + (i + 0.5) * ((2 * w) / 5);
      ctx.moveTo(x, -arch - t * 0.4);
      ctx.lineTo(x + 0.5, -arch - t * 0.9);
    }
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  if (d.kind === 'cut' && mirror > 0) {
    ctx.beginPath();
    ctx.moveTo(w * 0.15, -arch - t * 1.4);
    ctx.lineTo(w * 0.45, -arch + t * 1.2);
    ctx.strokeStyle = skin;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------- Noses ----------------

export interface NoseDef {
  id: string;
  name: string;
  size: number;
  draw: ((ctx: CanvasRenderingContext2D, skin: string) => void) | null;
}

const nInk = (skin: string) => ink(skin);

export const NOSES: NoseDef[] = [
  { id: 'dot', name: '点鼻', size: 0.8, draw: (c, s) => { c.beginPath(); c.ellipse(0, 0, 0.45, 0.35, 0, 0, 7); fs(c, nInk(s), null); } },
  {
    id: 'hook', name: '小勾鼻', size: 1,
    draw: (c, s) => { c.beginPath(); c.moveTo(0.3, -1.3); c.quadraticCurveTo(-0.7, 0.5, 0.6, 0.5); fs(c, null, nInk(s), 0.6); },
  },
  {
    id: 'button', name: '圆鼻头', size: 1,
    draw: (c, s) => {
      circle(c, 0, 0, 1.1); fs(c, shade(s, -0.05), nInk(s), 0.45);
      circle(c, -0.35, -0.35, 0.32); fs(c, 'rgba(255,255,255,0.75)', null);
    },
  },
  {
    id: 'shadow', name: '阴影鼻', size: 1,
    draw: (c, s) => { c.beginPath(); c.moveTo(0.1, -1.4); c.lineTo(0.9, 0.6); c.lineTo(-0.5, 0.6); c.closePath(); fs(c, shade(s, -0.16), null); },
  },
  {
    id: 'pointy', name: '尖鼻', size: 1.2,
    draw: (c, s) => { c.beginPath(); c.moveTo(-0.2, -1.6); c.lineTo(0.7, 0.5); c.lineTo(-0.3, 0.6); fs(c, null, nInk(s), 0.55); },
  },
  {
    id: 'big', name: '大圆鼻', size: 1.6,
    draw: (c, s) => {
      circle(c, 0, 0, 2.0); fs(c, shade(s, -0.04), nInk(s), 0.6);
      circle(c, -0.6, -0.6, 0.5); fs(c, 'rgba(255,255,255,0.7)', null);
    },
  },
  {
    id: 'aquiline', name: '鹰钩鼻', size: 1.6,
    draw: (c, s) => {
      c.beginPath(); c.moveTo(-0.3, -2.2); c.quadraticCurveTo(1.7, -0.4, 0.6, 0.9); c.quadraticCurveTo(0, 1.1, -0.6, 0.5);
      fs(c, null, nInk(s), 0.6);
    },
  },
  {
    id: 'snub', name: '朝天鼻', size: 0.9,
    draw: (c, s) => {
      c.beginPath(); c.moveTo(-0.9, -0.2); c.quadraticCurveTo(0, -1.1, 0.9, -0.2); fs(c, null, nInk(s), 0.5);
      circle(c, -0.45, 0.35, 0.28); fs(c, nInk(s), null);
      circle(c, 0.45, 0.35, 0.28); fs(c, nInk(s), null);
    },
  },
  {
    id: 'wide', name: '宽鼻', size: 1.3,
    draw: (c, s) => {
      c.beginPath(); c.moveTo(-1.6, 0); c.quadraticCurveTo(-1.9, 0.9, -0.7, 0.8);
      c.moveTo(1.6, 0); c.quadraticCurveTo(1.9, 0.9, 0.7, 0.8); fs(c, null, nInk(s), 0.55);
      circle(c, -0.5, 0.55, 0.25); fs(c, nInk(s), null);
      circle(c, 0.5, 0.55, 0.25); fs(c, nInk(s), null);
    },
  },
  {
    id: 'nostril', name: '鼻孔', size: 0.8,
    draw: (c, s) => {
      c.beginPath(); c.ellipse(-0.5, 0.2, 0.3, 0.22, 0, 0, 7); fs(c, nInk(s), null);
      c.beginPath(); c.ellipse(0.5, 0.2, 0.3, 0.22, 0, 0, 7); fs(c, nInk(s), null);
    },
  },
  {
    id: 'clown', name: '红鼻头', size: 1.3,
    draw: (c) => {
      circle(c, 0, 0, 1.5); fs(c, '#e34848', '#7a1f25', 0.5);
      circle(c, -0.5, -0.5, 0.4); fs(c, 'rgba(255,255,255,0.85)', null);
    },
  },
  { id: 'none', name: '无鼻', size: 0, draw: null },
];

// ---------------- Mouths ----------------

export interface MouthDef {
  id: string;
  name: string;
  draw: (ctx: CanvasRenderingContext2D, female: boolean) => void;
}

const INSIDE = '#7a2330', TONGUE = '#ff8a9a';
const line = (c: CanvasRenderingContext2D, lw = 0.75) => fs(c, null, LINE, lw);

function openMouth(c: CanvasRenderingContext2D, w: number, top: number, depth: number) {
  const outline = () => {
    c.beginPath();
    c.moveTo(-w, top);
    c.quadraticCurveTo(0, top + 0.5, w, top);
    c.bezierCurveTo(w * 0.9, depth, -w * 0.9, depth, -w, top);
    c.closePath();
  };
  outline();
  c.fillStyle = INSIDE;
  c.fill();
  c.save();
  c.clip();
  c.beginPath();
  c.ellipse(0, depth * 0.78, w * 0.65, depth * 0.35, 0, 0, 7);
  c.fillStyle = TONGUE;
  c.fill();
  c.restore();
  // Canvas save/restore does not restore the current path: outline the mouth, not the tongue ellipse.
  outline();
  c.strokeStyle = LINE;
  c.lineWidth = 0.7;
  c.stroke();
}

export const MOUTHS: MouthDef[] = [
  { id: 'smile', name: '微笑', draw: (c) => { c.beginPath(); c.moveTo(-2, -0.3); c.quadraticCurveTo(0, 1.6, 2, -0.3); line(c); } },
  { id: 'open', name: '开心', draw: (c) => openMouth(c, 2.4, -0.6, 3.0) },
  {
    id: 'cat', name: '猫咪嘴',
    draw: (c) => { c.beginPath(); c.moveTo(-2.4, -0.4); c.quadraticCurveTo(-1.2, 1.4, 0, 0); c.quadraticCurveTo(1.2, 1.4, 2.4, -0.4); line(c); },
  },
  { id: 'small', name: '小嘴', draw: (c) => { c.beginPath(); c.moveTo(-0.8, 0.2); c.quadraticCurveTo(0, 0.8, 0.8, 0.2); line(c); } },
  { id: 'flat', name: '一字嘴', draw: (c) => { c.beginPath(); c.moveTo(-1.6, 0.3); c.lineTo(1.6, 0.3); line(c); } },
  { id: 'frown', name: '撇嘴', draw: (c) => { c.beginPath(); c.moveTo(-1.8, 0.9); c.quadraticCurveTo(0, -0.6, 1.8, 0.9); line(c); } },
  { id: 'smirk', name: '坏笑', draw: (c) => { c.beginPath(); c.moveTo(-1.6, 0.4); c.quadraticCurveTo(0.6, 1.0, 2.1, -0.7); line(c); } },
  {
    id: 'tongue', name: '吐舌',
    draw: (c) => {
      c.beginPath(); c.ellipse(0.7, 1.3, 0.9, 1.1, 0, 0, 7); fs(c, TONGUE, LINE, 0.5);
      c.beginPath(); c.moveTo(-2, -0.2); c.quadraticCurveTo(0, 1.4, 2, -0.2); line(c);
    },
  },
  {
    id: 'fang', name: '小虎牙',
    draw: (c) => {
      c.beginPath(); c.moveTo(-2, -0.3); c.quadraticCurveTo(0, 1.6, 2, -0.3); line(c);
      c.beginPath(); c.moveTo(0.8, 0.62); c.lineTo(1.15, 1.5); c.lineTo(1.5, 0.42); c.closePath(); fs(c, '#ffffff', LINE, 0.4);
    },
  },
  {
    id: 'grin', name: '露齿笑',
    draw: (c) => {
      c.beginPath(); c.moveTo(-2.5, -0.4); c.quadraticCurveTo(0, 3.0, 2.5, -0.4); c.closePath(); fs(c, '#ffffff', LINE, 0.7);
      c.beginPath(); c.moveTo(-2.1, 0.35); c.quadraticCurveTo(0, 1.0, 2.1, 0.35); fs(c, null, LINE, 0.35);
    },
  },
  {
    id: 'pout', name: '嘟嘴',
    draw: (c) => {
      c.beginPath(); c.moveTo(-0.3, -0.9); c.quadraticCurveTo(1.1, -0.6, 0.1, 0); c.quadraticCurveTo(1.1, 0.6, -0.3, 0.9);
      line(c, 0.7);
    },
  },
  { id: 'o', name: '惊讶', draw: (c) => { c.beginPath(); c.ellipse(0, 0.5, 1.0, 1.25, 0, 0, 7); fs(c, INSIDE, LINE, 0.7); } },
  {
    id: 'wavy', name: '紧张',
    draw: (c) => {
      c.beginPath(); c.moveTo(-2.2, 0.3);
      for (let i = 0; i < 4; i++) c.quadraticCurveTo(-2.2 + i * 1.1 + 0.55, i % 2 ? 1.1 : -0.5, -2.2 + (i + 1) * 1.1, 0.3);
      line(c, 0.65);
    },
  },
  { id: 'laugh', name: '大笑', draw: (c) => openMouth(c, 2.9, -0.9, 4.2) },
  {
    id: 'kiss', name: '啾啾',
    draw: (c) => { heart(c, 0, 0.4, 1.0); fs(c, '#f06f8f', '#8a2a3a', 0.5); },
  },
];
