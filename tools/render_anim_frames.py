import bpy
import os
import math
from mathutils import Vector, Euler

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = "src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"
bpy.ops.import_scene.gltf(filepath=glb_path)

arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]

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

# Render Sword_Idle
act = bpy.data.actions.get('Sword_Idle')
if act:
    arm.animation_data.action = act
    scene.frame_set(5)
    bpy.context.view_layer.update()
    scene.render.filepath = "D:/Dasi/docs/art_previews/test_anim_sword_idle.png"
    bpy.ops.render.render(write_still=True)
    print("Rendered Sword_Idle")

# Render 1H_Melee_Attack_Chop
act2 = bpy.data.actions.get('1H_Melee_Attack_Chop')
if act2:
    arm.animation_data.action = act2
    scene.frame_set(12)
    bpy.context.view_layer.update()
    scene.render.filepath = "D:/Dasi/docs/art_previews/test_anim_attack_chop.png"
    bpy.ops.render.render(write_still=True)
    print("Rendered 1H_Melee_Attack_Chop")
