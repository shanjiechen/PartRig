import './style.css';
import { CLIPS } from './anim/clips';
import { blendPose, samplePose, type AnimationClip } from './core/animation';
import type { Pose } from './core/skeleton';
import { DIRECTIONS, type Appearance, type SlotId, type Gender, type StyleId } from './core/types';
import { changeAppearance, defaultAppearance, randomAppearance, slotsFor, type Focus } from './parts/index';
import { STYLES } from './parts/catalog';
import { sanitizeAppearance as sanitize } from './core/appearance';
import { CLOTH_TINTS, EYE_COLORS, HAIR_COLORS, SKIN_TONES, type Swatch } from './parts/palettes';
import { drawCharacter } from './render/character';
import { CAM_PITCH } from './render/context';

const STORE_KEY = 'opus-sprite-appearance';

// ---------------- state ----------------

let app: Appearance = loadAppearance() ?? defaultAppearance();
let clip: AnimationClip = CLIPS[0];
let t = 0;
let playing = true;
let speed = 1;
let dirIndex = 0;
let autoRotate = false;
let rotateTimer = 0;
let view: 'single' | 'eight' = 'single';
let activeSlot: SlotId = 'hair';
let prevPose: Pose | null = null;
let blend = 1;
let lastPose: Pose = samplePose(clip, 0);
const idlePose = samplePose(CLIPS[0], 0.3);

function loadAppearance(key = STORE_KEY): Appearance | null {
  try {
    const s = localStorage.getItem(key);
    return s ? sanitize(JSON.parse(s)) : null;
  } catch {
    return null;
  }
}

function setApp(next: Appearance) {
  app = next;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(app));
    localStorage.setItem(`${STORE_KEY}:${app.style}:${app.gender}`, JSON.stringify(app));
  } catch { /* The editor still works when browser storage is unavailable. */ }
  renderPanel();
}

function switchProfile(style: StyleId, gender: Gender) {
  try { localStorage.setItem(`${STORE_KEY}:${app.style}:${app.gender}`, JSON.stringify(app)); } catch {}
  const stored = loadAppearance(`${STORE_KEY}:${style}:${gender}`);
  setApp(stored?.style === style && stored.gender === gender ? stored : changeAppearance(app, style, gender));
}

// ---------------- layout ----------------

const root = document.getElementById('app')!;
root.innerHTML = `
<header><h1>Q版纸娃娃动画系统</h1><small>2.5D 骨骼 · 八方向 · 部件自由组合</small></header>
<main>
  <section class="card stage">
    <canvas id="stage" role="img" aria-label="角色骨骼动画预览"></canvas>
    <div class="controls">
      <div>
        <div class="label" style="margin:10px 0 6px">朝向</div>
        <div class="dpad" id="dpad"></div>
      </div>
      <div style="flex:1">
        <div class="label" style="margin:10px 0 6px">动作</div>
        <div class="anims" id="anims"></div>
        <div class="row">
          <button id="play">暂停</button>
          <button id="replay">重播</button>
          <label class="label" for="speed">速度</label><input id="speed" type="range" min="0.2" max="2" step="0.05" value="1" />
          <div class="seg"><button data-view="single" class="active">单视图</button><button data-view="eight">八方向</button></div>
        </div>
      </div>
    </div>
    <div class="row">
      <button class="primary" id="random">随机角色</button>
      <button id="reset">重置</button>
      <label class="label" for="frames">帧数</label><input id="frames" type="number" min="2" max="24" value="8" style="width:56px" />
      <button id="sheet">导出精灵图 PNG</button>
      <button id="export">导出配置</button>
      <button id="import">导入配置</button>
      <input id="file" type="file" accept="application/json" hidden />
    </div>
    <div class="hint">精灵图按行输出 8 个方向（下、左下、左、左上、上、右上、右、右下），按列输出动画帧。动作数据为关键帧 JSON 格式，后续可直接接入录制的骨骼动作。</div>
  </section>
  <section class="card">
    <div class="row style-row"><span class="label">风格</span><div class="seg" id="styles"></div></div>
    <p class="catalog-summary" id="catalogSummary" aria-live="polite"></p>
    <div class="row" style="margin-top:0">
      <span class="label">性别</span>
      <div class="seg" id="gender"><button data-g="female">女</button><button data-g="male">男</button></div>
    </div>
    <div class="row"><span class="label">肤色</span><div class="swatches" id="skin"></div></div>
    <div class="row"><span class="label">发色</span><div class="swatches" id="hairc"></div></div>
    <div class="row"><span class="label">瞳色</span><div class="swatches" id="eyec"></div></div>
    <div class="tabs" id="tabs"></div>
    <div class="row" id="tintRow" style="margin:0 0 10px"><span class="label">颜色</span><div class="swatches" id="tint"></div></div>
    <div class="grid" id="grid"></div>
  </section>
</main>`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const stage = $<HTMLCanvasElement>('stage');
const sctx = stage.getContext('2d')!;
const dpr = Math.min(2, window.devicePixelRatio || 1);
const STAGE = 600;
stage.width = STAGE * dpr;
stage.height = STAGE * dpr;

// direction pad: screen layout -> DIRECTIONS index
const PAD = [['NW', 'N', 'NE'], ['W', '', 'E'], ['SW', 'S', 'SE']];
const ARROWS: Record<string, string> = { NW: '↖', N: '↑', NE: '↗', W: '←', E: '→', SW: '↙', S: '↓', SE: '↘' };
$('dpad').innerHTML = PAD.flat()
  .map((id) => (id ? `<button data-dir="${id}" title="${DIRECTIONS.find((d) => d.id === id)!.name}">${ARROWS[id]}</button>` : `<button data-rot="1" title="自动旋转">⟳</button>`))
  .join('');
$('anims').innerHTML = CLIPS.map((c) => `<button data-clip="${c.id}">${c.name}</button>`).join('');
$('styles').innerHTML = STYLES.map((s) => `<button data-style="${s.id}">${s.name}</button>`).join('');

function swatchHtml(list: Swatch[], current: string | undefined, withNone = false) {
  const none = withNone ? `<button class="swatch none ${current ? '' : 'active'}" data-c="" title="默认"></button>` : '';
  return none + list.map((s) => `<button class="swatch ${s.color === current ? 'active' : ''}" data-c="${s.color}" title="${s.name}" style="background:${s.color}"></button>`).join('');
}

function syncControls() {
  document.querySelectorAll<HTMLButtonElement>('#dpad button[data-dir]').forEach((b) => b.classList.toggle('active', b.dataset.dir === DIRECTIONS[dirIndex].id));
  document.querySelector<HTMLButtonElement>('#dpad [data-rot]')!.classList.toggle('active', autoRotate);
  document.querySelectorAll<HTMLButtonElement>('#anims button').forEach((b) => b.classList.toggle('active', b.dataset.clip === clip.id));
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  $('play').textContent = playing ? '暂停' : '播放';
}

// ---------------- panel & thumbnails ----------------

const FOCUS: Record<Focus, { cy: number; scale: number; yaw: number }> = {
  face: { cy: 54, scale: 2.2, yaw: 0 },
  head: { cy: 57, scale: 1.35, yaw: 0.3 },
  body: { cy: 40, scale: 0.86, yaw: 0.35 },
  legs: { cy: 14, scale: 1.8, yaw: 0.5 },
};

function drawThumb(canvas: HTMLCanvasElement, variant: Appearance, focus: Focus, slot: SlotId) {
  const size = 84;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const c = canvas.getContext('2d')!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const f = { ...FOCUS[focus] };
  if (variant.style === 'guofeng' && focus === 'head') f.scale = 1.15;
  if (slot === 'weapon') { f.cy = 28; f.scale = 1.8; }
  const yaw = slot === 'weapon' ? 0.9 : slot === 'ears' ? 0.25 : f.yaw;
  drawCharacter(c, variant, idlePose, {
    x: size / 2,
    y: size / 2 + f.cy * Math.cos(CAM_PITCH) * f.scale,
    scale: f.scale,
    yaw,
    time: 0.5,
    effects: false,
    shadow: focus === 'body',
    prop: 'none',
  });
}

function renderPanel() {
  document.documentElement.dataset.style = app.style;
  document.querySelectorAll<HTMLButtonElement>('#styles button').forEach((b) => {
    b.classList.toggle('active', b.dataset.style === app.style);
    b.setAttribute('aria-pressed', String(b.dataset.style === app.style));
  });
  document.querySelectorAll<HTMLButtonElement>('#gender button').forEach((b) => {
    b.classList.toggle('active', b.dataset.g === app.gender);
    b.setAttribute('aria-pressed', String(b.dataset.g === app.gender));
  });
  $('skin').innerHTML = swatchHtml(SKIN_TONES, app.skin);
  $('hairc').innerHTML = swatchHtml(HAIR_COLORS, app.hairColor);
  $('eyec').innerHTML = swatchHtml(EYE_COLORS, app.eyeColor);
  const slots = slotsFor(app);
  $('tabs').innerHTML = slots.map((s) => `<button data-slot="${s.id}" aria-pressed="${s.id === activeSlot}" class="${s.id === activeSlot ? 'active' : ''}">${s.name}</button>`).join('');
  const slot = slots.find((s) => s.id === activeSlot)!;
  $('catalogSummary').textContent = `${STYLES.find((s) => s.id === app.style)!.description} · ${app.gender === 'male' ? '男' : '女'}款${slot.name} ${slot.items.length} 种`;
  $('tintRow').style.display = slot.tint ? '' : 'none';
  if (slot.tint) $('tint').innerHTML = swatchHtml(CLOTH_TINTS, app.tints[slot.tint], true);
  const grid = $('grid');
  grid.innerHTML = slot.items
    .map((it) => `<button class="item ${app.parts[slot.id] === it.id ? 'active' : ''}" aria-pressed="${app.parts[slot.id] === it.id}" data-item="${it.id}"><canvas aria-hidden="true"></canvas>${it.name}</button>`)
    .join('');
  grid.querySelectorAll<HTMLButtonElement>('.item').forEach((el) => {
    const variant: Appearance = { ...app, parts: { ...app.parts, [slot.id]: el.dataset.item! } };
    if (slot.id === 'weapon' && el.dataset.item === 'auto') variant.parts.weapon = 'none';
    drawThumb(el.querySelector('canvas')!, variant, slot.focus, slot.id);
  });
}

// ---------------- events ----------------

function setClip(next: AnimationClip) {
  prevPose = lastPose;
  blend = 0;
  clip = next;
  t = 0;
  playing = true;
  syncControls();
}

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('button, .item');
  if (!el) return;
  const d = el.dataset;
  if (d.dir) {
    dirIndex = DIRECTIONS.findIndex((x) => x.id === d.dir);
    autoRotate = false;
  } else if (d.rot) autoRotate = !autoRotate;
  else if (d.clip) setClip(CLIPS.find((c) => c.id === d.clip)!);
  else if (d.view) view = d.view as typeof view;
  else if (d.slot) {
    activeSlot = d.slot as SlotId;
    renderPanel();
  } else if (d.item) setApp({ ...app, parts: { ...app.parts, [activeSlot]: d.item } });
  else if (d.g) switchProfile(app.style, d.g === 'male' ? 'male' : 'female');
  else if (d.style && STYLES.some((s) => s.id === d.style)) switchProfile(d.style as StyleId, app.gender);
  else if (d.c !== undefined) {
    const group = el.parentElement!.id;
    const c = d.c;
    if (group === 'skin') setApp({ ...app, skin: c });
    else if (group === 'hairc') setApp({ ...app, hairColor: c });
    else if (group === 'eyec') setApp({ ...app, eyeColor: c });
    else if (group === 'tint') {
      const slot = slotsFor(app).find((s) => s.id === activeSlot)!;
      const tints = { ...app.tints };
      if (c) tints[slot.tint!] = c;
      else delete tints[slot.tint!];
      setApp({ ...app, tints });
    }
  }
  syncControls();
});

$('play').onclick = () => {
  if (!playing && clip.loop === false && t >= clip.duration) t = 0;
  playing = !playing;
  syncControls();
};
$('replay').onclick = () => setClip(clip);
$<HTMLInputElement>('speed').oninput = (e) => (speed = +(e.target as HTMLInputElement).value);
$('random').onclick = () => setApp(randomAppearance(app.style, app.gender));
$('reset').onclick = () => setApp(defaultAppearance(app.style, app.gender));

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

$('export').onclick = () => download(new Blob([JSON.stringify(app, null, 2)], { type: 'application/json' }), `${app.style}_${app.gender}_character.json`);
$('import').onclick = () => $<HTMLInputElement>('file').click();
$<HTMLInputElement>('file').onchange = async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    const next = sanitize(JSON.parse(await f.text()));
    if (next) setApp(next);
    else alert('配置文件格式不正确');
  } catch {
    alert('无法解析配置文件');
  }
  (e.target as HTMLInputElement).value = '';
};

$('sheet').onclick = () => {
  const frames = Math.max(2, Math.min(24, Math.round(+$<HTMLInputElement>('frames').value) || 8));
  const cell = 192, scale = 1.6;
  const cv = document.createElement('canvas');
  cv.width = cell * frames;
  cv.height = cell * DIRECTIONS.length;
  const c = cv.getContext('2d')!;
  DIRECTIONS.forEach((dir, r) => {
    for (let f = 0; f < frames; f++) {
      const time = (f / (clip.loop === false ? frames - 1 : frames)) * clip.duration;
      drawCharacter(c, app, samplePose(clip, time), {
        x: f * cell + cell / 2,
        y: r * cell + cell * 0.8,
        scale,
        yaw: dir.yaw,
        time,
        prop: clip.prop,
        poseAt: (dt) => samplePose(clip, time + dt),
      });
    }
  });
  cv.toBlob((b) => b && download(b, `${app.style}_${app.gender}_${clip.id}_8dir_${frames}f.png`));
};

// ---------------- main loop ----------------

function drawBackdrop(c: CanvasRenderingContext2D, x: number, y: number, rx: number) {
  c.save();
  c.beginPath();
  c.ellipse(x, y, rx, rx * 0.3, 0, 0, Math.PI * 2);
  const g = c.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, app.style === 'guofeng' ? 'rgba(164,186,155,0.45)' : 'rgba(210,190,235,0.55)');
  g.addColorStop(1, app.style === 'guofeng' ? 'rgba(164,186,155,0)' : 'rgba(210,190,235,0)');
  c.fillStyle = g;
  c.fill();
  c.restore();
}

let lastTs = performance.now();
function frame(ts: number) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  if (playing) {
    t += dt * speed;
    blend = Math.min(1, blend + (dt * speed) / 0.2);
    if (clip.loop === false && t >= clip.duration) {
      t = clip.duration;
      playing = false;
      syncControls();
    }
  }
  if (autoRotate) {
    rotateTimer += dt;
    if (rotateTimer > 1.2) {
      rotateTimer = 0;
      dirIndex = (dirIndex + 1) % DIRECTIONS.length;
      syncControls();
    }
  }
  let pose = samplePose(clip, t);
  if (prevPose && blend < 1) pose = blendPose(prevPose, pose, blend);
  lastPose = pose;
  const time = t;
  const opts = { time, prop: clip.prop, poseAt: (d: number) => samplePose(clip, time + d) };

  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.clearRect(0, 0, STAGE, STAGE);
  if (view === 'single') {
    drawBackdrop(sctx, STAGE / 2, STAGE * 0.8, 170);
    drawCharacter(sctx, app, pose, { ...opts, x: STAGE / 2, y: STAGE * 0.8, scale: 4.1, yaw: DIRECTIONS[dirIndex].yaw });
  } else {
    sctx.font = '13px sans-serif';
    sctx.textAlign = 'center';
    DIRECTIONS.forEach((d, i) => {
      const cx = ((i % 4) + 0.5) * (STAGE / 4);
      const cy = (Math.floor(i / 4) + 1) * (STAGE / 2) - 44;
      drawBackdrop(sctx, cx, cy, 55);
      drawCharacter(sctx, app, pose, { ...opts, x: cx, y: cy, scale: clip.loop === false ? 1.35 : 1.95, yaw: d.yaw });
      sctx.fillStyle = '#8a7a98';
      sctx.fillText(d.name, cx, cy + 30);
    });
  }
  requestAnimationFrame(frame);
}

syncControls();
renderPanel();
requestAnimationFrame(frame);

if (import.meta.env.DEV) {
  // Dev-only hook for inspecting exact frames from the browser console.
  Object.assign(window, {
    __sprite: {
      at(clipId: string, time: number, dir = 0) {
        clip = CLIPS.find((c) => c.id === clipId) ?? clip;
        t = time;
        dirIndex = dir;
        playing = false;
        prevPose = null;
        syncControls();
      },
      set(parts: Partial<Appearance['parts']>) {
        setApp({ ...app, parts: { ...app.parts, ...parts } });
      },
    },
  });
}
