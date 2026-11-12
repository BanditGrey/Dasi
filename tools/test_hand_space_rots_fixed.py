import bpy
import os
import math
from mathutils import Vector, Euler

WORKSPACE = "D:/Dasi"
PREVIEWS_DIR = f"{WORKSPACE}/docs/art_previews"

rot_tests = [
    ("test1_identity", Euler((0, 0, 0), 'XYZ')),
    ("test2_rot_x180", Euler((math.radians(180), 0, 0), 'XYZ')),
    ("test3_rot_x90", Euler((math.radians(90), 0, 0), 'XYZ')),
    ("test4_rot_x_neg90", Euler((math.radians(-90), 0, 0), 'XYZ')),
    ("test5_rot_z90", Euler((0, 0, math.radians(90)), 'XYZ')),
    ("test6_rot_z_neg90", Euler((0, 0, -math.radians(90)), 'XYZ')),
    ("test7_rot_y90", Euler((0, math.radians(90), 0), 'XYZ')),
    ("test8_rot_y_neg90", Euler((0, -math.radians(90), 0), 'XYZ')),
]

for label, rot in rot_tests:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    wep = bpy.data.objects.get('dk_weapon')
    if wep:
        wep.rotation_mode = 'XYZ'
        wep.rotation_euler = rot
        wep.location = Vector((0.0, 0.08, 0.0))
        
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
    
    # Render with Sword_Idle at frame 0
    act = bpy.data.actions.get('Sword_Idle')
    if act:
        arm.animation_data.action = act
        scene.frame_set(0)
        bpy.context.view_layer.update()
        out_png = f"{PREVIEWS_DIR}/real_sword_idle_{label}.png"
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
        print(f"Rendered: {out_png}")
