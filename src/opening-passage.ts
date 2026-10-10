import * as T from 'three';
import {dawnWorld,profile,beam,cable,foldedBody,fragments,look,smooth,clamp,lerp,type V,type World} from './opening-world';
import {directedWorld} from './world-direction';

import {openingPassagePose} from './opening-camera';
export {OPENING_PASSAGE_END} from './opening-camera';

export function makeOpeningPassage():World{
 const w=dawnWorld(true),shellMotion=w.moving.splice(0);
 const dawnLights=w.scene.children.filter((o):o is T.Light=>o instanceof T.Light).map(light=>({light,power:light.intensity}));
 const entry=new T.Group();entry.position.set(30,32,-70);w.root.add(entry);
 const shutters=[-1,1].map(side=>profile(entry,[[side*.08,-240],[side*340,-240],[side*300,255],[side*.08,225]],11,[0,0,0],[0,0,0],'navy','blackglass'));
 const trace=beam(entry,[0,-85,-6],[0,84,-6],.06,.08,'energy');
 // A last warm light guides the opening; the shell is a passage, not a boot
 // warning. This material is private, so later cyan cores retain their identity.
 trace.material=new T.MeshBasicMaterial({color:'#efe0c4'});
 const distantGlow=new T.PointLight('#ffe4c4',0,820,1.7);distantGlow.position.set(-140,-15,610);w.scene.add(distantGlow);

 // The back of the shell leads into an asymmetric, curved chamber. It shares
 // the shell's actual coordinates and opens onto the island world at z=700.
 const chamber=new T.Group();w.root.add(chamber);
 const centre=(s:number)=>new T.Vector3(lerp(76,-140,s),lerp(62,-50,s),165+s*395);
 foldedBody(chamber,(s,v)=>{const c=centre(s),a=(v+.5)*Math.PI*1.74+.22,r=68+Math.sin(s*Math.PI)*23;return c.add(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,0))},'navy',8,'stone');
 for(let i=0;i<3;i++){
  const s=.25+i*.23,c=centre(s),a=i*.52;
  cable(chamber,[[c.x-54,c.y-24,c.z],[c.x-38,c.y+53,c.z+12],[c.x+30,c.y+62,c.z+32]],.34,'silver');
  profile(chamber,[[-32,-42],[24,-34],[41,13],[-11,32]],1.1,[c.x+(i%2?35:-33),c.y,c.z],[.1,-.2,a],'glass','silver');
 }
 cable(chamber,[[65,45,170],[12,10,310],[-58,-20,440],[-136,-43,555]],.085,'energy');
 fragments(w,150,120,500,'silver',2601);
 // The rear shell lips physically separate before the lens reaches them.
 const shellParts=w.primary!.children.slice(0,3).map((part,i)=>({part,rest:part.position.clone(),direction:i===0?-1:1}));

 const destination=directedWorld('continent')!;
 destination.root.position.z=700;w.root.add(destination.root);
 const destinationLights=destination.scene.children.filter((o):o is T.Light=>o instanceof T.Light).map(light=>{
  const power=light.intensity;light.position.z+=700;
  if(light instanceof T.DirectionalLight){light.target.position.z+=700;w.scene.add(light.target)}
  w.scene.add(light);return {light,power};
 });
 w.scene.background=destination.scene.background;
 w.scene.fog=new T.Fog('#a8bfd2',800,2000);
 w.moving.push((time,hit)=>{
  const shellU=time<=5.321?.9:time<7.3833?lerp(.9,3.4,(time-5.321)/2.0623):lerp(3.4,6.68,clamp((time-7.3833)/1.9167));
  shellMotion.forEach(move=>move(shellU,hit));
  const opening=smooth(2.95,5.22,time);
  shutters.forEach((part,i)=>{part.position.x=(i?1:-1)*opening*260;part.rotation.y=(i?1:-1)*opening*.16});
  trace.scale.y=.05+smooth(.12,2.4,time)*.95;trace.visible=time<4.9;
  const daylight=smooth(4.35,5.3,time),outside=1-smooth(8.3,9.15,time);
  dawnLights.forEach(({light,power})=>{light.intensity=power*lerp(.025,1,daylight)*lerp(.11,1,outside)});
  const release=smooth(9.6,10.85,time);
  distantGlow.intensity=lerp(7,23,smooth(3.2,5.321,time))*(1-smooth(10.5,12,time));
  destinationLights.forEach(({light,power})=>{light.intensity=power*lerp(.08,1,release)});
  shellParts.forEach(({part,rest,direction},i)=>{part.position.copy(rest);part.position.x+=direction*smooth(7.6,8.7,time)*(i===0?13:22);part.position.z+=smooth(7.6,8.7,time)*(i===0?0:10)});
  const q=clamp((time-10.5)/1.5);destination.moving.forEach(move=>move(q,hit));
 });
 w.camera=(time,c)=>{const p=openingPassagePose(time);look(c,p.position,p.target,p.fov,p.roll)};
 return w;
}
