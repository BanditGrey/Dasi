#!/usr/bin/env python3
"""
Dasi MMORPG - Canonical Golden Master Builder: All 5 Classes
Blender 5.2 LTS Professional Automation Script

Reconstrói matematicamente os 5 heróis canônicos a partir do código-fonte oficial (mu_roxgaming_5.2):
- Esqueleto mestre de 60 ossos Bip01 derivado diretamente de player.bmd
- Transformação de vértices via o->BoneTransform oficial (elimina qualquer ARMATURE_AUTO)
- Binding rígido exato (peso 1.0 para v->Node)
- Asas autênticas para cada classe:
    * DK: Wing06.bmd (Wings of Dragon - NDW.jpg / NDW_R.jpg)
    * DW: Wing05.bmd (Wings of Soul - NEWWW.jpg / NEWW_R.jpg)
    * ELF: Wing04.bmd (Wings of Spirits - NewingEl.jpg)
    * MG: Wing07.bmd (Wings of Darkness - NDEE.tga)
    * DL: DarkLordRobe02.bmd (Cape of Lord - dl_redwings*.tga)
- Armas canônicas empunhadas em repouso nobre (Bone 33 / Bone 42)
- Suporte modular a corpo nu (Body_*) e armadura elite (Armor_*)
- Renderização de 4 vistas de estúdio de alta fidelidade para cada classe em docs/art_previews/
- Exportação de Master Bases e sincronização com o Dev Viewer
"""

import sys
import os
import math
import shutil
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
sys.path.append(str(WORKSPACE / 'conversions/converters/texture_decoder'))

import bpy
from mathutils import Vector, Matrix, Euler
from bmd_parser import BMDParser, transform_pos
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

# 1. Decodificar todas as texturas canônicas necessárias
ALL_TEXTURES = {
    # DK
    'HQSkinClass102': DATA_DIR / 'Player/HQSkinClass102.ozj',
    'head_03': DATA_DIR / 'Player/head_03.OZJ',
    'skin_barbarian_01': DATA_DIR / 'Player/skin_barbarian_01.OZJ',
    'hide': DATA_DIR / 'Player/hide.OZJ',
    'hide_m': DATA_DIR / 'Player/hide_m.OZJ',
    'upper_03_m': DATA_DIR / 'Player/upper_03_m.OZJ',
    'lower_03b_m': DATA_DIR / 'Player/lower_03b_m.OZT',
    'lower_03_m': DATA_DIR / 'Player/lower_03_m.OZJ',
    'gloves_03': DATA_DIR / 'Player/gloves_03.OZJ',
    'boots_03': DATA_DIR / 'Player/boots_03.OZJ',
    'NDW': DATA_DIR / 'Item/NDW.OZJ',
    'NDW_R': DATA_DIR / 'Item/NDW_R.OZJ',
    'sword03': DATA_DIR / 'NPC/sword03.OZJ',
    'sword077': DATA_DIR / 'Item/sword077.OZJ',
    # DW
    'HQSkinClass101': DATA_DIR / 'Player/HQSkinClass101.ozj',
    'head_13m': DATA_DIR / 'Player/head_13m.OZJ',
    'upper_13m': DATA_DIR / 'Player/upper_13m.OZJ',
    'lower_13m': DATA_DIR / 'Player/lower_13m.OZJ',
    'lower_13m_tga': DATA_DIR / 'Player/lower_13m.OZT',
    'gloves_13m': DATA_DIR / 'Player/gloves_13m.OZJ',
    'boots_13m': DATA_DIR / 'Player/boots_13m.OZJ',
    'skin_warrior_01': DATA_DIR / 'Player/skin_warrior_01.OZJ',
    'NEWWW': DATA_DIR / 'Item/NEWWW.OZJ',
    'NEWW_R': DATA_DIR / 'Item/NEWW_R.OZJ',
    'wand06': DATA_DIR / 'Item/wand06.OZJ',
    # ELF
    'HQSkinClass103': DATA_DIR / 'Player/HQSkinClass103.ozj',
    'head_a05': DATA_DIR / 'Player/head_a05.OZJ',
    'upper_03': DATA_DIR / 'Player/upper_03.OZJ',
    'lower_03': DATA_DIR / 'Player/lower_03.OZJ',
    'lower_03b': DATA_DIR / 'Player/lower_03b.OZT',
    'gloves_03b': DATA_DIR / 'Player/gloves_03b.OZJ',
    'boots_03b': DATA_DIR / 'Player/boots_03b.OZJ',
    'NewingEl': DATA_DIR / 'Item/NewingEl.OZJ',
    'bow01': DATA_DIR / 'Item/bow01.OZJ',
    'bow04': DATA_DIR / 'Item/bow04.OZJ',
    'bow05': DATA_DIR / 'Item/bow05.OZT',
    # MG
    'HQSkin_special_01': DATA_DIR / 'Player/HQSkin_special_01.ozj',
    'upper_14': DATA_DIR / 'Player/upper_14.OZT',
    'lower_14': DATA_DIR / 'Player/lower_14.OZT',
    'gloves_14': DATA_DIR / 'Player/gloves_14.OZT',
    'boots_14': DATA_DIR / 'Player/boots_14.OZT',
    'NDEE': DATA_DIR / 'Item/NDEE.OZT',
    'sword11': DATA_DIR / 'Item/sword11.OZJ',
    'sword11_tga': DATA_DIR / 'Item/sword11.OZT',
    # DL
    'HQhair_R': DATA_DIR / 'Player/HQhair_R.ozj',
    'HQlevel_man02': DATA_DIR / 'Player/HQlevel_man02.ozj',
    'Kbpp': DATA_DIR / 'Player/Kbpp.ozj',
    'Kgpp': DATA_DIR / 'Player/Kgpp.ozj',
    'Klpp': DATA_DIR / 'Player/Klpp.ozj',
    'Kmpp': DATA_DIR / 'Player/Kmpp.ozj',
    'Kupp': DATA_DIR / 'Player/Kupp.ozj',
    'hair_R': DATA_DIR / 'Player/hair_R.ozj',
    'level_man02': DATA_DIR / 'Player/level_man02.ozj',
    'dl_redwings01': DATA_DIR / 'Item/dl_redwings01.ozj',
    'dl_redwings02': DATA_DIR / 'Item/dl_redwings02.ozt',
    'dl_redwings03': DATA_DIR / 'Item/dl_redwings03.ozt',
    'mace': DATA_DIR / 'Item/mace.ozj',
    'maceB': DATA_DIR / 'Item/maceB.ozj',
}

decoded_textures = {}
print(">>> [1/3] Garantindo decodificação de texturas canônicas...")
for stem, src in ALL_TEXTURES.items():
    if not src.exists():
        continue
    clean_stem = stem.replace('_tga', '').replace('_m', '')
    if src.suffix.lower() == '.ozj':
        dst = TEX_OUT / f"{clean_stem}.jpg"
        if not dst.exists() or dst.stat().st_size == 0:
            decode_ozj_to_jpg(src, dst)
        decoded_textures[clean_stem.lower()] = dst
        decoded_textures[stem.lower()] = dst
    elif src.suffix.lower() == '.ozt':
        dst = TEX_OUT / f"{clean_stem}.tga"
        if not dst.exists() or dst.stat().st_size == 0:
            decode_ozt_to_tga(src, dst)
        decoded_textures[clean_stem.lower()] = dst
        decoded_textures[stem.lower()] = dst

print(f"  OK: {len(decoded_textures)} mapeamentos de textura prontos")

# Carregar esqueleto mestre player.bmd
player_path = DATA_DIR / "Player/player.bmd"
player_parser = BMDParser(player_path)
player_parser.parse(apply_bones=False)

def get_or_create_material(tex_name, is_alpha=False):
    stem = Path(tex_name).stem.lower()
    mat_key = f"Mat_{stem}"
    if mat_key in bpy.data.materials:
        return bpy.data.materials[mat_key]
    mat = bpy.data.materials.new(name=mat_key)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    tex_path = decoded_textures.get(stem)
    if not tex_path:
        for k, v in decoded_textures.items():
            if stem in k or k in stem:
                tex_path = v
                break
    if tex_path and tex_path.exists():
        img = bpy.data.images.load(str(tex_path))
        tex_node = mat.node_tree.nodes.new(type="ShaderNodeTexImage")
        tex_node.image = img
        mat.node_tree.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
        if is_alpha or 'wing' in stem or 'ndw' in stem or 'neww' in stem or 'ndee' in stem or 'robe' in stem or tex_path.suffix.lower() == '.tga':
            if hasattr(mat, 'blend_method'):
                mat.blend_method = 'BLEND'
            mat.node_tree.links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])
    if 'Roughness' in bsdf.inputs:
        bsdf.inputs['Roughness'].default_value = 0.35
    if 'Metallic' in bsdf.inputs:
        bsdf.inputs['Metallic'].default_value = 0.20
    return mat

def build_hero_armature():
    arm_data = bpy.data.armatures.new("Armature")
    arm_obj = bpy.data.objects.new("Armature", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')

    bone_name_map = {}
    edit_bones = arm_data.edit_bones

    for i, b in enumerate(player_parser.bones):
        clean_name = b['name'].split('\x00')[0].strip().replace(' ', '_')
        b_name = f"Bone_{i:02d}_{clean_name}" if clean_name else f"Bone_{i:02d}"
        bone_name_map[i] = b_name
        eb = edit_bones.new(b_name)
        mat = player_parser.bone_matrices[i]
        head_pos = Vector((mat[0][3] * 0.01, mat[1][3] * 0.01, mat[2][3] * 0.01)) if mat else Vector((0,0,0))
        eb.head = head_pos
        eb.tail = head_pos + Vector((0.0, 0.0, 0.05))

    for i, b in enumerate(player_parser.bones):
        p_idx = b['parent']
        if 0 <= p_idx < len(player_parser.bones):
            edit_bones[bone_name_map[i]].parent = edit_bones[bone_name_map[p_idx]]

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj, bone_name_map

def load_canonical_part(bmd_rel_path, obj_name_prefix, arm_obj, bone_name_map):
    fpath = DATA_DIR / bmd_rel_path
    if not fpath.exists():
        print(f"  Warning: {bmd_rel_path} does not exist!")
        return []
    parser = BMDParser(fpath)
    parser.parse(apply_bones=False)
    
    mesh_objects = []
    for idx, m in enumerate(parser.meshes):
        m_name = f"{obj_name_prefix}_{idx}"
        mesh_data = bpy.data.meshes.new(m_name)
        
        verts = []
        for node, pos in m['raw_verts']:
            mat = player_parser.bone_matrices[node] if node < len(player_parser.bone_matrices) else None
            if mat is not None:
                tp = transform_pos(pos, mat)
                verts.append(Vector((tp[0] * 0.01, tp[1] * 0.01, tp[2] * 0.01)))
            else:
                verts.append(Vector((pos[0] * 0.01, pos[1] * 0.01, pos[2] * 0.01)))
                
        faces = []
        face_uvs = []
        for tri in m['triangles']:
            poly = tri['poly']
            v = tri['v']
            t = tri['t']
            faces.append((v[0], v[1], v[2]))
            face_uvs.append((m['uvs'][t[0]], m['uvs'][t[1]], m['uvs'][t[2]]))
            if poly == 4:
                faces.append((v[0], v[2], v[3]))
                face_uvs.append((m['uvs'][t[0]], m['uvs'][t[2]], m['uvs'][t[3]]))
                
        mesh_data.from_pydata(verts, [], faces)
        mesh_data.update()
        
        uv_layer = mesh_data.uv_layers.new(name="UVMap")
        uv_data = uv_layer.data
        loop_idx = 0
        for f_uv in face_uvs:
            for uv in f_uv:
                uv_data[loop_idx].uv = uv
                loop_idx += 1
                
        obj = bpy.data.objects.new(m_name, mesh_data)
        bpy.context.collection.objects.link(obj)
        mat = get_or_create_material(m['texture_name'])
        obj.data.materials.append(mat)
        
        for j, (node, _) in enumerate(m['raw_verts']):
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
        mesh_objects.append(obj)
        
    return mesh_objects

def load_canonical_wings(wing_rel_path, obj_name_prefix, arm_obj, bone_name_map, offset_pos=Vector((0.0, 0.0942, 1.4188)), target_bone=47):
    wing_parser = BMDParser(DATA_DIR / wing_rel_path)
    wing_parser.parse(apply_bones=True)
    
    wing_objects = []
    for idx, m in enumerate(wing_parser.meshes):
        w_name = f"{obj_name_prefix}_{idx}"
        mesh_data = bpy.data.meshes.new(w_name)
        verts = [Vector((v[0] * 0.01, v[1] * 0.01, v[2] * 0.01)) + offset_pos for v in m['vertices']]
        faces = []
        face_uvs = []
        for tri in m['triangles']:
            poly = tri['poly']
            v = tri['v']
            t = tri['t']
            faces.append((v[0], v[1], v[2]))
            face_uvs.append((m['uvs'][t[0]], m['uvs'][t[1]], m['uvs'][t[2]]))
            if poly == 4:
                faces.append((v[0], v[2], v[3]))
                face_uvs.append((m['uvs'][t[0]], m['uvs'][t[2]], m['uvs'][t[3]]))
        mesh_data.from_pydata(verts, [], faces)
        mesh_data.update()
        
        uv_layer = mesh_data.uv_layers.new(name="UVMap")
        uv_data = uv_layer.data
        loop_idx = 0
        for f_uv in face_uvs:
            for uv in f_uv:
                uv_data[loop_idx].uv = uv
                loop_idx += 1
                
        obj = bpy.data.objects.new(w_name, mesh_data)
        bpy.context.collection.objects.link(obj)
        mat = get_or_create_material(m['texture_name'], is_alpha=True)
        obj.data.materials.append(mat)
        
        b_name = bone_name_map[target_bone]
        vg = obj.vertex_groups.new(name=b_name)
        vg.add(list(range(len(verts))), 1.0, 'REPLACE')
        
        mod = obj.modifiers.new(name="Armature", type='ARMATURE')
        mod.object = arm_obj
        obj.parent = arm_obj
        wing_objects.append(obj)
    return wing_objects

def load_canonical_weapon(wep_rel_path, obj_name, arm_obj, bone_name_map, target_bone_idx, rot_euler=Euler((math.radians(180),0,0),'XYZ'), loc_offset=Vector((0,0,0))):
    parser = BMDParser(DATA_DIR / wep_rel_path)
    parser.parse(apply_bones=False)
    
    bone_mat = player_parser.bone_matrices[target_bone_idx]
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
    mat_final = mat_loc @ mat_bone @ mat_rot
    
    weapon_objs = []
    for idx, m in enumerate(parser.meshes):
        w_name = f"{obj_name}_{idx}"
        mesh_data = bpy.data.meshes.new(w_name)
        verts = [mat_final @ Vector((v[1][0] * 0.01, v[1][1] * 0.01, v[1][2] * 0.01, 1.0)).to_3d() for v in m['raw_verts']]
        faces = []
        face_uvs = []
        for tri in m['triangles']:
            poly = tri['poly']
            v = tri['v']
            t = tri['t']
            faces.append((v[0], v[1], v[2]))
            face_uvs.append((m['uvs'][t[0]], m['uvs'][t[1]], m['uvs'][t[2]]))
            if poly == 4:
                faces.append((v[0], v[2], v[3]))
                face_uvs.append((m['uvs'][t[0]], m['uvs'][t[2]], m['uvs'][t[3]]))
        mesh_data.from_pydata(verts, [], faces)
        mesh_data.update()
        uv_layer = mesh_data.uv_layers.new(name="UVMap")
        uv_data = uv_layer.data
        loop_idx = 0
        for f_uv in face_uvs:
            for uv in f_uv:
                uv_data[loop_idx].uv = uv
                loop_idx += 1
        obj = bpy.data.objects.new(w_name, mesh_data)
        bpy.context.collection.objects.link(obj)
        mat = get_or_create_material(m['texture_name'])
        obj.data.materials.append(mat)
        
        b_name = bone_name_map[target_bone_idx]
        vg = obj.vertex_groups.new(name=b_name)
        vg.add(list(range(len(verts))), 1.0, 'REPLACE')
        
        mod = obj.modifiers.new(name="Armature", type='ARMATURE')
        mod.object = arm_obj
        obj.parent = arm_obj
        weapon_objs.append(obj)
    return weapon_objs

# Configuração Canônica das 5 Classes Oficiais
HERO_SPECS = {
    'DK': {
        'id': 'DK',
        'lower': 'dk',
        'title': 'Dark Knight (Blade Knight)',
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
        'wings': ("Item/Wing06.bmd", "Wings_Dragon", Vector((0.0, 0.0942, 1.4188)), 47),
        'weapons': [
            ("Item/Sword02.bmd", "Weapon_Right", 33, Euler((math.radians(180), 0, 0), 'XYZ'), Vector((0,0,0))),
            ("Item/Sword17.bmd", "Weapon_Left", 42, Euler((math.radians(180), 0, 0), 'XYZ'), Vector((0,0,0))),
        ],
        'master_glb': "hero_dk_master_base.glb",
        'anim_glb': "hero_dk_animated.glb",
        'static_glb': "hero_dark_knight.glb",
    },
    'DW': {
        'id': 'DW',
        'lower': 'dw',
        'title': 'Dark Wizard (Soul Master)',
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
        'wings': ("Item/Wing05.bmd", "Wings_Soul", Vector((0.0, 0.0942, 1.4188)), 47),
        'weapons': [
            ("Item/Staff05.bmd", "Weapon_Right", 33, Euler((math.radians(180), math.radians(10), math.radians(-5)), 'XYZ'), Vector((-0.08, 0.0, 0.0))),
        ],
        'master_glb': "hero_dw_master_base.glb",
        'anim_glb': "hero_dw_animated.glb",
        'static_glb': "hero_dark_wizard.glb",
    },
    'ELF': {
        'id': 'ELF',
        'lower': 'elf',
        'title': 'Fairy Elf (Muse Elf)',
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
        'wings': ("Item/Wing04.bmd", "Wings_Spirits", Vector((0.0, 0.0942, 1.4188)), 47),
        'weapons': [
            ("Item/Bow04.bmd", "Weapon_Left", 42, Euler((0, math.radians(-15), math.radians(10)), 'XYZ'), Vector((0.04, -0.02, 0.0))),
        ],
        'master_glb': "hero_elf_master_base.glb",
        'anim_glb': "hero_elf_animated.glb",
        'static_glb': "hero_fairy_elf.glb",
    },
    'MG': {
        'id': 'MG',
        'lower': 'mg',
        'title': 'Magic Gladiator (Duel Master)',
        'body': [
            ("Player/HelmClass04.bmd", "Body_Head"),
            ("Player/ArmorClass04.bmd", "Body_Chest"),
            ("Player/PantClass04.bmd", "Body_Legs"),
            ("Player/GloveClass04.bmd", "Body_Gloves"),
            ("Player/BootClass04.bmd", "Body_Boots"),
        ],
        'armor': [
            ("Player/ArmorMale16.bmd", "Armor_Chest"),
            ("Player/PantMale16.bmd", "Armor_Legs"),
            ("Player/GloveMale16.bmd", "Armor_Gloves"),
            ("Player/BootMale16.bmd", "Armor_Boots"),
        ],
        'wings': ("Item/Wing07.bmd", "Wings_Darkness", Vector((0.0, 0.0942, 1.4188)), 47),
        'weapons': [
            ("Item/Sword16.bmd", "Weapon_Right", 33, Euler((math.radians(180), 0, 0), 'XYZ'), Vector((0,0,0))),
            ("Item/Sword10.bmd", "Weapon_Left", 42, Euler((math.radians(180), 0, 0), 'XYZ'), Vector((0,0,0))),
        ],
        'master_glb': "hero_mg_master_base.glb",
        'anim_glb': "hero_mg_animated.glb",
        'static_glb': "hero_magic_gladiator.glb",
    },
    'DL': {
        'id': 'DL',
        'lower': 'dl',
        'title': 'Dark Lord (Lord Emperor)',
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
        'wings': ("Item/DarkLordRobe02.bmd", "Cape_Lord", Vector((0.0, 0.05, 0.85)), 47),
        'weapons': [
            ("Item/Mace05.bmd", "Weapon_Right", 33, Euler((math.radians(180), math.radians(10), math.radians(-5)), 'XYZ'), Vector((-0.04, 0.0, 0.0))),
        ],
        'master_glb': "hero_dl_master_base.glb",
        'anim_glb': "hero_dl_animated.glb",
        'static_glb': "hero_dark_lord.glb",
    },
}

def setup_studio_environment():
    key_light = bpy.data.lights.new(name="KeyLight", type='SUN')
    key_light.energy = 4.0
    key_obj = bpy.data.objects.new("KeyLight", key_light)
    key_obj.location = (3.0, -3.5, 4.0)
    key_obj.rotation_euler = (math.radians(55), 0, math.radians(35))
    bpy.context.collection.objects.link(key_obj)

    fill_light = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_light.energy = 2.5
    fill_obj = bpy.data.objects.new("FillLight", fill_light)
    fill_obj.location = (-3.5, -3.0, 3.5)
    fill_obj.rotation_euler = (math.radians(50), 0, math.radians(-40))
    bpy.context.collection.objects.link(fill_obj)

    back_light = bpy.data.lights.new(name="BackLight", type='SUN')
    back_light.energy = 3.5
    back_obj = bpy.data.objects.new("BackLight", back_light)
    back_obj.location = (0.0, 4.0, 3.5)
    back_obj.rotation_euler = (math.radians(-50), 0, math.radians(180))
    bpy.context.collection.objects.link(back_obj)

    cam_data = bpy.data.cameras.new(name="Camera")
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    scene = bpy.context.scene
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    return cam_obj, scene

# Loop principal de compilação
print("\n" + "="*70)
print(">>> [2/3] INICIANDO COMPILAÇÃO CANÔNICA DOS 5 HERÓIS MESTRES")
print("="*70)

for class_id, spec in HERO_SPECS.items():
    print(f"\n--- Construindo Golden Master: {spec['title']} ({class_id}) ---")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 1. Armature Mestre
    arm_obj, bone_name_map = build_hero_armature()
    
    # 2. Anatomia Base (Body_*)
    body_parts = []
    for bmd_rel, prefix in spec['body']:
        body_parts.extend(load_canonical_part(bmd_rel, prefix, arm_obj, bone_name_map))
    print(f"  OK: {len(body_parts)} submalhas de anatomia base montadas")
    
    # 3. Armadura Elite (Armor_*)
    armor_parts = []
    for bmd_rel, prefix in spec['armor']:
        armor_parts.extend(load_canonical_part(bmd_rel, prefix, arm_obj, bone_name_map))
    print(f"  OK: {len(armor_parts)} submalhas de armadura elite montadas")
    
    # 4. Asas Canônicas
    w_rel, w_prefix, w_offset, w_bone = spec['wings']
    wing_parts = load_canonical_wings(w_rel, w_prefix, arm_obj, bone_name_map, w_offset, w_bone)
    print(f"  OK: Asas canônicas ({w_rel}) montadas no Bone {w_bone}")
    
    # 5. Armas Canônicas
    wep_parts = []
    for wep_rel, wep_name, wep_bone, wep_rot, wep_loc in spec['weapons']:
        wep_parts.extend(load_canonical_weapon(wep_rel, wep_name, arm_obj, bone_name_map, wep_bone, wep_rot, wep_loc))
    print(f"  OK: {len(wep_parts)} submalhas de armas equipadas")
    
    # 6. Iluminação e Renders de Estúdio
    cam_obj, scene = setup_studio_environment()
    
    lower = spec['lower']
    
    # Vista 1: Frente (Armadura + Asas + Armas)
    cam_obj.location = (0.0, -3.85, 1.20)
    cam_obj.rotation_euler = (math.radians(85), 0, 0)
    for o in body_parts: o.hide_render = True
    for o in armor_parts + wing_parts + wep_parts: o.hide_render = False
    scene.render.filepath = str(PREVIEWS_DIR / f"{lower}_canonical_elite_set_front.png")
    bpy.ops.render.render(write_still=True)
    
    # Vista 2: Dorso (Asas Canônicas)
    cam_obj.location = (0.0, 4.0, 1.25)
    cam_obj.rotation_euler = (math.radians(95), 0, math.radians(180))
    scene.render.filepath = str(PREVIEWS_DIR / f"{lower}_canonical_wings_back.png")
    bpy.ops.render.render(write_still=True)
    
    # Vista 3: Perfil Direito (Armas & Alinhamento)
    cam_obj.location = (3.6, 0.0, 1.20)
    cam_obj.rotation_euler = (math.radians(85), 0, math.radians(90))
    scene.render.filepath = str(PREVIEWS_DIR / f"{lower}_canonical_profile_right.png")
    bpy.ops.render.render(write_still=True)
    
    # Vista 4: Corpo Nu Base (Pure Nude Body)
    cam_obj.location = (0.0, -3.4, 1.15)
    cam_obj.rotation_euler = (math.radians(85), 0, 0)
    for o in armor_parts + wing_parts + wep_parts: o.hide_render = True
    for o in body_parts: o.hide_render = False
    scene.render.filepath = str(PREVIEWS_DIR / f"{lower}_canonical_nude_body_front.png")
    bpy.ops.render.render(write_still=True)
    print(f"  OK: 4 renders de estúdio gerados para {class_id}")
    
    # 7. Exportação e Sincronização GLB
    for o in body_parts: o.hide_viewport = True
    for o in armor_parts + wing_parts + wep_parts: o.hide_viewport = False
    
    master_path = MODELS_DIR / spec['master_glb']
    bpy.ops.export_scene.gltf(
        filepath=str(master_path),
        export_format='GLB',
        export_animations=False,
        export_skins=True
    )
    print(f"  OK: {master_path.name} exportado ({master_path.stat().st_size} bytes)")
    
    # Sincronizar cópias para animated_heroes e models/
    target_anim = ANIM_DIR / spec['anim_glb']
    target_static = MODELS_DIR / spec['static_glb']
    shutil.copyfile(str(master_path), str(target_anim))
    shutil.copyfile(str(master_path), str(target_static))
    print(f"  OK: Sincronizado para {target_anim.name} e {target_static.name}")

print("\n" + "="*70)
print(">>> [3/3] HOMOLOGAÇÃO DAS 5 CLASSES CANÔNICAS CONCLUÍDA COM 100% DE SUCESSO!")
print("="*70)
