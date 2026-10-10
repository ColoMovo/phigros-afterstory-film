import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition,openBrowser} from '@remotion/renderer';
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const mode=process.argv[2]||'preview',quality=['final','smoke','test60'].includes(mode)?'final':'preview';
const formal=['opening','opening-review','preview','revised-preview','hybrid-preview','final'].includes(mode);
if(formal&&process.env.GITHUB_ACTIONS!=='true')throw Error('Formal renders run in GitHub Actions. Use dev-stills or smoke locally.');
const shots=JSON.parse(fs.readFileSync('src/data/shots.json','utf8')),analysis=JSON.parse(fs.readFileSync('src/data/audio-summary.json','utf8'));
fs.mkdirSync('output',{recursive:true});
const inputProps={quality,...(process.env.OPENING_LOOK?{openingLook:process.env.OPENING_LOOK}:{})};
const serveUrl=await bundle({entryPoint:'src/index.tsx',outDir:path.resolve('.render','bundle-'+mode),publicDir:path.resolve('public')});
const browserExecutable=process.env.CHROME_PATH||null,browser=await openBrowser('chrome',{browserExecutable,logLevel:'warn'});
const common={serveUrl,inputProps,browserExecutable,puppeteerInstance:browser,timeoutInMilliseconds:120000,logLevel:'warn'};
try{
 const composition=await selectComposition({...common,id:'Afterstory'});console.log(JSON.stringify({mode,width:composition.width,height:composition.height,fps:composition.fps,frames:composition.durationInFrames,shots:shots.length}));
 if(mode==='dev-stills'||mode==='stills'){
  const dir=process.env.STILL_DIRECTORY||'output/dev-shots';fs.mkdirSync(dir,{recursive:true});
  const times=process.env.STILL_TIMES?process.env.STILL_TIMES.split(',').map(Number):shots.map(s=>s.sample);
  for(const time of times){const shot=shots.find(s=>time>=s.start&&time<s.end);const name=`${shot.id}-${time.toFixed(3)}.png`;await renderStill({...common,composition,frame:Math.round(time*composition.fps),output:path.join(dir,name),imageFormat:'png'});console.log('Development still',shot.id,time)}
 }else{
  const smoke=mode==='smoke'||mode.startsWith('test'),opening=mode==='opening'||mode==='opening-review';
  const openingEnd=Number(process.env.OPENING_END||58.315);
  if(opening&&(!Number.isFinite(openingEnd)||openingEnd<12||openingEnd>58.315))throw Error('Opening duration must be 12–58.315 seconds');
  const start=smoke?41:0,end=smoke?44:opening?openingEnd:analysis.duration,range=[Math.ceil(start*composition.fps),Math.ceil(end*composition.fps)-1];
  const raw=`output/${smoke?'smoke':opening?'opening':quality}-raw.mp4`;let last=-1;const started=performance.now();
  await renderMedia({...common,composition,codec:'h264',audioCodec:'aac',audioBitrate:'320k',crf:quality==='final'?17:23,x264Preset:'fast',pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:quality==='final'?95:87,concurrency:Number(process.env.RENDER_CONCURRENCY||2),outputLocation:raw,frameRange:range,onProgress:p=>{const n=Math.floor(p.progress*20);if(n!==last){last=n;console.log(`${Math.round(p.progress*100)}% rendered=${p.renderedFrames} encoded=${p.encodedFrames} elapsed=${Math.round((performance.now()-started)/1000)}s`)}}});
  const output=`output/${smoke?'smoke':opening?'opening-review':quality==='final'?'phigros-main-story-celebration':mode==='revised-preview'?'revised-preview':mode==='hybrid-preview'?'hybrid-preview':'preview'}.mp4`,sourceStart=range[0]/composition.fps,duration=Math.min(analysis.duration-sourceStart,(range[1]-range[0]+1)/composition.fps);
  execFileSync('ffmpeg',['-v','error','-y','-i',raw,'-ss',String(sourceStart),'-i','public/music.mp3','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','320k','-t',String(duration),'-movflags','+faststart','-metadata','title=Phigros — Afterstory / UNOFFICIAL FAN TRIBUTE',output],{stdio:'inherit'});fs.unlinkSync(raw);
  fs.writeFileSync(`${output}.render.json`,JSON.stringify({mode,quality,sourceStart,sourceEnd:sourceStart+duration,frames:range[1]-range[0]+1,fps:composition.fps,width:composition.width,height:composition.height,sourceCommit:process.env.GITHUB_SHA??'local-development',sourceAudioSHA256:'0d94177a1ce9ff8579fff4ecc9ad6962138910c03adff5534acc30c7599627f3'},null,2));
  console.log(`Completed ${mode} in ${((performance.now()-started)/1000).toFixed(1)}s`);
 }
}finally{await browser.close({silent:true})}
