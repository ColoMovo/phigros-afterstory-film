import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.resolve('.'),manifestPath='assets/generated-ai/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const selections=JSON.parse(fs.readFileSync('src/data/ai-shot-selections.json','utf8'));
const index={},report=[];
const timelineDuration=JSON.parse(fs.readFileSync('src/data/audio-summary.json','utf8')).duration;
const seen=new Set();
for(const s of selections){
 if(seen.has(s.id))throw Error(`Duplicate mined shot: ${s.id}`);seen.add(s.id);
 if(![s.start,s.end,s.sourceIn,s.sourceOut].every(Number.isFinite)||s.start<0||s.end>timelineDuration+.001||s.end<=s.start||s.end-s.start>7.1||s.sourceIn<0||s.sourceOut<=s.sourceIn)throw Error(`Invalid mined range: ${s.id}`);
}
const ordered=[...selections].sort((a,b)=>a.start-b.start);
for(let i=1;i<ordered.length;i++)if(ordered[i].start<ordered[i-1].end-1e-6)throw Error(`Overlapping AI plates: ${ordered[i-1].id} / ${ordered[i].id}`);
fs.mkdirSync('public/generated-ai',{recursive:true});
for(const clip of manifest.clips){
 for(const field of ['id','provider','model','prompt','generationDate','localPath','world','usageNotes'])if(!clip[field])throw Error(`AI manifest missing ${clip.id} ${field}`);
 if(!clip.localPath.startsWith('assets/generated-ai/')||clip.localPath.includes('..'))throw Error('AI input must be a local project asset');
 if(!fs.existsSync(clip.localPath)){
  if(!clip.optional)throw Error(`Required AI input missing: ${clip.id}`);
  report.push({id:clip.id,status:'missing optional input',fallback:'original procedural world'});continue;
 }
 if(clip.status!=='accepted'){report.push({id:clip.id,status:'not accepted for timeline',fallback:'original procedural world'});continue;}
 try{
 const bytes=fs.readFileSync(clip.localPath),head=bytes.subarray(0,512).toString().toLowerCase();
 if(head.includes('<html')||head.includes('<!doctype'))throw Error(`HTML masquerading as video: ${clip.id}`);
 const hash=createHash('sha256').update(bytes).digest('hex');if(clip.sha256!==hash)throw Error(`AI source changed: ${clip.id}`);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',clip.localPath],{encoding:'utf8'}));
 const video=probe.streams.find(s=>s.codec_type==='video'),duration=Number(probe.format.duration);
 if(!video||video.width<1280||video.height<720||duration<.5||!Number.isFinite(duration))throw Error(`Invalid AI video: ${clip.id}`);
 if(Math.abs(duration-clip.sourceDuration)>.15)throw Error(`AI duration mismatch ${clip.id}`);
 if(process.env.GITHUB_ACTIONS==='true')execFileSync('ffmpeg',['-v','error','-i',clip.localPath,'-an','-f','null','-'],{stdio:'inherit'});
 const uses=selections.filter(s=>s.clipId===clip.id);
 if(!uses.length)throw Error(`Accepted source has no defined usage: ${clip.id}`);
 for(const s of uses){if(s.sourceIn<0||s.sourceOut>duration+.01||s.sourceOut<=s.sourceIn||s.end<=s.start||s.end-s.start>7.1)throw Error(`Invalid mined range: ${s.id}`);}
 const name=clip.id+'.mp4';fs.copyFileSync(clip.localPath,path.join(root,'public/generated-ai',name));
 index[clip.id]={file:'generated-ai/'+name,width:video.width,height:video.height,duration,sha256:hash};
 report.push({id:clip.id,status:'verified',duration,resolution:[video.width,video.height],codec:video.codec_name,selectedUses:uses.length,sha256:hash});
 }catch(error){
  if(!clip.optional)throw error;
  report.push({id:clip.id,status:'invalid optional input',reason:error.message,fallback:'original procedural world'});
  console.warn(`Optional AI source ${clip.id} rejected: ${error.message}; preserving original procedural shot.`);
 }
}
for(const s of selections)if(!manifest.clips.some(c=>c.id===s.clipId))throw Error(`Selection has no manifest: ${s.id}`);
fs.writeFileSync('src/data/ai-asset-index.json',JSON.stringify(index,null,2)+'\n');
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/ai-asset-verification.json',JSON.stringify({scope:'Local source availability, provenance, decode and mined range checks; visual quality requires inspection',clips:report},null,2)+'\n');
console.log(`AI source verification: ${Object.keys(index).length} accepted local clips; absent optional clips retain procedural fallback.`);
