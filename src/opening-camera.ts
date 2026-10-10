import type {V} from './opening-world';

// These editorial boundaries divide events, not spaces. A single scene and
// absolute-time camera cross all three; no shot-local pose resets are allowed.
export const OPENING_PASSAGE_END=12;
type Pose={time:number;position:V;target:V;fov:number;roll:number};
const authoredPoses:Pose[]=[
 {time:0,position:[32,31,-170],target:[10,54,100],fov:76,roll:-.035},
 {time:2.66,position:[30,32,-150],target:[8,56,110],fov:76,roll:-.035},
 {time:4.65,position:[26,34,-112],target:[0,58,120],fov:80,roll:-.028},
 {time:5.321,position:[25,35,-98],target:[0,58,125],fov:83,roll:-.024},
 {time:6.3,position:[17,41,-68],target:[2,58,145],fov:84,roll:-.018},
 {time:7.3833,position:[14,48,-15],target:[16,55,155],fov:87,roll:.015},
 {time:8.4,position:[35,55,54],target:[30,51,180],fov:90,roll:.035},
 {time:9.3,position:[76,62,165],target:[-15,20,410],fov:94,roll:-.09},
 {time:9.95,position:[-15,8,380],target:[-110,-25,650],fov:98,roll:-.13},
 {time:10.5,position:[-140,-50,560],target:[80,20,1280],fov:100,roll:-.2},
 {time:12,position:[-20,50,810],target:[80,20,1280],fov:100,roll:-.02},
];
// Gaze distance has no visual meaning. Keep it uniform so a far destination
// cannot accelerate the interpolation merely by being hundreds of metres away.
const poses=authoredPoses.map(p=>{
 const delta=p.target.map((v,i)=>v-p.position[i]),distance=Math.hypot(...delta);
 return {...p,target:p.position.map((v,i)=>v+delta[i]/distance*120) as V};
});
// Time-scaled Hermite interpolation preserves position and velocity at each
// boundary. Interpolating targets also preserves the direction of the gaze.
export function openingPassagePose(time:number){
 const t=Math.max(0,Math.min(12,time));
 const i=Math.max(0,poses.findIndex((p,j)=>j<poses.length-1&&t>=p.time&&t<=poses[j+1].time));
 const a=poses[i],b=poses[i+1],span=b.time-a.time,q=(t-a.time)/span;
 const value=(index:number,key:'position'|'target'|'fov'|'roll',component=0)=>{
  const p=poses[index];return key==='position'||key==='target'?p[key][component]:p[key];
 };
 const tangent=(index:number,key:'position'|'target'|'fov'|'roll',component=0)=>{
  const l=Math.max(0,index-1),r=Math.min(poses.length-1,index+1);
  return (value(r,key,component)-value(l,key,component))/(poses[r].time-poses[l].time);
 };
 const interpolate=(key:'position'|'target'|'fov'|'roll',component=0)=>(2*q*q*q-3*q*q+1)*value(i,key,component)+(q*q*q-2*q*q+q)*span*tangent(i,key,component)+(-2*q*q*q+3*q*q)*value(i+1,key,component)+(q*q*q-q*q)*span*tangent(i+1,key,component);
 return {position:[0,1,2].map(n=>interpolate('position',n)) as V,target:[0,1,2].map(n=>interpolate('target',n)) as V,fov:interpolate('fov'),roll:interpolate('roll')};
}
