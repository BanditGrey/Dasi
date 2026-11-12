import sys
from pathlib import Path
sys.path.append('conversions/converters/bmd_to_glb')
from bmd_parser import BMDParser

DATA_DIR = Path('reference/mu_roxgaming_5.2/client/Data')

weapons = [
    'Item/Sword02.bmd', # Dragon Blade
    'Item/Sword01.bmd', # Archangel Sword
    'Item/Staff05.bmd', # Kundun Staff
    'Item/Bow04.bmd',   # Tiger/Celestial Bow
    'Item/Sword13.bmd', # Rune Blade
    'Item/Sword11.bmd', # Lighting Sword
    'Item/Mace08.bmd',  # Shining Scepter
]

for w in weapons:
    f = DATA_DIR / w
    if not f.exists():
        print(f"File not found: {w}")
        continue
    p = BMDParser(f)
    p.parse(apply_bones=False)
    all_verts = []
    for m in p.meshes:
        if m['texture_name'].lower().startswith('hid'):
            continue
        all_verts.extend([v[1] for v in m['raw_verts']])
    xs = [v[0] for v in all_verts]
    ys = [v[1] for v in all_verts]
    zs = [v[2] for v in all_verts]
    print(f"=== {w} ===")
    print(f"  Verts: {len(all_verts)}")
    print(f"  X: [{min(xs):.1f}, {max(xs):.1f}] span={max(xs)-min(xs):.1f}")
    print(f"  Y: [{min(ys):.1f}, {max(ys):.1f}] span={max(ys)-min(ys):.1f}")
    print(f"  Z: [{min(zs):.1f}, {max(zs):.1f}] span={max(zs)-min(zs):.1f}")
