"""Original physical hero shots. Blender 4.5.0 / EEVEE ray tracing.
No downloaded models, images, materials or simulations. Absolute seeded poses.
Formal sequence renders are restricted to GitHub Actions; local stills are QA.
"""
import bpy, math, random, pathlib, sys, argparse, json, hashlib, os, time
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--shot',required=True);p.add_argument('--still',type=float);p.add_argument('--width',type=int);o=p.parse_args(sys.argv[sys.argv.index('--')+1:])
if o.still is None and os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('Formal Blender sequences render in GitHub Actions only')
config=json.loads((ROOT/'scripts/blender/settings'/f'{o.shot}.json').read_text());rng=random.Random(config['seed'])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE_NEXT';s.eevee.taa_render_samples=config['samples'];s.eevee.use_raytracing=True
s.eevee.volumetric_samples=16;s.eevee.volumetric_tile_size='16';s.eevee.use_volumetric_shadows=True
s.render.resolution_x=o.width or config['width'];s.render.resolution_y=round(s.render.resolution_x*9/16);s.render.resolution_percentage=100;s.render.fps=config['fps']
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.compression=15
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.3
s.render.film_transparent=False;s.render.engine='BLENDER_EEVEE_NEXT'
def mat(name,color,rough=.65,metal=0,trans=0,emit=0,bump=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;b=n.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;b.inputs['Transmission Weight'].default_value=trans;b.inputs['IOR'].default_value=1.45;b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emit
 if bump:
  noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=8;noise.inputs['Detail'].default_value=4;nb=n.new('ShaderNodeBump');nb.inputs['Strength'].default_value=bump;nb.inputs['Distance'].default_value=.14;l.new(noise.outputs['Fac'],nb.inputs['Height']);l.new(nb.outputs['Normal'],b.inputs['Normal'])
 return m
def mesh(name,verts,faces,material):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);s.collection.objects.link(ob);ob.data.materials.append(material);return ob
def body(name,pos,size,material,bevel=.1):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);ob=bpy.context.object;ob.name=name;ob.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);ob.data.materials.append(material)
 if bevel:mo=ob.modifiers.new('Edge catches light','BEVEL');mo.width=bevel;mo.segments=3;ob.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return ob
def sphere(name,pos,size,material,sub=2):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=pos);ob=bpy.context.object;ob.name=name;ob.scale=size;ob.data.materials.append(material)
 for f in ob.data.polygons:f.use_smooth=True
 return ob
def stone(name,pos,size,material):
 ob=sphere(name,pos,size,material,3)
 for v in ob.data.vertices:
  a=v.co;factor=1+.17*math.sin(a.x*7+a.y*3)+.08*math.cos(a.z*9);v.co*=factor
 return ob
def curve(name,points,r,material):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=8;cu.bevel_depth=r;cu.bevel_resolution=2;sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for b,co in zip(sp.bezier_points,points):b.co=co;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 ob=bpy.data.objects.new(name,cu);s.collection.objects.link(ob);ob.data.materials.append(material);return ob
def group(name):
 ob=bpy.data.objects.new(name,None);s.collection.objects.link(ob);return ob
def prism(name,outline,y,depth,material):
 # A designed silhouette extruded along the camera's traversal axis.
 n=len(outline);verts=[(x,y-depth/2,z) for x,z in outline]+[(x,y+depth/2,z) for x,z in outline]
 faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 ob=mesh(name,verts,faces,material);b=ob.modifiers.new('Small physical edge','BEVEL');b.width=.08;b.segments=2;ob.modifiers.new('Surface normals','WEIGHTED_NORMAL');return ob
font_cache={}
def numeral(text,pos,size,material,extrude=.18,font='Display'):
 cu=bpy.data.curves.new('Original typographic architecture','FONT');cu.body=text;cu.size=size;cu.extrude=extrude;cu.bevel_depth=.03;cu.align_x='CENTER'
 if font not in font_cache:font_cache[font]=bpy.data.fonts.load(str(ROOT/'public/fonts'/f'{font}.ttf'))
 cu.font=font_cache[font]
 ob=bpy.data.objects.new('Monument '+text,cu);s.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(math.pi/2,0,0);cu.materials.append(material);return ob
def ease(x):return max(0,min(1,x))**2*(3-2*max(0,min(1,x)))
def dust(name,centre,spread,count,material,size=.08):
 # One combined mesh with a coherent drift, not one light per particle.
 verts=[];faces=[]
 for i in range(count):
  x,y,z=[centre[j]+rng.uniform(-spread[j],spread[j]) for j in range(3)];r=size*rng.uniform(.3,1.3);k=len(verts)
  verts.extend([(x-r,y,z),(x+r,y,z),(x,y,z+r*2),(x,y+r,z-r)])
  faces.extend([(k,k+1,k+2),(k,k+3,k+1),(k,k+2,k+3),(k+1,k+3,k+2)])
 return mesh(name,verts,faces,material)
def petal(name,pos,size,material,angle=0):
 verts=[];faces=[]
 for i in range(17):
  u=i/16;w=math.sin(u*math.pi)*(1-.25*u)
  for j in range(7):
   v=(j/6-.5)*2;verts.append((v*w*size*.35,u*size*.18, (u-.5)*size+math.sin(u*math.pi)*size*.12-v*v*w*size*.07))
   if i<16 and j<6:k=i*7+j;faces.append((k,k+1,k+8,k+7))
 ob=mesh(name,verts,faces,material);ob.location=pos;ob.rotation_euler[1]=angle
 for f in ob.data.polygons:f.use_smooth=True
 return ob
def volume_box(name,centre,size,density,color):
 ob=body(name,centre,size,mat(name+' holder',color),0);m=bpy.data.materials.new(name+' volume');m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');v=n.new('ShaderNodeVolumePrincipled');v.inputs['Density'].default_value=density;v.inputs['Color'].default_value=(*color,1);v.inputs['Anisotropy'].default_value=.35;m.node_tree.links.new(v.outputs['Volume'],out.inputs['Volume']);ob.data.materials.clear();ob.data.materials.append(m);return ob
def sky(low=(.8,.9,1),high=(.07,.22,.4),strength=.5):
 w=bpy.data.worlds.new('Original gradient atmosphere');s.world=w;w.use_nodes=True;n=w.node_tree.nodes;l=w.node_tree.links;n.clear();out=n.new('ShaderNodeOutputWorld');b=n.new('ShaderNodeBackground');b.inputs['Strength'].default_value=strength;coord=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.15;r.color_ramp.elements[0].color=(*low,1);r.color_ramp.elements[1].position=.9;r.color_ramp.elements[1].color=(*high,1);l.new(coord.outputs['Normal'],sep.inputs[0]);l.new(sep.outputs['Z'],r.inputs[0]);l.new(r.outputs[0],b.inputs['Color']);l.new(b.outputs[0],out.inputs['Surface'])
def light(name,pos,power,size,color,target=(0,0,5)):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;ob=bpy.data.objects.new(name,d);s.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler();return ob
def fog(density=.004,color=(.75,.85,.9)):
 ob=body('Air / scattering',(0,22,12),(140,190,60),mat('Placeholder volume',(.5,.5,.5)),0);m=bpy.data.materials.new('Atmospheric depth');m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');v=n.new('ShaderNodeVolumePrincipled');v.inputs['Density'].default_value=density;v.inputs['Color'].default_value=(*color,1);v.inputs['Anisotropy'].default_value=.5;m.node_tree.links.new(v.outputs['Volume'],out.inputs['Volume']);ob.data.materials.clear();ob.data.materials.append(m)
def camera():
 d=bpy.data.cameras.new('Camera participates');ob=bpy.data.objects.new('Camera participates',d);s.collection.objects.link(ob);s.camera=ob;d.lens=32;d.clip_end=1000;d.dof.use_dof=True;d.dof.aperture_fstop=4
camera()
def look(pos,target,lens=32,roll=0,focus=None):
 c=s.camera;c.location=pos;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.rotation_euler.rotate_axis('Z',roll);c.data.lens=lens;c.data.dof.focus_distance=focus or (Vector(target)-c.location).length
# A restrained highlight glow; material response and backlight provide the body.
s.use_nodes=True;n=s.node_tree.nodes;n.clear();r=n.new('CompositorNodeRLayers');denoise=n.new('CompositorNodeDenoise');g=n.new('CompositorNodeGlare');g.glare_type='FOG_GLOW';g.quality='MEDIUM';g.threshold=1.4;g.mix=-.88;out=n.new('CompositorNodeComposite');s.node_tree.links.new(r.outputs['Image'],denoise.inputs['Image']);s.node_tree.links.new(denoise.outputs['Image'],g.inputs['Image']);s.node_tree.links.new(g.outputs['Image'],out.inputs['Image'])
exec(compile((ROOT/'scripts/blender'/f'{o.shot}.py').read_text(),f'{o.shot}.py','exec'))
outdir=ROOT/'public/physical'/o.shot;outdir.mkdir(parents=True,exist_ok=True)
if o.still is not None:
 animate(o.still);s.render.filepath=str(ROOT/'output'/f'physical-{o.shot}-{o.still:.2f}.png');bpy.ops.render.render(write_still=True)
else:
 frames=math.ceil(config['duration']*config['fps']);animate(0);bpy.ops.wm.save_as_mainfile(filepath=str(outdir/f'{o.shot}.blend'),compress=True)
 for frame in range(frames):
  s.frame_set(frame+1);animate(frame/max(1,frames-1));s.render.filepath=str(outdir/f'{frame:05d}.png');bpy.ops.render.render(write_still=True);print('PHYSICAL_FRAME',o.shot,frame+1,frames,flush=True)
 fingerprint=hashlib.sha256(pathlib.Path(__file__).read_bytes()+(ROOT/'scripts/blender'/f'{o.shot}.py').read_bytes()+(ROOT/'scripts/blender/settings'/f'{o.shot}.json').read_bytes()).hexdigest()
 (outdir/'render.json').write_text(json.dumps(dict(config,frames=frames,blender=bpy.app.version_string,fingerprint=fingerprint,source='original procedural Blender scene'),indent=2)+'\n')
