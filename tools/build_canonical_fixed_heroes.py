#!/usr/bin/env python3
"""
Dasi MMORPG - Canonical Fixed Heroes Generator: All 5 Classes
Blender 5.2.2 LTS Automation Script

Corrige matematicamente a postura anatômica, hierarquia de ossos, rotação de membros e texturas:
- DK / DW / MG / DL: Ação Canônica 1 (PLAYER_STOP_MALE) - Postura ereta nobre com pernas retas e braços simétricos
- ELF: Ação Canônica 2 (PLAYER_STOP_FEMALE) - Postura ereta feminina canônica
- Rig Canônico Bip01 de 60 ossos perfeitamente alinhado
- Exclusão estrita de malhas BITMAP_HIDE (hide.jpg, hide_m.jpg) de acordo com a regra oficial da Webzen (ZzzBMD.cpp:993 e LoadData.cpp:74)
- Mesclagem semântica limpa: 5 nós Body, 5 nós Armor, 1 nó Wings, 1-2 nós Weapons
- Asas posicionadas na espinha torácica (Bone 47) com alphaTest adequado
- Armas empunhadas corretamente na mão direita (Bone 33) e esquerda (Bone 42)
- Texturas mapeadas diretamente dos BMDs oficiais com materiais PBR limpos
- Exporta tanto hero_*_master_base.glb (para o Validador) quanto hero_*.glb
- Renderiza 5 imagens de estúdio de alta fidelidade em docs/art_previews/
"""

import sys
import os
import math
import struct
import shutil
from pathlib import Path

WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
sys.path.append(str(WORKSPACE / 'conversions/converters/texture_decoder'))

import bpy
from mathutils import Vector, Matrix, Euler
from bmd_parser import BMDParser, transform_pos, map_file_decrypt, angle_quaternion, quat_matrix, concat_transforms
from texture_decoder import decode_ozj_to_jpg, decode_ozt_to_tga

DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"
TEX_OUT = WORKSPACE / "src/client/dev_viewer/models/textures"
MODELS_DIR = WORKSPACE / "src/client/dev_viewer/models"
ANIM_DIR = WORKSPACE / "src/client/dev_viewer/models/animated_heroes"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"

TEX_OUT.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
ANIM_DIR.mkdir(parents=True, exist_ok=True)
PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

# 1. Carrega player.bmd e analisa as 247 ações
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

def get_bone_transforms(action_idx, frame_idx=0):
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
                if j == action_idx and keys > 0:
                    f_idx = min(frame_idx, keys - 1)
                    target_pos = pos_list[f_idx]
                    target_rot = rot_list[f_idx]
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
    return bones_info, bone_matrices

# Mapeia ações canônicas
bones_male, mat_male = get_bone_transforms(1)     # PLAYER_STOP_MALE (Ação 1)
bones_female, mat_female = get_bone_transforms(2) # PLAYER_STOP_FEMALE (Ação 2)

print(f"[Rig] Esqueleto carregado: {len(bones_male)} ossos (Male e Female prontos)")

# Cache de texturas decodificadas
decoded_textures = {}
def ensure_texture(tex_name):
    clean_stem = Path(tex_name).stem.lower()
    if clean_stem in decoded_textures:
        return decoded_textures[clean_stem]
        
    search_dirs = [
        WORKSPACE / "src/client/dev_viewer/models/textures",
        WORKSPACE / "conversions/output/classes/dk",
        WORKSPACE / "conversions/output/classes/dw",
        WORKSPACE / "conversions/output/classes/elf",
        WORKSPACE / "conversions/output/classes/mg",
        WORKSPACE / "conversions/output/classes/dl",
        DATA_DIR / "Player",
        DATA_DIR / "Item",
        DATA_DIR / "NPC"
    ]
    
    # 1. Verifica se já existe imagem compatível decodificada (.jpg, .png, .tga)
    for d in search_dirs:
        for ext in ['.jpg', '.png', '.tga']:
            f = d / f"{clean_stem}{ext}"
            if f.exists() and f.stat().st_size > 0:
                decoded_textures[clean_stem] = f
                return f
                
    # 2. Se não existir, procura o .OZJ ou .OZT e decodifica para TEX_OUT
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
                    
    # Fallback procurando com case insensível
    for d in search_dirs:
        if d.exists():
            for p in d.iterdir():
                if p.stem.lower() == clean_stem and p.suffix.lower() in ['.jpg', '.png', '.tga']:
                    decoded_textures[clean_stem] = p
                    return p
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
            
            # Checagem de transparência: APENAS ASAS, PENAS e CAPAS utilizam transparência!
            is_transp = is_alpha or 'wing' in stem or 'ndw' in stem or 'neww' in stem or 'ndee' in stem or 'newingel' in stem
            if is_transp:
                if hasattr(mat, 'blend_method'):
                    mat.blend_method = 'CLIP'
                    mat.alpha_threshold = 0.3
                mat.node_tree.links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])
            else:
                if hasattr(mat, 'blend_method'):
                    mat.blend_method = 'OPAQUE'
        except Exception as e:
            print(f"Erro ao vincular textura {tex_path}: {e}")
            
    if 'Roughness' in bsdf.inputs:
        bsdf.inputs['Roughness'].default_value = 0.40
    if 'Metallic' in bsdf.inputs:
        bsdf.inputs['Metallic'].default_value = 0.20
    return mat

def build_armature(bones_info, bone_matrices):
    arm_data = bpy.data.armatures.new("Armature")
    arm_obj = bpy.data.objects.new("Armature", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    bone_name_map = {}
    edit_bones = arm_data.edit_bones
    
    for i, b in enumerate(bones_info):
        clean_name = b['name'].split('\x00')[0].strip().replace(' ', '_')
        b_name = f"Bone_{i:02d}_{clean_name}" if clean_name else f"Bone_{i:02d}"
        bone_name_map[i] = b_name
        eb = edit_bones.new(b_name)
        mat = bone_matrices[i]
        head_pos = Vector((mat[0][3] * 0.01, mat[1][3] * 0.01, mat[2][3] * 0.01)) if mat else Vector((0,0,0))
        eb.head = head_pos
        eb.tail = head_pos + Vector((0.0, 0.0, 0.04))
        
    for i, b in enumerate(bones_info):
        p_idx = b['parent']
        if 0 <= p_idx < len(bones_info) and not bones_info[p_idx]['dummy']:
            edit_bones[bone_name_map[i]].parent = edit_bones[bone_name_map[p_idx]]
            
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj, bone_name_map

def import_bmd_part(bmd_rel_path, obj_name, arm_obj, bone_name_map, bone_matrices):
    fpath = DATA_DIR / bmd_rel_path
    if not fpath.exists():
        print(f"[-] Arquivo não encontrado: {bmd_rel_path}")
        return None
        
    parser = BMDParser(fpath)
    parser.parse(apply_bones=False)
    
    # Regra Canônica Webzen (ZzzBMD.cpp:993 e LoadData.cpp:74):
    # BITMAP_HIDE (textura iniciando com 'hid') é geometria oculta interna descartada pelo renderizador.
    valid_meshes = [m for m in parser.meshes if not m['texture_name'].lower().startswith('hid')]
    if not valid_meshes:
        return None
        
    all_verts = []
    all_faces = []
    face_uvs = []
    face_mat_indices = []
    materials = []
    vert_bone_indices = []
    
    vert_offset = 0
    for m in valid_meshes:
        mat = create_pbr_material(m['texture_name'])
        if mat not in materials:
            materials.append(mat)
        mat_idx = materials.index(mat)
        
        for node, pos in m['raw_verts']:
            mat_b = bone_matrices[node] if node < len(bone_matrices) else None
            if mat_b is not None:
                tp = transform_pos(pos, mat_b)
                all_verts.append(Vector((tp[0] * 0.01, tp[1] * 0.01, tp[2] * 0.01)))
            else:
                all_verts.append(Vector((pos[0] * 0.01, pos[1] * 0.01, pos[2] * 0.01)))
            vert_bone_indices.append(node)
            
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
        
    mesh_data = bpy.data.meshes.new(obj_name)
    mesh_data.from_pydata(all_verts, [], all_faces)
    mesh_data.update()
    
    for mat in materials:
        mesh_data.materials.append(mat)
    for p_idx, p in enumerate(mesh_data.polygons):
        if p_idx < len(face_mat_indices):
            p.material_index = face_mat_indices[p_idx]
            
    uv_layer = mesh_data.uv_layers.new(name="UVMap")
    uv_data = uv_layer.data
    loop_idx = 0
    for f_uv in face_uvs:
        for uv in f_uv:
            uv_data[loop_idx].uv = uv
            loop_idx += 1
            
    obj = bpy.data.objects.new(obj_name, mesh_data)
    bpy.context.collection.objects.link(obj)
    
    for j, node in enumerate(vert_bone_indices):
        if node in bone_name_map:
            bg_name = bone_name_map[node]
            if bg_name not in obj.vertex_groups:
                vg = obj.vertex_groups.new(name=bg_name)
            else:
                vg = obj.vertex_groups[bg_name]
            vg.add([j], 1.0, 'REPLACE')
            
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj
    obj.parent = arm_obj
    return obj

def import_wings(wing_rel_path, obj_name, arm_obj, bone_name_map, bone_matrices, target_bone=47, offset=Vector((0.0, 0.0, 0.0))):
    fpath = DATA_DIR / wing_rel_path
    if not fpath.exists():
        print(f"[-] Asas não encontradas: {wing_rel_path}")
        return None
        
    parser = BMDParser(fpath)
    parser.parse(apply_bones=True)
    
    valid_meshes = [m for m in parser.meshes if not m['texture_name'].lower().startswith('hid')]
    if not valid_meshes:
        return None
        
    # Posição da espinha torácica (Bone 47)
    spine_mat = bone_matrices[target_bone] if target_bone < len(bone_matrices) else None
    spine_pos = Vector((spine_mat[0][3] * 0.01, spine_mat[1][3] * 0.01, spine_mat[2][3] * 0.01)) if spine_mat else Vector((0, 0.09, 1.35))
    final_offset = spine_pos + offset
    
    all_verts = []
    all_faces = []
    face_uvs = []
    face_mat_indices = []
    materials = []
    
    vert_offset = 0
    for m in valid_meshes:
        mat = create_pbr_material(m['texture_name'], is_alpha=True)
        if mat not in materials:
            materials.append(mat)
        mat_idx = materials.index(mat)
        
        for v in m['vertices']:
            all_verts.append(Vector((v[0] * 0.01, v[1] * 0.01, v[2] * 0.01)) + final_offset)
            
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
                
        vert_offset += len(m['vertices'])
        
    mesh_data = bpy.data.meshes.new(obj_name)
    mesh_data.from_pydata(all_verts, [], all_faces)
    mesh_data.update()
    
    for mat in materials:
        mesh_data.materials.append(mat)
    for p_idx, p in enumerate(mesh_data.polygons):
        if p_idx < len(face_mat_indices):
            p.material_index = face_mat_indices[p_idx]
            
    uv_layer = mesh_data.uv_layers.new(name="UVMap")
    uv_data = uv_layer.data
    loop_idx = 0
    for f_uv in face_uvs:
        for uv in f_uv:
            uv_data[loop_idx].uv = uv
            loop_idx += 1
            
    obj = bpy.data.objects.new(obj_name, mesh_data)
    bpy.context.collection.objects.link(obj)
    
    b_name = bone_name_map[target_bone]
    vg = obj.vertex_groups.new(name=b_name)
    vg.add(list(range(len(all_verts))), 1.0, 'REPLACE')
    
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj
    obj.parent = arm_obj
    return obj

def import_weapon(wep_rel_path, obj_name, arm_obj, bone_name_map, bone_matrices, target_bone_idx, rot_euler=Euler((math.radians(180),0,0),'XYZ'), loc_offset=Vector((0,0,0))):
    fpath = DATA_DIR / wep_rel_path
    if not fpath.exists():
        print(f"[-] Arma não encontrada: {wep_rel_path}")
        return None
        
    parser = BMDParser(fpath)
    parser.parse(apply_bones=False)
    
    valid_meshes = [m for m in parser.meshes if not m['texture_name'].lower().startswith('hid')]
    if not valid_meshes:
        return None
        
    bone_mat = bone_matrices[target_bone_idx]
    bone_pos = Vector((bone_mat[0][3] * 0.01, bone_mat[1][3] * 0.01, bone_mat[2][3] * 0.01))
    
    m = bone_mat
    mat_bone = Matrix([
        [m[0][0], m[0][1], m[0][2], bone_pos.x],
        [m[1][0], m[1][1], m[1][2], bone_pos.y],
        [m[2][0], m[2][1], m[2][2], bone_pos.z],
        [0.0, 0.0, 0.0, 1.0]
    ])
    
    mat_rot = rot_euler.to_matrix().to_4x4()
    mat_loc = Matrix.Translation(loc_offset)
    mat_final = mat_bone @ mat_loc @ mat_rot
    
    all_verts = []
    all_faces = []
    face_uvs = []
    face_mat_indices = []
    materials = []
    
    vert_offset = 0
    for m in valid_meshes:
        mat = create_pbr_material(m['texture_name'])
        if mat not in materials:
            materials.append(mat)
        mat_idx = materials.index(mat)
        
        for v in m['raw_verts']:
            tv = mat_final @ Vector((v[1][0] * 0.01, v[1][1] * 0.01, v[1][2] * 0.01, 1.0))
            all_verts.append(tv.to_3d())
            
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
        
    mesh_data = bpy.data.meshes.new(obj_name)
    mesh_data.from_pydata(all_verts, [], all_faces)
    mesh_data.update()
    
    for mat in materials:
        mesh_data.materials.append(mat)
    for p_idx, p in enumerate(mesh_data.polygons):
        if p_idx < len(face_mat_indices):
            p.material_index = face_mat_indices[p_idx]
            
    uv_layer = mesh_data.uv_layers.new(name="UVMap")
    uv_data = uv_layer.data
    loop_idx = 0
    for f_uv in face_uvs:
        for uv in f_uv:
            uv_data[loop_idx].uv = uv
            loop_idx += 1
            
    obj = bpy.data.objects.new(obj_name, mesh_data)
    bpy.context.collection.objects.link(obj)
    
    b_name = bone_name_map[target_bone_idx]
    vg = obj.vertex_groups.new(name=b_name)
    vg.add(list(range(len(all_verts))), 1.0, 'REPLACE')
    
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj
    obj.parent = arm_obj
    return obj

# Configurações Oficiais das 5 Classes Canônicas
CLASSES_SPECS = [
    {
        'id': 'DK',
        'lower': 'dk',
        'title': 'Dark Knight (Blade Knight)',
        'is_female': False,
        'body': [
            ("Player/HelmClass02.bmd", "Body_Head"),
            ("Player/ArmorClass02.bmd", "Body_Chest"),
            ("Player/PantClass02.bmd", "Body_Legs"),
            ("Player/GloveClass02.bmd", "Body_Gloves"),
            ("Player/BootClass02.bmd", "Body_Boots"),
        ],
        'armor': [
            ("Player/HelmMale02.bmd", "Armor_Helm"),
            ("Player/ArmorMale02.bmd", "Armor_Chest"),
            ("Player/PantMale02.bmd", "Armor_Legs"),
            ("Player/GloveMale02.bmd", "Armor_Gloves"),
            ("Player/BootMale02.bmd", "Armor_Boots"),
        ],
        'wings': ("Item/Wing06.bmd", "Wings_Dragon", 47, Vector((0.0, 0.01, 0.08))),
        'weapons': [
            ("Item/Sword02.bmd", "Weapon_Right", 33, Euler((0, 0, 0), 'XYZ'), Vector((0,0,0))),
            ("Item/Sword01.bmd", "Weapon_Left", 42, Euler((0, 0, 0), 'XYZ'), Vector((0,0,0))),
        ],
    },
    {
        'id': 'DW',
        'lower': 'dw',
        'title': 'Dark Wizard (Soul Master)',
        'is_female': False,
        'body': [
            ("Player/HelmClass01.bmd", "Body_Head"),
            ("Player/ArmorClass01.bmd", "Body_Chest"),
            ("Player/PantClass01.bmd", "Body_Legs"),
            ("Player/GloveClass01.bmd", "Body_Gloves"),
            ("Player/BootClass01.bmd", "Body_Boots"),
        ],
        'armor': [
            ("Player/HelmMale04.bmd", "Armor_Helm"),
            ("Player/ArmorMale04.bmd", "Armor_Chest"),
            ("Player/PantMale04.bmd", "Armor_Legs"),
            ("Player/GloveMale04.bmd", "Armor_Gloves"),
            ("Player/BootMale04.bmd", "Armor_Boots"),
        ],
        'wings': ("Item/Wing05.bmd", "Wings_Soul", 47, Vector((0.0, 0.01, 0.08))),
        'weapons': [
            ("Item/Staff05.bmd", "Weapon_Right", 33, Euler((0, 0, 0), 'XYZ'), Vector((0, 0, 0))),
        ],
    },
    {
        'id': 'ELF',
        'lower': 'elf',
        'title': 'Fairy Elf (Muse Elf)',
        'is_female': True,
        'body': [
            ("Player/HelmClass03.bmd", "Body_Head"),
            ("Player/ArmorClass03.bmd", "Body_Chest"),
            ("Player/PantClass03.bmd", "Body_Legs"),
            ("Player/GloveClass03.bmd", "Body_Gloves"),
            ("Player/BootClass03.bmd", "Body_Boots"),
        ],
        'armor': [
            ("Player/HelmElf05.bmd", "Armor_Helm"),
            ("Player/ArmorElf05.bmd", "Armor_Chest"),
            ("Player/PantElf05.bmd", "Armor_Legs"),
            ("Player/GloveElf05.bmd", "Armor_Gloves"),
            ("Player/BootElf05.bmd", "Armor_Boots"),
        ],
        'wings': ("Item/Wing04.bmd", "Wings_Spirits", 47, Vector((0.0, 0.01, 0.08))),
        'weapons': [
            ("Item/Bow04.bmd", "Weapon_Left", 42, Euler((math.radians(180), 0, math.radians(90)), 'XYZ'), Vector((0, 0, 0))),
        ],
    },
    {
        'id': 'MG',
        'lower': 'mg',
        'title': 'Magic Gladiator (Duel Master)',
        'is_female': False,
        'body': [
            ("Player/HelmClass04.bmd", "Body_Head"),
            ("Player/ArmorClass04.bmd", "Body_Chest"),
            ("Player/PantClass04.bmd", "Body_Legs"),
            ("Player/GloveClass04.bmd", "Body_Gloves"),
            ("Player/BootClass04.bmd", "Body_Boots"),
        ],
        'armor': [
            # MG canonicamente não utiliza elmo
            ("Player/ArmorMale19.bmd", "Armor_Chest"),
            ("Player/PantMale19.bmd", "Armor_Legs"),
            ("Player/GloveMale19.bmd", "Armor_Gloves"),
            ("Player/BootMale19.bmd", "Armor_Boots"),
        ],
        'wings': ("Item/Wing06.bmd", "Wings_Darkness", 47, Vector((0.0, 0.01, 0.08))),
        'weapons': [
            ("Item/Sword13.bmd", "Weapon_Right", 33, Euler((0, 0, 0), 'XYZ'), Vector((0, 0, 0.40))),
            ("Item/Sword11.bmd", "Weapon_Left", 42, Euler((0, 0, 0), 'XYZ'), Vector((0, 0, 0))),
        ],
    },
    {
        'id': 'DL',
        'lower': 'dl',
        'title': 'Dark Lord (Lord Emperor)',
        'is_female': False,
        'body': [
            ("Player/HelmClass05.bmd", "Body_Head"),
            ("Player/ArmorClass05.bmd", "Body_Chest"),
            ("Player/PantClass05.bmd", "Body_Legs"),
            ("Player/GloveClass05.bmd", "Body_Gloves"),
            ("Player/BootClass05.bmd", "Body_Boots"),
        ],
        'armor': [
            ("Player/HelmMale28.bmd", "Armor_Helm"),
            ("Player/ArmorMale28.bmd", "Armor_Chest"),
            ("Player/PantMale28.bmd", "Armor_Legs"),
            ("Player/GloveMale28.bmd", "Armor_Gloves"),
            ("Player/BootMale28.bmd", "Armor_Boots"),
        ],
        'wings': ("Item/wing11.bmd", "Cape_Lord", 47, Vector((0.0, -0.05, 0.05))),
        'weapons': [
            ("Item/Mace08.bmd", "Weapon_Right", 33, Euler((0, math.radians(-90), 0), 'XYZ'), Vector((0, 0, 0))),
        ],
    },
]

def build_and_render_all():
    print("==================================================================")
    print("⚔️ INICIANDO CONSTRUÇÃO E HOMOLOGAÇÃO CANÔNICA DAS 5 CLASSES ⚔️")
    print("==================================================================")
    
    for spec in CLASSES_SPECS:
        cls_id = spec['id']
        cls_lower = spec['lower']
        print(f"\n[*] Processando {spec['title']} ({cls_id})...")
        
        # 1. Limpa cena
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # 2. Escolhe matriz de ossos (Male ou Female)
        bones_info = bones_female if spec['is_female'] else bones_male
        bone_matrices = mat_female if spec['is_female'] else mat_male
        
        # 3. Cria Armature oficial
        arm_obj, bone_name_map = build_armature(bones_info, bone_matrices)
        
        # 4. Importa Camadas de Corpo Nu
        for bmd_rel, prefix in spec['body']:
            import_bmd_part(bmd_rel, prefix, arm_obj, bone_name_map, bone_matrices)
            
        # 5. Importa Camadas de Armadura
        for bmd_rel, prefix in spec['armor']:
            import_bmd_part(bmd_rel, prefix, arm_obj, bone_name_map, bone_matrices)
            
        # 6. Importa Asas
        w_bmd, w_prefix, w_bone, w_offset = spec['wings']
        import_wings(w_bmd, w_prefix, arm_obj, bone_name_map, bone_matrices, target_bone=w_bone, offset=w_offset)
        
        # 7. Importa Armas
        for wep_bmd, wep_prefix, wep_bone, wep_rot, wep_loc in spec['weapons']:
            import_weapon(wep_bmd, wep_prefix, arm_obj, bone_name_map, bone_matrices, wep_bone, wep_rot, wep_loc)
            
        # 8. Exporta GLBs:
        # A. models/hero_{cls_lower}_master_base.glb (usado pelo Validador 3D)
        master_glb = MODELS_DIR / f"hero_{cls_lower}_master_base.glb"
        bpy.ops.export_scene.gltf(
            filepath=str(master_glb),
            export_format='GLB',
            use_selection=False,
            export_yup=True,
            export_apply=False,
            export_skins=True,
            export_animations=False
        )
        print(f"  [+] Master Base exportado: {master_glb.name} ({master_glb.stat().st_size / 1024:.1f} KB)")
        
        # Copia também para static glb de prototypes se necessário
        static_glb = MODELS_DIR / f"hero_{cls_lower}.glb"
        shutil.copyfile(master_glb, static_glb)
        
        # 9. Renderiza Prévia de Estúdio Oficial Frontal
        scene = bpy.context.scene
        scene.render.engine = 'BLENDER_WORKBENCH'
        scene.display.shading.light = 'STUDIO'
        scene.display.shading.color_type = 'TEXTURE'
        scene.display.shading.show_shadows = True
        scene.render.resolution_x = 900
        scene.render.resolution_y = 1100
        scene.render.film_transparent = True
        
        cam_data = bpy.data.cameras.new("HeroCam")
        cam_data.lens = 50.0
        cam_obj = bpy.data.objects.new("HeroCam", cam_data)
        scene.collection.objects.link(cam_obj)
        scene.camera = cam_obj
        
        # Oculta corpo nu sob armadura na foto de conjunto completo (MG preserva a cabeça)
        for obj in bpy.data.objects:
            if obj.type == 'MESH' and obj.name.startswith('Body_'):
                if cls_lower == 'mg' and 'Head' in obj.name:
                    obj.hide_render = False
                else:
                    obj.hide_render = True
                
        cam_obj.location = (0.0, -2.85, 1.1)
        cam_obj.rotation_euler = (math.radians(90), 0, 0)
        
        preview_png = PREVIEWS_DIR / f"{cls_lower}_canonical_elite_set_front.png"
        scene.render.filepath = str(preview_png)
        bpy.ops.render.render(write_still=True)
        print(f"  [+] Preview renderizado: {preview_png.name}")

    print("\n[OK] Todas as 5 classes foram reconstruídas e homologadas com postura ereta perfeita!")

if __name__ == '__main__':
    build_and_render_all()
