#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path("conversions/converters/bmd_to_glb")))
from bmd_parser import BMDParser, angle_quaternion, quat_matrix, concat_transforms
import struct

WORKSPACE = Path("D:/Dasi")
DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"

with open(DATA_DIR / "Player/player.bmd", 'rb') as f:
    raw = f.read()

from bmd_parser import map_file_decrypt
l_size = struct.unpack('<I', raw[4:8])[0]
data = map_file_decrypt(raw[8:8+l_size])

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

def get_bone_matrix(action_idx, frame_idx=0):
    p = 38
    for _ in range(num_actions):
        nk, lp = struct.unpack('<h?', data[p:p+3])
        p += 3
        if lp: p += nk * 12
    bones = []
    for i in range(num_bones):
        dummy = (data[p] != 0); p += 1
        if not dummy:
            b_name = data[p:p+32].decode('latin-1', errors='ignore').rstrip('\x00'); p += 32
            parent = struct.unpack('<h', data[p:p+2])[0]; p += 2
            pos = (0,0,0); rot = (0,0,0)
            for j in range(num_actions):
                keys = actions_num_keys[j]
                pos_list = [struct.unpack('<3f', data[p+k*12:p+(k+1)*12]) for k in range(keys)]
                p += keys * 12
                rot_list = [struct.unpack('<3f', data[p+k*12:p+(k+1)*12]) for k in range(keys)]
                p += keys * 12
                if j == action_idx and keys > 0:
                    f = min(frame_idx, keys - 1)
                    pos = pos_list[f]; rot = rot_list[f]
            bones.append({'dummy': False, 'name': b_name, 'parent': parent, 'pos': pos, 'rot': rot})
        else:
            bones.append({'dummy': True, 'name': '', 'parent': -1, 'pos': (0,0,0), 'rot': (0,0,0)})
            
    mats = [None] * len(bones)
    for i, b in enumerate(bones):
        if b['dummy']: continue
        q = angle_quaternion(b['rot'])
        m = quat_matrix(q, b['pos'])
        if b['parent'] == -1 or mats[b['parent']] is None:
            mats[i] = m
        else:
            mats[i] = concat_transforms(mats[b['parent']], m)
    return bones, mats

# Inspect Bone 33 (knife_gdf) and Bone 42 (hand_bofdgne01) across actions:
# Action 1: PLAYER_STOP_MALE
# Action 4: PLAYER_STOP_SWORD
# Action 5: PLAYER_STOP_TWO_HAND_SWORD
# Action 8: PLAYER_STOP_BOW
# Action 10: PLAYER_STOP_WAND
actions_to_check = [
    (1, "PLAYER_STOP_MALE (Ação 1)"),
    (4, "PLAYER_STOP_SWORD (Ação 4)"),
    (5, "PLAYER_STOP_TWO_HAND_SWORD (Ação 5)"),
    (8, "PLAYER_STOP_BOW (Ação 8)"),
    (10, "PLAYER_STOP_WAND (Ação 10)"),
    (41, "PLAYER_ATTACK_SWORD_RIGHT1 (Ação 41)"),
    (69, "PLAYER_ATTACK_SKILL_WHEEL (Ação 69)"),
]

print("=" * 75)
print("INSPECTION OF WEAPON SOCKET BONES IN PLAYER.BMD")
print("=" * 75)
for a_idx, a_name in actions_to_check:
    bones, mats = get_bone_matrix(a_idx)
    m33 = mats[33]
    m42 = mats[42]
    print(f"\n>>> {a_name} (Keys: {actions_num_keys[a_idx]}) <<<")
    if m33:
        pos33 = (m33[0][3], m33[1][3], m33[2][3])
        print(f"  Bone 33 (knife_gdf - Right Socket): Pos=({pos33[0]:.2f}, {pos33[1]:.2f}, {pos33[2]:.2f})")
        print(f"    Basis X: ({m33[0][0]:.2f}, {m33[1][0]:.2f}, {m33[2][0]:.2f})")
        print(f"    Basis Y: ({m33[0][1]:.2f}, {m33[1][1]:.2f}, {m33[2][1]:.2f})")
        print(f"    Basis Z: ({m33[0][2]:.2f}, {m33[1][2]:.2f}, {m33[2][2]:.2f})")
    if m42:
        pos42 = (m42[0][3], m42[1][3], m42[2][3])
        print(f"  Bone 42 (hand_bofdgne01 - Left Socket): Pos=({pos42[0]:.2f}, {pos42[1]:.2f}, {pos42[2]:.2f})")
        print(f"    Basis X: ({m42[0][0]:.2f}, {m42[1][0]:.2f}, {m42[2][0]:.2f})")
        print(f"    Basis Y: ({m42[0][1]:.2f}, {m42[1][1]:.2f}, {m42[2][1]:.2f})")
        print(f"    Basis Z: ({m42[0][2]:.2f}, {m42[1][2]:.2f}, {m42[2][2]:.2f})")
