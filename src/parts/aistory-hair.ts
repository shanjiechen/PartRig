import type { Gender } from '../core/types';
import type { Vec3 } from '../core/math';
import type { HairDef, HairLock, HairTube } from './hair';

const LOCKS: HairLock[] = [
  { pts: [[-.18,.91,.55],[-.62,.83,.8],[-.88,.25,.94],[-.72,-.23,1.02],[-.49,.19,1.05],[-.08,.58,.95],[.13,.85,.63]], tone: .025 },
  { pts: [[.02,.86,.69],[-.26,.56,1.01],[-.35,.14,1.04],[-.3,-.07,1.06],[-.04,.21,1.09],[.32,.6,.94],[.3,.83,.69]], tone: -.04 },
  { pts: [[.22,.93,.5],[.61,.7,.86],[.98,.17,.8],[.83,-.33,.8],[.61,.06,.98],[.3,.5,.99],[.02,.81,.69]], tone: .05 },
  { pts: [[-.72,.57,.46],[-.97,.33,.36],[-1.08,-.18,.23],[-.99,-.62,.21],[-.84,-.34,.46],[-.73,.12,.7],[-.6,.43,.65]], tone: -.08 },
  { pts: [[.74,.6,.34],[1.02,.27,.26],[1.07,-.17,.22],[.96,-.59,.2],[.81,-.28,.49],[.7,.08,.7],[.57,.46,.67]], tone: -.06 },
];

function pony(x: number, high: number, length: number, width = .6, braid = false): HairTube {
  return { pts: [[x,high,-.6],[x-.15,high+.15,-1.1],[x-.35,high-.25,-1.25],[x-.3,-.65,-1.2],[x-.12,-length,-.86]],
    w: [width*.55,width,width*.9,width*.6,.04], tie: true, braid };
}

export function aistoryHair(gender: Gender): HairDef[] {
  const female = gender === 'female';
  const names = (female ? '旅人高马尾 游侠碎短发 低束马尾 灵巧双尾 侧编长辫 侧分披发 俏丽短波波 云卷丸子 轻羽短发 柔顺长发 双编战辫 逆风束发'
    : '旅人高马尾 游侠碎短发 低束剑尾 半束双鬓 长编战辫 侧分披发 利落短发 武者发髻 飞扬碎发 浪人长发 半束编发 逆风束发').split(' ');
  return names.map((name, i) => {
    const side = [ .34,.28,.4,.5,.4,.72,.84,.4,.3,.8,.5,.34 ][i];
    const h: HairDef = {
      id: `ai-${gender[0]}-hair-${i}`, name,
      cap: { puff: .11, line: a => {
        const x = Math.abs(a);
        const edge = x < Math.PI/2 ? -.42 + (side+.42)*Math.pow(Math.sin(x), 1.8) : side + (.52-side)*Math.sin(x-Math.PI/2);
        return edge + (x > 1.15 ? .045*Math.cos(a*9) : 0);
      } },
      locks: LOCKS.map((lock, j) => ({ tone: lock.tone, pts: lock.pts.map(([x,y,z]) => [
        i === 5 || i === 9 ? -x : x,
        y + (i === 1 || i === 8 ? .12 : i === 6 ? -.06 : 0) + (j === 1 ? i%3*.035 : 0), z,
      ] as Vec3) as HairLock['pts'] })),
    };
    switch (i) {
      case 0: h.tubes = [pony(0, 1, female ? 1.25 : 1.05)]; break;
      case 1: h.tufts = [-1,1].map(s => ({ a: s*2.1, v: -.1, len: .24, w: .32, lean: .13 })); break;
      case 2: h.tubes = [pony(0, .25, 1.35, .48)]; break;
      case 3: h.tubes = [-1,1].map(s => pony(s*.74, female ? .55 : .25, female ? 1.4 : .8, .42)); break;
      case 4: h.tubes = [pony(-.55, .22, 1.45, .44, true)]; break;
      case 5: h.back = { len: .95, w: .85, wave: .07, cut: 'point' }; break;
      case 6: break;
      case 7: h.buns = [{ at: [0,1.04,-.45], r: .32 }]; break;
      case 8: h.tufts = [-1,1].map(s => ({ a: s*1.9, v: -.65, len: .3, w: .46, lean: .28 })); break;
      case 9: h.back = { len: 1.45, w: .8, cut: 'round' }; break;
      case 10: h.tubes = [-1,1].map(s => pony(s*.7,.1,1.5,.33,true)); break;
      case 11: h.tubes = [pony(.3,1.1,.8,.72)]; h.ahoge = true; break;
    }
    return h;
  });
}
