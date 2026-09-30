import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLIPS, clipById } from '../src/anim/clips';
import { samplePose } from '../src/core/animation';
import { sanitizeAppearance } from '../src/core/appearance';
import { defaultAppearance, randomAppearance, slotsFor, changeAppearance, resolveParts } from '../src/parts/index';

test('旧配置迁移为 chibi，保留有效部件并过滤非法数据', () => {
  const old = { ...defaultAppearance(), style: undefined, parts: { hair: 'twintail', eyes: 'missing' }, tints: { top: 'bad', bottom: '#123abc' } };
  const app = sanitizeAppearance(old)!;
  assert.equal(app.style, 'chibi');
  assert.equal(app.parts.hair, 'twintail');
  assert.equal(app.parts.eyes, 'big');
  assert.deepEqual(app.tints, { bottom: '#123abc' });
  assert.equal(sanitizeAppearance([]), null);
  assert.equal(sanitizeAppearance(null), null);
});

test('切换性别后部位有效，男女几何和目录有所区别', () => {
  const female = defaultAppearance();
  const male = changeAppearance(female, 'chibi', 'male');
  for (const slot of slotsFor(male)) assert.ok(slot.items.some((p) => p.id === male.parts[slot.id]));
  assert.equal(male.parts.top, 'tunic');
  assert.notEqual(resolveParts(male).face.jaw, resolveParts(female).face.jaw);
  assert.notDeepEqual(slotsFor(male).find((s) => s.id === 'hair')?.items, slotsFor(female).find((s) => s.id === 'hair')?.items);
});

test('随机角色保留当前风格性别且每个部件属于当前目录', () => {
  for (const gender of ['male', 'female'] as const) for (let i = 0; i < 30; i++) {
    const app = randomAppearance('chibi', gender);
    assert.equal(app.gender, gender);
    assert.equal(app.style, 'chibi');
    for (const slot of slotsFor(app)) assert.ok(slot.items.some((p) => p.id === app.parts[slot.id]));
  }
});

test('死亡动画倒地后保持终态，负时间从起点采样', () => {
  const death = CLIPS.find((c) => c.id === 'death');
  assert.ok(death, '应提供死亡骨骼动画');
  assert.equal(death.loop, false);
  const end = samplePose(death, death.duration);
  assert.ok(Math.abs(end.bones.root?.[2] ?? 0) > 1.4, '根骨骼应旋转倒地');
  assert.deepEqual(samplePose(death, death.duration * 4), end);
  assert.deepEqual(samplePose(death, -1), samplePose(death, 0));
  assert.notDeepEqual(end, samplePose(death, 0));
});

test('现有循环动画仍在周期结束后回到起点', () => {
  for (const clip of CLIPS.filter((c) => c.id !== 'death')) {
    assert.deepEqual(samplePose(clip, clip.duration), samplePose(clip, 0));
  }
  assert.equal(clipById('missing').id, 'idle');
});
