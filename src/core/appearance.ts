import { defaultAppearance, slotsFor } from '../parts/index';
import { STYLES } from '../parts/catalog';
import type { Appearance, TintSlot } from './types';

const HEX = /^#[0-9a-f]{6}$/i;
const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};

export function sanitizeAppearance(raw: unknown): Appearance | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = record(raw);
  const style = STYLES.find((s) => s.id === r.style)?.id ?? 'chibi';
  const base = defaultAppearance(style, r.gender === 'male' ? 'male' : 'female');
  const color = (v: unknown, d: string) => typeof v === 'string' && HEX.test(v) ? v : d;
  base.skin = color(r.skin, base.skin);
  base.hairColor = color(r.hairColor, base.hairColor);
  base.eyeColor = color(r.eyeColor, base.eyeColor);
  const parts = record(r.parts);
  for (const slot of slotsFor(base)) {
    const v = parts[slot.id];
    if (typeof v === 'string' && slot.items.some((p) => p.id === v)) base.parts[slot.id] = v;
  }
  const tints = record(r.tints);
  for (const k of ['top', 'bottom', 'shoes', 'headwear'] as TintSlot[]) {
    if (typeof tints[k] === 'string' && HEX.test(tints[k])) base.tints[k] = tints[k];
  }
  return base;
}
