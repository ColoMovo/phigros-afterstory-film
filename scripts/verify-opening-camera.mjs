import assert from 'node:assert/strict';
import {openingPassagePose} from '../src/opening-camera.ts';

const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const velocity=(t,key)=>{
 const e=1e-5,a=openingPassagePose(t-e)[key],b=openingPassagePose(t+e)[key];
 return a.map((v,i)=>(b[i]-v)/(2*e));
};
// The reported defects were camera resets at editorial cuts. Check continuity
// of the actual trajectory, including its gaze and velocity, at those cuts.
for(const time of [2.66,5.321,7.3833,9.3,10.5]){
 const e=1e-5,left=openingPassagePose(time-e),right=openingPassagePose(time+e);
 for(const key of ['position','target']){
  assert(distance(left[key],right[key])<.02,`${key} jumps at ${time}s`);
  assert(distance(velocity(time-2*e,key),velocity(time+2*e,key))<.1,`${key} velocity resets at ${time}s`);
 }
 assert(Math.abs(left.fov-right.fov)<.001,`FOV jumps at ${time}s`);
 assert(Math.abs(left.roll-right.roll)<.001,`Roll jumps at ${time}s`);
}
let previous=openingPassagePose(0);
for(let frame=1;frame<=12*60;frame++){
 const current=openingPassagePose(frame/60);
 assert([...current.position,...current.target,current.fov,current.roll].every(Number.isFinite));
 assert(distance(current.position,current.target)>60,'Camera target collapses onto lens');
 assert(current.position[2]>=previous.position[2]-.001,'Camera reverses through the shell');
 assert(distance(current.position,previous.position)<14,'One-frame teleport');
 previous=current;
}
console.log('Opening camera: continuous position, gaze, velocity, FOV and roll across editorial cuts; no backward motion or frame teleport at 60fps.');
