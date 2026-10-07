// Decrypt the necessary user-provided CI audio. No plaintext audio is tracked,
// released, uploaded separately or fetched per frame. Secrets never enter logs.
import fs from 'node:fs';import {createHash,createDecipheriv} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('assets/assets-manifest.json','utf8'));
for(const item of manifest){
 if(fs.existsSync(item.localPath))continue;
 if(item.type==='audio'){
  const key=process.env.AUDIO_DECRYPTION_KEY;if(!key)throw Error('Missing private AUDIO_DECRYPTION_KEY CI input; restore user MP3 locally for development.');
  const bytes=fs.readFileSync('assets/private-input/music.enc'),dec=createDecipheriv('aes-256-gcm',Buffer.from(key.trim(),'base64'),bytes.subarray(0,12));dec.setAuthTag(bytes.subarray(12,28));const clear=Buffer.concat([dec.update(bytes.subarray(28)),dec.final()]);
  if(createHash('sha256').update(clear).digest('hex')!==item.sha256)throw Error('Private audio checksum mismatch');fs.mkdirSync('public',{recursive:true});fs.writeFileSync(item.localPath,clear);
 }else throw Error(`Missing bundled authorized asset: ${item.localPath}`);
}
console.log('Verified input availability. Render performs no remote image or font requests.');
