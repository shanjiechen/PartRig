import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SPRITE_PLAYWRIGHT || 'playwright');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/');
  const result = await page.evaluate(async () => {
    const { drawCharacter } = await import('/src/render/character.ts');
    const { defaultAppearance, resolveParts } = await import('/src/parts/index.ts');
    const { DIRECTIONS } = await import('/src/core/types.ts');
    const { CLIPS } = await import('/src/anim/clips.ts');
    const { samplePose } = await import('/src/core/animation.ts');
    const { solveRig, bodyDims, bonePoint } = await import('/src/core/skeleton.ts');
    const { makeHeadView, projectWorld } = await import('/src/render/context.ts');
    const { faceOutline } = await import('/src/parts/faces.ts');
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const failures = [];
    let checked = 0;
    for (const style of ['chibi', 'guofeng', 'aistory']) for (const gender of ['male', 'female']) {
      const app = defaultAppearance(style, gender);
      app.parts.weapon = 'none';
      const parts = resolveParts(app);
      // Compare the SAME pose with contrasting sleeves. A sleeve must never recolor the interior of the head in idle.
      const previous = { sleeve: parts.top.sleeve, sleeveColor: parts.top.sleeveColor, pauldron: parts.top.pauldron };
      parts.top.sleeve = 'long'; parts.top.pauldron = undefined;
      try {
        for (const dir of DIRECTIONS) for (const time of [.3, 1.1]) {
          const pose = samplePose(CLIPS.find(c => c.id === 'idle'), time);
          const dims = bodyDims(gender, style);
          const head = makeHeadView(solveRig(pose, dims, dir.yaw), dims, parts.face.sx, parts.face.sy);
          const maskCanvas = document.createElement('canvas'); maskCanvas.width = maskCanvas.height = 480;
          const maskCtx = maskCanvas.getContext('2d');
          maskCtx.translate(240, 425); maskCtx.scale(5, 5); maskCtx.translate(head.cx, head.cy); maskCtx.rotate(-head.roll);
          faceOutline(maskCtx, parts.face, head); maskCtx.fillStyle = '#fff'; maskCtx.fill();
          maskCtx.globalCompositeOperation = 'destination-out'; maskCtx.lineWidth = .6; maskCtx.stroke();
          const mask = maskCtx.getImageData(0, 0, 480, 480).data;
          const images = ['#ff0000', '#0000ff'].map(color => {
            parts.top.sleeveColor = color;
            ctx.clearRect(0, 0, 480, 480);
            drawCharacter(ctx, app, pose, { x: 240, y: 425, scale: 5, yaw: dir.yaw, time, effects: false, shadow: false });
            return ctx.getImageData(0, 0, 480, 480).data;
          });
          let changed = 0;
          for (let i = 0; i < mask.length; i += 4) if (mask[i + 3] > 250 && Math.abs(images[0][i] - images[1][i]) > 30) changed++;
          if (changed) failures.push(`${style}/${gender}/${dir.id}/${time}: ${changed} face pixels covered by sleeves`);
          checked++;
        }
      } finally { Object.assign(parts.top, previous); }
    }
    // Keep genuine foreground hand gestures visible while the shoulder remains behind the head.
    const gesture = defaultAppearance('chibi', 'male'), gestureTop = resolveParts(gesture).top;
    const originalGloves = gestureTop.gloves;
    let foregroundHands = 0;
    try {
      const clip = CLIPS.find(c => c.id === 'wave'), time = clip.duration * .35, pose = samplePose(clip, time);
      for (const dir of DIRECTIONS.filter(d => ['E', 'SE'].includes(d.id))) {
        const rig = solveRig(pose, bodyDims('male'), dir.yaw);
        const p = projectWorld(bonePoint(rig, 'handR', [0, -1.4, 0]));
        const values = ['#ff0000', '#0000ff'].map(color => {
          gestureTop.gloves = color; ctx.clearRect(0, 0, 480, 480);
          drawCharacter(ctx, gesture, pose, { x: 240, y: 425, scale: 5, yaw: dir.yaw, time, effects: false });
          return ctx.getImageData(Math.round(240 + p.x * 5), Math.round(425 + p.y * 5), 1, 1).data[0];
        });
        if (Math.abs(values[0] - values[1]) < 100) failures.push(`${dir.id}: foreground waving hand incorrectly hidden`);
        foregroundHands++;
      }
    } finally { gestureTop.gloves = originalGloves; }
    // Exercise the full animation range, including fallen poses and front crossing hands/props.
    let animationFrames = 0;
    for (const style of ['chibi', 'guofeng', 'aistory']) for (const gender of ['male', 'female']) for (const clip of CLIPS) for (const dir of DIRECTIONS) for (let frame = 0; frame <= 8; frame++) {
      const time = clip.duration * frame / 8;
      ctx.clearRect(0, 0, 480, 480);
      drawCharacter(ctx, defaultAppearance(style, gender), samplePose(clip, time), { x: 240, y: 425, scale: 4, yaw: dir.yaw, time, prop: clip.prop });
      animationFrames++;
    }
    return { failures, checked, foregroundHands, animationFrames };
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(result.failures, [], result.failures.join('\n'));
  console.log(`Passed ${result.checked} shoulder occlusion comparisons, ${result.foregroundHands} foreground hands and ${result.animationFrames} animation frames.`);
} finally { await browser.close(); }
