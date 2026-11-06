import bpy
import os
import math
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
p = os.path.abspath("D:/Lemuria-Online-main/public/models/Rogue.glb")
bpy.ops.import_scene.gltf(filepath=p)

for obj in list(bpy.data.objects):
    n = obj.name.lower()
    if "icosphere" in n or "collision" in n or "bounding" in n or "plane.002" in n:
        bpy.data.objects.remove(obj)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.render.resolution_x = 800
scene.render.resolution_y = 1000
scene.render.film_transparent = True

cam_data = bpy.data.cameras.new("HeroCamera")
cam_data.lens = 52.0
cam_obj = bpy.data.objects.new("HeroCamera", cam_data)
cam_obj.location = (0.13, -3.9, 0.9)
cam_obj.rotation_euler = (math.radians(86), 0, 0)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

out = r"C:\Users\Daniel\.gemini\antigravity\brain\a2a9e655-e877-45f3-b31e-97b5e8380893\hero_preview_rogue.png"
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("Rendered Rogue to:", out)
