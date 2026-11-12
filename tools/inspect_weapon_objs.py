import os
from pathlib import Path

WORKSPACE = Path("D:/Dasi")
CLASSES_DIR = WORKSPACE / "conversions/output/classes"

for cls in ['dk', 'dw', 'elf', 'mg', 'dl']:
    c_dir = CLASSES_DIR / cls
    print(f"\n=== {cls.upper()} WEAPONS ===")
    for f in c_dir.glob("*weapon*.obj"):
        lines = f.read_text().splitlines()
        min_v = [float('inf')]*3
        max_v = [float('-inf')]*3
        count = 0
        for l in lines:
            if l.startswith('v '):
                pts = [float(x) for x in l.split()[1:4]]
                count += 1
                for i in range(3):
                    if pts[i] < min_v[i]: min_v[i] = pts[i]
                    if pts[i] > max_v[i]: max_v[i] = pts[i]
        d = [max_v[i] - min_v[i] for i in range(3)]
        print(f"  {f.name} ({count} verts):")
        print(f"    X: [{min_v[0]:.1f}, {max_v[0]:.1f}] (d={d[0]:.1f})")
        print(f"    Y: [{min_v[1]:.1f}, {max_v[1]:.1f}] (d={d[1]:.1f})")
        print(f"    Z: [{min_v[2]:.1f}, {max_v[2]:.1f}] (d={d[2]:.1f})")
