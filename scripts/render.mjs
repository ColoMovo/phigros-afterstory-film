import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition,openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const mode=process.argv[2]||'preview';
const quality=['final','test60','stills'].includes(mode)?'final':'preview';
const inputProps={quality};
fs.mkdirSync('output/stills',{recursive:true});
const serveUrl=await bundle({entryPoint:'src/index.tsx',outDir:path.resolve('.render/bundle'),publicDir:path.resolve('public')});
const browserExecutable=process.env.CHROME_PATH||null;
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'warn'});
const common={serveUrl,inputProps,browserExecutable,puppeteerInstance:browser,timeoutInMilliseconds:90000,logLevel:'warn'};
try {
const composition=await selectComposition({...common,id:'Afterstory'});
console.log(JSON.stringify({mode,width:composition.width,height:composition.height,fps:composition.fps,frames:composition.durationInFrames}));
if(mode==='stills'){
 for(const time of (process.env.STILL_TIMES?process.env.STILL_TIMES.split(',').map(Number):[3,7,20,34,58,78,88,98,113,123,135.3,138,142.5,155,161])){
  await renderStill({...common,composition,frame:Math.round(time*composition.fps),output:`output/stills/${time.toFixed(1).padStart(5,'0')}.png`,imageFormat:'png'});
  console.log('Still',time);
 }
} else {
 const test=mode.startsWith('test');let last=-1;const started=performance.now();
 const tmp=`output/${test?mode:quality}-raw.mp4`;
 await renderMedia({...common,composition,codec:'h264',audioCodec:'aac',audioBitrate:'320k',crf:quality==='final'?17:23,x264Preset:'fast',pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:quality==='final'?95:85,concurrency:Number(process.env.RENDER_CONCURRENCY||2),outputLocation:tmp,frameRange:test?[Math.round(119*composition.fps),Math.round(125*composition.fps)-1]:undefined,onProgress:p=>{const n=Math.floor(p.progress*20);if(n!==last){last=n;console.log(`${Math.round(p.progress*100)}% rendered=${p.renderedFrames} encoded=${p.encodedFrames} elapsed=${Math.round((performance.now()-started)/1000)}s`);}}});
 if(!test){const out=quality==='final'?'output/phigros-main-story-celebration.mp4':'output/preview.mp4';
 const analysis=JSON.parse(fs.readFileSync('src/data/audio-summary.json','utf8'));
 execFileSync('ffmpeg',['-v','error','-y','-i',tmp,'-i','public/music.mp3','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','320k','-t',String(analysis.duration),'-movflags','+faststart','-metadata','title=Phigros — Afterstory / Unofficial Fan Tribute',out],{stdio:'inherit'});
 fs.unlinkSync(tmp);
 }
 console.log(`Completed ${mode} in ${((performance.now()-started)/1000).toFixed(1)} seconds`);
}
} finally{await browser.close({silent:true});}
