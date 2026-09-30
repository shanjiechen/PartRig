import type { Gender } from '../core/types';
import { ink, shade } from '../core/color';
import { circle, decal, fs, type RenderCtx } from '../render/context';
import { EARS, BEARDS, type EarDef, type BeardDef, type MarkDef } from './face-extras';
import { MOUTHS, type BrowDef, type EyeDef, type NoseDef } from './features';
import type { FaceDef } from './faces';
import { MOTIFS, drawMotif, ribbon } from './ornaments';

export const gfId = (gender: Gender, slot: string, index: number) => `gf-${gender === 'male' ? 'm' : 'f'}-${slot}-${index}`;
const names = (s: string) => s.split(' ');

export function guofengFace(gender: Gender) {
  const male = gender === 'male';
  const id = (slot: string, i: number) => gfId(gender, slot, i);
  const faceNames = names(male ? '少年圆脸 侠士方脸 温润玉面 书生长脸 将军国字 灵童包子 清俊瓜子 剑客菱脸 胖侠宽脸 仙君鹅蛋 顽童梨脸 狐仙尖脸' : '团子圆脸 玉润鹅蛋 灵动瓜子 桃心小脸 软糯包子 清秀长脸 娇俏菱脸 福气圆面 青莲小脸 婴儿肥脸 杏花梨脸 狐仙尖脸');
  const dims = [[1, 1, .94, .16, .14], [1, 1.02, male ? 1.04 : .85, .3, .08], [.96, 1.03, .77, .55, .06], [.94, 1.05, .87, .28, .04], [1.045, 1, 1.02, .1, .21], [.97, 1.03, .85, .35, .1], [.98, 1.02, .8, .47, .14], [1.055, .99, .98, .13, .18], [.94, 1.01, .81, .48, .08], [1.04, 1.01, 1, .08, .24], [.99, 1.01, 1.04, .13, .2], [.945, 1.035, .74, .64, .06]];
  const face: FaceDef[] = dims.map(([sx, sy, jaw, chin, cheek], i) => ({ id: id('face', i), name: faceNames[i], sx, sy, jaw: jaw * (male ? 1.05 : .97), chin, cheek }));
  const browNames = names(male ? '凌云剑眉 平直浓眉 飞扬墨眉 书生细眉 星河长眉 少年短眉 将军怒眉 温和八字 道长疏眉 刀锋断眉 远山淡眉 卧蚕粗眉' : '柳叶眉 远山眉 新月眉 秋水眉 平烟眉 双燕眉 细黛眉 桃花眉 飞羽眉 轻愁眉 流星眉 娇俏短眉');
  const brows: BrowDef[] = browNames.map((name, i) => ({ id: id('brows', i), name, kind: i === 9 && male ? 'cut' : 'shape',
    w: [3.2, 2.9, 3.1, 2.6, 3.5, 1.9, 3, 2.7, 2.8, 3.1, 3.3, 2.2][i],
    t: (male ? 1.15 : .58) * [1, 1.4, 1.1, .65, .8, 1, 1.3, .9, .6, 1, .65, 1.4][i],
    arch: (male ? [.3, 0, .6, .45, .7, .1, .15, .4, .25, .3, 1.1, .5] : [.55, .65, .8, .45, .2, .75, .5, .65, .35, .5, .6, .4])[i],
    tilt: (male ? [.7, 0, .45, .1, .25, 0, 1, -.65, -.2, .6, 0, .2] : [.04, 0, .16, -.1, .02, .15, .22, -.16, .3, -.45, .1, .2])[i], taper: male ? .45 : .18 }));
  const eyeNames = names(male ? '清朗圆眼 剑客锐眼 温润杏眼 少年星眸 书生细眼 灵狐竖瞳 笑意弯眼 睡意半眼 玄瞳墨眼 仙君宝瞳 桃花长眼 顽童豆眼' : '秋水杏眼 丹凤眼 桃花眼 星河圆眼 柳叶细眼 灵狐竖瞳 月牙笑眼 慵懒半眼 清澈鹿眼 琉璃宝眼 含情长眼 团子豆眼');
  const shapes: EyeDef['shape'][] = ['almond', 'sharp', 'droop', 'round', 'almond', 'almond', 'round', 'half', 'round', 'almond', 'droop', 'round'];
  const eyes: EyeDef[] = eyeNames.map((name, i) => ({ id: id('eyes', i), name, kind: i === 6 ? 'happy' : i === 11 ? 'dot' : 'normal', shape: shapes[i],
    w: [3.1, 3.6, 3.25, 3.45, 3.7, 3.2, 3.05, 3.5, 3.1, 3.3, 3.8, 2.8][i],
    h: [3.9, 3, 3.55, 4.5, 2.1, 3.6, 3.2, 3.4, 4.1, 4.2, 2.6, 3][i] * (male ? .87 : 1),
    iris: .64 + (i % 4) * .07, pupil: i === 5 ? 'slit' : i === 9 ? 'small' : 'round', hl: i % 3 + 1, lash: !male }));
  const noseNames = names('玉珠鼻 小巧点鼻 侧影鼻 秀挺鼻 杏仁鼻 轻翘鼻 水滴鼻 玉钩鼻 软圆鼻 俏尖鼻 元宝鼻 淡描鼻');
  const nose: NoseDef[] = noseNames.map((name, i) => ({ id: id('nose', i), name, size: (.6 + i % 4 * .17) * (1 + Math.floor(i / 4) * .12), draw: (ctx, skin) => {
    const s = (male ? 1.1 : .8) * (.65 + i % 4 * .17) * (1 + Math.floor(i / 4) * .12);
    ctx.save(); ctx.scale(s, s); ctx.beginPath();
    if (i % 4 === 0) { ctx.ellipse(0, .1, .55 + i * .02, .4, 0, 0, Math.PI * 2); fs(ctx, shade(skin, -.2), null); }
    else if (i % 4 === 1) { ctx.moveTo(-.5, -.9); ctx.quadraticCurveTo(-1.1, .5, .65, .5); fs(ctx, null, ink(skin), .5); }
    else if (i % 4 === 2) { ctx.moveTo(-.7, .3); ctx.quadraticCurveTo(0, -1.2, .7, .3); fs(ctx, null, shade(skin, -.35), .5); }
    else { ctx.moveTo(-.45, -.9); ctx.lineTo(.7, .3); ctx.lineTo(-.5, .55); fs(ctx, shade(skin, -.08), ink(skin), .4); }
    if (i >= 8) { circle(ctx, -.7, .6, .18); circle(ctx, .7, .6, .18); fs(ctx, ink(skin), null); }
    ctx.restore();
  } }));
  const mouthNames = names(male ? '温和微笑 爽朗笑口 顽童猫嘴 书生小嘴 冷峻一字 轻愁撇嘴 侠客挑笑 俏皮吐舌 少年虎牙 露齿朗笑 鼓腮嘴 惊讶小口' : '樱桃微笑 含笑朱唇 灵狐小嘴 轻抿樱唇 淡淡一字 轻愁小嘴 桃花浅笑 俏皮吐舌 小虎牙笑 明眸皓齿 娇俏嘟嘴 惊讶樱口');
  const mouth = MOUTHS.slice(0, 12).map((m, i) => ({ ...m, id: id('mouth', i), name: mouthNames[i], draw: (ctx: CanvasRenderingContext2D) => {
    ctx.save(); ctx.scale(male ? 1.05 : .9, male ? .94 : .9); m.draw(ctx, !male);
    if (!male && [0, 3, 4, 6].includes(i)) { ctx.beginPath(); ctx.ellipse(0, .65, .9, .3, 0, 0, 7); fs(ctx, '#b75460', null); }
    ctx.restore();
  } }));
  const earNames = names('玉润耳 小巧耳 福气耳 灵狐耳 山猫耳 玉兔耳 仙灵耳 鲛人耳 铜环耳 玉坠耳 流苏耳 明珠耳');
  const earBase = [0, 1, 2, 8, 7, 10, 3, 5, 0, 1, 0, 1];
  const ears: EarDef[] = earNames.map((name, i) => ({ ...EARS[earBase[i]], id: id('ears', i), name, overHair: i >= 8 || EARS[earBase[i]].overHair,
    draw: (ctx, fill, inner, front) => {
      ctx.save(); ctx.scale(male ? 1.02 : .9, male ? 1.02 : .94); EARS[earBase[i]].draw(ctx, fill, inner, front);
      if (i >= 8) { const col = i === 8 ? '#ba934d' : i === 9 ? '#72a99b' : '#f4dfac';
        circle(ctx, 1, 2.7, i === 11 ? .85 : .65); fs(ctx, col, ink(col), .35);
        if (i !== 11) { ribbon(ctx, 1, 3, 2 + (i - 8) * 1.5, col, .3); circle(ctx, 1.3, 5 + (i - 8) * 1.5, .6); fs(ctx, col, null); }
      } ctx.restore();
    } }));
  const beardNames = names('素面无须 青茬短须 儒士八字 翘角胡须 书生细须 道长山羊 侠客络腮 仙翁长须 下颌短须 连鬓墨须 环口圆须 尖锋美髯');
  const beard: BeardDef[] = male ? BEARDS.slice(0, 12).map((b, i) => ({ ...b, id: id('beard', i), name: beardNames[i] })) : femaleOrnaments(gender);
  const markNames = names(male ? '素净 碧云印 朱莲印 梅花印 竹叶纹 水纹印 铜钱纹 飞鹤印 赤焰印 如意纹 龙鳞纹 星辰印' : '素净 青云钿 莲花钿 梅花妆 青竹钿 水波钿 金钱钿 白鹤钿 火焰钿 如意钿 鱼鳞钿 星子钿');
  const marks: MarkDef[] = markNames.map((name, i) => ({ id: id('marks', i), name, draw: i === 0 ? null : (rc) => {
    decal(rc, 0, -.22, () => drawMotif(rc.ctx, MOTIFS[i - 1], 0, 0, male ? 1.9 : 1.6, male ? '#548a82' : '#c25858'));
    if (i % 3 === 0) for (const side of [-1, 1]) decal(rc, side * .62, .5, () => drawMotif(rc.ctx, MOTIFS[i - 1], 0, 0, .9, '#c98b69'));
  } }));
  return { face, brows, eyes, nose, mouth, ears, beard, marks };
}

function femaleOrnaments(gender: Gender): BeardDef[] {
  return names('素面 朱砂颊钿 金珠颊链 青莲面纱 流苏颊饰 桃花面纱 玉叶颊饰 明珠面帘 银月颊链 红绡面纱 蝴蝶颊饰 竹纹面帘').map((name, i) => ({
    id: gfId(gender, 'beard', i), name,
    draw: i === 0 ? undefined : (rc: RenderCtx) => {
      const veil = [3, 5, 7, 9, 11].includes(i);
      const color = ['#c96062', '#d3b477', '#8caeab', '#d3b477', '#e2a5b3', '#78a296', '#dfd6b2', '#b8c5d0', '#bc606e', '#cfad68', '#7ca6a0'][i - 1];
      if (veil) decal(rc, 0, .68, () => {
        const c = rc.ctx; c.beginPath(); c.moveTo(-6, -1.5); c.quadraticCurveTo(0, 1, 6, -1.5); c.lineTo(4.7, 5); c.quadraticCurveTo(0, 7, -4.7, 5); c.closePath();
        c.save(); c.globalAlpha = .8; fs(c, color, ink(color), .4); c.restore();
        drawMotif(c, MOTIFS[i], 0, 3, 1.1, '#f7e6b9');
      }, { minScale: .3 });
      else for (const side of [-1, 1]) decal(rc, side * .72, .5, () => {
        drawMotif(rc.ctx, MOTIFS[i], 0, 0, 1.2, color);
        if (i % 2 === 0) ribbon(rc.ctx, 0, 1, 3.2, color, side * .6);
      });
    },
  }));
}
