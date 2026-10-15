import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

export function finishScene(scene:T.Scene){
 const seen=new Set<T.Material>();
 scene.traverse(o=>{
  if(/(?:Axes|Grid|Camera|Box|Plane|Arrow)Helper$/.test(o.type)||o.userData.productionHelper)o.visible=false;
  if(o.userData.graphicAnnotation){o.userData.suppressRender=true;o.visible=false;}
  // These were authored fine cables, not camera paths. Remove the visual
  // resemblance to viewport guides while retaining substantial structural ribs.
  if((o.userData.guideLike&&o.userData.cableRadius<.5)||o.userData.guideBeam){o.userData.suppressRender=true;o.visible=false;}
  if(!(o instanceof T.Mesh))return;
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(seen.has(m)||!(m instanceof T.MeshStandardMaterial)||m.userData.finishedSurface)continue;seen.add(m);m.userData.finishedSurface=true;
   const previous=m.onBeforeCompile,cache=m.customProgramCacheKey.bind(m);
   m.customProgramCacheKey=()=>cache()+'-satin-micro-v1';
   m.onBeforeCompile=(shader,renderer)=>{previous.call(m,shader,renderer);
    shader.vertexShader='varying vec3 finishP;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfinishP=position;');
    shader.fragmentShader='varying vec3 finishP;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat finishGrain=fract(sin(dot(floor(finishP*27.),vec3(12.9898,78.233,31.81)))*43758.5453);\nroughnessFactor=clamp(roughnessFactor+(finishGrain-.5)*.055,.3,.99);');
   };
  }
 });
}

export class SceneFinish{
 private composer:EffectComposer;private renderPass:RenderPass;private ao:SSAOPass;private output=new OutputPass();
 constructor(renderer:T.WebGLRenderer,camera:T.PerspectiveCamera){
  const scene=new T.Scene(),size=renderer.getSize(new T.Vector2());
  const target=new T.WebGLRenderTarget(size.x,size.y,{type:T.HalfFloatType,samples:4});
  this.composer=new EffectComposer(renderer,target);this.renderPass=new RenderPass(scene,camera);
  // The stock AO constructor samples Math.random. Seed only its synchronous
  // setup so separate CI workers and arbitrary seeks use identical kernels.
  const random=Math.random;let seed=17341;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  try{this.ao=new SSAOPass(scene,camera,size.x/2,size.y/2,12);}finally{Math.random=random;}
  this.ao.kernelRadius=7;this.ao.minDistance=.0008;this.ao.maxDistance=.035;
  this.composer.addPass(this.renderPass);this.composer.addPass(this.ao);this.composer.addPass(this.output);
  this.ao.setSize(Math.round(size.x/2),Math.round(size.y/2));
 }
 render(scene:T.Scene){this.renderPass.scene=scene;this.ao.scene=scene;this.composer.render(0);}
 dispose(){this.ao.dispose();this.renderPass.dispose();this.output.dispose();this.composer.dispose();}
}

export function enforceSceneVisibility(scene:T.Scene){scene.traverse(o=>{if(o.userData.suppressRender&&!o.userData.essentialLine)o.visible=false;});}
