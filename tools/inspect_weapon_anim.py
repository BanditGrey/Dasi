import bpy
import os
import math
from mathutils import Vector, Euler

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = "src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"
bpy.ops.import_scene.gltf(filepath=glb_path)

arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
wep = bpy.data.objects.get('dk_weapon')

print("Armature:", arm.name)
print("Weapon:", wep.name if wep else "NOT FOUND")
if wep:
    print("  Parent:", wep.parent.name if wep.parent else "None")
    print("  Parent Type:", wep.parent_type)
    print("  Parent Bone:", wep.parent_bone)
    print("  Location:", wep.location)
    print("  Rotation (deg):", [math.degrees(a) for a in wep.rotation_euler])
    print("  World Loc (Rest):", wep.matrix_world.translation)

# Check all animations
if arm.animation_data and bpy.data.actions:
    print(f"Total Actions: {len(bpy.data.actions)}")
    for act in bpy.data.actions:
        arm.animation_data.action = act
        bpy.context.scene.frame_set(0)
        bpy.context.view_layer.update()
        wloc = wep.matrix_world.translation if wep else Vector((0,0,0))
        print(f"  Action '{act.name}' frame 0 -> wep world loc: ({wloc.x:.3f}, {wloc.y:.3f}, {wloc.z:.3f})")
