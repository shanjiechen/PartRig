import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SPRITE_PLAYWRIGHT || 'playwright');
const testedStyle = process.env.SPRITE_STYLE || 'guofeng';
assert.ok(['guofeng', 'aistory'].includes(testedStyle));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
mkdirSync('.shots', { recursive: true });
const appearance = () => page.evaluate(() => JSON.parse(localStorage.getItem('partrig-appearance')));
const screenshot = async (name) => { await page.waitForTimeout(180); await page.screenshot({ path: `.shots/${testedStyle}-${name}.png` }); };
const downloadBytes = async (selector) => {
  const pending = page.waitForEvent('download'); await page.locator(selector).click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = []; for await (const chunk of stream) chunks.push(chunk);
  return { name: download.suggestedFilename(), bytes: Buffer.concat(chunks) };
};

try {
  await page.goto(process.env.SPRITE_URL || 'http://127.0.0.1:5173/');
  await page.locator('#play').click();
  await page.locator('[data-slot="hair"]').click();
  await page.locator('.item').nth(8).click();
  const original = await appearance();
  await screenshot('verified-chibi');
  assert.equal(await page.locator('#styles [data-style]').count(), 3);
  await page.locator(`[data-style="${testedStyle}"]`).click();
  assert.equal((await appearance()).style, testedStyle);
  await page.locator('[data-style="chibi"]').click();
  assert.deepEqual(await appearance(), original, '切换回来应恢复编辑结果');
  await page.locator(`[data-style="${testedStyle}"]`).click();

  let choices = 0;
  const profiles = {};
  for (const gender of ['female', 'male']) {
    await page.locator(`[data-g="${gender}"]`).click();
    await page.locator('#reset').click();
    await screenshot(`verified-${gender}`);
    const ids = await page.locator('[data-slot]').evaluateAll((els) => els.map((e) => e.dataset.slot));
    assert.equal(ids.length, 14);
    for (const slot of ids) {
      await page.locator(`[data-slot="${slot}"]`).click();
      const count = await page.locator('.item').count(); assert.ok(count >= 12, `${gender}/${slot}: ${count}`);
      choices += count;
      const lastId = await page.locator('.item').last().getAttribute('data-item');
      await page.locator('.item').last().click();
      assert.equal((await appearance()).parts[slot], lastId);
      if (['headwear', 'top', 'weapon', 'beard'].includes(slot)) await screenshot(`verified-${gender}-${slot}`);
    }
    await page.locator('#random').click();
    assert.equal((await appearance()).gender, gender);
    assert.equal((await appearance()).style, testedStyle);
    profiles[gender] = await appearance();
  }
  await page.locator('[data-g="female"]').click();
  assert.deepEqual(await appearance(), profiles.female, '女性档案应独立保存');
  await page.locator('[data-g="male"]').click();
  assert.deepEqual(await appearance(), profiles.male, '男性档案应独立保存');

  // Exercise every authored part through the real Canvas renderer at all eight directions.
  const renders = await page.evaluate(async style => {
    const { defaultAppearance, slotsFor } = await import('/src/parts/index.ts');
    const { drawCharacter } = await import('/src/render/character.ts');
    const { clipById } = await import('/src/anim/clips.ts');
    const { samplePose } = await import('/src/core/animation.ts');
    const { DIRECTIONS } = await import('/src/core/types.ts');
    const { getCatalog } = await import('/src/parts/catalog.ts');
    const cv = document.createElement('canvas'); cv.width = 192; cv.height = 192;
    const ctx = cv.getContext('2d'); let count = 0;
    for (const gender of ['female', 'male']) {
      const noseImages = getCatalog(style, gender).nose.map((nose) => {
        ctx.clearRect(0, 0, 192, 192); ctx.save(); ctx.translate(96, 96); ctx.scale(12, 12);
        nose.draw?.(ctx, '#fddcc6'); ctx.restore(); return cv.toDataURL();
      });
      if (new Set(noseImages).size !== 12) throw new Error(`${gender}鼻型应有12种实际绘制差异`);
      const base = defaultAppearance(style, gender);
      for (const slot of slotsFor(base)) for (const item of slot.items) {
        const app = { ...base, parts: { ...base.parts, [slot.id]: item.id } };
        for (const dir of DIRECTIONS) {
          ctx.clearRect(0, 0, 192, 192);
          drawCharacter(ctx, app, samplePose(clipById('idle'), .5), { x: 96, y: 154, scale: 1.6, yaw: dir.yaw, time: .5, prop: 'sword' });
          count++;
        }
      }
    }
    return count;
  }, testedStyle);
  assert.equal(renders, choices * 8);

  await page.locator('#reset').click();
  await page.locator('[data-clip="death"]').click();
  await page.waitForTimeout(2300);
  assert.equal(await page.locator('#play').textContent(), '播放');
  const finalImage = await page.locator('#stage').evaluate((cv) => cv.toDataURL());
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#stage').evaluate((cv) => cv.toDataURL()), finalImage, '死亡终态应保持');
  await screenshot('verified-death');
  await page.locator('#replay').click();
  assert.equal(await page.locator('#play').textContent(), '暂停');
  await page.waitForTimeout(2300);
  await page.locator('[data-view="eight"]').click();
  await screenshot('verified-death-eight');

  const png = await downloadBytes('#sheet');
  assert.equal(png.name, `${testedStyle}_male_death_8dir_8f.png`);
  assert.equal(png.bytes.readUInt32BE(16), 192 * 8);
  assert.equal(png.bytes.readUInt32BE(20), 192 * 8);
  const finalFrameMatches = await page.evaluate(async ({ png, app }) => {
    const { drawCharacter } = await import('/src/render/character.ts');
    const { clipById } = await import('/src/anim/clips.ts');
    const { samplePose } = await import('/src/core/animation.ts');
    const { DIRECTIONS } = await import('/src/core/types.ts');
    const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode();
    const sheet = document.createElement('canvas'); sheet.width = img.width; sheet.height = img.height;
    const sc = sheet.getContext('2d'); sc.drawImage(img, 0, 0);
    // Use the same canvas size and origin to avoid subpixel rasterization differences.
    const cell = document.createElement('canvas'); cell.width = img.width; cell.height = img.height;
    const c = cell.getContext('2d'), death = clipById('death');
    for (let row = 0; row < 8; row++) {
      c.clearRect(0, 0, cell.width, cell.height);
      drawCharacter(c, app, samplePose(death, death.duration), { x: 7 * 192 + 96, y: row * 192 + 192 * .8, scale: 1.6, yaw: DIRECTIONS[row].yaw, time: death.duration });
      const expected = c.getImageData(192 * 7, 192 * row, 192, 192).data;
      const actual = sc.getImageData(192 * 7, 192 * row, 192, 192).data;
      let differentPixels = 0, maxAlphaDelta = 0, maxColorDelta = 0;
      for (let i = 0; i < actual.length; i += 4) {
        const alphaDelta = Math.abs(actual[i + 3] - expected[i + 3]);
        const colorDelta = Math.max(...[0, 1, 2].map((k) => Math.abs(actual[i + k] * actual[i + 3] / 255 - expected[i + k] * expected[i + 3] / 255)));
        maxAlphaDelta = Math.max(maxAlphaDelta, alphaDelta); maxColorDelta = Math.max(maxColorDelta, colorDelta);
        if (alphaDelta > 2 || colorDelta > 2) differentPixels++;
      }
      if (differentPixels > 0) return { match: false, row, differentPixels, maxAlphaDelta, maxColorDelta };
    }
    return { match: true };
  }, { png: png.bytes.toString('base64'), app: await appearance() });
  assert.ok(finalFrameMatches.match, `死亡精灵图最后一列应包含完整终态: ${JSON.stringify(finalFrameMatches)}`);
  const json = await downloadBytes('#export');
  assert.deepEqual(JSON.parse(json.bytes.toString()), await appearance());
  const exported = await appearance();
  await page.locator('[data-style="chibi"]').click();
  await page.locator('#file').setInputFiles({ name: 'character.json', mimeType: 'application/json', buffer: json.bytes });
  await page.waitForFunction(style => document.documentElement.dataset.style === style, testedStyle);
  assert.deepEqual(await appearance(), exported, '配置导入应完整恢复');
  await page.reload();
  assert.deepEqual(await appearance(), exported, '刷新后应恢复当前风格');

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1050 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px 横向溢出`);
    if (width === 320) await screenshot('verified-mobile');
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ style: testedStyle, choices, renders, png: [1536, 1536], errors, passed: 'profiles, catalogs, death, replay, exports, import, reload, responsive' }));
} finally { await browser.close(); }
