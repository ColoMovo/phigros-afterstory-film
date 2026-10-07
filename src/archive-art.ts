// Original procedural memory planes. No song illustration, official UI, logo,
// character, screenshot or PV frame is sampled here.
export async function createArchiveImages():Promise<HTMLImageElement[]>{
 return Promise.all(Array.from({length:7},async(_,i)=>{
  const c=document.createElement('canvas');c.width=1200;c.height=800;const x=c.getContext('2d')!;
  const palettes=[['#bbcbd4','#172a3b','#71b1bd'],['#e2e1da','#313941','#a29987'],['#222e3c','#bbc5d0','#7992a3'],['#b8b4c4','#3f4559','#8a779c'],['#d0d8d7','#314455','#578f9c'],['#0b1724','#8b9cae','#8d5955'],['#bed2db','#1e3b4b','#69a8b9']];
  const [bg,ink,accent]=palettes[i];x.fillStyle=bg;x.fillRect(0,0,1200,800);x.translate(600,400);x.rotate((i-3)*.13);
  x.fillStyle=ink;x.beginPath();x.moveTo(-510,380);x.lineTo(-420,-230);x.lineTo(-160,-350);x.lineTo(270,-90);x.lineTo(480,-320);x.lineTo(550,380);x.lineTo(120,160);x.lineTo(-150,275);x.closePath();x.fill();
  x.strokeStyle=accent;x.lineWidth=2.5;for(let j=0;j<14;j++){x.beginPath();x.moveTo(-450+j*33,340);x.bezierCurveTo(-260+j*22,-90,190-j*17,240,420-j*14,-330);x.stroke()}
  x.strokeStyle=bg;x.lineWidth=8;x.beginPath();x.moveTo(-410,290);x.lineTo(-180,-140);x.lineTo(210,-90);x.lineTo(370,280);x.stroke();
  x.fillStyle=bg;x.font='280px Display';x.fillText(String(i+1).padStart(2,'0'),-310,130);
  x.fillStyle=accent;x.font='19px Text';x.fillText('MEMORY / ORIGINAL ABSTRACT RECORD',-350,260);
  const im=new Image();await new Promise<void>((resolve,reject)=>{im.onload=()=>resolve();im.onerror=()=>reject(Error('Procedural memory image failed'));im.src=c.toDataURL('image/png')});return im;
 }));
}
