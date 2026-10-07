"""A floating continent is a spatial wipe; a number civilisation is revealed."""
sky((.22,.54,.8),(.035,.12,.28),.6)
rock=mat('Weathered navy relic surface',(.014,.025,.039),.89,.17,bump=.62)
white=mat('Far pale ceramic architecture',(.63,.76,.81),.69,.15)
monument=mat('Far blue slate civilisation',(.10,.24,.36),.72,.3)
glass=mat('Inlaid smoky fracture glass',(.19,.39,.5),.3,.1,.62)
cyan=mat('Embedded fracture data',(.01,.65,.73),.35,0,0,3)
gold=mat('Warm rim alloy',(.41,.29,.12),.52,.6)
# The negative gap is designed first: slab stays on the left, sky and 08 on right.
foreground=prism('Continent foreground cross-section',[(-78,-28),(-4,-22),(-2,4),(-10,12),(-7,39),(-23,65),(-72,53)],2,17,rock)
foreground.location.x=12
for i in range(13):
 z=-11+i*5;curve('Cyan fracture scar',[(-33, -7,z),(-12,-7.2,z+2),(3,-7.5,z+1)],.045,cyan)
for i in range(6):
 z=6+i*8;prism('Embedded glass scale',[(-8,z),(2,z+3),(4,z+7),(-6,z+5)],-6.8,.12,glass)
curve('Eroded bright edge',[(10,-7,-16),(10,-7,3),(2,-7,12),(5,-7,39),(-11,-7,65)],.18,gold)
# Secondary planes and an engineered number monument, not a stone sitting alone.
num=numeral('08',(34,82,-1),43,monument,2.8)
numeral('09',(42,174,-8),76,monument,4)
numeral('01',(-48,235,-10),91,white,5)
for j in range(9):
 x=(-1 if j%2 else 1)*(39+j*2);y=95+j*14
 prism('Numeric civilisation buttress',[(x-4,-19),(x+5,-19),(x+2,63),(x-5,76)],y,5,rock)
 curve('Buttress embedded data',[(x-3,y-3,-12),(x-3,y-3,40),(x+2,y-3,50)],.055,cyan)
for i,(x,y,z,r) in enumerate([(18,45,-8,12),(46,70,-18,20),(-35,125,-12,27)]):
 poly=[(x-r,z),(x+r*.7,z+2),(x+r,z-5),(x-r*.5,z-r*.5)]
 prism('Unequal floating terrace',poly,y,r,rock)
 body('Terrace pale lip',(x,y-r*.5,z+.5),(r*1.6,.4,.5),white,.04)
curve('Distant impossible beam',[(-65,160,50),(-15,161,77),(58,164,82),(99,164,67)],.7,white)
body('Sky judgement line',(20,145,27),(290,.12,.06),cyan,0)
dust('Surface abrasion fragments',(0,12,20),(26,23,27),210,white,.10)
wipe=prism('Occluding continent return',[(-9,-28),(18,-18),(18,70),(-13,83),(-26,23)],-15,8,rock)
light('Sky rim',(20,43,72),330000,28,(.57,.82,1),(-13,2,25))
light('Front weathered surface',(-39,-30,40),27000,35,(.45,.58,.7),(-20,0,25))
light('Thin warm edge',(7,25,19),29000,10,(1,.79,.5),(-6,1,15));fog(.00035,(.42,.63,.74))
s.camera.data.dof.aperture_fstop=12
def animate(q):
 occlude=ease((q-.60)/.32);wipe.location.x=76-occlude*79
 rush=ease((q-.42)/.46)
 # The first 0 becomes a room and then an opening, rather than a remote label.
 look((-5+q*14+rush*8,-29+q*12+rush*110,8+q*5+rush*11),(19,154,24),25,-.08+q*.08,40)
 wipe.location.y=rush*115
