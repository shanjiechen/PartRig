import type { Motif } from './ornaments';

export type Sleeve = 'none' | 'short' | 'long' | 'wide' | 'puff';
export type Collar = 'round' | 'v' | 'hood' | 'sailor' | 'cross' | 'high' | 'lapel' | 'square' | 'none';

export interface TopDef {
  id: string;
  name: string;
  color: string;
  color2: string;
  sleeveColor?: string;
  sleeve: Sleeve;
  collar: Collar;
  /** Hem height in torso units (0 = hip joints). */
  hem: number;
  skirt?: { len: number; flare: number };
  belt?: string;
  buttons?: number;
  zipper?: boolean;
  open?: boolean;
  stripes?: string;
  cape?: string;
  pauldron?: string;
  tie?: string;
  emblem?: 'star' | 'cross' | 'heart';
  armor?: boolean;
  pocket?: boolean;
  gloves?: string;
  embroidery?: Motif;
  sash?: string;
  adventure?: { strap: string; pouch?: boolean; edge: string; shoulder?: boolean };
}

export const TOPS: TopDef[] = [
  { id: 'tshirt', name: 'T恤', color: '#f4f2ee', color2: '#d9443f', sleeve: 'short', collar: 'round', hem: -0.8, emblem: 'star' },
  { id: 'longsleeve', name: '长袖衫', color: '#6fb8ee', color2: '#f4f2ee', sleeve: 'long', collar: 'round', hem: -0.8, stripes: '#f4f2ee' },
  { id: 'hoodie', name: '连帽衫', color: '#8d62c8', color2: '#f4f2ee', sleeve: 'long', collar: 'hood', hem: -1.8, pocket: true },
  { id: 'jacket', name: '夹克', color: '#2f4c8a', color2: '#f4f2ee', sleeve: 'long', collar: 'round', hem: -1.8, open: true },
  { id: 'tank', name: '背心', color: '#7cc464', color2: '#f4f2ee', sleeve: 'none', collar: 'square', hem: -0.8 },
  { id: 'sweater', name: '毛衣', color: '#f08c3a', color2: '#f6d25a', sleeve: 'long', collar: 'high', hem: -1.8, stripes: '#f6d25a' },
  { id: 'vest', name: '衬衫马甲', color: '#8b5a3c', color2: '#e0b040', sleeveColor: '#f4f2ee', sleeve: 'long', collar: 'v', hem: -1.2, buttons: 3 },
  {
    id: 'armor', name: '骑士铠甲', color: '#b8c2cc', color2: '#d9a53a', sleeveColor: '#8a929c', sleeve: 'long', collar: 'round',
    hem: -2, armor: true, pauldron: '#c9d2dc', belt: '#6b4430', emblem: 'cross', gloves: '#8a929c',
  },
  {
    id: 'robe', name: '法师长袍', color: '#3a4f9a', color2: '#f6d25a', sleeve: 'wide', collar: 'v', hem: 0,
    skirt: { len: 21, flare: 1.35 }, belt: '#f6d25a', emblem: 'star',
  },
  { id: 'kimono', name: '和服', color: '#f5a3c0', color2: '#8e2f3f', sleeve: 'wide', collar: 'cross', hem: 0, skirt: { len: 20, flare: 1.08 }, belt: '#8e2f3f' },
  { id: 'sailor', name: '水手服', color: '#f4f2ee', color2: '#2f4c8a', sleeve: 'short', collar: 'sailor', hem: -0.8, tie: '#d9443f' },
  { id: 'suit', name: '西装', color: '#3b3a44', color2: '#f4f2ee', sleeve: 'long', collar: 'lapel', hem: -2.2, tie: '#d9443f', buttons: 2 },
  { id: 'tunic', name: '束腰外衣', color: '#2f6b4b', color2: '#c9b083', sleeve: 'long', collar: 'v', hem: 0, skirt: { len: 7, flare: 1.25 }, belt: '#6b4430' },
  { id: 'cloak', name: '旅行斗篷', color: '#c9b083', color2: '#6b4430', sleeve: 'long', collar: 'round', hem: -1.5, cape: '#8e2f3f', belt: '#6b4430' },
  { id: 'dress', name: '连衣裙', color: '#f5a3c0', color2: '#ffffff', sleeve: 'puff', collar: 'square', hem: 0, skirt: { len: 10, flare: 1.55 }, belt: '#ffffff' },
];

export interface BottomDef {
  id: string;
  name: string;
  color: string;
  color2?: string;
  kind: 'pants' | 'skirt';
  /** -1..0: fraction of thigh covered (shorts); 0..1: full thigh plus this fraction of the shin. */
  cover: number;
  skirt?: { len: number; flare: number; pleats?: boolean; puff?: boolean; plaid?: boolean };
  stockings?: string;
  wide?: number;
  stripe?: string;
  cuff?: string;
  straps?: boolean;
  pockets?: boolean;
  embroidery?: Motif;
}

export const BOTTOMS: BottomDef[] = [
  { id: 'pants', name: '长裤', color: '#3b3a44', kind: 'pants', cover: 1 },
  { id: 'jeans', name: '牛仔裤', color: '#3f6fb0', color2: '#8fb4e6', kind: 'pants', cover: 0.92, cuff: '#8fb4e6' },
  { id: 'shorts', name: '短裤', color: '#c9b083', kind: 'pants', cover: -0.15 },
  { id: 'cargo', name: '工装短裤', color: '#6b7a4a', kind: 'pants', cover: 0.12, pockets: true, wide: 0.6 },
  { id: 'pleated', name: '百褶短裙', color: '#2f4c8a', kind: 'skirt', cover: -1, skirt: { len: 8, flare: 1.45, pleats: true } },
  { id: 'longskirt', name: '长裙', color: '#8d62c8', kind: 'skirt', cover: -1, skirt: { len: 19, flare: 1.3 } },
  { id: 'tutu', name: '蓬蓬裙', color: '#f5a3c0', kind: 'skirt', cover: -1, skirt: { len: 7, flare: 1.95, puff: true } },
  { id: 'bloomers', name: '灯笼裤', color: '#f08c3a', color2: '#f6d25a', kind: 'pants', cover: 0.7, wide: 2.4, cuff: '#f6d25a' },
  { id: 'leggings', name: '紧身裤', color: '#2b2a33', kind: 'pants', cover: 1, wide: -0.6 },
  { id: 'overalls', name: '背带裤', color: '#4f7fc0', color2: '#f6d25a', kind: 'pants', cover: 1, straps: true },
  { id: 'kilt', name: '格子裙', color: '#8e2f3f', color2: '#2f6b4b', kind: 'skirt', cover: -1, skirt: { len: 9, flare: 1.25, pleats: true, plaid: true } },
  { id: 'hakama', name: '袴', color: '#2f4c8a', kind: 'pants', cover: 1, wide: 3.2 },
  { id: 'track', name: '运动裤', color: '#2f6b4b', kind: 'pants', cover: 1, stripe: '#ffffff' },
  { id: 'tights', name: '短裙丝袜', color: '#3b3a44', kind: 'skirt', cover: -1, skirt: { len: 7, flare: 1.3 }, stockings: '#2a2230' },
  { id: 'capri', name: '七分裤', color: '#8fe0c8', kind: 'pants', cover: 0.45 },
];

export interface ShoeDef {
  id: string;
  name: string;
  color: string;
  sole: string;
  boot: number;
  toe?: 'curl' | 'point';
  fur?: string;
  heel?: boolean;
  bare?: boolean;
  strap?: string;
  laces?: string;
  metal?: boolean;
  wide?: number;
  embroidery?: Motif;
}

export const SHOES: ShoeDef[] = [
  { id: 'sneakers', name: '运动鞋', color: '#f4f2ee', sole: '#d9443f', boot: 0, laces: '#d9443f' },
  { id: 'leather', name: '皮鞋', color: '#5a3a2a', sole: '#2a1e1e', boot: 0 },
  { id: 'tallboots', name: '长靴', color: '#6b4430', sole: '#2a1e1e', boot: 0.8 },
  { id: 'ankleboots', name: '短靴', color: '#8b5a3c', sole: '#3a2a1e', boot: 0.3 },
  { id: 'sandals', name: '凉鞋', color: '#8b5a3c', sole: '#6b4430', boot: 0, bare: true, strap: '#8b5a3c' },
  { id: 'slippers', name: '毛绒拖鞋', color: '#f5a3c0', sole: '#f4f2ee', boot: 0, wide: 1.25, fur: '#ffffff' },
  { id: 'heels', name: '高跟鞋', color: '#d9443f', sole: '#2a1e1e', boot: 0, heel: true },
  { id: 'rainboots', name: '雨靴', color: '#f6d25a', sole: '#3b3a44', boot: 0.6 },
  { id: 'greaves', name: '骑士铁靴', color: '#b8c2cc', sole: '#5a5f68', boot: 0.9, metal: true },
  { id: 'wizard', name: '尖头鞋', color: '#8d62c8', sole: '#3b2a4a', boot: 0, toe: 'curl' },
  { id: 'cowboy', name: '牛仔靴', color: '#9a5b32', sole: '#3a2418', boot: 0.6, heel: true, toe: 'point' },
  { id: 'snow', name: '雪地靴', color: '#c9b083', sole: '#6b4430', boot: 0.5, fur: '#f4f2ee', wide: 1.2 },
  { id: 'geta', name: '木屐', color: '#c9955a', sole: '#8b5a3c', boot: 0, bare: true, strap: '#d9443f', heel: true },
  { id: 'cloth', name: '布鞋', color: '#2b2a33', sole: '#f4f2ee', boot: 0 },
  { id: 'bare', name: '光脚', color: '#000', sole: '#000', boot: 0, bare: true },
];
