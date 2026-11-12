import sys
from pathlib import Path
sys.path.append('conversions/converters/bmd_to_glb')
from bmd_parser import BMDParser

p = BMDParser(Path('reference/mu_roxgaming_5.2/client/Data/Player/player.bmd'))

# Vamos inspecionar diretamente os frames de ação lendo o player.bmd
with open(p.file_path, 'rb') as f:
    data = f.read()

from bmd_parser import map_file_decrypt
import struct

l_size = struct.unpack('<I', data[4:8])[0]
data = map_file_decrypt(data[8:8+l_size])

ptr = 32
num_meshs, num_bones, num_actions = struct.unpack('<HHH', data[ptr:ptr+6])
ptr += 6

print(f"Bones: {num_bones}, Actions: {num_actions}")

# Pula meshes (num_meshs == 0)
actions_num_keys = []
for _ in range(num_actions):
    num_keys, lock_pos = struct.unpack('<h?', data[ptr:ptr+3])
    ptr += 3
    if lock_pos:
        ptr += num_keys * 12
    actions_num_keys.append(num_keys)

print("Acoes 0..15 num_keys:", actions_num_keys[:15])

# Agora vamos ler os ossos e suas transformacoes por acao
bones_data = []
for i in range(num_bones):
    dummy = (data[ptr] != 0)
    ptr += 1
    if not dummy:
        b_name = data[ptr:ptr+32].decode('latin-1', errors='ignore').rstrip('\x00')
        ptr += 32
        parent = struct.unpack('<h', data[ptr:ptr+2])[0]
        ptr += 2
        
        bone_actions = []
        for j in range(num_actions):
            keys = actions_num_keys[j]
            pos_list = [struct.unpack('<3f', data[ptr+k*12:ptr+(k+1)*12]) for k in range(keys)]
            ptr += keys * 12
            rot_list = [struct.unpack('<3f', data[ptr+k*12:ptr+(k+1)*12]) for k in range(keys)]
            ptr += keys * 12
            if keys > 0:
                bone_actions.append((pos_list[0], rot_list[0]))
            else:
                bone_actions.append(((0,0,0), (0,0,0)))
        bones_data.append({'name': b_name, 'parent': parent, 'actions': bone_actions})
    else:
        bones_data.append({'name': 'dummy', 'parent': -1, 'actions': []})

print("Total bones parsed:", len(bones_data))

# Vamos comparar a ação 0 vs ação 1 (PLAYER_STOP_MALE) vs ação 4 (PLAYER_STOP_SWORD)
for act_idx, act_name in [(0, "PLAYER_SET"), (1, "PLAYER_STOP_MALE"), (2, "PLAYER_STOP_FEMALE"), (4, "PLAYER_STOP_SWORD"), (11, "PLAYER_STOP_FLY")]:
    print(f"\n--- Acao {act_idx}: {act_name} ---")
    for bi in [2, 3, 4, 27, 28, 29, 33, 42]:
        if bi < len(bones_data):
            b = bones_data[bi]
            if b['actions']:
                pos, rot = b['actions'][act_idx]
                print(f"  Bone {bi:02d} ({b['name']}): Pos=({pos[0]:.2f}, {pos[1]:.2f}, {pos[2]:.2f}), Rot=({rot[0]:.2f}, {rot[1]:.2f}, {rot[2]:.2f})")
