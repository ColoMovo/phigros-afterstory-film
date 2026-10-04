import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const items=JSON.parse(fs.readFileSync('assets/assets-manifest.json','utf8'));
for(const item of items){if(!fs.existsSync(item.localPath))throw Error(`Missing ${item.localPath}`);const b=fs.readFileSync(item.localPath);if(createHash('sha256').update(b).digest('hex')!==item.sha256)throw Error(`Checksum mismatch: ${item.localPath}`);if(item.type==='font'&&b.toString('ascii',0,4)!=='wOF2')throw Error(`Invalid WOFF2: ${item.localPath}`);}
for(const file of ['src/data/lyrics.json','src/data/audio-analysis.json','assets/SOURCES.md'])if(!fs.existsSync(file))throw Error(`Missing ${file}`);
const lyrics=JSON.parse(fs.readFileSync('src/data/lyrics.json','utf8'));const a=JSON.parse(fs.readFileSync('src/data/audio-analysis.json','utf8'));
if(lyrics.length!==28||!lyrics.every((l,i)=>l.jp&&l.zh&&l.wordTiming.length&&(!i||l.time>lyrics[i-1].time)))throw Error('Incomplete or unsorted source lyrics');
if(a.frames.length!==Math.ceil(a.duration*a.featureRate)||!a.frames.every(f=>f.length===12&&f.every(Number.isFinite)))throw Error('Invalid audio controls');
execFileSync('ffmpeg',['-v','error','-i','public/music.mp3','-f','null','-'],{stdio:'inherit'});
console.log(`Verified ${items.length} binary assets, ${lyrics.length} lyric lines, ${a.frames.length} analysis frames; audio decodes cleanly.`);
