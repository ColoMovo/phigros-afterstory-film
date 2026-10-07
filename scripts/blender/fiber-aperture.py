"""Coherent organic fibres lock into a five-bladed mechanical throat."""
sky((.018,.035,.045),(.001,.004,.009),.2)
black=mat('Dark fibrous metal',(.013,.022,.029),.61,.72,bump=.16)
glass=mat('Smoke glass nerve',(.22,.43,.46),.26,.12,.75)
soft=mat('Soft translucent aperture membrane',(.19,.3,.3),.73,.05,.35)
silver=mat('Brushed fibre edge',(.17,.26,.28),.43,.7)
cyan=mat('Sparse data nervous system',(.01,.48,.62),.28,0,0,3)
white=mat('White escape aperture',(.85,.96,1),.2,0,0,4)
# A coherent funnel, organised into thick primary tendons and many fine strands.
for j in range(270):
 a=j/270*math.tau;band=j%5;pts=[]
 for k in range(7):
  u=k/6;y=-35+u*150;r=25+7*math.cos(u*math.pi*2)+band*.65
  t=a+u*.72+.04*math.sin(j*.7+u*4)
  pts.append((math.cos(t)*r,y,18+math.sin(t)*r))
 material=cyan if j%41==0 else glass if j%7==0 else silver if j%11==0 else black
 curve('Coherent tapering fibre',pts,.065+(j%9)*.032,material)
for j in range(7):
 a=j/7*math.tau
 curve('Primary tendon',[(math.cos(a)*34,-30,18+math.sin(a)*34),(math.cos(a+.2)*29,28,18+math.sin(a+.2)*29),(math.cos(a+.5)*22,84,18+math.sin(a+.5)*22)],1.1,black)
for j in range(11):
 a=j*2.4;ob=petal('Soft tissue between mechanical fibres',(math.cos(a)*27,16+j*6,18+math.sin(a)*27),14,soft,a)
blades=[]
# Five individually modelled wedge petals. Not a stack of tori.
for j in range(5):
 root=group('Iris blade hinge');root.location=(0,35,18);root.rotation_euler[1]=j/5*math.tau
 ob=prism('Mechanical petal',[(5,-2),(12,-5),(30,2),(26,17),(10,18),(4,8)],0,3.8,black);ob.parent=root
 edge=curve('Blade edge',[(4,-2,8),(10,-2,18),(26,-2,17)],.13,silver);edge.parent=root
 blades.append(root)
pts=[(math.cos(i/36*math.tau)*19,119,18+math.sin(i/36*math.tau)*19) for i in range(37)]
curve('Far aperture',pts,.65,white)
prism('Aperture luminous plane',[(-18,0),(18,0),(18,36),(-18,36)],123,.1,white)
for j in range(6):
 ob=numeral(f'{j+1:02}',(math.cos(j)*24,67+j*6,18+math.sin(j)*23),6,silver,.15)
 ob.rotation_euler[1]=j*.15
cut=body('Near judgement slash',(0,-3,18),(68,.11,.06),cyan,0)
dust('Fine captured fragments',(0,45,18),(29,72,29),460,silver,.07)
light('Aperture backlight',(0,102,18),260000,22,(.66,.94,1),(0,25,18))
light('Lateral rough-metal catch',(-31,-12,50),155000,25,(.35,.66,.74),(0,32,18))
light('Secondary blade rake',(31,16,8),84000,18,(.53,.72,.76),(0,35,18));fog(.0012,(.15,.27,.29))
light('White destination flare',(0,124,18),200000,13,(.82,1,1),(0,90,18))
s.camera.data.dof.aperture_fstop=10
def animate(q):
 opened=ease((q-.10)/.35);rush=ease((q-.48)/.52)
 for j,root in enumerate(blades):
  a=j/5*math.tau;root.location=(math.cos(a)*opened*13,35+opened*6,18+math.sin(a)*opened*13);root.rotation_euler[1]=a+opened*.38
 look((-5+q*7,-25+q*24+rush*82,17+math.sin(q*math.pi)*3),(0,127,18),27,-.07+opened*.15-rush*.12,45)
 cut.rotation_euler[1]=opened*.20
