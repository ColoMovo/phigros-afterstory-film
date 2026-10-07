import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const all=JSON.parse(fs.readFileSync('scripts/blender/designs.json'));
const used=new Set(JSON.parse(fs.readFileSync('src/data/shots.json')).filter(s=>s.family.startsWith('physical-')).map(s=>s.family.slice(9)));
const designs=process.env.TARGET==='physical-review'?all:all.filter(s=>used.has(s.id));
for(const {id} of designs){
 const file=`public/physical/${id}.mp4`,meta=JSON.parse(fs.readFileSync(`public/physical/${id}.render.json`));
 const expected=createHash('sha256').update(fs.readFileSync('scripts/blender/physical-common.py')).update(fs.readFileSync(`scripts/blender/${id}.py`)).update(fs.readFileSync(`scripts/blender/settings/${id}.json`)).update(meta.profile).digest('hex');
 if(!['preview','final'].includes(meta.profile)||meta.engine!=='CYCLES'||meta.width!==(meta.profile==='preview'?960:1920))throw Error(`Wrong physical render profile ${id}`);
 if(meta.fingerprint!==expected||createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==meta.sha256)throw Error(`Stale physical shot ${id}`);
 const p=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',file],{encoding:'utf8'}));const v=p.streams.find(s=>s.codec_type==='video');
 if(p.streams.some(s=>s.codec_type==='audio')||v.codec_name!=='h264'||v.width!==meta.width||v.height!==Math.round(meta.width*9/16)||v.r_frame_rate!==`${meta.fps}/1`||Number(v.nb_frames)!==meta.frames)throw Error(`Invalid physical shot ${id}`);
 console.log(`Verified original Blender ${id}: ${meta.width}x${Math.round(meta.width*9/16)} ${meta.fps}fps ${meta.frames} frames`);
}
