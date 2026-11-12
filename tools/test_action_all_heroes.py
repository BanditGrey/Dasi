import sys
import os
import math
import struct
from pathlib import Path

WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
sys.path.append(str(WORKSPACE / 'conversions/converters/texture_decoder'))

import bpy
from mathutils import Vector, Matrix, Euler
from bmd_parser import BMDParser, transform_pos, map_file_decrypt, angle_quaternion, quat_matrix, concat_transforms

DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"
PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

# 1. Carrega player.bmd
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

# Função para extrair bone_matrices de qualquer ação
def get_bone_matrices_for_action(action_idx, frame_idx=0):
    cur_ptr = 38 + (num_actions * 3)
    # Se lock_pos houver deslocamento
    # Vamos recalcular o offset exato
    p = 38
    for _ in range(num_actions):
        nk, lp = struct.unpack('<h?', data[p:p+3])
        p += 3
        if lp:
            p += nk * 12
    
    bones = []
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
                if j == action_idx and keys > 0:
                    f_idx = min(frame_idx, keys - 1)
                    target_pos = pos_list[f_idx]
                    target_rot = rot_list[f_idx]
            bones.append({'dummy': False, 'name': b_name, 'parent': parent, 'pos': target_pos, 'rot': target_rot})
        else:
            bones.append({'dummy': True, 'name': '', 'parent': -1, 'pos': (0,0,0), 'rot': (0,0,0)})

    bone_matrices = [None] * len(bones)
    for i, b in enumerate(bones):
        if b['dummy']:
            continue
        q = angle_quaternion(b['rot'])
        mat = quat_matrix(q, b['pos'])
        if b['parent'] == -1 or b['parent'] >= len(bone_matrices) or bone_matrices[b['parent']] is None:
            bone_matrices[i] = mat
        else:
            bone_matrices[i] = concat_transforms(bone_matrices[b['parent']], mat)
    return bone_matrices

# Mapeamento canônico das matrizes por ação
mat_male = get_bone_matrices_for_action(1)   # PLAYER_STOP_MALE (DK, DW, MG, DL)
mat_female = get_bone_matrices_for_action(2) # PLAYER_STOP_FEMALE (ELF)

print("Matrizes calculadas com sucesso para Male (Ação 1) e Female (Ação 2)!")
