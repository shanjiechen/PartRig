import { circle, fs, polyPath, star } from '../render/context';

export const MOTIFS = ['cloud', 'lotus', 'plum', 'bamboo', 'wave', 'coin', 'crane', 'flame', 'ruyi', 'scale', 'star', 'leaf'] as const;
export type Motif = (typeof MOTIFS)[number];

/** Small geometric embroidery, also used on crowns, shoes and face ornaments. */
export function drawMotif(ctx: CanvasRenderingContext2D, motif: Motif, x: number, y: number, size: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 0.15;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (motif) {
    case 'cloud': case 'ruyi':
      ctx.moveTo(-1, 0.35); ctx.bezierCurveTo(-1.6, -0.1, -0.65, -0.7, -0.3, -0.25);
      ctx.bezierCurveTo(-0.4, -1.15, 0.85, -1.1, 0.75, -0.3);
      ctx.bezierCurveTo(1.6, -0.55, 1.7, 0.55, 0.85, 0.55);
      ctx.lineTo(-0.3, 0.55); ctx.quadraticCurveTo(-0.65, 0.35, -0.25, 0.1); ctx.stroke();
      if (motif === 'ruyi') { ctx.beginPath(); ctx.moveTo(0.3, 0.5); ctx.lineTo(0.3, 1.3); ctx.stroke(); }
      break;
    case 'lotus': case 'plum':
      for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.rotate(i * Math.PI * 2 / 5);
        ctx.beginPath(); ctx.ellipse(0, -0.65, motif === 'lotus' ? 0.25 : 0.38, 0.55, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      circle(ctx, 0, 0, 0.17); ctx.fill(); break;
    case 'bamboo':
      ctx.moveTo(-0.4, 1); ctx.lineTo(0.2, -1); ctx.moveTo(-0.4, 0.3); ctx.lineTo(0.25, 0.4);
      ctx.moveTo(-0.1, -0.4); ctx.lineTo(0.5, -0.3); ctx.stroke();
      for (const s of [-1, 1]) { polyPath(ctx, [{ x: 0, y: -0.1 }, { x: s * 1.1, y: -0.75 }, { x: s * 0.4, y: 0.2 }]); ctx.fill(); } break;
    case 'wave': case 'scale':
      for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(0, 0.6, 0.35 + j * 0.35, Math.PI, Math.PI * 2); ctx.stroke(); }
      if (motif === 'scale') { ctx.beginPath(); ctx.arc(-0.9, 0.9, 0.4, Math.PI, Math.PI * 2); ctx.arc(0.9, 0.9, 0.4, Math.PI, Math.PI * 2); ctx.stroke(); } break;
    case 'coin':
      circle(ctx, 0, 0, 1); ctx.stroke(); ctx.beginPath(); ctx.rect(-0.3, -0.3, 0.6, 0.6); ctx.stroke(); break;
    case 'crane':
      ctx.moveTo(-1.4, -0.3); ctx.quadraticCurveTo(-0.8, 0.8, 0.1, 0.2); ctx.quadraticCurveTo(0.8, -1.4, 1.3, -0.8);
      ctx.moveTo(0.1, 0.2); ctx.lineTo(-0.6, -1); ctx.moveTo(0.1, 0.2); ctx.lineTo(0.7, 0.9); ctx.stroke(); break;
    case 'flame':
      ctx.moveTo(0, -1.3); ctx.bezierCurveTo(0.1, -0.3, 1.5, -0.2, 0.5, 0.85);
      ctx.bezierCurveTo(-0.4, 1.5, -1.3, 0.25, -0.6, -0.5); ctx.quadraticCurveTo(-0.4, 0.5, 0, -1.3); ctx.stroke(); break;
    case 'star': star(ctx, 0, 0, 1, 4, 0.3); ctx.fill(); break;
    case 'leaf':
      ctx.moveTo(-1, 1); ctx.quadraticCurveTo(-1.1, -1.2, 1.1, -1); ctx.quadraticCurveTo(1.3, 0.7, -1, 1);
      ctx.moveTo(-0.8, 0.8); ctx.lineTo(0.8, -0.8); ctx.stroke(); break;
  }
  ctx.restore();
}

export function ribbon(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, color: string, bend = 1) {
  ctx.beginPath(); ctx.moveTo(x - 0.7, y);
  ctx.quadraticCurveTo(x + bend * 2, y + len * 0.55, x + bend, y + len);
  ctx.lineTo(x + bend + 1.1, y + len - 1);
  ctx.quadraticCurveTo(x + bend * 2 + 1.5, y + len * 0.55, x + 0.7, y);
  ctx.closePath(); fs(ctx, color, null);
}
