import { mirrorKey, type AnimationClip, type PoseKey } from '../core/animation';

/* Keyframe conventions (radians):
 *  - chest/pelvis/head x: + lean forward / nod down, y: + turn toward character's left, z: side bend.
 *  - limbs x: + swing forward (shin/knee: + bend), z: + raise outward, y: twist.
 *  - root: [x, y(bob), z(forward)] offset in character space.
 */

const idle: AnimationClip = {
  id: 'idle',
  name: '待机',
  duration: 2.4,
  interp: 'spline',
  keys: [
    {
      t: 0,
      bones: {
        chest: [0.03, 0, 0], head: [0.02, 0, -0.02],
        upperArmL: [0, 0, 0.02], upperArmR: [0, 0, 0.02], foreArmL: [0.15, 0, 0], foreArmR: [0.15, 0, 0],
        thighL: [0, 0, 0.02], thighR: [0, 0, 0.02],
      },
      root: [0, 0, 0],
    },
    {
      t: 0.5,
      bones: {
        chest: [-0.02, 0, 0], head: [-0.03, 0, 0.05],
        upperArmL: [0.02, 0, 0.09], upperArmR: [0.02, 0, 0.09], foreArmL: [0.25, 0, 0], foreArmR: [0.25, 0, 0],
        thighL: [0, 0, 0.02], thighR: [0, 0, 0.02],
      },
      root: [0, 0.35, 0],
    },
  ],
};

const walkA: PoseKey = {
  t: 0,
  bones: {
    thighL: [0.5, 0, 0], shinL: [0.1, 0, 0], footL: [0.2, 0, 0],
    thighR: [-0.4, 0, 0], shinR: [0.35, 0, 0], footR: [-0.25, 0, 0],
    upperArmR: [0.45, 0, 0.05], foreArmR: [0.4, 0, 0],
    upperArmL: [-0.4, 0, 0.05], foreArmL: [0.15, 0, 0],
    chest: [0.06, 0.1, 0], pelvis: [0, -0.1, 0], head: [-0.03, -0.08, 0],
  },
  root: [0, -0.5, 0],
};
const walkB: PoseKey = {
  t: 0.25,
  bones: {
    thighL: [-0.05, 0, 0], shinL: [0.08, 0, 0], footL: [0, 0, 0],
    thighR: [0.35, 0, 0], shinR: [1.0, 0, 0], footR: [0.1, 0, 0],
    upperArmR: [0.05, 0, 0.05], foreArmR: [0.3, 0, 0],
    upperArmL: [0, 0, 0.05], foreArmL: [0.2, 0, 0],
    chest: [0.06, 0, 0], head: [-0.03, 0, 0],
  },
  root: [0, 0.7, 0],
};
const walk: AnimationClip = {
  id: 'walk',
  name: '行走',
  duration: 0.9,
  interp: 'spline',
  keys: [walkA, walkB, mirrorKey(walkA, 0.5), mirrorKey(walkB, 0.75)],
};

const runA: PoseKey = {
  t: 0,
  bones: {
    thighL: [0.9, 0, 0], shinL: [0.25, 0, 0], footL: [0.2, 0, 0],
    thighR: [-0.6, 0, 0], shinR: [0.9, 0, 0], footR: [-0.4, 0, 0],
    upperArmR: [0.9, 0, 0.12], foreArmR: [1.5, 0, 0],
    upperArmL: [-0.7, 0, 0.12], foreArmL: [1.3, 0, 0],
    chest: [0.28, 0.15, 0], pelvis: [0, -0.15, 0], head: [-0.2, -0.12, 0],
  },
  root: [0, -1, 0],
};
const runB: PoseKey = {
  t: 0.25,
  bones: {
    thighL: [-0.2, 0, 0], shinL: [0.3, 0, 0], footL: [0, 0, 0],
    thighR: [0.7, 0, 0], shinR: [1.8, 0, 0], footR: [0.2, 0, 0],
    upperArmR: [0.1, 0, 0.12], foreArmR: [1.5, 0, 0],
    upperArmL: [0, 0, 0.12], foreArmL: [1.4, 0, 0],
    chest: [0.28, 0, 0], head: [-0.2, 0, 0],
  },
  root: [0, 1.4, 0],
};
const run: AnimationClip = {
  id: 'run',
  name: '奔跑',
  duration: 0.6,
  interp: 'spline',
  keys: [runA, runB, mirrorKey(runA, 0.5), mirrorKey(runB, 0.75)],
};

type Bones = NonNullable<PoseKey['bones']>;

const stance: Bones = {
  thighL: [0.25, 0, 0.05], shinL: [0.15, 0, 0],
  thighR: [-0.2, 0, 0.05], shinR: [0.2, 0, 0],
};

const thrustReady: PoseKey['bones'] = {
  ...stance,
  upperArmR: [0.35, 0, 0.2], foreArmR: [1.1, 0, 0], handR: [-1.2, 0, 0],
  upperArmL: [0.3, 0, 0.2], foreArmL: [0.9, 0, 0],
  chest: [0.05, -0.15, 0],
};
const thrustStrike: PoseKey['bones'] = {
  upperArmR: [1.5, 0, 0.05], foreArmR: [0.05, 0, 0], handR: [-1.45, 0, 0],
  upperArmL: [-0.3, 0, 0.3], foreArmL: [0.5, 0, 0],
  chest: [0.22, 0.45, 0], head: [-0.15, -0.3, 0],
  thighL: [0.7, 0, 0.05], shinL: [0.55, 0, 0], footL: [0, 0, 0],
  thighR: [-0.5, 0, 0.05], shinR: [0.1, 0, 0],
};
const thrust: AnimationClip = {
  id: 'thrust',
  name: '捅刺',
  duration: 1.0,
  interp: 'ease',
  prop: 'spear',
  keys: [
    { t: 0, bones: thrustReady, root: [0, -0.5, 0] },
    {
      t: 0.3, ease: 'in', root: [0, -0.8, -1.5],
      bones: {
        upperArmR: [0.05, 0, 0.35], foreArmR: [1.5, 0, 0], handR: [-1.3, 0, 0],
        upperArmL: [0.6, 0, 0.2], foreArmL: [1.0, 0, 0],
        chest: [-0.02, -0.5, 0], head: [0, 0.3, 0],
        thighL: [0.35, 0, 0.05], shinL: [0.3, 0, 0], thighR: [-0.3, 0, 0.05], shinR: [0.3, 0, 0],
      },
    },
    { t: 0.42, ease: 'out', root: [0, -1.4, 2.5], bones: thrustStrike, fx: { thrust: 1, shout: 1 } },
    { t: 0.62, root: [0, -1.4, 2.5], bones: thrustStrike, fx: { shout: 0.6 } },
    { t: 0.9, bones: thrustReady, root: [0, -0.5, 0] },
  ],
};

const slashReady: PoseKey['bones'] = {
  ...stance,
  upperArmR: [0.3, 0, 0.2], foreArmR: [0.9, 0, 0], handR: [-0.4, 0, 0],
  upperArmL: [0.2, 0, 0.2], foreArmL: [0.6, 0, 0],
  chest: [0.05, -0.1, 0],
};
// Weapon axis angle ≈ upperArm.x + foreArm.x + hand.x (0 = forward, π/2 = up).
const slash: AnimationClip = {
  id: 'slash',
  name: '劈砍',
  duration: 1.0,
  interp: 'ease',
  prop: 'sword',
  keys: [
    { t: 0, bones: slashReady, root: [0, -0.5, 0] },
    {
      t: 0.32, ease: 'in', root: [0, 0.3, -0.5],
      bones: {
        ...stance,
        upperArmR: [2.9, 0, 0.3], foreArmR: [0.4, 0, 0], handR: [-0.9, 0, 0],
        upperArmL: [0.5, 0, 0.3], foreArmL: [0.8, 0, 0],
        chest: [-0.15, -0.35, 0], head: [-0.1, 0.2, 0],
      },
    },
    {
      t: 0.44, ease: 'out', root: [0, -1.6, 1.8], fx: { slash: 1, shout: 1 },
      bones: {
        upperArmR: [0.9, 0, 0.1], foreArmR: [0.1, 0, 0], handR: [-1.4, 0, 0],
        upperArmL: [-0.2, 0, 0.35], foreArmL: [0.5, 0, 0],
        chest: [0.35, 0.35, 0], head: [-0.2, -0.25, 0],
        thighL: [0.7, 0, 0.05], shinL: [0.6, 0, 0], thighR: [-0.5, 0, 0.05], shinR: [0.2, 0, 0],
      },
    },
    {
      t: 0.58, root: [0, -1.6, 1.8], fx: { slash: 0, shout: 0.5 },
      bones: {
        upperArmR: [-0.1, 0, 0.15], foreArmR: [0.3, 0, 0], handR: [-1.3, 0, 0],
        upperArmL: [-0.2, 0, 0.35], foreArmL: [0.5, 0, 0],
        chest: [0.4, 0.4, 0], head: [-0.25, -0.3, 0],
        thighL: [0.7, 0, 0.05], shinL: [0.6, 0, 0], thighR: [-0.5, 0, 0.05], shinR: [0.2, 0, 0],
      },
    },
    { t: 0.9, bones: slashReady, root: [0, -0.5, 0] },
  ],
};

const bowReady: Bones = {
  ...stance,
  upperArmL: [0.1, 0, 0.12], foreArmL: [0.3, 0, 0], handL: [1.1, 0, 0],
  upperArmR: [0.1, 0, 0.1], foreArmR: [0.4, 0, 0],
};
// Archer stance: torso turned so the bow arm points at the target, head looks forward.
const bowAim: Bones = {
  thighL: [0, 0, 0.25], thighR: [0, 0, 0.25], shinL: [0.1, 0, 0], shinR: [0.1, 0, 0],
  pelvis: [0, -0.45, 0], chest: [0, -0.75, 0], head: [0, 1.1, 0],
  upperArmL: [0, 0, 1.45], foreArmL: [0, 0, 0.05], handL: [0, 1.57, 0],
  upperArmR: [0, 0, 1.2], foreArmR: [0, 0, -2.6],
};
const shoot: AnimationClip = {
  id: 'shoot',
  name: '射击',
  duration: 1.4,
  interp: 'ease',
  prop: 'bow',
  keys: [
    { t: 0, bones: bowReady },
    { t: 0.25, bones: bowAim, fx: { draw: 0.4 } },
    {
      t: 0.5, ease: 'in', fx: { draw: 1 },
      bones: { ...bowAim, upperArmR: [0, 0, 1.55], foreArmR: [0, 0, -2.95] },
    },
    {
      t: 0.56, ease: 'linear', fx: { arrow: 0.02 },
      bones: { ...bowAim, upperArmR: [0, 0, 1.75], foreArmR: [0, 0, -1.4] },
    },
    { t: 0.8, fx: { arrow: 1 }, bones: { ...bowAim, upperArmR: [0, 0, 1.7], foreArmR: [0, 0, -1.3] } },
    { t: 0.81, bones: { ...bowAim, upperArmR: [0, 0, 1.6], foreArmR: [0, 0, -1.4] } },
    { t: 0.95, bones: bowReady },
  ],
};

const castReady: PoseKey['bones'] = {
  upperArmR: [0.3, 0, 0.15], foreArmR: [0.95, 0, 0],
  upperArmL: [0.05, 0, 0.1], foreArmL: [0.3, 0, 0],
};
const castForward: PoseKey['bones'] = {
  upperArmR: [1.5, 0, 0.15], foreArmR: [0.1, 0, 0],
  upperArmL: [1.5, 0, 0.15], foreArmL: [0.1, 0, 0],
  chest: [0.15, 0, 0], ...stance,
};
const cast: AnimationClip = {
  id: 'cast',
  name: '施法',
  duration: 1.6,
  interp: 'ease',
  prop: 'staff',
  keys: [
    { t: 0, bones: castReady },
    {
      t: 0.3, fx: { glow: 0.5 },
      bones: {
        upperArmL: [0.9, 0, -0.1], foreArmL: [1.3, 0, 0], upperArmR: [0.8, 0, -0.1], foreArmR: [1.3, 0, 0],
        chest: [-0.08, 0, 0],
      },
    },
    {
      t: 0.5, ease: 'in', root: [0, 1.2, 0], fx: { glow: 1 },
      bones: {
        upperArmR: [2.5, 0, 0.3], foreArmR: [0.3, 0, 0], upperArmL: [2.5, 0, 0.3], foreArmL: [0.3, 0, 0],
        head: [-0.2, 0, 0], chest: [-0.12, 0, 0],
      },
    },
    { t: 0.62, ease: 'out', root: [0, -0.5, 1], bones: castForward, fx: { glow: 0.6, burst: 1, shout: 1 } },
    { t: 0.85, root: [0, -0.5, 1], bones: castForward, fx: { burst: 0 } },
    { t: 0.97, bones: castReady },
  ],
};

const useReady: PoseKey['bones'] = {
  upperArmR: [0.3, 0, 0.1], foreArmR: [1.2, 0, 0],
};
const use: AnimationClip = {
  id: 'use',
  name: '使用',
  duration: 1.6,
  interp: 'ease',
  prop: 'potion',
  keys: [
    { t: 0, bones: useReady },
    {
      t: 0.3,
      bones: { upperArmR: [0.75, 0, 0.45], foreArmR: [2.3, 0, 0], handR: [0.4, 0, 0], head: [-0.35, 0, 0], chest: [-0.1, 0, 0] },
    },
    {
      t: 0.6,
      bones: { upperArmR: [0.85, 0, 0.45], foreArmR: [2.4, 0, 0], handR: [0.6, 0, 0], head: [-0.42, 0, 0], chest: [-0.14, 0, 0] },
    },
    { t: 0.75, bones: useReady, fx: { sparkle: 1, joy: 1 } },
    { t: 0.97, bones: useReady, fx: { sparkle: 0, joy: 0.3 } },
  ],
};

const hitReady: PoseKey['bones'] = {
  upperArmL: [0.05, 0, 0.1], upperArmR: [0.05, 0, 0.1], foreArmL: [0.2, 0, 0], foreArmR: [0.2, 0, 0],
};
const hit: AnimationClip = {
  id: 'hit',
  name: '受击',
  duration: 0.8,
  interp: 'ease',
  keys: [
    { t: 0, bones: hitReady },
    {
      t: 0.06, ease: 'out', root: [0, 0.5, -3.5], fx: { flash: 1, hurt: 1 },
      bones: {
        chest: [-0.45, 0.2, 0.1], head: [-0.4, 0, 0.15],
        upperArmL: [0.6, 0, 0.7], foreArmL: [0.9, 0, 0], upperArmR: [0.6, 0, 0.7], foreArmR: [0.9, 0, 0],
        thighL: [0.3, 0, 0], shinL: [0.4, 0, 0],
      },
    },
    {
      t: 0.25, root: [0, -0.8, -3], fx: { flash: 0, hurt: 1 },
      bones: {
        chest: [-0.2, 0.1, 0.05], head: [-0.1, 0, 0.1],
        upperArmL: [0.3, 0, 0.4], foreArmL: [0.6, 0, 0], upperArmR: [0.3, 0, 0.4], foreArmR: [0.6, 0, 0],
        thighL: [0.2, 0, 0], shinL: [0.3, 0, 0], shinR: [0.2, 0, 0],
      },
    },
    { t: 0.6, root: [0, 0, -1], fx: { hurt: 0 }, bones: { ...hitReady, chest: [0.05, 0, 0] } },
    { t: 0.95, bones: hitReady },
  ],
};

const waveBase: Bones = {
  upperArmR: [-0.3, 0, 2.2], handR: [0, 0, 0],
  upperArmL: [0, 0, 0.15], foreArmL: [0.3, 0, 0],
  head: [0, 0, 0.1], chest: [0, 0, -0.05],
};
const wave: AnimationClip = {
  id: 'wave',
  name: '打招呼',
  duration: 1.2,
  interp: 'spline',
  keys: [
    { t: 0, bones: { ...waveBase, foreArmR: [0.1, 0, -0.4] }, fx: { joy: 1 } },
    { t: 0.25, bones: { ...waveBase, foreArmR: [0.1, 0, 0.4] }, root: [0, 0.4, 0], fx: { joy: 1 } },
    { t: 0.5, bones: { ...waveBase, foreArmR: [0.1, 0, -0.4] }, fx: { joy: 1 } },
    { t: 0.75, bones: { ...waveBase, foreArmR: [0.1, 0, 0.4] }, root: [0, 0.4, 0], fx: { joy: 1 } },
  ],
};

export const CLIPS: AnimationClip[] = [idle, walk, run, thrust, slash, shoot, cast, use, hit, wave];
export const clipById = (id: string) => CLIPS.find((c) => c.id === id) ?? idle;
