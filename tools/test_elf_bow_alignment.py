import bpy
import math
from mathutils import Vector, Euler

WORKSPACE = "D:/Dasi"
PREVIEWS_DIR = f"{WORKSPACE}/docs/art_previews"

candidates = [
    ("y_neg90", Euler((0, math.radians(-90), 0), 'XYZ')),
    ("y_neg90_x180", Euler((math.radians(180), math.radians(-90), 0), 'XYZ')),
    ("y_neg90_z90", Euler((0, math.radians(-90), math.radians(90)), 'XYZ')),
    ("y_neg90_z180", Euler((0, math.radians(-90), math.radians(180)), 'XYZ')),
    ("y_neg90_z_neg90", Euler((0, math.radians(-90), math.radians(-90)), 'XYZ')),
]

for label, rot in candidates:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_elf_animated.glb"
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    wep = bpy.data.objects.get('elf_weapon')
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
    
    # Check Idle
    act = bpy.data.actions.get('Idle')
    if act:
        arm.animation_data.action = act
        scene.frame_set(0)
        bpy.context.view_layer.update()
        out_png = f"{PREVIEWS_DIR}/elf_test_{label}_idle.png"
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
        print(f"Rendered: {out_png}")
