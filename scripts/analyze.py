"""Extract exact embedded LRC/AWLRC; deterministic 60 Hz spectral controls."""
import base64, json, re, subprocess, pathlib, hashlib
import numpy as np
from mutagen.mp3 import MP3
ROOT=pathlib.Path(__file__).resolve().parents[1]
mp3=ROOT/'public/music.mp3'
meta=MP3(mp3)
raw='\n'.join(f.text for f in meta.tags.getall('USLT'))
assert raw, 'No USLT lyrics in source audio'
blocks={k:base64.b64decode(v).decode('utf-8') for k,v in re.findall(r'(lrc|tlrc|awlrc):([A-Za-z0-9+/=]{20,})',raw)}
pat=r'\[(\d+):(\d+\.\d+)\](.*)'
def rows(s):
 return [(round(int(m)*60+float(sec),3),txt.strip()) for m,sec,txt in re.findall(pat,s)]
jp=rows(blocks.get('lrc',raw.split('\n\n')[0])); zh=dict(rows(blocks.get('tlrc','')))
words=dict(rows(blocks.get('awlrc','')))
lyrics=[]
for t,text in jp:
 w=[{'time':round(t+int(a)/1000,3),'duration':int(d)/1000,'text':c} for a,d,c in re.findall(r'<(\d+),(\d+)>([^<]+)',words.get(t,''))]
 lyrics.append({'time':t,'jp':text,'zh':zh.get(t,''),'wordTiming':w})
(ROOT/'src/data/lyrics.json').write_text(json.dumps(lyrics,ensure_ascii=False,indent=2))
# Decode sample-exact; MP3 container duration includes encoder padding.
pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(mp3),'-f','f32le','-ac','1','-ar','22050','-'])
y=np.frombuffer(pcm,dtype='<f4'); sr=22050; duration=len(y)/sr; rate=60
nfft=2048; win=np.hanning(nfft); freq=np.fft.rfftfreq(nfft,1/sr)
features=[]; last=np.zeros(nfft//2+1)
for i in range(int(np.ceil(duration*rate))):
 start=round(i*sr/rate); a=y[start:start+nfft]; a=np.pad(a,(0,nfft-len(a)))
 spec=np.abs(np.fft.rfft(a*win)); energy=spec**2
 rms=float(np.sqrt(np.mean(a*a))); flux=float(np.maximum(spec-last,0).sum()); last=spec
 bands=[float(np.sqrt(energy[(freq>=lo)&(freq<hi)].mean())) for lo,hi in [(25,220),(220,2600),(2600,10000)]]
 octaves=[float(np.sqrt(energy[(freq>=lo)&(freq<hi)].mean())) for lo,hi in zip([25,60,150,400,1000,2500,6000],[60,150,400,1000,2500,6000,11025])]
 features.append([rms,flux,*bands,*octaves])
x=np.array(features); norms=np.percentile(x,96,axis=0); z=np.clip(x/np.maximum(norms,1e-7),0,1)
peaks=[]
for i in range(3,len(z)-3):
 if z[i,1]>.30 and x[i,1]==max(x[i-3:i+4,1]) and (not peaks or i/rate-peaks[-1]['time']>.16):
  peaks.append({'time':round(i/rate,4),'strength':round(float(z[i,1]),4)})
major=[p for p in peaks if p['strength']>.82]
sections=[(0,'boot'),(5.321,'dawn'),(19.851,'archive'),(33.840,'next'),(58.315,'ascent'),(78.299,'separation'),(98.076,'reconnect'),(113.098,'convergence'),(132.997,'threshold'),(135.258,'reveal'),(142.383,'afterstory')]
regions=[]
for a,(t,name) in enumerate(sections):
 end=sections[a+1][0] if a+1<len(sections) else duration
 seg=x[int(t*rate):int(end*rate)]
 regions.append({'time':t,'end':end,'name':name,'rms':round(float(seg[:,0].mean()),5),'anchorSource':'user director anchors / embedded lyrics'})
low=[]; active=None
for i,v in enumerate(z[:,0]):
 if v<.18 and active is None: active=i/rate
 if v>=.18 and active is not None:
  if i/rate-active>.4: low.append({'time':round(active,3),'end':round(i/rate,3)})
  active=None
if active is not None: low.append({'time':round(active,3),'end':duration})
info={'duration':duration,'containerDuration':meta.info.length,'sampleRate':sr,'featureRate':rate,'columns':['rms','onset','bass','mid','high','s25_60','s60_150','s150_400','s400_1000','s1000_2500','s2500_6000','s6000_11025'],'normalization':'per-band 96th percentile, clipped 0..1','frames':np.round(z,4).tolist(),'beatCandidates':peaks,'majorTransients':major,'lowEnergyRegions':low,'sections':regions,'sourceSha256':hashlib.sha256(mp3.read_bytes()).hexdigest(),'notes':['Beat candidates are spectral-flux peaks, not a guaranteed beat grid.','AWLRC retained verbatim from metadata; source spelling has not been corrected.','Build/drop direction follows provided anchors, spectral values are measured.']}
(ROOT/'src/data/audio-analysis.json').write_text(json.dumps(info,separators=(',',':')))
(ROOT/'src/data/audio-summary.json').write_text(json.dumps({k:v for k,v in info.items() if k!='frames'},indent=2))
(ROOT/'assets/lyrics-original.txt').write_text(raw)
print(json.dumps({'decodedDuration':duration,'containerDuration':meta.info.length,'lyricLines':len(lyrics),'wordTokens':sum(len(l['wordTiming']) for l in lyrics),'featureFrames':len(z),'onsets':len(peaks),'majorTransients':len(major)},indent=2))
