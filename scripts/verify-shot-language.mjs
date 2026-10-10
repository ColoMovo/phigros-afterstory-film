import fs from 'node:fs';
const shots=JSON.parse(fs.readFileSync('src/data/shots.json'));
const fields=['visualCategory','dominantPalette','materialIdentity','lightingIdentity','atmosphere','scaleRange','foregroundType','cameraBehavior','shotEvent','exitTransition'];
for(const s of shots)for(const k of [...fields,'physicalIdea','physicalFeeling'])if(typeof s[k]!=='string'||!s[k].trim())throw Error(`Missing ${s.id} ${k}`);
const anchors=shots.filter(s=>s.shotType==='ANCHOR'),risks=[];
for(let i=1;i<anchors.length;i++){
 const a=anchors[i-1],b=anchors[i];if(a.anchorId===b.anchorId)continue;
 const same=fields.filter(k=>a[k]===b[k]);if(same.length>5)risks.push({previous:a.id,next:b.id,unchanged:same});
}
const report={scope:'Declared visual language; images must be reviewed independently',anchors:anchors.length,timedUnits:shots.length,fields,risks};
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/shot-language-audit.json',JSON.stringify(report,null,2));
if(risks.length)throw Error(`Consecutive anchors share more than half the visual fields: ${JSON.stringify(risks)}`);
console.log(`${anchors.length} anchors have explicit physical ideas and ten visual fields; no consecutive independent anchors share more than half the declared fields. This does not approve their pictures.`);
