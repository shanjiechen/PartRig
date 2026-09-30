import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SPRITE_PLAYWRIGHT || 'playwright');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/');
  const images = await page.evaluate(async () => {
    const { drawCharacter } = await import('/src/render/character.ts');
    const { defaultAppearance } = await import('/src/parts/index.ts');
    const { DIRECTIONS } = await import('/src/core/types.ts');
    const { CLIPS } = await import('/src/anim/clips.ts');
    const { samplePose } = await import('/src/core/animation.ts');
    const profiles = ['chibi', 'guofeng'].flatMap(style => ['female', 'male'].map(gender => defaultAppearance(style, gender)));
    const sheets = [];
    for (const clipId of ['idle', 'wave', 'slash', 'death']) {
      const canvas = document.createElement('canvas');
      canvas.width = 1600; canvas.height = 1020;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f6f3f0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const clip = CLIPS.find(c => c.id === clipId);
      const time = clipId === 'death' ? clip.duration : clip.duration * .35;
      profiles.forEach((app, row) => DIRECTIONS.forEach((dir, col) => {
        const x = col * 200, y = row * 255;
        ctx.fillStyle = '#615969'; ctx.font = '12px sans-serif';
        ctx.fillText(`${app.style} / ${app.gender} / ${dir.id ?? dir.name} / ${clipId}`, x + 8, y + 20);
        drawCharacter(ctx, app, samplePose(clip, time), { x: x + 95, y: y + 230, scale: clipId === 'death' ? 2 : 2.7, yaw: dir.yaw, time, effects: false });
      }));
      sheets.push({ name: clipId, png: canvas.toDataURL().split(',')[1] });
    }
    return sheets;
  });
  mkdirSync('.shots', { recursive: true });
  for (const image of images) writeFileSync(`.shots/${process.env.PREVIEW_PREFIX || 'art'}-${image.name}.png`, Buffer.from(image.png, 'base64'));
  console.log(`Rendered ${images.length} sheets: 4 profiles × 8 directions × 4 animations`);
} finally { await browser.close(); }
