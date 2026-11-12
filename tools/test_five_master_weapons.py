import sys
import math
from pathlib import Path
WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
from mathutils import Vector, Matrix, Euler
from bmd_parser import BMDParser, transform_pos, map_file_decrypt, angle_quaternion, quat_matrix, concat_transforms
import struct

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

def get_transforms(act_idx):
    p = 38
    for _ in range(num_actions):
        nk, lp = struct.unpack('<h?', data[p:p+3])
        p += 3
        if lp: p += nk * 12
    bones_info = []
    for i in range(num_bones):
        dummy = (data[p] != 0)
        p += 1
        if not dummy:
            b_name = data[p:p+32].decode('latin-1', errors='ignore').rstrip('\x00')
            p += 32
            parent = struct.unpack('<h', data[p:p+2])[0]
            p += 2
            target_pos = (0.0, 0.0, 0.0)
            target_rot = (0.0, 0.0, 0.0)
            for j in range(num_actions):
                keys = actions_num_keys[j]
                pos_list = [struct.unpack('<3f', data[p+k*12:p+(k+1)*12]) for k in range(keys)]
                p += keys * 12
                rot_list = [struct.unpack('<3f', data[p+k*12:p+(k+1)*12]) for k in range(keys)]
                p += keys * 12
                if j == act_idx and keys > 0:
                    target_pos = pos_list[0]
                    target_rot = rot_list[0]
            bones_info.append({'dummy': False, 'name': b_name, 'parent': parent, 'pos': target_pos, 'rot': target_rot})
        else:
            bones_info.append({'dummy': True, 'name': '', 'parent': -1, 'pos': (0,0,0), 'rot': (0,0,0)})
    bone_matrices = [None] * len(bones_info)
    for i, b in enumerate(bones_info):
        if b['dummy']: continue
        q = angle_quaternion(b['rot'])
        mat = quat_matrix(q, b['pos'])
        if b['parent'] == -1 or b['parent'] >= len(bone_matrices) or bone_matrices[b['parent']] is None:
            bone_matrices[i] = mat
        else:
            bone_matrices[i] = concat_transforms(bone_matrices[b['parent']], mat)
    return bone_matrices

mat_male = get_transforms(1)
mat_female = get_transforms(2)

def test_wep(bmd_file, bone_idx, is_female, rot_euler, loc_offset=Vector((0,0,0))):
    bone_m = mat_female[bone_idx] if is_female else mat_male[bone_idx]
    bone_p = Vector((bone_m[0][3] * 0.01, bone_m[1][3] * 0.01, bone_m[2][3] * 0.01))
    mat_b = Matrix([
        [bone_m[0][0], bone_m[0][1], bone_m[0][2], bone_p.x],
        [bone_m[1][0], bone_m[1][1], bone_m[1][2], bone_p.y],
        [bone_m[2][0], bone_m[2][1], bone_m[2][2], bone_p.z],
        [0.0, 0.0, 0.0, 1.0]
    ])
    mat_final = mat_b @ Matrix.Translation(loc_offset) @ rot_euler.to_matrix().to_4x4()
    p = BMDParser(DATA_DIR / bmd_file)
    p.parse(apply_bones=False)
    verts = []
    for mesh in p.meshes:
        for v in mesh['raw_verts']:
            tv = mat_final @ Vector((v[1][0] * 0.01, v[1][1] * 0.01, v[1][2] * 0.01, 1.0))
            verts.append(tv.to_3d())
    min_z = min(v.z for v in verts)
    max_z = max(v.z for v in verts)
    min_x = min(v.x for v in verts)
    max_x = max(v.x for v in verts)
    min_y = min(v.y for v in verts)
    max_y = max(v.y for v in verts)
    return (min_x, max_x), (min_y, max_y), (min_z, max_z)

# DK
print("DK Sword02 (R):", test_wep("Item/Sword02.bmd", 33, False, Euler((0,0,0))))
print("DK Sword01 (L):", test_wep("Item/Sword01.bmd", 42, False, Euler((0,0,0))))

# DW
print("DW Staff05 (R):", test_wep("Item/Staff05.bmd", 33, False, Euler((0,0,0))))

# ELF
print("ELF Bow04 (L) rot_y90_z90:", test_wep("Item/Bow04.bmd", 42, True, Euler((0, math.radians(90), math.radians(90)))))
print("ELF Bow04 (L) rot_180_z90:", test_wep("Item/Bow04.bmd", 42, True, Euler((math.radians(180), 0, math.radians(90)))))
print("ELF Bow04 (L) identity:", test_wep("Item/Bow04.bmd", 42, True, Euler((0,0,0))))

# MG
print("MG Sword13 (R) +0.40m:", test_wep("Item/Sword13.bmd", 33, False, Euler((0,0,0)), Vector((0,0,0.40))))
print("MG Sword11 (L):", test_wep("Item/Sword11.bmd", 42, False, Euler((0,0,0))))

# DL
print("DL Mace08 (R) rot_y_neg90:", test_wep("Item/Mace08.bmd", 33, False, Euler((0, math.radians(-90), 0))))
