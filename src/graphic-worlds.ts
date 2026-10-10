// Original print montage. This world deliberately changes medium rather than
// pretending that a full-frame graphic is another lit CG environment.
type Shot={start:number;end:number;family:string};
const W=1920,H=1080;
const hash=(n:number)=>{const q=Math.sin(n*127.1+311.7)*43758.5;return q-Math.floor(q)};
const cache=new Map<string,HTMLCanvasElement>();
function plate(images:HTMLImageElement[],index:number,invert:boolean){
 const k=index+'-'+invert;if(cache.has(k))return cache.get(k)!;
 const c=document.createElement('canvas');c.width=640;c.height=426;const x=c.getContext('2d')!;x.drawImage(images[index%images.length],0,0,c.width,c.height);
 const pixels=x.getImageData(0,0,c.width,c.height);for(let i=0;i<pixels.data.length;i+=4){const l=pixels.data[i]*.25+pixels.data[i+1]*.6+pixels.data[i+2]*.15,b=(l>120)!==invert?238:12;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=b;}x.putImageData(pixels,0,0);cache.set(k,c);return c;
}
function rememberedPaper(x:CanvasRenderingContext2D,images:HTMLImageElement[],index:number,px:number,py:number,width:number,turn:number,curl:number){
 const h=width*2/3;
 x.save();x.translate(px,py);x.rotate(turn);x.transform(1,.025,Math.sin(curl)*.09,1,0,0);
 // Few large sheets have stable identities. Their torn silhouettes, folds and
 // the shared wind provide change; the pictures do not randomly change at 15Hz.
 x.beginPath();x.moveTo(-width/2,-h/2);x.lineTo(width*.42,-h/2+18);x.lineTo(width/2,-h*.38);x.lineTo(width*.49,h*.45);x.lineTo(width*.34,h/2);x.lineTo(-width*.48,h*.47);x.closePath();
 x.shadowColor='rgba(36,40,45,.22)';x.shadowBlur=28;x.shadowOffsetX=-15;x.shadowOffsetY=28;x.fillStyle='#f5eee0';x.fill();x.shadowColor='transparent';x.clip();
 x.drawImage(images[index%images.length],-width/2+20,-h/2+20,width-40,h-40);
 const fold=x.createLinearGradient(width*.25,0,width*.5,0);fold.addColorStop(0,'rgba(250,245,230,0)');fold.addColorStop(.6,`rgba(250,245,230,${.15+Math.abs(curl)*.18})`);fold.addColorStop(1,'rgba(76,63,59,.24)');x.fillStyle=fold;x.fillRect(width*.25,-h/2,width*.25,h);
 x.restore();
}
const paperDoors=new Map<string,HTMLCanvasElement>();
function chapterOpening(){
 const key='09';if(paperDoors.has(key))return paperDoors.get(key)!;
 const c=document.createElement('canvas');c.width=1400;c.height=1200;const y=c.getContext('2d')!;
 y.fillStyle='#25313a';y.beginPath();y.moveTo(0,90);y.lineTo(1110,0);y.lineTo(1400,820);y.lineTo(1310,1200);y.lineTo(90,1160);y.closePath();y.fill();
 y.globalCompositeOperation='destination-out';y.font='850px Display';y.textAlign='center';y.fillText('09',740,1020);
 paperDoors.set(key,c);return c;
}
function paintRememberedJourney(x:CanvasRenderingContext2D,time:number,shot:Shot,images:HTMLImageElement[]){
 const q=Math.max(0,Math.min(1,(time-shot.start)/(shot.end-shot.start))),wind=time-26.9;
 x.save();const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#f3eee1');bg.addColorStop(.55,'#e3e6e5');bg.addColorStop(1,'#c9d5dc');x.fillStyle=bg;x.fillRect(0,0,W,H);
 // A remembered path persists behind every sheet; it is a destination, not a
 // scan-line. Changing the foreground discovers more of the same old light.
 x.save();x.globalAlpha=.63;x.drawImage(images[6],-60-wind*8,-100,2100,1400);x.restore();
 if(shot.family==='memory'){
  rememberedPaper(x,images,3,1490+q*80,160-q*35,650,-.18+q*.06,.24);
  rememberedPaper(x,images,1,1200+q*100,650-q*100,880,.15+q*.08,.35);
  rememberedPaper(x,images,2,520+q*230,530-q*75,1160,-.08+q*.13,.4);
  // The near sheet peels out of the frame. Its opening reveals the road and
  // living branch already present beneath it, instead of adding a new object.
  const peel=q*q*(3-2*q);
  rememberedPaper(x,images,0,180+peel*1730,510-peel*710,1510,-.21+peel*.73,.15+peel*.8);
 }else if(shot.family==='poster'){
  // Brief flat reprint: strong ink silhouette, small rose paper edge. The
  // source stays fixed while the paper turns in the same wind direction.
  rememberedPaper(x,images,4,800+q*100,530-q*80,2060,-.14+q*.14,.3);
  x.fillStyle='#b98783';x.beginPath();x.moveTo(1700,0);x.lineTo(1920,0);x.lineTo(1920,1080);x.lineTo(1780,1080);x.closePath();x.fill();
 }else{
  rememberedPaper(x,images,5,1160+q*90,550-q*40,1910,.11+q*.05,.2);
  // The chapter itself becomes a negative-space paper doorway. The visible
  // memory behind 09 remains spatially continuous as wind carries the ink away.
  const opening=shot.family==='insert-type'?.03:q;
  x.save();x.translate(620+opening*880,505-opening*270);x.rotate(-.13+opening*.19);x.drawImage(chapterOpening(),-880,-715,1760,1510);x.restore();
  x.strokeStyle='#f8efde';x.lineWidth=8;x.beginPath();x.moveTo(-100,920);x.bezierCurveTo(540,870,1100,220,2020,180-opening*120);x.stroke();
 }
 // Stable print grain gives the medium a tactile surface. It does not jitter
 // every frame or introduce new data marks / warning labels.
 x.globalAlpha=.08;x.fillStyle='#34323a';for(let i=0;i<850;i++)x.fillRect(hash(i)*W,hash(i+71)*H,1+hash(i+39)*2,1);x.globalAlpha=1;
 x.restore();return true;
}
export function paintPrintWorld(x:CanvasRenderingContext2D,time:number,shot:Shot,images:HTMLImageElement[],jp:string){
 const family=shot.family,q=Math.max(0,Math.min(1,(time-shot.start)/(shot.end-shot.start))),tick=Math.floor((time-shot.start)*15);
 if(!['memory','exploded','poster','typeworld','insert-scan','insert-type','insert-red','insert-white'].includes(family))return false;
 if(time>=26.9&&time<34&&images.length>6&&['memory','poster','insert-type','typeworld'].includes(family))return paintRememberedJourney(x,time,shot,images);
 x.save();
 const bg=family==='insert-red'?'#dd251e':family==='insert-white'?'#fffef9':family==='typeworld'?'#090a09':'#eeeae0';x.fillStyle=bg;x.fillRect(0,0,W,H);
 if(family==='insert-red'){
  x.translate(W*.68,H*.44);x.rotate(-.15+q*.3);x.strokeStyle='#090909';x.lineWidth=50;
  x.beginPath();x.moveTo(-270,-290);x.lineTo(70,-230);x.lineTo(230,80);x.lineTo(-160,330);x.lineTo(-270,-290);x.stroke();x.fillStyle='#fff4e5';x.fillRect(-W,-5,W*2,9);x.restore();return true;
 }
 if(family==='insert-white'){
  x.fillStyle='#080808';x.translate(W*.65,H*.5);x.rotate(q*.35);x.fillRect(-100-q*90,-700,70,1500);x.fillRect(-600,-80+q*160,1500,38);x.restore();return true;
 }
 if(family==='insert-type'){
  x.fillStyle='#0a0a0a';x.fillRect(0,0,W,H);x.fillStyle='#f4f1e8';x.font='950px CJK';x.textAlign='center';x.translate(W*.54,H*.86);x.rotate(-.12+q*.23);x.fillText(jp[0]||'間',0,0);x.fillStyle='#e22821';x.fillRect(-1200,-450+q*700,2400,18);x.restore();return true;
 }
 if(family==='insert-scan'){
  x.fillStyle='#070b09';x.fillRect(0,0,W,H);x.drawImage(plate(images,tick%7,true),0,0,W,H);x.globalCompositeOperation='multiply';x.fillStyle='#17b989';x.fillRect(0,0,W,H);x.globalCompositeOperation='source-over';x.strokeStyle='#08140d';x.lineWidth=4;for(let y=0;y<H;y+=10){x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke()}x.fillStyle='#d1ffe1';x.fillRect(0,q*H, W,6);x.restore();return true;
 }
 const im=plate(images,tick%7,tick%3===0);
 if(family==='typeworld'){
  x.fillStyle='#bfffdf';x.font='850px CJK';x.textAlign='left';
  for(let i=0;i<3;i++){x.save();x.translate(-300+i*720+Math.sin(q*8+i)*90,770);x.transform(1,0,Math.sin(q*6+i)*.5,1,0,0);x.fillText((jp.replace(/[ 、。，]/g,'')||'時間')[i%Math.max(1,jp.length)]||'間',0,0);x.restore()}
  x.globalCompositeOperation='difference';x.fillStyle='#eeeae0';for(let i=0;i<6;i++)x.fillRect(0,90+i*150+Math.sin(q*17+i)*40,W,20+hash(i)*50);x.globalCompositeOperation='source-over';
 }else if(family==='poster'){
  x.save();x.translate(960,540);x.rotate(-.2+q*.25);x.drawImage(im,-1250,-780,2500,1560);x.restore();x.fillStyle='#e02722';x.fillRect(W*.72,0,W*.28,H);x.fillStyle='#0c0c0b';x.font='620px Display';x.save();x.beginPath();x.rect(0,610,650,270);x.clip();x.fillText('09',-150,1050);x.restore();
 }else{
  // Large torn print planes and long opaque bars. Cropping is deliberate.
  const n=family==='exploded'?8:5;
  for(let i=0;i<n;i++){
   const cut=(i+tick)%4;const px=(i%3)*660-250+(cut%2?1:-1)*q*260,py=Math.floor(i/3)*650-180;
   x.save();x.translate(px,py);x.transform(1,Math.sin(i+q*6)*.08,(i%2?1:-1)*(.15+q*.25),1,0,0);x.rotate((i%2?1:-1)*(.07+q*.16));x.drawImage(plate(images,(i+tick)%7,(i+tick)%3===0),0,0,980,660);x.restore();
  }
  x.fillStyle=tick%3===0?'#21b895':'#111110';for(let i=0;i<4;i++)x.fillRect((i%2?1:-1)*q*420,80+i*230,W,20+hash(i+tick)*85);
  x.fillStyle=tick%2?'#eeeae0':'#090909';x.font='360px Display';x.save();x.beginPath();x.rect(1380,700,540,240);x.clip();x.fillText(String(tick%9+1).padStart(2,'0'),1300,1070);x.restore();
 }
 // Photocopy grain and a large halftone field are in the image, not tiny labels.
 x.globalAlpha=.28;x.fillStyle=family==='typeworld'?'#e7f5e9':'#12110f';
 for(let i=0;i<1000;i++){const px=hash(i+tick*3)*W,py=hash(i+71)*H;x.fillRect(px,py,1+hash(i)*3,1)}
 x.globalAlpha=.5;for(let row=0;row<14;row++)for(let col=0;col<23;col++){x.beginPath();x.arc(1160+col*34,55+row*34,2+hash(row*23+col+tick)*5,0,Math.PI*2);x.fill()}
 x.globalAlpha=1;
 if(jp){x.fillStyle=family==='typeworld'?'#f5fff1':'#11110f';x.font=`${Math.min(51,1600/jp.length)}px CJK`;x.fillText(jp,110,1030)}
 x.restore();return true;
}
