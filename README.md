# Opus Sprite

TypeScript + Vite + Canvas 2D 的 Q 版纸娃娃编辑器。角色由路径和 16 根骨骼绘制，支持八方向动画与透明 PNG 精灵图导出。

## 使用

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm test
npm run build
```

右侧选择 `chibi` 或国风 Q 版，再选择性别与部位。两套风格、男女角色各自保存编辑结果；随机角色和重置作用于当前风格及性别。旧 JSON 配置没有 `style` 字段时按 `chibi` 读取。

国风男女各有 14 个部位目录：脸型、耳朵、眉毛、眼睛、鼻子、嘴巴、胡子/面饰、面部特征、发型、头饰、上装、下装、鞋靴、手持物。前 13 个目录各 12 个选项，手持物提供 12 件实物以及随动作、空手，共 340 个选项。女性的胡子目录显示为面饰，包含颊钿、珠链、面纱等。

死亡动作播放一次，完成后保持倒地；点击重播或播放可以再次播放。导出死亡精灵图会包含最终倒地帧。其余动作循环播放。PNG 按行排列八方向，按列排列动画帧，文件名包含风格、性别、动作和帧数。

## 部件与风格扩展

- `src/parts/catalog.ts`：风格注册、男女目录；`getCatalog(style, gender)` 统一查找。
- `src/parts/guofeng-*.ts`：国风五官、发髻冠饰、服饰、武器。
- `src/parts/ornaments.ts`：云纹、莲花、梅花、竹叶等刺绣路径。
- `src/core/appearance.ts`：配置验证和旧配置兼容。
- `src/anim/clips.ts`：骨骼关键帧；`loop: false` 表示单次动作，允许终点 `t: 1`。
- `src/core/animation.ts`：循环/单次采样与姿态混合。

## 浏览器验证

`tests/browser.mjs` 使用独立的 Playwright Chromium 验证所有国风选项的八方向绘制、目录交互、档案恢复、死亡终态、PNG 最终帧、配置导入和响应式布局。需要本机已有 Playwright 及 Chromium；不影响应用依赖。可通过 `SPRITE_PLAYWRIGHT` 指向已有 Playwright 包，`SPRITE_URL` 指向开发服务。

```powershell
$env:SPRITE_PLAYWRIGHT = '你的 Playwright 包绝对路径'
node tests/browser.mjs
```

截图保存在被 Git 忽略的 `.shots/`，测试构建暂存在 `.test-build/`。初始代码快照为本地提交 `01da25d`。
