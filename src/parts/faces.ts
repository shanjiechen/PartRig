import type { HeadView } from '../render/context';

export interface FaceDef {
  id: string;
  name: string;
  sx: number;
  sy: number;
  /** Jaw width factor at the lower face. */
  jaw: number;
  /** 0 = round/flat chin, 1 = pointy chin. */
  chin: number;
  /** Cheek bulge. */
  cheek: number;
}

export const FACES: FaceDef[] = [
  { id: 'round', name: '圆脸', sx: 1.0, sy: 0.96, jaw: 0.95, chin: 0.12, cheek: 0.1 },
  { id: 'oval', name: '鹅蛋脸', sx: 0.95, sy: 1.0, jaw: 0.82, chin: 0.35, cheek: 0.05 },
  { id: 'square', name: '方脸', sx: 1.0, sy: 0.95, jaw: 1.05, chin: 0.0, cheek: 0 },
  { id: 'heart', name: '心形脸', sx: 1.02, sy: 0.98, jaw: 0.7, chin: 0.7, cheek: 0.12 },
  { id: 'vshape', name: '瓜子脸', sx: 0.95, sy: 1.02, jaw: 0.62, chin: 0.88, cheek: 0 },
  { id: 'long', name: '长脸', sx: 0.9, sy: 1.08, jaw: 0.85, chin: 0.3, cheek: 0 },
  { id: 'bun', name: '包子脸', sx: 1.08, sy: 0.93, jaw: 1.05, chin: 0.05, cheek: 0.22 },
  { id: 'wide', name: '宽脸', sx: 1.1, sy: 0.92, jaw: 0.92, chin: 0.2, cheek: 0.08 },
  { id: 'diamond', name: '菱形脸', sx: 0.97, sy: 1.0, jaw: 0.72, chin: 0.62, cheek: 0.18 },
  { id: 'pear', name: '梨形脸', sx: 0.96, sy: 0.98, jaw: 1.12, chin: 0.1, cheek: 0.25 },
  { id: 'baby', name: '婴儿肥', sx: 1.05, sy: 1.0, jaw: 1.0, chin: 0.05, cheek: 0.3 },
  { id: 'sharp', name: '尖下巴', sx: 0.95, sy: 1.02, jaw: 0.55, chin: 1.0, cheek: 0 },
  { id: 'block', name: '国字脸', sx: 1.03, sy: 1.0, jaw: 1.15, chin: 0.0, cheek: -0.05 },
];

/** Head silhouette in the rolled head frame. `grow` enlarges it (used for beard clipping). */
export function faceOutline(ctx: CanvasRenderingContext2D, f: FaceDef, h: HeadView, grow = 0, growDown = 0) {
  const rx = h.R * h.sx * (1 + grow);
  const ry = h.R * h.sy * (1 + grow);
  const ryb = ry * (1 + growDown);
  const k = (1 + Math.cos(h.yaw)) / 2;
  const jaw = 1 + (f.jaw - 1) * k;
  const chin = f.chin * k;
  const cheek = f.cheek;
  const cx = Math.sin(h.yaw) * rx * 0.12 * Math.max(0, Math.cos(h.yaw) + 0.3);
  const bw = rx * (1 - chin) * 0.42;
  const by = ryb * (1 + 0.05 * chin);
  ctx.beginPath();
  ctx.moveTo(-rx, 0);
  ctx.ellipse(0, 0, rx, ry, 0, Math.PI, 0);
  ctx.bezierCurveTo(rx * (1 + cheek * 0.25), ryb * 0.45, rx * jaw * 0.95 + cx * 0.5, ryb * 0.92, cx + bw, by);
  ctx.quadraticCurveTo(cx, by + ryb * 0.04 * (1 - chin), cx - bw, by);
  ctx.bezierCurveTo(-rx * jaw * 0.95 + cx * 0.5, ryb * 0.92, -rx * (1 + cheek * 0.25), ryb * 0.45, -rx, 0);
  ctx.closePath();
}
