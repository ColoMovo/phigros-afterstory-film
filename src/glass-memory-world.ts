import * as T from 'three';
import {world,profile,beam,mesh,foldedBody,look,smooth,hash,type World} from './opening-world';
import {makeMemoryLeaf} from './emotion-direction';

// Replacement for the photographic plate at 34 s. The aperture, ribs and
// frosted faces share the same geometry/material pipeline as the entire film.
export function glassMemoryWorld():World{
 const w=world('#b7cbd0',430,1550),g=new T.Group();w.root.add(g);w.primary=g;
 const glass=new T.MeshPhysicalMaterial({color:'#adc8c9',roughness:.54,metalness:.06,transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide});
 const panels:T.Mesh[]=[];
 for(let i=0;i<7;i++){
  const z=90+i*125,side=i%2?1:-1,x=side*(88+i*3);
  const pane=profile(g,[[-28,-94],[-39,65],[-13,116],[34,83],[27,-110]],4,[x,0,z],[.03,side*.22,side*.12],'glass','silver');pane.material=[glass,new T.MeshStandardMaterial({color:'#8ea7a9',roughness:.72,metalness:.64})];panels.push(pane);
  const rib=foldedBody(g,(u,v)=>{const a=-.65+u*2.3;return new T.Vector3(side*(64+Math.cos(a)*(42+v*10)),Math.sin(a)*(120+v*10),z+Math.sin(a)*18);},'white',5,'stone');rib.rotation.z=side*.07;
  beam(g,[x,-84,z],[x+side*44,-28,z+75],3.5,5,'navy');
 }
 const leaf=makeMemoryLeaf(g,9);leaf.position.set(-73,15,235);leaf.rotation.set(.12,.27,-.2);
 const floor=mesh(w.root,new T.PlaneGeometry(520,1700),'stone',[0,-125,650],[1,1,1],[-Math.PI/2,0,0]);floor.material=new T.MeshStandardMaterial({color:'#60797d',metalness:.34,roughness:.7});
 const destination=new T.Mesh(new T.PlaneGeometry(1200,800),new T.MeshBasicMaterial({color:'#e8e6cf',fog:false}));destination.position.set(0,25,1500);w.root.add(destination);
 const warm=new T.DirectionalLight('#fff0cc',2.1);warm.position.set(-100,170,1050);w.scene.add(warm);w.scene.userData.environmentIntensity=.2;
 const dust=new T.Group();w.root.add(dust);for(let i=0;i<35;i++)mesh(dust,new T.SphereGeometry(.23,6,4),'white',[(hash(i)-.5)*160,(hash(i+2)-.5)*190,hash(i+7)*900]);
 w.moving.push(q=>{panels.forEach((o,i)=>{o.rotation.y=(i%2?1:-1)*(.22+smooth(.25,.8,q)*.08);});leaf.rotation.z=-.2+q*.08;dust.position.x=q*7;});
 w.camera=(q,c)=>look(c,[-8+q*14,7+q*5,-100+q*610],[0,10,1300],76,-.025+q*.05);
 return w;
}
