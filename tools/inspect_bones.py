import sys
from pathlib import Path

sys.path.append("D:/Dasi/conversions/converters/bmd_to_glb")
from bmd_parser import BMDParser

for name, bmd in [('Balrog', 'Monster28.bmd'), ('Gorgon', 'Monster12.bmd'), ('Ice Queen', 'Monster19.bmd'), ('Kundun', 'Monster65.bmd')]:
    p = BMDParser(Path(f"D:/Dasi/reference/mu_roxgaming_5.2/client/Data/Monster/{bmd}"))
    if p.parse(apply_bones=True):
        print(f"\n=== {name} ({len(p.bones)} bones) ===")
        for i, b in enumerate(p.bones):
            b_name = b['name']
            if any(k in b_name.lower() for k in ['hand', 'weapon', 'knife', 'r finger', 'l finger']):
                mat = p.bone_matrices[i]
                if mat:
                    # No sistema OBJ: X=x, Y=z, Z=-y
                    mu_x, mu_y, mu_z = mat[0][3], mat[1][3], mat[2][3]
                    obj_x, obj_y, obj_z = mu_x, mu_z, -mu_y
                    print(f"  Bone {i:2d}: {b_name:<20} MU=({mu_x:.2f}, {mu_y:.2f}, {mu_z:.2f}) -> OBJ=({obj_x:.2f}, {obj_y:.2f}, {obj_z:.2f})")
