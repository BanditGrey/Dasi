import bpy
import sys
from pathlib import Path
from mathutils import Vector

CLASSES_DIR = Path(r"D:\Dasi\conversions\output\classes")

for cls, wing, chest, wep in [
    ('dw', 'dw_wings_of_soul.obj', 'dw_legendary_chest.obj', 'dw_weapon_staff_of_kundun.obj'),
    ('dk', 'dk_wings_of_dragon.obj', 'dk_dragon_chest.obj', 'dk_weapon_dragon_blade.obj'),
    ('elf', 'elf_wings_of_spirits.obj', 'elf_guardian_chest.obj', 'elf_weapon_celestial_bow.obj'),
]:
    print("\n" + "="*60)
    print(f"CLASS: {cls.upper()}")
    print("="*60)
    for fname in [wing, chest, wep]:
        fpath = CLASSES_DIR / cls / fname
        if not fpath.exists():
            print(f"  Missing: {fpath}")
            continue
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.wm.obj_import(filepath=str(fpath))
        for obj in bpy.context.scene.objects:
            if obj.type == 'MESH':
                bbox = [Vector(obj.bound_box[i]) for i in range(8)]
                min_x = min(v.x for v in bbox)
                max_x = max(v.x for v in bbox)
                min_y = min(v.y for v in bbox)
                max_y = max(v.y for v in bbox)
                min_z = min(v.z for v in bbox)
                max_z = max(v.z for v in bbox)
                center_x = (min_x + max_x) / 2
                center_y = (min_y + max_y) / 2
                center_z = (min_z + max_z) / 2
                print(f"  [{fname}] Mesh: {obj.name} | Verts: {len(obj.data.vertices)} | Bounds: X[{min_x:.3f}, {max_x:.3f}] Y[{min_y:.3f}, {max_y:.3f}] Z[{min_z:.3f}, {max_z:.3f}] | Center: ({center_x:.3f}, {center_y:.3f}, {center_z:.3f})")
