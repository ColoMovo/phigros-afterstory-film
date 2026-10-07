"""Show discovery and escalation inside real encoded anchor shots, without labels in the blind review."""
import os,json,pathlib,math,subprocess
from PIL import Image,ImageDraw,ImageFont
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('Formal event contacts are generated in GitHub Actions only')
root=pathlib.Path(__file__).resolve().parents[1]
import sys
movie=root/sys.argv[1];meta=json.loads(pathlib.Path(str(movie)+'.render.json').read_text());fps=meta['fps'];origin=meta['sourceStart']
shots=json.loads((root/'src/data/shots.json').read_text());rows=[]
for anchor in shots:
 if anchor['shotType']!='ANCHOR' or anchor['start']<origin or anchor['end']>meta['sourceEnd']:continue
 group=[s for s in shots if s['anchorId']==anchor['anchorId'] and s['family'] in (anchor['family'],'sky' if anchor['family']=='release' else anchor['family'])]
 spans=[(max(0,math.ceil((s['start']-origin)*fps-1e-7)),min(meta['frames']-1,math.ceil((s['end']-origin)*fps-1e-7)-1)) for s in group if s['start']<meta['sourceEnd']]
 spans=[(a,b) for a,b in spans if b>=a]
 if not spans:continue
 first=min(a for a,b in spans);last=max(b for a,b in spans);stages=[]
 for phase in [.07,.34,.65,.94]:
  wanted=round(first+(last-first)*phase)
  frame=min((max(a,min(b,wanted)) for a,b in spans),key=lambda n:abs(n-wanted))
  stages.append(dict(phase=phase,videoFrame=frame,sourceTime=origin+frame/fps))
 rows.append(dict(id=anchor['id'],family=anchor['family'],event=anchor['shotEvent'],stages=stages))
directory=root/'output/anchor-events';directory.mkdir(parents=True,exist_ok=True)
frames=sorted({s['videoFrame'] for r in rows for s in r['stages']});select='+'.join(f'eq(n\\,{n})' for n in frames)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(movie),'-vf',f'select={select}','-fps_mode','vfr','-frames:v',str(len(frames)),str(directory/'frame-%03d.png')],check=True)
images={n:directory/f'frame-{i+1:03d}.png' for i,n in enumerate(frames)}
w,h=384,216;font=ImageFont.truetype(str(root/'public/fonts/Display.ttf'),17)
for page in range(math.ceil(len(rows)/8)):
 subset=rows[page*8:(page+1)*8];blind=Image.new('RGB',(w*4,h*len(subset)),'black');labeled=Image.new('RGB',(w*4,(h+48)*len(subset)),'#080e12');draw=ImageDraw.Draw(labeled)
 for r,row in enumerate(subset):
  for c,stage in enumerate(row['stages']):
   im=Image.open(images[stage['videoFrame']]).convert('RGB').resize((w,h));blind.paste(im,(c*w,r*h));labeled.paste(im,(c*w,r*(h+48)))
   draw.text((c*w+8,r*(h+48)+h+8),f"{row['id']} {row['family']} {stage['sourceTime']:.3f}s",font=font,fill='#e2ebe9')
 blind.save(directory/f'{page+1:02d}-blind.jpg',quality=94);labeled.save(directory/f'{page+1:02d}-labeled.jpg',quality=94)
for p in images.values():p.unlink()
(root/'output/anchor-event-verification.json').write_text(json.dumps(dict(sourceCommit=meta['sourceCommit'],movie=movie.name,scope='Actual encoded event stages; does not approve visual quality',anchors=rows),ensure_ascii=False,indent=2)+'\n')
print(f'Sampled four encoded stages in {len(rows)} independent anchors; {len(frames)} real video frames')
