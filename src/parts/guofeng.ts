import type { Gender } from '../core/types';
import type { PartCatalog } from './catalog';
import { guofengFace } from './guofeng-face';
import { guofengHair, guofengHats } from './guofeng-head';
import { guofengClothing } from './guofeng-clothing';
import { guofengWeapons } from './guofeng-weapons';

export function guofengCatalog(gender: Gender): PartCatalog {
  return { ...guofengFace(gender), hair: guofengHair(gender), headwear: guofengHats(gender),
    ...guofengClothing(gender), ...guofengWeapons(gender) };
}
