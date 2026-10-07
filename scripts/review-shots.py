"""Verify the actual CI MP4, then extract contacts from encoded video frames.
The manifest documents intentions; only decoded video proves render completion.
"""
from pathlib import Path
import json,math,subprocess,hashlib,sys,os
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/(sys.argv[1] if len(sys.argv)>1 else 'output/opening-review.mp4')
if p.name!='smoke.mp4' and os.environ.get('GITHUB_ACTIONS')!='true':
 raise RuntimeError('Formal MP4 verification and contact sheets run in GitHub Actions.')
meta=json.loads(Path(str(p)+'.render.json').read_text())
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['codec_name'],a['codec_name'],v['width'],v['height'],v['r_frame_rate'])==('h264','aac',meta['width'],meta['height'],str(meta['fps'])+'/1')
assert int(v['nb_frames'])==meta['frames']
duration=meta['sourceEnd']-meta['sourceStart']
assert abs(float(a['duration'])-duration)<.035
assert abs(float(a.get('start_time',0)))<.002 and abs(float(v.get('start_time',0)))<.002
subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
def pcm(path,start,seconds):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',str(path),'-t',str(seconds),'-vn','-ac','1','-ar','8000','-f','f32le','-']),dtype='<f4')
source=ROOT/'public/music.mp3';original=pcm(source,meta['sourceStart'],duration);encoded=pcm(p,0,duration);n=min(len(original),len(encoded));corr=float(np.corrcoef(original[:n],encoded[:n])[0,1]);assert corr>.98
assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sourceAudioSHA256']
shots=json.loads((ROOT/'src/data/shots.json').read_text());shots=[s for s in shots if s['sample']>=meta['sourceStart'] and s['sample']<meta['sourceEnd']]
opening=p.name=='opening-review.mp4';prefix='opening' if opening else 'smoke' if p.name=='smoke.mp4' else 'film'
dir=ROOT/'output'/f'{prefix}-keyframes';dir.mkdir(exist_ok=True)
font=ImageFont.truetype(str(ROOT/'public/fonts/CJK.ttf'),20);small=ImageFont.truetype(str(ROOT/'public/fonts/CJK.ttf'),15)
samples=[]
for s in shots:
 first=max(0,math.ceil((s['start']-meta['sourceStart'])*meta['fps']-1e-7))
 last=min(meta['frames']-1,math.ceil((s['end']-meta['sourceStart'])*meta['fps']-1e-7)-1)
 frame=max(first,min(last,round((s['sample']-meta['sourceStart'])*meta['fps'])));path=dir/f"{s['id']}-{s['family']}.png"
 samples.append(dict(id=s['id'],family=s['family'],world=s['world'],name=s['name'],reviewName=s.get('reviewName',s['family']),sourceTime=meta['sourceStart']+frame/meta['fps'],videoFrame=frame,image=path.name,function=s['function']))
frames=sorted({s['videoFrame'] for s in samples})
select='+'.join(f'eq(n\\,{frame})' for frame in frames)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(p),'-vf',f'select={select}','-fps_mode','vfr','-frames:v',str(len(frames)),str(dir/'encoded-%03d.png')],check=True)
byframe={frame:dir/f'encoded-{i+1:03d}.png' for i,frame in enumerate(frames)}
for sample in samples:(dir/sample['image']).write_bytes(byframe[sample['videoFrame']].read_bytes())
for path in byframe.values():path.unlink()
w,h=384,216;cols=5;rows=math.ceil(len(samples)/cols);sheet=Image.new('RGB',(w*cols,(h+74)*rows+76),'#101b27');draw=ImageDraw.Draw(sheet)
draw.text((18,14),f"CI {'OPENING' if opening else 'FILM'} / ART DIRECTION REVIEW / {meta['sourceCommit'][:12]}",font=font,fill='#dce7eb')
draw.text((18,43),'Original procedural visuals · UNOFFICIAL FAN TRIBUTE · samples decoded from MP4',font=small,fill='#91a9b6')
for i,s in enumerate(samples):
 x=i%cols*w;y=76+i//cols*(h+74);sheet.paste(Image.open(dir/s['image']).convert('RGB').resize((w,h)),(x,y));draw.text((x+10,y+h+5),f"{s['id']}  {s['sourceTime']:.2f}s  {s['reviewName']}",font=small,fill='#e5eaf0');draw.text((x+10,y+h+37),s['world'],font=small,fill='#9dafbc')
contact=ROOT/'output'/('opening-contact-sheet.jpg' if opening else 'smoke-contact-sheet.jpg' if prefix=='smoke' else 'contact-sheet.jpg');sheet.save(contact,quality=96)
if prefix!='smoke':
 sheet.save(ROOT/'output/labeled-contact-sheet.jpg',quality=96)
 blind=Image.new('RGB',(w*cols,h*rows),'#000000')
 for i,s in enumerate(samples):blind.paste(Image.open(dir/s['image']).convert('RGB').resize((w,h)),(i%cols*w,i//cols*h))
 blind.save(ROOT/'output/blind-contact-sheet.jpg',quality=96)
report={**meta,'scope':'partial opening review' if opening else 'development smoke' if prefix=='smoke' else 'complete music timeline preview' if p.name=='preview.mp4' else 'full 1080p60 export','file':p.name,'audioCorrelationAtZeroOffset':corr,'fullDecode':'pass','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'shotSamples':samples,'contactSheet':contact.name,'blindContactSheet':'blind-contact-sheet.jpg' if prefix!='smoke' else None,'labeledContactSheet':'labeled-contact-sheet.jpg' if prefix!='smoke' else None,'artworkInputs':'original procedural geometry and images only','visualAcceptance':'not implied by technical verification'}
reportPath=ROOT/'output'/f'{prefix}-verification.json';reportPath.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='shotSamples'},ensure_ascii=False,indent=2))
