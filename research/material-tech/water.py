sky((.12,.21,.3),(.003,.012,.028),.35)
water=mat('Mirrored shallow water',(.13,.23,.3),.08,.28,.42,bump=.035);water.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.333
glass=mat('Suspended broken glass skin',(.74,.9,.97),.13,0,1);frost=mat('Frosted edges',(.43,.63,.72),.32,0,.6);black=mat('Contained branches',(.014,.025,.032),.84);glow=mat('Quiet cyan life',(.03,.42,.5),.4,0,0,2)
body('Reflection world',(0,25,-.16),(250,300,.26),water,0)
for sign in [-1,1]:
 ob=body('Glass wall',(sign*3,12,10),(.5,5,19),glass,.1);ob.rotation_euler[1]=sign*.2
body('Upper fractured glass',(0,14,18),(6,.8,1.4),frost,.15)
for i in range(6):
 a=i/6*math.tau;curve('Internal living instrument',[(0,12,2),(math.cos(a)*1.5,12+math.sin(a),7),(math.cos(a)*2,12+math.sin(a)*2,13)],.085,black)
 sphere('Interior light',(math.cos(a)*2,12+math.sin(a)*2,13),(.055,.055,.055),glow,2)

for j in range(8):
 a=j/8*math.tau;curve('Branching glass memory',[(0,12,7),(math.cos(a)*1.5,12+math.sin(a),11),(math.cos(a)*3.2,12+math.sin(a)*2.2,15+j*.3)],.055,black)
light('Water white edge',(-8,14,25),28000,10,(.7,.89,1),(0,12,8));light('Warm reflected slit',(8,25,20),24000,8,(1,.83,.57),(0,12,7));fog(.0008,(.3,.46,.6))
def animate(q):look((-8+q*10,-24+q*12,1.5+q*.5),(0,12,3.8),28,-.1+q*.15,17)
