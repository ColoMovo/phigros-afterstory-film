"""Assemble independently rendered absolute frame ranges in CI, never interpolate missing frames."""
import os,json,pathlib,subprocess,hashlib,shutil,math
from PIL import Image
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('Formal assembly requires GitHub Actions')
root=pathlib.Path(__file__).resolve().parents[1]
incoming=root/'.render/incoming';output=root/'public/physical';output.mkdir(parents=True,exist_ok=True)
profile=os.environ['PHYSICAL_PROFILE'];ids=json.loads(os.environ['PHYSICAL_SHOTS']);parts=int(os.environ.get('PHYSICAL_CHUNKS','4'))
for shot in ids:
 config=json.loads((root/f'scripts/blender/settings/{shot}.json').read_text());frames=math.ceil(config['duration']*config['fps']);width=min(config['width'],960) if profile=='preview' else config['width']
 fingerprint=hashlib.sha256((root/'scripts/blender/physical-common.py').read_bytes()+(root/f'scripts/blender/{shot}.py').read_bytes()+(root/f'scripts/blender/settings/{shot}.json').read_bytes()+profile.encode()).hexdigest()
 directory=root/'.render/assembled'/shot;directory.mkdir(parents=True,exist_ok=True);seen=set();metadata=None
 for part in range(parts):
  folders=list(incoming.glob(f'physical-frames-{shot}-{profile}-{part}-*'))
  if len(folders)!=1:raise RuntimeError(f'Expected one frame artifact for {shot} chunk {part}, got {len(folders)}')
  folder=folders[0];m=json.loads((folder/'render.json').read_text());start=frames*part//parts;end=frames*(part+1)//parts
  expected=dict(fingerprint=fingerprint,frames=frames,width=width,fps=config['fps'],profile=profile,engine='CYCLES',samples=8 if profile=='preview' else 16,startFrame=start,endFrame=end,chunk=part,chunks=parts)
  for k,v in expected.items():
   if m.get(k)!=v:raise RuntimeError(f'Mismatched {shot} chunk {part}: {k}')
  actual={int(p.stem) for p in folder.glob('*.png')}
  if actual!=set(range(start,end)):raise RuntimeError(f'Missing or extra frames in {shot} chunk {part}')
  for n in sorted(actual):
   if n in seen:raise RuntimeError(f'Duplicate frame {shot} {n}')
   p=folder/f'{n:05d}.png'
   with Image.open(p) as im:
    if im.size!=(width,round(width*9/16)):raise RuntimeError(f'Wrong PNG dimensions {shot} {n}')
    im.verify()
   p.replace(directory/p.name);seen.add(n)
  if part==0:shutil.copy2(folder/f'{shot}.blend',output/f'{shot}.blend');metadata=m
 if seen!=set(range(frames)):raise RuntimeError(f'Incomplete assembled sequence {shot}')
 file=output/f'{shot}.mp4'
 subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(config['fps']),'-i',str(directory/'%05d.png'),'-frames:v',str(frames),'-c:v','libx264','-crf','16','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(file)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
 metadata.update(startFrame=0,endFrame=frames,chunk=None,assembledChunks=parts,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),sourceCommit=os.environ['GITHUB_SHA'])
 file.with_suffix('.render.json').write_text(json.dumps(metadata,indent=2)+'\n')
 for p in directory.glob('*.png'):p.unlink()
 directory.rmdir();print(f'Assembled and decoded {shot}: {frames} frames, {width}px, {profile}',flush=True)
