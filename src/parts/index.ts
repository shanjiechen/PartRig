import type { Appearance, Gender, SlotId, StyleId, TintSlot } from '../core/types';
import { getCatalog } from './catalog';
import { CLOTH_TINTS, EYE_COLORS, HAIR_COLORS, SKIN_TONES } from './palettes';

export type Focus = 'face' | 'head' | 'body' | 'legs';
export interface SlotInfo {
  id: SlotId;
  name: string;
  focus: Focus;
  tint?: TintSlot;
}
export const SLOTS: SlotInfo[] = [
  { id: 'face', name: '脸型', focus: 'head' },
  { id: 'ears', name: '耳朵', focus: 'head' },
  { id: 'brows', name: '眉毛', focus: 'face' },
  { id: 'eyes', name: '眼睛', focus: 'face' },
  { id: 'nose', name: '鼻子', focus: 'face' },
  { id: 'mouth', name: '嘴巴', focus: 'face' },
  { id: 'beard', name: '胡子', focus: 'head' },
  { id: 'marks', name: '面部特征', focus: 'face' },
  { id: 'hair', name: '发型', focus: 'head' },
  { id: 'headwear', name: '头饰', focus: 'head', tint: 'headwear' },
  { id: 'top', name: '上装', focus: 'body', tint: 'top' },
  { id: 'bottom', name: '下装', focus: 'body', tint: 'bottom' },
  { id: 'shoes', name: '鞋靴', focus: 'legs', tint: 'shoes' },
  { id: 'weapon', name: '手持物', focus: 'body' },
];

export function slotsFor(app: Appearance) {
  const c = getCatalog(app.style, app.gender);
  return SLOTS.map((slot) => ({ ...slot, name: slot.id === 'beard' && app.style !== 'chibi' && app.gender === 'female' ? '面饰' : slot.name, items: c[slot.id] }));
}

const find = <T extends { id: string }>(list: T[], id: string) => list.find((i) => i.id === id) ?? list[0];
export function resolveParts(app: Appearance) {
  const c = getCatalog(app.style, app.gender);
  return {
    face: find(c.face, app.parts.face), ears: find(c.ears, app.parts.ears),
    brows: find(c.brows, app.parts.brows), eyes: find(c.eyes, app.parts.eyes),
    nose: find(c.nose, app.parts.nose), mouth: find(c.mouth, app.parts.mouth),
    beard: find(c.beard, app.parts.beard), marks: find(c.marks, app.parts.marks),
    hair: find(c.hair, app.parts.hair), hat: find(c.headwear, app.parts.headwear),
    top: find(c.top, app.parts.top), bottom: find(c.bottom, app.parts.bottom), shoes: find(c.shoes, app.parts.shoes),
  };
}
export type ResolvedParts = ReturnType<typeof resolveParts>;

export function resolveWeapon(app: Appearance, prop?: string) {
  const c = getCatalog(app.style, app.gender);
  const id = app.parts.weapon === 'auto' ? c.autoProps[prop ?? 'none'] ?? prop ?? 'none' : app.parts.weapon;
  return c.weapon.find((w) => w.id === id && w.draw);
}

export function defaultAppearance(style: StyleId = 'chibi', gender: Gender = 'female'): Appearance {
  const parts: Appearance['parts'] = {
    face: 'round', ears: 'human', brows: 'natural', eyes: 'big', nose: 'dot', mouth: 'smile',
    beard: 'none', marks: 'none', hair: gender === 'male' ? 'short' : 'twintail',
    headwear: gender === 'male' ? 'none' : 'bow', top: gender === 'male' ? 'tunic' : 'sailor',
    bottom: gender === 'male' ? 'pants' : 'pleated', shoes: 'leather', weapon: 'auto',
  };
  const c = getCatalog(style, gender);
  for (const slot of SLOTS) if (!c[slot.id].some((p) => p.id === parts[slot.id])) parts[slot.id] = c[slot.id][0].id;
  if (style === 'guofeng') parts.headwear = c.headwear[1].id;
  if (style === 'aistory') {
    parts.eyes = `ai-${gender[0]}-eyes-big`;
    parts.nose = `ai-${gender[0]}-nose-dot`;
    parts.mouth = `ai-${gender[0]}-mouth-small`;
    return { style, gender, skin: '#eac9a8', hairColor: '#29272b', eyeColor: '#69533c', parts, tints: {} };
  }
  return { style, gender, skin: SKIN_TONES[1].color,
    hairColor: style === 'guofeng' || gender === 'male' ? HAIR_COLORS[0].color : HAIR_COLORS[10].color,
    eyeColor: EYE_COLORS[style === 'guofeng' ? 0 : 2].color, parts, tints: {} };
}

export function changeAppearance(app: Appearance, style: StyleId, gender: Gender): Appearance {
  const base = defaultAppearance(style, gender);
  const next = { ...app, style, gender, parts: { ...base.parts }, tints: style === app.style ? { ...app.tints } : {} };
  if (style === app.style) {
    for (const slot of slotsFor(next)) {
      if (slot.items.some((p) => p.id === app.parts[slot.id])) next.parts[slot.id] = app.parts[slot.id];
    }
  } else {
    next.hairColor = base.hairColor;
    next.eyeColor = base.eyeColor;
  }
  return next;
}

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
export function randomAppearance(style: StyleId = 'chibi', gender: Gender = 'female'): Appearance {
  const app = defaultAppearance(style, gender);
  app.skin = pick(SKIN_TONES.slice(0, 8)).color;
  app.hairColor = pick(HAIR_COLORS).color;
  app.eyeColor = pick(EYE_COLORS).color;
  for (const slot of slotsFor(app)) if (slot.id !== 'weapon') app.parts[slot.id] = pick<{ id: string }>(slot.items).id;
  if (Math.random() < 0.5) app.parts.beard = getCatalog(style, gender).beard[0].id;
  app.tints = Math.random() < 0.5 ? { top: pick(CLOTH_TINTS).color } : {};
  return app;
}
