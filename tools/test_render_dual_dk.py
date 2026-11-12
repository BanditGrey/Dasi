import bpy
import math
from mathutils import Vector, Euler

WORKSPACE = "D:/Dasi"
PREVIEWS_DIR = f"{WORKSPACE}/docs/art_previews"

bpy.ops.wm.read_factory_settings(use_empty=True)
p = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_dk_master_base.glb"
bpy.ops.import_scene.gltf(filepath=p)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]

wep_r = bpy.data.objects.get('Weapon_Right')
wep_l = bpy.data.objects.get('Weapon_Left')

if wep_r:
    wep_r.rotation_mode = 'XYZ'
    wep_r.rotation_euler = Euler((0, math.radians(90), 0), 'XYZ')
    wep_r.location = Vector((0.0, 0.08, 0.0))

if wep_l:
    wep_l.rotation_mode = 'XYZ'
    wep_l.rotation_euler = Euler((0, math.radians(-90), 0), 'XYZ')
    wep_l.location = Vector((0.0, 0.08, 0.0))

scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.render.resolution_x = 900
scene.render.resolution_y = 1100
scene.render.film_transparent = True

cam_data = bpy.data.cameras.new("HeroCam")
cam_data.lens = 50.0
cam_obj = bpy.data.objects.new("HeroCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (0.0, -3.2, 1.2)
cam_obj.rotation_euler = (1.5708, 0, 0)

# 1. Render Sword_Idle frame 0
act = bpy.data.actions.get('Sword_Idle') or bpy.data.actions.get('Idle')
if act:
    arm.animation_data.action = act
    scene.frame_set(0)
    bpy.context.view_layer.update()
    out_png = f"{PREVIEWS_DIR}/dk_dual_sword_idle.png"
    scene.render.filepath = out_png
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {out_png}")

# 2. Render 1H_Melee_Attack_Chop frame 10
act_chop = bpy.data.actions.get('1H_Melee_Attack_Chop')
if act_chop:
    arm.animation_data.action = act_chop
    scene.frame_set(10)
    bpy.context.view_layer.update()
    out_png = f"{PREVIEWS_DIR}/dk_dual_chop.png"
    scene.render.filepath = out_png
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {out_png}")
