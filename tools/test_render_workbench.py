import bpy
import os
import math

bpy.ops.wm.read_factory_settings(use_empty=True)
p = os.path.abspath("src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb")
bpy.ops.import_scene.gltf(filepath=p)

# Delete enclosing spheres or bounding hulls
for obj in list(bpy.data.objects):
    if "icosphere" in obj.name.lower() or "collision" in obj.name.lower() or "bounding" in obj.name.lower() or "plane" in obj.name.lower():
        print(f"Removing hull/plane: {obj.name}")
        bpy.data.objects.remove(obj)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'MATCAP'
scene.display.shading.color_type = 'TEXTURE'
scene.render.resolution_x = 800
scene.render.resolution_y = 900
scene.render.film_transparent = True

# Add camera
cam_data = bpy.data.cameras.new("TestCam")
cam_data.lens = 50.0
cam = bpy.data.objects.new("TestCam", cam_data)
cam.location = (0.0, -3.2, 1.1)
cam.rotation_euler = (math.radians(82), 0, 0)
bpy.context.scene.collection.objects.link(cam)
scene.camera = cam

out = r"C:\Users\Daniel\.gemini\antigravity\brain\a2a9e655-e877-45f3-b31e-97b5e8380893\test_dk.png"
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print(f"Rendered to: {out}")
