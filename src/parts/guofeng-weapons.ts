import type { Gender } from '../core/types';
import type { Vec3 } from '../core/math';
import { ink } from '../core/color';
import { circle, drawLimb, fs, polyPath, type P2 } from '../render/context';
import { WEAPONS, type WeaponDef } from '../render/props';
import { gfId } from './guofeng-face';
import { drawMotif, ribbon } from './ornaments';

const G = -1.4;
type Kind = 'sword' | 'dao' | 'spear' | 'fan' | 'brush' | 'flute' | 'ruyi' | 'gourd' | 'bow' | 'staff' | 'lantern' | 'lotus';
const KINDS: Kind[] = ['sword', 'dao', 'spear', 'fan', 'brush', 'flute', 'ruyi', 'gourd', 'bow', 'staff', 'lantern', 'lotus'];

export function guofengWeapons(gender: Gender) {
  const male = gender === 'male';
  const names = (male ? '青锋剑 雁翎刀 红缨枪 山水折扇 判官笔 竹笛 青玉如意 酒葫芦 角弓 九环禅杖 宫灯 青莲枝' : '流云剑 月牙刀 桃花枪 花鸟折扇 点朱笔 玉笛 白玉如意 药葫芦 月影弓 星月法杖 莲灯 桃莲枝').split(' ');
  const weapon: WeaponDef[] = [
    { id: 'auto', name: '随动作', hand: 'R', draw: null },
    { id: 'none', name: '空手', hand: 'R', draw: null },
    ...KINDS.map((kind, i): WeaponDef => ({
      id: gfId(gender, 'weapon', i), name: names[i], hand: kind === 'bow' ? 'L' : 'R',
      effect: kind === 'staff' || kind === 'ruyi' ? 'staff' : undefined,
      tip: ['sword', 'dao', 'spear', 'staff', 'brush'].includes(kind) ? [0, G, kind === 'spear' ? 25 : 17] : undefined,
      base: [0, G, kind === 'spear' ? 12 : 3],
      draw: (rc, P) => {
        const { ctx } = rc;
        const wood = male ? '#685443' : '#876475', jade = male ? '#83b6a1' : '#e1b3bf', gold = '#c5a161';
        const shaft = (a: Vec3, b: Vec3, w = 1.2, color = wood) => drawLimb(ctx, [{ a: P(a), b: P(b), w, color }]);
        const shape = (pts: Vec3[], color: string) => { polyPath(ctx, pts.map(P)); fs(ctx, color, ink(color), .6); };
        const dot = (at: Vec3, r: number, color: string) => { const p = P(at); circle(ctx, p.x, p.y, r); fs(ctx, color, ink(color), .4); };
        const tassel = (at: Vec3, len: number, color = '#b95651') => { const p = P(at); ribbon(ctx, p.x, p.y, len, color, .8); };
        const motif = (at: Vec3, size: number) => { const p = P(at); drawMotif(ctx, male ? 'cloud' : 'lotus', p.x, p.y, size, gold); };
        switch (kind) {
          case 'sword': case 'dao':
            shaft([0, G, -2.5], [0, G, 2], 1.5);
            shape(kind === 'sword' ? [[-1.1, G, 2], [-1, G, 14.5], [0, G, 17], [1, G, 14.5], [1.1, G, 2]]
              : [[-.5, G, 2], [-.8, G, 12], [1.5, G, 17], [2.6, G, 12], [1.5, G, 2]], '#dce6e5');
            shaft([-2.3, G, 1.8], [2.3, G, 1.8], 1.1, gold);
            shaft([0, G - .15, 3], [0, G - .15, 13], .35, '#ffffff');
            dot([0, G, -2.5], .8, jade); tassel([0, G, -2.5], 6, jade); break;
          case 'spear':
            shaft([0, G, -12], [0, G, 20], 1.25);
            shape([[-1.3, G, 20], [0, G, 25], [1.3, G, 20], [0, G, 18.8]], '#dce6e5');
            tassel([0, G, 19], 8); dot([0, G, 19], 1.2, gold); break;
          case 'fan': {
            const points: Vec3[] = [[0, G, 0]];
            for (let j = 0; j <= 12; j++) { const a = -.95 + j / 12 * 1.9; points.push([Math.sin(a) * 10, G, Math.cos(a) * 10]); }
            shape(points, male ? '#e6ddc1' : '#ecd4d1');
            for (let j = 0; j <= 6; j++) { const a = -.95 + j / 6 * 1.9; shaft([0, G, 0], [Math.sin(a) * 10, G, Math.cos(a) * 10], .35, wood); }
            motif([0, G, 6], 1.9); tassel([0, G, 0], 5, jade); break;
          }
          case 'brush':
            shaft([0, G, -4], [0, G, 10], 1.1, wood);
            shape([[-1.2, G, 10], [0, G, 17], [1.2, G, 10]], '#eee7da');
            shape([[-.6, G, 14], [0, G, 17], [.6, G, 14]], male ? '#2e3542' : '#b55754'); break;
          case 'flute':
            shaft([0, G, -3], [0, G, 12], 1.5, jade);
            for (let j = 0; j < 6; j++) dot([0, G - .2, j * 1.7], .23, '#3d6658');
            tassel([0, G, 9], 6, gold); break;
          case 'ruyi':
            shaft([0, G, -2], [0, G, 12], 1.2, jade);
            for (const x of [-1.3, 0, 1.3]) dot([x, G, 13 + (x === 0 ? 1 : 0)], 1.4, jade);
            motif([0, G, 13], 1); tassel([0, G, -2], 6, gold); break;
          case 'gourd':
            dot([0, G, 1.5], 2.8, male ? '#c7a35c' : '#9cba9c');
            dot([0, G, 4.5], 1.6, male ? '#c7a35c' : '#9cba9c');
            shaft([0, G, 5.3], [0, G, 6.3], 1, wood); motif([0, G, 1.5], 1.3); tassel([0, G, 3.4], 4); break;
          case 'bow':
            WEAPONS.find((w) => w.id === 'bow')!.draw!(rc, P);
            tassel([0, G - 4, 0], 6, jade); dot([0, G - 4, 0], .8, gold); break;
          case 'staff': {
            shaft([0, G, -12], [0, G, 15], 1.5, wood);
            const p = P([0, G, 16]); circle(ctx, p.x, p.y, 2.5); fs(ctx, null, gold, 1.2);
            for (const x of [-2.5, 2.5]) dot([x, G, 15], .75, gold);
            dot([0, G, 16], 1.1 + (rc.fx.glow ?? 0) * .5, jade); break;
          }
          case 'lantern': {
            shaft([0, G, -2], [0, G, 4], .8, wood);
            const p = P([0, G - 1, 3]); circle(ctx, p.x, p.y, 3.4); fs(ctx, '#d87b69', '#855747', .6);
            ctx.beginPath(); ctx.ellipse(p.x, p.y, 1.3, 3.3, 0, 0, 7); fs(ctx, null, '#edc49c', .4);
            ribbon(ctx, p.x, p.y + 3.3, 5, gold); break;
          }
          case 'lotus': {
            shaft([0, G, -3], [0, G, 9], .7, '#779475');
            const p = P([0, G, 10]);
            for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.ellipse(p.x + j * .8, p.y, .8, 2.2, j * .3, 0, 7); fs(ctx, '#dca0b1', '#a86783', .35); }
            shape([[0, G, 3], [3, G, 5], [2, G, 2]], '#88aa8a'); break;
          }
        }
      },
    })),
  ];
  const autoProps = Object.fromEntries([['sword', 0], ['spear', 2], ['bow', 8], ['staff', 6], ['potion', 7]].map(([prop, i]) => [prop, gfId(gender, 'weapon', i as number)]));
  return { weapon, autoProps };
}
