// Original cut-paper places remembered along a journey. No illustration,
// official UI, logo, character, screenshot or PV frame is sampled here.
// The original recurring leaf has two pointed ends, a slightly asymmetric
// translucent body and one curved vein. It is a memory anchor, not an icon.
export function paintMemoryLeaf(x:CanvasRenderingContext2D,px:number,py:number,length:number,turn=0){
 x.save();const inheritedAlpha=x.globalAlpha;x.translate(px,py);x.rotate(turn);x.scale(length/100,length/100);
 x.globalAlpha=inheritedAlpha*.7;const body=x.createLinearGradient(-23,12,21,-18);body.addColorStop(0,'#bacdc5');body.addColorStop(.54,'#e3ddba');body.addColorStop(1,'#b7cec9');x.fillStyle=body;
 // Same normalized outline as emotion-direction.memoryLeafGeometry. The
 // paper impression changes medium without inventing a second living symbol.
 x.beginPath();for(let i=0;i<=24;i++){const u=i/24,half=Math.sin(u*Math.PI)*(1-u*.12),px=-half*.45*50,py=(u-.5)*100;i?x.lineTo(px,py):x.moveTo(px,py)}for(let i=24;i>=0;i--){const u=i/24,half=Math.sin(u*Math.PI)*(1-u*.12);x.lineTo(half*.45*50,(u-.5)*100)}x.closePath();x.fill();
 x.globalAlpha=inheritedAlpha*.62;x.strokeStyle='#778e84';x.lineWidth=1.3;x.beginPath();x.moveTo(0,48);x.bezierCurveTo(1.1,18,1.1,-18,0,-48);x.stroke();
 x.restore();
}
export async function createArchiveImages():Promise<HTMLImageElement[]>{
 return Promise.all(Array.from({length:7},async(_,i)=>{
  const c=document.createElement('canvas');c.width=1200;c.height=800;const x=c.getContext('2d')!;
  const palettes=[['#ede5d6','#293842','#bd947b'],['#d9e3e7','#293645','#c5a473'],['#e9e2de','#283743','#b7898f'],['#e5e4ec','#394257','#9299b0'],['#dce4df','#293e3b','#a2b793'],['#dde8ec','#2b424c','#b8a790'],['#efe6d6','#334452','#c29c70']];
  const [bg,ink,accent]=palettes[i];
  const sky=x.createLinearGradient(0,0,0,800);sky.addColorStop(0,bg);sky.addColorStop(.56,'#f8f1e2');sky.addColorStop(1,bg);x.fillStyle=sky;x.fillRect(0,0,1200,800);
  const shape=(points:number[][],color=ink)=>{x.fillStyle=color;x.beginPath();points.forEach((p,k)=>k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill()};
  // A horizon and a traversable path survive every chapter's change of medium.
  shape([[0,530],[300,414],[465,474],[690,439],[915,503],[1200,417],[1200,800],[0,800]],accent);
  shape([[0,669],[225,560],[535,520],[805,583],[1200,550],[1200,800],[0,800]]);
  shape([[160,800],[580,482],[648,482],[960,800]],bg);
  x.strokeStyle='#f9f2e5';x.lineWidth=4;x.beginPath();x.moveTo(495,800);x.bezierCurveTo(562,655,603,584,619,479);x.stroke();
  if(i===0){ // The first threshold: a large cropped doorway, not a registry.
   shape([[116,0],[296,0],[296,514],[206,609],[116,614]]);shape([[770,0],[966,0],[1104,589],[914,629]]);
   shape([[238,62],[833,91],[855,181],[268,145]]);
  }else if(i===1){ // A stair receding into light.
   for(let j=0;j<9;j++){const u=j/8,w=140+u*320,y=287+j*43;shape([[680-w/2,y],[680+w/2,y],[670+w/2,y+26],[667-w/2,y+26]],j%2?accent:ink)}
  }else if(i===2){ // Original human-scale waiting place; no reference frame is copied.
   x.fillStyle='#ece8de';x.fillRect(0,0,1200,800);
   const morning=x.createLinearGradient(0,55,0,400);morning.addColorStop(0,'#c3d4db');morning.addColorStop(.7,'#f8f3e6');morning.addColorStop(1,'#ead7c3');x.fillStyle=morning;x.fillRect(270,45,930,363);
   // An ordinary window opens onto an impossible, distant horizon. The bench
   // proportions make the empty place livable before the cosmic view returns.
   shape([[270,307],[493,295],[699,308],[946,290],[1200,301],[1200,314],[270,318]],'#9cacb3');
   shape([[757,247],[836,235],[875,251],[862,262],[789,268]],'#b3bdbe');
   shape([[250,20],[284,20],[284,447],[250,470]]);shape([[713,45],[731,45],[731,408],[713,408]]);
   shape([[266,400],[1200,400],[1200,418],[255,436]]);
   shape([[334,419],[1010,419],[721,800],[0,800]],'#f8f1df');
   // A single empty seat, shown close enough to suggest the person who left it.
   shape([[334,420],[873,420],[873,498],[334,498]]);
   shape([[323,511],[885,511],[945,543],[372,546]],'#48525a');
   shape([[377,545],[398,545],[392,662],[371,670]]);shape([[858,543],[878,543],[913,644],[892,649]]);
   shape([[372,680],[998,655],[1027,675],[383,702]],'#d9cfc1');
   paintMemoryLeaf(x,692,529,74,.95);
  }else if(i===3){ // Growth beside an old structure.
   shape([[89,742],[150,78],[285,36],[338,685]]);
   x.strokeStyle=ink;x.lineWidth=18;x.beginPath();x.moveTo(746,686);x.bezierCurveTo(749,461,646,403,696,139);x.stroke();
   for(const [px,py,turn] of [[685,239,-.5],[722,369,.35],[705,514,-.25]]){x.save();x.translate(px,py);x.rotate(turn);x.fillStyle=accent;x.beginPath();x.moveTo(0,0);x.bezierCurveTo(-88,-106,18,-148,101,-100);x.bezierCurveTo(44,-86,30,-32,0,0);x.fill();x.restore()}
  }else if(i===4){ // Folded mineral light, with a large negative opening.
   shape([[342,-70],[823,99],[909,331],[758,604],[300,550],[173,259]]);
   shape([[500,93],[708,173],[715,378],[562,515],[379,455],[336,244]],bg);
   shape([[828,117],[998,74],[1182,638],[963,674]],accent);
  }else if(i===5){ // A remembered reflection and a single moving-water shape.
   shape([[35,374],[385,348],[528,407],[198,444]]);shape([[695,327],[1114,288],[1196,376],[864,429]]);
   x.strokeStyle=bg;x.lineWidth=8;for(let j=0;j<4;j++){x.beginPath();x.moveTo(451-j*64,579+j*32);x.bezierCurveTo(556,569+j*32,683,600+j*32,878+j*68,591+j*32);x.stroke()}
  }else{ // An open last horizon, with a cropped monument at the edge.
   shape([[959,-80],[1118,33],[1280,758],[1057,800]]);shape([[0,501],[346,457],[363,485],[0,542]]);
   x.fillStyle='#f8ecd3';x.beginPath();x.arc(570,268,62,0,Math.PI*2);x.fill();
  }
  // Chapter numerals are openings cut into a remembered place, never labels.
  x.fillStyle=bg;x.font='260px Display';x.textAlign='center';x.fillText(['01','02','03','04','05','07','09'][i],i===6?1080:264,715);
  const im=new Image();await new Promise<void>((resolve,reject)=>{im.onload=()=>resolve();im.onerror=()=>reject(Error('Procedural memory image failed'));im.src=c.toDataURL('image/png')});return im;
 }));
}
