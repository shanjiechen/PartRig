import type { Gender } from '../core/types';
import type { Vec3 } from '../core/math';
import { ink, shade } from '../core/color';
import { circle, decal, drawLimb, fs, materialFill, polyPath, star } from '../render/context';
import { WEAPONS, type WeaponDef } from '../render/props';
import type { PartCatalog } from './catalog';
import { FACES } from './faces';
import { BROWS, EYES, MOUTHS, NOSES } from './features';
import { BEARDS, EARS, MARKS, type BeardDef } from './face-extras';
import { HATS } from './headwear';
import { aistoryHair } from './aistory-hair';
import { aistoryClothing } from './aistory-clothing';

function aistoryWeapons(gender: Gender): WeaponDef[] {
  const id = (name: string) => `ai-${gender[0]}-weapon-${name}`;
  const weapons = WEAPONS.map(w => ({ ...w, id: ['auto','none'].includes(w.id) ? w.id : id(w.id) }));
  const extra: WeaponDef[] = [
    { id: id('hammer'), name: '探险战锤', hand: 'R', tip: [0,-1.4,16], base: [0,-1.4,10], draw: (rc,P) => {
      drawLimb(rc.ctx, [{ a: P([0,-1.4,-2]), b: P([0,-1.4,14]), w: 1.2, color: '#785739' }]);
      const q = (v: Vec3) => P(v);
      polyPath(rc.ctx, [q([-4,-3.4,12]),q([-4,.6,12]),q([4,.6,12]),q([4,-3.4,12])]);
      const c = P([0,-1.4,12]); fs(rc.ctx, materialFill(rc.ctx,'#9aa8a1',c.x,c.y,4), '#3e5147', .5);
    } },
    { id: id('book'), name: '旅行魔典', hand: 'L', effect: 'wand', draw: (rc,P) => {
      polyPath(rc.ctx, [P([-4,-4,3]),P([-4,1,3]),P([4,1,3]),P([4,-4,3])]); fs(rc.ctx,'#564536','#2e2b2a',.6);
      polyPath(rc.ctx, [P([-3.5,-3.4,3.1]),P([-3.5,.5,3.1]),P([3.5,.5,3.1]),P([3.5,-3.4,3.1])]); fs(rc.ctx,'#ded4b6',null);
      const a=P([0,-3.4,3.2]),b=P([0,.5,3.2]); rc.ctx.beginPath();rc.ctx.moveTo(a.x,a.y);rc.ctx.lineTo(b.x,b.y);fs(rc.ctx,null,'#9a896a',.4);
    } },
    { id: id('lantern'), name: '黄铜提灯', hand: 'R', draw: (rc,P) => {
      const c=P([0,-5,1]); circle(rc.ctx,c.x,c.y,2.5); fs(rc.ctx, materialFill(rc.ctx,'#ebce74',c.x,c.y,3), '#79603e', .7);
      polyPath(rc.ctx,[P([-2,-2.5,1]),P([2,-2.5,1]),P([2,-7.5,1]),P([-2,-7.5,1])]);fs(rc.ctx,null,'#866443',.6);
      const a=P([0,-1.4,1]),b=P([0,-2.5,1]);drawLimb(rc.ctx,[{a,b,w:.7,color:'#866443'}]);
    } },
  ];
  return [...weapons, ...extra];
}

export function aistoryCatalog(gender: Gender): PartCatalog {
  const male = gender === 'male';
  const id = (slot: string, source: string) => `ai-${gender[0]}-${slot}-${source}`;
  const copy = <T extends { id: string }>(slot: string, source: T[]) => source.slice(0,12).map(p => ({...p,id:id(slot,p.id)}));
  const femaleAccessories: BeardDef[] = ['无','林地颊纹','旅人雀斑','绿叶颊饰','月光印记','探险创可贴','小花贴饰','星光颊饰','细链面饰','战斗绷带','银色耳坠','琥珀颊珠'].map((name,i) => ({
    id:id('beard',String(i)), name, draw: i===0 ? undefined : rc => {
      decal(rc, i%2 ? .65 : -.65, .48, () => {
        const {ctx}=rc;
        if (i===2) for (const x of [-.7,0,.7]) { circle(ctx,x,(x===0 ? .2 : -.2),.13);fs(ctx,'#94715a',null); }
        else if (i===1) { for (const y of [-.4,.35]) { ctx.beginPath();ctx.moveTo(-.9,y);ctx.quadraticCurveTo(0,y+.35,.9,y-.3);fs(ctx,null,'#71835b',.25); } }
        else if (i===3) { ctx.beginPath();ctx.moveTo(-.7,.4);ctx.quadraticCurveTo(-.7,-.9,.7,-.5);ctx.quadraticCurveTo(.9,.6,-.7,.4);fs(ctx,'#8d9e6b','#5d714e',.18); }
        else if (i===4) { ctx.beginPath();ctx.arc(0,0,.65,-1.25,1.25);ctx.quadraticCurveTo(-.15,0,.2,-.61);fs(ctx,'#d8cba0','#928259',.18); }
        else if (i===5 || i===9) {
          ctx.save();ctx.rotate(i===9 ? -.65 : .2);ctx.beginPath();ctx.roundRect(-1.2,-.55,2.4,1.1,.2);fs(ctx,'#e9d9b6','#a6987b',.2);
          ctx.beginPath();ctx.rect(-.35,-.38,.7,.76);fs(ctx,'#c9bda3',null);ctx.restore();
        }
        else if (i===6) { for (let p=0;p<5;p++) { const a=p*Math.PI*2/5;circle(ctx,Math.cos(a)*.4,Math.sin(a)*.4,.26);fs(ctx,'#d5afa2',null); }circle(ctx,0,0,.2);fs(ctx,'#d3b477',null); }
        else if (i===7) { star(ctx,0,0,.8,5,.42);fs(ctx,'#d5c280','#978159',.18); }
        else if (i===8) { ctx.beginPath();ctx.moveTo(-1,-.2);ctx.quadraticCurveTo(0,1,1,-.2);fs(ctx,null,'#c0b28e',.18);for (const x of [-.8,0,.8]) { circle(ctx,x,.5-Math.abs(x)*.55,.18);fs(ctx,'#cab890',null); } }
        else if (i===10) { ctx.beginPath();ctx.moveTo(0,-.7);ctx.lineTo(0,.5);fs(ctx,null,'#a8adb0',.18);polyPath(ctx,[{x:0,y:.3},{x:.4,y:.9},{x:0,y:1.4},{x:-.4,y:.9}]);fs(ctx,'#d4d8d1','#919b99',.15); }
        else { circle(ctx,0,0,.5);fs(ctx,materialFill(ctx,'#bd9049',0,0,.7),shade('#bd9049',-.25),.2); }
      }, {min:.05});
    },
  }));
  const hatIds = ['none','headband','bandana','straw','witch','helmet','crown','wreath','hairpin','bow','horns','beret'];
  const headwear = hatIds.map((source,i) => {
    const h = HATS.find(h=>h.id===source)!;
    return {...h,id:id('headwear',source),color: ['#334132','#6c8553','#6e4f36','#ae9868','#575267','#a1aaa3','#b79a5d','#8da26d','#b39a66','#6b865b','#514643','#697351'][i],color2:'#d9c89c'};
  });
  const weapon = aistoryWeapons(gender);
  return {
    face: copy('face',FACES).map(f=>({...f,sx:f.sx*.96,sy:f.sy*.97,jaw:f.jaw*(male ? .93 : .86),chin:Math.min(.9,f.chin+.12)})),
    ears: copy('ears',EARS).map(e=>({...e,draw:(ctx,fill,inner,front)=>{ctx.save();ctx.scale(.85,.88);e.draw(ctx,fill,inner,front);ctx.restore();}})),
    brows: copy('brows',BROWS).map(b=>({...b,w:(b.w??2.8)*.8,t:(b.t??1)*(male ? .65 : .48),tilt:(b.tilt??0)*.6})),
    eyes: copy('eyes',EYES).map(e=>({...e,name:e.id==='big' ? '旅人杏眼' : e.name,shape:e.shape==='round' ? 'almond' as const : e.shape,w:(e.w??3.2)*.75,h:(e.h??4)*(male ? .68 : .72),iris:.79,hl:Math.min(e.hl??1,1),lash:!male})),
    nose: copy('nose',NOSES), mouth: copy('mouth',MOUTHS).map(m=>({...m,draw:(ctx,female)=>{ctx.save();ctx.scale(.72,.72);m.draw(ctx,female);ctx.restore();}})),
    beard: male ? copy('beard',BEARDS) : femaleAccessories,
    marks: copy('marks',MARKS), hair: aistoryHair(gender), headwear,
    ...aistoryClothing(gender), weapon,
    autoProps: Object.fromEntries(['sword','spear','bow','staff','potion'].map(p=>[p,id('weapon',p)])),
  };
}
