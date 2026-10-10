"""Three original composition stills for the Flow quality gate, not movie renders.
Run with Blender 4.5: blender -b --python scripts/blender/hybrid-previs.py
The scenes, cameras and .blend sources are saved alongside each single PNG.
"""
import bpy,math,random,pathlib,json
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/generated-ai/references';OUT.mkdir(parents=True,exist_ok=True)

def material(name,color,rough=.7,metal=0,trans=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;b.inputs['Transmission Weight'].default_value=trans;b.inputs['IOR'].default_value=1.46;b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emit;return m
def mesh(name,verts,faces,mat):
 g=bpy.data.meshes.new(name);g.from_pydata(verts,[],faces);g.update();o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return o
def ribbon(name,at,mat,n=80,m=6,thick=.12):
 verts=[at(i/n,j/m-.5) for i in range(n+1) for j in range(m+1)];faces=[(i*(m+1)+j,i*(m+1)+j+1,(i+1)*(m+1)+j+1,(i+1)*(m+1)+j) for i in range(n) for j in range(m)];o=mesh(name,verts,faces,mat);sol=o.modifiers.new('Physical edge','SOLIDIFY');sol.thickness=thick
 for p in o.data.polygons:p.use_smooth=True
 return o
def cable(name,points,radius,mat):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=2;s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for b,p in zip(s.bezier_points,points):b.co=p;b.handle_left_type=b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);c.materials.append(mat);return o
def shard(name,pos,size,mat,seed):
 rng=random.Random(seed);outline=[(-.65,-.95),(-.48,.7),(.04,1),(.55,.45),(.3,-.4),(-.2,-.8)];verts=[(x*size,d,z*size) for d in [-size*.06,size*.06] for x,z in outline];n=len(outline);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)];o=mesh(name,verts,faces,mat);o.location=pos;o.rotation_euler=(rng.uniform(-.3,.3),rng.uniform(-.3,.3),rng.uniform(-.5,.5));b=o.modifiers.new('Small chipped edge','BEVEL');b.width=.045;b.segments=2;return o
def light(name,pos,power,color,size,target):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def reset(bg,position,target,lens):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=True;s.cycles.max_bounces=6;s.cycles.transmission_bounces=4;s.cycles.volume_bounces=1;s.render.resolution_x=1920;s.render.resolution_y=1080;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=0
 w=bpy.data.worlds.new('Original atmosphere');w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(*bg,1);w.node_tree.nodes['Background'].inputs['Strength'].default_value=.3;s.world=w
 d=bpy.data.cameras.new('Locked composition anchor');o=bpy.data.objects.new('Locked composition anchor',d);bpy.context.collection.objects.link(o);o.location=position;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();d.lens=lens;d.clip_end=2000;s.camera=o
 return s
def atmosphere(density,color):
 m=bpy.data.materials.new('Depth atmosphere');m.use_nodes=True;n=m.node_tree.nodes;n.clear();a=n.new('ShaderNodeOutputMaterial');v=n.new('ShaderNodeVolumePrincipled');v.inputs['Density'].default_value=density;v.inputs['Color'].default_value=(*color,1);v.inputs['Anisotropy'].default_value=.5;m.node_tree.links.new(v.outputs['Volume'],a.inputs['Volume']);bpy.ops.mesh.primitive_cube_add(size=1,location=(0,45,15));o=bpy.context.object;o.name='Air volume';o.scale=(130,160,100);o.data.materials.append(m)
def save(name,s,camera):
 s.render.filepath=str(OUT/(name+'.png'));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(name+'.blend')));bpy.ops.render.render(write_still=True);(OUT/(name+'.json')).write_text(json.dumps(dict(world=name,origin='Original Blender composition anchor',camera=camera,text='No readable text; added in Remotion',resolution=[1920,1080]),indent=2)+'\n')

def glass():
 s=reset((.24,.36,.48),(-7,-23,4),(4,42,10),25);ceramic=material('Matte pale ceramic',(.63,.72,.75),.81);navy=material('Rough navy skeleton',(.013,.029,.047),.78,.45);glass=material('Etched glass',(.64,.8,.86),.2,.015,.86);cyan=material('Tiny cyan energy seams',(.005,.64,.78),.2,0,0,4)
 for i in range(7):
  side=-1 if i%2 else 1;y=-4+i*13;size=10+i*1.6;shard('Broken transparent archival wall',(side*(10+i*.6),y,12),size,glass,90+i);cable('Etched edge',[(side*13,y,1),(side*10,y,18),(side*8,y,28)],.035,ceramic)
 ribbon('Incomplete enclosing glass shell',lambda u,v:(math.sin(-.8+u*3.8)*(25+v*5),48+math.cos(-.8+u*3.8)*(25+v*5),15+math.sin(u*7)*3),glass,100,12,.2)
 for i in range(4):shard('Floating eroded mass',((-1 if i%2 else 1)*17,8+i*19,-6+i%2*12),6,navy,210+i)
 ribbon('Soft suspended membrane',lambda u,v:(-12+u*28,30+math.sin(u*5)*10+v*5,19+math.sin(u*math.pi)*12+v*6),ceramic)
 shard('Near lens glass occlusion',(-12,-12,6),13,glass,83)
 for i in range(3):cable('Fine orbit trace',[(-21,8+i*14,18),(3,30+i*10,23),(24,60+i*10,13)],.018,ceramic)
 for i in range(70):
  rng=random.Random(i+480);p=(rng.uniform(-28,28),rng.uniform(-10,90),rng.uniform(-4,30));shard('Glass dust',p,rng.uniform(.025,.13),cyan if i%17==0 else ceramic,i)
 light('White aperture backlight',(6,78,15),4800,(.84,.95,1),20,(0,25,10));light('Soft sky rake',(-28,-14,30),1700,(.73,.85,1),24,(0,25,10));atmosphere(.002,(.62,.76,.83));save('glass-memory',s,'25mm, low left start, stable horizon, forward dolly to upper-right white aperture; no orbit')
def red():
 s=reset((.003,.001,.003),(-4,-19,1),(1,48,4),24);metal=material('Dark brushed metal',(.026,.017,.02),.64,.75);edge=material('Warm edge metal',(.25,.16,.13),.72,.7);energy=material('Crimson internal seam',(.65,.017,.012),.3,.2,0,5)
 # One fractured, asymmetric envelope and internal void, not a stack of rings.
 for side in [-1,1]:
  ribbon('Asymmetric enclosing mechanical body',lambda u,v:(side*(12+math.sin(u*4)*4+v*6),-3+u*86,4+math.sin(u*5)*7+v*18),metal,90,12,.7)
  for i in range(5):
   y=i*17;shard('Broken radial structural arm',(side*11,y,3+(i%3-1)*7),6+i*.8,metal,36+i);cable('Internal hot energy crack',[(side*9,y,0),(side*8,y+7,9),(side*6,y+12,13)],.045,energy)
 ribbon('Suspended torn crescent body',lambda u,v:(math.sin(.3+u*4.5)*(11+v*4),43+math.sin(u*3)*4,5+math.cos(.3+u*4.5)*(13+v*5)),metal,90,10,.6)
 for i in range(9):cable('Wire skeleton',[(math.sin(i*2.4)*14,0,math.cos(i*2.4)*11),(math.sin(i*2.4+.2)*10,38,math.cos(i*2.4+.2)*14),(0,79,5)],.025,edge)
 shard('Near lens clipped machine blade',(-9,-10,4),9,metal,152)
 for i in range(100):
  rng=random.Random(817+i);shard('Mechanical debris',(rng.uniform(-18,18),rng.uniform(-8,90),rng.uniform(-10,19)),rng.uniform(.03,.28),edge,i)
 light('Crimson grazing light',(-20,16,10),4200,(1,.015,.012),11,(0,25,5));light('Hot orange interior',(6,57,5),6500,(1,.19,.045),8,(0,15,5));light('Small white rim',(11,35,22),1800,(1,.86,.74),5,(0,30,2));atmosphere(.006,(.14,.02,.025));save('red-machine',s,'24mm, forward tracking down the internal void, near-miss on left blade; stable roll and horizon')
def dawn():
 s=reset((.34,.63,.85),(5,-42,10),(0,40,7),40);stone=material('Eroded cool mineral',(.34,.43,.42),.93);leaf=material('Translucent synthetic young leaf',(.31,.56,.47),.35,0,.35);stem=material('Dark fine living structure',(.15,.31,.24),.72);warm=material('Warm edge vein',(.78,.64,.35),.7,.25)
 rng=random.Random(722);verts=[]
 for z,r in [(3,6.3),(0,5.2),(-5,.9)]:
  for i in range(20):a=i/20*math.tau;rr=r*(.87+rng.random()*.25);verts.append((math.cos(a)*rr,40+math.sin(a)*rr,z))
 faces=[tuple(range(20))]+[(i,(i+1)%20,(i+1)%20+20,i+20) for i in range(20)]+[(i+20,(i+1)%20+20,(i+1)%20+40,i+40) for i in range(20)];mesh('Small suspended island',verts,faces,stone)
 cable('Synthetic sprout',[(0,40,3),(0,40,4),(0.1,40,6.1),(0,40,8)],.07,stem)
 for side in [-1,1]:ribbon('Thin living leaf',lambda u,v:(side*u*2.4,40+v*math.sin(u*math.pi)*1.8,5+u*1.3+math.sin(u*math.pi)*.4),leaf,32,10,.025);cable('Fine leaf vein',[(0,40,5),(side*1.2,40,6),(side*2.4,40,6.3)],.012,warm)
 # Procedural volumetric cloud banks establish the preview camera and depth.
 cloud=bpy.data.materials.new('Soft volume cloud');cloud.use_nodes=True;n=cloud.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');v=n.new('ShaderNodeVolumePrincipled');v.inputs['Color'].default_value=(.85,.9,1,1);v.inputs['Anisotropy'].default_value=.55;noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3.8;noise.inputs['Detail'].default_value=3;ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.39;ramp.color_ramp.elements[1].position=.69;ramp.color_ramp.elements[1].color=(.065,.065,.065,1);cloud.node_tree.links.new(noise.outputs['Fac'],ramp.inputs[0]);cloud.node_tree.links.new(ramp.outputs['Color'],v.inputs['Density']);cloud.node_tree.links.new(v.outputs['Volume'],out.inputs['Volume'])
 for i in range(4):bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=((-1 if i%2 else 1)*25,20+i*36,14+i%2*13));o=bpy.context.object;o.name='Cloud depth bank';o.scale=(29,15,5);o.data.materials.append(cloud)
 light('Soft morning sun',(-20,55,36),6000,(1,.84,.59),24,(0,40,3));light('Open sky fill',(15,-25,32),1600,(.67,.84,1),35,(0,40,3));save('new-dawn',s,'40mm, slow forward drift, stable horizon, small island lower centre, clouds at separate depths')

for build in [glass,red,dawn]:build()
