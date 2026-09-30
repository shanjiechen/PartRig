import type { Gender, StyleId } from '../core/types';
import { TOPS, BOTTOMS, SHOES, type TopDef, type BottomDef, type ShoeDef } from './clothing';
import { FACES, type FaceDef } from './faces';
import { EARS, BEARDS, MARKS, type EarDef, type BeardDef, type MarkDef } from './face-extras';
import { BROWS, EYES, NOSES, MOUTHS, type BrowDef, type EyeDef, type NoseDef, type MouthDef } from './features';
import { HAIRS, type HairDef } from './hair';
import { HATS, type HatDef } from './headwear';
import { WEAPONS, type WeaponDef } from '../render/props';

export interface PartCatalog {
  face: FaceDef[]; ears: EarDef[]; brows: BrowDef[]; eyes: EyeDef[];
  nose: NoseDef[]; mouth: MouthDef[]; beard: BeardDef[]; marks: MarkDef[];
  hair: HairDef[]; headwear: HatDef[]; top: TopDef[]; bottom: BottomDef[];
  shoes: ShoeDef[]; weapon: WeaponDef[]; autoProps: Record<string, string>;
}

export const STYLES: { id: StyleId; name: string; description: string }[] = [
  { id: 'chibi', name: 'chibi', description: '经典 Q 版 · 现代与奇幻装扮' },
];

function chibiCatalog(gender: Gender): PartCatalog {
  const male = gender === 'male';
  return {
    face: FACES.map((f) => male ? { ...f, jaw: f.jaw * 1.07, cheek: f.cheek * 0.8 } : { ...f }),
    ears: EARS.map((e) => ({ ...e, draw: (ctx, fill, inner, front) => {
      ctx.save(); ctx.scale(male ? 1.06 : 0.95, male ? 1.04 : 0.97);
      e.draw(ctx, fill, inner, front); ctx.restore();
    } })),
    brows: BROWS.map((b) => male ? { ...b, t: (b.t ?? 1) * 1.2, w: (b.w ?? 2.8) * 1.04 } : { ...b }),
    eyes: EYES.map((e) => male ? { ...e, h: (e.h ?? 4) * 0.88, lash: false } : { ...e }),
    nose: NOSES.map((n) => male && n.draw ? { ...n, size: n.size * 1.1, draw: (ctx, skin) => {
      ctx.save(); ctx.scale(1.1, 1.1); n.draw!(ctx, skin); ctx.restore();
    } } : { ...n }),
    mouth: MOUTHS.map((m) => ({ ...m, draw: (ctx, female) => {
      ctx.save(); ctx.scale(male ? 1.1 : 1, 1); m.draw(ctx, female); ctx.restore();
    } })),
    beard: male ? BEARDS : [BEARDS[0]], marks: MARKS,
    hair: HAIRS.filter((h) => male ? !['twintail', 'twinbun', 'hime'].includes(h.id) : !['pompadour', 'mohawk'].includes(h.id)),
    headwear: HATS,
    top: TOPS.filter((t) => !male || !['dress', 'sailor'].includes(t.id)),
    bottom: BOTTOMS.filter((b) => !male || b.kind === 'pants' || b.id === 'kilt'),
    shoes: SHOES.filter((s) => !male || s.id !== 'heels'), weapon: WEAPONS, autoProps: {},
  };
}

const CHIBI = { male: chibiCatalog('male'), female: chibiCatalog('female') };
export function getCatalog(_style: StyleId, gender: Gender): PartCatalog {
  return CHIBI[gender];
}
