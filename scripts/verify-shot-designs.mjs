import fs from 'node:fs';
const designs=JSON.parse(fs.readFileSync('scripts/blender/designs.json'));
if(designs.length!==5||new Set(designs.map(d=>d.id)).size!==5)throw Error('Five distinct combined concepts required');
for(const d of designs){
 for(const key of ['hero','focus','camera','event','entry','exit','connection','palette','physicalIdea'])if(typeof d[key]!=='string'||d[key].length<12)throw Error(`Incomplete ${d.id}: ${key}`);
 for(const key of ['foreground','midground','hero','background'])if(!d.layers[key])throw Error(`Missing ${d.id} depth layer ${key}`);
 if(d.dna.length<3||!/(OPEN|BREAK|PASS|REVEAL|ROTATE|SPLIT|ENTER|EXIT|INVERT|DISSOLVE|ASSEMBLE)/.test(d.event))throw Error(`No event / graphic DNA in ${d.id}`);
 const config=JSON.parse(fs.readFileSync(`scripts/blender/settings/${d.id}.json`));if(config.design!==d.id||Math.abs(config.duration-d.duration)>.001)throw Error(`Mismatched design settings ${d.id}`);
 if(!fs.existsSync(`scripts/blender/${d.id}.py`))throw Error(`Missing original shot ${d.id}`);
}
console.log('Five combined shot designs have hero, focus, four depth layers, camera, event, entry, exit, neighbour connection and physical idea. Structural verification does not approve the images.');
