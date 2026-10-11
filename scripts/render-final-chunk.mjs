// Keep the complete composition clock; each inclusive range uses absolute frames.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,renderMedia,selectComposition} from '@remotion/renderer';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const totalFrames=9764,frames=2441,fps=60,width=1920,height=1080,chunks=4;
const ranges=Array.from({length:chunks},(_,index)=>({index,startFrame:index*frames,endFrame:(index+1)*frames-1,frames}));
if(process.argv[2]==='--plan'){
 console.log(JSON.stringify({quality:'final',composition:'Afterstory',totalFrames,fps,width,height,muted:true,colorSpace:'bt709',pixelFormat:'yuv420p',colorRange:'tv',ranges},null,2));
 process.exit(0);
}
if(process.env.GITHUB_ACTIONS!=='true')throw Error('Formal final chunks render only in GitHub Actions. --plan is read-only.');
if(!/^[0-3]$/.test(process.argv[2]??''))throw Error('Provide exactly one chunk index: 0, 1, 2 or 3.');
const index=Number(process.argv[2]),{startFrame,endFrame}=ranges[index];
const sourceCommit=process.env.GITHUB_SHA,physicalSourceCommit=process.env.PHYSICAL_SOURCE_SHA;
if(!/^[a-f0-9]{40}$/.test(sourceCommit??'')||!/^[a-f0-9]{40}$/.test(physicalSourceCommit??''))throw Error('Both source commits must be full SHA-1 commit IDs.');
const physicalSourceRunId=process.env.PHYSICAL_SOURCE_RUN_ID,renderRunId=process.env.GITHUB_RUN_ID;
if(!/^[1-9][0-9]*$/.test(physicalSourceRunId??'')||!/^[1-9][0-9]*$/.test(renderRunId??''))throw Error('Both artifact source run and current render run must be numeric Actions run IDs.');
const concurrency=Number(process.env.RENDER_CONCURRENCY||2);
if(!Number.isInteger(concurrency)||concurrency<1||concurrency>4)throw Error('RENDER_CONCURRENCY must be an integer from 1 to 4.');
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const analysis=readJSON('src/data/audio-summary.json'),shots=readJSON('src/data/shots.json');
const musicDuration=analysis.duration;
if(musicDuration!==162.72544217687076||Math.ceil(musicDuration*fps)!==totalFrames||shots.length!==64)throw Error('The frozen 64-shot full-music timeline changed; this four-range plan must be reviewed.');
const manifest=readJSON('assets/assets-manifest.json');
const sourceAudioSHA256=manifest.find(asset=>asset.id==='music')?.sha256;
if(sourceAudioSHA256!=='0d94177a1ce9ff8579fff4ecc9ad6962138910c03adff5534acc30c7599627f3')throw Error('Unexpected archived music source.');

// Hash declared reproducibility inputs; source-only references are not final-frame assets.
// Never include key files or the runner environment.
const paths=new Set(['package.json','package-lock.json','tsconfig.json','assets/assets-manifest.json',
 'assets/generated-ai/manifest.json','assets/music-source-provenance.json',
 'scripts/render-final-chunk.mjs','scripts/assemble-final-chunks.py']);
function addDirectory(directory,accept=()=>true){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.posix.join(directory,entry.name);
  if(entry.isSymbolicLink())throw Error(`Symlink is not a declared render input: ${file}`);
  if(entry.isDirectory())addDirectory(file,accept);
  else if(entry.isFile()&&accept(file))paths.add(file);
 }
}
addDirectory('src');
addDirectory('scripts/blender',file=>/\.(py|json)$/.test(file));
addDirectory('assets/generated-ai/references',file=>file.endsWith('.png'));
for(const asset of manifest){
 if(!asset.localPath?.startsWith('public/')||asset.localPath.includes('..')||/\.(key|enc)$/.test(asset.localPath))throw Error('Unexpected declared public asset path.');
 paths.add(asset.localPath);
}
const aiManifest=readJSON('assets/generated-ai/manifest.json');
const selections=readJSON('src/data/ai-shot-selections.json');
const aiIndex=readJSON('src/data/ai-asset-index.json');
const selectedIDs=new Set(selections.map(selection=>selection.clipId));
for(const id of selectedIDs){
 const clip=aiManifest.clips.find(item=>item.id===id),staged=aiIndex[id];
 if(!clip||clip.status!=='accepted'||!staged||staged.sha256!==clip.sha256)throw Error(`Selected AI source is not verified and staged: ${id}`);
 if(!clip.localPath.startsWith('assets/generated-ai/')||clip.localPath.includes('..')||!staged.file.startsWith('generated-ai/')||staged.file.includes('..'))throw Error(`Unsafe AI source path: ${id}`);
 paths.add(clip.localPath);paths.add('public/'+staged.file);
}
const physicalIDs=[...new Set(shots.filter(shot=>shot.family.startsWith('physical-')).map(shot=>shot.family.slice(9)))];
for(const id of physicalIDs){
 if(!/^[a-z0-9-]+$/.test(id))throw Error('Unsafe physical asset ID.');
 const sidecar=`public/physical/${id}.render.json`,meta=readJSON(sidecar);
 if(meta.sourceCommit!==physicalSourceCommit||meta.profile!=='final')throw Error(`Wrong provenance/profile on reused physical asset: ${id}`);
 paths.add(sidecar);paths.add(`public/physical/${id}.mp4`);
}
const inputHashes={};
for(const file of [...paths].sort()){
 if(!fs.lstatSync(file).isFile())throw Error(`Render input is not a regular file: ${file}`);
 inputHashes[file]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
if(inputHashes['public/music.mp3']!==sourceAudioSHA256)throw Error('The decrypted music bytes do not match the archived source.');
const fingerprintFields={sourceCommit,physicalSourceCommit,totalFrames,fps,width,height,musicDuration,sourceAudioSHA256,inputHashes};
const sourceFingerprint=createHash('sha256').update(JSON.stringify(fingerprintFields)).digest('hex');
const outputDirectory='output/final-chunks',stem=`chunk-${String(index).padStart(2,'0')}`;
fs.mkdirSync(outputDirectory,{recursive:true});
const outputLocation=path.join(outputDirectory,stem+'.mp4');
if(fs.existsSync(outputLocation)||fs.existsSync(path.join(outputDirectory,stem+'.json')))throw Error('Refusing to overwrite an existing final chunk.');
const inputProps={quality:'final'};
const serveUrl=await bundle({entryPoint:'src/index.tsx',outDir:path.resolve('.render',`final-chunk-bundle-${index}`),publicDir:path.resolve('public')});
const browserExecutable=process.env.CHROME_PATH||null;
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'warn'});
try{
 const common={serveUrl,inputProps,browserExecutable,puppeteerInstance:browser,timeoutInMilliseconds:120000,logLevel:'warn'};
 const composition=await selectComposition({...common,id:'Afterstory'});
 if(composition.durationInFrames!==totalFrames||composition.fps!==fps||composition.width!==width||composition.height!==height)throw Error('Chunk composition is not the complete final composition.');
 console.log(JSON.stringify({index,startFrame,endFrame,frames,totalFrames,fps,width,height,sourceCommit,physicalSourceCommit,sourceFingerprint,muted:true}));
 let last=-1,lastLog=0,latest={progress:0,renderedFrames:0,encodedFrames:0};const started=performance.now();
 const logProgress=()=>{lastLog=performance.now();console.log(`Chunk ${index} globalRange=${startFrame}–${endFrame}: ${Math.round(latest.progress*100)}% rendered=${latest.renderedFrames} encoded=${latest.encodedFrames} elapsed=${Math.round((lastLog-started)/1000)}s`)};
 logProgress();
 const heartbeat=setInterval(()=>{if(performance.now()-lastLog>=14500)logProgress()},15000);
 heartbeat.unref();
 try{
  // Pinned Remotion performs zscale matrix/range conversion on the first
  // JPEG encoding step for bt709; pix_fmt alone leaves the input full range.
  await renderMedia({...common,composition,codec:'h264',muted:true,crf:17,x264Preset:'fast',pixelFormat:'yuv420p',colorSpace:'bt709',imageFormat:'jpeg',jpegQuality:95,concurrency,outputLocation,frameRange:[startFrame,endFrame],onProgress:progress=>{
   latest=progress;const n=Math.floor(progress.progress*20);if(n!==last){last=n;logProgress()}
  }});
 }finally{clearInterval(heartbeat)}
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',outputLocation],{encoding:'utf8'}));
 const video=probe.streams.find(stream=>stream.codec_type==='video');
 if(probe.streams.length!==1||!video||video.codec_name!=='h264'||video.pix_fmt!=='yuv420p'||video.width!==width||video.height!==height||video.r_frame_rate!=='60/1'||video.avg_frame_rate!=='60/1'||Number(video.nb_frames)!==frames||Math.abs(Number(video.start_time||0))>.002)throw Error('Encoded final chunk has the wrong frame count, format or audio stream.');
 if(video.color_range!=='tv'||video.color_space!=='bt709'||video.color_transfer!=='bt709'||video.color_primaries!=='bt709')throw Error('Encoded final chunk must contain converted limited-range BT.709, not untagged or full-range JPEG output.');
 const sha256=createHash('sha256').update(fs.readFileSync(outputLocation)).digest('hex');
 const metadata={schemaVersion:1,index,startFrame,endFrame,frames,...fingerprintFields,sourceFingerprint,sha256,codec:video.codec_name,pixelFormat:video.pix_fmt,colorRange:video.color_range,colorSpace:video.color_space,colorTransfer:video.color_transfer,colorPrimaries:video.color_primaries,muted:true,quality:'final',composition:'Afterstory',shotCount:shots.length,encoding:{crf:17,x264Preset:'fast',imageFormat:'jpeg',jpegQuality:95,colorSpace:'bt709'},physicalIDs,physicalSourceRunId,renderRunId};
 fs.writeFileSync(path.join(outputDirectory,stem+'.json'),JSON.stringify(metadata,null,2)+'\n');
 console.log(`Verified video-only chunk ${index}: absolute frames ${startFrame}–${endFrame}.`);
}finally{await browser.close({silent:true})}
