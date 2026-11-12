import sys, struct
from pathlib import Path
sys.path.append('conversions/converters/bmd_to_glb')
from bmd_parser import map_file_decrypt

data_dir = Path("reference/mu_roxgaming_5.2/client/Data")
with open(data_dir / "Player/player.bmd", 'rb') as f:
    raw = f.read()
l_size = struct.unpack('<I', raw[4:8])[0]
data = map_file_decrypt(raw[8:8+l_size])

ptr = 32
num_meshs, num_bones, num_actions = struct.unpack('<HHH', data[ptr:ptr+6])
ptr += 6

actions_num_keys = []
for _ in range(num_actions):
    num_keys, lock_pos = struct.unpack('<h?', data[ptr:ptr+3])
    ptr += 3
    if lock_pos: ptr += num_keys * 12
    actions_num_keys.append(num_keys)

for i in range(num_bones):
    dummy = (data[ptr] != 0); ptr += 1
    if not dummy:
        b_name = data[ptr:ptr+32].decode('latin-1', errors='ignore').rstrip('\x00')
        ptr += 32
        parent = struct.unpack('<h', data[ptr:ptr+2])[0]; ptr += 2
        for j in range(num_actions):
            keys = actions_num_keys[j]
            ptr += keys * 24
        print(f"[{i:02d}] '{b_name}' (parent: {parent})")
    else:
        print(f"[{i:02d}] <DUMMY>")
