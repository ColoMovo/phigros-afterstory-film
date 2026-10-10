import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import {createHash} from 'node:crypto';
const items=JSON.parse(fs.readFileSync('assets/assets-manifest.json','utf8'));
for(const item of items){if(!fs.existsSync(item.localPath))throw Error(`Missing ${item.localPath}`);const b=fs.readFileSync(item.localPath);if(createHash('sha256').update(b).digest('hex')!==item.sha256)throw Error(`Checksum mismatch: ${item.localPath}`);if(item.type==='font'&&b.toString('ascii',0,4)!=='wOF2')throw Error(`Invalid WOFF2: ${item.localPath}`);}
const pipeline=process.argv.includes('--pipeline=blender')?'blender':'shot-library';
if(pipeline==='blender'&&items.filter(i=>i.type==='video'&&i.id.startsWith('blender-')).length!==3)throw Error('Three completed Blender clips are required for the legacy Blender pipeline.');
for(const item of items.filter(i=>i.type==='video')){const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',item.localPath],{encoding:'utf8'}));const p=probe.streams[0],duration=Number(p.duration??probe.format.duration);if(p.codec_name!==item.codec||p.width!==item.width||p.height!==item.height||p.r_frame_rate!==`${item.fps}/1`||!Number.isFinite(duration)||Math.abs(duration-item.duration)>.018)throw Error(`Invalid hero video ${item.id}`);}
for(const file of ['src/data/lyrics.json','src/data/audio-analysis.json','assets/SOURCES.md'])if(!fs.existsSync(file))throw Error(`Missing ${file}`);
const lyrics=JSON.parse(fs.readFileSync('src/data/lyrics.json','utf8'));const a=JSON.parse(fs.readFileSync('src/data/audio-analysis.json','utf8'));
if(lyrics.length!==28||!lyrics.every((l,i)=>l.jp&&l.zh&&l.wordTiming.length&&(!i||l.time>lyrics[i-1].time)))throw Error('Incomplete or unsorted source lyrics');
if(a.frames.length!==Math.ceil(a.duration*a.featureRate)||!a.frames.every(f=>f.length===12&&f.every(Number.isFinite)))throw Error('Invalid audio controls');
execFileSync('ffmpeg',['-v','error','-i','public/music.mp3','-f','null','-'],{stdio:'inherit'});
console.log(`Verified ${items.length} binary assets, ${lyrics.length} lyric lines, ${a.frames.length} analysis frames; audio decodes cleanly.`);

const shots=JSON.parse(fs.readFileSync('src/data/shots.json','utf8'));
if(shots.length<30||shots[0].start!==0||Math.abs(shots.at(-1).end-a.duration)>1e-6||!shots.every((s,i)=>s.end>s.start&&(!i||Math.abs(s.start-shots[i-1].end)<1e-6)))throw Error('Invalid complete shot timeline');
console.log(`Shot library: ${shots.length} timed shot units, ${new Set(shots.map(s=>s.world)).size} art-direction worlds. This is a structural check, not visual acceptance.`);

execFileSync(process.execPath,['scripts/verify-ai-assets.mjs'],{stdio:'inherit'});
