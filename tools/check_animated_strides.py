import bpy
import math
from mathutils import Vector, Euler

WORKSPACE = "D:/Dasi"
PREVIEWS_DIR = f"{WORKSPACE}/docs/art_previews"

heroes = ['dk', 'dw', 'elf', 'mg', 'dl']
anims = ['Walking_A', 'Running_A']

for h in heroes:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    p = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_{h}_animated.glb"
    bpy.ops.import_scene.gltf(filepath=p)
    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if not arm: continue
    
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'TEXTURE'
    scene.render.resolution_x = 700
    scene.render.resolution_y = 900
    scene.render.film_transparent = True
    
    cam_data = bpy.data.cameras.new("HeroCam")
    cam_data.lens = 45.0
    cam_obj = bpy.data.objects.new("HeroCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.location = (0.0, -3.2, 1.1)
    cam_obj.rotation_euler = (1.5708, 0, 0)
    
    for anim_name in anims:
        act = bpy.data.actions.get(anim_name)
        if act and arm.animation_data:
            arm.animation_data.action = act
            # Check frame 10 (mid-stride)
            scene.frame_set(10)
            bpy.context.view_layer.update()
            out_png = f"{PREVIEWS_DIR}/stride_check_{h}_{anim_name.lower()}_f10.png"
            scene.render.filepath = out_png
            bpy.ops.render.render(write_still=True)
            print(f"Rendered: {out_png}")
