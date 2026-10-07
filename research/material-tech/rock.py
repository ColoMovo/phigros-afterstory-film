sky((1,.96,.85),(.14,.21,.25),.24)
rock=mat('Crushed black basalt',(.006,.008,.011),.9,bump=.8);glass=mat('Broken clear lenses',(.75,.93,1),.1,0,1);petal=mat('Thin ivory organic petals',(.6,.48,.39),.81,0,.23)
stone('Massive black suspended rock',(-2,12,8),(7,5,8),rock);stone('Foreground partial rock',(-9,-5,3),(6,7,9),rock)
parts=[]
for i in range(55):
 material=glass if i%3==0 else petal
 ob=sphere('Curved translucent debris',(rng.uniform(-10,10),rng.uniform(-12,30),rng.uniform(-1,13)),(rng.uniform(.06,.4),rng.uniform(.15,.65),.02),material,2);ob.rotation_euler=(rng.random()*2,rng.random()*2,rng.random()*3);parts.append((ob,ob.location.copy()))
light('Blown out distant exit',(4,32,14),62000,8,(1,.92,.73),(-2,12,6));light('Basalt edge',(-12,3,19),19000,6,(.35,.64,.85),(-2,12,8));fog(.004)
def animate(q):
 look((-3+q*5,-10+q*16,1+q*3),(-2,14,7),28,-.14+q*.2,7)
 for i,(ob,p) in enumerate(parts):ob.location=p+Vector((math.sin(i+q)*.4,-q*18,math.cos(i+q)*.3));ob.rotation_euler.z=i*.17+q*.4
