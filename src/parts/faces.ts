import type { HeadView } from '../render/context';

export interface FaceDef {
  id: string;
  name: string;
  sx: number;
  sy: number;
  /** Jaw width factor at the lower face. */
  jaw: number;
  /** 0 = broad rounded chin, 1 = small tapered chin; all variants keep a smooth tip. */
  chin: number;
  /** Cheek bulge. */
  cheek: number;
}

export const FACES: FaceDef[] = [
  { id: 'round', name: '圆脸', sx: 1.0, sy: 1.0, jaw: 0.95, chin: 0.14, cheek: 0.12 },
  { id: 'oval', name: '鹅蛋脸', sx: 0.96, sy: 1.02, jaw: 0.86, chin: 0.32, cheek: 0.07 },
  { id: 'square', name: '方脸', sx: 1.0, sy: 0.99, jaw: 1.02, chin: 0.1, cheek: 0.04 },
  { id: 'heart', name: '心形脸', sx: 1.0, sy: 1.01, jaw: 0.8, chin: 0.5, cheek: 0.13 },
  { id: 'vshape', name: '瓜子脸', sx: 0.96, sy: 1.03, jaw: 0.77, chin: 0.56, cheek: 0.05 },
  { id: 'long', name: '长脸', sx: 0.94, sy: 1.06, jaw: 0.86, chin: 0.28, cheek: 0.04 },
  { id: 'bun', name: '包子脸', sx: 1.05, sy: 1.0, jaw: 1.01, chin: 0.1, cheek: 0.2 },
  { id: 'wide', name: '宽脸', sx: 1.055, sy: 0.99, jaw: 0.95, chin: 0.17, cheek: 0.1 },
  { id: 'diamond', name: '菱形脸', sx: 0.98, sy: 1.02, jaw: 0.83, chin: 0.44, cheek: 0.13 },
  { id: 'pear', name: '梨形脸', sx: 0.98, sy: 1.0, jaw: 1.02, chin: 0.15, cheek: 0.19 },
  { id: 'baby', name: '婴儿肥', sx: 1.04, sy: 1.01, jaw: 1.0, chin: 0.08, cheek: 0.23 },
  { id: 'sharp', name: '清秀尖脸', sx: 0.945, sy: 1.03, jaw: 0.73, chin: 0.65, cheek: 0.04 },
  { id: 'block', name: '国字脸', sx: 1.025, sy: 1.0, jaw: 1.06, chin: 0.08, cheek: 0.02 },
];

/** Head silhouette in the rolled head frame. `grow` enlarges it (used for beard clipping). */
export function faceOutline(ctx: CanvasRenderingContext2D, f: FaceDef, h: HeadView, grow = 0, growDown = 0) {
  const rx = h.R * h.sx * (1 + grow);
  const ry = h.R * h.sy * (1 + grow);
  const ryb = ry * (1 + growDown);
  const k = (1 + Math.cos(h.yaw)) / 2;
  const jaw = 1 + (f.jaw - 1) * k * .78;
  const chin = f.chin * k;
  const cheek = f.cheek;
  const cx = Math.sin(h.yaw) * rx * 0.12 * Math.max(0, Math.cos(h.yaw) + 0.3);
  const lowerW = rx * (jaw * (.68 - .1 * chin) + cheek * .08);
  const cheekControl = rx * (jaw * .9 + cheek * .1);
  const chinW = rx * (.18 - .07 * chin);
  const turnY = ryb * .85;
  const by = ryb * (1.01 + .025 * chin);
  // Match the tangent at the cheek/chin join, and finish with a horizontal tangent at the rounded chin.
  const chinControl = lowerW + (lowerW - cheekControl) * .65;
  const controlY = turnY + (turnY - ryb * .69) * .65;
  ctx.beginPath();
  ctx.moveTo(-rx, 0);
  ctx.ellipse(0, 0, rx, ry, 0, Math.PI, 0);
  ctx.bezierCurveTo(rx, ryb * .37, cx + cheekControl, ryb * .69, cx + lowerW, turnY);
  ctx.bezierCurveTo(cx + chinControl, controlY, cx + chinW, by, cx, by);
  ctx.bezierCurveTo(cx - chinW, by, cx - chinControl, controlY, cx - lowerW, turnY);
  ctx.bezierCurveTo(cx - cheekControl, ryb * .69, -rx, ryb * .37, -rx, 0);
  ctx.closePath();
}
