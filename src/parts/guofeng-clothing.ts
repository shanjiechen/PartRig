import type { Gender } from '../core/types';
import type { TopDef, BottomDef, ShoeDef } from './clothing';
import { gfId } from './guofeng-face';
import { MOTIFS } from './ornaments';

const COLORS = [['#92b7ac', '#efe1bc'], ['#e3acb0', '#f8e8c8'], ['#587c94', '#d6ba76'], ['#ebe5d6', '#55857d'],
  ['#a75957', '#ebcd87'], ['#aaa0be', '#eee1c3'], ['#476f66', '#d2b16f'], ['#c5a16a', '#536e6d'],
  ['#709eaa', '#e8d7ac'], ['#313d50', '#ac965d'], ['#d6c3a1', '#996158'], ['#cda7bc', '#eddda9']];

export function guofengClothing(gender: Gender) {
  const male = gender === 'male';
  const id = (slot: string, i: number) => gfId(gender, slot, i);
  const maleTops: Partial<TopDef>[] = [
    { name: '青竹交领', sleeve: 'long', collar: 'cross', hem: -1, skirt: { len: 5, flare: 1.12 }, belt: '#546e61' },
    { name: '温玉直裾', sleeve: 'wide', collar: 'cross', hem: 0, skirt: { len: 15, flare: 1.08 }, belt: '#b89b68' },
    { name: '剑客劲装', sleeve: 'long', collar: 'high', hem: -2, belt: '#333f53', gloves: '#5c6470' },
    { name: '鹤羽道袍', sleeve: 'wide', collar: 'v', hem: 0, skirt: { len: 16, flare: 1.3 }, cape: '#d6ddd3' },
    { name: '赤焰战甲', sleeve: 'long', collar: 'high', hem: -2, armor: true, pauldron: '#c39c67', belt: '#695049' },
    { name: '星河大氅', sleeve: 'wide', collar: 'cross', hem: 0, skirt: { len: 7, flare: 1.22 }, cape: '#7e738d' },
    { name: '墨绿短打', sleeve: 'short', collar: 'v', hem: -2, belt: '#a79059' },
    { name: '沙金袈衣', sleeve: 'none', collar: 'cross', hem: 0, skirt: { len: 11, flare: 1.12 }, belt: '#756451' },
    { name: '云纹圆领袍', sleeve: 'long', collar: 'round', hem: 0, skirt: { len: 12, flare: 1.18 }, buttons: 3 },
    { name: '玄衣飞鱼服', sleeve: 'long', collar: 'high', hem: 0, skirt: { len: 7, flare: 1.2 }, belt: '#ac965d' },
    { name: '儒士褙子', sleeve: 'wide', collar: 'v', hem: -1, open: true, skirt: { len: 8, flare: 1.17 } },
    { name: '灵狐锦衣', sleeve: 'long', collar: 'cross', hem: 0, skirt: { len: 6, flare: 1.26 }, cape: '#ebdfd4' },
  ];
  const femaleTops: Partial<TopDef>[] = [
    { name: '青莲交领襦', sleeve: 'wide', collar: 'cross', hem: -.5, belt: '#648b7e' },
    { name: '桃花齐胸襦', sleeve: 'wide', collar: 'square', hem: 0, belt: '#b77082', tie: '#efe0b8' },
    { name: '侠女束袖衣', sleeve: 'long', collar: 'high', hem: -1, belt: '#c2a067' },
    { name: '白鹤羽衣', sleeve: 'wide', collar: 'v', hem: 0, cape: '#dce3d9', skirt: { len: 6, flare: 1.32 } },
    { name: '朱锦短袄', sleeve: 'long', collar: 'cross', hem: -2, buttons: 2, belt: '#dec089' },
    { name: '紫烟披帛', sleeve: 'wide', collar: 'square', hem: -.5, cape: '#c4b5ce' },
    { name: '碧竹褙子', sleeve: 'long', collar: 'v', hem: 0, open: true, skirt: { len: 5, flare: 1.1 } },
    { name: '金霞半臂', sleeve: 'short', collar: 'cross', hem: -1, belt: '#ac775d' },
    { name: '鲛绡云衫', sleeve: 'wide', collar: 'round', hem: 0, skirt: { len: 4, flare: 1.28 } },
    { name: '玄月劲装', sleeve: 'long', collar: 'high', hem: -2, gloves: '#4e596c', belt: '#ac965d' },
    { name: '杏花对襟', sleeve: 'long', collar: 'v', hem: -1, open: true, buttons: 4 },
    { name: '灵蝶仙襦', sleeve: 'puff', collar: 'square', hem: 0, cape: '#dcc2d4', belt: '#b58b9a' },
  ];
  const top: TopDef[] = (male ? maleTops : femaleTops).map((data, i) => ({
    id: id('top', i), name: data.name!, color: COLORS[i][0], color2: COLORS[i][1],
    sleeve: 'long', collar: 'cross', hem: 0, ...data, embroidery: MOTIFS[i], sash: i % 3 === 0 ? COLORS[i][1] : undefined,
  }));
  const bottomNames = (male ? '青竹长裤 玉白宽裳 剑客绑腿 鹤羽长裳 赤甲战裤 星河阔裤 墨绿短裤 沙金僧裤 云纹灯笼裤 玄衣束裤 儒士长裳 灵狐锦裤' : '青莲百褶裙 桃花齐胸裙 侠女束腿裤 白鹤留仙裙 朱锦马面裙 紫烟月华裙 碧竹长裙 金霞短裙 鲛绡灯笼裤 玄月劲裤 杏花褶裙 灵蝶蓬裙').split(' ');
  const lengths = [16, 20, 9, 18, 17, 19, 15, 9, 11, 10, 18, 12];
  const bottom: BottomDef[] = bottomNames.map((name, i) => {
    const skirt = male ? [1, 3, 10].includes(i) : ![2, 8, 9].includes(i);
    return { id: id('bottom', i), name, color: COLORS[(i + 2) % 12][0], color2: COLORS[i][1], kind: skirt ? 'skirt' : 'pants',
      cover: skirt ? -1 : i === 6 && male ? -.2 : i === 8 ? .6 : 1,
      wide: [1.2, 2.8, -.5, 2.4, .8, 3.1, .6, 2.2, 2.8, -.3, 1.8, 1.2][i],
      skirt: skirt ? { len: lengths[i], flare: [1.3, 1.42, 1.1, 1.65, 1.2, 1.5, 1.25, 1.35, 1.2, 1.25, 1.42, 1.75][i], pleats: i !== 3 && i !== 6, puff: i === 11 } : undefined,
      cuff: skirt ? undefined : COLORS[i][1], stripe: i === 2 || i === 9 ? COLORS[i][1] : undefined, embroidery: MOTIFS[(i + 3) % 12] };
  });
  const shoeNames = (male ? '青竹布履 白玉云履 剑客短靴 鹤纹翘履 赤甲铁靴 星河长靴 墨绿绑履 沙金草履 云纹软靴 玄色快靴 儒士方履 灵狐绒靴' : '青莲绣鞋 桃花弓鞋 侠女短靴 白鹤云履 朱锦翘鞋 紫烟长靴 碧竹布鞋 金霞木屐 鲛绡软靴 玄月快靴 杏花绣履 灵蝶绒鞋').split(' ');
  const shoes: ShoeDef[] = shoeNames.map((name, i) => ({ id: id('shoes', i), name, color: COLORS[i][0], sole: i === 7 ? '#896948' : '#ded4bf',
    boot: [0, 0, .35, .1, .72, .82, .15, 0, .38, .6, 0, .48][i],
    toe: i === 3 || i === 4 ? 'curl' : i === 1 || i === 10 ? 'point' : undefined,
    wide: male ? 1.04 : .9, heel: i === 7, bare: i === 7,
    strap: i === 7 ? COLORS[i][0] : undefined, laces: i === 2 || i === 6 ? COLORS[i][1] : undefined,
    fur: i === 11 ? '#f1e4d6' : undefined, metal: i === 4 && male, embroidery: MOTIFS[i] }));
  return { top, bottom, shoes };
}
