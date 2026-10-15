import json,pathlib
from fontTools import subset
from fontTools.ttLib import TTFont,TTCollection
root=pathlib.Path(__file__).resolve().parents[1]
chars=''.join(l['jp']+l['zh'] for l in json.loads((root/'src/data/lyrics.json').read_text()))+'濒笼悉洛時間次空終章再会'
# Keep every glyph used by the visible end-card credit in the portable subset.
# This is deliberately explicit because the in-game credit is independent of
# the lyric corpus and missing glyphs silently become blank boxes in Canvas.
chars+='What do you want more than a Happy ending？Apollo “HALO” program ft. 安月名莉子 × 大瀬良あい'
chars+=''.join(chr(i) for i in range(32,127))+'—©→「」／…∞'
source='/usr/share/fonts/google-noto-sans-cjk-vf-fonts/NotoSansCJK-VF.ttc'
font=TTFont(source,fontNumber=0)
# Lock variable weight for reproducible static font file.
from fontTools.varLib.instancer import instantiateVariableFont
opts=subset.Options();opts.flavor='woff2';opts.name_IDs=['*'];opts.name_legacy=True
sub=subset.Subsetter(options=opts);sub.populate(text=chars);sub.subset(font)
# Subset before instancing the large variable CJK collection.
font=instantiateVariableFont(font,{'wght':400},inplace=True)
font.flavor='woff2';font.save(root/'public/fonts/CJK.woff2')
font.flavor=None;font.save(root/'public/fonts/CJK.ttf')
for name,src in [('Display','/usr/share/fonts/rsms-inter-fonts/InterDisplay-Bold.ttf'),('Text','/usr/share/fonts/rsms-inter-fonts/InterDisplay-Regular.ttf')]:
 font=TTFont(src);sub=subset.Subsetter(options=opts);sub.populate(text=chars);sub.subset(font);font.flavor='woff2';font.save(root/f'public/fonts/{name}.woff2')
print('Portable font subsets written')
