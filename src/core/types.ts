export type Gender = 'male' | 'female';
export type StyleId = 'chibi' | 'guofeng' | 'aistory';

export const SLOT_IDS = [
  'face', 'ears', 'brows', 'eyes', 'nose', 'mouth', 'beard', 'marks',
  'hair', 'headwear', 'top', 'bottom', 'shoes', 'weapon',
] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export type TintSlot = 'top' | 'bottom' | 'shoes' | 'headwear';

export interface Appearance {
  style: StyleId;
  gender: Gender;
  skin: string;
  hairColor: string;
  eyeColor: string;
  parts: Record<SlotId, string>;
  tints: Partial<Record<TintSlot, string>>;
}

export interface Direction {
  id: string;
  name: string;
  yaw: number;
}

/** Eight facing directions. yaw = 0 faces the viewer, +90° faces screen right. */
export const DIRECTIONS: Direction[] = [
  { id: 'S', name: '下', yaw: 0 },
  { id: 'SW', name: '左下', yaw: -Math.PI / 4 },
  { id: 'W', name: '左', yaw: -Math.PI / 2 },
  { id: 'NW', name: '左上', yaw: (-3 * Math.PI) / 4 },
  { id: 'N', name: '上', yaw: Math.PI },
  { id: 'NE', name: '右上', yaw: (3 * Math.PI) / 4 },
  { id: 'E', name: '右', yaw: Math.PI / 2 },
  { id: 'SE', name: '右下', yaw: Math.PI / 4 },
];
