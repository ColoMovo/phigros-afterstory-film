sky((.015,.029,.045),(.002,.007,.02),.12)
glass=mat('Clear refractive glass',(.8,.96,1),.09,0,1);frost=mat('Frosted cut edge',(.49,.75,.84),.28,0,.82,bump=.12);metal=mat('Dark rough embedded metal',(.018,.028,.04),.65,.7);cyan=mat('Internal data light',(.01,.65,.72),.4,0,0,3)
# Three joined irregular prism skins define one sealed volume, not a glass ball.
for i,(x,y,z,size) in enumerate([(-3,0,12,(.7,5,23)),(3,1,14,(.6,4,27)),(0,2.6,16,(6,.55,30))]):
 ob=body('Fractured refractive enclosure '+str(i),(x,y,z),size,glass,.13);ob.rotation_euler[1]=(i-1)*.14
for i in range(7):
 a=i*2.4;curve('Preserved branching data',[(0,0,2),(math.cos(a)*1.2,math.sin(a),8),(math.cos(a)*2.4,math.sin(a)*2,15+i*.6)],.11,metal)
 sphere('Embedded luminous node',(math.cos(a)*2,math.sin(a),15+i*.6),(.05,.05,.05),cyan,1)
for i in range(18):
 ob=body('Cracked frost shelf',(rng.uniform(-4,4),rng.uniform(-1,4),rng.uniform(3,25)),(rng.uniform(.3,1),.07,rng.uniform(.5,2)),frost,.03);ob.rotation_euler=(rng.random(),rng.random(),rng.random())
near=body('Lens-crossing broken glass',(-9,-7,8),(2,.12,13),glass,.08);near.rotation_euler[1]=.27

for j in range(8):
 a=j/8*math.tau;curve('Branching glass memory',[(0,0,7),(math.cos(a)*1.5,math.sin(a),11),(math.cos(a)*3.2,math.sin(a)*2.2,15+j*.3)],.055,metal)
light('Bright external sky',(-9,-3,32),16000,12,(.65,.85,1),(0,0,12));light('Refracted white edge',(8,8,19),24000,9,(1,.94,.8),(0,0,12));fog(.0018,(.12,.26,.36))
def animate(q):
 look((-10+q*8,-13+q*9,4+q*9),(0,0,14),35,-.1+q*.14,8);near.location.x=-9+q*2
