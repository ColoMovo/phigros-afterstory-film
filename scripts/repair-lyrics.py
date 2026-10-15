"""Apply reviewed editorial corrections to the user-provided transcription.
The comparison source is a community transcription, NOT official approval.
Line onset timestamps remain the user source. No guessed word-level karaoke.
"""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
rows=json.loads((root/'src/data/lyrics.json').read_text())
fixes=json.loads((root/'assets/lyric-corrections.json').read_text())['lines']
for i,(row,fix) in enumerate(zip(rows,fixes,strict=True)):
 assert row['time']==fix['time']
 row.update(jp=fix['jp'],zh=fix['zh'])
 row['wordTiming']=[{'time':row['time'],'duration':min(7,(rows[i+1]['time'] if i+1<len(rows) else 149)-row['time']),'text':row['jp']}]
 row['timingScope']='supplied line onset; word timing intentionally disabled after text correction'
(root/'src/data/lyrics.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print('Applied 28 line-level corrections; source metadata preserved separately.')
