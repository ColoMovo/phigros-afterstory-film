import * as T from 'three';
import {world,mesh,profile,beam,cable,text,island,dataTree,foldedBody,instances,fragments,look,materials,hash,smooth,lerp,leafGeo,getArtwork,type World,type V,type Mat} from './opening-world';

// Independent spatial rules. A palette swap is insufficient: each constructor
// chooses its own light rig, silhouette, material response and camera grammar.
const TAU=Math.PI*2;
function rig(w:World,fill:number,keyColor:string,keyPower:number,rimColor:string,rimPower:number){
 w.scene.children.filter(o=>o instanceof T.Light).forEach(o=>w.scene.remove(o));
 w.scene.add(new T.HemisphereLight('#ffffff','#090608',fill));
 const key=new T.DirectionalLight(keyColor,keyPower);key.position.set(-180,220,-140);key.target.position.set(0,0,240);w.scene.add(key,key.target);
 key.castShadow=keyPower>1;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-420,right:420,top:400,bottom:-320,near:1,far:1500});key.shadow.normalBias=.4;
 const rim=new T.DirectionalLight(rimColor,rimPower);rim.position.set(140,70,440);w.scene.add(rim);w.scene.userData.environmentIntensity=fill*.08;
}
function roles(w:World,colors:Partial<Record<Mat,string>>,roughness=.8){
 const cache=new Map<T.Material,T.Material>();
 for(const [role,color] of Object.entries(colors)){const m=materials[role as Mat].clone();m.color.set(color!);if('roughness' in m)m.roughness=roughness;cache.set(materials[role as Mat],m)}
 w.scene.traverse(o=>{if(o instanceof T.Mesh)o.material=Array.isArray(o.material)?o.material.map(m=>cache.get(m)??m):cache.get(o.material)??o.material});
}
function backdrop(w:World,stops:Array<[number,string]>){
 const c=document.createElement('canvas');c.width=32;c.height=512;const x=c.getContext('2d')!,g=x.createLinearGradient(0,0,0,512);stops.forEach(s=>g.addColorStop(...s));x.fillStyle=g;x.fillRect(0,0,32,512);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;w.scene.background=tx;
}
function surface(p:T.Object3D,n:number,m:number,at:(u:number,v:number)=>V,material:T.Material){
 const a:number[]=[],uv:number[]=[],ix:number[]=[];
 for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){a.push(...at(i/n,j/m));uv.push(i/n,j/m);if(i<n&&j<m){const k=i*(m+1)+j;ix.push(k,k+1,k+m+1,k+1,k+m+2,k+m+1)}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(a,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();const o=new T.Mesh(geo,material);p.add(o);return o;
}
function haze(w:World){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d')!,g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(244,252,255,.38)');g.addColorStop(1,'rgba(244,252,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const tx=new T.CanvasTexture(c);
 for(let i=0;i<9;i++){const o=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,depthWrite:false,opacity:.5}));o.position.set(-450+i%3*360,-80+(i%2)*60,500+Math.floor(i/3)*300);o.scale.set(650,150,1);w.root.add(o)}
}
function archipelago(family:string){
 const w=world('#82c1e7',300,1600);backdrop(w,[[0,'#2d82bb'],[.56,'#a6d9ed'],[.82,'#e1f0e6'],[1,'#f8f2d6']]);rig(w,.7,'#fff0d9',3.5,'#b3e8ff',1.1);
 const hero=new T.Group();w.root.add(hero);w.primary=hero;
 const terrain:V[]=[[-160,-55,170],[135,-85,380],[-280,60,710],[300,100,980],[30,-65,580]];
 terrain.forEach((p,i)=>{
  island(hero,p,i===0?170:70+i*19,i===0?190:90+i*27,'navy',710+i*34);
  // Eroded rock ridges and an irregular living upper surface, rather than white slabs.
  surface(hero,32,12,(u,v)=>[p[0]+(u-.5)*(i===0?290:110),p[1]+Math.sin(u*7+v*4)*5,p[2]+(v-.5)*(i===0?180:110)],new T.MeshStandardMaterial({color:'#344c46',roughness:1,side:T.DoubleSide}));
  if(i<3){const tree=dataTree(w,[p[0]+22,p[1],p[2]],i===0?2.6:1.1);tree.rotation.y=i*.6}
  for(let j=0;j<3;j++)cable(hero,[[p[0]+j*15,p[1],p[2]],[p[0]+j*15+8,p[1]-65,p[2]+8],[p[0]+j*15-12,p[1]-160,p[2]+30]],.45,'white');
 });
 for(let i=0;i<20;i++){const a=i*2.4;island(w.root,[Math.cos(a)*(430+i*19),-70+hash(i+4)*150,650+hash(i+12)*600],10+hash(i)*28,30+hash(i+55)*70,'stone',810+i)}
 haze(w);fragments(w,260,650,1100,'leaf',840);
 roles(w,{navy:'#101f27',stone:'#4d666e',leaf:'#00b99e',leafblue:'#0755bc',leafviolet:'#583e95',white:'#e0f3ed'},.97);
 const near=profile(w.root,[[-95,-170],[-90,130],[-8,85],[29,-60],[5,-200]],28,[-245,-40,70],[0,.12,-.2],'navy','stone');
 if(family==='canopy'){
  w.camera=(q,c)=>look(c,[-145+q*175,35+q*85,85+q*235],[-130,105,310],105,-.2+q*.38);
  w.moving.push(q=>{hero.rotation.y=q*.07;near.position.x=-245-q*210});
 }else if(family==='islands'){
  w.camera=(q,c)=>look(c,[-80+q*200,-10+smooth(.35,.8,q)*115,-120+q*470],[0,80,660],99,Math.sin(q*Math.PI)*-.2);
  w.moving.push(q=>{near.position.x=-245+q*70});
 }else{
  w.camera=(q,c)=>look(c,[-140+q*120,-50+q*100,-140+q*250],[80,20,580],100,-.2+q*.18);
  w.moving.push(q=>{near.position.x=-245+q*120;hero.position.y=smooth(.48,.78,q)*12});
 }
 return w;
}
function cathedral(family:string){
 const w=world('#ece8df',850,2100);rig(w,.25,'#fff6e8',4.8,'#eeeeee',.25);w.scene.userData.environmentIntensity=0;
 const g=new T.Group();w.root.add(g);w.primary=g;
 // A real enclosing nave: vertical mass, a floor and hard projecting buttresses.
 const floor=mesh(w.root,new T.PlaneGeometry(1800,2600),'stone',[0,-85,720],[1,1,1],[-Math.PI/2,0,0]);
 for(let i=0;i<8;i++)for(const side of [-1,1]){
  const z=10+i*155;
  profile(g,[[-30,-85],[-30,410],[-7,490],[31,410],[25,-85]],45,[side*180,0,z],[0,side*.06,0],'navy','stone');
  beam(g,[side*180,260,z],[side*55,370,z+45],17,22,'navy');
  profile(g,[[-5,-85],[-5,110],[25,10],[42,-85]],16,[side*135,0,z+5],[0,0,0],'navy','stone');
 }
 const labels=family==='temple'?['01','02','03']:family==='glass04'?['04']:family==='impossible'?['05','06']:family==='monuments'?['07','08']:['09'];
 const ns=labels.map((value,i)=>{const o=text(g,value,[labels.length===3?(i-1)*250:labels.length===2?(i-.5)*230:20,70,200+i*210],family==='macro09'?320:family==='glass04'?240:180,'navy',45);return o});
 if(family==='glass04'){ns[0].rotation.x=Math.PI/2;ns[0].rotation.z=-.15;ns[0].position.set(0,-10,310);(floor.material as T.MeshStandardMaterial)=(materials.obsidian.clone());}
 if(family==='impossible'){ns[0].rotation.z=-.4;ns[1].rotation.z=.7;beam(g,[-165,120,210],[145,200,450],29,28,'navy');}
 const line=beam(w.root,[-600,-25,100],[600,-25,100],.5,.5,'energy');
 roles(w,{navy:'#080808',white:'#f1eee7',stone:'#a7a199',energy:'#e63229',cyan:'#85adaf'},.95);
 if(family==='monuments'){
  w.scene.background=new T.Color('#010a10');if(w.scene.fog)w.scene.fog.color.set('#010a10');
  rig(w,.025,'#a7e5ff',3.2,'#eaffff',4.0);
  g.traverse(o=>{if(o instanceof T.Mesh){const shade=(original:T.Material)=>{const m=original.clone() as T.MeshStandardMaterial;if(m.color)m.color.set('#89b9c5');if('roughness' in m)m.roughness=.75;return m};o.material=Array.isArray(o.material)?o.material.map(shade):shade(o.material)}});
  floor.material=new T.MeshStandardMaterial({color:'#01080c',roughness:.24,metalness:.83});
  fragments(w,180,370,1000,'energy',1790);
 }
 w.moving.push(q=>{line.position.z=70+q*850;if(family==='glass04')ns[0].rotation.z=-.15-smooth(.5,.8,q)*.25;if(family==='monuments')g.rotation.z=smooth(.3,.7,q)*Math.PI/2});
 w.camera=(q,c)=>{
  if(family==='macro09')look(c,[100-q*160,-22,125+q*85],[0,25,280],104,.17);
  else if(family==='glass04')look(c,[-80+q*100,95-q*125,-70+q*270],[0,8,350],99,q*.3);
  else look(c,[Math.sin(q*2.5)*32,-65+q*18,-110+q*(family==='monuments'?320:410)],[0,100,650],108,family==='monuments'?smooth(.3,.7,q)*Math.PI/2:family==='impossible'?-q*.5:0);
 };return w;
}
function machinery(deep=false){
 const w=world('#010205',300,2000);rig(w,.06,'#386594',1.6,'#599bbe',4.4);w.scene.userData.environmentIntensity=0;
 const g=new T.Group();w.root.add(g);w.primary=g;
 // One continuous concave shell defines an interior whose circumference extends
 // beyond the picture. Rotor, lattice skin and suspended arms are subordinate.
 surface(g,120,24,(u,v)=>{const a=u*TAU,rad=300+Math.sin(a*3)*28;return[Math.cos(a)*rad,Math.sin(a)*rad,-100+v*1800]},new T.MeshStandardMaterial({color:'#070b12',roughness:.86,metalness:.72,side:T.DoubleSide}));
 const rotor=new T.Group();rotor.position.z=deep?660:570;g.add(rotor);
 for(let i=0;i<12;i++){
  const a=i/12*TAU;
  profile(rotor,[[-12,35],[-25,190],[0,270],[47,225],[28,76]],22,[0,0,0],[0,.12,a],'navy','silver');
  cable(rotor,[[Math.cos(a)*65,Math.sin(a)*65,-20],[Math.cos(a+.18)*190,Math.sin(a+.18)*190,-12],[Math.cos(a+.3)*250,Math.sin(a+.3)*250,10]],.28,'energy');
 }
 for(let i=0;i<7;i++){
  const z=-20+i*240,a=i*.51;
  for(let j=0;j<4;j++){const b=a+j*Math.PI/2;beam(g,[Math.cos(b)*220,Math.sin(b)*220,z],[Math.cos(b+.18)*145,Math.sin(b+.18)*145,z+145],18,26,'navy');profile(g,[[-28,-120],[-40,90],[9,170],[42,50],[19,-110]],26,[Math.cos(b)*240,Math.sin(b)*240,z],[0,.17,b],'navy','silver');}
  if(i%2===0)cable(g,[[-130,-185,z],[-180,-80,z+140],[-170,60,z+220]],1.1,'silver');
 }
 const horizon=cable(g,[[ -200,-90,530],[0,-40,570],[200,110,640]],.45,'energy');
 fragments(w,520,550,1500,'silver',980);roles(w,{navy:'#142031',silver:'#647f96',energy:'#bc702c',white:'#101820'},.72);
 const amber=new T.PointLight('#d28439',deep?30:50,420,2);amber.position.set(-80,-25,rotor.position.z-80);w.scene.add(amber);
 w.moving.push(q=>{rotor.rotation.z=-q*.6;horizon.scale.x=1+smooth(.45,.7,q)*.1;amber.intensity=(deep?30:50)*(1+smooth(.56,.7,q)*2)});
 w.camera=(q,c)=>look(c,[deep?160+90*Math.sin(q*2):210-q*100,deep?-65+q*80:30-q*90,-120+q*(deep?845:565)],[-40,20,deep?1300:1050],deep?111:104,deep?-.4+q*.7:-.12+q*.36);return w;
}
function tissue(family:string){
 const w=world('#250945',400,1300);backdrop(w,[[0,'#170520'],[.5,'#502179'],[1,'#b83d9c']]);rig(w,.22,'#c998f5',2.1,'#ec9fcf',2.7);w.scene.userData.environmentIntensity=.08;
 const g=new T.Group();w.root.add(g);w.primary=g;
 const membrane=new T.MeshPhysicalMaterial({color:'#793acd',roughness:.53,metalness:.04,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false});
 const petal=new T.MeshStandardMaterial({color:'#d396c9',roughness:.78,side:T.DoubleSide});
 // A coherent branching corolla, with folds, veins and fibrous surfaces.
 for(let i=0;i<7;i++){
  const a=i/7*TAU;
  const o=surface(g,70,18,(u,v)=>{const r=18+u*210,width=Math.sin(u*Math.PI)*(.8+v*.4);const angle=a+(v-.5)*.9*width;return[Math.cos(angle)*r,Math.sin(angle)*r,220+Math.sin(u*Math.PI)*100+(v-.5)**2*75+Math.sin(u*9+i)*4]},i%3?membrane.clone():petal.clone());
  for(let j=0;j<4;j++){const b=a+(j-1.5)*.12;cable(g,[[Math.cos(a)*20,Math.sin(a)*20,220],[Math.cos(b)*90,Math.sin(b)*90,310],[Math.cos(b)*190,Math.sin(b)*190,250]],.16,'white')}
  const base=o.rotation.clone();w.moving.push(q=>{o.rotation.copy(base);o.rotation.z=Math.sin(q*4+i)*.04});
 }
 for(let i=0;i<11;i++){const a=i*.66;cable(g,[[Math.cos(a)*25,-170,180],[Math.cos(a)*80,-10,245],[Math.cos(a)*165,135,340]],1.4,'violet');}
 fragments(w,450,360,470,'silver',1180);roles(w,{white:'#e9c5e5',silver:'#b272d1',violet:'#4c136d'},.85);
 w.camera=(q,c)=>look(c,[-100+q*150,60+Math.sin(q*2)*50,60+q*145],[-15,15,275],family==='crystals'?87:94,-.28+q*.42);return w;
}
function macroLeaf(){
 const w=world('#fffefa',1000,2000);w.scene.fog=null;rig(w,.6,'#ffffff',2.7,'#a8c9ff',.6);
 const g=new T.Group();w.root.add(g);const strips:T.Mesh[]=[];
 for(let k=0;k<3;k++){
  const o=surface(g,40,10,(u,v)=>{const t=(k+v)/3,b=(t-.5)*2,width=Math.sin(u*Math.PI)*(1-.3*u);return[b*width*83,(u-.5)*205,Math.sin(u*Math.PI)*14-b*b*width*12]},new T.MeshStandardMaterial({color:'#123fca',roughness:.72,side:T.DoubleSide}));strips.push(o);
 }
 const veins=new T.Group();g.add(veins);cable(veins,[[0,-102,0],[0,0,14],[0,102,0]],.35,'energy');
 for(let i=1;i<10;i++)for(const side of [-1,1]){const q=i/10,y=(q-.5)*205;cable(veins,[[0,y,14],[side*Math.sin(q*Math.PI)*40,y+13,10],[side*Math.sin(q*Math.PI)*77,y+24,1]],.17,'energy')}
 const debris=new T.Group();w.root.add(debris);for(let i=0;i<7;i++)island(debris,[(-1+i*.35)*85,-35+hash(i)*65,90+hash(i+8)*60],18+hash(i+4)*15,30+hash(i+50)*40,'navy',1200+i);
 w.moving.push(q=>{g.visible=q>=1/6;g.position.set(-180+120*smooth(1/6,.42,q),0,65);g.rotation.set(.05,q*.4,-.55+q*.3);veins.visible=q>.43;strips.forEach((o,i)=>{o.position.x=(i-1)*smooth(.56,.84,q)*28;o.position.z=(i-1)*smooth(.56,.84,q)*29});g.scale.setScalar(1-smooth(.84,1,q));debris.visible=q>.82;debris.scale.setScalar(smooth(.82,1,q));});
 w.camera=(q,c)=>look(c,[0,0,-55+smooth(.65,1,q)*70],[0,0,100],75,.03);return w;
}
function macroDrop(){
 const w=world('#ece7de',800,2000);w.scene.fog=null;rig(w,.65,'#ffffff',2.6,'#c0fbff',2.3);
 const g=new T.Group();w.root.add(g);const geo=new T.SphereGeometry(1,64,42),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),r=1-.5*Math.max(0,y);p.setXYZ(i,p.getX(i)*r*70,y*106,p.getZ(i)*r*43)}geo.computeVertexNormals();
 const drop=new T.Mesh(geo,new T.MeshPhysicalMaterial({color:'#00b9c9',roughness:.36,metalness:.04,transparent:true,opacity:.74,side:T.DoubleSide,depthWrite:false}));drop.position.set(0,30,80);g.add(drop);
 const tx=new T.Texture(getArtwork()[5]);tx.colorSpace=T.SRGBColorSpace;tx.needsUpdate=true;
 const memory=new T.Mesh(geo.clone(),new T.MeshBasicMaterial({map:tx,transparent:true,opacity:.2,side:T.DoubleSide,depthWrite:false}));memory.scale.setScalar(.91);memory.position.set(0,30,80);g.add(memory);
 const cut=beam(w.root,[-380,-58,35],[380,-58,35],.4,.4,'energy');
 const ripples:T.Mesh[]=[];for(let i=0;i<3;i++)ripples.push(surface(w.root,100,3,(u,v)=>{const a=u*TAU,r=70+i*44+v*3;return[Math.cos(a)*r,-58+Math.sin(a*4)*3,70+Math.sin(a)*r]},new T.MeshBasicMaterial({color:'#04b5c4',side:T.DoubleSide})));
 w.moving.push(q=>{const fall=smooth(.08,.66,q);drop.position.y=95-fall*120;memory.position.y=drop.position.y;drop.scale.y=1-smooth(.58,.78,q)*.88;drop.scale.x=1+smooth(.58,.78,q)*1.6;memory.scale.copy(drop.scale).multiplyScalar(.91);drop.visible=memory.visible=q<.82;ripples.forEach((o,i)=>{o.visible=q>.62;o.scale.setScalar(smooth(.62,1,q)*(1+i*.12));o.position.y=Math.sin(q*19+i)*smooth(.62,1,q)*7});cut.position.z=35+q*35});
 w.camera=(q,c)=>look(c,[-15+q*25,12, -65+q*22],[0,10,85],72,q*.12);return w;
}
function seedThreshold(){
 const w=world('#000000',1200,2000);w.scene.fog=null;rig(w,.015,'#ffdcb1',1.8,'#b78d53',2.8);w.scene.userData.environmentIntensity=0;
 const g=new T.Group();w.root.add(g);const sides:T.Mesh[]=[];
 for(const side of [-1,1]){const o=surface(g,50,16,(u,v)=>{const a=(side<0?Math.PI:0)+u*Math.PI,r=Math.sin(v*Math.PI)*15;return[Math.cos(a)*r,(v-.5)*55,80+Math.sin(a)*r*.7]},new T.MeshStandardMaterial({color:'#87704b',metalness:.75,roughness:.67,side:T.DoubleSide}));sides.push(o)}
 const opening=new T.Shape();opening.absellipse(0,0,12.5,24.5,0,TAU,false,0);const innerGeo=new T.ShapeGeometry(opening,64),uv=innerGeo.attributes.uv,pos=innerGeo.attributes.position;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/25+.5,pos.getY(i)/49+.5);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const cx=canvas.getContext('2d')!,gradient=cx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#d1e6ee');gradient.addColorStop(.6,'#f0fff6');gradient.addColorStop(1,'#ffffee');cx.fillStyle=gradient;cx.fillRect(0,0,256,512);cx.fillStyle='#b6c8ce';cx.beginPath();cx.moveTo(30,370);cx.lineTo(90,340);cx.lineTo(140,353);cx.lineTo(115,412);cx.closePath();cx.fill();const innerSky=new T.CanvasTexture(canvas);innerSky.colorSpace=T.SRGBColorSpace;
 const sky=new T.Mesh(innerGeo,new T.MeshBasicMaterial({map:innerSky,side:T.DoubleSide,toneMapped:false}));sky.position.set(0,0,95);g.add(sky);
 const distant=instances(w.root,150,leafGeo,'silver',(i,m)=>{m.position.set((hash(i)-.5)*1400,(hash(i+8)-.5)*750,300+hash(i+5)*1100);m.scale.setScalar(.2)});
 w.moving.push(q=>{const opened=smooth(.28,.75,q);sides.forEach((o,i)=>{o.position.x=(i?1:-1)*opened*32;o.rotation.y=(i?1:-1)*opened*.7});sky.scale.x=.01+opened;sky.scale.y=.1+opened*.9;distant.position.z=-q*30});
 w.camera=(q,c)=>look(c,[0,0,-460+smooth(.1,1,q)*542],[0,0,95],65,q*.1);return w;
}
function macroMembrane(){
 const w=world('#310654',1000,2000);w.scene.fog=null;backdrop(w,[[0,'#210531'],[.7,'#7325a0'],[1,'#c24cbd']]);w.scene.userData.environmentIntensity=0;
 const mat=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:{phase:{value:0}},vertexShader:`varying vec2 p;varying vec3 n;uniform float phase;void main(){p=uv;n=normal;vec3 q=position;q.z+=sin(q.x*.04+phase*5.)*4.+cos(q.y*.05-phase*3.)*4.;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}`,fragmentShader:`precision highp float;varying vec2 p;varying vec3 n;uniform float phase;void main(){vec2 s=p*vec2(18.,12.);float f=sin(s.x+sin(s.y*1.3)*.7+phase)*cos(s.y);float vein=pow(1.-abs(sin(s.x*3.+sin(s.y)*1.2)),24.);float micro=pow(.5+.5*sin(s.x*42.+sin(s.y*29.)*3.),18.);vec3 c=mix(vec3(.17,.014,.42),vec3(.85,.28,.73),.5+.5*f);c+=vein*vec3(.33,.46,.56)+micro*.09;gl_FragColor=vec4(c,.85);}`});
 surface(w.root,90,50,(u,v)=>[(u-.5)*600,(v-.5)*330,80+Math.sin(u*Math.PI)*26+Math.sin(v*Math.PI*2)*19],mat);
 for(let i=0;i<13;i++)cable(w.root,[[ -300,-115+i*19,76],[-90,-80+i*13,99],[80,-70+i*14,101],[300,-100+i*18,75]],.15,'silver');
 fragments(w,220,280,190,'silver',1330);
 w.moving.push(q=>{mat.uniforms.phase.value=q;});w.camera=(q,c)=>look(c,[-85+q*155,12+q*25,-10+q*134],[50,28,160],95,-.18+q*.32);return w;
}
function warmThreshold(family:string){
 const w=world('#f1e1bc',900,2000);backdrop(w,[[0,'#c39456'],[.6,'#f1ddac'],[1,'#fff7db']]);rig(w,.45,'#ffdf9d',3.1,'#f8f3e1',.7);
 const g=new T.Group();w.root.add(g);w.primary=g;
 for(let i=0;i<3;i++){
  // Three thick folded vaults, continuous shapes with different cross sections.
  const a=i*.45;
  foldedBody(g,(u,v)=>{if(i===1)return new T.Vector3(-260+u*520,-70+Math.sin(u*Math.PI)*110,360+v*125+Math.sin(u*Math.PI*1.5)*150);if(i===2)return new T.Vector3(-200+Math.sin(u*4)*90+v*48,-85+u*580,650+Math.cos(u*4)*70);const angle=-.4+u*4.7,r=180+v*70+Math.sin(angle*2+a)*24;return new T.Vector3(Math.cos(angle)*r,Math.sin(angle)*r-15,150+Math.sin(angle*2+a)*85)},'white',i===0?32:18,'navy');
  profile(g,[[-105,-10],[-70,25],[-15,9],[37,22],[90,10],[120,-25],[-40,-45]],18,[0,-80,150+i*240],[Math.PI/2,0,.1-i*.1],'stone','navy');
  for(const s of [-1,1])beam(g,[s*145,-65,150+i*240],[s*185,-190,190+i*240],15,20,'stone');
 }
 roles(w,{stone:'#b19264',navy:'#4b3825',energy:'#f2cd7c',white:'#f3e4bc'},.95);fragments(w,350,650,900,'gold',1480);
 w.moving.push(q=>{g.rotation.z=family==='labyrinth'?-smooth(.25,.75,q)*.45:smooth(.4,.85,q)*.16});
 w.camera=(q,c)=>look(c,[family==='bridge'?30-q*55:80-q*135,-30+smooth(.5,.95,q)*140,-120+q*650],[0,70,1000],104,family==='labyrinth'?-.2+q*.5:.05-q*.15);return w;
}
function graphicBlank(bg='#ffffff'){const w=world(bg,1000,2000);w.scene.fog=null;w.scene.userData.environmentIntensity=0;w.camera=(_,c)=>look(c,[0,0,-90],[0,0,100],65);return w}
function inkWorld(){
 const w=graphicBlank('#eee9df');const m=new T.ShaderMaterial({uniforms:{phase:{value:0}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`precision highp float;varying vec3 p;uniform float phase;
 float h(vec3 v){return fract(sin(dot(v,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise(vec3 v){vec3 i=floor(v),f=fract(v);f=f*f*(3.0-2.0*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){vec3 v=p*.027+vec3(phase*.8,phase*.13,0);float n=noise(v)*.55+noise(v*2.3)*.25+noise(v*5.1)*.13+noise(v*12.0)*.07;float cloud=smoothstep(.42,.67,n);float scratch=pow(noise(vec3(v.x*2.0,v.y*18.0,v.z)),8.0);vec3 c=mix(vec3(.003,.005,.006),vec3(.93,.91,.86),cloud*.83+scratch*.2);gl_FragColor=vec4(c,1.0);}`});
 const g=new T.SphereGeometry(155,64,40),p=g.attributes.position;for(let i=0;i<p.count;i++){const k=1+.022*Math.sin(p.getX(i)*.06)*Math.sin(p.getY(i)*.07);p.setXYZ(i,p.getX(i)*k,p.getY(i)*k,p.getZ(i)*k)}g.computeVertexNormals();
 const orb=new T.Mesh(g,m);orb.position.set(-80,0,185);w.root.add(orb);
 for(let i=0;i<3;i++)cable(w.root,Array.from({length:50},(_,j)=>{const a=-.4+j/49*4.7,r=205+i*19;return[Math.cos(a)*r-80,Math.sin(a)*r,160+Math.sin(a)*40] as V}),i===0?.7:.16,'navy');
 w.moving.push(q=>{m.uniforms.phase.value=q;orb.rotation.z=q*.33;orb.position.x=-80-q*55});w.camera=(q,c)=>look(c,[58-q*25,-12+q*28,-35+q*74],[-12,0,190],77,-.12+q*.32);return w;
}
function galleryWorld(){
 const w=world('#02090f',480,1600);rig(w,.018,'#87b9c9',1.4,'#f5ffff',4.6);w.scene.userData.environmentIntensity=.055;
 const dark=new T.MeshStandardMaterial({color:'#02090d',roughness:.73,metalness:.6,side:T.DoubleSide});
 const glass=new T.MeshPhysicalMaterial({color:'#aec9ce',roughness:.18,metalness:.06,transparent:true,opacity:.19,side:T.DoubleSide,depthWrite:false});
 // Enclosing masses are cropped by the lens. The bright exit cuts their
 // silhouette; the suspended specimens provide a softer interior layer.
 for(const side of [-1,1]){
  surface(w.root,30,10,(u,v)=>[side*(150+Math.sin(u*3.4)*18),-85+v*420,-70+u*1350],dark);
  profile(w.root,[[-13,-85],[-13,330],[8,370],[29,275],[23,-85]],38,[side*95,0,30],[0,side*.1,0],'navy','silver');
 }
 const floor=surface(w.root,50,32,(u,v)=>[(u-.5)*620,-80+Math.sin(u*29+v*38)*.12,-140+v*1500],new T.MeshStandardMaterial({color:'#071219',roughness:.2,metalness:.88,side:T.DoubleSide}));
 const panels:T.Mesh[]=[];
 for(let i=0;i<3;i++){
  const side=i%2?1:-1,x=side*77,z=155+i*195;
  const pane=surface(w.root,1,1,(u,v)=>[x-47+u*94,-78+v*165,z],glass.clone());panels.push(pane);
  profile(w.root,[[-45,-9],[-40,4],[38,4],[48,-10]],45,[x,-76,z+38],[Math.PI/2,0,0],'navy','silver');
  const specimen=new T.Group();specimen.position.set(x,-10,z+32);w.root.add(specimen);
  for(let j=0;j<5;j++){
   const a=j/5*TAU;
   surface(specimen,22,8,(u,v)=>{const r=10+u*42,angle=a+(v-.5)*Math.sin(u*Math.PI);return[Math.cos(angle)*r,Math.sin(angle)*r,Math.sin(u*Math.PI)*18]},new T.MeshStandardMaterial({color:'#718b80',roughness:.88,side:T.DoubleSide}));
   cable(specimen,[[0,-42,0],[Math.cos(a)*24,Math.sin(a)*24,16],[Math.cos(a)*55,Math.sin(a)*55,2]],.24,'silver');
  }
  text(w.root,String(i+7).padStart(2,'0'),[x+18,-68,z-1],8,'silver',.4);
 }
 const exit=mesh(w.root,new T.PlaneGeometry(165,310),'white',[0,74,880]);exit.material=new T.MeshBasicMaterial({color:'#f0ffff',side:T.DoubleSide,toneMapped:false,fog:false});
 const doors=[-1,1].map(side=>profile(w.root,[[-52,-85],[-52,243],[52,243],[52,-85]],25,[side*48,0,720],[0,0,0],'navy','silver'));
 const cut=beam(w.root,[-240,-78,100],[240,-78,100],.35,.35,'energy');
 fragments(w,240,290,1000,'silver',2023);roles(w,{navy:'#03070a',silver:'#9baeb4',energy:'#c3f2eb'},.7);
 w.moving.push(q=>{panels.forEach((p,i)=>{p.position.x=(i%2?1:-1)*smooth(.23,.52,q)*32});doors.forEach((p,i)=>{p.position.x=(i?1:-1)*(48+smooth(.42,.7,q)*110)});cut.position.z=100+smooth(.1,.55,q)*590;floor.position.y=Math.sin(q*8)*.08});
 w.camera=(q,c)=>look(c,[-28+q*42,-48+smooth(.62,.9,q)*45,-80+q*310+smooth(.62,1,q)*700],[0,30,1060],97,-.06+Math.sin(q*Math.PI)*.12);return w;
}
// Medium and lighting changes for the long-form acts; never recolour alternating pieces.
export function directExistingWorld(w:World,family:string){
 const styles:Record<string,{bg:string;key:string;rim:string;roles:Partial<Record<Mat,string>>;fill:number}>={
  stair:{bg:'#f2ffff',key:'#ffffff',rim:'#9bffff',roles:{navy:'#05161e',stone:'#badbdd',white:'#ffffff',energy:'#c4ffff'},fill:.15},
  canyon:{bg:'#ddd8cd',key:'#fff7e9',rim:'#ffffff',roles:{white:'#13100c',stone:'#544c40',navy:'#050504',energy:'#ffffff'},fill:.08},
  ringtemple:{bg:'#1b0802',key:'#ef7d28',rim:'#ffd190',roles:{white:'#9b633a',stone:'#3c2418',navy:'#0b0805',energy:'#ffaa53'},fill:.025},
  colonnade:{bg:'#000b08',key:'#0ccf83',rim:'#dffff3',roles:{white:'#092019',stone:'#05120e',navy:'#010504',energy:'#42ffae',silver:'#90e5c6'},fill:.02},
  'quiet-island':{bg:'#cbbcd0',key:'#ffe6de',rim:'#def7ff',roles:{white:'#baaea8',stone:'#706579',navy:'#232838',energy:'#f6e9d7'},fill:.6},
  'quiet-split':{bg:'#f3efdf',key:'#ffffff',rim:'#fff9e4',roles:{white:'#0a0b0c',stone:'#0a0b0c',navy:'#050708'},fill:.05},
  'quiet-leaf':{bg:'#2b1320',key:'#f1ba72',rim:'#ffd4ab',roles:{white:'#dfa1a0',navy:'#210b13',leafblue:'#742134',energy:'#ffe8ad'},fill:.04},
  'quiet-line':{bg:'#020a08',key:'#83d7ac',rim:'#83d7ac',roles:{silver:'#52b69b',energy:'#8af4c0'},fill:0},
  'quiet-shore':{bg:'#99bdcd',key:'#fff1f1',rim:'#effaff',roles:{stone:'#345870',navy:'#1e344a',energy:'#f0f8ff'},fill:.5},
 };
 const style=styles[family];if(!style)return;w.scene.background=new T.Color(style.bg);if(w.scene.fog)w.scene.fog.color.set(style.bg);
 rig(w,style.fill,style.key,family==='stair'?7:3.8,style.rim,family==='colonnade'?3.5:1.2);roles(w,style.roles,.87);
 if(family==='colonnade'){
  for(let i=0;i<17;i++)cable(w.root,[[-210+i*26,-60,0],[-210+i*26,-60,1100]],.14,'energy');
  const destination=mesh(w.root,new T.PlaneGeometry(145,270),'white',[0,210,980]);destination.material=new T.MeshBasicMaterial({color:'#effff6',side:T.DoubleSide,toneMapped:false,fog:false});
 }
 if(family==='ringtemple'){
  if(w.scene.fog instanceof T.Fog){w.scene.fog.near=650;w.scene.fog.far=1800;}
  if(w.primary)w.primary.scale.setScalar(2.1);
  const camera=w.camera;w.camera=(q,c)=>{camera(q,c);c.position.z+=100+q*115;c.updateMatrixWorld()};
  fragments(w,550,280,450,'silver',1850);
  const rim=new T.DirectionalLight('#ffd7a0',4.5);rim.position.set(-140,70,590);w.scene.add(rim);
  const breach=new T.PointLight('#ffbf73',24000,500,2);breach.position.set(-105,230,475);w.scene.add(breach);
  const rake=new T.SpotLight('#ffcf9c',12000000,1500,.52,.25,2);rake.position.set(-320,370,120);rake.target.position.set(0,115,525);w.scene.add(rake,rake.target);
  const seam=cable(w.root,[[-150,350,460],[-220,275,466],[-190,200,470]],.65,'gold');
  const slab=profile(w.root,[[-110,-160],[-105,160],[-32,193],[21,20],[-15,-180]],24,[-265,10,180],[.1,.24,-.21],'navy','stone');
  w.moving.push(q=>{breach.intensity=24000+smooth(.4,.68,q)*26000;seam.position.x=-smooth(.38,.7,q)*45;slab.position.x=-265-smooth(.05,.32,q)*140});
 }
 if(family==='quiet-shore'){
  surface(w.root,100,2,(u,v)=>{const a=(u-.5)*2.1,r=1350+v*3;return[Math.sin(a)*r,-930+Math.cos(a)*r,1900]},new T.MeshBasicMaterial({color:'#e8dfef',side:T.DoubleSide,transparent:true,opacity:.4}));
 }
}
function redWorld(){
 const w=world('#090004',120,1050);rig(w,.02,'#9b1421',1.2,'#ff4c2b',4);w.scene.userData.environmentIntensity=0;
 const g=new T.Group();w.root.add(g);const cage=new T.Group();g.add(cage);
 for(let i=0;i<5;i++){
  const a=i/5*TAU;
  foldedBody(g,(u,v)=>{const r=110+u*175,angle=a+.3*Math.sin(u*5)+v*.14;return new T.Vector3(Math.cos(angle)*r,Math.sin(angle)*r,160+u*490+Math.sin(u*5)*30)},'navy',9,'red');
  cable(cage,[[Math.cos(a)*140,Math.sin(a)*140,80],[Math.cos(a+.4)*250,Math.sin(a+.4)*250,330],[Math.cos(a-.1)*90,Math.sin(a-.1)*90,630]],.6,'energy');
  cable(cage,[[Math.cos(a)*140,Math.sin(a)*140,80],[Math.cos(a+TAU/5)*140,Math.sin(a+TAU/5)*140,80]],.35,'energy');
 }
 fragments(w,1200,420,1000,'red',1680);roles(w,{navy:'#160609',red:'#851224',energy:'#fa4329',silver:'#51313a'},.72);
 w.moving.push((q,hit)=>{cage.rotation.z=-q*.22;g.scale.x=1+smooth(.45,.65,q)*.22;g.rotation.z=q*.25});
 w.camera=(q,c)=>look(c,[-85+q*110,10,-70+q*560],[0,0,900],112,-.22+q*.65);return w;
}
function cyanStorm(){
 const w=world('#00090c',700,2200);rig(w,0,'#00cbd7',.2,'#b8ffff',.5);w.scene.userData.environmentIntensity=0;
 const fragmentGeo=new T.BufferGeometry();fragmentGeo.setAttribute('position',new T.Float32BufferAttribute([-1,-2,0,1,-1,.3,.7,2,-.1,-.4,1.3,.2],3));fragmentGeo.setIndex([0,1,2,0,2,3]);fragmentGeo.computeVertexNormals();
 const grains=instances(w.root,2800,fragmentGeo,'energy',(i,m)=>{const a=i*2.4,r=12+hash(i+30)*220;m.position.set(Math.cos(a)*r,Math.sin(a)*r*.65,hash(i+68)*1500);m.rotation.set(hash(i)*TAU,hash(i+19)*TAU,hash(i+33)*TAU);m.scale.set(.12+hash(i+45)*1.6,.22+hash(i+44)*3,.2)});
 for(let i=0;i<23;i++){const a=i*2.4,r=45+hash(i)*150;cable(w.root,[[Math.cos(a)*r,Math.sin(a)*r,-100],[Math.cos(a+.05)*r,Math.sin(a+.05)*r,250+hash(i+4)*450]],.08,'energy');}
 const destination=mesh(w.root,new T.SphereGeometry(5,16,12),'white',[0,0,1500]);destination.material=new T.MeshBasicMaterial({color:'#efffff'});
 roles(w,{energy:'#00dfe7'},.5);w.moving.push(q=>{grains.position.z=-q*610;grains.rotation.z=q*.15});
 w.camera=(q,c)=>look(c,[Math.sin(q*5)*11,Math.cos(q*5)*5,q*570],[0,0,1500],110,-.2+q*.3);return w;
}
function goldEvent(){
 const w=world('#fff3cd',900,2000);w.scene.userData.environmentIntensity=0;rig(w,.1,'#fff0b4',3,'#fff9e8',4);
 for(let i=0;i<7;i++){const a=i*2.4;cable(w.root,[[Math.cos(a)*150,Math.sin(a)*110,-50],[Math.cos(a+.4)*50,Math.sin(a+.4)*45,180],[0,0,450]],3,'gold');}
 const core=mesh(w.root,new T.SphereGeometry(35,30,20),'energy',[0,0,300]);core.material=new T.MeshBasicMaterial({color:'#fffce1',toneMapped:false});
 roles(w,{gold:'#c28c31'},.6);w.camera=(q,c)=>look(c,[15-q*15,4,-80+q*430],[0,0,520],95,q*.16);return w;
}
function finalMass(){
 const w=world('#e5e3db',1250,2500);w.scene.fog=null;rig(w,.015,'#a9c9cf',1.2,'#fff5dc',5);w.scene.userData.environmentIntensity=.025;
 const shell=new T.MeshStandardMaterial({color:'#05090b',roughness:.94,metalness:.25,side:T.DoubleSide});
 const halves:T.Mesh[]=[];
 for(let side=0;side<2;side++){
  halves.push(surface(w.root,100,40,(u,v)=>{const a=side*Math.PI+.025+u*(Math.PI-.05),p=.007+v*(Math.PI-.014),r=260+Math.sin(p*5+a*3)*2+Math.sin(a*11+p*8)*.5;return[Math.sin(a)*r*Math.sin(p),165+Math.cos(p)*r,610+Math.cos(a)*r*Math.sin(p)]},shell));
 }
 // The seam has depth: the black mass opens around a suspended internal
 // civilisation, not a single cyan gemstone painted on its surface.
 for(let i=0;i<5;i++){
  const z=455+i*65,y=145+Math.sin(i*1.8)*45;
  profile(w.root,[[-18,-50],[-28,15],[5,51],[23,29],[16,-32]],12,[i%2?-38:29,y,z],[0,i*.18,i*.2],'navy','silver');
  cable(w.root,[[i%2?-25:22,50,z],[0,125,z+12],[i%2?19:-16,230,z+20]],.28,'energy');
  text(w.root,String(i+5).padStart(2,'0'),[i%2?-31:24,y+30,z-9],14,'white',2);
 }
 const line=beam(w.root,[-350,-109,290],[350,-109,290],.35,.35,'energy');
 const floor=surface(w.root,12,12,(u,v)=>[(u-.5)*1200,-115+Math.sin(u*5+v*7)*1.5,180+v*1400],new T.MeshStandardMaterial({color:'#dbdad4',roughness:.95,side:T.DoubleSide}));
 // A minute original witness establishes scale without borrowed characters.
 profile(w.root,[[-.8,0],[-1,3.5],[-1.6,6],[-.6,7.8],[.6,7.8],[1.4,5],[1,0]],.55,[-122,-114,355],[0,0,0],'navy','navy');
 mesh(w.root,new T.SphereGeometry(.85,12,8),'navy',[-122,-105.4,355]);
 text(w.root,'09',[370,-73,1010],190,'navy',45);
 const fracture=profile(w.root,[[-46,-180],[-26,190],[24,145],[37,-60],[9,-230]],18,[-210,-20,100],[.1,.2,-.17],'navy','silver');
 const ribbon=surface(w.root,70,4,(u,v)=>{const a=-.5+u*3.5,r=335+v*4;return[Math.cos(a)*r,165+Math.sin(a)*r,680+Math.sin(a*2)*80]},new T.MeshStandardMaterial({color:'#627077',roughness:.81,metalness:.65,side:T.DoubleSide}));
 fragments(w,850,650,1300,'silver',2140);roles(w,{navy:'#020506',silver:'#77868a',white:'#b7d2cc',energy:'#62e8e1'},.87);
 const inner=new T.PointLight('#24d8d3',8000,370,2);inner.position.set(0,155,510);w.scene.add(inner);
 w.moving.push(q=>{const split=smooth(.28,.69,q),burst=smooth(.75,1,q);halves.forEach((o,i)=>{o.position.x=(i?-1:1)*(split*26+burst*100);o.rotation.z=(i?1:-1)*burst*.07});fracture.position.x=-210-smooth(.05,.23,q)*220;line.position.z=290+q*240;ribbon.rotation.z=q*.16;inner.intensity=8000+split*9000+burst*23000;floor.position.y=-burst*7});
 w.camera=(q,c)=>look(c,[125-q*165,70+q*55,65+q*80+smooth(.63,1,q)*180],[45,135,660],52,-.16+q*.24);return w;
}
function lifeDawn(after=false){
 const w=world('#e4e9d5',180,1600);backdrop(w,[[0,'#88bfd6'],[.52,'#d9ede7'],[.82,'#fff3cc'],[1,'#f1eddd']]);rig(w,.45,'#ffe5ad',3.3,'#fffcef',1.2);
 const platform=island(w.root,[0,-22,260],38,15,'stone',1904);const g=new T.Group();g.position.set(0,-20,260);w.root.add(g);
 cable(g,[[0,0,0],[1,8,0],[-.7,18,.5],[1,27,0]],.32,'navy');
 for(const side of [-1,1]){
  surface(g,28,8,(u,v)=>{const a=u*Math.PI,wid=Math.sin(a)*6;return[side*(2+u*9),10+Math.sin(a)*5, (v-.5)*wid+Math.sin(a)*2]},new T.MeshStandardMaterial({color:'#668641',roughness:.84,side:T.DoubleSide}));
  cable(g,[[0,8,0],[side*4,11,0],[side*11,13,0]],.11,'gold');
 }
 const mark=text(w.root,'09',[26,-18,258],5,'stone',.5);fragments(w,35,220,500,'gold',1920);
 const m=(mark.material as T.MeshStandardMaterial).clone();m.transparent=true;mark.material=m;
 roles(w,{stone:'#8b9481',navy:'#344e2e',gold:'#cfb476'},.9);
 w.moving.push(q=>{g.rotation.z=Math.sin(q*4)*.025;if(after){m.opacity=1-smooth(.1,.5,q);g.position.y=-20;platform.position.y=-22-q*3}});
 w.camera=(q,c)=>look(c,[after?7:25-q*18,after?18:3+q*15,after?-120+q*2:-140+smooth(0,.35,q)*20],[0,1,260],after?67-q*12:67,0);return w;
}
export function directedWorld(family:string):World|null{
 if(family.startsWith('physical-'))return graphicBlank('#090d11');
 if(family==='red-world')return redWorld();
 if(family==='cyan-storm')return cyanStorm();
 if(family==='gold-event')return goldEvent();
 if(family==='gravity')return finalMass();
 if(family==='macro09')return inkWorld();
 if(family==='rebuild-gate')return galleryWorld();
 if(family==='release'||family==='sky')return lifeDawn(family==='sky');
 if(['continent','islands','canopy'].includes(family))return archipelago(family);
 if(['temple','glass04','impossible','monuments','macro09'].includes(family))return cathedral(family);
 if(['memory','exploded','poster','typeworld','insert-scan','insert-type','insert-red','insert-white','insert-black'].includes(family))return graphicBlank();
 if(family==='engine'||family==='deep')return machinery(family==='deep');
 if(family==='crystals')return tissue(family);
 if(family==='insert-leaf')return macroLeaf();
 if(family==='insert-drop')return macroDrop();
 if(family==='insert-seed')return seedThreshold();
 if(family==='insert-membrane')return macroMembrane();
 if(family==='labyrinth'||family==='bridge')return warmThreshold(family);
 return null;
}
