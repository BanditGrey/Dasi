import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
p = os.path.abspath("src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb")
bpy.ops.import_scene.gltf(filepath=p)

print("--- Objects in GLB ---")
for obj in bpy.data.objects:
    print(f"Name: {obj.name}, type: {obj.type}, loc: {obj.location}, scale: {obj.scale}, dim: {obj.dimensions}")
