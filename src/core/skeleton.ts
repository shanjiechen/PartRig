import { addV, euler, mulM, mulV, rotY, type Mat3, type Vec3 } from './math';
import type { Gender } from './types';

export const BONE_NAMES = [
  'root', 'pelvis', 'chest', 'head',
  'upperArmL', 'foreArmL', 'handL',
  'upperArmR', 'foreArmR', 'handR',
  'thighL', 'shinL', 'footL',
  'thighR', 'shinR', 'footR',
] as const;
export type BoneName = (typeof BONE_NAMES)[number];

export interface BodyDims {
  legLen: number;
  thigh: number;
  shin: number;
  hipX: number;
  torso: number;
  shoulderY: number;
  shoulderX: number;
  upperArm: number;
  foreArm: number;
  headR: number;
  hipW: number;
  waistW: number;
  chestW: number;
  shoulderW: number;
  /** Clothed anterior chest volume, independent of the back and shoulder width. */
  bust: number;
}

export function bodyDims(gender: Gender): BodyDims {
  const male = gender === 'male';
  const shoulderW = male ? 8.6 : 7.7;
  return {
    legLen: 26,
    thigh: 11,
    shin: 10.2,
    hipX: male ? 3.5 : 3.7,
    torso: 17,
    shoulderY: 13.4,
    shoulderX: shoulderW - 1.7,
    upperArm: 7.6,
    foreArm: 7,
    headR: 19.5,
    hipW: male ? 7.0 : 7.5,
    waistW: male ? 6.8 : 5.8,
    chestW: male ? 7.6 : 8.3,
    shoulderW,
    bust: male ? 0 : 3.1,
  };
}

interface BoneDef {
  parent: BoneName | null;
  offset: (d: BodyDims) => Vec3;
  /** Per-axis sign so keyframes can be authored with mirrored semantics. */
  sign: Vec3;
  rest: Vec3;
}

const L = 1, R = -1;
const DEFS: Record<BoneName, BoneDef> = {
  root: { parent: null, offset: () => [0, 0, 0], sign: [1, 1, 1], rest: [0, 0, 0] },
  pelvis: { parent: 'root', offset: (d) => [0, d.legLen, 0], sign: [1, 1, 1], rest: [0, 0, 0] },
  chest: { parent: 'pelvis', offset: () => [0, 1, 0], sign: [1, 1, 1], rest: [0, 0, 0] },
  head: { parent: 'chest', offset: (d) => [0, d.torso, 0], sign: [1, 1, 1], rest: [0, 0, 0] },
  upperArmL: { parent: 'chest', offset: (d) => [d.shoulderX, d.shoulderY, 0], sign: [-1, L, L], rest: [0, 0, 0.12] },
  foreArmL: { parent: 'upperArmL', offset: (d) => [0, -d.upperArm, 0], sign: [-1, L, L], rest: [0.1, 0, 0] },
  handL: { parent: 'foreArmL', offset: (d) => [0, -d.foreArm, 0], sign: [-1, L, L], rest: [0, 0, 0] },
  upperArmR: { parent: 'chest', offset: (d) => [-d.shoulderX, d.shoulderY, 0], sign: [-1, R, R], rest: [0, 0, 0.12] },
  foreArmR: { parent: 'upperArmR', offset: (d) => [0, -d.upperArm, 0], sign: [-1, R, R], rest: [0.1, 0, 0] },
  handR: { parent: 'foreArmR', offset: (d) => [0, -d.foreArm, 0], sign: [-1, R, R], rest: [0, 0, 0] },
  thighL: { parent: 'pelvis', offset: (d) => [d.hipX, 0, 0], sign: [-1, L, L], rest: [0, 0, 0.03] },
  shinL: { parent: 'thighL', offset: (d) => [0, -d.thigh, 0], sign: [1, L, L], rest: [0, 0, 0] },
  footL: { parent: 'shinL', offset: (d) => [0, -d.shin, 0], sign: [-1, L, L], rest: [0, 0, 0] },
  thighR: { parent: 'pelvis', offset: (d) => [-d.hipX, 0, 0], sign: [-1, R, R], rest: [0, 0, 0.03] },
  shinR: { parent: 'thighR', offset: (d) => [0, -d.thigh, 0], sign: [1, R, R], rest: [0, 0, 0] },
  footR: { parent: 'shinR', offset: (d) => [0, -d.shin, 0], sign: [-1, R, R], rest: [0, 0, 0] },
};

export interface Pose {
  bones: Partial<Record<BoneName, Vec3>>;
  root: Vec3;
  fx: Record<string, number>;
}

export interface RigBone {
  pos: Vec3;
  rot: Mat3;
}
export type Rig = Record<BoneName, RigBone>;

/** Forward kinematics: local euler pose -> world transforms, with the whole character yawed by `yaw`. */
export function solveRig(pose: Pose, dims: BodyDims, yaw: number): Rig {
  const rig = {} as Rig;
  const yawM = rotY(yaw);
  for (const name of BONE_NAMES) {
    const def = DEFS[name];
    const r = pose.bones[name] ?? [0, 0, 0];
    const local = euler(
      def.sign[0] * (r[0] + def.rest[0]),
      def.sign[1] * (r[1] + def.rest[1]),
      def.sign[2] * (r[2] + def.rest[2]),
    );
    if (!def.parent) {
      rig[name] = { pos: mulV(yawM, pose.root), rot: mulM(yawM, local) };
    } else {
      const p = rig[def.parent];
      rig[name] = { pos: addV(p.pos, mulV(p.rot, def.offset(dims))), rot: mulM(p.rot, local) };
    }
  }
  return rig;
}

export function bonePoint(rig: Rig, bone: BoneName, local: Vec3): Vec3 {
  const b = rig[bone];
  return addV(b.pos, mulV(b.rot, local));
}
