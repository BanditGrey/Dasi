import bpy
import math
from mathutils import Vector, Euler

WORKSPACE = "D:/Dasi"

for rot_name, rot in [
    ("y_neg90", Euler((0, math.radians(-90), 0), 'XYZ')),
    ("y_neg90_z90", Euler((0, math.radians(-90), math.radians(90)), 'XYZ')),
    ("y_neg90_z180", Euler((0, math.radians(-90), math.radians(180)), 'XYZ')),
    ("y_neg90_z_neg90", Euler((0, math.radians(-90), math.radians(-90)), 'XYZ')),
    ("y90_z90", Euler((0, math.radians(90), math.radians(90)), 'XYZ')),
]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_elf_animated.glb"
    bpy.ops.import_scene.gltf(filepath=glb_path)
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    wep = bpy.data.objects.get('elf_weapon')
    wep.rotation_mode = 'XYZ'
    wep.rotation_euler = rot
    wep.location = Vector((0.0, 0.08, 0.0))
    
    # Check 2H_Ranged_Shoot frame 10
    act = bpy.data.actions.get('2H_Ranged_Shoot') or bpy.data.actions.get('Idle')
    arm.animation_data.action = act
    bpy.context.scene.frame_set(10)
    bpy.context.view_layer.update()
    
    # Compute world vertices
    dg = bpy.context.evaluated_depsgraph_get()
    eval_wep = wep.evaluated_get(dg)
    eval_mesh = eval_wep.to_mesh()
    mat = eval_wep.matrix_world
    world_verts = [mat @ v.co for v in eval_mesh.vertices]
    eval_wep.to_mesh_clear()
    
    min_x = min(v.x for v in world_verts)
    max_x = max(v.x for v in world_verts)
    min_y = min(v.y for v in world_verts)
    max_y = max(v.y for v in world_verts)
    min_z = min(v.z for v in world_verts)
    max_z = max(v.z for v in world_verts)
    print(f"[{rot_name}] (Action: {act.name} f10)")
    print(f"  X (left/right): [{min_x:.2f}, {max_x:.2f}] (span={max_x - min_x:.2f})")
    print(f"  Y (fwd/back):   [{min_y:.2f}, {max_y:.2f}] (span={max_y - min_y:.2f})")
    print(f"  Z (up/down):    [{min_z:.2f}, {max_z:.2f}] (span={max_z - min_z:.2f})")
