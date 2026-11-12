import bpy
WORKSPACE = "D:/Dasi"
bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_elf_animated.glb"
bpy.ops.import_scene.gltf(filepath=glb_path)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
wings = bpy.data.objects.get('elf_wings')
if wings:
    print(f"elf_wings parent: {wings.parent_bone}")
    print(f"elf_wings local loc: {wings.location}")
    print(f"elf_wings matrix_world translation: {wings.matrix_world.translation}")
    
    act_idle = bpy.data.actions.get('Idle')
    arm.animation_data.action = act_idle
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()
    
    dg = bpy.context.evaluated_depsgraph_get()
    eval_w = wings.evaluated_get(dg)
    print(f"elf_wings evaluated world translation at Idle f0: {eval_w.matrix_world.translation}")
    
    # Check bounding box
    mesh = eval_w.to_mesh()
    world_verts = [eval_w.matrix_world @ v.co for v in mesh.vertices]
    eval_w.to_mesh_clear()
    min_z = min(v.z for v in world_verts)
    max_z = max(v.z for v in world_verts)
    min_y = min(v.y for v in world_verts)
    max_y = max(v.y for v in world_verts)
    min_x = min(v.x for v in world_verts)
    max_x = max(v.x for v in world_verts)
    print(f"World bounds: X=[{min_x:.2f}, {max_x:.2f}], Y=[{min_y:.2f}, {max_y:.2f}], Z=[{min_z:.2f}, {max_z:.2f}]")
