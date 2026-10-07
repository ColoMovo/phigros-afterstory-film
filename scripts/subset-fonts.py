import json,pathlib
from fontTools import subset
from fontTools.ttLib import TTFont,TTCollection
root=pathlib.Path(__file__).resolve().parents[1]
chars=''.join(l['jp']+l['zh'] for l in json.loads((root/'src/data/lyrics.json').read_text()))+'濒笼悉洛時間次空終章再会'
chars+=''.join(chr(i) for i in range(32,127))+'—©→「」／…∞'
source='/usr/share/fonts/google-noto-sans-cjk-vf-fonts/NotoSansCJK-VF.ttc'
font=TTFont(source,fontNumber=0)
# Lock variable weight for reproducible static font file.
from fontTools.varLib.instancer import instantiateVariableFont
font=instantiateVariableFont(font,{'wght':400},inplace=True)
opts=subset.Options();opts.flavor='woff2';opts.name_IDs=['*'];opts.name_legacy=True
sub=subset.Subsetter(options=opts);sub.populate(text=chars);sub.subset(font);font.flavor='woff2';font.save(root/'public/fonts/CJK.woff2')
for name,src in [('Display','/usr/share/fonts/rsms-inter-fonts/InterDisplay-Bold.ttf'),('Text','/usr/share/fonts/rsms-inter-fonts/InterDisplay-Regular.ttf')]:
 font=TTFont(src);sub=subset.Subsetter(options=opts);sub.populate(text=chars);sub.subset(font);font.flavor='woff2';font.save(root/f'public/fonts/{name}.woff2')
print('Portable font subsets written')
