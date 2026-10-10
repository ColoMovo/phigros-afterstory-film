import * as T from 'three';
import {TTFLoader} from 'three/addons/loaders/TTFLoader.js';
import {FontLoader, type Font} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import audio from './data/audio-analysis.json';
import lyrics from './data/lyrics.json';

// These are depth-buffered worlds, not projected Canvas posters. The renderer
// evaluates a complete scene from absolute music time, including temporal tears.
const TAU=Math.PI*2;
const hash=(n:number)=>{const q=Math.sin(n*127.1+813.7)*43758.5453;return q-Math.floor(q)};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(a:number,b:number,x:number)=>{const q=clamp((x-a)/(b-a));return q*q*(3-2*q)};
const lerp=(a:number,b:number,q:number)=>a+(b-a)*q;
const mod=(a:number,n:number)=>(a%n+n)%n;
export type V=[number,number,number];
export type World={scene:T.Scene;root:T.Group;primary?:T.Group;moving:((u:number,hit:number)=>void)[];camera:(u:number,c:T.PerspectiveCamera)=>void};
let font:Font;
let musicTime=0;
export function setMusicTime(t:number){musicTime=t;}
let artwork:HTMLImageElement[]=[];
let assets:Promise<void>|null=null;
export function loadOpeningAssets(fontUrl:string,images:HTMLImageElement[]){
 artwork=images;
 if(!assets)assets=new TTFLoader().loadAsync(fontUrl).then(data=>{font=new FontLoader().parse(data)});
 return assets;
}

function standard(color:string,metal=.25,rough=.33,emissive?:string){return new T.MeshStandardMaterial({color,metalness:metal,roughness:rough,...(emissive?{emissive,emissiveIntensity:.65}:{})})}
const materials={
 white:standard('#dce3e4',.06,.78),stone:standard('#657989',.08,.91),navy:standard('#101d2d',.32,.72),blue:standard('#283c53',.5,.68),violet:standard('#3b4259',.3,.77),
 cyan:standard('#a4c9d0',.1,.61),gold:standard('#9c8b6c',.58,.63),red:standard('#8e4150',.12,.74),
 energy:new T.MeshBasicMaterial({color:'#00d4e5',side:T.DoubleSide}),
 glass:new T.MeshPhysicalMaterial({color:'#b5cbd3',metalness:.04,roughness:.48,transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false}),
 blackglass:standard('#182435',.42,.48),leaf:new T.MeshBasicMaterial({color:'#00c5d9',side:T.DoubleSide}),leafblue:new T.MeshBasicMaterial({color:'#146b9d',side:T.DoubleSide}),leafviolet:new T.MeshBasicMaterial({color:'#686b9e',side:T.DoubleSide}),
 silver:standard('#a3adb5',.74,.52),obsidian:standard('#101a23',.6,.31),
 acrylic:new T.MeshPhysicalMaterial({color:'#7bc9d0',metalness:.05,roughness:.37,transparent:true,opacity:.24,side:T.DoubleSide,depthWrite:false}),
};
function reflectionSky(){
 const faces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d')!,g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'#d7efff');g.addColorStop(.45,'#739dbf');g.addColorStop(.62,'#bacde0');g.addColorStop(1,'#27374f');x.fillStyle=g;x.fillRect(0,0,128,128);x.fillStyle=i%2?'#d4e4f2':'#ffdfae';x.fillRect(8+i*5,8,13,92);return c});
 const sky=new T.CubeTexture(faces);sky.colorSpace=T.SRGBColorSpace;sky.needsUpdate=true;return sky;
}
export type Mat=keyof typeof materials;
const boxGeo=new T.BoxGeometry(1,1,1),icoGeo=new T.IcosahedronGeometry(1,1),crystalGeo=new T.ConeGeometry(1,2,5,1),leafGeo=new T.OctahedronGeometry(1,0);
function mesh(parent:T.Object3D,geometry:T.BufferGeometry,mat:Mat,pos:V=[0,0,0],scale:V=[1,1,1],rot:V=[0,0,0]){
 const o=new T.Mesh(geometry,materials[mat]);o.position.set(...pos);o.scale.set(...scale);o.rotation.set(...rot);o.castShadow=mat!=='glass'&&mat!=='energy';o.receiveShadow=true;parent.add(o);return o;
}
function block(parent:T.Object3D,pos:V,size:V,mat:Mat='white',rot:V=[0,0,0]){return mesh(parent,boxGeo,mat,pos,size,rot)}
// Authored profiles provide recognisable bodies. Repeated beams only support them.
function profile(parent:T.Object3D,outline:[number,number][],depth:number,pos:V,rot:V,face:Mat='navy',edge:Mat='stone'){
 const shape=new T.Shape();outline.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));shape.closePath();
 const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:3});g.translate(0,0,-depth/2);
 const o=new T.Mesh(g,[materials[face],materials[edge]]);o.position.set(...pos);o.rotation.set(...rot);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}
function beam(parent:T.Object3D,a:V,b:V,width:number,depth:number,mat:Mat='navy'){
 const p=new T.Vector3(...a),q=new T.Vector3(...b),o=block(parent,p.clone().add(q).multiplyScalar(.5).toArray() as V,[width,p.distanceTo(q),depth],mat);
 o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o;
}
function glyphPlane(parent:T.Object3D,value:string,size:number,pos:V,color='#e1e8e8'){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d')!;x.font='100px CJK';x.textAlign='center';x.textBaseline='middle';x.fillStyle=color;x.fillText(value,64,70);
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
 const mat=new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.02,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const o=new T.Mesh(new T.PlaneGeometry(size,size),mat);o.position.set(...pos);o.rotation.y=Math.PI;parent.add(o);return o;
}
function annotation(parent:T.Object3D,value:string,pos:V,width:number,rot:V=[0,Math.PI,0],color='#b8cad2'){
 const c=document.createElement('canvas');c.width=1024;c.height=128;const x=c.getContext('2d')!;x.font='45px Text, CJK';x.textAlign='center';x.textBaseline='middle';x.fillStyle=color;x.fillText(value,512,64);
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const m=new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.02,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const o=new T.Mesh(new T.PlaneGeometry(width,width/8),m);o.position.set(...pos);o.rotation.set(...rot);parent.add(o);return o;
}
function cable(parent:T.Object3D,points:V[],r:number,mat:Mat='cyan'){
 const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
 return mesh(parent,new T.TubeGeometry(path,Math.max(24,points.length*7),r,5,false),mat);
}
function ring(parent:T.Object3D,pos:V,r:number,tube:number,mat:Mat='white',rot:V=[0,0,0]){return mesh(parent,new T.TorusGeometry(r,tube,6,96),mat,pos,[1,1,1],rot)}
function text(parent:T.Object3D,value:string,pos:V,size:number,mat:Mat='white',depth=8){
 const g=new TextGeometry(value,{font,size,depth,curveSegments:6,bevelEnabled:true,bevelThickness:.4,bevelSize:.25,bevelSegments:1});g.computeBoundingBox();const b=g.boundingBox!;g.translate(-(b.max.x+b.min.x)/2,-(b.max.y+b.min.y)/2,-depth/2);
 return mesh(parent,g,mat,pos,[1,1,1],[0,Math.PI,0]);
}
function island(parent:T.Object3D,pos:V,r:number,height:number,mat:Mat,seed:number){
 const N=14,v:number[]=[],ix:number[]=[];
 for(let j=0;j<4;j++)for(let i=0;i<N;i++){const a=i/N*TAU,s=[1,.93,.48,.11][j]*(.85+hash(i+j*29+seed)*.3);v.push(Math.cos(a)*r*s,-j*height/3+(hash(i+seed*9)-.5)*r*.08,Math.sin(a)*r*s)}
 v.push(0,0,0,0,-height*1.1,0);
 for(let i=0;i<N;i++){const q=(i+1)%N;ix.push(4*N,i,q);for(let j=0;j<3;j++){const a=j*N+i,b=j*N+q,c=(j+1)*N+i,d=(j+1)*N+q;ix.push(a,c,b,b,c,d)}ix.push(3*N+i,4*N+1,3*N+q)}
 for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();const o=mesh(parent,g,mat,pos),m=(o.material as T.MeshStandardMaterial).clone();m.flatShading=true;if(mat==='stone'||mat==='navy'){m.metalness=.08;m.roughness=.8}o.material=m;return o;
}
function ribbon(parent:T.Object3D,pos:V,r:number,width:number,twists:number,mat:Mat,seed=0){
 const v:number[]=[],uv:number[]=[],ix:number[]=[];const n=160;
 for(let i=0;i<=n;i++)for(let j=0;j<2;j++){
  const a=i/n*TAU,z=(j-.5)*width,c=Math.cos(a*twists+seed),s=Math.sin(a*twists+seed);
  v.push((r+z*c)*Math.cos(a),z*s+Math.sin(a*3+seed)*r*.08,(r+z*c)*Math.sin(a));uv.push(i/n,j);
  if(i<n&&j===0){const k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2)}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const o=mesh(parent,g,mat,pos);(o.material as T.Material).side=T.DoubleSide;return o;
}
function instances(parent:T.Object3D,n:number,geometry:T.BufferGeometry,mat:Mat,pose:(i:number,m:T.Object3D)=>void){
 const o=new T.InstancedMesh(geometry,materials[mat],n),dummy=new T.Object3D();
 for(let i=0;i<n;i++){pose(i,dummy);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix)}o.instanceMatrix.needsUpdate=true;parent.add(o);return o;
}
function fragments(w:World,n:number,range:number,depth:number,mat:Mat,seed=0){
 const o=instances(w.root,n,leafGeo,mat,(i,m)=>{m.position.set((hash(i+seed)-.5)*range,(hash(i+seed+61)-.5)*range*.55,hash(i+seed+211)*depth-40);m.rotation.set(hash(i)*TAU,hash(i+27)*TAU,hash(i+9)*TAU);m.scale.set(.18+hash(i+4)*.6,.15+hash(i+7)*1.3,.08+hash(i+93)*.2)});
 w.moving.push(u=>{o.position.z=-mod(u*23,depth*.3);o.rotation.z=Math.sin(u*.08)*.08});return o;
}
function world(bg:string,fogNear:number,fogFar:number):World{
 const scene=new T.Scene(),root=new T.Group();scene.background=new T.Color(bg);scene.fog=new T.Fog(bg,fogNear,fogFar);scene.add(root);
 scene.add(new T.HemisphereLight('#d5e2ec','#17202b',1.65));const key=new T.DirectionalLight('#e4edf0',3.2);key.position.set(-70,100,-60);scene.add(key);const rim=new T.DirectionalLight('#b6cadd',1.65);rim.position.set(90,25,70);scene.add(rim);
 key.position.set(-160,240,-160);key.target.position.set(0,30,130);scene.add(key.target);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-230,right:230,top:230,bottom:-230,near:1,far:1000});key.shadow.normalBias=.65;key.shadow.bias=-.0002;
 return {scene,root,moving:[],camera:()=>{}};
}
function look(c:T.PerspectiveCamera,p:V,target:V,fov=82,roll=0){c.position.set(...p);c.lookAt(...target);c.rotateZ(roll);c.fov=fov;c.updateProjectionMatrix()}
function cloudSea(w:World,level=-55){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
 for(let i=0;i<80;i++){const x=48+hash(i+19)*160,y=80+hash(i+51)*100,r=20+hash(i+73)*45,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(226,240,255,.24)');g.addColorStop(1,'rgba(226,240,255,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
 const tx=new T.CanvasTexture(canvas),mat=new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,side:T.DoubleSide});
 for(let i=0;i<18;i++){const o=new T.Mesh(new T.PlaneGeometry(260,230),mat);o.position.set((i%3-1)*170,level-i%3*8,-90+Math.floor(i/3)*145);o.rotation.x=-Math.PI/2;w.root.add(o)}
}

// One thick, coherent shell surface. Outer skin, inner skin and cut edges are
// separately modeled; complexity starts with the silhouette, not ring copies.
function shellPatch(parent:T.Object3D,phi0:number,phiLength:number,theta0:number,theta1:number,radii:V,thickness:number,pos:V=[0,0,0]){
 const contour=[new T.Vector2(phi0,theta0),new T.Vector2(phi0+phiLength,theta0),new T.Vector2(phi0+phiLength,theta1),new T.Vector2(phi0,theta1)];
 const holes:T.Vector2[][]=phiLength>3?[Array.from({length:80},(_,i)=>{const a=i/80*TAU,theta=1.55+Math.sin(a)*.68;return new T.Vector2(1.43+.25*(theta-1.5)+Math.cos(a)*.43,theta)})]:[];
 const faces=T.ShapeUtils.triangulateShape(contour,holes),points=[...contour,...holes.flat()],vertices:number[]=[],normals:number[]=[],uv:number[]=[],g=new T.BufferGeometry();
 const surface=(p:T.Vector2,side:number)=>{const phi=p.x,q=(p.y-theta0)/(theta1-theta0),theta=p.y+.045*Math.sin(phi*2.2)*(1-q)+.07*Math.cos(phi*1.3)*q,r=side?1-thickness/radii[1]:1,warp=1+.045*Math.sin(phi*1.6)*Math.sin(theta);return new T.Vector3(Math.sin(theta)*Math.cos(phi)*radii[0]*r*warp+Math.cos(theta)*5,Math.cos(theta)*radii[1]*r,Math.sin(theta)*Math.sin(phi)*radii[2]*r)};
 const normal=(p:T.Vector2,side:number)=>{const e=.0001,dx=surface(new T.Vector2(p.x+e,p.y),side).sub(surface(new T.Vector2(p.x-e,p.y),side)),dy=surface(new T.Vector2(p.x,p.y+e),side).sub(surface(new T.Vector2(p.x,p.y-e),side));return dx.cross(dy).normalize().multiplyScalar(side?-1:1)};
 const emit=(p:T.Vector2,side:number,n?:T.Vector3)=>{vertices.push(...surface(p,side).toArray());normals.push(...(n||normal(p,side)).toArray());uv.push((p.x-phi0)/phiLength,(p.y-theta0)/(theta1-theta0))};
 const triangle=(a:T.Vector2,b:T.Vector2,c:T.Vector2,side:number)=>{const cross=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if((cross>0)!==(side===0))[b,c]=[c,b];emit(a,side);emit(b,side);emit(c,side)};
 const N=12;
 for(let side=0;side<2;side++){
  const first=vertices.length/3;
  for(const f of faces){const [a,b,c]=f.map(i=>points[i]);const at=(i:number,j:number)=>a.clone().multiplyScalar(1-(i+j)/N).addScaledVector(b,i/N).addScaledVector(c,j/N);for(let i=0;i<N;i++)for(let j=0;j<N-i;j++){triangle(at(i,j),at(i+1,j),at(i,j+1),side);if(i+j<N-1)triangle(at(i+1,j),at(i+1,j+1),at(i,j+1),side)}}
  g.addGroup(first,vertices.length/3-first,side);
 }
 const first=vertices.length/3;
 for(const boundary of [contour,...holes])for(let i=0;i<boundary.length;i++){
  const a=boundary[i],b=boundary[(i+1)%boundary.length],steps=boundary===contour?80:1;
  for(let j=0;j<steps;j++){const p=a.clone().lerp(b,j/steps),q=a.clone().lerp(b,(j+1)/steps),n=surface(q,0).sub(surface(p,0)).cross(surface(p,1).sub(surface(p,0))).normalize();emit(p,0,n);emit(p,1,n);emit(q,0,n);emit(q,0,n);emit(p,1,n);emit(q,1,n)}
 }
 g.addGroup(first,vertices.length/3-first,2);g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 const o=new T.Mesh(g,[materials.navy,materials.blue,materials.white]);o.position.set(...pos);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}

function irregularCore(parent:T.Object3D,pos:V,size:V,mat:Mat='navy'){
 const g=new T.IcosahedronGeometry(1,3),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.13*Math.sin(x*2.3+y*.9)+.07*Math.cos(z*3.1);p.setXYZ(i,x*r*size[0]+y*y*size[0]*.13,y*r*size[1],z*r*size[2])}g.computeVertexNormals();return mesh(parent,g,mat,pos);
}

function crackedCore(parent:T.Object3D,pos:V,size:V){
 const outer=irregularCore(parent,pos,size),old=outer.geometry,p=old.attributes.position,v:number[]=[],n:number[]=[];
 for(let i=0;i<p.count;i+=3){let x=0,y=0,z=0;for(let j=0;j<3;j++){x+=p.getX(i+j)/3;y+=p.getY(i+j)/3;z+=p.getZ(i+j)/3}if(z<-size[2]*.25&&Math.abs(x-Math.sin(y/size[1]*1.8)*size[0]*.14)<size[0]*.18)continue;for(let j=0;j<3;j++){v.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));n.push(old.attributes.normal.getX(i+j),old.attributes.normal.getY(i+j),old.attributes.normal.getZ(i+j))}}
 const cut=new T.BufferGeometry();cut.setAttribute('position',new T.Float32BufferAttribute(v,3));cut.setAttribute('normal',new T.Float32BufferAttribute(n,3));outer.geometry=cut;old.dispose();
 outer.userData.nucleus=irregularCore(parent,pos,[size[0]*.81,size[1]*.81,size[2]*.81],'energy');return outer;
}

// A continuous thick folded surface is one architectural body, not N toruses.
function foldedBody(parent:T.Object3D,path:(s:number,v:number)=>T.Vector3,mat:Mat,thickness=2.5,inside:Mat=mat){
 const ns=240,nv=10,row=nv+1,layer=(ns+1)*row,v:number[]=[],ix:number[]=[];
 for(let side=0;side<2;side++)for(let i=0;i<=ns;i++)for(let j=0;j<=nv;j++){
  const s=i/ns,t=j/nv-.5,e=.0001,p=path(s,t),along=path(s+e,t).sub(path(s-e,t)),cross=path(s,t+e).sub(path(s,t-e)),n=along.cross(cross).normalize();p.addScaledVector(n,side?-thickness/2:thickness/2);v.push(...p.toArray());
 }
 const g=new T.BufferGeometry();for(let side=0;side<2;side++){const first=ix.length;for(let i=0;i<ns;i++)for(let j=0;j<nv;j++){const a=side*layer+i*row+j,b=a+1,c=a+row,d=c+1;ix.push(...(side?[a,b,c,b,d,c]:[a,c,b,b,c,d]))}g.addGroup(first,ix.length-first,side)}
 const first=ix.length;
 const edge=(a:number,b:number)=>ix.push(a,b,a+layer,b,b+layer,a+layer);for(let i=0;i<ns;i++){edge(i*row,(i+1)*row);edge((i+1)*row+nv,i*row+nv)}for(let j=0;j<nv;j++){edge(j+1,j);edge(ns*row+j,ns*row+j+1)}
 g.addGroup(first,ix.length-first,2);g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();const o=new T.Mesh(g,[materials[mat],materials[inside],materials.stone]);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}

function dataTree(w:World,pos:V,scale:number){
 const g=new T.Group();g.position.set(...pos);g.scale.setScalar(scale);w.root.add(g);
 for(let i=0;i<11;i++){
  const a=i/11*TAU,base:V=[Math.cos(a)*2,0,Math.sin(a)*2],elbow:V=[Math.cos(a)*7,22,Math.sin(a)*7],tip:V=[Math.cos(a)*28,39+hash(i+7)*10,Math.sin(a)*28];
  cable(g,[base,[0,12,0],elbow,tip],1.15,'navy');cable(g,[[base[0]+.2,0,base[2]],elbow,tip],.07,'cyan');
  for(let j=0;j<4;j++){const b=a+(j-1.5)*.22;cable(g,[elbow,[Math.cos(b)*20,35,Math.sin(b)*20],[Math.cos(b)*36,45+j*2,Math.sin(b)*36]],.22,'navy')}
  cable(g,[[Math.cos(a)*7,0,Math.sin(a)*7],[Math.cos(a)*12,-15,Math.sin(a)*12],[Math.cos(a)*2,-28,Math.sin(a)*2]],.13,'gold');
 }
 for(const [j,mat] of (['leaf','leafblue','leafviolet'] as Mat[]).entries()){
  const o=instances(g,[440,220,60][j],leafGeo,mat,(i,m)=>{const a=i*2.399+j,r=8+hash(i+j*71)*27;m.position.set(Math.cos(a)*r,32+hash(i+241+j*61)*20,Math.sin(a)*r);m.rotation.set(.18,hash(i)*TAU,a);m.scale.set(1.2+hash(i+91)*1.9,.18,2.2+hash(i+23)*2.5)});
  w.moving.push(u=>{o.rotation.y=u*.13+j*.02;});
 }
 return g;
}

// A shell-centred civilisation, laid out as a traversable level. Each silhouette
// has a different job; the large profiles are not random primitive scatter.
function dawnEcology(w:World,attached:T.Group,firstLyricOnly=false){
 // Four asymmetric satellites: a blade buttress, broken balcony, suspended keel,
 // and a folded instrument. They terminate in the shell's support network.
 profile(attached,[[-15,-40],[2,-47],[14,-20],[10,17],[0,40],[-8,34],[-6,5],[-19,-10]],8,[72,5,-2],[.08,-.18,-.16],'navy','silver');
 cable(attached,[[61,-27,0],[73,-10,-8],[76,22,0],[64,37,5]],1.1,'white');
 profile(attached,[[-25,-6],[-13,-17],[22,-14],[31,0],[20,5],[1,3],[-8,10]],5,[-75,19,9],[.23,.12,.20],'white','stone');
 beam(attached,[-52,11,4],[-80,10,13],2.5,3,'blue');beam(attached,[-50,-16,8],[-78,10,13],1.2,2,'silver');
 profile(attached,[[-9,-31],[2,-41],[10,-13],[7,21],[-1,33],[-9,19]],6,[38,-66,-5],[.05,.14,-.48],'stone','navy');
 cable(attached,[[15,-56,7],[30,-60,-1],[40,-77,-3]],.5,'silver');
 foldedBody(attached,(s,v)=>new T.Vector3(-18+s*43+v*5,75+Math.sin(s*Math.PI)*19,9+s*19+v*12),'white',1.8,'blue');
 for(const [x,y,z,a] of [[68,-13,-1,-.2],[-65,15,12,.3],[31,-63,-7,-.45],[-2,79,15,.1]] as [number,number,number,number][]){
  cable(attached,[[x,y,z],[x*.72,y*.82,z-3],[x*.53,y*.64,z+2]],.12,'silver');
  profile(attached,[[-6,-10],[3,-14],[7,-5],[4,10],[-4,13]],1.2,[x-5,y+7,z-5],[.1,a,a],'glass','glass');
 }
 // A branching inner chassis and nine retaining modules use one material family.
 const releasing:{object:T.Object3D;base:T.Vector3;rotation:T.Euler}[]=[];
 const nodes:V[]=[[-33,-36,7],[-24,-7,13],[-38,22,15],[-14,47,7],[18,41,14],[35,17,15],[30,-18,9],[12,-45,6],[2,-27,-1]];
 for(let i=0;i<nodes.length;i++){
  const p=nodes[i],n=nodes[(i+1)%nodes.length];beam(attached,p,n,.65,1.1,'blue');
  const pod=profile(attached,[[-3,-7],[3,-10],[5,-3],[3,6],[-4,8],[-5,2]],3,p,[0,.17*i,.08*Math.sin(i)],'stone','silver');releasing.push({object:pod,base:pod.position.clone(),rotation:pod.rotation.clone()});
  cable(attached,[p,[p[0]*.75,p[1]*.82,p[2]-4],[8,-4,-1]],.04,'cyan');
 }
 for(let i=0;i<5;i++){const pane=profile(attached,[[-7,-13],[4,-15],[9,-5],[7,8],[-5,14],[-10,4]],.7,[-29+i*12,-13+(i%3)*13,-14+i*4],[.2*i,.17*i,-.18],'glass','glass');releasing.push({object:pane,base:pane.position.clone(),rotation:pane.rotation.clone()})}
 w.moving.push(u=>{const time=u+5.321;releasing.forEach(({object,base,rotation},i)=>{const open=smooth(7.6667+i*.035,8.42+i*.02,time),rebuild=smooth(10.85,11.55,time);object.position.copy(base).multiplyScalar(1+open*.48);object.position.z=base.z-open*(18+i%3*7)+rebuild*50;object.rotation.copy(rotation);object.rotation.y+=open*(i%2?-1:1)*.65;object.rotation.z+=open*.2-rebuild*.4})});
 // The core contains suspended dark ribs and translucent skins, not a solid gem.
 for(let i=0;i<4;i++){
  profile(attached,[[-1.5,-5],[1,-7],[2,0],[.8,5],[-1.7,4]],1.2,[7+Math.sin(i)*1.2,-19+i*9,-8],[0,.18,.14*i],'navy','silver');
  profile(attached,[[-3,-7],[2,-9],[4,4],[-2,8]],.25,[11+Math.sin(i)*2,-17+i*8,-4],[.15,.25,-.24],'acrylic','acrylic');
 }
 cable(attached,[[2,-27,-1],[5,-17,-8],[10,-5,-7],[5,6,-7],[13,18,0]],.10,'silver');
 // Broken reflective terraces replace the undifferentiated floor. Actual gaps,
 // different elevations and undersides expose the world below the hero.
 const terraces:[V,[number,number][],number,Mat][]=[
  [[99,-12,3],[[-85,96],[74,104],[89,9],[30,-78],[-39,-99],[-63,-7]],7,'obsidian'],
  [[-106,-24,33],[[-94,91],[64,79],[55,-6],[90,-71],[-16,-126],[-101,-3]],6,'blackglass'],
  [[92,-20,243],[[-70,89],[60,95],[86,-72],[-8,-116],[-62,-8]],9,'blue'],
  [[-82,-33,277],[[-83,75],[72,91],[90,-15],[12,-100],[-74,-73]],11,'blackglass'],
  [[32,-51,99],[[-23,37],[16,31],[33,-16],[4,-45],[-30,-5]],13,'stone'],
  [[-214,-41,135],[[-42,51],[51,41],[41,-43],[-35,-62]],17,'navy'],
 ];
 terraces.forEach(([p,outline,depth,mat],i)=>{
  const terrain=profile(w.root,outline,depth,p,[-Math.PI/2,0,0],mat,'navy');
  w.moving.push(u=>{const q=smooth(7.6667,8.5,u+5.321);terrain.position.x=p[0]+(i%2?-1:1)*q*(i<2?23:9);terrain.position.y=p[1]+q*(i%2?-8:5);terrain.rotation.z=q*(i%2?-.13:.09)});
  const line=outline.slice(0,4).map(([x,z])=>[p[0]+x,p[1]+depth/2+.18,p[2]-z] as V);cable(w.root,line,.16,'silver');
 });
 cable(w.root,[[20,-8,-105],[28,-8,-24],[38,-15,76],[30,-23,172],[18,-28,294]],.055,'energy');
 // Three fitted cantilevers show a relation between terraces and shell pedestal.
 for(const [x,z] of [[69,65],[-91,90],[107,228]]){
  beam(w.root,[x,-25,z],[x*.5,-67,z+42],3,6,'navy');beam(w.root,[x*.5,-67,z+42],[x*.65,-13,z+73],1.3,2,'silver');
 }
 foldedBody(w.root,(s,v)=>new T.Vector3(-77+s*54+v*5,-20+s*14+Math.sin(s*Math.PI)*5,137+s*58+v*13),'white',2.3,'stone');
 // Secondary focus: a numeral integrated into a damaged gateway, set behind and
 // to the right of the hero in screen space. It remains neutral and subordinate.
 const gate=new T.Group();gate.position.set(-327,59,210);gate.rotation.set(.08,.29,-.13);w.root.add(gate);
 text(gate,'08',[0,10,0],67,'stone',25);
 beam(gate,[-34,-32,5],[-28,-71,20],4,7,'navy');beam(gate,[34,-25,5],[25,-65,27],3,6,'stone');
 foldedBody(gate,(s,v)=>new T.Vector3(-20+s*48+v*19,-60+s*30,-53+s*95),'white',3,'stone');
 cable(gate,[[-29,-60,-53],[-10,-48,-19],[8,-36,22]],.2,'silver');
 profile(gate,[[-45,-42],[-45,73],[-28,89],[-22,69],[-26,-36]],7,[0,0,5],[0,0,0],'navy','silver');
 profile(gate,[[18,-36],[25,-45],[46,-27],[46,58],[31,79],[25,60]],7,[0,0,5],[0,0,0],'white','stone');
 beam(gate,[-41,70,6],[35,83,6],3,8,'blue');cable(gate,[[-38,-35,0],[-41,40,0],[-29,76,0]],.10,'cyan');
 island(w.root,[-334,-10,212],42,53,'stone',715);
 // Third focus: a remote split instrument with a hairline dawn-metal fissure.
 const distant=new T.Group();distant.position.set(320,245,350);distant.rotation.z=.22;w.root.add(distant);
 foldedBody(distant,(s,v)=>new T.Vector3(Math.sin(s*Math.PI*.9)*42+v*(28-8*s),-115+s*230,Math.sin(s*Math.PI*1.25)*38+v*11),'blue',6,'stone');
 profile(distant,[[-18,-72],[5,-104],[24,-75],[18,15],[7,55],[-4,42],[3,10]],9,[-17,-4,6],[.08,.37,-.23],'blue','silver');
 cable(distant,[[0,-110,-5],[32,-43,14],[39,30,28],[13,104,-10]],.37,'gold');
 cable(distant,[[35,-10,27],[63,60,43],[59,130,32]],3.3,'stone');
 // An unknown continuous backbone crosses high sky, with incompletely attached
 // ribbing. Its silhouette is authored as one long bending body.
 foldedBody(w.root,(s,v)=>new T.Vector3(-95-s*520+v*15,295+Math.sin(s*Math.PI*.95)*79+v*8,520+Math.cos(s*Math.PI)*46),'blue',5,'stone');
 for(let i=0;i<7;i++){
  const s=.18+i*.09,x=-95-s*520,y=295+Math.sin(s*Math.PI*.95)*79,z=520+Math.cos(s*Math.PI)*46;
  cable(w.root,[[x,y,z],[x-13,y-31,z+6],[x-28,y-47,z+31]],1.8,'stone');
 }
 // Two far landmark families: a leaning dead gateway and inverted strata.
 profile(w.root,[[-38,-96],[-51,114],[-31,142],[50,119],[43,98],[-16,119],[-18,-96]],10,[-489,167,640],[0,-.14,-.21],'stone','navy');
 for(const [x,y,z,r,h] of [[-419,-2,405,36,80],[-272,-62,494,50,90],[310,-24,339,42,110],[363,22,566,63,130],[258,-60,590,38,75]]){
  island(w.root,[x,y,z],r,h,'stone',Math.floor(z));
 }
 const lattice=new T.Group();lattice.position.set(-430,275,690);lattice.rotation.set(.3,-.2,.5);w.root.add(lattice);
 const wire=new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(72,1)),new T.LineBasicMaterial({color:'#758b9b',transparent:true,opacity:.42}));lattice.add(wire);
 // Foreground structures are placed along the actual camera corridor. Cropping
 // and real depth occlusion come from passing their edges, never screen overlays.
 profile(w.root,[[-17,-84],[8,-99],[23,-55],[17,5],[25,44],[4,91],[-4,61],[-9,7]],10,[85,48,45],[.08,.17,-.16],'obsidian','navy');
 cable(w.root,[[92,-18,36],[94,52,37],[88,106,46]],.7,'silver');
 profile(w.root,[[-23,-21],[0,-35],[30,-22],[16,10],[-11,30]],.8,[72,14,-49],[.15,-.3,.33],'glass','glass');
 profile(w.root,[[-14,-33],[8,-42],[17,-10],[7,25],[-13,37]],5,[-66,80,73],[.1,-.18,-.23],'navy','silver');
 // A judgement boundary cuts the low foreground once, with subdued return rails.
 cable(w.root,[[134,7,-46],[64,15,-25],[15,28,-8],[-35,35,5]],.055,'energy');
 cable(w.root,[[134,9,-46],[64,17,-25],[15,30,-8],[-35,37,5]],.11,'silver');
 // Air detail follows two streams: inward data and residual fragments over the
 // platform rift. Multiple silhouettes remain tiny and low contrast.
 const fine=new T.TetrahedronGeometry(1,0);
 instances(w.root,430,fine,'stone',(i,m)=>{const side=i%3===0?-1:1;m.position.set(side*(53+hash(i+25)*110),-7+hash(i+77)*129,-79+hash(i+95)*440);m.rotation.set(hash(i)*TAU,hash(i+1)*TAU,hash(i+2)*TAU);m.scale.set(.11+hash(i+50)*.34,.25+hash(i+63)*.5,.07)});
 instances(w.root,100,boxGeo,'silver',(i,m)=>{m.position.set(32+Math.sin(i*.19)*37,-30+hash(i+70)*39,-25+hash(i+180)*345);m.rotation.set(hash(i)*.6,hash(i+8)*2,hash(i+63));m.scale.set(.08,.5+hash(i+53)*1.5,.08)});
 const chips=instances(w.root,36,fine,'glass',(i,m)=>{m.position.set((i%2?1:-1)*(32+hash(i+901)*75),14+hash(i+809)*70,-49+hash(i+752)*150);m.rotation.set(hash(i+63),hash(i+4),hash(i+20));m.scale.set(1+hash(i+555)*2.2,2+hash(i+103)*4,.2)});
 for(let i=0;i<4;i++)cable(w.root,[[73+i*9,-9+i*14,-32],[88+i*12,47+i*8,85],[64+i*5,89+i*6,225],[32+i*9,127,371]],.025,'cyan');
 w.moving.push(u=>{chips.position.y=Math.sin(u*.8)*.65;satelliteDrift(u)});
 const satelliteDrift=(u:number)=>{const q=smooth(7.3833,8.0,u+5.321);gate.rotation.z=-.13-q*.14;distant.rotation.z=.22-q*.11};
 // Exact supplied lyrics live on a bowed plane in front of the shell. Individual
 // glyphs have world depth and can disappear behind the satellite/foreground.
 for(const l of lyrics.slice(0,firstLyricOnly?1:2)){
  const row=new T.Group();attached.add(row);const chars=[...l.jp],charTiming=l.wordTiming.flatMap(token=>[...token.text].map(()=>token.time));
  const first=l.time===5.321;
  const letters=chars.map((ch,i)=>{const s=i/Math.max(1,chars.length-1),p:V=first?[54-s*108,-41+Math.sin(s*Math.PI)*8,-39-Math.sin(s*Math.PI)*8]:[48-s*94,45+Math.sin(s*Math.PI)*12,98+Math.cos(s*Math.PI)*10];const o=glyphPlane(row,ch,first?6.4:7.2,p);o.rotation.y=Math.PI+(s-.5)*.38;o.userData.rest=o.position.clone();return o});
  const note=annotation(row,l.zh,first?[30,-50,-31]:[0,32,111],first?65:83,[0,Math.PI+.14,0]);
  w.moving.push(u=>{const time=musicTime,end=first?lyrics[1].time:lyrics[2].time,a=smooth(l.time,l.time+.18,time)*(1-smooth(end-.15,end,time)),pull=first?smooth(7.72,8.5,time):0;row.visible=a>0;letters.forEach((o,i)=>{const s=i/Math.max(1,chars.length-1),angle=s*Math.PI*1.65-.7;o.position.copy(o.userData.rest).lerp(new T.Vector3(8+Math.cos(angle)*27,-3+Math.sin(angle)*27,-18+Math.sin(angle)*14),pull);o.rotation.z=pull*(angle*.6-.5);(o.material as T.MeshBasicMaterial).opacity=a*(time>=(charTiming[i]??l.time)?1:.35)});(note.material as T.MeshBasicMaterial).opacity=a*.78});
 }
}

export function dawnWorld(firstLyricOnly=false){
 const w=world('#a8bfd2',190,700);
 const shell=new T.Group();shell.position.set(0,60,85);shell.rotation.z=-.16;w.root.add(shell);w.primary=shell;
 shellPatch(shell,-.36,4.10,.17,2.80,[61,82,43],5.5);
 shellPatch(shell,3.78,.37,.58,1.65,[61,82,43],5.5,[-6,4,-6]);
 shellPatch(shell,5.54,.35,1.35,2.62,[61,82,43],5.5,[9,-3,-5]);
 const inside=new T.Group();inside.position.copy(shell.position);inside.rotation.copy(shell.rotation);w.root.add(inside);
 const core=crackedCore(inside,[8,-5,0],[9,17,8]);
 const lamp=new T.PointLight('#42d6df',1800,85,2);lamp.position.set(8,53,68);w.scene.add(lamp);
 const seam:V[]=Array.from({length:31},(_,i)=>{const y=-15+i;return [8+Math.sin(y*.09)*2,-5+y,-Math.sqrt(Math.max(.1,1-y*y/270))*8.5]});cable(inside,seam,.19,'energy');
 const orbit:V[]=Array.from({length:90},(_,i)=>{const a=-.35+i/89*Math.PI*1.65;return [Math.cos(a)*71,Math.sin(a)*50,Math.sin(a)*21]});cable(inside,orbit,.27,'gold');
 dawnEcology(w,inside,firstLyricOnly);
 for(let i=0;i<6;i++){const a=i/6*TAU;cable(inside,[[0,-35,0],[Math.cos(a)*9,-7,Math.sin(a)*6],[Math.cos(a)*20,23,Math.sin(a)*14]],.12,'cyan');for(let j=0;j<3;j++)cable(inside,[[Math.cos(a)*9,-7,Math.sin(a)*6],[Math.cos(a+.2*j)*17,15,Math.sin(a)*13],[Math.cos(a+.2*j)*30,32+j*4,Math.sin(a)*19]],.035,'white')}
 const dust=instances(inside,550,leafGeo,'stone',(i,m)=>{const a=i*2.399,r=18+hash(i+98)*33;m.position.set(Math.cos(a)*r,-43+hash(i+32)*90,Math.sin(a)*r*.65);m.rotation.set(hash(i),hash(i+23),hash(i+89));m.scale.set(.16,.12,.26)});
 const energyDust=instances(inside,180,leafGeo,'energy',(_i,m)=>{m.scale.set(.09,.12,.1)}),flowPose=new T.Object3D();
 w.moving.push(u=>{for(let i=0;i<180;i++){const q=mod(hash(i+32)-u*.16,1),a=i*2.399+u*.23,r=3+q*q*30;flowPose.position.set(8+Math.cos(a)*r,-5+(hash(i+109)-.5)*q*70,Math.sin(a)*r*.65);flowPose.scale.set(.07,.10,.07);flowPose.updateMatrix();energyDust.setMatrixAt(i,flowPose.matrix)}energyDust.instanceMatrix.needsUpdate=true});
 w.moving.push((u,hit)=>{shell.position.y=60+Math.sin(u*.6)*1.5;inside.position.y=shell.position.y;core.rotation.y=u*.045;dust.rotation.y=u*.017;energyDust.rotation.y=-u*.08;energyDust.scale.setScalar(1+hit*.05)});cloudSea(w,-28);
 w.camera=(u,c)=>{const q=clamp(u/6.68),z=lerp(-125,110,q*q*.3+q*.7),x=lerp(31,-11,q);look(c,[x,lerp(31,61,q),z],[-5,58,z+100],83,-.045+q*.10)};
 return w;
}
function archipelagoWorld(){
 const w=world('#91aec5',130,560);
 for(let i=0;i<66;i++){
  const z=-100+i*11,x=(i%2?1:-1)*(18+hash(i+39)*92),y=-20+hash(i+77)*47+(i%5===0?78:i%4===0?-40:0),r=6+hash(i+19)*22;
  island(w.root,[x,y,z],r,12+hash(i+3)*25,i%7===0?'navy':'stone',i+91);
  if(i%3===0)for(let j=0;j<3;j++)mesh(w.root,crystalGeo,'white',[x+(j-1)*5,y+5,z],[2+hash(i+j)*3,8+hash(i+18)*18,2+hash(i+j)*3],[.1*j,0,.15*j]);
 }
 island(w.root,[0,-15,160],27,45,'navy',111);dataTree(w,[0,-13,160],1.8);
 for(let i=0;i<9;i++){const a=i/9*TAU,x=Math.cos(a)*100,z=160+Math.sin(a)*90;cable(w.root,[[0,-22,160],[x*.4,-65,z],[x,-40,z+15]],1.1,'navy');for(let j=0;j<4;j++)cable(w.root,[[x*.4,-65,z],[x*.7,-80+j*10,z+20],[x+Math.sin(j)*25,-70+j*12,z+40]],.23,'cyan')}
 for(let i=0;i<2;i++){const o=ribbon(w.root,[0,30,155],65+i*19,1.1,.5,'cyan',i*.3);o.rotation.set(.2*i,.25*i,.17*i);w.moving.push(u=>{o.rotation.y=.25*i+u*.035})}
 fragments(w,900,200,650,'stone',201);fragments(w,450,220,650,'cyan',903);
 cloudSea(w,-62);
 w.camera=(u,c)=>{const q=clamp(u/7.851);if(q<.54){look(c,[Math.sin(u*.7)*11,lerp(5,-8,q/.54),lerp(-105,88,Math.pow(q/.54,1.18))],[0,17,160],95,Math.sin(u*.8)*.11)}else{const a=(q-.54)/.46;look(c,[lerp(-28,73,a),lerp(-8,80,a),lerp(90,175,a)],[0,45,160],96,lerp(-.16,.22,a))}};
 return w;
}
function templeWorld(){
 const w=world('#172536',170,900);
 const numerals:T.Object3D[]=[];
 for(let i=0;i<9;i++){
  const z=i*62,x=i%3===0?0:(i%2?1:-1)*45,size=60+i%3*15;
  const g=new T.Group();g.position.set(x,26+i%2*7,z);w.root.add(g);text(g,String(i+1).padStart(2,'0'),[0,12,0],size,'white',16);
  block(g,[0,-34,0],[110,7,35],'navy');for(let side of [-1,1])block(g,[side*52,-2,0],[7,64,21],'stone');
  for(let j=0;j<8;j++)block(g,[-48+j*14,-29,0],[.7,2,37],j===4?'energy':'cyan');numerals.push(g);
 }
 // Suspended buttresses and impossible bridges link the numeral structures.
 for(let i=0;i<35;i++){const z=i*19,x=(i%2?1:-1)*78;block(w.root,[x,-20+hash(i+8)*15,z],[13,4,50],'blue',[0,(i%2?1:-1)*.25,.15*Math.sin(i)]);cable(w.root,[[x,-20,z],[x*.4,62,z+20],[0,79,z+50]],.4,'cyan')}
 for(let i=0;i<16;i++)block(w.root,[(i%2?1:-1)*8,-35,-95+i*40],[3,1.2,24],'gold');
 fragments(w,850,230,850,'cyan',505);
 for(let i=0;i<28;i++){const z=-65+i*23,side=i%2?1:-1;block(w.root,[side*(62+hash(i+77)*35),20,z],[14,100+hash(i+57)*80,20],'navy',[0,.15,side*.08]);block(w.root,[side*57,72,z],[47,9,15],'navy',[0,0,side*.38]);cable(w.root,[[side*68,-28,z],[side*68,60,z],[0,90,z+18]],.85,'cyan')}
 const gate=(z:number)=>{const a=clamp(z/(8*62))*8,i=Math.min(7,Math.floor(a)),q=smooth(0,1,a-i),at=(j:number)=>({x:(j%3===0?0:(j%2?1:-1)*45)+(60+j%3*15)*.30,y:38+j%2*7});const p=at(i),n=at(i+1);return {x:lerp(p.x,n.x,q),y:lerp(p.y,n.y,q)}};
 w.camera=(u,c)=>{const q=clamp(u/6.15),z=-58+Math.pow(q,1.15)*392,p=gate(z),n=gate(z+88);look(c,[p.x,p.y,z],[n.x,n.y,z+88],95,Math.sin(u*1.2)*.10)};
 return w;
}
function memoryWorld(){
 const w=world('#202a45',160,650),glass=new T.MeshBasicMaterial({color:'#afc6d0',transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false});
 const art:T.Mesh[]=[];
 for(let a=0;a<7;a++){
  const tx=new T.Texture(artwork[a]);tx.colorSpace=T.SRGBColorSpace;tx.needsUpdate=true;const mat=new T.MeshBasicMaterial({map:tx,side:T.DoubleSide});
  // Every painting is spatially torn into 40 independently placed crop faces.
  for(let i=0;i<40;i++){
   const gx=i%8,gy=Math.floor(i/8),g=new T.BufferGeometry(),pts:V[]=[[.14,0,0],[.92,.06,0],[1,.69,0],[.72,1,0],[.07,.89,0],[0,.27,0]],v:number[]=[],uv:number[]=[];
   for(let j=0;j<6;j++)for(const pt of [[.5,.5,0] as V,pts[j],pts[(j+1)%6]]){v.push((pt[0]-.5)*14,(.5-pt[1])*13,0);uv.push((gx+pt[0])/8,1-(gy+pt[1])/5)}
   g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
   const x=(gx-3.5)*16+(a%2?18:-18)+(hash(i+37)-.5)*8;
   const o=new T.Mesh(g,mat);o.position.set(x,(2-gy)*15+(hash(i+171)-.5)*7,50+a*79+hash(i+a*41)*65);o.rotation.set((hash(i+71)-.5)*.6,Math.PI+(hash(i+9)-.5)*.7,(hash(i+114)-.5)*.43);w.root.add(o);art.push(o);
   const pane=new T.Mesh(g.clone(),glass);pane.position.copy(o.position);pane.position.z+=.5;pane.rotation.copy(o.rotation);pane.scale.setScalar(1.09);w.root.add(pane);
   w.moving.push((u,hit)=>{o.position.x=x+Math.sin(u*1.5+i)*2+hit*(i%2?2:-2);o.rotation.z=(hash(i+114)-.5)*.43+Math.sin(u+i)*.05;});
  }
 }
 // Cables, dark gates and enormous cropped ghost images interrupt the archive.
 for(let i=0;i<12;i++){const side=i%2?1:-1;block(w.root,[side*76,0,i*51],[8,140,14],'navy',[0,.1,side*.22]);cable(w.root,[[side*85,-65,i*51],[side*63,40,i*51+32],[side*95,75,i*51+65]],.11,'cyan')}
 const ghostTexture=new T.Texture(artwork[3]);ghostTexture.colorSpace=T.SRGBColorSpace;ghostTexture.needsUpdate=true;ghostTexture.repeat.set(.38,.3);ghostTexture.offset.set(.3,.25);
 const ghost=new T.Mesh(new T.SphereGeometry(54,36,24),new T.MeshBasicMaterial({map:ghostTexture,transparent:true,opacity:.27,side:T.DoubleSide,depthWrite:false}));ghost.position.set(16,45,325);w.root.add(ghost);w.moving.push(u=>{ghost.rotation.y=.4+u*.17});
 fragments(w,1600,250,850,'cyan',121);
 w.camera=(u,c)=>{const cut=Math.min(3,Math.floor(u/1.94)),v=u-cut*1.94;const z=-30+cut*137+v*85;look(c,[Math.sin(v*1.7+cut)*21,Math.sin(v*.8+cut)*18,z],[0,3,z+130],97,(cut%2?1:-1)*(.13+v*.13))};
 return w;
}
function engineWorld(){
 const w=world('#09111b',120,430),engine=new T.Group();engine.position.set(0,14,110);w.root.add(engine);
 const shellGeo=new T.IcosahedronGeometry(92,2),pos=shellGeo.attributes.position,verts:number[]=[];
 for(let i=0;i<pos.count;i+=3){const cx=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,cy=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3,cz=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3;if(!(cz<-45&&cx*cx+cy*cy<58*58)&&!(cx>40&&cy<15&&cz<20))for(let j=0;j<3;j++)verts.push(pos.getX(i+j),pos.getY(i+j),pos.getZ(i+j))}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.computeVertexNormals();const sh=mesh(engine,g,'navy');(sh.material as T.Material).side=T.DoubleSide;
 engine.add(new T.LineSegments(new T.EdgesGeometry(g),new T.LineBasicMaterial({color:'#6c8495',transparent:true,opacity:.32})));
 for(let i=0;i<14;i++){const a=i/14*TAU;cable(engine,[[Math.cos(a)*84,Math.sin(a)*84,-12],[Math.cos(a)*65,Math.sin(a)*65,-32],[Math.cos(a+.25)*24,Math.sin(a+.25)*24,3]],.65,'stone');block(engine,[Math.cos(a)*47,Math.sin(a)*47,2],[8,35,17],'blue',[0,0,a]);}
 const gills=instances(engine,224,boxGeo,'navy',(i,m)=>{const a=(i%28)/28*TAU,r=24+Math.floor(i/28)*5;m.position.set(Math.cos(a)*r,Math.sin(a)*r,-23+Math.floor(i/28)*7);m.rotation.set(.2,0,a+.4);m.scale.set(1.2,8,3)});w.moving.push((u,hit)=>{gills.rotation.z=-u*.18;gills.scale.setScalar(1+hit*.025)});
 for(let j=0;j<2;j++){const o=ring(engine,[0,0,j*14-12],27+j*19,.45,j?'cyan':'energy',[.18*j,.13*j,.4*j]);w.moving.push(u=>{o.rotation.z=.4*j+u*.08})}
 const core=crackedCore(engine,[0,0,0],[12,19,11]);w.moving.push(u=>{core.rotation.set(u*.04,u*.07,u*.02)});
 for(let i=0;i<7;i++)cable(engine,[[-4+i, -16,-12],[-6+i*2,0,-13],[i,16,-9]],.08,'energy');
 for(let i=0;i<35;i++)block(w.root,[(i%2?1:-1)*(26+hash(i+3)*77),-55+hash(i+29)*92,-160+i*14],[8+hash(i+6)*7,50+hash(i+44)*55,12],'navy',[.15,hash(i)*.3,.18*Math.sin(i)]);
 fragments(w,1900,200,500,'stone',211);fragments(w,1200,230,500,'cyan',390);
 const lamp=new T.PointLight('#9ce5ec',3900,240,2);lamp.position.set(-24,14,72);w.scene.add(lamp);const fill=new T.PointLight('#c8d5e0',1800,180,2);fill.position.set(28,15,148);w.scene.add(fill);
 w.camera=(u,c)=>{const q=clamp(u/7.0);look(c,[Math.sin(u*.7)*22,lerp(-13,33,q),lerp(-94,168,.3*q+.7*q*q)],[0,14,110+q*55],101,-.2+q*.7)};
 return w;
}
function gardenWorld(){
 const w=world('#bcc6d5',140,550);
 for(let i=0;i<95;i++){
  const a=i*2.399,r=25+hash(i+8)*130,x=Math.cos(a)*r,z=Math.sin(a)*r+130,y=-40+hash(i+41)*28;
  const stem=new T.Group();stem.position.set(x,y,z);w.root.add(stem);cable(stem,[[0,0,0],[Math.sin(i)*5,20,0],[0,35,0]],.4,'navy');
  for(let j=0;j<6;j++){const b=j/6*TAU;const p=mesh(stem,leafGeo,'white',[Math.cos(b)*8,37+Math.sin(b)*2,Math.sin(b)*8],[6,.7,12],[.4,b,.5]);w.moving.push(u=>{p.rotation.y=b+u*.11})}
  mesh(stem,crystalGeo,'glass',[0,35,0],[3,8,3]);
 }
 const mobius=ribbon(w.root,[0,40,160],65,17,.5,'stone');mobius.rotation.set(.8,.2,.4);w.moving.push(u=>{mobius.rotation.y=.2+u*.11});
 fragments(w,700,230,700,'stone',830);
 w.camera=(u,c)=>{look(c,[Math.sin(u*.9)*24,9+Math.sin(u)*13,-50+u*48],[0,37,155],99,Math.sin(u*1.6)*.26)};
 return w;
}
function mirrorWorld(){
 const w=world('#1b2d43',120,520),water=new T.PlaneGeometry(620,900,28,46),p=water.attributes.position;
 const base=Float32Array.from(p.array);
 const sea=mesh(w.root,water,'blackglass',[0,-12,140],[1,1,1],[-Math.PI/2,0,0]);
 w.moving.push(u=>{for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(base[i*3]*.025+u*1.7)*3+Math.cos(base[i*3+1]*.034-u)*2);p.needsUpdate=true;water.computeVertexNormals()});
 const core=new T.Group();core.position.set(0,28,120);w.root.add(core);
 for(let i=0;i<6;i++){const o=mesh(core,new T.SphereGeometry(38,20,14,i/6*TAU+.045,TAU/6-.09,.12,Math.PI-.24),'navy');o.position.set(Math.sin(i)*2,Math.cos(i)*2,0);w.moving.push(u=>{o.rotation.y=u*.08;o.position.x=Math.sin(i)*(2+Math.sin(u*1.6)*3)})}
 mesh(core,new T.IcosahedronGeometry(14,1),'white');for(let i=0;i<2;i++){const o=ribbon(core,[0,0,0],43+i*9,.55,.5,i?'cyan':'white',i*.27);o.rotation.set(.25+i,.5*i,.2*i);w.moving.push(u=>{o.rotation.y=.5*i+u*.27})}
 for(let i=0;i<21;i++){const side=i%2?1:-1,z=-60+i*18;island(w.root,[side*(31+hash(i+8)*57),-8,z],8+hash(i+13)*16,10,'blackglass',i+149);block(w.root,[side*(25+hash(i+61)*50),16,z],[1,42+hash(i+57)*30,19],i%3?'glass':'white',[.08,.3,side*.25]);irregularCore(w.root,[side*63,15,z],[6,9,6],'stone')}
 fragments(w,1000,200,600,'cyan',173);
 w.camera=(u,c)=>{const q=clamp(u/3.3);look(c,[10*Math.sin(u*.7),2+q*25,-95+q*170],[0,25,130],99,-.1-q*.25)};
 return w;
}
function labyrinthWorld(){
 const w=world('#182232',150,620);
 const path=(s:number,v:number)=>{const a=.4+s*TAU*2.5,r=49+Math.sin(s*Math.PI)*11,fold=v*35;return new T.Vector3(Math.cos(a)*(r+fold*Math.cos(a*.43)),22+Math.sin(a)*(r*.72+fold),s*700-75+fold*Math.sin(a*.3))};
 foldedBody(w.root,path,'white',3.6,'blue');
 for(const side of [-1,1]){const pts:V[]=Array.from({length:240},(_,i)=>path(i/239,side*.5).toArray() as V);cable(w.root,pts,.22,'cyan')}
 const energy:V[]=Array.from({length:240},(_,i)=>path(i/239,-.34).toArray() as V);cable(w.root,energy,.10,'energy');
 for(let i=0;i<42;i++){const s=i/41,p=path(s,0),cross=path(s,.5).sub(path(s,-.5)),o=block(w.root,p.toArray() as V,[2.4,cross.length(),1.8],'navy');o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),cross.normalize());if(i%6===0){const q=path(s,.5);cable(w.root,[p.toArray() as V,[p.x*.7,-28,p.z],[q.x,-42,q.z]],.55,'stone')}}
 fragments(w,1500,250,850,'stone',209);fragments(w,300,100,850,'cyan',690);
 w.camera=(u,c)=>{const q=clamp(u/3.7),s=.05+q*.33,p=path(s,-.24),along=path(s+.001,-.24).sub(path(s-.001,-.24)),cross=path(s,.25).sub(path(s,-.25)),normal=along.cross(cross).normalize();p.addScaledVector(normal,15);const target=path(s+.12,-.15).addScaledVector(normal,12);look(c,p.toArray() as V,target.toArray() as V,94,q*.3)};
 return w;
}
function bridgeWorld(){
 const w=world('#7d9cb6',190,800);
 const route=(z:number,v:number,offset=0)=>{const i=(z+180)/11;return new T.Vector3(Math.sin(i*.09)*37+offset+v*27,-23+i*.22+Math.sin(i*.17)*9,z)};
 for(const [start,end] of [[-180,40],[61,338],[361,630]])foldedBody(w.root,(s,v)=>route(lerp(start,end,s),v),'white',6);
 for(let i=0;i<4;i++){const z=-40+i*140,p=route(z,0);cable(w.root,[[p.x-37,p.y,z],[p.x-46,p.y+48,z+12],[p.x-12,p.y+85,z+30],[p.x+39,p.y+60,z+48],[p.x+37,p.y,z+64]],4.8,'stone');for(let side of [-1,1])block(w.root,[p.x+side*31,p.y-11,z],[8,77,17],'navy',[0,0,side*.12]);}
 for(let i=0;i<22;i++){const z=-145+i*36,p=route(z,0);block(w.root,[p.x,p.y-33,z],[6,58,12],'navy');for(let side of [-1,1])cable(w.root,[[p.x+side*16,p.y,z],[p.x+side*21,p.y-23,z+13],[p.x,p.y-51,z+20]],.4,'cyan')}
 for(let i=0;i<25;i++){const x=(i%2?1:-1)*(70+hash(i+10)*80),z=i*24;island(w.root,[x,-33+hash(i+55)*35,z],14+hash(i+26)*20,45,'navy',i+940);irregularCore(w.root,[x,14,z],[3,28,6],'stone')}
 const axis:V[]=Array.from({length:160},(_,i)=>{const p=route(-155+i*5,-.45);p.y+=4;return p.toArray() as V});cable(w.root,axis,.14,'energy');
 fragments(w,2200,290,1000,'cyan',181);cloudSea(w,-55);
 w.camera=(u,c)=>{const q=clamp(u/6.615),z=-105+q*120+q*q*240,i=(z+180)/11,x=Math.sin(i*.09)*34,y=-23+i*.22+Math.sin(i*.17)*9+6+q*45;look(c,[x,y,z],[Math.sin((i+9)*.09)*34,y+19,z+115],101,Math.sin(q*5)*.2)};
 return w;
}

export const openingWorldCuts=[
 {start:5.321,end:12,id:'dawn'},
 {start:12,end:19.851,id:'islands'},
 {start:19.851,end:26,id:'temple'},
 {start:26,end:34,id:'memory'},
 {start:34,end:41,id:'engine'},
 {start:41,end:44.7,id:'garden'},
 {start:44.7,end:48,id:'mirror'},
 {start:48,end:51.7,id:'labyrinth'},
 {start:51.7,end:58.315,id:'bridge'},
] as const;

export class OpeningWorld {
 private renderer:T.WebGLRenderer;
 private camera=new T.PerspectiveCamera(85,16/9,.35,2000);
 private worlds=new Map<string,World>();
 private tear=audio.majorTransients.filter((e,i)=>i%13===0&&e.time>12&&e.time<58);
 constructor(canvas:HTMLCanvasElement,private look:'finished'|'silhouette'='finished'){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(1);this.renderer.setSize(canvas.width,canvas.height,false);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.renderer.shadowMap.enabled=this.look!=='silhouette';this.renderer.shadowMap.type=T.PCFSoftShadowMap;materials.energy.toneMapped=false;
  const makers:{[id:string]:()=>World}={dawn:dawnWorld,islands:archipelagoWorld,temple:templeWorld,memory:memoryWorld,engine:engineWorld,garden:gardenWorld,mirror:mirrorWorld,labyrinth:labyrinthWorld,bridge:bridgeWorld};
  const env=reflectionSky();for(const [id,make] of Object.entries(makers)){const w=make();w.scene.environment=env;w.scene.environmentIntensity=.3;if(this.look==='silhouette'&&w.primary){w.root.children.forEach(o=>{o.visible=o===w.primary});w.scene.background=new T.Color('#e8eaeb');w.scene.fog=null;w.scene.overrideMaterial=new T.MeshBasicMaterial({color:'#0a0d11',side:T.DoubleSide});}this.worlds.set(id,w)}
 }
 render(time:number){
  const shot=openingWorldCuts.find(s=>time>=s.start&&time<s.end);if(!shot)return;
  const w=this.worlds.get(shot.id)!,u=time-shot.start,e=audio.majorTransients.findLast(e=>e.time<=time),hit=e?e.strength*Math.exp(-(time-e.time)*18):0;
  const pose=(at:number)=>{w.camera(at,this.camera);w.moving.forEach(f=>f(at,hit));w.root.scale.z=1;w.root.position.x=0};
  this.renderer.setScissorTest(false);pose(u);
  // A three-frame depth collapse is a scene transform, not a text animation.
  for(const at of [37.38,45.91,55.62])if(time>=at&&time<at+3/60){w.root.scale.z=.055;w.root.position.z=this.camera.position.z+80}
  if(w.root.scale.z===1)w.root.position.z=0;
  this.renderer.render(w.scene,this.camera);
  const tear=this.tear.find(e=>time>=e.time&&time<e.time+2/60);
  if(tear){
   const width=this.renderer.domElement.width,height=this.renderer.domElement.height;
   this.renderer.setScissorTest(true);
   for(let j=0;j<3;j++){
    const h=Math.round(height*(.09+j*.04)),y=Math.round(height*(.13+j*.26));
    this.renderer.setScissor(0,y,width,h);pose(u-(j+1)/60);w.root.position.x=(j%2?-1:1)*(10+j*4);this.camera.rotateZ(j%2?.02:-.015);this.renderer.render(w.scene,this.camera);
   }
   this.renderer.setScissorTest(false);pose(u);
  }
 }
 dispose(){this.renderer.dispose();this.worlds.forEach(w=>w.scene.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose()}));}
}

export {world,mesh,block,profile,beam,cable,text,island,foldedBody,glyphPlane,annotation,instances,fragments,look,cloudSea,dataTree,reflectionSky,materials,hash,clamp,smooth,lerp,crackedCore,leafGeo,boxGeo};
export const existingWorlds={dawn:dawnWorld,islands:archipelagoWorld,temple:templeWorld,memory:memoryWorld,engine:engineWorld,labyrinth:labyrinthWorld,bridge:bridgeWorld};
export const getArtwork=()=>artwork;
