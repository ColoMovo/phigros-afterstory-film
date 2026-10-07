"""An impossible reflection keeps its own gravity. Camera enters the water world."""
sky((.25,.3,.38),(.015,.015,.032),.45)
ink=mat('Wet graphite architecture',(.015,.021,.032),.55,.65,bump=.13)
ivory=mat('Ivory upper civilisation',(.74,.7,.62),.48,.2)
water=mat('Thin refractive film',(.27,.42,.48),.065,.12,.95,bump=.015)
water.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.16
# An impossible, partly transparent mirror. It reflects light but reveals a
# different civilisation below; this is a designed portal, not a same-world copy.
n=water.node_tree.nodes;l=water.node_tree.links;out=n.get('Material Output');bs=n.get('Principled BSDF');clear=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.72;l.new(bs.outputs[0],mix.inputs[1]);l.new(clear.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],out.inputs['Surface'])
violet=mat('Reflected near-black ceramic',(.018,.009,.033),.82,.15)
silver=mat('Reflected frosted ribs',(.32,.3,.39),.7,.24)
white=mat('Aperture white',(.8,.94,1),.25,0,0,3)
cyan=mat('Judgement horizon',(.04,.63,.7),.25,0,0,4)
# The upper world is a single cropped, branching cantilever with weight.
for poly,y,depth in [([(-72,25),(-10,31),(-3,42),(-63,38)],38,13),
                    ([(-6,29),(40,19),(58,32),(4,43)],38,11),
                    ([(41,19),(59,20),(69,69),(50,75)],43,8)]:
 prism('Fixed impossible upper bridge',poly,y,depth,ivory)
for x in [-42,26]:
 prism('Upper counterweight',[(x-4,3),(x+4,3),(x+8,30),(x-7,39)],53,8,ink)
# A real independent three-dimensional lower world, seen through the water film.
reflected=group('The reflected world rotates independently')
for j in range(7):
 a=j/7*math.tau
 pts=[]
 for k in range(18):
  u=k/17;t=a+.8*math.sin(u*math.pi);r=8+u*19
  pts.append((math.cos(t)*r,25+u*46,-38+math.sin(t)*r))
 ob=curve('Reflected twisting rib',pts,.6 if j%2 else 1.05,silver);ob.parent=reflected
for j in range(2):
 vs=[];fs=[]
 for i in range(49):
  u=i/48;t=-.7+u*4.6+j*math.pi;r=7+u*24
  for k in range(13):
   v=k/12-.5;vs.append((math.cos(t)*r+v*8*math.sin(u*math.pi),26+u*49+v*v*12,-38+math.sin(t)*r+v*17*math.sin(u*math.pi)))
   if i<48 and k<12:a=i*13+k;fs.append((a,a+1,a+14,a+13))
 ob=mesh('Continuous folded underwater membrane',vs,fs,violet);ob.parent=reflected
 for f in ob.data.polygons:f.use_smooth=True
num=numeral('08',(21,54,-32),17,silver,.7);num.parent=reflected
numeral('時',(-12,68,-33),10,silver,.15,'CJK').parent=reflected
# Far aperture faces the approaching camera along Y, not an overhead light disc.
outline=[(math.cos(i/24*math.tau)*12,math.sin(i/24*math.tau)*12-38) for i in range(25)]
ap=curve('Far white aperture',[(x,95,z) for x,z in outline],.75,white);ap.parent=reflected
prism('White exit beyond the reflection',outline[:-1],96,.04,white).parent=reflected
for i in range(6):
 ob=prism('Broken submerged terrace',[(-38+i*12,-5),(-24+i*12,-8),(-27+i*12,-11),(-42+i*12,-7)],10+i*9,12,ink);ob.parent=reflected
body('Thin water membrane',(0,38,0),(260,190,.08),water,0)
line=body('World boundary',(0,52,.1),(240,.15,.08),cyan,0)
for i in range(17):
 sphere('Refractive boundary droplets',(rng.uniform(-45,45),rng.uniform(-4,60),.25),(.2,.35,.11),water,2)
near=prism('Close dark edge',[(-51,-8),(-20,-5),(-23,-2),(-54,-1)],-8,15,ink)
dust('Below the horizon',(0,41,-38),(31,43,22),260,silver,.1).parent=reflected
light('Upper amber soft backlight',(-35,68,68),200000,35,(1,.82,.58),(0,37,12))
light('Underwater violet rim',(27,65,-39),210000,13,(.26,.035,1),(0,39,-22))
light('Magenta scattering inside reflection',(-22,12,-42),130000,19,(1,.04,.34),(0,52,-34))
light('Cold near reflection',(-30,-14,29),76000,35,(.52,.78,1),(0,35,-8));fog(.0006,(.16,.19,.29))
volume_box('The reflection has violet air',(0,55,-43),(175,230,80),.0045,(.19,.035,.42))
s.camera.data.dof.use_dof=False
def animate(q):
 turn=ease((q-.32)/.30);dive=ease((q-.66)/.34)
 angle=turn*math.pi/2;reflected.rotation_euler[1]=angle;reflected.location=(38*math.sin(angle),0,-38+38*math.cos(angle));line.rotation_euler[1]=angle
 ramp=s.world.node_tree.nodes.get('Color Ramp');ramp.color_ramp.elements[0].color=(.25-dive*.22,.3-dive*.287,.38-dive*.29,1)
 forward=ease((q-.76)/.24)
 look((-10+q*8,-35+q*29+forward*86,12-dive*41),(0,120,10-dive*48),23,dive*.28)
