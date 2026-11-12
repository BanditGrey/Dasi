import sys
import math
from pathlib import Path
WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
import bpy
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

p = 38
for _ in range(num_actions):
    nk, lp = struct.unpack('<h?', data[p:p+3])
    p += 3
    if lp:
        p += nk * 12

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
            if j == 1 and keys > 0: # Action 1: PLAYER_STOP_MALE
                target_pos = pos_list[0]
                target_rot = rot_list[0]
        bones_info.append({'dummy': False, 'name': b_name, 'parent': parent, 'pos': target_pos, 'rot': target_rot})
    else:
        bones_info.append({'dummy': True, 'name': '', 'parent': -1, 'pos': (0,0,0), 'rot': (0,0,0)})

bone_matrices = [None] * len(bones_info)
for i, b in enumerate(bones_info):
    if b['dummy']:
        continue
    q = angle_quaternion(b['rot'])
    mat = quat_matrix(q, b['pos'])
    if b['parent'] == -1 or b['parent'] >= len(bone_matrices) or bone_matrices[b['parent']] is None:
        bone_matrices[i] = mat
    else:
        bone_matrices[i] = concat_transforms(bone_matrices[b['parent']], mat)

bone_mat = bone_matrices[33] # Bone 33: knife_gdf
bone_pos = Vector((bone_mat[0][3] * 0.01, bone_mat[1][3] * 0.01, bone_mat[2][3] * 0.01))
print(f"Bone 33 pos: {bone_pos}")

parser = BMDParser(DATA_DIR / "Item/Sword02.bmd")
parser.parse(apply_bones=False)

for test_rot in [Euler((math.radians(180),0,0)), Euler((0,0,0)), Euler((0, math.radians(90), 0)), Euler((math.radians(90), 0, 0))]:
    m = bone_mat
    mat_bone = Matrix([
        [m[0][0], m[0][1], m[0][2], bone_pos.x],
        [m[1][0], m[1][1], m[1][2], bone_pos.y],
        [m[2][0], m[2][1], m[2][2], bone_pos.z],
        [0.0, 0.0, 0.0, 1.0]
    ])
    mat_rot = test_rot.to_matrix().to_4x4()
    mat_final = mat_bone @ mat_rot
    
    verts = []
    for mesh in parser.meshes:
        for v in mesh['raw_verts']:
            tv = mat_final @ Vector((v[1][0] * 0.01, v[1][1] * 0.01, v[1][2] * 0.01, 1.0))
            verts.append(tv.to_3d())
            
    min_x = min(v.x for v in verts)
    max_x = max(v.x for v in verts)
    min_y = min(v.y for v in verts)
    max_y = max(v.y for v in verts)
    min_z = min(v.z for v in verts)
    max_z = max(v.z for v in verts)
    print(f"Rot: {test_rot} -> X: [{min_x:.2f}, {max_x:.2f}], Y: [{min_y:.2f}, {max_y:.2f}], Z: [{min_z:.2f}, {max_z:.2f}]")
    print(f"   Delta X: {max_x - min_x:.2f}, Delta Y: {max_y - min_y:.2f}, Delta Z: {max_z - min_z:.2f}")
