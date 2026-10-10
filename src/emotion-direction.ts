import * as T from 'three';
import map from './data/emotion-map.json';
import type {World} from './opening-world';

// These are authored intentions, not measurements of the viewer's emotion.
// Absolute-time interpolation makes concurrent render and seeking identical.
export function emotionAt(time:number){
 const points=map.controls;
 const next=points.findIndex(p=>p.time>time);
 const a=points[next<0?points.length-1:Math.max(0,next-1)],b=points[next<0?points.length-1:next];
 const q=a===b?0:Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time)));
 const blend=(key:'warmth'|'openness'|'wind'|'glitchAllowance')=>a[key]+(b[key]-a[key])*q;
 return {warmth:blend('warmth'),openness:blend('openness'),wind:blend('wind'),glitchAllowance:blend('glitchAllowance')};
}

function softMote(){
 const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d')!,g=x.createRadialGradient(16,16,0,16,16,16);
 g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.2,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,32,32);return new T.CanvasTexture(c);
}
function leafGeometry(){
 const p:number[]=[],ix:number[]=[];
 for(let i=0;i<=12;i++)for(let j=0;j<=4;j++){const u=i/12,v=(j/4-.5)*2,half=Math.sin(u*Math.PI);p.push(v*half*.55,(u-.5)*2,Math.sin(u*Math.PI)*.18-v*v*half*.14);if(i<12&&j<4){const k=i*5+j;ix.push(k,k+1,k+5,k+1,k+6,k+5)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
}

// Supplement the authored scene events with a small coherent breeze and warm
// reflected light. Do not recolor every object or replace distinct world palettes.
export function makeEmotionRig(w:World,family:string){
 const directed=w.scene.children.filter((o):o is T.DirectionalLight=>o instanceof T.DirectionalLight).map(light=>({light,color:light.color.clone()}));
 const reflected=new T.HemisphereLight('#ffe9d2','#697a91',0);w.scene.add(reflected);
 const restFog=w.scene.fog instanceof T.Fog?{fog:w.scene.fog,near:w.scene.fog.near,far:w.scene.fog.far}:null;
 const air=new T.Group();w.root.add(air);
 // Editorial acts already contain their own pollen, water and life event.
 const living=['opening-passage','continent','canopy','stair','canyon','ringtemple','colonnade'].includes(family);
 const leaves:{o:T.Mesh;phase:number;rest:T.Vector3}[]=[];
 if(living){
  const geometry=leafGeometry(),mote=softMote();
  for(let i=0;i<7;i++){
   const phase=i*2.399,mat=new T.MeshStandardMaterial({color:i<2?'#b5c1ab':'#d3d5bd',roughness:.83,metalness:0,side:T.DoubleSide,transparent:true,opacity:.65});
   const o=new T.Mesh(geometry,mat),rest=new T.Vector3(Math.sin(phase)*130,45+Math.cos(phase*.7)*72,90+i*65);o.position.copy(rest);o.scale.setScalar(1.7+i*.65);air.add(o);leaves.push({o,phase,rest});
  }
  for(let i=0;i<22;i++){const o=new T.Sprite(new T.SpriteMaterial({map:mote,color:'#ffe9ca',transparent:true,opacity:.3,depthWrite:false}));o.position.set(Math.sin(i*2.399)*180,Math.cos(i*1.7)*110,70+i*23);o.scale.setScalar(.3+i%4*.12);air.add(o);}
 }
 return (time:number)=>{
  const e=emotionAt(time),warm=Math.max(0,e.warmth-.32)*.18;
  directed.forEach(({light,color})=>light.color.copy(color).lerp(new T.Color('#ffe4cd'),warm));
  reflected.intensity=(.018+e.warmth*.13)*e.openness;
  if(restFog){restFog.fog.near=restFog.near*(1+e.openness*.05);restFog.fog.far=restFog.far*(1+e.openness*.12);}
  air.visible=living&&time>=3.9&&time<78.299;
  // Wind has a shared direction and changes the leaf's bend/turn, not jitter.
  air.position.x=Math.sin(time*.23)*8*e.wind;air.position.y=Math.sin(time*.17)*3*e.wind;
  leaves.forEach(({o,phase,rest})=>{o.position.copy(rest);o.position.x+=Math.sin(time*.38+phase)*22*e.wind;o.position.y+=Math.sin(time*.27+phase)*9*e.wind;o.rotation.set(.3+Math.sin(time*.3+phase)*.18,.5+Math.sin(time*.21+phase)*.28,.18+Math.sin(time*.33+phase)*.3);});
 };
}
