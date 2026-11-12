import sys
from pathlib import Path
sys.path.append('conversions/converters/bmd_to_glb')
from bmd_parser import BMDParser

DATA_DIR = Path('reference/mu_roxgaming_5.2/client/Data')

for w in ['Item/Sword13.bmd', 'Item/Mace08.bmd', 'Item/Bow04.bmd']:
    p = BMDParser(DATA_DIR / w)
    p.parse(apply_bones=False)
    for mi, m in enumerate(p.meshes):
        name = m['texture_name']
        vs = [v[1] for v in m['raw_verts']]
        xs = [v[0] for v in vs]; ys = [v[1] for v in vs]; zs = [v[2] for v in vs]
        print(f"{w} mesh {mi} '{name}':")
        print(f"  X: [{min(xs):.1f}, {max(xs):.1f}]")
        print(f"  Y: [{min(ys):.1f}, {max(ys):.1f}]")
        print(f"  Z: [{min(zs):.1f}, {max(zs):.1f}]")
