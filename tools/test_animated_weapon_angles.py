import bpy
import os
import math
from mathutils import Vector, Euler, Matrix

WORKSPACE = "D:/Dasi"
PREVIEWS_DIR = f"{WORKSPACE}/docs/art_previews"

# Test 4 candidate rotations for weapon on hand_r
# Candidate 1: Euler((0, 0, 0)) - Identity
# Candidate 2: Euler((-math.radians(90), 0, 0))
# Candidate 3: Euler((0, math.radians(90), 0))
# Candidate 4: Euler((0, 0, math.radians(90)))
# Candidate 5: Euler((math.radians(90), 0, 0))

candidates = [
    ("rot_0_0_0", Euler((0, 0, 0), 'XYZ')),
    ("rot_neg90x", Euler((-math.radians(90), 0, 0), 'XYZ')),
    ("rot_pos90x", Euler((math.radians(90), 0, 0), 'XYZ')),
    ("rot_pos90y", Euler((0, math.radians(90), 0), 'XYZ')),
    ("rot_pos90z", Euler((0, 0, math.radians(90)), 'XYZ')),
    ("rot_neg90z", Euler((0, 0, -math.radians(90)), 'XYZ')),
]

for name, rot in candidates:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    wep = bpy.data.objects.get('dk_weapon')
    if wep:
        wep.rotation_euler = rot
        wep.location = Vector((0.0, 0.04, 0.0))
        
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
    
    # Render with 1H_Melee_Attack_Chop at frame 10 (apex of the chop)
    act = bpy.data.actions.get('1H_Melee_Attack_Chop')
    if act:
        arm.animation_data.action = act
        scene.frame_set(10)
        bpy.context.view_layer.update()
        out_png = f"{PREVIEWS_DIR}/test_chop_{name}.png"
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
        print(f"Rendered: {out_png}")
