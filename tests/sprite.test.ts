import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLIPS, clipById } from '../src/anim/clips';
import { samplePose } from '../src/core/animation';

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
