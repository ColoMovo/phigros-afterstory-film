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
 const w=world('#aeb2c6',450,2100);gradient(w,['#8e91ad','#c8c1cf','#e5d6d5']);light(w,.23,'#e9d8dc',2.3,'#d9edff',3);
 const relic=new T.Group();relic.position.set(45,0,260);w.root.add(relic);w.primary=relic;
 const halves=[incomplete(relic,-1,1.6),incomplete(relic,1,1.6)];recolor(relic,'#686c84');halves[0].rotation.y=-.35;halves[1].rotation.y=.18;halves[1].rotation.x=.3;
 const line=beam(w.root,[-1500,-5,530],[1500,-5,530],.23,.23,'silver');
 const far=foldedBody(w.root,(u,v)=>new T.Vector3(-1400+u*2900,-195+v*15,1700+Math.sin(u*3)*180),'stone',.5);recolor(far,'#a2a5bd');
 const grains=instances(w.root,90,leafGeo,'silver',(i,o)=>{o.position.set((hash(i)-.5)*1700,(hash(i+19)-.5)*600,350+hash(i+47)*1600);o.scale.setScalar(.2+hash(i+18)*.55)});
 const spark=new T.Mesh(new T.SphereGeometry(.9,12,8),new T.MeshBasicMaterial({color:'#fff7d4'}));spark.position.set(0,-5,530);w.root.add(spark);
 w.moving.push(t=>{const retreat=smooth(78.299,86,t),split=smooth(86,91.7,t),clear=smooth(91,94.6,t);relic.position.z=260+retreat*310;relic.scale.setScalar(1-clear*.8);halves.forEach((o,i)=>{o.position.x=(i?1:-1)*split*510;o.rotation.z=(i?1:-1)*split*.14});relic.visible=t<94.6;far.visible=t<92;line.rotation.z=-.06*(1-smooth(86,92,t));grains.position.y=-(t-78.299)*.8;spark.scale.setScalar(1+smooth(96.5,98.076,t)*2);});
 w.camera=(t,c)=>look(c,[-75+smooth(78.299,86,t)*75,30-smooth(78.299,86,t)*25,-200-smooth(78.299,86,t)*110],[0,-5,570],64,0);return w;
}

// A ruptured line is the scaffold. Old fragments lock to it before we enter.
export function reconstructionWorld(){
 const w=world('#070d12',600,2100);gradient(w,['#171a2e','#203039','#050b10']);light(w,.03,'#96c9d4',1.9,'#e2ffff',4.2);
 const pieces:Array<{o:T.Object3D;base:T.Vector3;phase:number}>=[];
 const add=(o:T.Object3D,phase:number)=>pieces.push({o,base:o.position.clone(),phase});
 const seam=new T.Group();w.root.add(seam);
 for(let i=0;i<9;i++){
  const z=40+i*125,a=i*2.4,r=75+i*3;
  const piece=i%3===0?incomplete(w.root,i%2?1:-1,.65):shard(w.root,[0,0,0],35+i*4,i,i%3===1?'glass':'navy');piece.position.set(Math.cos(a)*r,Math.sin(a)*r*.95,z);add(piece,i/9);
  const trace=cable(seam,[[-200,-5,z],[-15,-5,z],[20,10,z+8],[190,10,z+8]],.18,'energy');add(trace,i/9);
  if(i%3===0){const leaf=instances(w.root,65,leafGeo,'leaf',(j,m)=>{const a=j*2.4,r=14+hash(j+i)*25;m.position.set(Math.cos(a)*r,Math.sin(a)*r,0);m.scale.set(.5,.12,2.7)});leaf.position.set(-75,55,z+45);add(leaf,i/9)}
 }
 // Two supports define an exit, not a gallery full of display cases.
 for(const s of [-1,1]){const arm=foldedBody(w.root,(u,v)=>new T.Vector3(s*(95+Math.sin(u*4)*35+v*17),-130+u*310,1220+u*160),'navy',13,'silver');add(arm,.8)}
 const destination=crackedCore(w.root,[0,12,1630],[17,28,16]);
 const line=beam(w.root,[-1400,-5,530],[1400,-5,530],.28,.28,'energy');
 fragments(w,500,320,1700,'silver',8312);
 w.moving.push(t=>{const ghost=smooth(101.6,104.8,t),lock=smooth(105.1,109,t);for(const {o,base,phase} of pieces){o.visible=t>101.8+phase*.5;const k=smooth(105+phase,108.9,t);o.position.copy(base);o.position.x+=(1-k)*Math.sin(phase*19)*200;o.position.y+=(1-k)*Math.cos(phase*17)*140;o.rotation.z=(1-k)*(.7-phase*1.4);o.scale.setScalar(.72+ghost*.28)}line.rotation.z=Math.sin((t-98.076)*7)*.035*(1-lock)*smooth(98.076,99.2,t);line.scale.y=1+Math.sin(t*19)*.3;seam.visible=t>103;destination.visible=t>105;});
 w.camera=(t,c)=>{const run=smooth(108.2,113.098,t);look(c,[Math.sin((t-98.076)*.7)*12*run,5+run*7,-310+run*1420],[0,12,1630],64+run*39,-run*.13)};return w;
}

// All returning materials occupy a single axial current. No family switch can
// restart this camera or change the destination. Large silhouettes carry detail.
export function convergenceWorld(){
 const w=world('#01080e',850,3900);light(w,.12,'#a5c4d0',3.4,'#e4edff',4.7);
 const flow=new T.Group();w.root.add(flow);w.primary=flow;
 const moving:Array<{o:T.Object3D;p:T.Vector3;index:number}>=[];
 const carry=(o:T.Object3D,i:number)=>moving.push({o,p:o.position.clone(),index:i});
 // A torn envelope, two major rails, layered fins and a fractured sea supply
 // enclosure and perspective before any small particles are added.
 for(const side of [-1,1]){
  const wall=foldedBody(flow,(u,v)=>{const z=60+u*2120,r=320-u*180+Math.sin(u*10)*35;return new T.Vector3(side*(r+v*85),Math.sin(u*7)*100+v*350,z)},'navy',11,'silver');
  recolor(wall,'#14232e');
  cable(flow,[[side*360,-200,-100],[side*240,-125,750],[side*110,30,1820],[0,60,2650]],.8,'energy');
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
 const water=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 p;uniform float time;void main(){p=uv;vec3 v=position;v.y+=sin(v.z*.025+time*2.)*7.+sin(v.x*.04+time)*4.;gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}',fragmentShader:'varying vec2 p;uniform float time;void main(){float f=sin(p.x*18.+sin(p.y*24.+time)*2.);float caustic=pow(.5+.5*sin(f*8.+p.y*60.-time*3.),20.);gl_FragColor=vec4(vec3(.013,.047,.061)+caustic*vec3(.05,.28,.29),1.);}'});
 skin(flow,50,100,(u,v)=>[(u-.5)*900,-230+v*185,-100+v*2300],water);
 const motes=instances(flow,2300,leafGeo,'silver',(i,o)=>{const a=i*2.4,r=60+hash(i+19)*300;o.position.set(Math.cos(a)*r,Math.sin(a)*r*.8,hash(i+46)*2500);o.scale.set(.18+hash(i)*1.2,.1,.8+hash(i+41)*2.5);o.rotation.z=a});
 const leaves=instances(flow,380,leafGeo,'leaf',(i,o)=>{const a=i*2.4,r=95+hash(i)*140;o.position.set(Math.cos(a)*r,Math.sin(a)*r,200+hash(i+79)*1900);o.scale.set(.7,.12,2+hash(i+2)*3);o.rotation.set(.2,a,a)});
 const numerals=new T.Group();numerals.position.set(0,20,2100);w.root.add(numerals);
 const numeralPositions:V[]=Array.from({length:9},(_,i)=>i===8?[0,235,60]:[(i%2?1:-1)*(80+Math.floor(i/2)*10),150-Math.floor(i/2)*90,-120+Math.floor(i/2)*80]);
 const marks=Array.from({length:9},(_,i)=>{const o=text(numerals,String(i+1).padStart(2,'0'),numeralPositions[i],i===8?56:40,i===8?'white':'silver',9);o.rotation.z=i===8?0:(i%2?1:-1)*.055;return o});
 for(const [i,char] of ['時','間','再','会'].entries()){const o=annotation(flow,char,[i%2?-150:165,40+(i%2)*40,600+i*330],90,[0,Math.PI,-.22],'#9dbabc');carry(o,i)}
 const core=crackedCore(w.root,[0,45,2370],[22,40,23]);
 // The final body is seen FROM its surface. Engraved strata, relief imprints
 // and a warm fissure replace the readable black disk on an empty backdrop.
 const obsidian=satin('#192833',.48,.83);obsidian.emissive.set('#15212b');obsidian.emissiveIntensity=.09;obsidian.onBeforeCompile=s=>{s.vertexShader='varying vec3 localP;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlocalP=position;');s.fragmentShader='varying vec3 localP;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat strata=pow(.5+.5*sin(localP.y*.24+sin(localP.x*.013)*7.+sin(localP.z*.05)),14.);float broad=pow(.5+.5*sin(localP.y*.027+sin(localP.x*.007)*2.),3.);diffuseColor.rgb+=strata*vec3(.029,.041,.047)+broad*vec3(.009,.014,.02);');};
 const halves:T.Mesh[]=[];
 for(const side of [-1,1])halves.push(skin(w.root,90,48,(u,v)=>{const a=side*(.025+u*2.95),p=.018+v*(Math.PI-.036),r=620+Math.sin(a*19+p*21)*1.8;return[170+Math.sin(a)*r*Math.sin(p),65+Math.cos(p)*r,2980-Math.cos(a)*r*Math.sin(p)]},obsidian));
 // Surface relief remains a tertiary scale during the near pass. The former
 // large extrusions hid the entire curved body when the camera reached them.
 for(let i=0;i<7;i++){const a=-.8+i*.25;const o=shard(w.root,[170+Math.sin(a)*580,40+Math.sin(i*2)*120,2980-Math.cos(a)*625],8+i*.7,i+81,'navy');recolor(o,'#243642');}
 const warm=new T.PointLight('#ffd5a0',60000,1000,2);warm.position.set(160,75,2630);w.scene.add(warm);
 const glow=new T.Mesh(new T.SphereGeometry(570,64,48),new T.ShaderMaterial({side:T.DoubleSide,toneMapped:false,vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;void main(){float r=length((p-.5)*vec2(1.3,.7));vec3 c=mix(vec3(1.,.93,.76),vec3(.56,.28,.1),smoothstep(.03,.9,r));gl_FragColor=vec4(c,1.);}'}));glow.position.set(170,65,2980);w.root.add(glow);
 const seam=cable(w.root,[[171,-320,2600],[168,-160,2410],[181,40,2357],[166,230,2383],[181,420,2490]],.7,'gold');
 w.moving.push(t=>{const q=smooth(113.098,129,t),pull=smooth(118,130,t);moving.forEach(({o,p,index})=>{o.position.copy(p);const k=1-pull*(.1+index*.013);o.position.x*=k;o.position.y*=k;o.position.z+=pull*(40+index*8);o.rotation.z+=0;});flow.scale.x=1-.15*q;flow.scale.y=1-.1*q;water.uniforms.time.value=t-113.098;motes.position.z=(t-113.098)*19;leaves.position.z=(t-113.098)*25;leaves.rotation.z=(t-113.098)*.055;numerals.visible=t>=121.2&&t<131;marks.forEach((o,i)=>{o.visible=i===8||t<126.15+i*.3;o.position.z=numeralPositions[i][2]+smooth(125,129,t)*220;});core.visible=t<130.4;(core.userData.nucleus as T.Object3D).visible=t<130.4;const open=smooth(132.9,135.1913,t);halves.forEach((o,i)=>o.position.x=(i?1:-1)*open*155);warm.intensity=5000+open*85000;glow.visible=t>129;seam.visible=t>128;});
 w.camera=(t,c)=>{const q=Math.max(0,(t-113.098)/(129-113.098));const scrape=smooth(129,135.1913,t);const slide=smooth(129,132.9,t),lateral=smooth(129,132.2,t),enter=smooth(132.9,135.1913,t);const z=t<129?-180+Math.pow(q,1.18)*2430:2250+slide*90+enter*720;const x=t<129?Math.sin(q*3)*36:Math.sin(3)*36-18*Math.sin(lateral*Math.PI)+161*lateral+enter*4;look(c,[x,25+Math.sin(q*4)*16,z],[170*smooth(129,131.9,t),65,Math.max(2650,z+170)],96+Math.sin(Math.min(1,q)*Math.PI)*15-scrape*14,Math.sin(Math.min(1,q)*5)*.09+scrape*.1)};
 return w;
}

function cloudTexture(){
 const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d')!,im=x.createImageData(512,256);
 const noise=(px:number,py:number)=>{const ix=Math.floor(px),iy=Math.floor(py),a=smooth(0,1,px-ix),b=smooth(0,1,py-iy),n=(i:number,j:number)=>hash(i*37+j*181+701);return lerp(lerp(n(ix,iy),n(ix+1,iy),a),lerp(n(ix,iy+1),n(ix+1,iy+1),a),b)};
 for(let y=0;y<256;y++)for(let xx=0;xx<512;xx++){const u=xx/512,v=y/256;let n=0;for(let k=0;k<4;k++)n+=noise(u*6*2**k,v*5*2**k)*.53/2**k;const edge=Math.sin(u*Math.PI)*Math.sin(v*Math.PI),alpha=smooth(.38,.69,n)*edge;const idx=(y*512+xx)*4;im.data[idx]=242;im.data[idx+1]=234;im.data[idx+2]=222;im.data[idx+3]=alpha*210;}x.putImageData(im,0,0);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;
}
export function evolvingDawn(){
 const w=world('#b4d8e4',1400,6500);gradient(w,['#488cb7','#b4d8e4','#f4e7ce']);light(w,.4,'#fff0c9',3.3,'#e8fcff',1.7);
 const cloud=cloudTexture(),layers:T.Mesh[]=[];
 for(let i=0;i<6;i++){const o=new T.Mesh(new T.PlaneGeometry(1400+i*150,580+i*35),new T.MeshBasicMaterial({map:cloud,transparent:true,opacity:.64,depthWrite:false,side:T.DoubleSide,fog:false,toneMapped:false}));o.position.set(i%2?430:-410,-80+i%3*135,500+i*520);layers.push(o);w.root.add(o)}
 const horizon=skin(w.root,100,2,(u,v)=>{const a=(u-.5)*2.3,r=5300+v*10;return[Math.sin(a)*r,-4400+Math.cos(a)*r,6200]},new T.MeshBasicMaterial({color:'#b4c9cb',transparent:true,opacity:.27,side:T.DoubleSide}));
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
 w.moving.push(t=>{const reveal=smooth(139.6,142.4,t),lifeEvent=smooth(146,148.7,t),dissolve=smooth(149,151.1,t);layers.forEach((o,i)=>{o.position.x=(i%2?430:-410)+(t-135.258)*(i%2?1:-1)*(18-i*2);o.position.z=500+i*520-(t-135.258)*(32-i*4)});destination.visible=t>139.45&&!hasAiDawn;destination.position.y=-60+reveal*30;foliage[2].scale.setScalar(.01+lifeEvent*.99);foliage[2].rotation.y=-.9+lifeEvent*.9;foliage[0].rotation.z=Math.sin(t*1.2)*.035;foliage[1].rotation.z=-Math.sin(t*1.2)*.035;mark.visible=t<151.1;mm.opacity=1-dissolve;born.visible=t>149&&t<151.15;born.position.y=dissolve*45;born.rotation.z=dissolve*.22;born.scale.setScalar(1+dissolve*.7);relics.forEach((o,i)=>{o.visible=t>141.5&&t<143.2+i*.35});scraps.forEach((o,i)=>{o.visible=t<140.4;const travel=(t-135.258)*310;o.position.z=100+hash(i+23)*900+travel;o.position.x=(i%2?1:-1)*(90+hash(i)*170)*(1+travel/2000);});horizon.position.y=smooth(135.258,140,t)*40;});
 w.camera=(t,c)=>{const rush=smooth(135.258,140,t),approach=smooth(140,149,t),empty=smooth(149.6,151.4,t);look(c,[35-rush*26-approach*24,50-rush*18+approach*6+empty*30,-200+rush*300+approach*900],[-15,-4+empty*130,1280],78-rush*15-approach*17,0)};return w;
}

export function editorialAct(t:number){return t>=78.299&&t<98.076?'farewell':t>=98.076&&t<113.098?'reconstruction':t>=113.098&&t<135.19133333333335?'convergence':t>=135.258&&t<151.4?'evolving-dawn':null;}
export function makeEditorialAct(key:string){if(key==='farewell')return farewellWorld();if(key==='reconstruction')return reconstructionWorld();if(key==='convergence')return convergenceWorld();if(key==='evolving-dawn')return evolvingDawn();throw Error(key);}
export function glitchFrames(t:number){const f=Math.floor(t*60+1e-5);return [[98.65,2],[101.95,3],[105,5],[108.9,3],[117.63,3],[122.2,2],[126.4,5]].some(([s,n])=>f>=Math.round(s*60)&&f<Math.round(s*60)+n);}
