// Original print/data montage. This world deliberately has no CG lighting.
// Image thresholds, paper grain and frame slicing change the medium itself.
type Shot={start:number;end:number;family:string};
const W=1920,H=1080;
const hash=(n:number)=>{const q=Math.sin(n*127.1+311.7)*43758.5;return q-Math.floor(q)};
const cache=new Map<string,HTMLCanvasElement>();
function plate(images:HTMLImageElement[],index:number,invert:boolean){
 const k=index+'-'+invert;if(cache.has(k))return cache.get(k)!;
 const c=document.createElement('canvas');c.width=640;c.height=426;const x=c.getContext('2d')!;x.drawImage(images[index%images.length],0,0,c.width,c.height);
 const pixels=x.getImageData(0,0,c.width,c.height);for(let i=0;i<pixels.data.length;i+=4){const l=pixels.data[i]*.25+pixels.data[i+1]*.6+pixels.data[i+2]*.15,b=(l>120)!==invert?238:12;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=b;}x.putImageData(pixels,0,0);cache.set(k,c);return c;
}
export function paintPrintWorld(x:CanvasRenderingContext2D,time:number,shot:Shot,images:HTMLImageElement[],jp:string){
 const family=shot.family,q=Math.max(0,Math.min(1,(time-shot.start)/(shot.end-shot.start))),tick=Math.floor((time-shot.start)*15);
 if(!['memory','exploded','poster','typeworld','insert-scan','insert-type','insert-red','insert-white'].includes(family))return false;
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
