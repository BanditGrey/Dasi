import sys
import math
import struct
from pathlib import Path

WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
sys.path.append(str(WORKSPACE / 'conversions/converters/texture_decoder'))

import bpy
from mathutils import Vector, Matrix, Euler
from bmd_parser import BMDParser, map_file_decrypt
from texture_decoder import decode_ozj_to_jpg, decode_ozt_to_tga

DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"
TEX_OUT = WORKSPACE / "src/client/dev_viewer/models/textures"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"

BMD_TO_ARMATURE = {
    0: 'pelvis',
    1: 'pelvis',
    2: 'pelvis',
    3: 'thigh_l',
    4: 'calf_l',
    5: 'foot_l',
    6: 'ball_l',
    7: 'ball_leaf_l',
    8: 'ball_leaf_l',
    10: 'thigh_r',
    11: 'calf_r',
    12: 'foot_r',
    13: 'ball_r',
    14: 'ball_leaf_r',
    15: 'ball_leaf_r',
    17: 'spine_01',
    18: 'spine_02',
    19: 'neck_01',
    20: 'Head',
    22: 'Head',
    23: 'Head',
    25: 'clavicle_r',
    26: 'upperarm_r',
    27: 'lowerarm_r',
    28: 'hand_r',
    29: 'hand_r',
    30: 'hand_r',
    31: 'hand_r',
    33: 'hand_r',
    34: 'clavicle_l',
    35: 'upperarm_l',
    36: 'lowerarm_l',
    37: 'hand_l',
    38: 'hand_l',
    39: 'hand_l',
    40: 'hand_l',
    42: 'hand_l',
    43: 'spine_02',
    44: 'spine_02',
    45: 'spine_02',
    46: 'spine_02',
    47: 'spine_03',
    48: 'spine_03',
    49: 'spine_03',
    50: 'spine_03',
    51: 'pelvis',
    52: 'pelvis',
    53: 'pelvis',
    54: 'pelvis',
    55: 'pelvis',
}

# Cache de texturas
decoded_textures = {}
def ensure_texture(tex_name):
    clean_stem = Path(tex_name).stem.lower()
    if clean_stem in decoded_textures:
        return decoded_textures[clean_stem]
    search_dirs = [
        TEX_OUT,
        WORKSPACE / "conversions/output/classes/dk",
        DATA_DIR / "Player",
        DATA_DIR / "Item",
    ]
    for d in search_dirs:
        for ext in ['.jpg', '.png', '.tga']:
            f = d / f"{clean_stem}{ext}"
            if f.exists() and f.stat().st_size > 0:
                decoded_textures[clean_stem] = f
                return f
    for d in search_dirs:
        for ext in ['.OZJ', '.ozj', '.OZT', '.ozt']:
            f = d / f"{clean_stem}{ext}"
            if f.exists() and f.stat().st_size > 0:
                if ext.lower() == '.ozj':
                    dst = TEX_OUT / f"{clean_stem}.jpg"
                    decode_ozj_to_jpg(f, dst)
                    decoded_textures[clean_stem] = dst
                    return dst
                elif ext.lower() == '.ozt':
                    dst = TEX_OUT / f"{clean_stem}.tga"
                    decode_ozt_to_tga(f, dst)
                    decoded_textures[clean_stem] = dst
                    return dst
    return None

def create_pbr_material(tex_name, is_alpha=False):
    stem = Path(tex_name).stem.lower()
    mat_key = f"Mat_{stem}"
    if mat_key in bpy.data.materials:
        return bpy.data.materials[mat_key]
    mat = bpy.data.materials.new(name=mat_key)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    tex_path = ensure_texture(tex_name)
    if tex_path and tex_path.exists():
        try:
            img = bpy.data.images.load(str(tex_path))
            tex_node = mat.node_tree.nodes.new(type="ShaderNodeTexImage")
            tex_node.image = img
            mat.node_tree.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
            is_transp = is_alpha or 'wing' in stem
            if is_transp:
                if hasattr(mat, 'blend_method'):
                    mat.blend_method = 'CLIP'
                mat.node_tree.links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])
            else:
                if hasattr(mat, 'blend_method'):
                    mat.blend_method = 'OPAQUE'
        except Exception as e:
            print(f"Erro textura: {e}")
    if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.40
    if 'Metallic' in bsdf.inputs: bsdf.inputs['Metallic'].default_value = 0.20
    return mat

def import_clean_bmd_part(bmd_rel, name, armature, bones_rest_mat):
    fpath = DATA_DIR / bmd_rel
    parser = BMDParser(fpath)
    parser.parse(apply_bones=False)
    
    valid_meshes = [m for m in parser.meshes if not m['texture_name'].lower().startswith('hid')]
    if not valid_meshes: return None
    
    all_verts = []
    all_faces = []
    face_uvs = []
    face_mat_indices = []
    materials = []
    vert_bones = []
    
    vert_offset = 0
    for m in valid_meshes:
        mat = create_pbr_material(m['texture_name'])
        if mat not in materials: materials.append(mat)
        mat_idx = materials.index(mat)
        
        for node, pos in m['raw_verts']:
            # Posição no espaço rest da Armature:
            mat_b = bones_rest_mat.get(node)
            if mat_b is not None:
                tp = mat_b @ Vector((pos[0]*0.01, pos[1]*0.01, pos[2]*0.01, 1.0))
                all_verts.append(tp.to_3d())
            else:
                all_verts.append(Vector((pos[0]*0.01, pos[1]*0.01, pos[2]*0.01)))
            vert_bones.append(node)
            
        for tri in m['triangles']:
            poly = tri['poly']
            v = tri['v']
            t = tri['t']
            all_faces.append((v[0] + vert_offset, v[1] + vert_offset, v[2] + vert_offset))
            face_uvs.append((m['uvs'][t[0]], m['uvs'][t[1]], m['uvs'][t[2]]))
            face_mat_indices.append(mat_idx)
            if poly == 4:
                all_faces.append((v[0] + vert_offset, v[2] + vert_offset, v[3] + vert_offset))
                face_uvs.append((m['uvs'][t[0]], m['uvs'][t[2]], m['uvs'][t[3]]))
                face_mat_indices.append(mat_idx)
        vert_offset += len(m['raw_verts'])
        
    mesh_data = bpy.data.meshes.new(name)
    mesh_data.from_pydata(all_verts, [], all_faces)
    mesh_data.update()
    
    for mat in materials: mesh_data.materials.append(mat)
    for p_idx, p in enumerate(mesh_data.polygons):
        if p_idx < len(face_mat_indices): p.material_index = face_mat_indices[p_idx]
        
    uv_layer = mesh_data.uv_layers.new(name="UVMap")
    uv_data = uv_layer.data
    loop_idx = 0
    for f_uv in face_uvs:
        for uv in f_uv:
            uv_data[loop_idx].uv = uv
            loop_idx += 1
            
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    
    # Adiciona vertex groups canônicos
    arm_bone_names = {b.name for b in armature.data.bones}
    for j, bmd_node in enumerate(vert_bones):
        arm_bone = BMD_TO_ARMATURE.get(bmd_node, 'pelvis')
        if arm_bone in arm_bone_names:
            if arm_bone not in obj.vertex_groups:
                vg = obj.vertex_groups.new(name=arm_bone)
            else:
                vg = obj.vertex_groups[arm_bone]
            vg.add([j], 1.0, 'REPLACE')
            
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = armature
    obj.parent = armature
    return obj

print("Teste de montagem iniciado...")

# 1. Carrega Armature e Animações
bpy.ops.wm.read_factory_settings(use_empty=True)
glb_src = WORKSPACE / "src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"
bpy.ops.import_scene.gltf(filepath=str(glb_src))

armature = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
wep = bpy.data.objects.get('dk_weapon')
wings = bpy.data.objects.get('dk_wings')

# Remove malhas antigas mal-deformadas
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o not in [wep, wings]:
        bpy.data.objects.remove(o, do_unlink=True)

# 2. Carrega matrizes de player.bmd (Action 1)
player_path = DATA_DIR / "Player/player.bmd"
with open(player_path, 'rb') as f: raw_data = f.read()
l_size = struct.unpack('<I', raw_data[4:8])[0]
data = map_file_decrypt(raw_data[8:8+l_size])
ptr = 32
num_meshs, num_bones, num_actions = struct.unpack('<HHH', data[ptr:ptr+6])
ptr += 6
actions_num_keys = []
for _ in range(num_actions):
    num_keys, lock_pos = struct.unpack('<h?', data[ptr:ptr+3])
    ptr += 3
    if lock_pos: ptr += num_keys * 12
    actions_num_keys.append(num_keys)

p = 38
for _ in range(num_actions):
    nk, lp = struct.unpack('<h?', data[p:p+3])
    p += 3
    if lp: p += nk * 12

bones_info = []
for i in range(num_bones):
    dummy = (data[p] != 0); p += 1
    if not dummy:
        b_name = data[p:p+32].decode('latin-1', errors='ignore').rstrip('\x00'); p += 32
        parent = struct.unpack('<h', data[p:p+2])[0]; p += 2
        target_pos = (0,0,0); target_rot = (0,0,0)
        for j in range(num_actions):
            keys = actions_num_keys[j]
            pos_list = [struct.unpack('<3f', data[p+k*12:p+(k+1)*12]) for k in range(keys)]
            p += keys * 12
            rot_list = [struct.unpack('<3f', data[p+k*12:p+(k+1)*12]) for k in range(keys)]
            p += keys * 12
            if j == 1 and keys > 0:
                target_pos = pos_list[0]
                target_rot = rot_list[0]
        bones_info.append({'dummy': False, 'name': b_name, 'parent': parent, 'pos': target_pos, 'rot': target_rot})
    else:
        bones_info.append({'dummy': True, 'name': '', 'parent': -1, 'pos': (0,0,0), 'rot': (0,0,0)})

from bmd_parser import angle_quaternion, quat_matrix, concat_transforms
bone_matrices = [None] * len(bones_info)
for i, b in enumerate(bones_info):
    if b['dummy']: continue
    q = angle_quaternion(b['rot'])
    mat = quat_matrix(q, b['pos'])
    if b['parent'] == -1 or b['parent'] >= len(bone_matrices) or bone_matrices[b['parent']] is None:
        bone_matrices[i] = mat
    else:
        bone_matrices[i] = concat_transforms(bone_matrices[b['parent']], mat)

bones_rest_dict = {}
for i, bm in enumerate(bone_matrices):
    if bm:
        m = Matrix([
            [bm[0][0], bm[0][1], bm[0][2], bm[0][3]*0.01],
            [bm[1][0], bm[1][1], bm[1][2], bm[1][3]*0.01],
            [bm[2][0], bm[2][1], bm[2][2], bm[2][3]*0.01],
            [0, 0, 0, 1]
        ])
        bones_rest_dict[i] = m

# 3. Importa peças de armadura canônica
armor_files = [
    ("Player/HelmMale02.bmd", "Armor_Helm"),
    ("Player/ArmorMale02.bmd", "Armor_Chest"),
    ("Player/PantMale02.bmd", "Armor_Legs"),
    ("Player/GloveMale02.bmd", "Armor_Gloves"),
    ("Player/BootMale02.bmd", "Armor_Boots"),
]

for bmd_rel, name in armor_files:
    import_clean_bmd_part(bmd_rel, name, armature, bones_rest_dict)

# 4. Renderiza testes de caminhada e corrida
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.render.resolution_x = 700
scene.render.resolution_y = 900
scene.render.film_transparent = True

cam_data = bpy.data.cameras.new("HeroCam")
cam_data.lens = 45.0
cam_obj = bpy.data.objects.new("HeroCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (0.0, -3.2, 1.1)
cam_obj.rotation_euler = (1.5708, 0, 0)

for anim_name in ['Idle', 'Walking_A', 'Running_A', '1H_Melee_Attack_Chop']:
    act = bpy.data.actions.get(anim_name)
    if act and armature.animation_data:
        armature.animation_data.action = act
        scene.frame_set(10 if 'Attack' in anim_name or 'Walk' in anim_name or 'Run' in anim_name else 0)
        bpy.context.view_layer.update()
        out_png = PREVIEWS_DIR / f"clean_rig_dk_{anim_name.lower()}.png"
        scene.render.filepath = str(out_png)
        bpy.ops.render.render(write_still=True)
        print(f"Rendered: {out_png}")
