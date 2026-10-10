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
assert len({c['sha256'] for c in clips})==4, 'Duplicate file cannot stand in for another camera variant'
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

# The initial three-world quality gate is also reviewed from real source frames.
manifest=json.loads((root/'assets/generated-ai/manifest.json').read_text())
worlds=[next(c for c in manifest['clips'] if c['id']==name) for name in ['glass-memory-v01','red-machine-v01','new-dawn-v01']]
source_sheet=Image.new('RGB',(1440,3*295),(14,17,23))
draw=ImageDraw.Draw(source_sheet)
parts=[]
for col,c in enumerate(worlds):
    p=root/c['localPath']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==c['sha256']
    subprocess.run(['ffmpeg','-v','error','-i',str(p),'-an','-f','null','-'],check=True)
    for row,t in enumerate([.3,4,7.6]):
        frame=out/f'source-{col}-{row}.png'
        subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(p),'-frames:v','1','-vf','scale=480:270',str(frame)],check=True)
        source_sheet.paste(Image.open(frame).convert('RGB'),(col*480,row*295+25))
        draw.text((col*480+8,row*295+5),f"{c['world'].upper()} / {t:.2f}s",font=textfont,fill='white')
        frame.unlink()
    part=out/f'source-{col}.mp4'
    label=c['world'].upper()
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(p),'-an','-vf',f"scale=1280:720,fps=30,drawbox=x=0:y=0:w=iw:h=40:color=black@0.75:t=fill,drawtext=fontfile='{font}':text='{label} / ORIGINAL SOURCE':x=16:y=12:fontsize=18:fontcolor=white",'-c:v','libx264','-crf','18','-pix_fmt','yuv420p',str(part)],check=True)
    parts.append(part)
source_sheet.save(out/'hybrid-source-contact-sheet.jpg',quality=94)
concat=out/'source-concat.txt'
concat.write_text(''.join(f"file '{p.name}'\n" for p in parts))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(out/'hybrid-source-review.mp4')],check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(out/'hybrid-source-review.mp4'),'-f','null','-'],check=True)
for p in parts:p.unlink()
concat.unlink()

# Independent second-round edits retain their real parent rather than replacing
# the first A/B/C test. Compare each before/after pair at the same source time.
registry={c['id']:c for c in manifest['clips']}
registry.update({c['id']:c for c in spec['versions']})
edit_reports=[]
for pair in spec.get('editComparisons',[]):
    sources=[registry[k] for k in pair['ids']]
    assert len(sources)==2
    for c in sources:
        p=root/c['localPath']
        assert hashlib.sha256(p.read_bytes()).hexdigest()==c['sha256']
        subprocess.run(['ffmpeg','-v','error','-i',str(p),'-an','-f','null','-'],check=True)
    args=['ffmpeg','-v','error','-y']
    for c in sources:args+=['-i',str(root/c['localPath'])]
    graph=[]
    for i,label in enumerate(['V01 / ORIGINAL','OMNI / EDIT']):
        graph.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=30,scale=640:360,drawbox=x=0:y=0:w=iw:h=32:color=black@0.75:t=fill,drawtext=fontfile='{font}':text='{label}':x=12:y=9:fontsize=14:fontcolor=white[p{i}]")
    graph.append('[p0][p1]hstack=inputs=2[v]')
    target=out/f"omni-edit-{pair['name']}.mp4"
    args+=['-filter_complex',';'.join(graph),'-map','[v]','-an','-t','8','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(target)]
    subprocess.run(args,check=True)
    subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True)
    sheet=Image.new('RGB',(960,4*295),(14,17,23))
    draw=ImageDraw.Draw(sheet)
    for col,c in enumerate(sources):
        for row,t in enumerate([.3,2,4,7.6]):
            frame=out/f'edit-{col}-{row}.png'
            subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(root/c['localPath']),'-frames:v','1','-vf','scale=480:270',str(frame)],check=True)
            sheet.paste(Image.open(frame).convert('RGB'),(col*480,row*295+25))
            draw.text((col*480+8,row*295+5),f"{'V01' if col==0 else 'OMNI EDIT'} / {t:.2f}s",font=textfont,fill='white')
            frame.unlink()
    sheet.save(out/f"omni-edit-{pair['name']}.jpg",quality=94)
    edit_reports.append(dict(name=pair['name'],sources=[dict(id=c['id'],sha256=c['sha256']) for c in sources],fullDecode='pass',comparisonSHA256=hashlib.sha256(target.read_bytes()).hexdigest(),visualAcceptance='Pending visual inspection; no inferred camera or rule success.'))
(out/'omni-edit-verification.json').write_text(json.dumps(dict(sourceCommit=os.environ.get('GITHUB_SHA'),comparisons=edit_reports),indent=2)+'\n')
