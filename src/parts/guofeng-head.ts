import type { Gender } from '../core/types';
import type { Vec3 } from '../core/math';
import { ink, shade } from '../core/color';
import { circle, fs, hp, hull, polyPath, type RenderCtx } from '../render/context';
import type { HairDef, HairTube } from './hair';
import { drawCap } from './hair';
import type { HatDef, Phase } from './headwear';
import { gfId } from './guofeng-face';
import { drawMotif, MOTIFS, ribbon } from './ornaments';

const names = (s: string) => s.split(' ');
const tail = (x: number, high: number, len: number, braid = false, width = .38): HairTube => ({
  pts: [[x, high, -.65], [x * 1.3, high - .2, -1.1], [x * 1.4, -.3, -1.16], [x * 1.15, -len, -.9]],
  w: [width * .7, width, width * .9, width * .25], tie: true, braid,
});

export function guofengHair(gender: Gender): HairDef[] {
  const male = gender === 'male';
  const labels = names(male ? '少年束髻 玉冠高髻 侠客马尾 书生半束 道士顶髻 江湖披发 双鬓短发 将军束辫 云游低髻 仙君长发 武僧短发 飞扬剑髻' : '双环髻 飞仙髻 灵蛇髻 桃花双髻 云鬓半披 垂鬟双辫 流苏高髻 百合髻 双螺髻 望仙髻 侠女高尾 童子双髻');
  return labels.map((name, i) => {
    const front = [-.14, -.3, -.09, -.05, -.25, -.01, .04, -.12, -.09, -.2, -.2, .04][i];
    const cap: HairDef['cap'] = { puff: .07 + i % 3 * .025, line: (a) => {
      const x = Math.abs(a);
      const edge = x < Math.PI / 2 ? front + (.48 - front) * Math.sin(x) : .55;
      return edge + Math.sin(a * (i % 3 + 2)) * .025 + (i === 5 || i === 9 ? Math.sin(a) * .17 : 0);
    } };
    const h: HairDef = { id: gfId(gender, 'hair', i), name, cap };
    if (male) {
      switch (i) {
        case 0: h.buns = [{ at: [0, 1.03, -.35], r: .29 }]; h.back = { len: .45, w: .68, cut: 'point' }; break;
        case 1: h.buns = [{ at: [0, 1.17, -.2], r: .35 }]; h.tubes = [tail(0, .55, 1.3)]; break;
        case 2: h.tubes = [tail(0, .7, 1.55, false, .48)]; h.tufts = [{ a: .9, v: .12, len: .32, w: .28 }]; break;
        case 3: h.buns = [{ at: [0, .72, -.8], r: .27 }]; h.back = { len: 1.2, w: .9, cut: 'straight' }; break;
        case 4: h.buns = [{ at: [0, 1.2, -.15], r: .3 }]; h.tubes = [tail(0, .1, 1.6, true, .3)]; break;
        case 5: h.back = { len: 1.55, w: 1.05, wave: .07, cut: 'point' }; break;
        case 6: h.tufts = [-1, 1].map((s) => ({ a: s * 1.5, v: .2, len: .45, w: .35, lean: s * .2 })); break;
        case 7: h.buns = [{ at: [0, 1, -.35], r: .25 }]; h.tubes = [tail(0, .5, 1.4, true, .55)]; break;
        case 8: h.buns = [{ at: [0, .4, -1], r: .35 }]; h.back = { len: .8, w: .7, cut: 'round' }; break;
        case 9: h.back = { len: 1.7, w: .85, cut: 'straight' }; h.buns = [{ at: [0, .85, -.7], r: .22 }]; break;
        case 10: h.cap = undefined; h.under = () => -.2; h.buns = [{ at: [0, .65, -.7], r: .2 }]; break;
        case 11: h.buns = [{ at: [0, 1.16, -.25], r: .25 }]; h.tufts = [{ a: .9, v: -.45, len: .4, w: .35, lean: .25 }]; h.tubes = [tail(.22, .7, 1.1)]; break;
      }
    } else {
      switch (i) {
        case 0: h.buns = [-1, 1].map((s) => ({ at: [s * .67, .86, -.15] as Vec3, r: .3 })); h.tubes = [tail(.65, .5, 1.2), tail(-.65, .5, 1.2)]; break;
        case 1: h.buns = [-1, 1].map((s) => ({ at: [s * .36, 1.17, -.2] as Vec3, r: .33 })); h.back = { len: 1.4, w: .9, cut: 'point' }; break;
        case 2: h.buns = [{ at: [.35, 1.1, -.25], r: .38 }, { at: [-.08, 1.33, -.3], r: .22 }]; h.tubes = [tail(-.7, .25, 1.5, true)]; break;
        case 3: h.buns = [-1, 1].map((s) => ({ at: [s * .8, .58, -.2] as Vec3, r: .36 })); h.back = { len: 1.15, w: .85, cut: 'round' }; break;
        case 4: h.buns = [{ at: [0, .85, -.7], r: .3 }]; h.back = { len: 1.65, w: 1.05, wave: .06, cut: 'point' }; break;
        case 5: h.tubes = [tail(.73, .38, 1.6, true), tail(-.73, .38, 1.6, true)]; break;
        case 6: h.buns = [{ at: [0, 1.12, -.2], r: .4 }]; h.tubes = [tail(0, .5, 1.55, false, .48)]; break;
        case 7: h.buns = [{ at: [-.38, 1, -.35], r: .3 }, { at: [.28, 1.22, -.35], r: .33 }]; h.back = { len: .9, w: .8, cut: 'straight' }; break;
        case 8: h.buns = [-1, 1].map((s) => ({ at: [s * .67, .84, -.1] as Vec3, r: .4 })); break;
        case 9: h.buns = [{ at: [0, 1.25, -.28], r: .33 }, { at: [0, 1.5, -.3], r: .17 }]; h.back = { len: 1.6, w: .82, cut: 'straight' }; break;
        case 10: h.tubes = [tail(0, .75, 1.7, false, .48)]; h.tufts = [{ a: -.9, v: .15, len: .4, w: .3 }]; break;
        case 11: h.buns = [-1, 1].map((s) => ({ at: [s * .72, .8, -.1] as Vec3, r: .24 })); h.tubes = [tail(.65, .4, .9, true), tail(-.65, .4, .9, true)]; break;
      }
    }
    return h;
  });
}

const PALETTES = [['#809e95', '#f2dcaa'], ['#b89a55', '#f8e0a2'], ['#a45f5d', '#edc596'], ['#4e6873', '#c4d9ca'], ['#c89bb1', '#f4dfb0'], ['#8f6a43', '#e6cea3']];

export function guofengHats(gender: Gender): HatDef[] {
  const male = gender === 'male';
  return names(male ? '无冠饰 青玉束冠 金莲高冠 玄色巾帻 侠客额带 书生方巾 竹编斗笠 白玉发簪 道士莲冠 将军护额 珠串额饰 青竹冠' : '无头饰 白玉花簪 金步摇 朱砂额带 青莲花冠 凤凰华胜 桃花边簪 轻纱帷帽 银月抹额 双蝶发夹 红绡发带 竹叶发冠').map((name, i) => {
    const [color, color2] = PALETTES[(i + (male ? 0 : 2)) % PALETTES.length];
    return { id: gfId(gender, 'headwear', i), name, color, color2, hideTufts: i === 6 && male,
      draw: i === 0 ? null : (rc, phase, c, c2, puff) => drawHeadwear(rc, phase, male, i, c, c2, puff) };
  });
}

function drawHeadwear(rc: RenderCtx, phase: Phase, male: boolean, i: number, c: string, c2: string, puff: number) {
  const { ctx, head } = rc;
  const point = (q: Vec3) => hp(head, q);
  const front = phase === 'front';
  const ornament = (q: Vec3, size: number, motif = MOTIFS[i % 12]) => {
    const p = point(q);
    if ((p.z >= 0) !== front) return;
    drawMotif(ctx, motif, p.x, p.y, size, c2);
  };
  const shape = (qs: Vec3[], color: string) => {
    const pts = qs.map(point);
    if ((pts.reduce((z, p) => z + p.z, 0) >= 0) !== front) return;
    polyPath(ctx, hull(pts)); fs(ctx, color, ink(color), .65);
  };
  if (male && i === 6 || !male && i === 7) {
    const ring = Array.from({ length: 36 }, (_, j) => point([Math.sin(j * Math.PI / 18) * 1.5, .72, Math.cos(j * Math.PI / 18) * 1.5]));
    if (front) { polyPath(ctx, hull([...ring, point([0, 1.45, 0])])); fs(ctx, c, ink(c), .7); }
    if (!male) for (const s of [-1, 1]) {
      const p = point([s * 1.25, .5, -.2]); if ((p.z >= 0) === front) {
        ctx.save(); ctx.globalAlpha = .65; ribbon(ctx, p.x, p.y, 31, '#e5dfd1', s * 1.5); ctx.restore();
      }
    }
    return;
  }
  if (male && [3, 5, 11].includes(i) && front) {
    drawCap(rc, () => -.55, .08 + puff, c);
    shape([[-.45, .85, .1], [-.45, 1.3, .1], [.45, 1.3, .1], [.45, .85, .1]], shade(c, .1));
    if (i === 5) for (const s of [-1, 1]) shape([[s * .55, .88, -.15], [s * 1.4, .98, -.1], [s * 1.4, .8, -.1]], c);
    ornament([0, .96, .35], 2.2); return;
  }
  if ((male ? [4, 9, 10] : [3, 8, 10]).includes(i)) {
    if (front) drawCap(rc, () => -.28, .025 + puff, c, { topLine: () => -.39, shine: false });
    ornament([0, .35, 1.02 + puff], 2.1, i === 8 ? 'star' : MOTIFS[i]);
    if (i === 10 || i === 4) for (const s of [-1, 1]) {
      const p = point([s * .96, .3, .1]); if ((p.z >= 0) === front) ribbon(ctx, p.x, p.y, male ? 13 : 22, c, s * .8);
    }
    return;
  }
  if (male && [1, 2, 8].includes(i) || !male && [4, 5, 11].includes(i)) {
    const high = i === 2 ? 1.38 : 1.18;
    const width = !male && i === 5 ? .85 : .38;
    shape([[-width, .8, .25], [-width * .8, high, .2], [0, high + .2, .25], [width * .8, high, .2], [width, .8, .25]], c);
    ornament([0, 1.1, .38], 2.6, male ? i === 8 ? 'lotus' : 'cloud' : i === 11 ? 'bamboo' : 'lotus');
    if (!male && i === 5) for (let j = -2; j <= 2; j++) {
      shape([[j * .25, .95, .3], [j * .4, 1.36 - Math.abs(j) * .07, .28], [j * .3 + .12, 1.03, .3]], c2);
    }
    return;
  }
  // Pins and butterfly clips are attached to the skull so they remain coherent in all directions.
  const sides = !male && i === 9 ? [-1, 1] : [i === 2 ? -1 : 1];
  for (const side of sides) {
    const q: Vec3 = [side * .75, .65, .45];
    shape([[side * .15, .85, .4], [side * 1.1, .5, .45], [side * 1.12, .57, .45], [side * .16, .92, .4]], c2);
    ornament(q, i === 9 ? 3 : 2.2, i === 9 ? 'leaf' : i === 1 ? 'plum' : 'lotus');
    if (!male && [1, 2, 6].includes(i)) {
      const p = point(q); if ((p.z >= 0) === front) {
        ribbon(ctx, p.x, p.y + 2, i === 2 ? 16 : 10, c2, side * .3);
        for (let j = 0; j < 3; j++) { circle(ctx, p.x + side * .5, p.y + 6 + j * 3, .55); fs(ctx, c2, null); }
      }
    }
  }
}
