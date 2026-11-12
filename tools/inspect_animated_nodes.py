import bpy
from pathlib import Path

for cls in ['dk', 'dw', 'elf', 'mg', 'dl']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    p = f'D:/Dasi/src/client/dev_viewer/models/animated_heroes/hero_{cls}_animated.glb'
    bpy.ops.import_scene.gltf(filepath=p)
    print(f'=== {cls.upper()} ===')
    for o in bpy.data.objects:
        nl = o.name.lower()
        if 'wep' in nl or 'weapon' in nl or 'wing' in nl or 'cape' in nl:
            parent_info = f"BONE:{o.parent_bone}" if o.parent_type == 'BONE' else (o.parent.name if o.parent else 'None')
            if o.rotation_mode == 'QUATERNION':
                rot_str = f"Q({o.rotation_quaternion.w:.3f}, {o.rotation_quaternion.x:.3f}, {o.rotation_quaternion.y:.3f}, {o.rotation_quaternion.z:.3f})"
            else:
                rot_str = f"E({o.rotation_euler.x:.3f}, {o.rotation_euler.y:.3f}, {o.rotation_euler.z:.3f})"
            print(f'  {o.name}: parent={parent_info}, loc=({o.location.x:.3f}, {o.location.y:.3f}, {o.location.z:.3f}), rot={rot_str}')
