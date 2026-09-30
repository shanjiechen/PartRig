import type { Appearance, SlotId, TintSlot } from '../core/types';
import { BOTTOMS, SHOES, TOPS } from './clothing';
import { BEARDS, EARS, MARKS } from './face-extras';
import { FACES } from './faces';
import { BROWS, EYES, MOUTHS, NOSES } from './features';
import { HAIRS } from './hair';
import { HATS } from './headwear';
import { CLOTH_TINTS, EYE_COLORS, HAIR_COLORS, SKIN_TONES } from './palettes';
import { WEAPONS } from '../render/props';

export type Focus = 'face' | 'head' | 'body' | 'legs';

export interface SlotInfo {
  id: SlotId;
  name: string;
  items: { id: string; name: string }[];
  focus: Focus;
  tint?: TintSlot;
}

export const SLOTS: SlotInfo[] = [
  { id: 'face', name: '脸型', items: FACES, focus: 'head' },
  { id: 'ears', name: '耳朵', items: EARS, focus: 'head' },
  { id: 'brows', name: '眉毛', items: BROWS, focus: 'face' },
  { id: 'eyes', name: '眼睛', items: EYES, focus: 'face' },
  { id: 'nose', name: '鼻子', items: NOSES, focus: 'face' },
  { id: 'mouth', name: '嘴巴', items: MOUTHS, focus: 'face' },
  { id: 'beard', name: '胡子', items: BEARDS, focus: 'head' },
  { id: 'marks', name: '面部特征', items: MARKS, focus: 'face' },
  { id: 'hair', name: '发型', items: HAIRS, focus: 'head' },
  { id: 'headwear', name: '头饰', items: HATS, focus: 'head', tint: 'headwear' },
  { id: 'top', name: '上装', items: TOPS, focus: 'body', tint: 'top' },
  { id: 'bottom', name: '下装', items: BOTTOMS, focus: 'body', tint: 'bottom' },
  { id: 'shoes', name: '鞋靴', items: SHOES, focus: 'legs', tint: 'shoes' },
  { id: 'weapon', name: '手持物', items: WEAPONS, focus: 'body' },
];

const find = <T extends { id: string }>(list: T[], id: string) => list.find((i) => i.id === id) ?? list[0];

export function resolveParts(app: Appearance) {
  return {
    face: find(FACES, app.parts.face),
    ears: find(EARS, app.parts.ears),
    brows: find(BROWS, app.parts.brows),
    eyes: find(EYES, app.parts.eyes),
    nose: find(NOSES, app.parts.nose),
    mouth: find(MOUTHS, app.parts.mouth),
    beard: find(BEARDS, app.parts.beard),
    marks: find(MARKS, app.parts.marks),
    hair: find(HAIRS, app.parts.hair),
    hat: find(HATS, app.parts.headwear),
    top: find(TOPS, app.parts.top),
    bottom: find(BOTTOMS, app.parts.bottom),
    shoes: find(SHOES, app.parts.shoes),
  };
}
export type ResolvedParts = ReturnType<typeof resolveParts>;

export function defaultAppearance(): Appearance {
  return {
    gender: 'female',
    skin: SKIN_TONES[1].color,
    hairColor: HAIR_COLORS[10].color,
    eyeColor: EYE_COLORS[2].color,
    parts: {
      face: 'round', ears: 'human', brows: 'natural', eyes: 'big', nose: 'dot', mouth: 'smile',
      beard: 'none', marks: 'none', hair: 'twintail', headwear: 'bow', top: 'sailor', bottom: 'pleated',
      shoes: 'leather', weapon: 'auto',
    },
    tints: {},
  };
}

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function randomAppearance(): Appearance {
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  const app = defaultAppearance();
  app.gender = gender;
  app.skin = pick(Math.random() < 0.8 ? SKIN_TONES.slice(0, 8) : SKIN_TONES).color;
  app.hairColor = pick(HAIR_COLORS).color;
  app.eyeColor = pick(EYE_COLORS).color;
  for (const s of SLOTS) {
    if (s.id === 'weapon') continue;
    app.parts[s.id] = pick(s.items).id;
  }
  if (gender === 'female' || Math.random() < 0.5) app.parts.beard = 'none';
  if (Math.random() < 0.5) app.parts.marks = 'none';
  if (Math.random() < 0.4) app.parts.headwear = 'none';
  if (app.parts.hair === 'bald' && Math.random() < 0.7) app.parts.hair = pick(HAIRS.slice(2)).id;
  app.tints = Math.random() < 0.5 ? { top: pick(CLOTH_TINTS).color } : {};
  return app;
}
