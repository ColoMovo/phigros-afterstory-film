"""A hollow glass monument is cut into two time domains. Original architecture."""
sky((.025,.055,.12),(.002,.006,.018),.22)
glass=mat('Blue frosted architectural glass',(.28,.57,.67),.22,.08,.68,bump=.06)
ivory=mat('Ceramic fracture edge',(.65,.78,.8),.52,.12)
black=mat('Rough structural graphite',(.012,.021,.03),.73,.65,bump=.28)
silver=mat('Brushed spine',(.12,.2,.25),.42,.72,bump=.1)
cyan=mat('Time fault — energy not paint',(.015,.7,.8),.28,0,0,5)
tissue=mat('Soft translucent memory petals',(.39,.32,.28),.76,0,.2)
rock=mat('Weathered trapped inclusions',(.008,.014,.019),.93,.1,bump=.65)
upper=group('Upper domain remains frozen');lower=group('Lower domain drifts away');moving=[]
# One recognisable hollow, lopsided silhouette. Its lower section opens a gap.
for name,poly,parent in [
 ('Left high shoulder',[(-24,25),(-25,48),(-4,66),(-5,56),(-16,43),(-15,25)],upper),
 ('Right high shoulder',[(-4,66),(18,51),(21,25),(13,25),(10,46),(-5,56)],upper),
 ('Left foundation',[(-24,25),(-15,25),(-10,3),(-20,-2)],lower),
 ('Right foundation',[(13,25),(21,25),(25,-2),(12,3)],lower),
 ('Broken lower bridge',[(-20,-2),(-10,3),(12,3),(25,-2),(4,-6)],lower)]:
 ob=prism(name,poly,20,5,glass);ob.parent=parent
 # Thin solid edge gives refractive pieces weight and preserves the silhouette.
 outline=[(x,17.3,z) for x,z in poly];edge=curve(name+' ceramic lip',outline,.19,ivory);edge.parent=parent
# A dark spine is visible inside the translucent monument, not a second centre.
for a in [-2.1,-1.1,.2,1.1,2.2]:
 points=[(0,21,2),(math.sin(a)*3,21,13),(math.sin(a)*8,21,25),(math.sin(a)*11,21,36)]
 curve('Branched embedded armature',points,.23,black)
 curve('Internal light fibre',[(x+.3,y-.3,z) for x,y,z in points],.035,cyan)
for i in range(7):
 z=7+i*5;ob=prism('Suspended rib',[(5,z),(12,z+3),(15,z+2),(7,z-1)],20+rng.uniform(-4,4),.65,silver)
 moving.append((ob,ob.location.copy(),i))
for j in range(17):
 a=j*2.4;x=math.cos(a)*(3+j*.5);z=9+j*2.5
 ob=petal('Soft tissue inside the glass',(x,21+rng.uniform(-3,5),z),2+j%4,tissue,a);moving.append((ob,ob.location.copy(),j+7))
for pos,size in [((-18,20,39),(1.3,.5,3)),((15,20,16),(1.8,.5,4)),((-6,21,61),(2,.5,1.1))]:stone('Rough trapped inclusion',pos,size,rock)
closepetal=petal('Lens-grazing soft membrane',(15,-14,20),15,tissue,-.3)
for i in range(12):
 x=rng.uniform(-29,29);y=rng.uniform(4,56);z=rng.uniform(-8,4)
 ob=prism('Broken stepped deck',[(x-7,z),(x+4,z+1),(x+8,z-1),(x-3,z-3)],y,rng.uniform(4,12),black)
 ob.rotation_euler[1]=rng.uniform(-.12,.12)
# Secondary and background anchors, uneven distribution rather than ring spam.
numeral('04',(35,70,4),32,ivory,1.2)
numeral('空',(-3,22,32),9,silver,.12,'CJK').parent=upper
for i,(x,y,h) in enumerate([(-60,90,78),(62,115,110),(4,145,95)]):
 prism('Far relic fin',[(x-4,-15),(x+6,-15),(x+3,h),(x-7,h-12)],y,3,ivory)
near=prism('Close cropped buttress',[(-34,-15),(-23,-15),(-17,68),(-25,82),(-38,55)],-6,8,black)
cut=body('Judgement time boundary',(0,15,25),(90,.12,.065),cyan,0)
particles=dust('Suspended memory dust',(0,23,26),(38,40,25),360,ivory,.1)
for i in range(7):
 ob=prism('Near refractive splinter',[(rng.uniform(-25,25),2),(rng.uniform(-25,25),12),(rng.uniform(-25,25),18)],rng.uniform(-3,12),.16,glass)
light('Cold lateral refraction',(-42,-2,55),48000,28,(.44,.75,1),(0,20,24))
light('White edge behind aperture',(19,65,56),310000,10,(.88,.96,1),(0,20,25))
light('Low warm ceramic catch',(31,-9,8),18000,15,(1,.81,.57),(0,20,22));fog(.0008,(.12,.22,.37))
s.camera.data.dof.aperture_fstop=10
def animate(q):
 split=ease((q-.30)/.28);travel=ease((q-.60)/.4)
 lower.location=(split*7,split*2,-split*6);cut.scale.x=.03+split*.97
 for ob,p,i in moving:ob.location=p+Vector((split*(i-3)*.7,-split*3,split*(i%2)*2))
 particles.location.y=-q*5
 closepetal.location.x=15-ease((q-.15)/.2)*45
 look((-22+q*20+travel*4,-63+q*60+travel*30,9+q*13),(0,29+travel*24,31),26,-.06+split*.07-travel*.15,50)
