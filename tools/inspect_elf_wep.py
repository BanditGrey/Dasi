import bpy
WORKSPACE = "D:/Dasi"
bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_elf_animated.glb"
bpy.ops.import_scene.gltf(filepath=glb_path)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
wep = bpy.data.objects.get('elf_weapon')
if wep:
    print(f"elf_weapon parent: {wep.parent_bone}")
    print(f"elf_weapon local loc: {wep.location}")
    print(f"elf_weapon local rot_mode: {wep.rotation_mode}")
    if wep.rotation_mode == 'QUATERNION':
        print(f"elf_weapon local rot: {wep.rotation_quaternion}")
    else:
        print(f"elf_weapon local rot: {wep.rotation_euler}")
        
    for act_name, frame in [('Idle', 0), ('2H_Ranged_Shoot', 10)]:
        act = bpy.data.actions.get(act_name)
        if act:
            arm.animation_data.action = act
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            dg = bpy.context.evaluated_depsgraph_get()
            eval_w = wep.evaluated_get(dg)
            mesh = eval_w.to_mesh()
            world_verts = [eval_w.matrix_world @ v.co for v in mesh.vertices]
            eval_w.to_mesh_clear()
            min_x = min(v.x for v in world_verts)
            max_x = max(v.x for v in world_verts)
            min_y = min(v.y for v in world_verts)
            max_y = max(v.y for v in world_verts)
            min_z = min(v.z for v in world_verts)
            max_z = max(v.z for v in world_verts)
            print(f"Action {act_name} f{frame} World bounds:")
            print(f"  X: [{min_x:.2f}, {max_x:.2f}] (span={max_x - min_x:.2f})")
            print(f"  Y: [{min_y:.2f}, {max_y:.2f}] (span={max_y - min_y:.2f})")
            print(f"  Z: [{min_z:.2f}, {max_z:.2f}] (span={max_z - min_z:.2f})")
