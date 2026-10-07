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
export function directedWorld(family:string):World|null{
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
