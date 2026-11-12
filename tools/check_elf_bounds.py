import bpy
import math
from mathutils import Vector, Euler

WORKSPACE = "D:/Dasi"

candidates = [
    ("y_neg90", Euler((0, math.radians(-90), 0), 'XYZ')),
    ("y_neg90_x180", Euler((math.radians(180), math.radians(-90), 0), 'XYZ')),
    ("exact_calc", Euler((math.radians(63.7), math.radians(-28.9), math.radians(-1.9)), 'XYZ')),
    ("hand_r_style", Euler((0, math.radians(90), 0), 'XYZ')),
]

for label, rot in candidates:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_elf_animated.glb"
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    wep = bpy.data.objects.get('elf_weapon')
    wep.rotation_mode = 'XYZ'
    wep.rotation_euler = rot
    wep.location = Vector((0.0, 0.08, 0.0))
    
    print(f"\n--- {label} ---")
    for act_name, f in [('Idle', 0), ('2H_Ranged_Shoot', 10)]:
        act = bpy.data.actions.get(act_name)
        if act:
            arm.animation_data.action = act
            bpy.context.scene.frame_set(f)
            bpy.context.view_layer.update()
            dg = bpy.context.evaluated_depsgraph_get()
            ew = wep.evaluated_get(dg)
            mesh = ew.to_mesh()
            w_verts = [ew.matrix_world @ v.co for v in mesh.vertices]
            ew.to_mesh_clear()
            z_min = min(v.z for v in w_verts)
            z_max = max(v.z for v in w_verts)
            y_min = min(v.y for v in w_verts)
            y_max = max(v.y for v in w_verts)
            x_min = min(v.x for v in w_verts)
            x_max = max(v.x for v in w_verts)
            print(f"  {act_name} f{f}: X=[{x_min:.2f}, {x_max:.2f}], Y=[{y_min:.2f}, {y_max:.2f}], Z=[{z_min:.2f}, {z_max:.2f}]")
