import {Euler,Matrix4,Vector3} from 'three';
import audio from './data/audio-analysis.json';
import lyrics from './data/lyrics.json';
import {paintPrintWorld} from './graphic-worlds';
import {heroClips} from './hero-clips';

// NEW DAWN — an architectural film. All animation, camera paths, lighting,
// typography and particles are evaluated from absolute music time.
type V=[number,number,number];
type P=[number,number,number];
type Material='porcelain'|'frost'|'cyan'|'mirror'|'paper'|'light'|'blue';
const W=1920,H=1080,TAU=Math.PI*2;
const ink='#163b60',blue='#245df4',cyan='#00d8ff',gold='#f2ad36',white='#ffffff';
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a:number,b:number,u:number)=>a+(b-a)*u;
const ease=(u:number)=>{u=clamp(u);return u*u*(3-2*u)};
const smooth=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const hash=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v)};
const mod=(x:number,n:number)=>(x%n+n)%n;
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(a:V):V=>{const l=Math.hypot(...a)||1;return[a[0]/l,a[1]/l,a[2]/l]};
let ctx:CanvasRenderingContext2D,t=0,features:number[]=[],pulse=0;
let camera={pos:[0,0,0] as V,right:[1,0,0] as V,up:[0,1,0] as V,forward:[0,0,1] as V,f:1050,cx:960,cy:540};
let queue:{z:number;draw:()=>void}[]=[];
const rotMat=new Matrix4(),rotEuler=new Euler(),vec=new Vector3();
const textures=new Map<string,HTMLCanvasElement>();
let memories:HTMLImageElement[]=[];
export function setMemoryImages(images:HTMLImageElement[]){memories=images}
function view(pos:V,target:V,f=1050,roll=0,cx=960,cy=540){
 const forward=unit(sub(target,pos)),r=unit(cross([0,1,0],forward)),u=cross(forward,r);
 camera={pos,forward,right:add(r.map(x=>x*Math.cos(roll)) as V,u.map(x=>x*Math.sin(roll)) as V),up:add(u.map(x=>x*Math.cos(roll)) as V,r.map(x=>-x*Math.sin(roll)) as V),f,cx,cy};
}
function local(v:V):V{const d=sub(v,camera.pos);return[dot(d,camera.right),dot(d,camera.up),dot(d,camera.forward)]}
function projectLocal(v:V):P{return[camera.cx+v[0]*camera.f/v[2],camera.cy-v[1]*camera.f/v[2],v[2]]}
function project(v:V):P{return projectLocal(local(v))}
function placed(v:V,pos:V,rot:V):V{rotMat.makeRotationFromEuler(rotEuler.set(...rot));vec.set(...v).applyMatrix4(rotMat);return[vec.x+pos[0],vec.y+pos[1],vec.z+pos[2]]}
function rgba(c:string,a:number){const n=parseInt(c.slice(1),16);return`rgba(${n>>16},${n>>8&255},${n&255},${clamp(a)})`}
function tint(c:string,l:number){const n=parseInt(c.slice(1),16);return`rgb(${clamp((n>>16)*l,0,255)},${clamp((n>>8&255)*l,0,255)},${clamp((n&255)*l,0,255)})`}
function fill(c:string,a=1){ctx.save();ctx.globalAlpha*=a;ctx.fillStyle=c;ctx.fillRect(0,0,W,H);ctx.restore()}
function line(x:number,y:number,xx:number,yy:number,c=ink,w=1,a=1){ctx.save();ctx.globalAlpha*=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();ctx.restore()}
function glow(x:number,y:number,r:number,c:string,a=1){ctx.save();ctx.globalAlpha*=a;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()}
function txt(s:string,x:number,y:number,size:number,c=ink,font='Display',align:CanvasTextAlign='left',a=1){ctx.save();ctx.globalAlpha*=clamp(a);ctx.fillStyle=c;ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);ctx.restore()}
function tracking(s:string,x:number,y:number,size:number,spacing:number,c=ink,a=1){ctx.save();ctx.globalAlpha*=clamp(a);ctx.font=`${size}px Text`;ctx.fillStyle=c;for(const ch of s){ctx.fillText(ch,x,y);x+=ctx.measureText(ch).width+spacing}ctx.restore()}
function poly(points:P[]){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath()}
function clipNear(input:V[]):V[]{let out:V[]=[];for(let i=0;i<input.length;i++){const a=input[i],b=input[(i+1)%input.length],ai=a[2]>.5,bi=b[2]>.5;if(ai)out.push(a);if(ai!==bi){const u=(.5-a[2])/(b[2]-a[2]);out.push([mix(a[0],b[0],u),mix(a[1],b[1],u),.5])}}return out}
function face(vertices:V[],material:Material,opacity=1,color?:string){
 const vs=vertices.map(local),clipped=clipNear(vs);if(clipped.length<3)return;
 const ps=clipped.map(projectLocal);if(ps.every(p=>p[0]<-200)||ps.every(p=>p[0]>2120)||ps.every(p=>p[1]<-200)||ps.every(p=>p[1]>1280))return;
 const n=unit(cross(sub(vertices[1],vertices[0]),sub(vertices[2],vertices[0])));
 const z=vs.reduce((s,p)=>s+p[2],0)/vs.length;
 const l=.65+.25*Math.abs(dot(n,unit([-.5,.85,-.6])))+.12*Math.abs(n[1]);
 queue.push({z,draw:()=>{
  ctx.save();ctx.globalAlpha*=opacity;poly(ps);
  const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const g=material==='porcelain'||material==='paper'||material==='blue'||material==='light'?ctx.createLinearGradient(250,-150,1500,1250):ctx.createLinearGradient(minX,minY,maxX+1,maxY+1);
  if(material==='frost'||material==='cyan'){
   const c=color||(material==='cyan'?'#3ca8d1':'#d6edf5');
   g.addColorStop(0,rgba('#ffffff',.85));g.addColorStop(.28,rgba(c,.27));g.addColorStop(.53,rgba('#ffffff',.58));g.addColorStop(1,rgba(c,.65));
   ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=rgba('#ffffff',.9);ctx.lineWidth=1.9;ctx.stroke();
   // A reflected diagonal light stripe differentiates transmissive acrylic.
   ctx.clip();ctx.strokeStyle=rgba('#ffffff',.42);ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(minX-40,maxY);ctx.lineTo(maxX+50,minY);ctx.stroke();
  }else{
   const c=color||({porcelain:'#f6fbff',paper:'#eef1ef',light:'#ffffff',mirror:'#122e4c',blue:'#2462db'}[material]);
   if(material==='mirror'){g.addColorStop(0,'#08152f');g.addColorStop(.43,'#31526b');g.addColorStop(.48,'#badbe7');g.addColorStop(.52,'#173251');g.addColorStop(1,'#071626')}
   else if(material==='light'){g.addColorStop(0,'#ffffff');g.addColorStop(1,'#ffffff')}
   else {g.addColorStop(0,tint(c,l+.06));g.addColorStop(.45,tint(c,l+.025));g.addColorStop(1,tint(c,l-.13))}
   ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=material==='mirror'?'#97c7d8':material==='blue'?'#6899ff':rgba('#bad3e0',.38);ctx.lineWidth=material==='light'?.3:.7;ctx.stroke();
  }
  // Atmospheric perspective, without darkening the bright environment.
  if(z>100){poly(ps);ctx.fillStyle=rgba('#edf5fb',clamp((z-100)/650,0,.6));ctx.fill()}
  ctx.restore();
 }});
}
function slab(pos:V,size:V,rot:V=[0,0,0],mat:Material='porcelain',a=1,color?:string){
 const [x,y,z]=size.map(v=>v/2);const vs:V[]=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
 const world=vs.map(v=>placed(v,pos,rot));
 for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])face(f.map(i=>world[i]),mat,a,color);
}
function spatialLine(vs:V[],c=ink,w=1,a=1,closed=false){
 const ls=vs.map(local);if(ls.some(v=>v[2]<=.5))return;const ps=ls.map(projectLocal),z=ls.reduce((s,p)=>s+p[2],0)/ls.length;
 queue.push({z,draw:()=>{ctx.save();ctx.globalAlpha*=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));if(closed)ctx.closePath();ctx.stroke();ctx.restore()}});
}
function halo(pos:V,r:number,width:number,rot:V=[0,0,0],mat:Material='porcelain',a=1){
 const N=64;for(let i=0;i<N;i++){const u=i/N*TAU,v=(i+1)/N*TAU;
  const points=(rr:number,z:number,ang:number):V=>placed([Math.cos(ang)*rr,Math.sin(ang)*rr,z],pos,rot);
  face([points(r-width,-width*.28,u),points(r+width,-width*.28,u),points(r+width,-width*.28,v),points(r-width,-width*.28,v)],mat,a);
  if(width>.35){face([points(r+width,-width*.28,u),points(r+width,width*.28,u),points(r+width,width*.28,v),points(r+width,-width*.28,v)],mat,a);face([points(r-width,width*.28,u),points(r-width,-width*.28,u),points(r-width,-width*.28,v),points(r-width,width*.28,v)],mat,a)}
 }
}
function wireSphere(pos:V,r:number,rot:V=[0,0,0],a=.5){
 for(let j=1;j<10;j++){const p=j/10*Math.PI;const vs:V[]=[];for(let i=0;i<=64;i++){const u=i/64*TAU;vs.push(placed([r*Math.sin(p)*Math.cos(u),r*Math.cos(p),r*Math.sin(p)*Math.sin(u)],pos,rot))}spatialLine(vs,'#477faf',.8,a)}
 for(let j=0;j<12;j++){const vs:V[]=[];for(let i=0;i<=48;i++){const p=i/48*TAU,u=j/12*Math.PI;vs.push(placed([r*Math.sin(p)*Math.cos(u),r*Math.cos(p),r*Math.sin(p)*Math.sin(u)],pos,rot))}spatialLine(vs,'#477faf',.8,a)}
}
function grid(z:number,y:number,extent=180,spacing=12,rot:V=[0,0,0],a=.3){
 for(let i=-extent;i<=extent;i+=spacing){spatialLine([placed([i,y,0],[0,0,z],rot),placed([i,y,extent*2],[0,0,z],rot)],ink,.65,a);spatialLine([placed([-extent,y,i+extent],[0,0,z],rot),placed([extent,y,i+extent],[0,0,z],rot)],ink,.65,a)}
}
function ribbon(startZ:number,length:number,u:number,side=1,a=1){
 for(let i=0;i<42;i++){const at=(k:number):V=>{const z=startZ+k/42*length;return[side*(19+Math.sin(k*.11+u)*9),Math.cos(k*.15+u)*11,z]};const p=at(i),q=at(i+1);face([add(p,[-3,0,0]),add(p,[3,0,0]),add(q,[3,0,0]),add(q,[-3,0,0])],i%7===0?'cyan':'paper',a)}
}
function flush(){queue.sort((a,b)=>b.z-a.z);for(const o of queue)o.draw();queue=[]}
function texture(s:string,color:string,font='Display'):HTMLCanvasElement{
 const key=s+'|'+color+'|'+font;const cached=textures.get(key);if(cached)return cached;
 const c=document.createElement('canvas'),cc=c.getContext('2d')!;cc.font=`512px ${font}`;c.width=Math.ceil(cc.measureText(s).width+57);c.height=654;cc.font=`512px ${font}`;cc.fillStyle=color;cc.textBaseline='alphabetic';cc.fillText(s,28,512);textures.set(key,c);if(textures.size>64)textures.delete(textures.keys().next().value!);return c;
}
function triangleTexture(img:HTMLCanvasElement|HTMLImageElement,sp:[number,number][],dp:P[]){
 const [s0,s1,s2]=sp,[d0,d1,d2]=dp;const det=(s1[0]-s0[0])*(s2[1]-s0[1])-(s2[0]-s0[0])*(s1[1]-s0[1]);if(Math.abs(det)<.01)return;
 const a=((d1[0]-d0[0])*(s2[1]-s0[1])-(d2[0]-d0[0])*(s1[1]-s0[1]))/det;
 const b=((d1[1]-d0[1])*(s2[1]-s0[1])-(d2[1]-d0[1])*(s1[1]-s0[1]))/det;
 const c=((s1[0]-s0[0])*(d2[0]-d0[0])-(s2[0]-s0[0])*(d1[0]-d0[0]))/det;
 const d=((s1[0]-s0[0])*(d2[1]-d0[1])-(s2[0]-s0[0])*(d1[1]-d0[1]))/det;
 const center=[dp.reduce((s,p)=>s+p[0],0)/3,dp.reduce((s,p)=>s+p[1],0)/3];const clip=dp.map(p=>{const dx=p[0]-center[0],dy=p[1]-center[1],len=Math.hypot(dx,dy)||1;return[p[0]+dx/len*.65,p[1]+dy/len*.65,p[2]] as P});
 ctx.save();poly(clip);ctx.clip();ctx.transform(a,b,c,d,d0[0]-a*s0[0]-c*s0[1],d0[1]-b*s0[0]-d*s0[1]);ctx.drawImage(img,0,0);ctx.restore();
}
function typePlane(s:string,pos:V,width:number,rot:V=[0,0,0],color=ink,a=1,font='Display'){
 imagePlane(texture(s,color,font),pos,width,rot,a);
}
function imagePlane(img:HTMLCanvasElement|HTMLImageElement,pos:V,width:number,rot:V=[0,0,0],a=1){
 const height=width*img.height/img.width;
 // Subdivision makes a real perspective text plane, not a screen-space label.
 for(let i=0;i<8;i++){const x0=i/8,x1=(i+1)/8;const world=[placed([(x0-.5)*width,height/2,0],pos,rot),placed([(x1-.5)*width,height/2,0],pos,rot),placed([(x1-.5)*width,-height/2,0],pos,rot),placed([(x0-.5)*width,-height/2,0],pos,rot)];const ls=world.map(local);if(ls.some(v=>v[2]<.7))continue;const ps=ls.map(projectLocal);const z=ls.reduce((s,v)=>s+v[2],0)/4;
  queue.push({z,draw:()=>{ctx.save();ctx.globalAlpha*=a;triangleTexture(img,[[x0*img.width,0],[x1*img.width,0],[x1*img.width,img.height]],[ps[0],ps[1],ps[2]]);triangleTexture(img,[[x0*img.width,0],[x1*img.width,img.height],[x0*img.width,img.height]],[ps[0],ps[2],ps[3]]);ctx.restore()}});
 }
}
function particles(z:number,count:number,u:number,mode='forward',a=.5){
 for(let i=0;i<count;i++){let depth=mod(hash(i+911)*160-u*13,160)+3;const ang=i*2.399;let r=12+hash(i+71)*55;
  if(mode==='converge')r*=.35+depth/160;const p:V=[Math.cos(ang)*r,Math.sin(ang)*r,z+depth];const pp=project(p);if(pp[2]<.7||pp[0]<0||pp[0]>W||pp[1]<0||pp[1]>H)continue;
  const sz=clamp(120/pp[2],.65,4);queue.push({z:pp[2],draw:()=>{ctx.save();ctx.globalAlpha*=a*(.3+hash(i+33)*.7);ctx.fillStyle=i%13===0?gold:i%3===0?blue:white;ctx.fillRect(pp[0],pp[1],sz,sz);ctx.restore()}});
 }
}
function cameraPoint(x:number,y:number,z:number):V{return add(camera.pos,add(camera.right.map(v=>v*x) as V,add(camera.up.map(v=>v*y) as V,camera.forward.map(v=>v*z) as V)))}
function worldDensity(u:number,power=1,variant=0){
 // Four scale bands: far shells, middle ruins, paper/data flows, near occluders.
 for(let i=0;i<24;i++){
  const d=40+mod(i*23-u*8,220),side=i%2?1:-1,x=side*(22+hash(i+31)*62),y=(hash(i+69)-.5)*55;
  slab(cameraPoint(x,y,d),[3+hash(i+82)*12,8+hash(i+75)*35,.8+i%3],[.12,Math.sin(i)*.25,u*.035+i*.38],i%7===0?'mirror':i%3===0?'frost':'porcelain',.7*power);
  if(i%4===0)typePlane(String(i%9+1).padStart(2,'0'),cameraPoint(x,y,d-.6),12,[0,.1*Math.sin(i),i*.07],i%3===0?blue:ink,.7*power);
 }
 for(let j=0;j<4;j++){
  const p=cameraPoint((j%2?1:-1)*(36+j*12),6-j*4,90+j*47);wireSphere(p,12+j*5,[.17,u*.08+j,.24],.5*power);
  const orbitX=variant%3===0?(j%2?1:-1)*(24+j*7):variant%3===1?(j-1.5)*18:0;
  const orbitY=variant%3===1?(j%2?20:-16):2;
  halo(cameraPoint(orbitX,orbitY,65+j*45),26+j*14,j%2?.3:1.2,[.35+variant*.23+j*.12,.3+variant*.21+Math.sin(u*.2+j)*.2,j*.25],j%2?'cyan':'porcelain',.76*power);
 }
 for(let i=0;i<140;i++){
  const d=6+mod(hash(i+173)*220-u*(18+i%5*7),220),side=i%2?1:-1;
  const p=cameraPoint(side*(8+hash(i+55)*65),(hash(i+93)-.5)*55,d),sz=.3+hash(i+57)*2.6;
  face([add(p,[-sz,0,0]),add(p,[sz*.8,sz*.5,0]),add(p,[sz*.2,sz*3,0])],i%7===0?'blue':i%3===0?'cyan':'paper',.8*power);
 }
 for(let i=0;i<16;i++){
  const d=12+mod(170-u*(48+i%4*6)+i*31,170),x=(i%2?1:-1)*(12+d*.50+i%4*3),y=Math.sin(i*2.4)*12;
  slab(cameraPoint(x,y,d),[3+i%3*2,10+i%5*3,.14],[.05,Math.sin(u+i)*.3,(i%2?-.55:.55)+.16*Math.sin(u*1.8+i)],i%4===0?'mirror':'frost',.66*power);
 }
 const words=['01','03','04','08','09','WORLD','NEXT'];const l=currentLyric();
 for(let i=0;i<14;i++){
  const d=14+mod(160-u*29+i*23,160),s=i%4===0&&l?l.l.wordTiming[(l.active+i)%l.l.wordTiming.length].text.trim():words[i%words.length];
  typePlane(s,cameraPoint((i%2?1:-1)*(15+i%4*12),(i%3-1)*17,d),8+i%4*6,[0,.22*Math.sin(i),Math.sin(i)*.2],i%3===0?blue:ink,.68*power,i%4===0?'CJK':'Display');
 }
 particles(camera.pos[2],520,u,'forward',.55*power);
}
function posterDensity(u:number){
 txt('09',1240+Math.sin(u)*80,1130,1100,blue,'Display','center',.16);
 for(let j=0;j<24;j++){
  const y=40+j*44+Math.sin(j+u*2)*14,x=(j%3)*680-60+mod(u*160+j*27,190);
  txt(['01 / 02 / 03','MEMORY / NEXT','04 / 05 / 06','WORLD / 09'][j%4],x,y,18+j%3*5,j%6===0?cyan:ink,'Display','left',.55);
  if(j%3===0)line(x-40,y+9,x+490,y+9,j%2?blue:gold,1.2,.5);
 }
 ctx.save();ctx.translate(1650,180);ctx.rotate(Math.PI/2-.16);txt('THE NEXT WORLD',0,0,145,ink,'Display','left',.23);ctx.restore();
}
function atmosphere(top:string,bottom:string,warm=.1,clouds=true){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(.63,bottom);g.addColorStop(1,'#f5f9fc');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 glow(1280,620,800,'#ffffff',.48+features[0]*.06);if(warm)glow(1550,710,650,'#ffe7b4',warm);
 if(clouds)for(let j=0;j<7;j++){const y=H*.43+j*46;ctx.beginPath();ctx.moveTo(-50,y+100);for(let x=-50;x<=1980;x+=32){const yy=y+Math.sin(x*.0025+j*.8+t*.016)*25+Math.sin(x*.006+j)*8;ctx.lineTo(x,yy)}ctx.lineTo(1980,y+120);ctx.closePath();const c=ctx.createLinearGradient(0,y-28,0,y+100);c.addColorStop(0,rgba('#ffffff',.09+j*.025));c.addColorStop(1,rgba('#ffffff',0));ctx.fillStyle=c;ctx.fill()}
}
function horizon(y=730,a=.5){const g=ctx.createLinearGradient(0,y-90,0,y+150);g.addColorStop(0,rgba('#ffffff',0));g.addColorStop(.4,rgba('#ffffff',a));g.addColorStop(1,rgba('#c1dbe9',0));ctx.fillStyle=g;ctx.fillRect(0,y-90,W,240);line(0,y,W,y,white,1.2,a)}
function judgment(y:number,angle=0,color=blue,w=3){ctx.save();ctx.translate(960,y);ctx.rotate(angle);line(-1600,0,1600,0,color,w);line(-1600,5,1600,5,white,.7,.8);ctx.restore()}
function sceneLabel(s:string,x=94,y=120,color=ink){tracking(s,x,y,17,4,color,.8)}
function currentLyric(){const i=lyrics.findLastIndex(l=>l.time<=t);if(i<0)return null;const l=lyrics[i],end=Math.min(lyrics[i+1]?.time??146.6,l.time+7);if(t>end)return null;const age=t-l.time;const a=smooth(age,0,.16)*(1-smooth(t,end-.32,end));const active=Math.max(0,l.wordTiming.findLastIndex(w=>w.time<=t));return{i,l,age,a,active}}
function lyric(mode=0,color=ink){
 const d=currentLyric();if(!d)return;const {l,age,a,active}=d;const zh=l.zh==='//'?'':l.zh;ctx.save();ctx.globalAlpha*=a;
 if(mode===0){ // Vast horizontal typography, revealed by the judgment plane.
  const size=Math.min(112,1650/Math.max(l.jp.length,1));const y=870;ctx.save();ctx.beginPath();ctx.rect(92,700,1740*ease(age/.45),350);ctx.clip();txt(l.jp,92,y,size,color,'CJK');ctx.restore();txt(zh,98,y+65,28,color,'CJK','left',.72);
 }else if(mode===1){ // Swiss poster: phrase split into two large, staggered lines.
  const chars=[...l.jp],cut=Math.ceil(chars.length/2);const lines=[chars.slice(0,cut).join(''),chars.slice(cut).join('')];const size=Math.min(156,1600/cut);lines.forEach((s,i)=>txt(s,110+(i?170:0)+(1-ease(age/.25))*(i?-170:170),410+i*(size+26),size,color,'CJK'));txt(zh,118,956,30,color,'CJK','left',.75);
 }else if(mode===2){ // A tall glyph pierces the layout, the complete phrase remains readable.
  const ch=l.wordTiming[active]?.text.trim()||l.jp[0];txt(ch,1650+40*(1-ease(age/.6)),760,570,color,'CJK','center',.14);const size=Math.min(85,1600/l.jp.length);txt(l.jp,104,245,size,color,'CJK');txt(zh,108,310,27,color,'CJK','left',.75);
 }else if(mode===3){ // Vertical Japanese column plus huge Chinese emotional statement.
  const size=Math.min(48,790/l.jp.length);[...l.jp].forEach((c,i)=>txt(c,1790,120+i*size,size,color,'CJK','center'));const sizeZh=Math.min(94,1450/Math.max(zh.length,1));txt(zh,100,912,sizeZh,color,'CJK');
 }else if(mode===4){ // Last words, clear and monumental, against the newly opened sky.
  const size=Math.min(101,1700/l.jp.length);txt(l.jp,960,824,size,color,'CJK','center');txt(zh,960,892,30,color,'CJK','center',.85);
 }
 ctx.restore();
}
function boot(){fill('#040a10');const a=smooth(t,.7,2);view([0,0,-18],[0,0,40],950);wireSphere([16,1,70],8,[.15,.2,0],.14);flush();judgment(540+Math.sin(t*.5)*40,0,'#95b7c2',.8);txt('AFTERSTORY',110,790,72,'#d2e5e8','Display','left',a*.55);tracking('A WORLD BEYOND THE LAST CHAPTER',115,839,16,3,'#93b3c0',a*.5);txt('09',1680,190,32,white,'Display','left',.3*smooth(t,3,4));if(t>4.55)fill('#ddecf4',smooth(t,4.55,5.321))}
function dawn(){
 const u=t-5.321;atmosphere('#bdd3e2','#e7f4f6',.18);horizon(735,.7);view([-12+u*.7,4-u*.14,-30+u*2],[3,0,110],1050+u*9,-.055+u*.005);
 // One floating reflecting plane, a kilometer-scale open ring and a near glass veil.
 halo([20,5,145],43,1.6,[.4,-.15,0],'porcelain');halo([20,5,148],48,.12,[.4,-.15,0],'cyan',.6);slab([0,-8,65],[160,.3,240],[0,.02,0],'frost',.58);
 slab([-21,5,10+u*.2],[.35,32,38],[.08,-.25,0],'cyan',.7);slab([31,-4,70],[25,.4,55],[.04,.1,-.15],'porcelain');
 for(let i=0;i<8;i++)slab([-40+i*15,-6,180+hash(i+4)*110],[2,8+hash(i+8)*20,2],[0,0,0],'porcelain',.35);
 typePlane('DAWN',[11,8,73],63,[0,.1,0],'#ffffff',.85);if(u>7)worldDensity(u,.45);particles(camera.pos[2],100,u,'forward',.45);flush();sceneLabel('NEW DAWN',100,119);lyric(u<9?0:3);
}
function archive(){
 const u=t-19.851;const k=Math.min(3,Math.floor(u/3.5)),v=u-k*3.5;atmosphere('#d0e5f1','#f1f8fc',.05);
 if(k===2){memoryMontage(v);return}
 const roll=k===2?.28*smooth(v,0,1):- .04;view([k===1?19-4*v:k===3?-13+v*2:-15+v*2,9-v*.6,k*37+v*8],[0,0,150+k*15],k===3?1250:1080,roll);
 grid(15,-10,170,14,[0,0,0],.22);halo([0,7,260],100,3,[.2,.16,0],'frost');halo([0,5,195],64,1,[.15,-.3,0],'porcelain');wireSphere([34,14,118],17,[.18,.4,0],.25);
 for(let i=8;i>=0;i--){const z=35+i*26,x=(i%3-1)*24;slab([x,2,z],[15,37,1.3],[0,i%2?.16:-.12,0],i%3===0?'cyan':i%3===1?'porcelain':'frost',i%3===2?.72:1);typePlane(String(i+1).padStart(2,'0'),[x,3,z-1],24,[0,i%2?.16:-.12,0],i===8?blue:ink,.86);}
 for(let i=0;i<memories.length;i++)imagePlane(memories[i],[(i%2?1:-1)*39,12-i%3*8,48+i*33],29,[0,i%2?-.24:.25,i%2?.08:-.06],.93);
 // A folded paper route and foreground acrylic introduce four speed layers.
 ribbon(30,210,u*.065,-1,.72);slab([14,-1,camera.pos[2]+14],[1.5,50,22],[.13,-.38,.1],'frost',.62);
 worldDensity(u,1);particles(camera.pos[2],120,u,'forward',.5);flush();judgment(667+Math.sin(u*.22)*40,k===2?.28:0,blue,2.3);sceneLabel('01 / MEMORY IN ARCHITECTURE');if(u<3)lyric(2);else tracking('01  /  02  /  03  /  04  /  05  /  06  /  07  /  08  /  09',110,982,22,2,ink,.62);
}
function memoryMontage(u:number,opacity=1){
 // Cropped song artwork becomes a changing poster wall, then folds back into
 // the chapter architecture. These are local images, never remote video frames.
 const step=Math.floor(u*5);ctx.save();ctx.globalAlpha*=opacity;
 for(let i=0;i<6&&memories.length;i++){
  const im=memories[(i+step)%memories.length],x=70+(i%3)*620+(i%2?28:-18)*Math.sin(u*1.8),y=105+Math.floor(i/3)*410;
  const sw=im.width*(i%2?.55:.72),sh=im.height*.68,sx=(im.width-sw)*hash(i+step*9),sy=(im.height-sh)*hash(i+step*13);
  ctx.save();ctx.translate(x+260,y+150);ctx.rotate((i%2?1:-1)*.035);ctx.fillStyle=white;ctx.fillRect(-274,-164,548,328);ctx.drawImage(im,sx,sy,sw,sh,-260,-150,520,300);ctx.restore();
 }
 ctx.globalAlpha*=.94;txt('MEMORY',52,554,282,blue);txt(String(1+step%9).padStart(2,'0'),1786,1010,232,blue,'Display','right');judgment(606,-.05,cyan,5);tracking('01 — 09  /  A JOURNEY REMEMBERED',110,994,24,3,ink);ctx.restore();
}
const nextCuts=[33.84,36.35,38.076,40.223,43.484,46.1,47.794,49.86,52.1,53.906,55.677,58.315];
function next(){
 const k=nextCuts.findLastIndex(x=>x<=t),u=t-nextCuts[k],dur=nextCuts[k+1]-nextCuts[k],p=clamp(u/dur);
 atmosphere(k===1||k===5?'#f3f5f2':k===6?'#a8ddeb':k===8?'#cdd1ee':'#c4e2f4','#f5fcff',.04);
 if(k===6){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1632b5');g.addColorStop(1,'#1468ec');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
 view([0,0,-22+u*10],[0,0,85],1000+80*p+60*pulse,(k===4?.33:k===7?Math.PI/2*smooth(u,0,.65):-.04));
 if(k===1||k===5)posterDensity(u);else worldDensity(u+k*1.83,1,k+1);
 if(k===0){halo([0,0,80],32,3.6,[.14,.2,0],'cyan');halo([0,0,130],42,1,[0,-.15,0],'porcelain');ribbon(10,160,u*.2,1);grid(0,-15,140,10);typePlane('時間',[-16,4,30-u*3],40,[0,-.32,0],blue,.85,'CJK');flush();lyric(0)}
 if(k===1){txt('NEXT',60+mix(220,0,ease(p)),590,530,blue);judgment(622,-.045,ink,3);lyric(3)}
 if(k===2){slab([0,1,50],[58,33,.4],[.08,.4,0],'frost',.86);typePlane('時間',[0,0,49.4],54,[.08,.4,0],blue,1,'CJK');halo([0,0,125],40,1.5,[.2,0,.2],'porcelain');flush();lyric(2)}
 if(k===3){view([-6+u*2,0,-20+u*20],[0,0,90],1000+u*35,-.08+u*.12);for(let i=0;i<5;i++)halo([0,0,20+i*32],18+i*4,2.5,[.05*i,.03,0],i%2?'porcelain':'cyan');typePlane('時',[-22,0,10],23,[0,.2,0],ink,.9,'CJK');typePlane('間',[21,0,53],28,[0,-.2,0],blue,1,'CJK');particles(camera.pos[2],170,u);flush();lyric(0)}
 if(k===4){grid(0,-3,200,12,[0,0,.33],.35);for(let i=0;i<9;i++){slab([(i%3-1)*25,4,20+i*23],[7,65,5],[0,.15,.33],i%3===0?'mirror':'porcelain');}flush();ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1920,0);ctx.lineTo(1920,270);ctx.lineTo(0,920);ctx.closePath();ctx.clip();fill('#eef6f8');txt('NEXT',80,470,400,blue);ctx.restore();judgment(594,-.33,ink,4);lyric(3)}
 if(k===5){txt('次',20,945,1040,blue,'CJK');txt('NEXT',930,430,165,ink);judgment(470,.1,blue,2);lyric(2)}
 if(k===6){slab([-18,2,30],[20,60,15],[.05,.3,-.04],'mirror');halo([8,4,90],44,5,[.28,-.1,0],'porcelain');ribbon(5,150,u*.1,1);flush();lyric(1,white)}
 if(k===7){grid(0,-16,160,10,[0,0,0],.27);slab([0,0,80],[80,1.5,30],[.1,.2,Math.PI/2],'frost',.8);typePlane('叫ぶ',[0,0,50],54,[0,-.18,0],blue,1,'CJK');halo([0,0,150],55,2,[.1,.1,0],'porcelain');flush();lyric(3)}
 if(k===8){typePlane('変わらない',[0,5,65],88,[0,-.4,0],ink,.9,'CJK');typePlane('代ゎらない',[0,-6,95],110,[0,.25,0],blue,.6,'CJK');for(let i=0;i<10;i++)slab([(i-5)*9,-15,5+i*10],[8,.5,50],[0,0,Math.sin(p)*.7],'paper');flush();lyric(0)}
 if(k===9){for(let j=0;j<14;j++){const z=18+j*16;slab([j%2?17:-17,0,z],[9,36,1],[0,(j%2?1:-1)*(.5*(1-p)),0],j%3===0?'cyan':'paper');}grid(0,-18,180,10,[0,.25*p,0],.26);flush();lyric(1)}
 if(k===10){const open=smooth(u,0,2.1);view([0,0,-25+u*15],[0,0,100],1050,0);for(const side of [-1,1])slab([side*(15+open*48),0,35],[28,60,5],[0,side*open*.7,0],'porcelain');halo([0,0,120],45,2,[.1,0,0],'light');flush();lyric(4)}
 if(k!==1&&k!==5)sceneLabel('02 / THE NEXT WORLD',94,120,k===6?white:ink);
}
function separation(){
 const u=t-78.299;atmosphere('#d5d8e8','#eff0f5',.05,false);horizon(658,.48);
 view([0,3,-35-u*.1],[0,-2,70],1050);const d=2.4+smooth(u,0,13)*1.6;
 halo([-d,-3,70],1.9,.08,[.15,-.4,0],'porcelain',.7);halo([d,-3,77],1.5,.06,[-.1,.4,0],'cyan',.45);slab([0,-7,70],[45,.05,80],[0,0,0],'frost',.22);flush();glow(960,667,38,'#ffffff',.7);
 const l=lyrics[16],a=smooth(u,0,2)*(1-smooth(u,15,19.7));txt(l.jp,960,412,53,ink,'CJK','center',a*.72);
 // Let the Chinese sentence spread apart into the luminous empty space.
 const chars=[...l.zh],spacing=5+smooth(u,9,18)*22;ctx.save();ctx.font='42px CJK';const len=chars.reduce((s,c)=>s+ctx.measureText(c).width+spacing,0);let x=960-len/2;for(let i=0;i<chars.length;i++){txt(chars[i],x,486-smooth(u,12,19)*i*3,42,ink,'CJK','left',a*(1-smooth(u,13+i*.23,18+i*.12)));x+=ctx.measureText(chars[i]).width+spacing}ctx.restore();
 tracking('UNTIL WE MEET AGAIN',820,790,14,3,ink,.22*a);
}
function reconnect(){
 const u=t-98.076,k=u<4?0:u<10.5?1:2;atmosphere(k===0?'#dce3f0':k===1?'#b9dcee':'#9bd3ef','#eef8ff',.04);
 view([-12+u*.9,3,-30+u*8],[0,0,135],1050+30*pulse,-.035+smooth(u,9,15)*.2);
 if(k>0){grid(0,-17,190,14,[0,0,0],.24);halo([0,0,180],65,3,[.12,-.1,0],'frost');for(let i=0;i<12;i++){const a=i/12*TAU;const rad=28-8*smooth(u,4,12);slab([Math.cos(a)*rad,Math.sin(a)*rad,65+i*12],[4,24,2],[0,0,a],i%3===0?'blue':i%3===1?'cyan':'porcelain',smooth(u,4,7));}ribbon(40,190,u*.08,-1,smooth(u,5,8));}
 typePlane('RE:',[10,10,145],70,[0,-.1,0],blue,smooth(u,3,6));if(k>0)worldDensity(u,smooth(u,4,8));particles(camera.pos[2],180,u,'forward',smooth(u,4,9));flush();
 const a=smooth(u,0,1);judgment(610-u*4,-.045-smooth(u,7,12)*.1,'#dd5261',1.1*a);if(u>1.6)judgment(644-u*3,.045,'#dd5261',.9*smooth(u,1.6,2.1));lyric(k===0?1:k===1?2:0);sceneLabel('04 / A CONNECTION REMAINS');
}
function clearSky(){atmosphere('#79bee7','#e1f4fc',.42);const g=ctx.createLinearGradient(0,560,0,1040);g.addColorStop(0,rgba('#ffe9c4',0));g.addColorStop(.44,rgba('#ffe9c4',.68));g.addColorStop(1,rgba('#ffffff',0));ctx.fillStyle=g;ctx.fillRect(0,560,W,480);horizon(750,.8);glow(1240,692,470,'#fff0d0',.42)}
function afterstory(hero=false){
 const u=t-142.383;if(!hero){clearSky();view([0,2,u*2.5],[0,5,290],1050,0,960,490);halo([0,18,430],95,1.3,[.35,.05,0],'porcelain',.6*(1-smooth(u,4,10)));for(let i=0;i<6;i++)slab([(i-2.5)*38,14,280+i*18],[8,22,3],[0,0,0],'porcelain',.25*(1-smooth(u,i*.5,5+i*.5)));flush();}
 if(t<146.7)lyric(4);
 // Warm sky is allowed to linger for nine seconds before the endcard.
 if(t>148.5)fill('#f3f3eb',smooth(t,148.5,151.4));
 if(t>=150.6&&t<157.65){const a=smooth(t,150.6,151.5)*(1-smooth(t,156.9,157.65));
  txt('PHIGROS',960,430,185,ink,'Display','center',a);tracking('MAIN STORY / COMPLETE',678,504,22,5,ink,a*.9);txt('2019 — 2026',960,568,28,ink,'Text','center',a*.75);line(710,615,1210,615,gold,2,a);tracking('THANK YOU FOR THE JOURNEY',655,680,22,4,ink,a);
  txt('What do you want more than a Happy ending?  /  濒笼',960,813,23,ink,'CJK','center',a*.8);txt('UNOFFICIAL FAN TRIBUTE  /  NOT AFFILIATED WITH PIGEON GAMES',960,913,15,ink,'Text','center',a*.65);
 }
 if(t>156.8){const fade=smooth(t,156.8,158.2);fill('#080d15',fade);}
 if(t>=158.2&&t<161.72){const a=smooth(t,158.2,158.6)*(1-smooth(t,161.32,161.72));txt('What do you want more than a Happy ending?',960+(t>161.12&&t<161.17?7:0),547,45,white,'Text','center',a);line(836,604,1084,604,'#cde8ef',1,a*.45);txt('UNOFFICIAL FAN TRIBUTE',960,943,13,'#90a5b4','Text','center',a*.5)}
 if(t>=161.72)fill('#000000');
}

let releasePoints:[number,number][]|null=null;
function glyphParticles(){
 if(releasePoints)return releasePoints;
 const img=texture('09',blue),pixels=img.getContext('2d')!.getImageData(0,0,img.width,img.height).data;releasePoints=[];
 for(let i=0;releasePoints.length<2400&&i<50000;i++){const x=Math.floor(hash(i+401)*img.width),y=Math.floor(hash(i+3001)*img.height);if(pixels[(y*img.width+x)*4+3]>180)releasePoints.push([(x/img.width-.5)*190,(y/img.height-.5)*160])}
 return releasePoints;
}
function releaseType(){
 const u=t-135.258,show=smooth(u,1.35,1.9);
 // The aligned past remains inside the aperture until the camera clears it.
 ctx.save();ctx.beginPath();const aperture=260+1440*smooth(u,.65,2.1);ctx.rect(960-aperture/2,120,aperture,690);ctx.clip();
 for(let i=0;i<9;i++){const a=i===8?1-smooth(u,3.4,5.2):1-smooth(u,2.1+i*.07,2.7+i*.07);const x=i===8?1520-560*smooth(u,2.6,3.7):400+i*140;txt(String(i+1).padStart(2,'0'),x,430,64+(i===8?64*smooth(u,2.6,3.7):0),i===8?blue:ink,'Display','center',a*show*.83)}ctx.restore();
 const rise=smooth(u,3.5,6.8);if(rise>0){const pts=glyphParticles();for(let i=0;i<pts.length;i++){const p=pts[i],age=rise*(.35+hash(i+830)*.65);const x=960+p[0]+Math.sin(i*.6)*age*55,y=383+p[1]-age*(100+hash(i+450)*420);ctx.save();ctx.globalAlpha*=rise*(1-smooth(u,6.4,7.15));ctx.fillStyle=i%9===0?gold:i%3===0?blue:white;ctx.fillRect(x,y,1.2+hash(i+772),1.2+hash(i+772));ctx.restore()}}
 // Feathered clean white cloud banks, without noise or scanlines.
 for(let j=0;j<5;j++){const y=555+j*40;ctx.beginPath();ctx.moveTo(-40,y+80);for(let x=-40;x<=1960;x+=32)ctx.lineTo(x,y+Math.sin(x*.0028+j*.7+t*.009)*22+Math.sin(x*.005+j)*7);ctx.lineTo(1960,y+85);ctx.closePath();const g=ctx.createLinearGradient(0,y-25,0,y+85);g.addColorStop(0,rgba(white,.11));g.addColorStop(1,rgba(white,0));ctx.fillStyle=g;ctx.fill()}
 lyric(4,u<1.5?white:ink);
}
function heroTypography(id:string){
 if(id==='release'){if(t<142.383)releaseType();else afterstory(true);return}
 if(t>=132.997){txt(lyrics[25].jp,960,565,240,white,'CJK','center',smooth(t,132.997,133.177));txt(lyrics[25].zh,960,665,38,white,'CJK','center',.8);if(t>=135.1917)fill('#030a13');return}
 const start=id==='ascent'?58.315:113.098,u=t-start,k=Math.floor(u/(id==='ascent'?3.33:3.15));
 judgment(681,[-.04,-.12,.18,-.1,.2,0][k%6],k%2?white:blue,2);
 const lyricColor=(id==='converge'&&(k===0||k===6))||(id==='ascent'&&k===2)?white:ink;
 ctx.save();ctx.shadowColor=lyricColor===white?'rgba(6,26,54,.7)':'rgba(255,255,255,.8)';ctx.shadowBlur=2;
 lyric(id==='converge'&&(k===2||k===5)?0:k%3===0?0:k%3===1?3:1,lyricColor);ctx.restore();
 if(id==='converge'&&k!==2&&k!==5)recallFragments();
 const d=currentLyric();if(d&&k%3===1){const glyph=d.l.wordTiming[d.active]?.text.trim()||d.l.jp[0];txt(glyph,230,735,640,blue,'CJK','center',.13*d.a)}
 if(id==='ascent'&&k===2){ctx.save();ctx.translate(130,220);ctx.rotate(-.16);txt('ONE WAY',0,0,230,blue,'Display','left',.8);ctx.restore()}
 if(id==='converge'&&k===3){ctx.save();ctx.translate(1720,50);ctx.rotate(Math.PI/2);txt('WORLD',0,0,300,blue,'Display','left',.3);ctx.restore()}
}
function recallFragments(){
 const e=audio.majorTransients.findLast(e=>e.time<=t),i=e?audio.majorTransients.indexOf(e):-1;
 if(!e||i%6!==0||t-e.time>.12||!memories.length)return;
 for(let j=0;j<2;j++){
  const im=memories[(i+j)%memories.length],w=420,h=125,x=j?1430:50,y=j?90:940;
  ctx.save();ctx.globalAlpha=.8;ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(im,im.width*.22,im.height*(j?.14:.48),im.width*.6,im.height*.28,x,y,w,h);ctx.restore();
  line(x,y+h,x+w,y+h,j?cyan:gold,3,.9);
 }
}
const punctuation=[46.058,61.83,70.82,116.55,125.60,131.86];
const glitch=audio.majorTransients.filter((e,i)=>i%27===0&&e.time>34&&e.time<133&&!(e.time>78&&e.time<98));
export function visualTear(time:number){const e=glitch.find(e=>time>=e.time&&time<e.time+2/60);return e?Math.min(1,e.strength):0}
function typeEruption(){
 const e=audio.majorTransients.findLast(e=>e.time<=t),i=e?audio.majorTransients.indexOf(e):-1;
 if(!e||i%9!==0||t-e.time>.15||t<34||t>=135||t>=78&&t<98)return;
 const age=(t-e.time)/.15,side=i%2?-1:1,ox=side>0?1540:180,oy=145;
 ctx.save();ctx.beginPath();ctx.rect(side>0?1160:0,0,760,560);ctx.clip();
 const l=currentLyric();for(let j=0;j<44;j++){
  const angle=j*2.399,r=40+age*(120+hash(j+i)*480),x=ox+Math.cos(angle)*r,y=oy+Math.sin(angle)*r*.65;
  const text=j%4===0&&l?l.l.wordTiming[(l.active+j)%l.l.wordTiming.length].text.trim():String(j%9+1).padStart(2,'0');
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(j)*age*.8);txt(text,0,0,24+hash(j+41)*78,j%7===0?gold:j%3?blue:white,j%4===0?'CJK':'Display','center',(1-age)*.8);ctx.restore();
 }ctx.restore();
}
function openingGraphic(){
 const d=currentLyric();if(!d)return;const {l,a,age}=d;
 // The dawn lyric is a depth-tested curved glyph surface inside the world.
 if(t>=5.321&&t<12)return;
 // The lyric is one incursion into a world. It no longer substitutes for one.
 const dark=t<12||t>=15.8&&t<41||t>=44.7&&t<51.7,color=dark?white:ink;
 ctx.save();ctx.globalAlpha*=a;ctx.shadowColor=dark?'#041224':'#eef9ff';ctx.shadowBlur=2;
 const size=Math.min(68,1500/Math.max(1,l.jp.length));
 if(t>=26&&t<34){const sz=Math.min(40,790/l.jp.length);[...l.jp].forEach((ch,i)=>txt(ch,1770,115+i*sz,sz,color,'CJK','center'));if(l.zh!=='//')txt(l.zh,112,982,25,color,'CJK','left',.82)}
 else if(t>=12&&t<19.851){txt(l.jp,106,150,size,color,'CJK');if(l.zh!=='//')txt(l.zh,110,201,25,color,'CJK','left',.82)}
 else {ctx.save();if(t>=19.851&&t<26||t>=48&&t<51.7){ctx.translate(100,900);ctx.rotate(t<26?-.075:.10);txt(l.jp,0,0,size,color,'CJK');if(l.zh!=='//')txt(l.zh,4,52,25,color,'CJK','left',.82)}else {txt(l.jp,110,930,size,color,'CJK');if(l.zh!=='//')txt(l.zh,114,980,25,color,'CJK','left',.82)}ctx.restore()}
 ctx.restore();
 // Two short poster invasions occur only in the designated 2D/3D passage.
 if(t>=41.6&&t<42.35||t>=44.0&&t<44.65){
  fill(t<43?'#e8e9e5':'#132333');const glyph=l.wordTiming[Math.min(d.active,l.wordTiming.length-1)]?.text.trim()||l.jp[0];
  ctx.save();ctx.translate(200,760);ctx.rotate(-.11);txt(glyph,0,0,640,t<43?ink:white,'CJK');ctx.restore();
  txt(l.jp,118,1010,Math.min(70,1550/l.jp.length),t<43?ink:white,'CJK');
  judgment(580,t<43?.2:-.28,t<43?ink:cyan,5);
 }
 if(t>26&&t<34){const e=audio.majorTransients.findLast(e=>e.time<=t);if(e&&t-e.time<3/60){judgment(250+(t-e.time)*8000,-.23,ink,34)}}
}
export function paint(canvas:HTMLCanvasElement,time:number,frame:number,fps:number,opening=false){
 ctx=canvas.getContext('2d',{alpha:true})!;t=time;features=audio.frames[Math.min(audio.frames.length-1,Math.round(t*audio.featureRate))];
 const transient=audio.majorTransients.findLast(e=>e.time<=t);pulse=transient?transient.strength*Math.exp(-Math.max(0,t-transient.time)*15):0;
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,W,H);queue=[];
 const hero=heroClips.find(s=>t>=s.start&&t<s.end);
 if(opening)openingGraphic();else if(hero)heroTypography(hero.id);else if(t<5.321)boot();else if(t<19.851)dawn();else if(t<33.84)archive();else if(t<58.315)next();else if(t<98.076)separation();else if(t<113.098)reconnect();else afterstory();
 // Clean motion is the default. Short source-onset tears are only punctuation.
 if(!opening)typeEruption();
 const e=glitch.find(e=>t>=e.time&&t<e.time+2/60);if(e){for(let i=0;i<7;i++){const y=hash(i+e.time*71)*H,h=14+hash(i+83)*130,dx=(hash(i+17)-.5)*240;ctx.drawImage(canvas,0,y*canvas.height/H,canvas.width,h*canvas.height/H,dx,y,W,h);line(0,y,W,y,i%2?'#ff3b58':cyan,3,.8)}ctx.save();ctx.translate(960,540);ctx.rotate(-.23);ctx.fillStyle=rgba('#ffffff',.65);ctx.fillRect(-1300,-12,2600,24);ctx.restore()}
 if(punctuation.some(x=>t>=x&&t<x+2/60))fill('#040911');
 if((t>=58.315&&t<58.315+2/60)||(t>=113.098&&t<113.098+2/60))fill('#ffffff',.76);
}

export function paintBackdrop(canvas:HTMLCanvasElement,time:number){
 ctx=canvas.getContext('2d',{alpha:true})!;t=time;features=audio.frames[Math.min(audio.frames.length-1,Math.round(t*audio.featureRate))];ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);
 if(t>=135.258&&t<151.4)clearSky();
}

function timedLyric(value:string,x:number,y:number,size:number,color:string,align:CanvasTextAlign='left'){
 const d=currentLyric();if(!d){txt(value,x,y,size,color,'CJK',align);return;}
 ctx.save();ctx.font=`${size}px CJK`;ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle=color;
 const times=d.l.wordTiming.flatMap(token=>[...token.text].map(()=>token.time));const total=ctx.measureText(value).width;let at=x-(align==='center'?total/2:align==='right'?total:0);
 [...value].forEach((ch,i)=>{ctx.save();ctx.globalAlpha*=t>=(times[i]??d.l.time)?1:.43;ctx.fillText(ch,at,y);ctx.restore();at+=ctx.measureText(ch).width});ctx.restore();
}
// Current shot-library graphic pass. The legacy Canvas worlds above are kept
// as source history, but never drawn by this composition.
export function paintShotGraphics(canvas:HTMLCanvasElement,time:number,frame:number,fps:number,shot:{id:string;start:number;end:number;family:string}){
 ctx=canvas.getContext('2d',{alpha:true})!;t=time;ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,W,H);
 const q=clamp((t-shot.start)/(shot.end-shot.start)),d=currentLyric(),dark=['signal','rift','interior','engine','deep','crystals','galaxy','gravity','storm','glitch','red-world','cyan-storm','rebuild-gate','monuments','ringtemple','colonnade','quiet-leaf','quiet-line'].includes(shot.family)||shot.family.startsWith('physical-')&&shot.family!=='physical-life-relic',color=dark?'#e5e9e8':'#132c40';
 if(paintPrintWorld(ctx,time,shot,memories,d?.l.jp??''))return;
 if(shot.family.startsWith('insert-')){
  const kind=shot.family.slice(7);if(kind==='black'){fill('#000000');return;}
  if(['circuit','negative','graphic'].includes(kind)){
   fill(kind==='negative'?'#e8e8e2':'#090d12');const fg=kind==='negative'?'#131a20':'#dce4e1';
   ctx.save();ctx.translate(960,540);ctx.rotate(kind==='graphic'?q*.9:-.16);
   if(kind==='circuit'){for(let i=0;i<26;i++){const y=-450+i*36,s=80+hash(i+11)*300;line(-930,y,-s,y,fg,1.7);line(-s,y,s,y+(i%2?1:-1)*90,fg,1.7);line(s,y+(i%2?1:-1)*90,930,y+(i%2?1:-1)*90,fg,1.7)}line(-900,-180+q*400,900,-180+q*400,'#82b29a',4)}
   else{for(let i=0;i<12;i++){ctx.save();ctx.rotate(i/12*TAU);const r=80+q*q*550;ctx.fillStyle=fg;ctx.fillRect(r,-9,70+i*11,12+i%3*15);ctx.restore()}ctx.strokeStyle=fg;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-220,-180);ctx.lineTo(220,-120);ctx.lineTo(310,160);ctx.lineTo(-130,250);ctx.closePath();ctx.stroke()}
   ctx.restore();
  }return;
 }
 if(shot.family==='endcard'||shot.family==='question'){
  if(shot.family==='question')fill('#080e14');const opacity=smooth(t,shot.start,shot.start+.6)*(1-smooth(t,shot.end-.8,shot.end-.3));
  if(shot.family==='endcard'){
   txt('AFTER STORY',960,720,41,'#183548','Text','center',smooth(t,151.9,152.8)*(1-smooth(t,155.6,156.7)));
   txt('PHIGROS / MAIN STORY COMPLETE',960,769,19,'#3d5666','Text','center',.7*opacity);
   txt('UNOFFICIAL FAN TRIBUTE · NOT AFFILIATED WITH PIGEON GAMES',960,1005,15,'#45616c','Text','center',opacity);
  }else{
   fill('#080e14');txt('What do you want more than a Happy ending?',960,535,58,'#e4e9e8','Text','center',opacity);txt('Music · 濒笼',960,606,23,'#aebbc3','CJK','center',opacity);if(t>=audio.duration-1)fill('#000000');
  }
  return;
 }
 if(shot.family==='poster'){
  const index=Math.floor((t-shot.start)*15)%7,im=memories[index];fill(index%2?'#142431':'#d4dcdb');if(im){ctx.save();ctx.translate(960,540);ctx.rotate(-.14);ctx.drawImage(im,260,170,500,370,-1120,-780,2240,1560);ctx.restore()}
  if(d){txt(d.l.wordTiming[d.active]?.text.trim()||d.l.jp[0],210,820,430,'#e1e9e8','CJK');txt(d.l.jp,115,975,Math.min(52,1700/d.l.jp.length),white,'CJK')};judgment(540,-.18,'#dce5e6',10);return;
 }
 if(shot.family==='whiteout'){
  fill('#f7ffff');ctx.save();ctx.globalAlpha=(1-q)*.65;ctx.translate(960,540);ctx.rotate(-.2+q*.15);
  for(let i=0;i<25;i++){const y=(hash(i+frame)*2-1)*900;line(-1700,y,1700,y+(hash(i+22)-.5)*700,i%3===0?'#ecbde2':'#68ffff',8+hash(i+7)*90,.65)}ctx.restore();
  if(q>.72)fill('#ffffff');return;
 }
 if(shot.family==='signal'){
  tracking('A F T E R S T O R Y',128,155,19,3,'#acbbc8',.5);txt('UNOFFICIAL FAN TRIBUTE',128,195,17,'#7e909f','Text','left',.8);return;
 }
 if(shot.family==='dawn')return; // curved, depth-tested lyric glyphs in the shell.
 if(shot.family==='rebuild-gate'&&q>.95){fill('#ffffff');return;}
 // Light flow and corrupted signal are entire image states, not RGB text effects.
 if((shot.family==='colonnade'&&q>.86)||shot.family==='gold-event'&&q>.58){
  const attack=shot.family==='colonnade'?(q-.86)/.14:shot.family==='gold-event'?(q-.58)/.42:q;
  fill(shot.family==='gold-event'?'#fff9e4':'#f3ffff',.6+attack*.4);
  ctx.save();ctx.globalAlpha=(1-attack)*.7;ctx.translate(960,540);ctx.rotate(-.22+attack*.2);
  for(let i=0;i<25;i++){const yy=(hash(i+frame)*2-1)*900;line(-1700,yy,1700,yy+(hash(i+22)-.5)*700,i%3===0?'#ecbde2':'#68ffff',8+hash(i+7)*90,.65)}ctx.restore();
  if(attack>.9)fill('#ffffff');return;
 }
 if(shot.family==='glitch'&&(q>.87||Math.floor(q*12)%5===3)){
  fill('#080a09');ctx.save();const small=document.createElement('canvas');small.width=192;small.height=108;const x=small.getContext('2d')!,im=x.createImageData(192,108);
  for(let i=0;i<im.data.length;i+=4){const n=hash(i+Math.floor(t*30)*913)*255;im.data[i]=n*.88;im.data[i+1]=n;im.data[i+2]=n*.9;im.data[i+3]=255}x.putImageData(im,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.77;ctx.drawImage(small,0,0,W,H);ctx.restore();
  for(let i=0;i<80;i++)line(0,i*14,W,i*14,'#000000',4,.8);judgment(140+((t*230)%760),0,'#d9ffed',15);return;
 }
 if(d){
  const size=Math.min(64,1500/Math.max(1,d.l.jp.length)),a=d.a,quiet=shot.family.startsWith('quiet'),vertical=Number(shot.id)%5===0&&!quiet;
  ctx.save();ctx.globalAlpha=a;ctx.shadowColor=dark?'#06121c':'#b5c5cc';ctx.shadowBlur=2;
  if(shot.family==='gravity')ctx.shadowBlur=0;
  if(vertical){const sz=Math.min(44,780/d.l.jp.length);[...d.l.jp].forEach((ch,i)=>txt(ch,1770,130+i*sz,sz,color,'CJK','center'));if(d.l.zh!=='//')txt(d.l.zh,120,991,23,color,'CJK','left',.82)}
  else{const top=Number(shot.id)%3===1,x=quiet?960:120,y=quiet?895:top?145:919;ctx.save();if(!quiet){ctx.translate(x,y);ctx.rotate(Number(shot.id)%4===0?-.08:0)};timedLyric(d.l.jp,quiet?x:0,quiet?y:0,quiet?Math.min(42,size):size,color,quiet?'center':'left');if(d.l.zh!=='//')txt(d.l.zh,quiet?x:3,quiet?y+45:49,22,color,'CJK',quiet?'center':'left',.8);ctx.restore()}
  ctx.restore();
 }
 // Restrained annotations. No HUD fills the empty space.
 if(!shot.family.startsWith('quiet')&&Number(shot.id)>5&&Number(shot.id)<42){tracking(`RECORD ${shot.id} / 01—09`,116,65,16,2,color,.48)}

 // The final reveal and afterglow intentionally have no glitch overlay.
 if(t<135.258&&Number(shot.id)>12){const onset=audio.majorTransients.findLast(e=>e.time<=t);if(onset&&t-onset.time<2/60&&audio.majorTransients.indexOf(onset)%9===0){judgment(190+(t-onset.time)*16000,-.19,Number(shot.id)>33?'#be4754':'#e5eeed',8)}}
}
