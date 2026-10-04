import json,subprocess,pathlib,sys
import numpy as np
root=pathlib.Path(__file__).resolve().parents[1]
files=[root/p for p in sys.argv[1:]] or list((root/'output').glob('*.mp4'))
source=root/'public/music.mp3'
summary=json.loads((root/'src/data/audio-summary.json').read_text())
reports=[]
def pcm(p):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-vn','-ar','8000','-ac','1','-f','f32le','-']),dtype='<f4')
for path in files:
 if '-raw' in path.name or path.name.startswith('test'):continue
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
 v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
 targetfps=60 if 'celebration' in path.name else 30
 assert v['codec_name']=='h264' and a['codec_name']=='aac'
 assert v['width']==(1920 if targetfps==60 else 960) and v['height']==(1080 if targetfps==60 else 540)
 assert v['r_frame_rate']==f'{targetfps}/1'
 assert abs(float(info['format']['duration'])-summary['duration'])<1/targetfps+.025
 assert abs(float(a.get('start_time',0)))<.002 and abs(float(v.get('start_time',0)))<.002
 assert abs(float(a['duration'])-summary['duration'])<.026
 subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True)
 original=pcm(source);encoded=pcm(path);n=min(len(original),len(encoded));corr=float(np.corrcoef(original[:n],encoded[:n])[0,1]);assert corr>.98, f'Audio correlation {corr}'
 report={'file':path.name,'width':v['width'],'height':v['height'],'fps':targetfps,'videoFrames':int(v['nb_frames']),'duration':float(info['format']['duration']),'audioDuration':float(a['duration']),'sourceDuration':summary['duration'],'audioCorrelationAtZeroOffset':corr,'sourceAudioSha256':summary['sourceSha256'],'decode':'pass','audioStart':a['start_time'],'videoStart':v['start_time']}
 reports.append(report);print(json.dumps(report,indent=2))
(root/'output/verification.json').write_text(json.dumps(reports,indent=2))
