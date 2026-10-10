import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const map=read('src/data/emotion-map.json'),shots=read('src/data/shots.json'),audio=read('src/data/audio-summary.json');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
close(map.duration,audio.duration);
close(map.sections[0].start,0);close(map.sections.at(-1).end,map.duration);
for(const [i,section] of map.sections.entries()){
 assert.ok(section.end>section.start&&section.purpose&&section.visualEvent&&section.lifeIntent);
 if(i)close(map.sections[i-1].end,section.start);
 for(const key of ['energy','visualDensity','warmth','openness'])assert.ok(section[key]>=0&&section[key]<=1);
}
assert.equal(map.shots.length,shots.length);
assert.equal(new Set(map.shots.map(s=>s.shotId)).size,shots.length);
for(const shot of shots){
 const intent=map.shots.find(s=>s.shotId===shot.id);assert.ok(intent,shot.id);
 close(intent.start,shot.start);close(intent.end,shot.end);assert.ok(intent.emotionPurpose&&intent.eventIntent);
}
for(const [i,p] of map.controls.entries()){
 if(i)assert.ok(p.time>map.controls[i-1].time);
 for(const key of ['warmth','openness','wind','glitchAllowance'])assert.ok(p[key]>=0&&p[key]<=1);
}
const result={scope:'director intent and timeline schema only',duration:map.duration,shotCount:shots.length,sectionCount:map.sections.length,controlCount:map.controls.length,sourceCommit:process.env.GITHUB_SHA??'local-development',visualAcceptance:'Requires inspection of actual encoded film; neither intent labels nor ranges prove emotion.'};
if(process.env.GITHUB_ACTIONS==='true'){fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/emotion-map-verification.json',JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify(result,null,2));
