import type { Gender } from '../core/types';
import type { TopDef, BottomDef, ShoeDef } from './clothing';

const PALETTE = [ ['#486b4d','#eee4cd'], ['#667b58','#e4d4af'], ['#485967','#d6c4a1'], ['#80634e','#e9ddc2'],
  ['#684d59','#d8bfa6'], ['#607c75','#e6e0c9'], ['#ad9164','#3f5750'], ['#4b445f','#c1b08e'],
  ['#53633b','#cbbb84'], ['#3d494e','#c6af7c'], ['#998e78','#ece4d2'], ['#796b63','#ddc8a6'] ];

export function aistoryClothing(gender: Gender) {
  const female = gender === 'female';
  const tops: Partial<TopDef>[] = [
    { name: '森林旅人短袍', sleeve: 'short', collar: 'cross', hem: 0, skirt: { len: 6.5, flare: 1.18 }, belt: '#775439' },
    { name: '游侠束袖衣', sleeve: 'long', collar: 'v', hem: -1, belt: '#604632', gloves: '#765c43' },
    { name: '守卫肩甲', sleeve: 'long', collar: 'high', hem: -1.8, armor: true, pauldron: '#a69c7a', belt: '#644632' },
    { name: '斥候皮马甲', sleeve: 'none', collar: 'v', hem: -1, open: true, buttons: 3, belt: '#604532' },
    { name: '佣兵短斗篷', sleeve: 'long', collar: 'high', hem: 0, cape: '#503d42', skirt: { len: 5, flare: 1.2 }, belt: '#5c3d2e' },
    { name: '药师交领袍', sleeve: 'wide', collar: 'cross', hem: 0, skirt: { len: 12, flare: 1.12 }, belt: '#6e614b' },
    { name: '吟游诗人上衣', sleeve: 'puff', collar: 'square', hem: -.8, tie: '#6b4541', buttons: 2 },
    { name: '秘术师外袍', sleeve: 'wide', collar: 'v', hem: 0, skirt: { len: 16, flare: 1.24 }, belt: '#b49a61', emblem: 'star' },
    { name: '林地猎手衣', sleeve: 'short', collar: 'round', hem: -1.5, gloves: '#785a39', pocket: true, belt: '#5b422f' },
    { name: '远征骑士服', sleeve: 'long', collar: 'high', hem: -2, armor: true, pauldron: '#b2b8b1', gloves: '#787e78', belt: '#78603e' },
    { name: '雪原旅行装', sleeve: 'long', collar: 'hood', hem: -2, cape: '#bdb2a0', belt: '#745c42' },
    { name: female ? '冒险者束腰裙' : '冒险者长外衣', sleeve: female ? 'puff' : 'long', collar: 'lapel', hem: 0,
      skirt: { len: female ? 10 : 8, flare: female ? 1.3 : 1.13 }, belt: '#785039' },
  ];
  const top: TopDef[] = tops.map((part, i) => ({ sleeve: 'short', collar: 'cross', hem: 0, ...part,
    id: `ai-${gender[0]}-top-${i}`, name: part.name!, color: PALETTE[i][0], color2: PALETTE[i][1],
    adventure: { strap: i===9 ? '#796448' : '#79563d', edge: PALETTE[i][1], pouch: i!==7, shoulder: i===0 || i===1 } }));
  const bottom: BottomDef[] = [
    { name: '米白旅人裤', kind: 'pants', cover: .25, color: '#d9d0b8', cuff: '#b2aa90', wide: .65 },
    { name: '游侠绑腿', kind: 'pants', cover: 1, color: '#4f5d44', stripe: '#9c9e78' },
    { name: '斥候短裤', kind: 'pants', cover: -.1, color: '#655743', pockets: true, wide: .7 },
    { name: '长途工装裤', kind: 'pants', cover: .8, color: '#705e46', pockets: true, cuff: '#ac9975' },
    { name: '药师宽裤', kind: 'pants', cover: .7, color: '#a29a7e', wide: 2.0, cuff: '#6f765b' },
    { name: '守卫护腿裤', kind: 'pants', cover: 1, color: '#465661', stripe: '#a29c80', wide: .4 },
    { name: '流浪者灯笼裤', kind: 'pants', cover: .55, color: '#9c8a61', wide: 2.5, cuff: '#68543b' },
    { name: '秘术师下摆', kind: 'skirt', cover: -1, color: '#4c445d', skirt: { len: 16, flare: 1.16 }, stockings: '#55515a' },
    { name: female ? '林地百褶裙' : '森林战裙', kind: 'skirt', cover: -1, color: '#60734c', skirt: { len: 8, flare: 1.27, pleats: true } },
    { name: '骑士紧身裤', kind: 'pants', cover: 1, color: '#393f41', wide: -.3 },
    { name: '雪原绒裤', kind: 'pants', cover: 1, color: '#b5aa90', wide: 1.2, cuff: '#e4dbca' },
    { name: female ? '旅人分片裙' : '旅人护裆裙', kind: 'skirt', cover: -1, color: '#826d54', skirt: { len: 9, flare: 1.13, pleats: true }, stockings: '#bfb597' },
  ].map((part, i) => ({ ...part, id: `ai-${gender[0]}-bottom-${i}` } as BottomDef));
  const boots: Partial<ShoeDef>[] = [
    { name: '旅人皮靴', boot: .5 }, { name: '游侠长靴', boot: .8, laces: '#b8a47b' }, { name: '斥候软靴', boot: .25 },
    { name: '探路绑带靴', boot: .6, laces: '#c6b086' }, { name: '药师布履', boot: 0 }, { name: '守卫铁靴', boot: .8, metal: true },
    { name: '吟游尖头靴', boot: .4, toe: 'point' }, { name: '秘术师卷靴', boot: .2, toe: 'curl' },
    { name: '猎手皮靴', boot: .55, fur: '#b2a27b' }, { name: '远征铁胫', boot: .95, metal: true },
    { name: '雪原毛靴', boot: .7, fur: '#e3dbc8', wide: 1.12 }, { name: '轻装系带鞋', boot: 0, laces: '#b4a387' },
  ];
  const shoes: ShoeDef[] = boots.map((part, i) => ({ ...part, id: `ai-${gender[0]}-shoes-${i}`, name: part.name!,
    color: ['#604536','#69513b','#514539','#7b654c','#545d4e','#939d98','#746043','#584d62','#5b5038','#89938f','#9f947c','#756148'][i], sole: '#352c28', boot: part.boot ?? .4 }));
  return { top, bottom, shoes };
}
