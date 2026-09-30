import { bodyDims, bonePoint, solveRig, type BoneName, type Pose } from '../core/skeleton';
import type { Vec3 } from '../core/math';
import type { Appearance } from '../core/types';
import { resolveParts } from '../parts/index';
import { drawBackHair, drawHairTube } from '../parts/hair';
import { drawArm, drawCape, drawHood, drawLeg, drawNeck, drawSkirt, drawTorso } from './body';
import { hp, makeHeadView, projectWorld, withHead, type P2, type Palette, type RenderCtx } from './context';
import { drawHeadGroup } from './head';
import { drawEffects, WEAPONS, type Trail } from './props';

export interface DrawOptions {
  /** Canvas position of the ground point under the character (in current ctx units). */
  x: number;
  y: number;
  scale: number;
  yaw: number;
  time: number;
  /** Prop to use when the weapon slot is "auto". */
  prop?: string;
  shadow?: boolean;
  effects?: boolean;
  /** Samples the current animation at a time offset (used for motion trails). */
  poseAt?: (dt: number) => Pose;
}

let offscreen: HTMLCanvasElement | null = null;

export function drawCharacter(ctx: CanvasRenderingContext2D, app: Appearance, pose: Pose, o: DrawOptions) {
  const flash = o.effects === false ? 0 : pose.fx.flash ?? 0;
  if (flash < 0.02) return renderInto(ctx, app, pose, o);
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  offscreen ??= document.createElement('canvas');
  if (offscreen.width !== cw || offscreen.height !== ch) {
    offscreen.width = cw;
    offscreen.height = ch;
  }
  const octx = offscreen.getContext('2d')!;
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.clearRect(0, 0, cw, ch);
  octx.setTransform(ctx.getTransform());
  renderInto(octx, app, pose, o);
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.globalCompositeOperation = 'source-atop';
  octx.fillStyle = `rgba(255,70,70,${flash * 0.55})`;
  octx.fillRect(0, 0, cw, ch);
  octx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(offscreen, 0, 0);
  ctx.restore();
}

function renderInto(ctx: CanvasRenderingContext2D, app: Appearance, pose: Pose, o: DrawOptions) {
  const P = resolveParts(app);
  const dims = bodyDims(app.gender);
  const rig = solveRig(pose, dims, o.yaw);
  const head = makeHeadView(rig, dims, P.face.sx, P.face.sy);
  const pal: Palette = {
    skin: app.skin,
    hair: app.hairColor,
    eye: app.eyeColor,
    top: app.tints.top ?? P.top.color,
    bottom: app.tints.bottom ?? P.bottom.color,
    shoes: app.tints.shoes ?? P.shoes.color,
    headwear: app.tints.headwear ?? P.hat.color,
  };
  const weaponId = app.parts.weapon === 'auto' ? o.prop ?? 'none' : app.parts.weapon;
  const weapon = WEAPONS.find((w) => w.id === weaponId && w.draw);
  const rc: RenderCtx = {
    ctx, app, rig, dims, head, pal,
    yaw: o.yaw,
    time: o.time,
    fx: o.effects === false ? {} : pose.fx,
    prop: weaponId,
    bw: (b, l) => bonePoint(rig, b, l),
    bp: (b, l) => projectWorld(bonePoint(rig, b, l)),
  };
  const shoes = { ...P.shoes, color: pal.shoes };
  const wz = (b: BoneName, l: Vec3 = [0, 0, 0]) => rc.bw(b, l)[2];

  const prims: { z: number; draw: () => void }[] = [];
  for (const s of ['L', 'R'] as const) {
    const z = -4 + (0.3 * (wz(`thigh${s}`) + wz(`shin${s}`) + wz(`foot${s}`))) / 3;
    prims.push({ z, draw: () => drawLeg(rc, s, P.bottom, shoes) });
  }
  const bs = P.bottom.skirt;
  if (P.bottom.kind === 'skirt' && bs) {
    prims.push({
      z: wz('pelvis') - 1.6,
      draw: () => drawSkirt(rc, 1.5, bs.len, bs.flare, pal.bottom, { pleats: bs.pleats, puff: bs.puff, plaid: bs.plaid ? P.bottom.color2 : undefined }),
    });
  }
  const ts = P.top.skirt;
  if (ts) prims.push({ z: wz('pelvis') - 1.3, draw: () => drawSkirt(rc, 1.2, ts.len, ts.flare, pal.top, { trim: P.top.color2 }) });
  prims.push({ z: wz('chest', [0, 8, 0]), draw: () => drawTorso(rc, P.top, P.bottom) });
  prims.push({ z: wz('chest', [0, 15, 0]) - 0.4, draw: () => drawNeck(rc) });
  if (P.top.cape) prims.push({ z: wz('chest', [0, 6, -7]) - 0.5, draw: () => drawCape(rc, P.top.cape!) });
  if (P.top.collar === 'hood') prims.push({ z: wz('chest', [0, 16, -5]), draw: () => drawHood(rc, pal.top) });
  const HEAD_Z = head.z + 5;
  const headR = head.R * Math.max(head.sx, head.sy) * 1.05;
  /** Decide arm order vs. the big head by testing key points against the head sphere's front surface. */
  const vsHead = (pts: P2[], z: number) => {
    let front = 0, back = 0;
    for (const p of pts) {
      const d = Math.hypot(p.x - head.cx, p.y - head.cy);
      if (d >= headR) continue;
      if (p.z > head.z + Math.sqrt(headR * headR - d * d) * 0.5) front++;
      else back++;
    }
    if (front) return Math.max(z, HEAD_Z + 0.1);
    if (back) return Math.min(z, HEAD_Z - 0.1);
    return z;
  };
  for (const s of ['L', 'R'] as const) {
    const z = Math.max(wz(`foreArm${s}`), wz(`hand${s}`), wz(`hand${s}`, [0, -2, 0])) + 0.6;
    const held = weapon && weapon.hand === s ? weapon : undefined;
    const keyPts = [projectWorld(rig[`foreArm${s}`].pos), rc.bp(`hand${s}`, [0, -1.4, 0])];
    if (held?.tip) keyPts.push(rc.bp(`hand${s}`, held.tip));
    const wdraw = held ? () => held.draw!(rc, (v) => rc.bp(`hand${s}`, v)) : undefined;
    prims.push({ z: vsHead(keyPts, z), draw: () => drawArm(rc, s, P.top, wdraw) });
  }
  prims.push({ z: HEAD_Z, draw: () => drawHeadGroup(rc, { ...P }) });
  if (P.hair.back) {
    const z = head.z + hp(head, [0, -0.3, -0.7]).z - 0.5;
    prims.push({ z, draw: () => withHead(rc, () => drawBackHair(rc, P.hair, pal.hair)) });
  }
  for (const t of P.hair.tubes ?? []) {
    const z = head.z + t.pts.reduce((s, q) => s + hp(head, q).z, 0) / t.pts.length - 0.3;
    prims.push({ z, draw: () => withHead(rc, () => drawHairTube(rc, t, pal.hair)) });
  }
  prims.sort((a, b) => a.z - b.z);

  let trail: Trail | null = null;
  if (o.effects !== false && weapon?.tip && o.poseAt && ((pose.fx.slash ?? 0) > 0.05 || (pose.fx.thrust ?? 0) > 0.05)) {
    const hand = `hand${weapon.hand}` as BoneName;
    trail = { tips: [], bases: [] };
    for (let k = 0; k < 8; k++) {
      const r = solveRig(o.poseAt(-k * 0.02), dims, o.yaw);
      trail.tips.push(projectWorld(bonePoint(r, hand, weapon.tip)));
      trail.bases.push(projectWorld(bonePoint(r, hand, weapon.base ?? [0, -1.4, 3])));
    }
  }

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(o.scale, o.scale);
  if (o.shadow !== false) {
    const g = projectWorld([rig.root.pos[0], 0, rig.root.pos[2]]);
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, 12, 4.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40,20,50,0.18)';
    ctx.fill();
  }
  for (const p of prims) p.draw();
  if (o.effects !== false) drawEffects(rc, weapon, trail);
  ctx.restore();
}
