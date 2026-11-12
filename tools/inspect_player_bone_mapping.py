import sys
import struct
from pathlib import Path

WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
from bmd_parser import map_file_decrypt

DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"
player_path = DATA_DIR / "Player/player.bmd"
with open(player_path, 'rb') as f:
    raw_data = f.read()

l_size = struct.unpack('<I', raw_data[4:8])[0]
data = map_file_decrypt(raw_data[8:8+l_size])

ptr = 32
num_meshs, num_bones, num_actions = struct.unpack('<HHH', data[ptr:ptr+6])
ptr += 6

actions_num_keys = []
for _ in range(num_actions):
    num_keys, lock_pos = struct.unpack('<h?', data[ptr:ptr+3])
    ptr += 3
    if lock_pos:
        ptr += num_keys * 12
    actions_num_keys.append(num_keys)

p = 38
for _ in range(num_actions):
    nk, lp = struct.unpack('<h?', data[p:p+3])
    p += 3
    if lp: p += nk * 12

for i in range(num_bones):
    dummy = (data[p] != 0)
    p += 1
    if not dummy:
        b_name = data[p:p+32].decode('latin-1', errors='ignore').rstrip('\x00')
        p += 32
        parent = struct.unpack('<h', data[p:p+2])[0]
        p += 2
        for j in range(num_actions):
            keys = actions_num_keys[j]
            p += keys * 24
        print(f"Bone {i:02d}: {b_name} (parent={parent})")
    else:
        print(f"Bone {i:02d}: [DUMMY]")
