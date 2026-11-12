import bpy

WORKSPACE = "D:/Dasi"

# Re-run or inspect in Blender
bpy.ops.wm.read_factory_settings(use_empty=True)
# We can run the setup in test_clean_skin_animated_dk and print bounds
exec(open("D:/Dasi/tools/test_clean_skin_animated_dk.py").read())

print("\n=== BOUNDS INSPECTION PER PIECE ===")
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
for act_name in ['Idle', 'Walking_A', '1H_Melee_Attack_Chop']:
    act = bpy.data.actions.get(act_name)
    if act and arm.animation_data:
        arm.animation_data.action = act
        scene.frame_set(10 if 'Attack' in act_name or 'Walk' in act_name else 0)
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        print(f"\n--- {act_name} ---")
        for p_name in ['Armor_Helm', 'Armor_Chest', 'Armor_Legs', 'Armor_Gloves', 'Armor_Boots']:
            obj = bpy.data.objects.get(p_name)
            if obj:
                eval_o = obj.evaluated_get(dg)
                mesh = eval_o.to_mesh()
                w_verts = [eval_o.matrix_world @ v.co for v in mesh.vertices]
                eval_o.to_mesh_clear()
                z_min, z_max = min(v.z for v in w_verts), max(v.z for v in w_verts)
                y_min, y_max = min(v.y for v in w_verts), max(v.y for v in w_verts)
                x_min, x_max = min(v.x for v in w_verts), max(v.x for v in w_verts)
                print(f"  {p_name:14s}: X=[{x_min:5.2f}, {x_max:5.2f}], Y=[{y_min:5.2f}, {y_max:5.2f}], Z=[{z_min:5.2f}, {z_max:5.2f}]")
