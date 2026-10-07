"""CI-only review from encoded original Blender clips, with blind event frames."""
import os,json,pathlib,subprocess,hashlib,math,shutil
from PIL import Image,ImageDraw,ImageFont
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('Formal sequence review and contact sheets run in GitHub Actions only')
root=pathlib.Path(__file__).resolve().parents[1];output=root/'output';output.mkdir(exist_ok=True);events=output/'physical-events';events.mkdir(exist_ok=True);clips=output/'physical-review';clips.mkdir(exist_ok=True)
designs=json.loads((root/'scripts/blender/designs.json').read_text());samples=[]
if os.environ.get('TARGET')!='physical-review':
 used={s['family'][9:] for s in json.loads((root/'src/data/shots.json').read_text()) if s['family'].startswith('physical-')}
 designs=[d for d in designs if d['id'] in used]
for d in designs:
 path=root/'public/physical'/f"{d['id']}.mp4";meta=json.loads(path.with_suffix('.render.json').read_text())
 subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True)
 shutil.copy2(path,clips/path.name)
 row=[]
 for phase in [.06,.34,.64,.96]:
  frame=round(phase*(meta['frames']-1));image=events/f"{d['id']}-{frame:03d}.png"
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-vf',rf'select=eq(n\,{frame})','-frames:v','1',str(image)],check=True)
  row.append(dict(phase=phase,frame=frame,time=frame/meta['fps'],image=image.name))
 samples.append(dict(id=d['id'],event=d['event'],physicalIdea=d['physicalIdea'],sha256=hashlib.sha256(path.read_bytes()).hexdigest(),frames=meta['frames'],fps=meta['fps'],fullDecode='pass',stages=row))
font=ImageFont.truetype(str(root/'public/fonts/Display.ttf'),18);w,h=384,216
blind=Image.new('RGB',(w*4,h*len(samples)),'black');labeled=Image.new('RGB',(w*4,(h+65)*len(samples)),'#090d12');draw=ImageDraw.Draw(labeled)
for r,sample in enumerate(samples):
 for c,stage in enumerate(sample['stages']):
  im=Image.open(events/stage['image']).convert('RGB').resize((w,h));blind.paste(im,(c*w,r*h));labeled.paste(im,(c*w,r*(h+65)));draw.text((c*w+9,r*(h+65)+h+8),f"{sample['id']}  {stage['time']:.2f}s",font=font,fill='#eff3f0');draw.text((c*w+9,r*(h+65)+h+33),f"encoded frame {stage['frame']}",font=font,fill='#9fb8c8')
blind.save(output/'physical-event-blind.jpg',quality=94);labeled.save(output/'physical-event-labeled.jpg',quality=94)
report=dict(sourceCommit=os.environ['GITHUB_SHA'],renderEnvironment='GitHub Actions / pinned Blender 4.5.0',scope='Original physical shot sequence review; not final-film approval',visualAcceptance='Requires visual inspection of event stages and playback',samples=samples)
(output/'physical-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
