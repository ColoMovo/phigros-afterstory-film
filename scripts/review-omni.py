"""CI-only comparison of downloaded versioned source footage; no acceptance score."""
import os, json, subprocess, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
if os.environ.get('GITHUB_ACTIONS')!='true':
    raise RuntimeError('Formal comparison movies and contact sheets run in GitHub Actions.')
root=Path(__file__).resolve().parents[1]
spec=json.loads((root/'assets/generated-ai/omni-tests/versions.json').read_text())
out=root/'output'
out.mkdir(exist_ok=True)
clips=[next(v for v in spec['versions'] if v['id']==name) for name in spec['cameraComparison']]
assert len(clips)==4
reports=[]
for c in clips:
    p=root/c['localPath']
    if not p.is_file(): raise FileNotFoundError(f"Actual downloaded source required: {c['id']} / {p}")
    h=hashlib.sha256(p.read_bytes()).hexdigest()
    assert c.get('sha256')==h, f"Unregistered source content: {c['id']}"
    data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
    v=next(s for s in data['streams'] if s['codec_type']=='video')
    duration=float(data['format']['duration'])
    assert v['width']>=1280 and v['height']>=720 and duration>=5
    subprocess.run(['ffmpeg','-v','error','-i',str(p),'-an','-f','null','-'],check=True)
    reports.append(dict(id=c['id'],sha256=h,duration=duration,resolution=[v['width'],v['height']],codec=v['codec_name'],fullDecode='pass'))
duration=min(r['duration'] for r in reports)
args=['ffmpeg','-v','error','-y']
for c in clips: args+=['-i',str(root/c['localPath'])]
font=str(root/'public/fonts/Display.ttf')
labels=['V01 / VEO SOURCE','A / SLOW DOLLY','B / LOW SURFACE','C / 15 DEG ORBIT + DOLLY']
filters=[]
for i,label in enumerate(labels):
    filters.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=30,scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2,drawbox=x=0:y=0:w=iw:h=32:color=black@0.75:t=fill,drawtext=fontfile='{font}':text='{label}':x=12:y=9:fontsize=14:fontcolor=white[v{i}]")
filters.append('[v0][v1][v2][v3]xstack=inputs=4:layout=0_0|640_0|0_360|640_360:fill=black[v]')
target=out/'omni-camera-comparison.mp4'
args+=['-filter_complex',';'.join(filters),'-map','[v]','-an','-t',str(duration),'-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(target)]
subprocess.run(args,check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True)
sheet=Image.new('RGB',(1600,3*250),(14,17,23))
draw=ImageDraw.Draw(sheet)
textfont=ImageFont.truetype(font,14)
times=[.3,duration*.5,max(.3,duration-.4)]
for col,(c,label) in enumerate(zip(clips,labels)):
    for row,t in enumerate(times):
        frame=out/f'omni-{col}-{row}.png'
        subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(root/c['localPath']),'-frames:v','1','-vf','scale=400:225',str(frame)],check=True)
        sheet.paste(Image.open(frame).convert('RGB'),(col*400,row*250+25))
        draw.text((col*400+8,row*250+5),f'{label} / {t:.2f}s',font=textfont,fill='white')
        frame.unlink()
sheet.save(out/'omni-camera-contact-sheet.jpg',quality=94)
(out/'omni-camera-verification.json').write_text(json.dumps(dict(sourceCommit=os.environ.get('GITHUB_SHA'),sources=reports,comparisonDuration=duration,comparisonSHA256=hashlib.sha256(target.read_bytes()).hexdigest(),visualAcceptance='Pending inspection of camera path, geometry identity, timing and artifact rate; decode is not camera control proof.'),indent=2)+'\n')
print('Actual four-source comparison complete; artistic control remains a review decision.')
