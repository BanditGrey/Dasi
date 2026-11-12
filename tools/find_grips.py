#!/usr/bin/env python3
import sys
import math
from pathlib import Path
sys.path.append(str(Path("conversions/converters/bmd_to_glb")))
from bmd_parser import BMDParser

def find_grip_center(bmd_rel):
    p = Path("reference/mu_roxgaming_5.2/client/Data") / bmd_rel
    if not p.exists():
        return None
    parser = BMDParser(p)
    parser.parse(apply_bones=False)
    
    verts = [v[1] for m in parser.meshes for v in m['raw_verts']]
    
    # We want to find the narrowest cylindrical section along the main axis (handle)
    # Most weapons are oriented along Z or Y. Let's find bounding box:
    min_x = min(v[0] for v in verts); max_x = max(v[0] for v in verts)
    min_y = min(v[1] for v in verts); max_y = max(v[1] for v in verts)
    min_z = min(v[2] for v in verts); max_z = max(v[2] for v in verts)
    
    dx = max_x - min_x
    dy = max_y - min_y
    dz = max_z - min_z
    
    main_axis = 'Z'
    if dx > dy and dx > dz: main_axis = 'X'
    elif dy > dx and dy > dz: main_axis = 'Y'
    
    return {
        'path': bmd_rel,
        'main_axis': main_axis,
        'box': ((min_x, max_x), (min_y, max_y), (min_z, max_z)),
        'size': (dx, dy, dz),
        'verts_count': len(verts)
    }

weapons = [
    "Item/Sword02.bmd", "Item/Sword17.bmd", "Item/Sword01.bmd",
    "Item/Staff05.bmd", "Item/Staff04.bmd",
    "Item/Bow04.bmd", "Item/Bow03.bmd", "Item/Bow01.bmd",
    "Item/Sword13.bmd", "Item/Sword11.bmd",
    "Item/Mace08.bmd", "Item/Mace05.bmd"
]

for w in weapons:
    res = find_grip_center(w)
    if res:
        print(f"{res['path']:25s} Axis={res['main_axis']} Size=({res['size'][0]:5.1f}, {res['size'][1]:5.1f}, {res['size'][2]:5.1f}) X=[{res['box'][0][0]:5.1f}, {res['box'][0][1]:5.1f}] Y=[{res['box'][1][0]:5.1f}, {res['box'][1][1]:5.1f}] Z=[{res['box'][2][0]:5.1f}, {res['box'][2][1]:5.1f}]")
