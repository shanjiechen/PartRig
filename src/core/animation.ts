import { clamp, lerp, type Vec3 } from './math';
import { BONE_NAMES, type BoneName, type Pose } from './skeleton';

export type Ease = 'linear' | 'in' | 'out' | 'inout';

/** A keyframe. `t` is normalized time in [0,1). Unspecified channels default to 0 (rest pose). */
export interface PoseKey {
  t: number;
  bones?: Partial<Record<BoneName, Vec3>>;
  root?: Vec3;
  fx?: Record<string, number>;
  /** Easing for the segment leaving this key (only for interp = 'ease'). */
  ease?: Ease;
}

/**
 * Data-driven animation clip. Clips are plain JSON-compatible objects so recorded or
 * externally authored skeletal motions can be loaded later with the same format.
 */
export interface AnimationClip {
  id: string;
  name: string;
  duration: number;
  interp: 'spline' | 'ease';
  keys: PoseKey[];
  /** Prop auto-equipped when the weapon slot is set to "auto". */
  prop?: string;
}

interface Channels {
  bones: BoneName[];
  fx: string[];
}
const channelCache = new WeakMap<AnimationClip, Channels>();

function channels(clip: AnimationClip): Channels {
  let c = channelCache.get(clip);
  if (!c) {
    const bones = new Set<BoneName>();
    const fx = new Set<string>();
    for (const k of clip.keys) {
      if (k.bones) for (const b of Object.keys(k.bones)) bones.add(b as BoneName);
      if (k.fx) for (const f of Object.keys(k.fx)) fx.add(f);
    }
    c = { bones: [...bones], fx: [...fx] };
    channelCache.set(clip, c);
  }
  return c;
}

const EASE: Record<Ease, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inout: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};

const boneVal = (k: PoseKey, b: BoneName, i: number) => k.bones?.[b]?.[i] ?? 0;
const rootVal = (k: PoseKey, i: number) => k.root?.[i] ?? 0;
const fxVal = (k: PoseKey, f: string) => k.fx?.[f] ?? 0;

export function samplePose(clip: AnimationClip, time: number): Pose {
  const keys = clip.keys;
  const n = keys.length;
  const u = (((time / clip.duration) % 1) + 1) % 1;
  let i = n - 1;
  for (let k = 0; k < n; k++) if (keys[k].t <= u) i = k;
  const j = (i + 1) % n;
  const t0 = keys[i].t;
  const t1 = j === 0 ? keys[0].t + 1 : keys[j].t;
  const uu = u < t0 ? u + 1 : u;
  const local = clamp((uu - t0) / Math.max(1e-6, t1 - t0), 0, 1);
  const k0 = keys[(i - 1 + n) % n], k1 = keys[i], k2 = keys[j], k3 = keys[(j + 1) % n];

  const mixFn =
    clip.interp === 'spline'
      ? (get: (k: PoseKey) => number) => catmull(get(k0), get(k1), get(k2), get(k3), local)
      : (get: (k: PoseKey) => number) => lerp(get(k1), get(k2), EASE[k1.ease ?? 'inout'](local));

  const ch = channels(clip);
  const pose: Pose = { bones: {}, root: [0, 0, 0], fx: {} };
  for (const b of ch.bones) {
    pose.bones[b] = [0, 1, 2].map((a) => mixFn((k) => boneVal(k, b, a))) as Vec3;
  }
  pose.root = [0, 1, 2].map((a) => mixFn((k) => rootVal(k, a))) as Vec3;
  for (const f of ch.fx) pose.fx[f] = Math.max(0, mixFn((k) => fxVal(k, f)));
  return pose;
}

export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const out: Pose = { bones: {}, root: [0, 0, 0], fx: {} };
  for (const name of BONE_NAMES) {
    const va = a.bones[name], vb = b.bones[name];
    if (!va && !vb) continue;
    const x = va ?? [0, 0, 0], y = vb ?? [0, 0, 0];
    out.bones[name] = [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)];
  }
  out.root = [0, 1, 2].map((i) => lerp(a.root[i], b.root[i], t)) as Vec3;
  for (const f of new Set([...Object.keys(a.fx), ...Object.keys(b.fx)])) {
    out.fx[f] = lerp(a.fx[f] ?? 0, b.fx[f] ?? 0, t);
  }
  return out;
}

const CENTER: BoneName[] = ['root', 'pelvis', 'chest', 'head'];

/** Mirror a key left<->right (used to author symmetric cycles like walking). */
export function mirrorKey(k: PoseKey, t: number): PoseKey {
  const bones: Partial<Record<BoneName, Vec3>> = {};
  for (const [name, v] of Object.entries(k.bones ?? {}) as [BoneName, Vec3][]) {
    if (CENTER.includes(name)) bones[name] = [v[0], -v[1], -v[2]];
    else {
      const other = (name.endsWith('L') ? name.slice(0, -1) + 'R' : name.slice(0, -1) + 'L') as BoneName;
      bones[other] = [...v] as Vec3;
    }
  }
  const root = k.root ? ([-k.root[0], k.root[1], k.root[2]] as Vec3) : undefined;
  return { ...k, t, bones, root };
}
