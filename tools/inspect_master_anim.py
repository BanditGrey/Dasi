import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
p = 'D:/Dasi/src/client/dev_viewer/models/animated_heroes/hero_dk_master_base.glb'
bpy.ops.import_scene.gltf(filepath=p)
for o in bpy.data.objects:
    if 'weapon' in o.name.lower() or 'wings' in o.name.lower():
        print(f'{o.name}: parent={o.parent_bone}, loc={o.location}, rot_mode={o.rotation_mode}, rot={getattr(o, "rotation_" + o.rotation_mode.lower(), o.rotation_euler)}')
