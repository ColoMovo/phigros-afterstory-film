import lyrics from './data/lyrics.json';

// One subtitle owner, after every image/graphic pass. Nothing in the scene
// graph carries the sung text. Coordinates are authored on a 1920x1080 canvas.
export const subtitleSafeArea={left:128,right:1792,top:824,bottom:1002};
export function drawSubtitles(ctx:CanvasRenderingContext2D,time:number){
 const index=lyrics.findLastIndex(l=>l.time<=time);if(index<0||time>=151.4)return;
 const row=lyrics[index],end=index===16?91.8:Math.min(lyrics[index+1]?.time??149.0,row.time+7);
 if(time>=end)return;
 const fade=Math.min(1,(time-row.time)/.16,(end-time)/.25);if(fade<=0)return;
 const fit=(s:string,preferred:number)=>{let size=preferred;ctx.font=`${size}px CJK`;while(ctx.measureText(s).width>1600&&size>28){size--;ctx.font=`${size}px CJK`;}return size;};
 ctx.save();ctx.globalAlpha=Math.max(0,fade);ctx.textAlign='center';ctx.textBaseline='alphabetic';
 const jpSize=fit(row.jp,49);const jpWidth=ctx.measureText(row.jp).width;
 const zh=row.zh==='//'?'':row.zh,zhSize=fit(zh,29),zhWidth=ctx.measureText(zh).width;
 const width=Math.min(1664,Math.max(jpWidth,zhWidth)+64),x=960-width/2;
 // A stable ink backing maintains contrast on both whiteout and dark rock.
 // It is not derived from a different frame, so parallel seeking is exact.
 ctx.fillStyle='rgba(7,17,26,.80)';ctx.beginPath();ctx.roundRect(x,847,width,145,9);ctx.fill();
 ctx.fillStyle='#f5f4eb';ctx.font=`${jpSize}px CJK`;ctx.fillText(row.jp,960,905);
 if(zh){ctx.fillStyle='#e1e9e8';ctx.font=`${zhSize}px CJK`;ctx.fillText(zh,960,961);}
 ctx.restore();
}
