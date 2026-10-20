# PartRig · 拼偶

<p>
  <a href="./README.md">简体中文</a> · <a href="./README.en.md">English</a>
</p>

**PartRig** is a chibi paper-doll animation editor built with TypeScript + Vite + Canvas 2D. Characters are drawn from vector paths and driven by a 16-bone rig, with 8-directional animation and transparent PNG sprite-sheet export. Zero runtime dependencies — a ready-to-use tool for previewing and producing indie game art assets.

<p align="center">
  <img src="docs/image-1.png" alt="PartRig editor: character preview and clip controls on the left, style/part/palette panel on the right" width="960" />
</p>

## Features

- **Vector parts + skeletal animation**: every part is drawn with Canvas paths and driven by keyframed bones (16-bone rig); 2.5D camera with pitch projection, soft shading, fine outlines, iris textures and cloth folds.
- **8-directional animation**: 8 facing directions (down, down-left, left, up-left, up, up-right, right, down-right), switchable in real time for any clip.
- **Three art styles**: `chibi`, `guofeng` (Chinese classical style) and `aistory` (adventure style). Male and female characters keep separate saved outfits per style.
- **Massive part combinations**: the guofeng style has 14 equipment slots per gender (face, features, hair, headwear, clothing, handheld items, …), 12+ options each — 340+ items in total. Skin, hair, eye and cloth tinting included.
- **Sprite-sheet export**: one click exports a transparent PNG — 8 direction rows × animation frame columns, with style/gender/clip/frame-count encoded in the filename.
- **Config import/export**: JSON character configs with per-style/gender local profiles, random character generator, and full import/export. Old configs stay compatible.
- **Zero dependencies**: no runtime dependencies, tiny build output.

## Quick Start

```sh
npm ci
npm run dev -- --host 127.0.0.1   # dev server
npm test                          # unit/regression tests
npm run build                     # production build
```

Requires Node.js 18+.

## Usage

- Pick a style (`chibi` / guofeng / aistory) in the right panel, then choose a gender and a part slot.
- **Clips**: idle, wave, slash, etc. loop; **death** plays once and holds the fallen pose (replayable), and exported sheets include the final frame.
- **Direction**: use the d-pad to switch among 8 directions; the ⟳ button toggles auto-rotation.
- **Export spritesheet**: 2–24 frames; layout is 8 rows (directions) × N columns (frames) on a transparent background.
- Configs are stored in `localStorage`, profiled by style + gender; exported JSON can be imported on other devices.
- Legacy JSON configs without a `style` field are read as `chibi`; invalid part IDs fall back safely.

### Sprite-sheet layout

```
frame →  0    1    2   ...  N-1
down     [●]  [●]  [●]      [●]
down-l   [●]  [●]  [●]      [●]
...      ...
up-r     [●]  [●]  [●]      [●]
```

Cells are 192×192 and drop straight into any mainstream game engine's sprite renderer.

## Project Structure

| Module | Responsibility |
| --- | --- |
| `src/parts/catalog.ts` | Style registry and per-gender catalogs; unified lookup via `getCatalog(style, gender)` |
| `src/parts/guofeng-*.ts` | Guofeng facial features, hair/crowns, outfits, weapons |
| `src/parts/aistory*.ts` | Aistory adventure parts, bangs, high ponytail, travel gear and accessories |
| `src/parts/ornaments.ts` | Embroidery paths: clouds, lotus, plum blossom, bamboo, … |
| `src/parts/palettes.ts` | Skin, hair, eye and cloth tint palettes |
| `src/core/skeleton.ts` | 16-bone skeleton definition |
| `src/core/animation.ts` | Looping/one-shot sampling and pose blending |
| `src/anim/clips.ts` | Bone keyframe clips; `loop: false` marks one-shot clips |
| `src/core/appearance.ts` | Config validation and legacy compatibility |
| `src/render/` | Canvas drawing and camera projection |
| `src/main.ts` | Editor UI and interaction |

## Testing

```sh
npm test                           # core regression tests
node tests/render-regression.mjs   # pixel regression (8 directions, 4,752 frames)
node tests/browser.mjs             # end-to-end browser checks (needs Playwright + Chromium)
node tests/visual-preview.mjs      # generate clip/face-shape visual previews
```

Browser tests are optional and never affect app dependencies. Point to an existing Playwright install via env vars:

```powershell
$env:SPRITE_PLAYWRIGHT = 'absolute path to your Playwright package'
$env:SPRITE_URL = 'http://127.0.0.1:5173/'
$env:SPRITE_STYLE = 'aistory'   # style under test (default: guofeng)
node tests/browser.mjs
```

Screenshots go to the Git-ignored `.shots/` folder; test builds are staged in `.test-build/`.

## Roadmap

- [ ] Clip recording/import (clips are keyframe JSON; the entry point is already wired)
- [ ] Custom part packs (register new styles from external JSON)
- [ ] More export sizes and GIF/WebP animation export

## Contributing

Issues and PRs are welcome! When adding parts, follow the existing single-quote, naming and path-drawing conventions; run `npm test` and `npm run build` before submitting.

## License

[MIT](./LICENSE) (to be added)
