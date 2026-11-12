#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path("conversions/converters/bmd_to_glb")))
from bmd_parser import BMDParser

p = BMDParser("reference/mu_roxgaming_5.2/client/Data/Player/player.bmd")
p.parse(apply_bones=False)
print(f"Total bones in player.bmd: {len(p.bones)}")
for i, b in enumerate(p.bones):
    name = b['name']
    parent = b['parent']
    dummy = b['dummy']
    print(f"[{i:02d}] parent={parent:02d} dummy={dummy} name='{name}'")
