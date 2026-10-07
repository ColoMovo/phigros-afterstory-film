from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
from math import ceil
root=Path(__file__).resolve().parents[1]
files=sorted((root/'output/stills').glob('*.png'))
w,h=480,270; out=Image.new('RGB',(w*3,(h+38)*ceil(len(files)/3)),'#0c1116');d=ImageDraw.Draw(out)
for i,p in enumerate(files):
 im=Image.open(p).convert('RGB');im.thumbnail((w,h));x=i%3*w;y=i//3*(h+38);out.paste(im,(x,y));sec=float(p.stem);d.text((x+15,y+h+12),f'{int(sec)//60:02d}:{sec%60:04.1f}  /  AFTERSTORY',fill='#bac8d0')
out.save(root/'output/contact-sheet.jpg',quality=94)
