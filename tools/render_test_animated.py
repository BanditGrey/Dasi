import os
import bpy
from mathutils import Vector
from pathlib import Path

bpy.ops.wm.read_factory_settings(use_empty=True)

glb_path = "src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"
bpy.ops.import_scene.gltf(filepath=glb_path)

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
cam_obj.rotation_euler = (1.5708, 0, 0) # olhar horizontal

out_path = "D:/Dasi/docs/art_previews/test_render_animated_dk.png"
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("Rendered:", out_path)
