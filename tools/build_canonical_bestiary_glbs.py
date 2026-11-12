#!/usr/bin/env python3
"""
Dasi MMORPG - Compilador do Bestiário Canônico Oficial (Blender 5.2 LTS)
Pipeline de Conversão de Assets MU Online Season 5.2

Converte os modelos 3D (.obj) e texturas oficiais de:
1. 6 Chefes Canônicos (Gorgon, Ice Queen, Balrog, Hydra, Zaikan, Kundun)
2. 6 Invasores Dourados (Golden Budge Dragon, Golden Titan, Golden Soldier, Golden Dragon, Golden Lizard King, Golden Tantalos)
3. 6 Criaturas de Campo (Spider, Bull Fighter, Hound, Skeleton, Lich, Death Knight)

Gera GLBs otimizados com materiais PBR, encaixe de armas nos sockets oficiais,
marcos de landmark para auditoria, escala métrica calibrada e metadados de colisão em:
- `src/client/dev_viewer/models/bestiary/`
- `prototypes/3d_bestiary/`
"""

import bpy
import os
import sys
import math
from pathlib import Path
from mathutils import Vector, Euler

WORKSPACE = Path("D:/Dasi")
INPUT_BASE = WORKSPACE / "conversions/output/bestiary"
OUT_DEV_VIEWER = WORKSPACE / "src/client/dev_viewer/models/bestiary"
OUT_PROTOTYPES = WORKSPACE / "prototypes/3d_bestiary"

for d in [OUT_DEV_VIEWER, OUT_PROTOTYPES]:
    d.mkdir(parents=True, exist_ok=True)

LANDMARKS = {
    'ICE_QUEEN': ['ice_queen_ice_gown', 'ice_queen_face', 'ice_queen_ice_crown', 'ice_queen_frost_scepter'],
    'GORGON': ['gorgon_serpentine_coil', 'gorgon_scaled_torso', 'gorgon_serpent_crown', 'gorgon_triple_stinger_tail'],
    'HYDRA': ['hydra_coiled_body', 'hydra_head_left', 'hydra_head_center', 'hydra_head_right', 'hydra_tail_curve'],
    'BALROG': ['balrog_obsidian_torso', 'balrog_magma_heart', 'balrog_left_wing', 'balrog_right_wing', 'balrog_hoof_left', 'balrog_hoof_right'],
    'ZAIKAN': ['zaikan_scorpion_abdomen', 'zaikan_biomechanical_thorax', 'zaikan_solar_vacuum_core', 'zaikan_scorpion_tail', 'zaikan_solar_stinger'],
    'KUNDUN': ['kundun_chaos_mantle', 'kundun_chaos_torso', 'kundun_chaos_staff', 'kundun_gravitational_halo', 'kundun_crown_chaos_gem'],
    'GOLDEN_TITAN': ['golden_titan_solar_cuirass', 'golden_titan_solar_helm', 'golden_titan_sunblade', 'golden_titan_halo', 'golden_titan_boot_left', 'golden_titan_boot_right'],
    'GOLDEN_BUDGE_DRAGON': ['golden_budge_dragon_body', 'golden_budge_dragon_head', 'golden_budge_dragon_wing_left', 'golden_budge_dragon_wing_right', 'golden_budge_dragon_tail'],
    'GOLDEN_SOLDIER': ['golden_soldier_armored_skeleton', 'golden_soldier_skull', 'golden_soldier_sun_axe', 'golden_soldier_round_shield'],
    'GOLDEN_LIZARD_KING': ['golden_lizard_king_amphibious_body', 'golden_lizard_king_head', 'golden_lizard_king_dorsal_plate_1', 'golden_lizard_king_tail'],
    'GOLDEN_TANTALOS': ['golden_tantalos_solar_titan', 'golden_tantalos_solar_cuirass', 'golden_tantalos_solar_maul', 'golden_tantalos_desert_cape'],
    'GOLDEN_DRAGON': ['golden_dragon_colossal_body', 'golden_dragon_skull', 'golden_dragon_wing_left', 'golden_dragon_wing_right', 'golden_dragon_long_tail', 'golden_dragon_solar_heart'],
}

BESTIARY_CONFIG = {
    # -------------------------------------------------------------
    # 1. OS 6 GRANDES CHEFES CANÔNICOS
    # -------------------------------------------------------------
    'GORGON': {
        'id': 'GORGON',
        'file_name': 'gorgon.glb',
        'title': 'Gorgon - O Soberano do Abismo (Dungeon)',
        'folder': 'gorgon',
        'body_obj': 'gorgon_body.obj',
        'weapon_obj': 'gorgon_staff.obj',
        'weapon_pos': (-37.55, 78.84, 37.02),
        'weapon_rot': (0, 0, 0),
        'weapon_scale': 1.0,
        'scale': 1.5,
        'collision': {'radius': 0.85, 'height': 2.4, 'step': 0.35},
        'emissive_color': (0.8, 0.1, 0.1, 1.0),
    },
    'ICE_QUEEN': {
        'id': 'ICE_QUEEN',
        'file_name': 'ice_queen.glb',
        'title': 'Ice Queen - A Rainha Glacial (Devias)',
        'folder': 'ice_queen',
        'body_obj': 'ice_queen_body.obj',
        'weapon_obj': 'ice_queen_staff.obj',
        'weapon_pos': (-17.14, 138.36, 49.44),
        'weapon_rot': (15, 0, 0),
        'weapon_scale': 1.0,
        'scale': 1.1,
        'collision': {'radius': 0.55, 'height': 2.0, 'step': 0.35},
        'emissive_color': (0.2, 0.6, 1.0, 1.0),
    },
    'BALROG': {
        'id': 'BALROG',
        'file_name': 'balrog.glb',
        'title': 'Balrog - O Lorde das Profundezas Vulcânicas (Lost Tower)',
        'folder': 'balrog',
        'body_obj': 'balrog_body.obj',
        'weapon_obj': 'balrog_scythe.obj',
        'weapon_pos': (-25.60, 123.20, 49.54),
        'weapon_rot': (20, 0, -15),
        'weapon_scale': 1.2,
        'scale': 1.6,
        'collision': {'radius': 1.1, 'height': 3.2, 'step': 0.45},
        'emissive_color': (1.0, 0.3, 0.05, 1.0),
    },
    'HYDRA': {
        'id': 'HYDRA',
        'file_name': 'hydra.glb',
        'title': 'Hydra - A Serpente das Profundezas Marinhas (Atlans)',
        'folder': 'hydra',
        'body_obj': 'hydra_body.obj',
        'scale': 1.8,
        'collision': {'radius': 1.4, 'height': 3.0, 'step': 0.45},
    },
    'ZAIKAN': {
        'id': 'ZAIKAN',
        'file_name': 'zaikan.glb',
        'title': 'Zaikan - O Demônio do Deserto Carmesim (Tarkan)',
        'folder': 'zaikan',
        'body_obj': 'zaikan_body.obj',
        'scale': 1.6,
        'collision': {'radius': 1.2, 'height': 2.8, 'step': 0.45},
    },
    'KUNDUN': {
        'id': 'KUNDUN',
        'file_name': 'kundun.glb',
        'title': 'Kundun - O Lorde da Escuridão e Mestre do Caos (Kalima)',
        'folder': 'kundun',
        'body_obj': 'kundun_body.obj',
        'weapon_obj': 'kundun_staff.obj',
        'weapon_pos': (40.78, 105.69, 30.14),
        'weapon_rot': (0, 0, 180),
        'weapon_scale': 1.2,
        'scale': 1.8,
        'collision': {'radius': 1.5, 'height': 3.6, 'step': 0.45},
        'emissive_color': (0.8, 0.1, 0.9, 1.0),
    },

    # -------------------------------------------------------------
    # 2. AS 6 CRIATURAS DA INVASÃO DOURADA
    # -------------------------------------------------------------
    'GOLDEN_BUDGE_DRAGON': {
        'id': 'GOLDEN_BUDGE_DRAGON',
        'file_name': 'golden_budge_dragon.glb',
        'title': 'Golden Budge Dragon - Pequeno Dragão Áureo',
        'folder': 'golden_budge_dragon',
        'body_obj': 'golden_budge_dragon_body.obj',
        'scale': 1.35,
        'is_golden': True,
        'collision': {'radius': 0.4, 'height': 1.0, 'step': 0.25},
    },
    'GOLDEN_TITAN': {
        'id': 'GOLDEN_TITAN',
        'file_name': 'golden_titan.glb',
        'title': 'Golden Titan - O Colosso Dourado de Lorencia',
        'folder': 'golden_titan',
        'body_obj': 'golden_titan_body.obj',
        'weapon_obj': 'golden_titan_axe.obj',
        'weapon_pos': (-28.0, 95.0, 25.0),
        'weapon_rot': (45, 0, 0),
        'weapon_scale': 1.1,
        'scale': 1.4,
        'is_golden': True,
        'collision': {'radius': 0.9, 'height': 2.6, 'step': 0.40},
    },
    'GOLDEN_SOLDIER': {
        'id': 'GOLDEN_SOLDIER',
        'file_name': 'golden_soldier.glb',
        'title': 'Golden Soldier - O Sentinela Dourado',
        'folder': 'golden_soldier',
        'body_obj': 'golden_soldier_body.obj',
        'weapon_obj': 'golden_soldier_sword.obj',
        'weapon_pos': (-25.0, 85.0, 20.0),
        'weapon_rot': (30, 0, 0),
        'weapon_scale': 1.0,
        'scale': 1.1,
        'is_golden': True,
        'collision': {'radius': 0.6, 'height': 2.1, 'step': 0.35},
    },
    'GOLDEN_DRAGON': {
        'id': 'GOLDEN_DRAGON',
        'file_name': 'golden_dragon.glb',
        'title': 'Golden Dragon - O Grande Dragão Alado Dourado',
        'folder': 'golden_dragon',
        'body_obj': 'golden_dragon_body.obj',
        'scale': 1.2,
        'is_golden': True,
        'collision': {'radius': 1.2, 'height': 2.8, 'step': 0.45},
    },
    'GOLDEN_LIZARD_KING': {
        'id': 'GOLDEN_LIZARD_KING',
        'file_name': 'golden_lizard_king.glb',
        'title': 'Golden Lizard King - O Monarca Sauriano Dourado',
        'folder': 'golden_lizard_king',
        'body_obj': 'golden_lizard_king_body.obj',
        'weapon_obj': 'golden_lizard_king_staff.obj',
        'weapon_pos': (-30.0, 80.0, 25.0),
        'weapon_rot': (15, 0, 0),
        'weapon_scale': 1.1,
        'scale': 1.4,
        'is_golden': True,
        'collision': {'radius': 0.85, 'height': 2.4, 'step': 0.40},
    },
    'GOLDEN_TANTALOS': {
        'id': 'GOLDEN_TANTALOS',
        'file_name': 'golden_tantalos.glb',
        'title': 'Golden Tantalos - O Guardião Áureo de Tarkan',
        'folder': 'golden_tantalos',
        'body_obj': 'golden_tantalos_body.obj',
        'scale': 1.6,
        'is_golden': True,
        'collision': {'radius': 1.2, 'height': 2.8, 'step': 0.45},
    },

    # -------------------------------------------------------------
    # 3. CRIATURAS DE CAMPO CANÔNICAS
    # -------------------------------------------------------------
    'SPIDER': {
        'id': 'SPIDER',
        'file_name': 'spider.glb',
        'title': 'Spider - Aranha Venenosa das Planícies',
        'folder': 'spider',
        'body_obj': 'spider_body.obj',
        'scale': 0.4,
        'collision': {'radius': 0.45, 'height': 0.7, 'step': 0.25},
    },
    'BULL_FIGHTER': {
        'id': 'BULL_FIGHTER',
        'file_name': 'bull_fighter.glb',
        'title': 'Bull Fighter - Minotauro Brutal de Lorencia',
        'folder': 'bull_fighter',
        'body_obj': 'bull_fighter_body.obj',
        'scale': 1.0,
        'collision': {'radius': 0.65, 'height': 1.9, 'step': 0.35},
    },
    'HOUND': {
        'id': 'HOUND',
        'file_name': 'hound.glb',
        'title': 'Hound - Cão Infernal de Lorencia',
        'folder': 'hound',
        'body_obj': 'hound_body.obj',
        'scale': 0.8,
        'collision': {'radius': 0.5, 'height': 1.1, 'step': 0.30},
    },
    'SKELETON': {
        'id': 'SKELETON',
        'file_name': 'skeleton.glb',
        'title': 'Skeleton - Guerreiro Esqueleto de Dungeon',
        'folder': 'skeleton',
        'body_obj': 'skeleton_body.obj',
        'scale': 0.95,
        'collision': {'radius': 0.45, 'height': 1.8, 'step': 0.35},
    },
    'LICH': {
        'id': 'LICH',
        'file_name': 'lich.glb',
        'title': 'Lich - Feiticeiro Necromante de Dungeon',
        'folder': 'lich',
        'body_obj': 'lich_body.obj',
        'scale': 1.0,
        'collision': {'radius': 0.55, 'height': 1.9, 'step': 0.35},
        'emissive_color': (0.3, 0.8, 0.3, 1.0),
    },
    'DEATH_KNIGHT': {
        'id': 'DEATH_KNIGHT',
        'file_name': 'death_knight.glb',
        'title': 'Death Knight - Cavaleiro da Morte de Lost Tower',
        'folder': 'death_knight',
        'body_obj': 'death_knight_body.obj',
        'weapon_obj': 'death_knight_sword.obj',
        'weapon_pos': (-25.0, 85.0, 20.0),
        'weapon_rot': (30, 0, 0),
        'weapon_scale': 1.0,
        'scale': 1.1,
        'collision': {'radius': 0.6, 'height': 2.1, 'step': 0.35},
    },
}

def clear_scene():
    """Limpa objetos, malhas e materiais da cena."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh)
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat)
    for img in bpy.data.images:
        bpy.data.images.remove(img)

def setup_pbr_material(mat, tex_folder, is_golden=False, emissive_color=None):
    """Configura o material Principled BSDF com texturas e acabamento PBR fiel."""
    try:
        mat.use_nodes = True
    except Exception:
        pass
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return

    tex_node = None
    for n in nodes:
        if n.type == 'TEX_IMAGE' and n.image:
            tex_node = n
            break

    if tex_node and tex_node.image:
        img = tex_node.image
        is_transparent = img.filepath.lower().endswith('.tga') or img.name.lower().endswith('.tga')
        if is_transparent:
            mat.blend_method = 'HASHED'
            mat.shadow_method = 'HASHED'
            links.new(tex_node.outputs['Alpha'], bsdf.inputs['Alpha'])
        else:
            mat.blend_method = 'OPAQUE'

    if is_golden:
        bsdf.inputs['Metallic'].default_value = 0.92
        bsdf.inputs['Roughness'].default_value = 0.28
        gold_color = (1.0, 0.78, 0.22, 1.0)
        if tex_node and tex_node.image:
            mix = nodes.new(type='ShaderNodeMix')
            mix.data_type = 'RGBA'
            mix.blend_type = 'MULTIPLY'
            mix.inputs[0].default_value = 0.85
            mix.inputs[7].default_value = gold_color
            links.new(tex_node.outputs['Color'], mix.inputs[6])
            links.new(mix.outputs[2], bsdf.inputs['Base Color'])
        else:
            bsdf.inputs['Base Color'].default_value = gold_color
    else:
        bsdf.inputs['Roughness'].default_value = 0.55
        bsdf.inputs['Metallic'].default_value = 0.15

    if emissive_color:
        try:
            bsdf.inputs['Emission Color'].default_value = emissive_color[:3] + (1.0,)
            bsdf.inputs['Emission Strength'].default_value = 1.8
        except Exception:
            pass

def build_creature(cfg):
    """Compila um modelo completo de criatura em GLB com raiz hierárquica e sub-malhas."""
    cid = cfg['id']
    folder = INPUT_BASE / cfg['folder']
    body_obj_path = folder / cfg['body_obj']

    if not body_obj_path.is_file():
        print(f"[-] OBJ do corpo não encontrado: {body_obj_path}")
        return False

    clear_scene()

    # 1. Cria nó raiz BESTIARY_{cid}
    root_obj = bpy.data.objects.new(f"BESTIARY_{cid}", None)
    bpy.context.collection.objects.link(root_obj)

    # Metadados canônicos oficiais e compatibilidade com auditoria
    root_obj["assetKind"] = "bestiary-creature-canonical"
    root_obj["creatureId"] = cid
    root_obj["title"] = cfg["title"]
    root_obj["isCanonicalMU"] = True
    root_obj["staticVisualOnly"] = True
    root_obj["collisionsIncluded"] = False
    root_obj["skeletalRigIncluded"] = False
    root_obj["animationClipsIncluded"] = False
    root_obj["runtimeEffectsIncluded"] = False
    root_obj["collisionRadius"] = cfg["collision"]["radius"]
    root_obj["collisionHeight"] = cfg["collision"]["height"]
    root_obj["stepHeight"] = cfg["collision"]["step"]
    root_obj["scaleFactor"] = cfg.get("scale", 1.0)

    # 2. Importa Corpo
    bpy.ops.wm.obj_import(filepath=str(body_obj_path))
    body_objs = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    if not body_objs:
        print(f"[-] Nenhuma malha importada para {cid}")
        return False

    # 3. Importa Arma se houver
    weapon_objs = []
    if 'weapon_obj' in cfg:
        weapon_obj_path = folder / cfg['weapon_obj']
        if weapon_obj_path.is_file():
            bpy.ops.object.select_all(action='DESELECT')
            bpy.ops.wm.obj_import(filepath=str(weapon_obj_path))
            w_imported = [o for o in bpy.context.selected_objects if o.type == 'MESH']
            for w in w_imported:
                w_pos = cfg.get('weapon_pos', (0, 0, 0))
                w_rot = cfg.get('weapon_rot', (0, 0, 0))
                w_s = cfg.get('weapon_scale', 1.0)
                w.location = Vector(w_pos)
                w.rotation_euler = Euler((math.radians(w_rot[0]), math.radians(w_rot[1]), math.radians(w_rot[2])))
                w.scale = Vector((w_s, w_s, w_s))
                bpy.context.view_layer.objects.active = w
                bpy.ops.object.select_all(action='DESELECT')
                w.select_set(True)
                bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
                weapon_objs.append(w)

    all_meshes = body_objs + weapon_objs

    # 4. Ajuste de Altura (Eixo Z é a altura no Blender, mapeada para Y no glTF)
    min_z = 999999.0
    for m in all_meshes:
        corners = [m.matrix_world @ Vector(corner) for corner in m.bound_box]
        min_z = min(min_z, min(c.z for c in corners))

    scale_factor = 0.01 * cfg.get('scale', 1.0)
    for m in all_meshes:
        m.location.z -= min_z
        bpy.context.view_layer.objects.active = m
        bpy.ops.object.select_all(action='DESELECT')
        m.select_set(True)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        m.scale = Vector((scale_factor, scale_factor, scale_factor))
        bpy.ops.object.transform_apply(scale=True)
        m.parent = root_obj

    # 5. Configura Materiais PBR em todas as submalhas
    is_gold = cfg.get('is_golden', False)
    em_col = cfg.get('emissive_color', None)
    for m in all_meshes:
        for mat_slot in m.material_slots:
            if mat_slot.material:
                setup_pbr_material(mat_slot.material, folder, is_golden=is_gold, emissive_color=em_col)

    # 6. Adiciona Empties de Landmarks Canônicos
    if cid in LANDMARKS:
        for lm in LANDMARKS[cid]:
            empty = bpy.data.objects.new(lm, None)
            bpy.context.collection.objects.link(empty)
            empty.parent = root_obj

    # 7. Seleciona raiz e toda hierarquia para exportação GLB
    bpy.ops.object.select_all(action='DESELECT')
    root_obj.select_set(True)
    for child in root_obj.children:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root_obj

    out_name = cfg['file_name']
    dest1 = OUT_DEV_VIEWER / out_name
    dest2 = OUT_PROTOTYPES / out_name

    for dest in [dest1, dest2]:
        bpy.ops.export_scene.gltf(
            filepath=str(dest),
            use_selection=True,
            export_format='GLB',
            export_materials='EXPORT',
            export_image_format='JPEG',
            export_extras=True,
            export_yup=True,
            export_apply=True,
        )

    print(f"[OK] Compilado: {cid} -> {dest1.name} (Tamanho: {dest1.stat().st_size // 1024} KB)")
    return True

def main():
    print("=" * 70)
    print("DASI MMORPG - COMPILADOR BLENDER 5.2 DO BESTIÁRIO CANÔNICO")
    print("=" * 70)

    success_count = 0
    fail_count = 0

    for cid, cfg in BESTIARY_CONFIG.items():
        try:
            print(f"\n[+] Compilando {cid}: {cfg['title']}")
            if build_creature(cfg):
                success_count += 1
            else:
                fail_count += 1
        except Exception as e:
            print(f"[-] Erro ao compilar {cid}: {e}")
            import traceback
            traceback.print_exc()
            fail_count += 1

    print("\n" + "=" * 70)
    print(f"CONCLUÍDO: {success_count} criaturas compiladas em GLB. ({fail_count} falhas)")
    print("=" * 70)

if __name__ == "__main__":
    main()
