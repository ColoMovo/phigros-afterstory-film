#!/usr/bin/env bash
set -euo pipefail
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo 'Formal physical asset renders require GitHub Actions.' >&2
  exit 1
fi
shot_id="$1"
"${BLENDER_PATH}" -b --factory-startup --python scripts/blender/physical-common.py -- --shot "$shot_id" --profile "${PHYSICAL_PROFILE:-final}"
python3 - "$shot_id" <<'PY'
import json,subprocess,pathlib,sys,hashlib
shot=sys.argv[1];directory=pathlib.Path('public/physical')/shot;m=json.loads((directory/'render.json').read_text());output=pathlib.Path('public/physical')/(shot+'.mp4')
subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(m['fps']),'-i',str(directory/'%05d.png'),'-frames:v',str(m['frames']),'-c:v','libx264','-crf','16','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(output),'-f','null','-'],check=True)
m['sha256']=hashlib.sha256(output.read_bytes()).hexdigest();(output.with_suffix('.render.json')).write_text(json.dumps(m,indent=2)+'\n')
for p in directory.glob('*.png'):p.unlink()
(directory/(shot+'.blend')).replace(pathlib.Path('public/physical')/(shot+'.blend'))
(directory/'render.json').unlink();directory.rmdir()
print(json.dumps(m,indent=2))
PY
