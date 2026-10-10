"""CI-only editorial package, measured from the encoded full music timeline.

Activity is mean absolute luminance difference between 10 Hz downsampled frames,
not optical flow or an artistic acceptance score. Camera motion, cuts and fades
all contribute. Audio RMS is measured from the actual encoded soundtrack.
"""
import os,sys,json,math,csv,subprocess,hashlib
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

if os.environ.get('GITHUB_ACTIONS')!='true':
 raise RuntimeError('Editorial review movies and charts must be made in GitHub Actions.')
root=Path(__file__).resolve().parents[1]
movie=root/(sys.argv[1] if len(sys.argv)>1 else 'output/revised-preview.mp4')
meta=json.loads(Path(str(movie)+'.render.json').read_text())
assert meta['sourceStart']==0 and meta['sourceEnd']>162.7
out=root/'output'
sections=[]
for name,start,end in [('first-climax-review',58.315,78.299),('farewell-review',78.299,98.076),('final-build-review',110,145),('ending-review',130,meta['sourceEnd'])]:
 target=out/(name+'.mp4')
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(movie),'-t',str(end-start),'-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','320k','-movflags','+faststart',str(target)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True)
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(target)]))
 assert abs(float(info['format']['duration'])-(end-start))<.07
 sections.append(dict(file=target.name,sourceStart=start,sourceEnd=end,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),fullDecode='pass'))

raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(movie),'-an','-vf','fps=10,scale=160:90,format=gray','-f','rawvideo','-'])
frames=np.frombuffer(raw,np.uint8).reshape(-1,90,160).astype(np.float32)/255
diff=np.mean(np.abs(np.diff(frames,axis=0)),axis=(1,2))
changed=np.mean(np.abs(np.diff(frames,axis=0))>.025,axis=(1,2))
pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(movie),'-vn','-ac','1','-ar','8000','-f','f32le','-']),dtype='<f4')
count=math.ceil(meta['sourceEnd']);records=[]
for sec in range(count):
 video=diff[sec*10:min((sec+1)*10,len(diff))];audio=pcm[sec*8000:min((sec+1)*8000,len(pcm))]
 records.append(dict(second=sec,visual_mean=float(video.mean()) if len(video) else 0,visual_peak=float(video.max()) if len(video) else 0,changed_fraction=float(changed[sec*10:min((sec+1)*10,len(changed))].mean()),audio_rms=float(np.sqrt(np.mean(audio**2))) if len(audio) else 0))
with (out/'visual-activity.csv').open('w') as f:
 writer=csv.DictWriter(f,fieldnames=records[0].keys());writer.writeheader();writer.writerows(records)
analysis=json.loads((root/'src/data/audio-analysis.json').read_text())
times=[r['second']+.5 for r in records]
fig,axes=plt.subplots(3,1,figsize=(18,8),sharex=True,gridspec_kw={'height_ratios':[2,2,1]})
fig.patch.set_facecolor('#f4f2ed')
axes[0].bar(times,[r['visual_mean']*100 for r in records],width=.84,color='#218698',label='Mean luminance change per sampled frame (%)')
axes[0].plot(times,[r['visual_peak']*100 for r in records],color='#b85b51',lw=.65,alpha=.8,label='Peak change');axes[0].set_ylabel('Visual activity (%)');axes[0].legend(loc='upper left')
axes[1].fill_between(times,[r['audio_rms'] for r in records],color='#464465',alpha=.7,label='Encoded soundtrack RMS')
for e in analysis['majorTransients']:axes[1].axvline(e['time'],color='#cb844c',alpha=.22,lw=.65)
axes[1].set_ylabel('Audio RMS');axes[1].legend(loc='upper left')
axes[2].bar(times,[r['changed_fraction']*100 for r in records],width=.84,color='#718573');axes[2].set_ylabel('Pixels changed >2.5%');axes[2].set_xlabel('Original song time (seconds)')
for ax in axes:
 ax.set_xlim(0,meta['sourceEnd']);ax.grid(axis='y',alpha=.16);ax.set_facecolor('#faf9f4')
 for begin,end in [(58.315,78.299),(113.098,135.258),(135.258,151.4)]:ax.axvspan(begin,end,color='#ecd6a1',alpha=.19)
 for boundary in [58.315,78.299,98.076,113.098,135.258,151.4]:ax.axvline(boundary,color='#555555',ls=':',lw=.7)
fig.suptitle('EDITORIAL REVIEW — actual encoded video / original song timeline',fontsize=16)
fig.text(.07,.016,'10 Hz grayscale at 160x90. Movement, cuts and exposure changes all count; this is not a perceptual quality score. Orange lines = analyzed source transients.',fontsize=9)
fig.tight_layout(rect=(0,.04,1,.97));fig.savefig(out/'visual-activity.png',dpi=150);plt.close(fig)
high=max(r['audio_rms'] for r in records)
flags=[r['second'] for r in records if 135<=r['second']<=149 and r['audio_rms']>high*.4 and r['visual_mean']<.001]
report=dict(sourceCommit=meta['sourceCommit'],movie=movie.name,sections=sections,activityMethod=__doc__,highAudioLowActivitySeconds135to149=flags,activity=records,transients=analysis['majorTransients'],visualAcceptance='Requires review of events, depth, text and music; not inferred from these metrics.')
(out/'editorial-review.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('activity','transients')},indent=2))
