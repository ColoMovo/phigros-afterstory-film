import * as T from 'three';
import aiAssets from './data/ai-asset-index.json';
const hasAiDawn=Boolean((aiAssets as Record<string,unknown>)['new-dawn-v02-camera-A']);
import {world,profile,beam,cable,text,island,dataTree,foldedBody,annotation,instances,fragments,look,hash,smooth,lerp,crackedCore,leafGeo,materials,type World,type V} from './opening-world';

// These acts share absolute song time. A cut label never resets their camera,
// gravity, object positions or light. Seeking evaluates the same state as playback.
const TAU=Math.PI*2;
const satin=(color:string,metalness=.45,roughness=.78)=>new T.MeshStandardMaterial({color,metalness,roughness,side:T.DoubleSide});
function skin(p:T.Object3D,n:number,m:number,at:(u:number,v:number)=>V,mat:T.Material){
 const pos:number[]=[],uv:number[]=[],ix:number[]=[];
 for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){pos.push(...at(i/n,j/m));uv.push(i/n,j/m);if(i<n&&j<m){const k=i*(m+1)+j;ix.push(k,k+1,k+m+1,k+1,k+m+2,k+m+1)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const o=new T.Mesh(g,mat);o.castShadow=o.receiveShadow=true;p.add(o);return o;
}
function light(w:World,fill:number,key:string,power:number,rim:string,rimPower:number){
 w.scene.children.filter(o=>o instanceof T.Light).forEach(o=>w.scene.remove(o));w.scene.add(new T.HemisphereLight('#d7e4ec','#100c14',fill));
 const a=new T.DirectionalLight(key,power);a.position.set(-260,290,-130);w.scene.add(a);
 const b=new T.DirectionalLight(rim,rimPower);b.position.set(110,80,520);w.scene.add(b);w.scene.userData.environmentIntensity=.035;
}
function gradient(w:World,colors:string[]){
 const c=document.createElement('canvas');c.width=16;c.height=512;const x=c.getContext('2d')!,g=x.createLinearGradient(0,0,0,512);colors.forEach((s,i)=>g.addColorStop(i/(colors.length-1),s));x.fillStyle=g;x.fillRect(0,0,16,512);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;w.scene.background=tx;
}
function recolor(o:T.Object3D,color:string){o.traverse(p=>{if(p instanceof T.Mesh){const replace=(m:T.Material)=>{const c=m.clone() as T.MeshStandardMaterial;c.color?.set(color);return c};p.material=Array.isArray(p.material)?p.material.map(replace):replace(p.material)}})}
function fade(o:T.Object3D,opacity:number){o.traverse(p=>{if(p instanceof T.Mesh){if(!p.userData.editorialFade){const clone=(m:T.Material)=>{const c=m.clone();c.userData.editorialOpacity=m.opacity;c.userData.editorialDepthWrite=m.depthWrite;return c;};p.material=Array.isArray(p.material)?p.material.map(clone):clone(p.material);p.userData.editorialFade=true;}for(const m of Array.isArray(p.material)?p.material:[p.material]){m.transparent=true;m.opacity=m.userData.editorialOpacity*opacity;m.depthWrite=m.userData.editorialDepthWrite&&opacity>.85;}}});}
function moteTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d')!,g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.78)');g.addColorStop(.5,'rgba(255,255,255,.15)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
// These are air and pollen, with rounded soft edges rather than a data/star field.
// Every drift is evaluated from the song clock, so seeking cannot accumulate wind.
function pollen(w:World,parent:T.Object3D,n:number,range:V,color:string,size:number,seed:number){
 const base=new Float32Array(n*3),positions=new Float32Array(n*3);for(let i=0;i<n;i++){base[i*3]=(hash(i+seed)-.5)*range[0];base[i*3+1]=(hash(i+seed+83)-.5)*range[1];base[i*3+2]=hash(i+seed+181)*range[2];}positions.set(base);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));const m=new T.PointsMaterial({map:moteTexture(),color,size,transparent:true,opacity:.62,depthWrite:false,alphaTest:.015,sizeAttenuation:true});const o=new T.Points(g,m);parent.add(o);
 w.moving.push(t=>{for(let i=0;i<n;i++){const a=i*2.399;positions[i*3]=base[i*3]+Math.sin(t*.32+a)*5;positions[i*3+1]=base[i*3+1]+Math.sin(t*.27+a*.8)*3;}g.attributes.position.needsUpdate=true;});return o;
}
function shard(p:T.Object3D,pos:V,size:number,seed:number,mat:'navy'|'glass'|'silver'|'stone'='navy'){
 return profile(p,[[-.55,-.9],[-.48,.45],[-.09,1],[.51,.68],[.23,-.15],[.39,-.7]].map(([x,y])=>[x*size,y*size]),size*.13,pos,[hash(seed)*.4,hash(seed+2)*.6,hash(seed+4)*TAU],mat,mat==='glass'?'silver':'stone');
}
function incomplete(p:T.Object3D,side:number,scale=1){
 const g=new T.Group();p.add(g);g.scale.setScalar(scale);
 foldedBody(g,(u,v)=>{const a=side*(.24+u*(side<0?2.1:2.48)),r=94+u*23+v*(25+Math.sin(u*Math.PI)*36);return new T.Vector3(Math.sin(a)*r,Math.cos(a)*r*(side<0?1.2:.82),Math.sin(a*1.8)*54+v*35)},'stone',8,'navy');
 for(let i=0;i<7;i++){const a=side*(.22+i*.36);beam(g,[Math.sin(a)*100,Math.cos(a)*80,0],[Math.sin(a)*123,Math.cos(a)*91,34],2.2,4,'silver')}
 return g;
}

// Three states of the SAME receding structure: farewell, separation, absence.
export function farewellWorld(){
 const w=world('#c7c8d7',850,2900);gradient(w,['#8eabc2','#c8c5da','#f0ded4']);light(w,.62,'#ffe4cf',2.1,'#d9ecf7',1.55);
 const relic=new T.Group();relic.position.set(45,0,260);w.root.add(relic);w.primary=relic;
 const halves=[incomplete(relic,-1,1.6),incomplete(relic,1,1.6)];recolor(relic,'#72788b');halves[0].rotation.y=-.35;halves[1].rotation.y=.18;halves[1].rotation.x=.3;
 const line=beam(w.root,[-1500,-5,530],[1500,-5,530],.23,.23,'silver');
 recolor(line,'#abbac2');const far=foldedBody(w.root,(u,v)=>new T.Vector3(-1400+u*2900,-195+v*15,1700+Math.sin(u*3)*180),'stone',.5);recolor(far,'#c1b7c7');
 const grains=pollen(w,w.root,85,[1700,600,1800],'#fff0d8',1.25,180);grains.position.z=240;
 const spark=new T.Sprite(new T.SpriteMaterial({map:moteTexture(),color:'#fff2d6',transparent:true,opacity:.75,depthWrite:false}));spark.position.set(0,-5,530);spark.scale.setScalar(9);w.root.add(spark);
 // The same body travels away, hesitates, separates and becomes light. There
 // is no model replacement at the cut labels and no abrupt visibility switch.
 w.moving.push(t=>{const retreat=smooth(78.299,87,t),split=smooth(85.7,93,t),clear=smooth(91.7,96.5,t);relic.position.set(45-retreat*45,Math.sin((t-78.299)*.42)*2,260+retreat*450+split*130);relic.scale.setScalar(1-clear*.38);halves.forEach((o,i)=>{const s=i?1:-1;o.position.set(s*split*490,Math.sin(t*.42+i)*2+split*(i?18:-12),0);o.rotation.z=s*split*.14+Math.sin(t*.37+i)*.012;});fade(relic,1-clear);relic.visible=t<96.5;fade(far,1-smooth(86,93,t));line.rotation.z=-.04*(1-smooth(85,93,t));grains.position.x=(t-78.299)*2.5;grains.position.y=(t-78.299)*.42;spark.scale.setScalar(9+smooth(94.5,98.076,t)*5);spark.material.opacity=.48+smooth(95.2,98.076,t)*.27;});
 w.camera=(t,c)=>look(c,[-75+smooth(78.299,88,t)*75,30-smooth(78.299,88,t)*25,-200+smooth(78.299,98.076,t)*42],[0,-5,800],64-smooth(87,98.076,t)*2,0);return w;
}

// A ruptured line is the scaffold. Old fragments lock to it before we enter.
export function reconstructionWorld(){
 const w=world('#9fb3c1',850,3100);gradient(w,['#517a9b','#a9bdcc','#efdbcf']);light(w,.65,'#ffe8cd',2.45,'#bce2ef',1.65);
 const pieces:Array<{o:T.Object3D;base:T.Vector3;phase:number}>=[];
 const add=(o:T.Object3D,phase:number)=>pieces.push({o,base:o.position.clone(),phase});
 const seam=new T.Group();w.root.add(seam);
 for(let i=0;i<9;i++){
  const z=40+i*125,a=i*2.4,r=75+i*3;
  const piece=i%3===0?incomplete(w.root,i%2?1:-1,.65):shard(w.root,[0,0,0],35+i*4,i,i%3===1?'glass':'navy');piece.position.set(Math.cos(a)*r,Math.sin(a)*r*.95,z);if(i%3!==1)recolor(piece,'#6f8594');add(piece,i/9);
  const trace=cable(seam,[[-200,-5,z],[-15,-5,z],[20,10,z+8],[190,10,z+8]],.12,'energy');recolor(trace,'#b3e2e2');add(trace,i/9);
  if(i%3===0){const leaf=instances(w.root,45,leafGeo,'leaf',(j,m)=>{const a=j*2.4,r=14+hash(j+i)*25;m.position.set(Math.cos(a)*r,Math.sin(a)*r,0);m.scale.set(.5,.12,2.7)});leaf.material=new T.MeshBasicMaterial({color:'#9acfc5',side:T.DoubleSide});leaf.position.set(-75,55,z+45);add(leaf,i/9)}
 }
 // Two supports define an exit, not a gallery full of display cases.
 for(const s of [-1,1]){const arm=foldedBody(w.root,(u,v)=>new T.Vector3(s*(95+Math.sin(u*4)*35+v*17),-130+u*310,1220+u*160),'navy',13,'silver');recolor(arm,'#82949e');add(arm,.8)}
 const destination=crackedCore(w.root,[0,12,1630],[17,28,16]);
 recolor(destination,'#6c8491');recolor(destination.userData.nucleus,'#f7d6a3');
 const line=beam(w.root,[-1400,-5,530],[1400,-5,530],.28,.28,'energy');recolor(line,'#c9dce1');
 const dust=pollen(w,w.root,240,[620,360,1750],'#ffe8bd',1.5,8312);
 const remembrance=new T.PointLight('#ffe4b8',18000,2000,2);remembrance.position.set(0,110,1460);w.scene.add(remembrance);
 // A light travels back through familiar fragments. They lift like something
 // remembered, with a little wind left after alignment rather than rigid locks.
 w.moving.push(t=>{const response=smooth(99.8,105.4,t),join=smooth(103.8,109,t);for(const {o,base,phase} of pieces){const arrive=smooth(100.3+phase*3,104.5+phase*2,t),k=smooth(103.5+phase,108.9,t);o.visible=arrive>.001;o.position.copy(base);o.position.x+=(1-k)*Math.sin(phase*19)*105+Math.sin(t*.5+phase*8)*2.5;o.position.y+=(1-k)*Math.cos(phase*17)*75+Math.sin(t*.38+phase*4)*3;o.rotation.z=(1-k)*(.38-phase*.7)+Math.sin(t*.43+phase*3)*.025;o.scale.setScalar(.78+arrive*.22);fade(o,arrive);}line.rotation.z=Math.sin((t-98.076)*1.4)*.016*(1-join);seam.visible=t>101;destination.visible=t>102;dust.position.y=response*15;remembrance.intensity=2500+response*15500;});
 w.camera=(t,c)=>{const drift=smooth(98.076,108.2,t),run=smooth(108.2,113.098,t);look(c,[Math.sin((t-98.076)*.7)*8*run,5+run*7,-310+drift*50+run*1370],[0,12,1630],64+run*26,-run*.06)};return w;
}

// All returning materials occupy a single axial current. No family switch can
// restart this camera or change the destination. Large silhouettes carry detail.
export function convergenceWorld(){
 const w=world('#738b9e',1450,5600);gradient(w,['#273e56','#748b9f','#eacbb6']);light(w,.55,'#ffe8c7',2.8,'#c6e3f1',2.2);
 const flow=new T.Group();w.root.add(flow);w.primary=flow;
 const moving:Array<{o:T.Object3D;p:T.Vector3;r:T.Euler;index:number}>=[];
 const carry=(o:T.Object3D,i:number)=>moving.push({o,p:o.position.clone(),r:o.rotation.clone(),index:i});
 // A torn envelope, two major rails, layered fins and a fractured sea supply
 // enclosure and perspective before any small particles are added.
 for(const side of [-1,1]){
  const wall=foldedBody(flow,(u,v)=>{const z=60+u*2120,r=320-u*180+Math.sin(u*10)*35;return new T.Vector3(side*(r+v*85),Math.sin(u*7)*100+v*350,z)},'navy',11,'silver');
  recolor(wall,'#415a6b');
  const rail=cable(flow,[[side*360,-200,-100],[side*240,-125,750],[side*110,30,1820],[0,60,2650]],.45,'energy');recolor(rail,'#9bd5da');
 }
 for(let i=0;i<9;i++){
  const z=120+i*222,a=i*2.399,r=280-i*12,x=Math.cos(a)*r,y=Math.sin(a)*r*.7;
  const shell=incomplete(flow,i%2?1:-1,.8+i*.065);shell.position.set(x,y,z);shell.rotation.set(.1,a*.13,a);carry(shell,i);
  const rock=island(flow,[-x*.85,y-130,z+75],45+hash(i)*30,100+hash(i+18)*75,'navy',9010+i);carry(rock,i);
  if(i===1||i===5){const tree=dataTree(w,[-x*.85,y-128,z+75],1.35);carry(tree,i)}
  const pane=shard(flow,[x*1.2,y*1.2,z-34],70,i+51,'glass');carry(pane,i);
  if(i%3===0){const keel=profile(flow,[[-25,-150],[-50,-75],[-38,160],[9,190],[32,60],[15,-140]],23,[-x,y,z+44],[.2,.3,a],'navy','silver');carry(keel,i)}
 }
 // Damped filament flow bends into the same vanishing point as the architecture.
 for(let i=0;i<27;i++){const a=i/27*TAU,r=180+hash(i)*120;cable(flow,[[Math.cos(a)*r,Math.sin(a)*r,-150],[Math.cos(a+.2)*r*.95,Math.sin(a+.2)*r*.8,650],[Math.cos(a+.35)*r*.6,Math.sin(a+.35)*r*.6,1500],[0,45,2570]],i%9===0?.6:.12,i%9===0?'gold':'silver')}
 const water=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 p;uniform float time;void main(){p=uv;vec3 v=position;v.y+=sin(v.z*.018+time*.65)*4.+sin(v.x*.035+time*.4)*2.;gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}',fragmentShader:'varying vec2 p;uniform float time;void main(){float f=sin(p.x*15.+sin(p.y*18.+time*.4)*1.4);float reflection=pow(.5+.5*sin(f*4.+p.y*30.-time*.6),8.);float dawn=smoothstep(.2,1.,p.y);gl_FragColor=vec4(vec3(.11,.19,.24)+reflection*vec3(.12,.22,.2)+dawn*vec3(.1,.08,.04),1.);}'});
 skin(flow,50,100,(u,v)=>[(u-.5)*900,-230+v*185,-100+v*2300],water);
 const motes=pollen(w,flow,1100,[620,420,2500],'#fff0cd',1.8,920);
 const leaves=instances(flow,160,leafGeo,'leaf',(i,o)=>{const a=i*2.4,r=95+hash(i)*140;o.position.set(Math.cos(a)*r,Math.sin(a)*r,200+hash(i+79)*1900);o.scale.set(.7,.12,2+hash(i+2)*3);o.rotation.set(.2,a,a)});leaves.material=new T.MeshBasicMaterial({color:'#93d4c9',side:T.DoubleSide});
 const numerals=new T.Group();numerals.position.set(0,20,2100);w.root.add(numerals);
 const numeralPositions:V[]=Array.from({length:9},(_,i)=>i===8?[0,235,60]:[(i%2?1:-1)*(80+Math.floor(i/2)*10),150-Math.floor(i/2)*90,-120+Math.floor(i/2)*80]);
 const marks=Array.from({length:9},(_,i)=>{const o=text(numerals,String(i+1).padStart(2,'0'),numeralPositions[i],i===8?56:40,i===8?'white':'silver',9);o.rotation.z=i===8?0:(i%2?1:-1)*.055;return o});
 for(const [i,char] of ['時','間','再','会'].entries()){const o=annotation(flow,char,[i%2?-150:165,40+(i%2)*40,600+i*330],90,[0,Math.PI,-.22],'#9dbabc');carry(o,i)}
 const core=crackedCore(w.root,[0,45,2370],[22,40,23]);
 // The final body is seen FROM its surface. Engraved strata, relief imprints
 // and a warm fissure replace the readable black disk on an empty backdrop.
 const obsidian=satin('#263d4c',.26,.9);obsidian.emissive.set('#15212b');obsidian.emissiveIntensity=.05;obsidian.onBeforeCompile=s=>{s.vertexShader='varying vec3 localP;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlocalP=position;');s.fragmentShader='varying vec3 localP;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat strata=pow(.5+.5*sin(localP.y*.24+sin(localP.x*.013)*7.+sin(localP.z*.05)),14.);float broad=pow(.5+.5*sin(localP.y*.027+sin(localP.x*.007)*2.),3.);diffuseColor.rgb+=strata*vec3(.037,.046,.049)+broad*vec3(.016,.021,.026);');};
 const halves:T.Mesh[]=[];
 const cutEdges:T.Mesh[]=[];
 for(const side of [-1,1]){halves.push(skin(w.root,90,48,(u,v)=>{const a=side*(.025+u*2.95),p=.018+v*(Math.PI-.036),r=620+Math.sin(a*19+p*21)*1.8;return[170+Math.sin(a)*r*Math.sin(p),65+Math.cos(p)*r,2980-Math.cos(a)*r*Math.sin(p)]},obsidian));cutEdges.push(skin(w.root,80,4,(u,v)=>{const p=.018+u*(Math.PI-.036),r=592+v*28,a=side*.025;return[170+Math.sin(a)*r*Math.sin(p),65+Math.cos(p)*r,2980-Math.cos(a)*r*Math.sin(p)]},satin('#77848a',.16,.92)));}
 // Surface relief remains a tertiary scale during the near pass. The former
 // large extrusions hid the entire curved body when the camera reached them.
 for(let i=0;i<7;i++){const a=-.8+i*.25;const o=shard(w.root,[170+Math.sin(a)*580,40+Math.sin(i*2)*120,2980-Math.cos(a)*625],8+i*.7,i+81,'navy');recolor(o,'#243642');}
 const warm=new T.PointLight('#ffe1b7',15000,1900,2);warm.position.set(160,145,2940);w.scene.add(warm);
 // There is genuinely open distance behind the final dark body. The old solid
 // emissive inner sphere became a flat cream stripe when grazed at close range.
 const beyond=new T.Group();w.root.add(beyond);const skyCanvas=document.createElement('canvas');skyCanvas.width=32;skyCanvas.height=512;const skyCtx=skyCanvas.getContext('2d')!,skyGradient=skyCtx.createLinearGradient(0,0,0,512);skyGradient.addColorStop(0,'#83b3cf');skyGradient.addColorStop(.58,'#d9e6e9');skyGradient.addColorStop(1,'#ffe2bf');skyCtx.fillStyle=skyGradient;skyCtx.fillRect(0,0,32,512);const skyMap=new T.CanvasTexture(skyCanvas);skyMap.colorSpace=T.SRGBColorSpace;
 const skyWindow=new T.Mesh(new T.PlaneGeometry(22000,18000),new T.MeshBasicMaterial({map:skyMap,side:T.DoubleSide,fog:false,toneMapped:false}));skyWindow.position.set(170,50,5600);beyond.add(skyWindow);
 const clouds: T.Mesh[]=[];for(let i=0;i<4;i++){const o=new T.Mesh(new T.PlaneGeometry(1800+i*300,630+i*90),new T.MeshBasicMaterial({map:cloudTexture(),transparent:true,opacity:.48,side:T.DoubleSide,depthWrite:false,fog:false,toneMapped:false}));o.position.set(i%2?-370:420,-130+i%2*270,3580+i*440);beyond.add(o);clouds.push(o);}
 const seam=cable(w.root,[[171,-320,2600],[168,-160,2410],[181,40,2357],[166,230,2383],[181,420,2490]],.7,'gold');
 w.moving.push(t=>{const q=smooth(113.098,129,t),pull=smooth(118,130,t),release=smooth(129,131.9,t);moving.forEach(({o,p,r,index})=>{o.position.copy(p);const k=1-pull*(.32+index*.025);o.position.x*=k;o.position.y*=k;o.position.z=lerp(p.z,2490+index*14,pull*.72);o.rotation.copy(r);o.rotation.z+=Math.sin(t*.32+index)*.018;fade(o,1-release);});flow.scale.x=1-.1*q;flow.scale.y=1-.06*q;water.uniforms.time.value=t-113.098;motes.position.z=(t-113.098)*14;leaves.position.z=(t-113.098)*23;leaves.rotation.z=Math.sin((t-113.098)*.28)*.12;numerals.visible=t>=121.2&&t<131;marks.forEach((o,i)=>{const out=smooth(126.15+i*.3,126.75+i*.3,t);o.visible=i===8||out<1;o.position.z=numeralPositions[i][2]+smooth(125,129,t)*180;if(i<8)fade(o,1-out);});core.visible=t<130.4;(core.userData.nucleus as T.Object3D).visible=t<130.4;const open=smooth(131.4,135.1913,t);halves.forEach((o,i)=>{o.position.x=(i?1:-1)*open*165;cutEdges[i].position.x=o.position.x;});warm.intensity=6500+open*24500;beyond.visible=t>128;clouds.forEach((o,i)=>{o.position.x=(i%2?-370:420)+(t-128)*(i%2?-1:1)*7;});seam.visible=t>128;fade(seam,1-open);});
 w.camera=(t,c)=>{const q=Math.max(0,(t-113.098)/(129-113.098));const scrape=smooth(129,135.1913,t);const slide=smooth(129,132.9,t),lateral=smooth(129,132.2,t),enter=smooth(132.9,135.1913,t);const z=t<129?-180+Math.pow(q,1.18)*2430:2250+slide*90+enter*720;const x=t<129?Math.sin(q*3)*36:Math.sin(3)*36-18*Math.sin(lateral*Math.PI)+161*lateral+enter*4;look(c,[x,25+Math.sin(q*4)*16,z],[170*smooth(129,131.9,t),65,Math.max(2650,z+170)],96+Math.sin(Math.min(1,q)*Math.PI)*15-scrape*14,Math.sin(Math.min(1,q)*5)*.09+scrape*.1)};
 return w;
}

function cloudTexture(){
 const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d')!,im=x.createImageData(512,256);
 const noise=(px:number,py:number)=>{const ix=Math.floor(px),iy=Math.floor(py),a=smooth(0,1,px-ix),b=smooth(0,1,py-iy),n=(i:number,j:number)=>hash(i*37+j*181+701);return lerp(lerp(n(ix,iy),n(ix+1,iy),a),lerp(n(ix,iy+1),n(ix+1,iy+1),a),b)};
 for(let y=0;y<256;y++)for(let xx=0;xx<512;xx++){const u=xx/512,v=y/256;let n=0;for(let k=0;k<4;k++)n+=noise(u*6*2**k,v*5*2**k)*.53/2**k;let mass=0;for(let j=0;j<5;j++){const cx=.16+j*.17,cy=.49+Math.sin(j*2)*.11;mass+=Math.exp(-((u-cx)**2/(.034-j*.002)+(v-cy)**2/.036))*.46;}const edge=Math.sin(u*Math.PI)*Math.sin(v*Math.PI),alpha=smooth(.35,.78,n*.65+mass*.4)*edge;const idx=(y*512+xx)*4;im.data[idx]=240+v*10;im.data[idx+1]=242+v*6;im.data[idx+2]=238-v*8;im.data[idx+3]=alpha*225;}x.putImageData(im,0,0);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;
}
export function evolvingDawn(){
 const w=world('#c9deea',1400,6500);gradient(w,['#5797bb','#c9deea','#f6e1ca']);light(w,.7,'#ffe9c8',2.7,'#e8f6ff',1.3);
 const cloud=cloudTexture(),layers:T.Mesh[]=[];
 for(let i=0;i<6;i++){const o=new T.Mesh(new T.PlaneGeometry(1400+i*150,580+i*35),new T.MeshBasicMaterial({map:cloud,transparent:true,opacity:.64,depthWrite:false,side:T.DoubleSide,fog:false,toneMapped:false}));o.position.set(i%2?430:-410,-80+i%3*135,500+i*520);layers.push(o);w.root.add(o)}
 const horizon=skin(w.root,100,2,(u,v)=>{const a=(u-.5)*2.3,r=5300+v*10;return[Math.sin(a)*r,-6200+Math.cos(a)*r,6200]},new T.MeshBasicMaterial({color:'#c2d5db',transparent:true,opacity:.12,side:T.DoubleSide}));
 const destination=new T.Group();destination.position.set(-15,-30,1280);w.root.add(destination);
 const ground=island(destination,[0,0,0],47,33,'stone',433);recolor(ground,'#7c8c7b');
 skin(destination,80,16,(u,v)=>{const a=u*TAU,r=v*(42+Math.sin(a*5)*3);return[Math.cos(a)*r,2+Math.sin(r*.31)*Math.cos(a*3)*1.3,Math.sin(a)*r*.8]},satin('#839476',.02,.95));
 const life=new T.Group();life.scale.setScalar(1.45);destination.add(life);cable(life,[[0,0,0],[1,6,0],[-1,17,0],[1,26,0]],.3,'navy');recolor(life,'#3b603d');
 const foliage:T.Group[]=[];
 for(let i=0;i<3;i++){const g=new T.Group();g.position.set(0,8+i*6,0);life.add(g);const s=i%2?1:-1;skin(g,28,10,(u,v)=>[s*u*13,Math.sin(u*Math.PI)*4+u*3,(v-.5)*Math.sin(u*Math.PI)*8],satin(i===2?'#92b768':'#537847',.01,.88));cable(g,[[0,0,0],[s*6,5,0],[s*13,3,0]],.09,'gold');foliage.push(g)}
 const mark=text(destination,'09',[31,11,0],11,'stone',1.2);recolor(mark,'#435758');const mm=(mark.material as T.MeshStandardMaterial).clone();mm.transparent=true;mark.material=mm;
 const relics=Array.from({length:8},(_,i)=>{const o=text(w.root,String(i+1).padStart(2,'0'),[-500+i*140,-10+Math.sin(i)*50,1990+i*50],10,'gold',.5);return o});
 const scraps=Array.from({length:14},(_,i)=>shard(w.root,[(i%2?1:-1)*(90+hash(i)*170),40+(hash(i+10)-.5)*180,100+hash(i+23)*900],3+hash(i+3)*9,i+456,'silver'));
 const born=instances(destination,90,leafGeo,'gold',(i,o)=>{o.position.set(31+(hash(i)-.5)*16,4+hash(i+40)*24,(hash(i+16)-.5)*15);o.scale.set(.12,.12,.28)});
 const air=pollen(w,w.root,65,[1100,400,2000],'#fff4d9',1.2,312);air.position.z=250;
 w.moving.push(t=>{const reveal=smooth(139.6,142.4,t),lifeEvent=smooth(146,148.7,t),dissolve=smooth(149,151.1,t);layers.forEach((o,i)=>{o.position.x=(i%2?430:-410)+(t-135.258)*(i%2?1:-1)*(11-i*1.3);o.position.y=-80+i%3*135+Math.sin((t-135.258)*.2+i)*8;o.position.z=500+i*520-(t-135.258)*(26-i*3)});destination.visible=t>139.45&&!hasAiDawn;destination.position.y=-60+reveal*30+Math.sin((t-135.258)*.45)*.65;life.rotation.z=Math.sin((t-135.258)*.8)*.025;foliage[2].scale.setScalar(.01+lifeEvent*.99);foliage[2].rotation.y=-.9+lifeEvent*.9+Math.sin(t*.9)*.02;foliage[0].rotation.z=Math.sin(t*.9)*.055;foliage[1].rotation.z=-Math.sin(t*.9+.3)*.05;mark.visible=t<151.1;mm.opacity=1-dissolve;born.visible=t>149&&t<151.15;born.position.y=dissolve*45;born.position.x=dissolve*14;born.rotation.z=dissolve*.22;born.scale.setScalar(1+dissolve*.7);relics.forEach((o,i)=>{const age=smooth(141.8+i*.16,142.5+i*.22,t);o.visible=t>141.5&&age<1;fade(o,1-age);});scraps.forEach((o,i)=>{const out=smooth(137.5+i*.045,140.4,t);o.visible=out<1;fade(o,1-out);const travel=(t-135.258)*210;o.position.z=100+hash(i+23)*900+travel;o.position.x=(i%2?1:-1)*(90+hash(i)*170)*(1+travel/2000);});air.position.x=(t-135.258)*3;air.position.y=(t-135.258)*.6;horizon.position.y=smooth(135.258,140,t)*40;});
 w.camera=(t,c)=>{const rush=smooth(135.258,140,t),approach=smooth(140,149,t),empty=smooth(149.6,151.4,t);look(c,[35-rush*26-approach*24,50-rush*18+approach*6+empty*30,-200+rush*300+approach*900],[-15,-4+empty*130,1280],78-rush*15-approach*17,0)};return w;
}

export function editorialAct(t:number){return t>=78.299&&t<98.076?'farewell':t>=98.076&&t<113.098?'reconstruction':t>=113.098&&t<135.19133333333335?'convergence':t>=135.258&&t<151.4?'evolving-dawn':null;}
export function makeEditorialAct(key:string){if(key==='farewell')return farewellWorld();if(key==='reconstruction')return reconstructionWorld();if(key==='convergence')return convergenceWorld();if(key==='evolving-dawn')return evolvingDawn();throw Error(key);}
export function glitchFrames(t:number){const f=Math.floor(t*60+1e-5);return [[98.65,2],[101.95,3],[105,5],[108.9,3],[117.63,3],[122.2,2],[126.4,5]].some(([s,n])=>f>=Math.round(s*60)&&f<Math.round(s*60)+n);}
