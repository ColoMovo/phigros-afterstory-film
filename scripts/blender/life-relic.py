"""Centimetres of life against a vast hollow relic; not a lawn scene."""
sky((.24,.42,.48),(.84,.67,.43),.19)
black=mat('Rough deep-green relic',(.012,.024,.025),.85,.28,bump=.25)
green=mat('Near-black living geometry',(.005,.017,.008),.86,.0,.0)
green.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.17
ivory=mat('Pale relic edge',(.5,.61,.62),.74,.15)
gold=mat('Dawn filament rims',(.45,.32,.14),.4,.6,0,.6)
cyan=mat('Internal relic activation',(.02,.56,.66),.34,0,0,4)
water=mat('Thin dawn film',(.12,.24,.28),.1,.38,.35,bump=.02)
# A single giant, asymmetric negative-space obelisk above a physical cracked deck.
pieces=[([(-34,88),(-7,83),(-7,62),(-16,43),(-28,65)],72,9),
        ([(5,80),(31,74),(35,66),(9,19),(3,46),(12,66)],77,11),
        ([(-7,63),(6,65),(0,16),(-8,30),(-12,49)],73,10)]
relic=[]
for poly,y,d in pieces:relic.append(prism('Broken obelisk architecture',poly,y,d,black))
curve('Cyan internal fissure',[(-7,66,82),(-7,66,62),(-12,66,49),(-8,66,30),(0,66,16)],.17,cyan)
curve('Second internal fissure',[(5,70,80),(12,70,66),(3,70,46),(9,70,19)],.12,cyan)
for i in range(8):
 x=rng.uniform(-30,25);z=rng.uniform(-2,3)
 prism('Cracked platform',[(x-8,z),(x+7,z),(x+8,z-2),(x-6,z-4)],5+i*8,10,black)
body('Very shallow water film',(0,35,-.05),(160,160,.08),water,0)
# Only a handful of near fibres. Their scale is exaggerated by the low camera.
fibres=[]
attached=[]
for j,(x,y,h) in enumerate([(-7,-9,7),(-2,-3,4),(6,1,3.5),(10,10,5),(-12,14,6),(3,18,4)]):
 pts=[(x,y,.1),(x-.5,y+.3,h*.45),(x+1.4,y+.8,h)];ob=curve('Near living fibre',pts,.11 if j else .22,green);fibres.append(ob)
 curve('Fine warm living rim',[(a+.12,b-.08,c) for a,b,c in pts],.018,gold)
 # A curved leaf is a tapered designed surface, not one straight grass triangle.
 vs=[];fs=[]
 for k in range(9):
  u=k/8;w=math.sin(u*math.pi)*(1 if j else 1.8);xx=x+1.4*u*u;yy=y+.8*u;zz=h*.4+h*.6*u
  vs.extend([(xx-w,yy+.22*u,zz),(xx+w,yy-.22*u,zz)])
 for k in range(8):a=k*2;fs.append((a,a+1,a+3,a+2))
 ob=mesh('Near living leaf',vs,fs,green);fibres.append(ob)
# Growth penetrates and binds the artificial relic. It is not ground decoration.
for j in range(6):
 x=-18+j*6;pts=[(x,65,18),(x+math.sin(j)*8,65,40),(x-4,67,62),(x+7,68,80)]
 curve('Life woven through the relic',pts,.19,green)
 for k,z in enumerate([33,49,65]):
  ob=petal('Leaf piercing the relic',(x+math.sin(j)*8,64,z),8+k,green,(-1 if j%2 else 1)*.8);attached.append((ob,ob.scale.copy(),j))
closeleaf=petal('Close airborne living leaf',(13,-20,11),10,green,-.4)
for i,(x,y,h) in enumerate([(-46,132,87),(61,154,114)]):
 prism('Relic in atmospheric distance',[(x-4,-6),(x+7,-6),(x+2,h),(x-14,h-16)],y,5,ivory)
body('Impossible judgement horizon',(0,138,34),(280,.12,.065),cyan,0)
numeral('01',(38,90,0),19,ivory,.7)
dust('Dawn air data',(0,24,6),(37,47,7),170,gold,.055)
light('Dawn backlight',(-22,76,44),370000,11,(1,.72,.39),(0,18,4))
light('Cold counter rim',(37,89,70),180000,12,(.58,.81,1),(0,67,48))
# A distant luminous breach is a compositional mass: it remains behind the
# hanging relic, while foreground life stays in deep shadow with a warm rim.
dawn=mat('Far dawn opening',(1,.86,.57),.8,0,0,5)
prism('Dawn through a broken horizon',[(20,4),(89,4),(89,98),(54,95),(37,66)],186,.15,dawn)
light('Weak near living edge',(-5,-13,9),430,5,(.87,.8,.57),(0,2,3));fog(.00055,(.36,.47,.53))
s.camera.data.dof.aperture_fstop=9
def animate(q):
 rise=ease((q-.18)/.64);split=ease((q-.48)/.38)
 relic[1].location=(split*5,split*2,split*3)
 for ob,scale,j in attached:ob.scale=scale*(.6+ease((q-.1)/.55)*.4);ob.rotation_euler[1]=(-1 if j%2 else 1)*(.8+q*.15)
 closeleaf.location.x=13-ease((q-.12)/.25)*46;closeleaf.location.y=-20+q*8
 look((-3+q*7,-36+q*21,1.1+rise*4.5),(0,74,33+rise*6),22,-.025+q*.035,72)
