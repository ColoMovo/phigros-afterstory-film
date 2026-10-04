import {BoxGeometry,IcosahedronGeometry,TorusGeometry,BufferGeometry,Matrix4,Euler,Vector3} from 'three';
import audio from './data/audio-analysis.json';
import lyrics from './data/lyrics.json';
// All state is a pure function of timeline position. Geometry and seeded stars are cached.
type V=[number,number,number]; type P=[number,number,number];
const TAU=Math.PI*2, WHITE='#ecece4',CYAN='#8cdce3';
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a:number,b:number,x:number)=>a+(b-a)*x;
const hash=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v)};
const smooth=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const stars=Array.from({length:700},(_,i)=>[hash(i+1),hash(i+924),hash(i+3412),hash(i+9102)]);
const mat=new Matrix4(),euler=new Euler(),vector=new Vector3();
interface Mesh{v:V[];f:number[][]}
function geometry(g:BufferGeometry):Mesh{const p=g.getAttribute('position');const v:V[]=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]);const idx=g.index?.array||Array.from({length:p.count},(_,i)=>i);const f:number[][]=[];for(let i=0;i<idx.length;i+=3)f.push([idx[i],idx[i+1],idx[i+2]]);g.dispose();return {v,f};}
const box=geometry(new BoxGeometry(1,1,1));
const ico=geometry(new IcosahedronGeometry(1,1));
const ring=geometry(new TorusGeometry(1,.018,4,80));
const thickRing=geometry(new TorusGeometry(1,.12,6,72));
let ctx:CanvasRenderingContext2D;let now=0;let frame=0;let feat:number[]=[];
let cam={cx:960,cy:540,f:1000,dist:10,roll:0};
function project(v:V):P{const z=v[2]+cam.dist;const s=cam.f/Math.max(.1,z);const x=v[0]*s,y=-v[1]*s,c=Math.cos(cam.roll),ss=Math.sin(cam.roll);return[cam.cx+x*c-y*ss,cam.cy+x*ss+y*c,z];}
function transform(v:V,scale:V,rot:V,pos:V):V{vector.set(v[0]*scale[0],v[1]*scale[1],v[2]*scale[2]).applyMatrix4(mat);return[vector.x+pos[0],vector.y+pos[1],vector.z+pos[2]];}
function mesh(m:Mesh,pos:V,scale:V,rot:V,color:string,fill=true,alpha=1){
 mat.makeRotationFromEuler(euler.set(...rot));const vs=m.v.map(v=>transform(v,scale,rot,pos));const ps=vs.map(project);
 const faces=m.f.map((f,i)=>({f,i,z:f.reduce((s,k)=>s+ps[k][2],0)/f.length})).sort((a,b)=>b.z-a.z);
 ctx.save();ctx.globalAlpha=alpha;ctx.lineWidth=.75;
 for(const {f,i} of faces){if(f.some(k=>ps[k][2]<.2))continue; if(f.every(k=>ps[k][0]<-300)||f.every(k=>ps[k][0]>2220))continue;
  ctx.beginPath(); f.forEach((k,j)=>j?ctx.lineTo(ps[k][0],ps[k][1]):ctx.moveTo(ps[k][0],ps[k][1]));ctx.closePath();
  if(fill){ctx.fillStyle=color;ctx.globalAlpha=alpha*(.32+.55*hash(i+83));ctx.fill();}
  ctx.globalAlpha=alpha*(fill?.38:.7);ctx.strokeStyle=color;ctx.stroke();
 }ctx.restore();
}
function line(x:number,y:number,x2:number,y2:number,color=WHITE,width=1,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
function path(points:P[],color=WHITE,width=1,alpha=1,closed=false){ctx.save();ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.strokeStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));if(closed)ctx.closePath();ctx.stroke();ctx.restore();}
function text(s:string,x:number,y:number,size=20,color=WHITE,font='Text',align:CanvasTextAlign='left',alpha=1){ctx.save();ctx.globalAlpha=clamp(alpha);ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);ctx.restore();}
function tracked(s:string,x:number,y:number,size:number,spacing:number,color=WHITE,alpha=1){ctx.save();ctx.font=`${size}px Text`;ctx.fillStyle=color;ctx.globalAlpha=clamp(alpha);for(const c of s){ctx.fillText(c,x,y);x+=ctx.measureText(c).width+spacing;}ctx.restore();}
function rect(x:number,y:number,w:number,h:number,color:string,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x,y,w,h);ctx.restore();}
function glow(x:number,y:number,r:number,color:string,alpha=1){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
function circle(x:number,y:number,r:number,color=WHITE,w=1,a=1,start=0,end=TAU){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.stroke();ctx.restore();}
function starfield(t:number,strength=.5,warp=0){ctx.save();ctx.fillStyle=WHITE;for(let i=0;i<stars.length;i++){const [a,b,c,d]=stars[i];const z=(c*40-t*warp%40+40)%40+.5;const x=(a-.5)*43,y=(b-.5)*25;const p=project([x,y,z-3]);if(p[0]<0||p[0]>1920||p[1]<0||p[1]>1080)continue;ctx.globalAlpha=strength*(.1+d*.8);const r=.5+d*(warp?1.2:1);ctx.fillRect(p[0],p[1],r,r);if(warp>3)line(p[0],p[1],p[0]+(p[0]-960)*.025,p[1]+(p[1]-540)*.025,WHITE,.8,strength*d*.4);}ctx.restore();}
function movingLine(t:number,mode=0,alpha=1){ctx.save();ctx.translate(960,540);ctx.rotate(mode===0?Math.sin(t*.35)*.18:mode===1?t*.27:Math.sin(t*.31)*.55);const y=Math.sin(t*.61)*220+feat[3]*12;line(-1350,y,1350,y,WHITE,1.6,alpha);line(-100,y-4,250,y-4,CYAN,.5,alpha*.7);ctx.restore();}
function orbit(r:number,rot:V,pos:V=[0,0,0],color=WHITE,a=.5){mat.makeRotationFromEuler(euler.set(...rot));const pts:P[]=[];for(let i=0;i<=128;i++){const u=i/128*TAU;pts.push(project(transform([Math.cos(u)*r,Math.sin(u)*r,0],[1,1,1],rot,pos)));}path(pts,color,1,a);}
function cross(x:number,y:number,r=8,color=WHITE,a=.5){line(x-r,y,x+r,y,color,1,a);line(x,y-r,x,y+r,color,1,a);}
function chrome(label:string,index:string,a=.65){tracked('A F T E R S T O R Y',76,67,15,2,WHITE,a);text('ARCHIVE / '+label,1844,67,15,WHITE,'Text','right',a);text(index,76,1006,16,CYAN,'Text','left',a);text('UNOFFICIAL FAN TRIBUTE',1844,1006,13,WHITE,'Text','right',a*.65);line(76,91,1844,91,WHITE,.6,a*.25);cross(960,70,5,WHITE,a*.4);}
function ticks(cx:number,cy:number,r:number,a=.6){for(let i=0;i<96;i++){let u=i/96*TAU;let len=i%8===0?15:4;line(cx+Math.cos(u)*r,cy+Math.sin(u)*r,cx+Math.cos(u)*(r+len),cy+Math.sin(u)*(r+len),WHITE,1,a*(i%8===0?1:.4));}}
function lyric(t:number,layout=0){const index=lyrics.findLastIndex(l=>l.time<=t);if(index<0)return;const l=lyrics[index];let end=Math.min(lyrics[index+1]?.time??146.1,l.time+7);if(index===3)end=22.8;if(index===16)end=85.0;if(t>end)return;const age=t-l.time;const a=smooth(age,0,.25)*(1-smooth(t,end-.65,end));if(a<=0)return;
 let s=l.jp,zh=l.zh==='//'?'':l.zh;const active=l.wordTiming.filter(w=>w.time<=t).length;
 ctx.save();ctx.globalAlpha=a;
 if(layout===3){const size=42;ctx.font=`${size}px CJK`;const w=ctx.measureText(s).width;rect(960-w/2-34,782,w+68,113,'#03090d',.7);text(s,960,832,size,WHITE,'CJK','center');text(zh,960,878,22,'#d3e1e6','CJK','center');}
 else if(layout===2){const size= Math.min(91,1500/s.length*1.1);text(s,115,820,size,WHITE,'CJK');text(zh,120,887,26,'#adb9bc','CJK');line(120,742,120+clamp(active/l.wordTiming.length)*480,742,CYAN,2,.8);}
 else if(layout===1){ctx.translate(1670,167);let size=s.length>24?27:33;let chars=[...s];chars.forEach((c,i)=>{if(c===' ')return;text(c,0,i*(size+5),size,WHITE,'CJK','center',i<active?1:.55);});ctx.restore();text(zh,108,929,24,'#b6ccd0','CJK','left',a);return;}
 else {const y=index%2?760:690;const size=Math.min(63,1410/s.length);text(s,126,y,size,WHITE,'CJK');text(zh,130,y+53,24,'#bdc7ca','CJK');text(String(index+1).padStart(2,'0')+' / LRC',130,y-81,13,CYAN);line(128,y-58,128+160*smooth(age,0,.6),y-58,CYAN,1);}
 ctx.restore();
}
function drawBoot(t:number){starfield(t,.04);const pulse=Math.pow(Math.max(0,Math.sin(t*3)),18);cam.dist=9;mesh(ico,[3,0,0],[2,2,2],[t*.13,t*.1,.3],WHITE,false,.035+pulse*.12);if(t>.8)line(180,540+Math.sin(t)*70,1740,540+Math.sin(t)*70,WHITE,.8,t<1.4?.5:.12);text('ARCHIVE',115,798,18,WHITE,'Text','left',smooth(t,.4,2)*.55);text('END OF MAIN STORY',115,829,11,'#64696c');text('SIGNAL DETECTED',115,856,11,CYAN,'Text','left',smooth(t,3.1,4.8)*.7);text('09',1690,530,21,WHITE,'Text','left',pulse*.7);}
function drawDawn(t:number){const u=t-5.321;const a=smooth(u,0,3);glow(1270,660,890,'#153c54',.55*a);glow(1230,610,440,'#a68256',.2*a);starfield(t,.45*a);cam.cx=1240;cam.cy=490;cam.dist=9;
 ctx.save();const g=ctx.createLinearGradient(0,170,0,810);g.addColorStop(0,'#06090d');g.addColorStop(.85,'#111c24');g.addColorStop(1,'#48606a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(1240,450,313,0,TAU);ctx.fill();ctx.restore();circle(1240,450,314,'#769dae',1,.6*a,.22,3.6);orbit(4.5,[1.01,.36,u*.055],[0,0,0],WHITE,.35*a);orbit(4.58,[1.01,.36,u*.055],[0,0,0],CYAN,.18*a);
 movingLine(t,0,.3*a);text('DAWN',80,340,154,'#768c98','Display','left',.12*a);tracked('A SIGNAL THAT REMEMBERS',104,379,16,4,WHITE,.6*a);chrome('RECALL','00 / SIGNAL',a*.5);lyric(t,0);}
function drawArchive(t:number){const u=t-19.851;const build=smooth(u,0,6);const cut=Math.floor(u/3.49);cam={cx:1050,cy:560,f:1070,dist:13-cut*.6,roll:cut===2?-.38:.08*Math.sin(u*.4)};starfield(t,.25);glow(960,560,610,'#113342',.3);const rot=u*.12;
 for(let i=0;i<9;i++){const y=(i-4)*1.15;const turn=rot+i*.13;const appear=smooth(u,i*.45,i*.45+1.5);mesh(box,[Math.sin(i*.8+u*.15)*.3,y,0],[5.6*appear,.13,3.6*appear],[.12,turn,.01],i===8?CYAN:'#8999a3',true,.8);orbit(3.5,[Math.PI/2,0,turn],[0,y,0],i===8?CYAN:WHITE,.22*appear);const p=project([3.2,y,0]);text(String(i+1).padStart(2,'0'),p[0]+25,p[1],18,CYAN,'Text','left',appear*.7);}
 for(let j=0;j<4;j++){const angle=rot+j*Math.PI/2;const x=Math.cos(angle)*3,z=Math.sin(angle)*3;path([project([x,-5,z]),project([x,5,z])],WHITE,.7,.25);}
 text(String(1+Math.floor(u*.9)%9).padStart(2,'0'),-60,785,530,WHITE,'Display','left',.085+build*.07);tracked('MEMORY / CONSTRUCTION',94,215,20,5,WHITE,.8);text('NINE LAYERS. ONE CONTINUOUS LINE.',98,249,12,'#6f939d');movingLine(t,1,.38);chrome('MEMORY','01—09 / ASSEMBLY');lyric(t,0);}
function corridor(t:number,count:number,speed:number,light=false){for(let j=count-1;j>=0;j--){const z=(j*2.8-t*speed%2.8)+1;const twist=Math.sin(j*.18+t*.3)*.3;const r=5.2;const pts:P[]=[];for(let i=0;i<4;i++){const ang=Math.PI/4+i*Math.PI/2+twist;pts.push(project([Math.cos(ang)*r,Math.sin(ang)*r,z-8]));}path(pts,light?'#243239':j%3===0?CYAN:WHITE,j%4===0?2:1,clamp(1-z/85)*.55,true);}}
function drawNext(t:number){const u=t-33.84;const shot=Math.floor(u/3.55)%4;cam={cx:1040,cy:490,f:1100,dist:9,roll:[-.23,.58,0,-.75][shot]+Math.sin(u*.13)*.08};starfield(t,.35,2);glow(1040,450,590,'#06313a',.28);
 if(shot===0||shot===3){corridor(t,24,3.2);text(shot===0?'NEXT':'UNKNOWN',-20,530,shot===0?320:230,WHITE,'Display','left',.12);}
 if(shot===1){for(let i=0;i<19;i++){const z=i*2.5-(u*3%2.5);mesh(box,[Math.sin(i)*4.8,Math.cos(i*.7)*3,z-7],[.25,12,.4],[0,.2,u*.025],i%3===0?CYAN:'#9eaaae',true,.6);}text('時間',70,450,230,WHITE,'CJK','left',.14);}
 if(shot===2){cam.dist=7.8;mesh(ico,[2.4,.3,0],[2.5,2.5,2.5],[u*.22,u*.16,0],WHITE,false,.85);for(let i=0;i<4;i++)orbit(3.9+i*.4,[u*.08+i*.5,.6,i*.2],[2.4,.3,0],i%2?CYAN:WHITE,.25);tracked('NO ANSWER',100,310,49,13);line(100,340,690,340,CYAN,1);}
 movingLine(t,1,.7);for(let i=0;i<6;i++)text(`${String((i+Math.floor(u))%9+1).padStart(2,'0')} // ${Math.floor(hash(i+shot)*99999)}`,94,406+i*22,12,'#a7bdc4','Text','left',shot===2?.7:.3);chrome('CONTINUE','03 / NEXT LAYER');lyric(t,shot===1?1:2);}
function drawAscent(t:number){const u=t-58.315,shot=Math.floor(u/2.82)%5;cam={cx:shot===2?690:960,cy:410,f:1000,dist:8,roll:shot===1?.62:shot===3?-.53:Math.sin(u*.5)*.07};const white=shot===4;
 if(white)rect(0,0,1920,1080,'#d9e4e5');else {glow(960,370,670,'#1b5b6d',.7);starfield(t,.75,8);}
 for(let j=42;j>=0;j--){const z=(j*1.65-u*7%1.65);const y=-1.3+j*.1;mesh(box,[0,y,z-5],[6,.055,1.0],[0,0,0],white?'#122932':j%4===0?'#e8f7ef':'#639bab',true,clamp(1-j/65));if(j%3===0){const p=project([0,y+.06,z-5]);line(p[0]-200/(1+z*.14),p[1],p[0]+200/(1+z*.14),p[1],white?'#111c28':WHITE,1,.7);}}
 corridor(u,18,7,white);glow(960,330,180,white?'#ffffff':'#e8f9ed',.82);line(960,50,960,1080,white?'#ffffff':WHITE,2,.6);
 if(shot===2){ctx.save();ctx.translate(110,330);ctx.rotate(-Math.PI/2);text('ASCEND',-620,0,190,white?'#18353b':WHITE,'Display','left',.9);ctx.restore();}
 if(shot===3){text('01',-24,1050,480,WHITE,'Display','left',.13);text('∞',1500,330,230,WHITE,'Display','left',.2);}
 if(white){rect(50,720,1660,210,'#050b10',.9);}lyric(t,2);chrome('ASCENT','04 / ONE WAY',white?.4:.7);
}
function drawSeparation(t:number){const u=t-78.299;cam={cx:1080,cy:480,f:1000,dist:12+u*.16,roll:0};glow(1120,525,640,'#142836',.22);starfield(t,.14);const d=smooth(u,0,11)*2.6;mesh(ring,[-d,.25,0],[1.25,1.25,1.25],[.65,u*.034,.22],WHITE,false,.55);mesh(ring,[d,-.25,1],[1.25,1.25,1.25],[-.65,-u*.031,-.22],CYAN,false,.32);line(300,665,1610,665,WHITE,.6,.12*(1-u/24));const p=project([-d,.25,0]);glow(p[0],p[1],24,'#e5e9d8',.13);lyric(t,0);if(u>8){text('…',960,822,20,'#8a979d','Text','center',.45);}text('DISTANCE / '+(u*1827).toFixed(0),1530,896,12,'#7b8892','Text','left',.32);}
function drawReconnect(t:number){const u=t-98.076;cam={cx:1230,cy:470,f:1060,dist:9,roll:.16*Math.sin(u)};starfield(t,.3);glow(1240,500,580,'#132e46',.6);const assemble=smooth(u,0,10);
 for(let i=0;i<9;i++){const a=i/9*TAU+u*.18;const r=3.4+3*(1-assemble);mesh(box,[Math.cos(a)*r,Math.sin(a)*r,Math.sin(i)*2],[.18,1.6,1.2],[u*.1,a,.2],i===8?CYAN:'#adbdc7',true,.85);}
 mesh(ico,[0,0,0],[1.65,1.65,1.65],[u*.08,u*.1,0],CYAN,false,.25+assemble*.5);orbit(4.2,[.9,.3,u*.12]);text(u<6?'RE:':'HOME?',70,490,u<6?330:215,WHITE,'Display','left',.85);tracked(u<6?'ESTABLISHING A CONNECTION':'SEARCHING FOR HOME',90,545,17,4,CYAN);for(let i=0;i<19;i++){const w=hash(i+22)*410;rect(95,592+i*5,w,1,WHITE,.1*assemble);}movingLine(t,0,.65);chrome('RECONSTRUCTION','06 / RECONNECT');lyric(t,2);}
function drawConvergence(t:number){const u=t-113.098,p=clamp(u/19.899);const shot=Math.floor(u/2.15)%5;cam={cx:960+Math.sin(u*.36)*90,cy:480,f:1050,dist:10-p*3.7,roll:Math.sin(u*.6)*.33+(shot===2?Math.PI/2:0)};
 glow(960,480,700,'#0b4050',.30+feat[2]*.18);starfield(t,.7,7+p*9);corridor(u,16,9+p*9);
 for(let i=0;i<7;i++)orbit(2.2+i*.47,[u*.17+i*.35,u*.11+i*.7,i*.21],[0,0,0],i%3===0?CYAN:WHITE,.32);
 mesh(ico,[0,0,0],[2.35+p,2.35+p,2.35+p],[u*.13,u*.2,0],'#182b36',true,1);mesh(ico,[0,0,0],[2.36+p,2.36+p,2.36+p],[u*.13,u*.2,0],CYAN,false,.5);
 for(let i=0;i<60;i++){const a=i*2.399+u*.05;const rad=3.8+hash(i+271)*6*(1-p*.7);const z=((hash(i+91)*23-u*(2+p*6))%23+23)%23-5;mesh(box,[Math.cos(a)*rad,Math.sin(a)*rad,z],[.2+hash(i+3)*.55,.06+hash(i+9)*1.2,.03],[u*.15+a,a,u*.22],i%7===0?CYAN:'#a5b7c0',true,.55);}
 if(shot===1||shot===4){text(String(Math.min(9,Math.floor(u*.45)+1)).padStart(2,'0'),-70,895,650,WHITE,'Display','left',.17);text('ALL PATHS',1840,204,72,WHITE,'Display','right',.75);}if(shot===3){ctx.save();ctx.translate(1920,0);ctx.rotate(Math.PI/2);text('CONVERGENCE',0,270,220,WHITE,'Display','left',.12);ctx.restore();}
 for(let j=0;j<9;j++){const a=j/9*TAU-u*.2;const x=960+Math.cos(a)*(600-p*170),y=500+Math.sin(a)*380;text(String(j+1).padStart(2,'0'),x,y,18,WHITE,'Text','center',.65);cross(x,y+12,4,CYAN,.5);}
 movingLine(t,1,.8);chrome('CONVERGENCE','07 / ALL PATHS → 09');lyric(t,2);
}
function drawThreshold(t:number){const u=t-132.997;starfield(t,.18);cam={cx:960,cy:540,f:1000,dist:6.5,roll:0};mesh(ico,[0,0,0],[2.6,2.6,2.6],[.2+u*.04,u*.06,0],'#1d2a32',true,.8);orbit(3,[1.3,.1,0],[0,0,0],WHITE,.2);text(lyrics[25].jp,960,572,99,WHITE,'CJK','center',smooth(u,0,.3));text(lyrics[25].zh,960,635,23,WHITE,'CJK','center',.65);line(0,539,1920,539,CYAN,1,.5);if(t>=135.125)rect(0,0,1920,1080,'#000');}
function sky(t:number,opacity=1){ctx.save();ctx.globalAlpha=opacity;const g=ctx.createLinearGradient(0,0,0,1080);g.addColorStop(0,'#102637');g.addColorStop(.37,'#426374');g.addColorStop(.57,'#afad9e');g.addColorStop(.665,'#f2dfb1');g.addColorStop(.7,'#e9d5ad');g.addColorStop(.735,'#728591');g.addColorStop(1,'#182c40');ctx.fillStyle=g;ctx.fillRect(0,0,1920,1080);
 glow(1040,666,460,'#fff5cc',.5);for(let i=0;i<30;i++){const y=714+i*i*.32;line(0,y,1920,y,'#d2d8d0',.5,.09*(1-i/30));}
 // A silent ocean made from parametric line bands; no stock imagery.
 for(let i=0;i<15;i++){const y=170+i*26;ctx.beginPath();for(let x=0;x<=1920;x+=32){const yy=y+Math.sin(x*.002+i*.4+t*.025)*20+Math.sin(x*.006+i)*5;x?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.strokeStyle=`rgba(210,223,226,${.014+i*.001})`;ctx.lineWidth=8+i%4*3;ctx.stroke();}ctx.restore();}
function drawReveal(t:number){const u=t-135.258;sky(t);const open=smooth(u,0,4.8);const r=610;ctx.save();ctx.fillStyle='#05080b';ctx.beginPath();ctx.arc(960-open*1260,520,r,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(960+open*1260,520,r,-Math.PI/2,Math.PI/2);ctx.closePath();ctx.fill();ctx.restore();
 cam={cx:960,cy:440,f:1000,dist:12,roll:0};orbit(4.3,[.65,.2,u*.022],[0,0,0],'#e5e7d9',.35*open);orbit(4.34,[.65,.2,u*.022],[0,0,0],WHITE,.13*open);
 line(0,714,1920,714,'#fdf2d4',1.5,.7);for(let i=0;i<42;i++){const x=hash(i+343)*1920,y=hash(i+655)*650;rect(x,y,1.2,1.2,WHITE,open*.6);}tracked('THE WORLD CONTINUES',120,162,19,6,WHITE,open*.7);lyric(t,3);text('09',1794,158,50,WHITE,'Display','right',open*.7);}
function drawAfterstory(t:number){const u=t-142.383;if(u<8){sky(t,1-smooth(u,2,8));line(0,714,1920,714,WHITE,1,(1-smooth(u,0,8))*.5);lyric(t,3);for(let i=0;i<9;i++){const fade=i===8?1-smooth(u,5.7,8):1-smooth(u,i*.35,i*.35+1.3);text(String(i+1).padStart(2,'0'),258+i*171,490,i===8?42:23,WHITE,'Text','center',fade*.8);}return;}
 if(t<157.5){const a=smooth(t,150.5,151.5)*(1-smooth(t,156.6,157.5));text('PHIGROS',960,434,142,WHITE,'Display','center',a);tracked('MAIN STORY / COMPLETE',679,503,21,5,WHITE,a*.8);text('2019 — 2026',960,555,22,'#899a9f','Text','center',a);line(750,597,1170,597,WHITE,1,a*.3);tracked('THANK YOU FOR THE JOURNEY',672,650,18,3,WHITE,a*.9);
 text('MUSIC',960,765,11,'#829096','Text','center',a);text('What do you want more than a Happy ending?  /  濒笼',960,797,19,WHITE,'CJK','center',a*.8);text('ORIGINAL PROCEDURAL VISUALS  ·  SEE SOURCES.md',960,840,12,'#829096','Text','center',a);text('UNOFFICIAL FAN TRIBUTE  /  NOT AFFILIATED WITH PIGEON GAMES',960,898,13,'#829096','Text','center',a);}
 else if(t>=158.0&&t<161.72){const a=smooth(t,158,158.45)*(1-smooth(t,161.35,161.72));const shift=t>161.12&&t<161.19?11:0;text('What do you want more than a Happy ending?',960+shift,548,42,WHITE,'Text','center',a);line(751,589,1169,589,CYAN,1,a*.35);}
}
const cuts=[5.321,19.851,33.84,58.315,78.299,98.076,113.098,132.997,135.258,142.383];
const glitchEvents=audio.majorTransients.filter((v,i,a)=>v.time>33.84&&v.time<132.8&&!(v.time>78.2&&v.time<98.1)&&i%5===0);
export function paint(canvas:HTMLCanvasElement,t:number,f:number,fps:number){ctx=canvas.getContext('2d',{alpha:false})!;now=t;frame=f;feat=audio.frames[Math.min(audio.frames.length-1,Math.round(t*audio.featureRate))];ctx.setTransform(canvas.width/1920,0,0,canvas.height/1080,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#050505';ctx.fillRect(0,0,1920,1080);cam={cx:960,cy:540,f:1000,dist:10,roll:0};
 if(t<5.321)drawBoot(t);else if(t<19.851)drawDawn(t);else if(t<33.84)drawArchive(t);else if(t<58.315)drawNext(t);else if(t<78.299)drawAscent(t);else if(t<98.076)drawSeparation(t);else if(t<113.098)drawReconnect(t);else if(t<132.997)drawConvergence(t);else if(t<135.258)drawThreshold(t);else if(t<142.383)drawReveal(t);else drawAfterstory(t);
 // Restrained audio-driven horizontal corruption, for 2–4 frames only.
 const event=glitchEvents.find(e=>t>=e.time&&t<e.time+(.035+.023*e.strength));
 if(event){const k=Math.floor(event.time*100);for(let i=0;i<5;i++){const y=hash(k+i)*1050;const h=2+hash(k+i+90)*34;const dx=(hash(k+i+8)-.5)*100;ctx.drawImage(canvas,0,y*canvas.height/1080,canvas.width,h*canvas.height/1080,dx,y,1920,h);rect(hash(k+i+14)*1800,y,40+hash(i+5)*220,1,CYAN,.8);}text('//// '+Math.floor(event.time*1000).toString(16).toUpperCase(),1460,120,20,'#f06165');}
 // Designed 2–3 frame black punctuations, never extended accidental blackouts.
 const blackHits=[61.85,67.5,73.14,117.4,121.7,128.2,131.9];if(blackHits.some(h=>t>=h&&t<h+.05))rect(0,0,1920,1080,'#000');
 const flash=cuts.find(c=>t>=c&&t<c+.033&&c!==78.299&&c!==142.383&&c!==5.321);if(flash)rect(0,0,1920,1080,'#e5eef0',.8);
 if(t>161.72)rect(0,0,1920,1080,'#000');
}
