// All visual assets are bundled, no runtime network access.
// Optional authorized audio URL supports clones where the private audio is omitted.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('assets/assets-manifest.json','utf8'));
for(const item of manifest){
 if(fs.existsSync(item.localPath))continue;
 const url=item.type==='audio'?process.env.AUTHORIZED_AUDIO_URL:item.downloadUrl;
 if(!url)throw Error(`Required asset missing: ${item.localPath}. Restore bundled asset${item.type==='audio'?' or set AUTHORIZED_AUDIO_URL':''}.`);
 let okay=false;
 for(let attempt=0;attempt<3;attempt++){
  try{const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`HTTP ${r.status}`);if(r.headers.get('content-type')?.includes('text/html'))throw Error('Received HTML instead of asset');const bytes=Buffer.from(await r.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Asset checksum mismatch');fs.mkdirSync(item.localPath.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(item.localPath,bytes);okay=true;break;}catch(e){console.error(`Asset ${item.id}, attempt ${attempt+1}: ${e.message}`);}
 }
 if(!okay)throw Error(`Failed required asset ${item.id}`);
}
console.log('All assets local; render requires no remote images or fonts.');
