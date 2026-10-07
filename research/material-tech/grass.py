sky((1,.88,.62),(.035,.12,.16),.38)
soil=mat('Rough porous stone',(.021,.035,.024),.96,bump=.65);green=mat('Warm translucent plant fibres',(.065,.13,.024),.74,0,.12);dew=mat('Clear morning water',(.92,1,.92),.05,0,1);ruin=mat('Weathered charcoal monument',(.008,.015,.018),.9,bump=.4)
body('Terrain under the lens',(0,5,-.9),(35,50,1.8),soil,.3)
verts=[];faces=[]
for i in range(1900):
 x=rng.uniform(-16,16);y=rng.uniform(-18,27);height=rng.uniform(.25,1.5);width=rng.uniform(.016,.045);lean=rng.uniform(-.4,.4);k=len(verts)
 for j in range(5):
  q=j/4;verts.extend([(x+lean*q*q-width*(1-q),y+math.sin(q*2+i)*.12*q,q*height),(x+lean*q*q+width*(1-q),y+math.sin(q*2+i)*.12*q,q*height)])
 for j in range(4):a=k+j*2;faces.append((a,a+1,a+3,a+2))
mesh('Thousands of procedural living blades',verts,faces,green)
for i in range(28):sphere('Dew lens bead',(rng.uniform(-5,5),rng.uniform(-9,2),rng.uniform(.25,.8)),(.035,.035,.035),dew,2)
stone('Distant impossible suspended rock',(2,28,10),(8,4,5),ruin)
curve('Threshold ruin',[(-7,22,0),(-7,23,16),(4,24,21),(8,24,9)],.7,ruin)
light('Sun through the fibres',(-3,28,17),46000,4,(1,.72,.34),(0,0,0));light('Very weak camera fill',(-8,-6,4),600,9,(.45,.65,.65));fog(.0035,(.95,.8,.55))
def animate(q):look((-2+q*3,-11+q*12,.24+math.sin(q*math.pi)*.2),(0,18,2.1),24,-.04+q*.07,2.7)
