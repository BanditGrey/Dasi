#!/usr/bin/env python3
"""
Dasi MMORPG - Canonical Golden Master Builder: Dark Knight
Blender 5.2 LTS Professional Automation Script

Reconstrói matematicamente o Dark Knight a partir do código-fonte oficial (mu_roxgaming_5.2):
- Esqueleto mestre de 60 ossos Bip01 derivado diretamente de player.bmd
- Transformação de vértices via o->BoneTransform oficial (elimina qualquer ARMATURE_AUTO)
- Binding rígido exato (peso 1.0 para v->Node)
- Asas de Dragão oficiais de Wing06.bmd (NDW.jpg / NDW_R.jpg) ancoradas em Bone 47 (Bone05)
- Armas canônicas: Sword02 (Dragon Blade) em Bone 33 e Sword17 (Archangel Sword) em Bone 42
- Suporte modular a corpo nu (Body_*) e armadura Dragon (Armor_*)
- Renderização de 4 vistas de estúdio de alta fidelidade
"""

import sys
import os
import math
import shutil
from pathlib import Path

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

# 1. Tabela Canônica de Texturas
TEXTURE_MAP = {
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
}

decoded_textures = {}
print(">>> [1/7] Decodificando texturas canônicas...")
for stem, src in TEXTURE_MAP.items():
    if not src.exists():
        print(f"  Warning: {src} not found")
        continue
    if src.suffix.lower() == '.ozj':
        dst = TEX_OUT / f"{stem}.jpg"
        decode_ozj_to_jpg(src, dst)
        decoded_textures[stem.lower()] = dst
    elif src.suffix.lower() == '.ozt':
        dst = TEX_OUT / f"{stem}.tga"
        decode_ozt_to_tga(src, dst)
        decoded_textures[stem.lower()] = dst

print(f"  OK: {len(decoded_textures)} texturas prontas")

# 2. Inicializar Cena Limpa no Blender
bpy.ops.wm.read_factory_settings(use_empty=True)

# 3. Construir Esqueleto Mestre de player.bmd
print(">>> [2/7] Construindo esqueleto canônico mestre (player.bmd - 60 ossos)...")
player_path = DATA_DIR / "Player/player.bmd"
player_parser = BMDParser(player_path)
player_parser.parse(apply_bones=False)

arm_data = bpy.data.armatures.new("MU_Canonical_Armature")
arm_obj = bpy.data.objects.new("Hero_DarkKnight", arm_data)
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
print(f"  OK: Armature criado com {len(arm_obj.data.bones)} ossos canônicos")

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
        if is_alpha or 'wing' in stem or 'ndw' in stem or tex_path.suffix.lower() == '.tga':
            if hasattr(mat, 'blend_method'):
                mat.blend_method = 'BLEND'
            mat.node_tree.links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])
    if 'Roughness' in bsdf.inputs:
        bsdf.inputs['Roughness'].default_value = 0.35
    if 'Metallic' in bsdf.inputs:
        bsdf.inputs['Metallic'].default_value = 0.20
    return mat

def load_canonical_part_with_player_bones(bmd_rel_path, obj_name_prefix):
    """
    Carrega peça (armadura ou corpo), transformando os vértices PELAS MATRIZES OFICIAIS DO PLAYER.BMD
    (Exatamente como ZzzObject.cpp executa: b->Transform(o->BoneTransform, ...))
    """
    fpath = DATA_DIR / bmd_rel_path
    parser = BMDParser(fpath)
    parser.parse(apply_bones=False)
    
    mesh_objects = []
    for idx, m in enumerate(parser.meshes):
        m_name = f"{obj_name_prefix}_{idx}"
        mesh_data = bpy.data.meshes.new(m_name)
        
        # Transformação rigorosa pelo osso correspondente do esqueleto mestre
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
        
        # Binding rígido 1.0 para o osso canônico v->Node (zero vazamento de pesos)
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

# 4. Carregar Anatomia Humana Base (Body_*)
print(">>> [3/7] Carregando Anatomia Humana Base (Body_*)...")
body_parts = []
body_parts.extend(load_canonical_part_with_player_bones("Player/HelmClass02.bmd", "Body_Head"))
body_parts.extend(load_canonical_part_with_player_bones("Player/ArmorClass02.bmd", "Body_Chest"))
body_parts.extend(load_canonical_part_with_player_bones("Player/PantClass02.bmd", "Body_Legs"))
body_parts.extend(load_canonical_part_with_player_bones("Player/GloveClass02.bmd", "Body_Gloves"))
body_parts.extend(load_canonical_part_with_player_bones("Player/BootClass02.bmd", "Body_Boots"))
print(f"  OK: {len(body_parts)} submalhas de anatomia base montadas")

# 5. Carregar Armadura Dragon Completa (Armor_*)
print(">>> [4/7] Carregando Armadura Dragon Set (Armor_*)...")
armor_parts = []
armor_parts.extend(load_canonical_part_with_player_bones("Player/HelmMale02.bmd", "Armor_Helm"))
armor_parts.extend(load_canonical_part_with_player_bones("Player/ArmorMale02.bmd", "Armor_Chest"))
armor_parts.extend(load_canonical_part_with_player_bones("Player/PantMale02.bmd", "Armor_Legs"))
armor_parts.extend(load_canonical_part_with_player_bones("Player/GloveMale02.bmd", "Armor_Gloves"))
armor_parts.extend(load_canonical_part_with_player_bones("Player/BootMale02.bmd", "Armor_Boots"))
print(f"  OK: {len(armor_parts)} submalhas de armadura Dragon montadas")

# 6. Carregar Asas de Dragão (Wings_Dragon de Wing06.bmd)
print(">>> [5/7] Carregando Asas de Dragão Canônicas (Wing06.bmd)...")
wing_parser = BMDParser(DATA_DIR / "Item/Wing06.bmd")
wing_parser.parse(apply_bones=True)

# Posição dorsal oficial: Bone 47 + (0, 0, 15) MU units = (0.00, 0.0942, 1.4188) metros
wing_offset = Vector((0.0, 0.0942, 1.4188))
wing_objects = []
for idx, m in enumerate(wing_parser.meshes):
    w_name = f"Wings_Dragon_{idx}"
    mesh_data = bpy.data.meshes.new(w_name)
    verts = [Vector((v[0] * 0.01, v[1] * 0.01, v[2] * 0.01)) + wing_offset for v in m['vertices']]
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
    b47_name = bone_name_map[47]
    vg = obj.vertex_groups.new(name=b47_name)
    vg.add(list(range(len(verts))), 1.0, 'REPLACE')
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj
    obj.parent = arm_obj
    wing_objects.append(obj)
print(f"  OK: {len(wing_objects)} asas de dragão vinculadas ao Bone_47")

# 7. Carregar Armas (Mão Direita: Dragon Blade, Mão Esquerda: Archangel Sword)
print(">>> [6/7] Carregando Armas nas Mãos Canônicas...")
def load_canonical_weapon(bmd_rel_path, obj_name, target_bone_idx, is_right_hand=True):
    parser = BMDParser(DATA_DIR / bmd_rel_path)
    parser.parse(apply_bones=False)
    
    bone_mat = player_parser.bone_matrices[target_bone_idx]
    bone_pos = Vector((bone_mat[0][3] * 0.01, bone_mat[1][3] * 0.01, bone_mat[2][3] * 0.01))
    
    # Orientação natural em pose de repouso (lâmina apontando para baixo ao longo da perna)
    # Matriz do osso com rotação de repouso
    m = bone_mat
    mat_bone = Matrix([
        [m[0][0], m[0][1], m[0][2], bone_pos.x],
        [m[1][0], m[1][1], m[1][2], bone_pos.y],
        [m[2][0], m[2][1], m[2][2], bone_pos.z],
        [0.0, 0.0, 0.0, 1.0]
    ])
    
    rot_idle = Euler((math.radians(180), 0, 0), 'XYZ').to_matrix().to_4x4()
    mat_final = mat_bone @ rot_idle
    
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

wep_r = load_canonical_weapon("Item/Sword02.bmd", "Weapon_Right", 33, is_right_hand=True)
wep_l = load_canonical_weapon("Item/Sword17.bmd", "Weapon_Left", 42, is_right_hand=False)
print(f"  OK: Dragon Blade (Mão Direita) e Archangel Sword (Mão Esquerda) equipadas")

# 8. Iluminação e Câmeras de Inspeção de Estúdio
print(">>> [7/7] Gerando Renders de Estúdio e Exportando GLBs Oficiais...")
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

bpy.context.scene.render.resolution_x = 1024
bpy.context.scene.render.resolution_y = 1024
bpy.context.scene.render.film_transparent = True

# VISTA 1: FRONTAL COMPLETA (Dragon Set + Asas + Espadas)
for o in body_parts: o.hide_render = True
for o in armor_parts + wing_objects + wep_r + wep_l: o.hide_render = False
cam_obj.location = (0.0, -3.4, 1.20)
cam_obj.rotation_euler = (math.radians(85), 0, 0)
bpy.context.scene.render.filepath = str(PREVIEWS_DIR / "dk_canonical_dragon_set_front.png")
bpy.ops.render.render(write_still=True)
print(f"  OK: dk_canonical_dragon_set_front.png")

# VISTA 2: TRASEIRA (Inspeção de Enquadramento das Asas)
cam_obj.location = (0.0, 3.4, 1.40)
cam_obj.rotation_euler = (math.radians(95), 0, math.radians(180))
bpy.context.scene.render.filepath = str(PREVIEWS_DIR / "dk_canonical_dragon_wings_back.png")
bpy.ops.render.render(write_still=True)
print(f"  OK: dk_canonical_dragon_wings_back.png")

# VISTA 3: LATERAL DIREITA (Inspeção das Armas e Postura)
cam_obj.location = (3.4, 0.0, 1.20)
cam_obj.rotation_euler = (math.radians(85), 0, math.radians(90))
bpy.context.scene.render.filepath = str(PREVIEWS_DIR / "dk_canonical_profile_right.png")
bpy.ops.render.render(write_still=True)
print(f"  OK: dk_canonical_profile_right.png")

# VISTA 4: CORPO NU (Inspeção de Anatomia Humana Pura)
for o in body_parts: o.hide_render = False
for o in armor_parts + wing_objects + wep_r + wep_l: o.hide_render = True
cam_obj.location = (0.0, -3.4, 1.20)
cam_obj.rotation_euler = (math.radians(85), 0, 0)
bpy.context.scene.render.filepath = str(PREVIEWS_DIR / "dk_canonical_nude_body_front.png")
bpy.ops.render.render(write_still=True)
print(f"  OK: dk_canonical_nude_body_front.png")

# 9. Exportação dos Modelos GLB Oficiais
# Por padrão, deixar Armor_*, Wings_Dragon e Weapon_* visíveis no GLB
for o in body_parts: o.hide_viewport = True
for o in armor_parts + wing_objects + wep_r + wep_l: o.hide_viewport = False

master_glb = MODELS_DIR / "hero_dk_master_base.glb"
bpy.ops.export_scene.gltf(
    filepath=str(master_glb),
    export_format='GLB',
    export_animations=False,
    export_skins=True
)
print(f"  OK: {master_glb.name} exportado ({master_glb.stat().st_size} bytes)")

# Sincronização com o Dev Viewer
target_anim = ANIM_DIR / "hero_dk_animated.glb"
target_static = MODELS_DIR / "hero_dk_animated.glb"
shutil.copyfile(str(master_glb), str(target_anim))
shutil.copyfile(str(master_glb), str(target_static))
print(f"  OK: Sincronizado para {target_anim.name} e {target_static.name}")

print("=" * 60)
print(">>> CONSTRUÇÃO CANÔNICA DO DARK KNIGHT CONCLUÍDA COM SUCESSO!")
print("=" * 60)
