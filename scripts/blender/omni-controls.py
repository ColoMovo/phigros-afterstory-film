"""Original silent six-second control inputs; formal rendering is CI only.

Deliberately simple surface / atmosphere and stable spatial intent. These are
previs inputs for Omni editing experiments, never accepted final-film shots.
"""
import bpy, math, os, sys, json, hashlib, subprocess
from pathlib import Path
from mathutils import Vector

if os.environ.get('GITHUB_ACTIONS') != 'true':
    raise RuntimeError('Formal control sequences render only in GitHub Actions.')
mode = sys.argv[sys.argv.index('--') + 1]
assert mode in ('dark-surface', 'judgement-rule')
out = Path('output/omni-controls') / mode
out.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 2
scene.cycles.use_denoising = True
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.16, .19, .22, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .45

def mat(name, color, rough=.7, emission=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = .25
    p.inputs['Emission Color'].default_value = (*color, 1)
    p.inputs['Emission Strength'].default_value = emission
    return m

def mesh(name, verts, faces, material):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj

def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

def area(name, position, power, color, size, target):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.color = color
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    aim(obj, target)

camera_data = bpy.data.cameras.new('Stable control camera')
camera = bpy.data.objects.new('Stable control camera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.lens = 32
camera_data.clip_end = 200

if mode == 'dark-surface':
    dark = mat('Simple dark control surface', (.019, .024, .032), .65)
    ceramic = mat('Muted inner lip', (.28, .32, .36), .8)
    warm = mat('Warm leakage', (.7, .31, .09), .5, 2)
    verts, faces = [], []
    # One coherent cut shell, with an open longitudinal seam; no torus stack.
    for i in range(51):
        lat = -.88 + i/50*1.76
        for j in range(73):
            lon = -.6 + j/72*5.1
            r = 8 + .08*math.sin(lat*5+lon*3)
            verts.append((r*math.cos(lat)*math.cos(lon)-7,
                          r*math.cos(lat)*math.sin(lon)+5,
                          r*math.sin(lat)+3))
    for i in range(50):
        for j in range(72):
            n = i*73+j
            faces.append((n,n+1,n+74,n+73))
    shell = mesh('Cropped celestial shell', verts, faces, dark)
    for p in shell.data.polygons: p.use_smooth = True
    solid = shell.modifiers.new('Real shell thickness', 'SOLIDIFY')
    solid.thickness = .22
    mesh('Inner seam lip', [(1.1,-.3,-3),(1.5,.1,-3),(1.5,.1,10),(1.1,-.3,10)], [(0,1,2,3)], ceramic)
    mesh('Narrow warm seam', [(1.38,.04,-3),(1.46,.04,-3),(1.46,.04,10),(1.38,.04,10)], [(0,1,2,3)], warm)
    area('Broad side light', (8,-5,10), 1900, (.62,.74,1), 8, (-3,3,2))
    area('Warm seam light', (2,0,2), 850, (1,.38,.12), 4, (-5,4,2))
    camera_data.lens = 28
    def pose(t):
        camera.location = (3.3-t*.22,-15+t*.8,1.4+t*.16)
        aim(camera, (-2,5,3.3))
else:
    pale = mat('Matte control mineral', (.5,.57,.62), .85)
    edge = mat('Judgement control energy', (.015,.8,.95), .7, 1.6)
    dark = mat('Dark control keel', (.06,.09,.12), .9)
    # Five designed wedges at separate depths; stationary baseline objects.
    for i, x in enumerate((-7,-3.2,.4,4.4,7.6)):
        y = 5+i*1.8
        z = 2.1+(i%3)*1.4
        s = 1.3+(i%2)*.7
        mesh('Stationary wedge '+str(i),
             [(x-s,y-s,z),(x+s,y-s,z),(x+s*.6,y+s,z+.3),
              (x-s*.7,y+s,z+.3),(x,y,z-s*1.1)],
             [(0,1,2,3),(0,4,1),(1,4,2),(2,4,3),(3,4,0)],pale if i%2 else dark)
    mesh('Thin horizontal judgement boundary',
         [(-12,3,4.1),(12,3,4.1),(12,3,4.15),(-12,3,4.15)],[(0,1,2,3)],edge)
    area('Large softbox', (0,-5,14), 2600, (.8,.9,1), 10, (0,8,3))
    camera_data.lens = 35
    def pose(t):
        camera.location = (0,-19+t*.6,5.6)
        aim(camera, (0,10,4))

pose(0)
bpy.ops.wm.save_as_mainfile(filepath=str((out/(mode+'-v01.blend')).resolve()))
for frame in range(144):
    pose(frame/24)
    scene.render.filepath = str((out/f'{frame:04d}.png').resolve())
    bpy.ops.render.render(write_still=True)
movie = out/(mode+'-v01.mp4')
subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-i',str(out/'%04d.png'),
                '-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p',
                '-an','-movflags','+faststart',str(movie)],check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(movie),'-f','null','-'],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert v['width']==960 and v['height']==540 and v['r_frame_rate']=='24/1' and int(v['nb_frames'])==144
assert not any(s['codec_type']=='audio' for s in probe['streams'])
receipt=dict(mode=mode,scope='Original control footage for Omni tests, not final film',
             frames=144,fps=24,duration=6,resolution=[960,540],fullDecode='pass',
             sourceCommit=os.environ.get('GITHUB_SHA'),sha256=hashlib.sha256(movie.read_bytes()).hexdigest())
(out/(mode+'-v01.json')).write_text(json.dumps(receipt,indent=2)+'\n')
for png in out.glob('*.png'): png.unlink()
print(json.dumps(receipt))
