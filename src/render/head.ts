import { ink, rgba, shade } from '../core/color';
import type { FaceDef } from '../parts/faces';
import { faceOutline } from '../parts/faces';
import { drawBrow, drawEye, type BrowDef, type EyeDef, type MouthDef, MOUTHS, type NoseDef } from '../parts/features';
import { drawBeardDetails, drawBeardRegion, drawEars, type BeardDef, type EarDef, type MarkDef } from '../parts/face-extras';
import { drawAhoge, drawBun, drawCap, drawTuft, stubbleColor, type HairDef } from '../parts/hair';
import type { HatDef } from '../parts/headwear';
import { decal, fs, hp, materialFill, OL, surf, withHead, type RenderCtx } from './context';

export interface HeadParts {
  face: FaceDef;
  ears: EarDef;
  brows: BrowDef;
  eyes: EyeDef;
  nose: NoseDef;
  mouth: MouthDef;
  beard: BeardDef;
  marks: MarkDef;
  hair: HairDef;
  hat: HatDef;
}

const EYE_A = 0.39, EYE_V = 0.26, BROW_V = -0.12, NOSE_V = 0.5, MOUTH_V = 0.7;
const OPEN_MOUTHS = ['open', 'laugh', 'grin', 'o'];

export function hairPuff(hair: HairDef) {
  return hair.cap?.puff ?? (hair.under ? 0.02 : 0);
}

export function drawHeadGroup(rc: RenderCtx, P: HeadParts) {
  const { ctx, head: h, pal, fx } = rc;
  const skin = pal.skin;
  const hairC = pal.hair;
  const puff = hairPuff(P.hair);
  const hat = P.hat;
  const hc = pal.headwear, hc2 = hat.color2;
  const hideTufts = !!hat.hideTufts;
  const tufts = (P.hair.tufts ?? []).filter((t) => !(hideTufts && t.v < -0.2));
  const tz = (a: number, v: number) => hp(h, surf(a, v)).z;
  const buns = P.hair.buns ?? [];
  const female = rc.app.gender === 'female';
  const st = {
    blink: (fx.dead ?? 0) > 0.5 || rc.time % 3.4 < 0.13,
    female,
    hurt: (fx.hurt ?? 0) > 0.5,
    joy: (fx.joy ?? 0) > 0.5,
  };
  const shout = (fx.shout ?? 0) > 0.5;

  withHead(rc, () => {
    // ---- behind the head ----
    for (const t of tufts) if (tz(t.a, t.v) < 0) drawTuft(rc, t, puff, hairC);
    for (const b of buns) if (!hideTufts && hp(h, b.at).z < 0) drawBun(rc, b, hairC);
    drawEars(rc, P.ears, 'back', !!hat.hideTopEars);
    hat.draw?.(rc, 'back', hc, hc2, puff);

    // ---- head base ----
    faceOutline(ctx, P.face, h);
    fs(ctx, materialFill(ctx, skin, 0, 0, h.R * 1.1, .65), ink(skin), OL);
    drawEars(rc, P.ears, 'mid', !!hat.hideTopEars);

    // ---- face ----
    if (Math.cos(h.yaw) > -0.5) {
      ctx.save();
      faceOutline(ctx, P.face, h);
      ctx.clip();
      for (const s of [1, -1]) {
        decal(rc, s * 0.6, 0.53, () => {
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.1, 1.65, 0, 0, Math.PI * 2);
          const blush = ctx.createRadialGradient(0, 0, .1, 0, 0, 3.1);
          blush.addColorStop(0, rgba('#ee8996', female ? .4 : .25));
          blush.addColorStop(1, rgba('#ee8996', 0));
          ctx.fillStyle = blush;
          ctx.fill();
        }, { min: 0.1 });
      }
      P.marks.draw?.(rc, skin);
      drawBeardRegion(rc, P.beard, P.face, shade(hairC, -0.1));
      for (const s of [1, -1]) {
        decal(rc, s * EYE_A, EYE_V, () => drawEye(ctx, P.eyes, pal.eye, st), { mirror: s, pow: 0.6, min: 0.02, minScale: 0.25 });
        decal(rc, s * EYE_A, BROW_V, () => drawBrow(ctx, P.brows, shade(hairC, -0.3), s, skin, shout), { mirror: s, pow: 0.6, min: 0.02 });
      }
      let mouth = P.mouth;
      if (st.hurt) mouth = MOUTHS.find((m) => m.id === 'o')!;
      else if ((shout || st.joy) && !OPEN_MOUTHS.includes(mouth.id)) mouth = MOUTHS.find((m) => m.id === 'open')!;
      decal(rc, 0, MOUTH_V, () => mouth.draw(ctx, female), { min: -0.25, minScale: 0.45 });
      ctx.restore();
      drawBeardDetails(rc, P.beard, shade(hairC, -0.1));
      P.beard.draw?.(rc, shade(hairC, -0.1));
      drawNose(rc, P.nose);
    }

    // ---- hair ----
    for (const t of tufts) if (!t.round && tz(t.a, t.v) >= 0) drawTuft(rc, t, puff, hairC);
    if (P.hair.under) drawCap(rc, P.hair.under, 0.02, stubbleColor(skin, hairC));
    if (P.hair.cap) drawCap(rc, P.hair.cap.line, P.hair.cap.puff, hairC, { shine: true });
    drawEars(rc, P.ears, 'over', !!hat.hideTopEars);
    for (const t of tufts) if (t.round && tz(t.a, t.v) >= 0) drawTuft(rc, t, puff, hairC);
    for (const b of buns) if (!hideTufts && hp(h, b.at).z >= 0) drawBun(rc, b, hairC);
    if (P.hair.ahoge && !hideTufts) drawAhoge(rc, hairC);
    drawEars(rc, P.ears, 'top', !!hat.hideTopEars);
    hat.draw?.(rc, 'front', hc, hc2, puff);
  });
}

function drawNose(rc: RenderCtx, n: NoseDef) {
  if (!n.draw) return;
  const { ctx, head: h } = rc;
  const f = Math.cos(h.yaw);
  if (f < -0.2) return;
  const p = hp(h, surf(0, NOSE_V, 1.02));
  ctx.save();
  ctx.translate(p.x, p.y);
  if (f > 0.55) {
    ctx.scale(f, 1);
    n.draw(ctx, rc.pal.skin);
  } else {
    const sz = n.size;
    ctx.scale(Math.sign(Math.sin(h.yaw)) || 1, 1);
    ctx.beginPath();
    ctx.moveTo(-0.4, -1.9 * sz);
    ctx.quadraticCurveTo(1.9 * sz, 0.4 * sz, -0.3, 1.0 * sz);
    fs(ctx, rc.pal.skin, ink(rc.pal.skin), 0.55);
  }
  ctx.restore();
}
