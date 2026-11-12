#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path("conversions/converters/bmd_to_glb")))
from bmd_parser import BMDParser

weapons = [
    ("Dragon Blade (DK)", "reference/mu_roxgaming_5.2/client/Data/Item/Sword02.bmd"),
    ("Knight Blade (DK)", "reference/mu_roxgaming_5.2/client/Data/Item/Sword17.bmd"),
    ("Archangel Sword (DK)", "reference/mu_roxgaming_5.2/client/Data/Item/Sword01.bmd"),
    ("Chaos Dragon Axe (DK)", "reference/mu_roxgaming_5.2/client/Data/Item/Axe05.bmd"),
    ("Kundun Staff (DW)", "reference/mu_roxgaming_5.2/client/Data/Item/Staff05.bmd"),
    ("Chaos Lightning Staff (DW)", "reference/mu_roxgaming_5.2/client/Data/Item/Staff04.bmd"),
    ("Celestial Bow (ELF)", "reference/mu_roxgaming_5.2/client/Data/Item/Bow04.bmd"),
    ("Great Reign Crossbow (ELF)", "reference/mu_roxgaming_5.2/client/Data/Item/Bow08.bmd"),
    ("Rune Blade (MG)", "reference/mu_roxgaming_5.2/client/Data/Item/Sword13.bmd"),
    ("Lighting Sword (MG)", "reference/mu_roxgaming_5.2/client/Data/Item/Sword11.bmd"),
    ("Shining Scepter (DL)", "reference/mu_roxgaming_5.2/client/Data/Item/Mace08.bmd"),
    ("Great Lord Scepter (DL)", "reference/mu_roxgaming_5.2/client/Data/Item/Mace05.bmd"),
]

print("=" * 75)
print("ANALYSIS OF CANONICAL WEAPON BMD GEOMETRIES AND GRIP POINTS")
print("=" * 75)

for title, fpath in weapons:
    p = Path(fpath)
    if not p.exists():
        print(f"[-] Missing: {fpath}")
        continue
    parser = BMDParser(p)
    parser.parse(apply_bones=False)
    
    all_verts = [v[1] for m in parser.meshes for v in m['raw_verts']]
    xs = [v[0] for v in all_verts]
    ys = [v[1] for v in all_verts]
    zs = [v[2] for v in all_verts]
    
    print(f"\n--- {title} [{p.name}] ---")
    print(f"  Meshes: {len(parser.meshes)} | Total Vertices: {len(all_verts)}")
    print(f"  X (lateral):   [{min(xs):.2f}, {max(xs):.2f}] -> Width:  {max(xs)-min(xs):.2f}")
    print(f"  Y (depth):     [{min(ys):.2f}, {max(ys):.2f}] -> Depth:  {max(ys)-min(ys):.2f}")
    print(f"  Z (longitud):  [{min(zs):.2f}, {max(zs):.2f}] -> Length: {max(zs)-min(zs):.2f}")
    
    # Check origin (0,0,0): In MU Online, BMD weapons are modeled with (0,0,0) right at the grip center!
    # Let's verify how close (0,0,0) is to the handle.
    near_origin = [v for v in all_verts if abs(v[0]) < 10 and abs(v[1]) < 10 and abs(v[2]) < 15]
    print(f"  Vertices near local (0,0,0) [handle area]: {len(near_origin)}")
