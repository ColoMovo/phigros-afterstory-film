import * as T from 'three';

// Stateless surface clearance. Authored paths do the large detours; this only
// keeps a lens from grazing solid triangles. It never uses a previous frame,
// so random-access and separate Actions workers see the same pose.
export class CameraClearance{
 private solids:T.Mesh[]=[];
 private bounds=new T.Box3();private inverse=new T.Matrix4();private local=new T.Vector3();
 private a=new T.Vector3();private b=new T.Vector3();private c=new T.Vector3();private closest=new T.Vector3();private best=new T.Vector3();private triangle=new T.Triangle();
 constructor(scene:T.Scene){scene.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||o.userData.graphicAnnotation||o.userData.decorativeCable)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.every(m=>m instanceof T.MeshStandardMaterial&&!m.transparent))this.solids.push(o);});}
 protect(scene:T.Scene,camera:T.PerspectiveCamera,margin=3.5){
  scene.updateMatrixWorld(true);let displacement=0;
  for(let iteration=0;iteration<3;iteration++){
   let distance=margin,found=false;
   for(const mesh of this.solids){
    let visible=true;for(let o:T.Object3D|null=mesh;o;o=o.parent)if(!o.visible){visible=false;break;}if(!visible)continue;
    const g=mesh.geometry;g.computeBoundingBox();this.bounds.copy(g.boundingBox!).applyMatrix4(mesh.matrixWorld);if(this.bounds.distanceToPoint(camera.position)>=distance)continue;
    this.inverse.copy(mesh.matrixWorld).invert();this.local.copy(camera.position).applyMatrix4(this.inverse);
    const p=g.attributes.position,ix=g.index,count=ix?ix.count:p.count;
    for(let i=0;i<count;i+=3){this.a.fromBufferAttribute(p,ix?ix.getX(i):i);this.b.fromBufferAttribute(p,ix?ix.getX(i+1):i+1);this.c.fromBufferAttribute(p,ix?ix.getX(i+2):i+2);this.triangle.set(this.a,this.b,this.c).closestPointToPoint(this.local,this.closest);this.closest.applyMatrix4(mesh.matrixWorld);const d=this.closest.distanceTo(camera.position);if(d<distance){distance=d;this.best.copy(this.closest);found=true;}}
   }
   if(!found||distance<1e-7)break;
   const delta=margin-distance;camera.position.add(this.closest.copy(camera.position).sub(this.best).normalize().multiplyScalar(delta));displacement+=delta;
  }
  camera.updateMatrixWorld(true);return displacement;
 }
}
