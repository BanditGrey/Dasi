#!/usr/bin/env python3
"""
Dasi MMORPG - Build Pipeline de Assets 3D Canônicos
Compilador em lote usando Blender 5.2 LTS

Converte os modelos 3D (.obj) e texturas (.jpg/.tga) extraídos dos arquivos
oficiais de estudo do MU Online Season 5.2 em arquivos GLB de alta fidelidade:
1. Heróis Estáticos Completos (5 classes) em `src/client/dev_viewer/models/` e `prototypes/3d_scenery/`
2. Heróis Animados Completos (5 classes) em `src/client/dev_viewer/models/animated_heroes/`
3. Heróis Modulares (5 classes), 60 Módulos de Armadura e 12 Armas em `src/client/dev_viewer/models/modular_heroes/`
"""

import bpy
import os
import shutil
import math
from pathlib import Path
from mathutils import Vector, Euler, Matrix

WORKSPACE = Path("D:/Dasi")
CLASSES_DIR = WORKSPACE / "conversions/output/classes"
MODELS_DIR = WORKSPACE / "src/client/dev_viewer/models"
ANIM_DIR = MODELS_DIR / "animated_heroes"
MODULAR_DIR = MODELS_DIR / "modular_heroes"
PROTOTYPES_DIR = WORKSPACE / "prototypes/3d_scenery"

# Garantir diretórios de saída
for d in [MODELS_DIR, ANIM_DIR, MODULAR_DIR, PROTOTYPES_DIR]:
    d.mkdir(parents=True, exist_ok=True)

HERO_CONFIG = {
    'DK': {
        'id': 'DK',
        'lower': 'dk',
        'static_name': 'hero_dark_knight.glb',
        'anim_file': 'hero_dk_animated.glb',
        'elite_set': {
            'helmet': 'dk_dragon_helm.obj',
            'chest': 'dk_dragon_chest.obj',
            'shoulders': 'dk_dragon_chest.obj',
            'gloves': 'dk_dragon_gloves.obj',
            'legs': 'dk_dragon_legs.obj',
            'boots': 'dk_dragon_boots.obj',
        },
        'base_set': {
            'helmet': 'dk_leather_helm.obj',
            'chest': 'dk_leather_chest.obj',
            'shoulders': 'dk_leather_chest.obj',
            'gloves': 'dk_leather_gloves.obj',
            'legs': 'dk_leather_legs.obj',
            'boots': 'dk_leather_boots.obj',
        },
        'body_base': [
            'dk_base_head.obj', 'dk_base_chest.obj', 'dk_base_legs.obj',
            'dk_base_gloves.obj', 'dk_base_boots.obj'
        ],
        'wings': 'dk_wings_of_dragon.obj',
        'wings_z': 1.30,
        'wings_y': 0.10,
        'weapons': {
            'DRAGON_BLADE': 'dk_weapon_dragon_blade.obj',
            'ARCHANGEL_SWORD': 'dk_weapon_archangel_sword.obj',
            'CHAOS_DRAGON_AXE': 'dk_weapon_chaos_dragon_axe.obj',
            'SWORD_OF_DESTRUCTION': 'dk_weapon_sword_of_destruction.obj',
        },
        'weapon_main': 'DRAGON_BLADE',
        'weapon_bone': 'hand_r',
        'weapon_loc': (0.0, 0.04, 0.0),
        'weapon_rot': (math.radians(45), math.radians(10), math.radians(0)),
        'static_wep_pos': (-0.68, 0.06, 1.45),
        'static_wep_rot': (math.radians(70), 0, math.radians(90)),
    },
    'DW': {
        'id': 'DW',
        'lower': 'dw',
        'static_name': 'hero_dark_wizard.glb',
        'anim_file': 'hero_dw_animated.glb',
        'elite_set': {
            'helmet': 'dw_legendary_helm.obj',
            'chest': 'dw_legendary_chest.obj',
            'shoulders': 'dw_legendary_chest.obj',
            'gloves': 'dw_legendary_gloves.obj',
            'legs': 'dw_legendary_legs.obj',
            'boots': 'dw_legendary_boots.obj',
        },
        'base_set': {
            'helmet': 'dw_pad_helm.obj',
            'chest': 'dw_pad_chest.obj',
            'shoulders': 'dw_pad_chest.obj',
            'gloves': 'dw_pad_gloves.obj',
            'legs': 'dw_pad_legs.obj',
            'boots': 'dw_pad_boots.obj',
        },
        'body_base': [
            'dw_base_head.obj', 'dw_base_chest.obj', 'dw_base_legs.obj',
            'dw_base_gloves.obj', 'dw_base_boots.obj'
        ],
        'wings': 'dw_wings_of_soul.obj',
        'wings_z': 1.30,
        'wings_y': 0.0,
        'weapons': {
            'KUNDUN_STAFF': 'dw_weapon_staff_of_kundun.obj',
            'CHAOS_LIGHTNING_STAFF': 'dw_weapon_chaos_lightning_staff.obj',
        },
        'weapon_main': 'KUNDUN_STAFF',
        'weapon_bone': 'hand_r',
        'weapon_loc': (0.0, 0.04, 0.0),
        'weapon_rot': (math.radians(48.9), math.radians(9.7), math.radians(4.4)),
        'static_wep_pos': (-0.64, 0.05, 1.42),
        'static_wep_rot': (math.radians(70), 0, math.radians(90)),
    },
    'ELF': {
        'id': 'ELF',
        'lower': 'elf',
        'static_name': 'hero_fairy_elf.glb',
        'anim_file': 'hero_elf_animated.glb',
        'elite_set': {
            'helmet': 'elf_guardian_helm.obj',
            'chest': 'elf_guardian_chest.obj',
            'shoulders': 'elf_guardian_chest.obj',
            'gloves': 'elf_guardian_gloves.obj',
            'legs': 'elf_guardian_legs.obj',
            'boots': 'elf_guardian_boots.obj',
        },
        'base_set': {
            'helmet': 'elf_vine_helm.obj',
            'chest': 'elf_vine_chest.obj',
            'shoulders': 'elf_vine_chest.obj',
            'gloves': 'elf_vine_gloves.obj',
            'legs': 'elf_vine_legs.obj',
            'boots': 'elf_vine_boots.obj',
        },
        'body_base': [
            'elf_base_head.obj', 'elf_base_chest.obj', 'elf_base_legs.obj',
            'elf_base_gloves.obj', 'elf_base_boots.obj'
        ],
        'wings': 'elf_wings_of_spirits.obj',
        'wings_z': 1.30,
        'wings_y': 0.0,
        'weapons': {
            'CELESTIAL_BOW': 'elf_weapon_celestial_bow.obj',
            'GREAT_REIGN_CROSSBOW': 'elf_weapon_great_reign_crossbow.obj',
        },
        'weapon_main': 'CELESTIAL_BOW',
        'weapon_bone': 'hand_l',
        'weapon_loc': (0.0, 0.04, 0.0),
        'weapon_rot': (math.radians(55.4), math.radians(-18.8), math.radians(-9.9)),
        'static_wep_pos': (0.64, 0.05, 1.42),
        'static_wep_rot': (0, 0, 0),
    },
    'MG': {
        'id': 'MG',
        'lower': 'mg',
        'static_name': 'hero_magic_gladiator.glb',
        'anim_file': 'hero_mg_animated.glb',
        'elite_set': {
            'helmet': 'mg_base_head.obj',
            'chest': 'mg_hurricane_chest.obj',
            'shoulders': 'mg_hurricane_chest.obj',
            'gloves': 'mg_hurricane_gloves.obj',
            'legs': 'mg_hurricane_legs.obj',
            'boots': 'mg_hurricane_boots.obj',
        },
        'base_set': {
            'helmet': 'mg_base_head.obj',
            'chest': 'mg_storm_crow_chest.obj',
            'shoulders': 'mg_storm_crow_chest.obj',
            'gloves': 'mg_storm_crow_gloves.obj',
            'legs': 'mg_storm_crow_legs.obj',
            'boots': 'mg_storm_crow_boots.obj',
        },
        'body_base': [
            'mg_base_head.obj', 'mg_base_chest.obj', 'mg_base_legs.obj',
            'mg_base_gloves.obj', 'mg_base_boots.obj'
        ],
        'wings': 'mg_wings_of_darkness.obj',
        'wings_z': 1.30,
        'wings_y': 0.0,
        'weapons': {
            'RUNE_BLADE': 'mg_weapon_rune_blade.obj',
            'DUAL_ELEMENTAL': 'mg_weapon_rune_blade.obj',
        },
        'weapon_main': 'RUNE_BLADE',
        'weapon_bone': 'hand_r',
        'weapon_loc': (0.0, 0.04, 0.0),
        'weapon_rot': (math.radians(45), math.radians(10), math.radians(0)),
        'static_wep_pos': (-0.68, 0.06, 1.45),
        'static_wep_rot': (math.radians(70), 0, math.radians(90)),
    },
    'DL': {
        'id': 'DL',
        'lower': 'dl',
        'static_name': 'hero_dark_lord.glb',
        'anim_file': 'hero_dl_animated.glb',
        'elite_set': {
            'helmet': 'dl_dark_steel_helm.obj',
            'chest': 'dl_dark_steel_chest.obj',
            'shoulders': 'dl_dark_steel_chest.obj',
            'gloves': 'dl_dark_steel_gloves.obj',
            'legs': 'dl_dark_steel_legs.obj',
            'boots': 'dl_dark_steel_boots.obj',
        },
        'base_set': {
            'helmet': 'dl_light_plate_helm.obj',
            'chest': 'dl_light_plate_chest.obj',
            'shoulders': 'dl_light_plate_chest.obj',
            'gloves': 'dl_light_plate_gloves.obj',
            'legs': 'dl_light_plate_legs.obj',
            'boots': 'dl_light_plate_boots.obj',
        },
        'body_base': [
            'dl_base_head.obj', 'dl_base_chest.obj', 'dl_base_legs.obj',
            'dl_base_gloves.obj', 'dl_base_boots.obj'
        ],
        'wings': 'dl_cape_mantle_of_monarch.obj',
        'wings_z': 1.30,
        'wings_y': 0.0,
        'weapons': {
            'LORD_SCEPTER': 'dl_weapon_lord_scepter.obj',
            'GREAT_LORD_SCEPTER': 'dl_weapon_great_lord_scepter.obj',
        },
        'weapon_main': 'GREAT_LORD_SCEPTER',
        'weapon_bone': 'hand_r',
        'weapon_loc': (0.0, 0.04, 0.0),
        'weapon_rot': (math.radians(45), math.radians(10), math.radians(0)),
        'static_wep_pos': (-0.64, 0.05, 1.42),
        'static_wep_rot': (math.radians(70), 0, math.radians(90)),
    },
}

ANCHORS = {
    'helmet': (0.0, 1.66, 0.0),
    'chest': (0.0, 1.23, 0.0),
    'shoulders': (0.0, 1.46, 0.0),
    'gloves': (0.0, 0.95, 0.0),
    'legs': (0.0, 0.68, 0.0),
    'boots': (0.0, 0.17, 0.0),
}

ARMOR_SLOTS = ['helmet', 'chest', 'shoulders', 'gloves', 'legs', 'boots']
ARMOR_VARIANTS = ['base', 'elite']

def setup_materials():
    """Configura materiais PBR, conecta canal Alfa para texturas transparentes e desativa culling."""
    for mat in bpy.data.materials:
        mat.use_backface_culling = False
        if mat.node_tree:
            tex_node = None
            bsdf_node = None
            for n in mat.node_tree.nodes:
                if n.type == 'TEX_IMAGE':
                    tex_node = n
                elif n.type == 'BSDF_PRINCIPLED':
                    bsdf_node = n
            if tex_node and bsdf_node and tex_node.image:
                img_path = tex_node.image.filepath.lower()
                if any(k in img_path for k in ['wing', '.tga', 'ndw', 'neww', 'cape', 'hair']):
                    mat.node_tree.links.new(tex_node.outputs['Alpha'], bsdf_node.inputs['Alpha'])
                    if hasattr(mat, 'blend_method'):
                        mat.blend_method = 'BLEND'

def import_obj(filepath, scale=0.01):
    """Importa arquivo OBJ e aplica escala canônica de centímetros para metros glTF."""
    before = set(bpy.data.objects)
    bpy.ops.wm.obj_import(filepath=str(filepath))
    new_objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    for o in new_objs:
        o.scale = (scale, scale, scale)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return new_objs

# ==============================================================================
# 1. HERÓIS ESTÁTICOS COMPLETOS (5 CLASSES)
# ==============================================================================
def build_static_heroes():
    print("\n" + "="*60)
    print(">>> 1. COMPILANDO OS 5 HERÓIS ESTÁTICOS OFICIAIS CANÔNICOS")
    print("="*60)

    for class_id, cfg in HERO_CONFIG.items():
        print(f"\n[STATIC] Compilando {class_id} -> {cfg['static_name']}")
        bpy.ops.wm.read_factory_settings(use_empty=True)
        c_folder = CLASSES_DIR / cfg['lower']
        imported_meshes = []

        # Partes da armadura elite
        unique_parts = set(cfg['elite_set'].values())
        for part in unique_parts:
            p_objs = import_obj(c_folder / part)
            imported_meshes.extend(p_objs)

        # Asas / Capa canônica
        if cfg.get('wings'):
            w_objs = import_obj(c_folder / cfg['wings'])
            if len(w_objs) > 1:
                bpy.ops.object.select_all(action='DESELECT')
                for o in w_objs:
                    o.select_set(True)
                bpy.context.view_layer.objects.active = w_objs[0]
                bpy.ops.object.join()
                w_objs = [bpy.context.view_layer.objects.active]
            
            for o in w_objs:
                o.name = f"{cfg['lower']}_wings"
                o.location = Vector((0.0, cfg['wings_y'], cfg['wings_z']))
                bpy.context.view_layer.objects.active = o
                bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
            imported_meshes.extend(w_objs)

        # Arma principal
        main_wep_key = cfg['weapon_main']
        main_wep_file = cfg['weapons'][main_wep_key]
        wep_objs = import_obj(c_folder / main_wep_file)
        if len(wep_objs) > 1:
            bpy.ops.object.select_all(action='DESELECT')
            for o in wep_objs:
                o.select_set(True)
            bpy.context.view_layer.objects.active = wep_objs[0]
            bpy.ops.object.join()
            wep_objs = [bpy.context.view_layer.objects.active]

        w_pos = cfg['static_wep_pos']
        w_rot = cfg['static_wep_rot']
        for o in wep_objs:
            o.name = f"{cfg['lower']}_weapon"
            o.location = Vector(w_pos)
            o.rotation_euler = Euler(w_rot, 'XYZ')
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=False)
        imported_meshes.extend(wep_objs)

        setup_materials()

        out_path = MODELS_DIR / cfg['static_name']
        bpy.ops.export_scene.gltf(
            filepath=str(out_path),
            export_format='GLB',
            export_apply=True
        )
        print(f"  OK: {out_path.name} ({out_path.stat().st_size} bytes)")

        # Sincronizar com prototypes/3d_scenery
        proto_path = PROTOTYPES_DIR / cfg['static_name']
        shutil.copyfile(str(out_path), str(proto_path))
        print(f"  Sincronizado: {proto_path}")

# ==============================================================================
# 2. HERÓIS ANIMADOS COMPLETOS (5 CLASSES)
# ==============================================================================
def build_animated_heroes():
    print("\n" + "="*60)
    print(">>> 2. COMPILANDO OS 5 HERÓIS ANIMADOS OFICIAIS CANÔNICOS")
    print("="*60)

    for class_id, cfg in HERO_CONFIG.items():
        print(f"\n[ANIMATED] Compilando {class_id} -> {cfg['anim_file']}")
        bpy.ops.wm.read_factory_settings(use_empty=True)
        c_folder = CLASSES_DIR / cfg['lower']
        target_anim_path = ANIM_DIR / cfg['anim_file']

        # Importar GLB com Armature e animações
        bpy.ops.import_scene.gltf(filepath=str(target_anim_path))
        armature = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]

        # PURGA TOTAL E RIGOROSA: remove TODOS os objetos que não sejam o armature
        for o in list(bpy.data.objects):
            if o != armature:
                bpy.data.objects.remove(o, do_unlink=True)
        for m in list(bpy.data.meshes):
            if m.users == 0:
                bpy.data.meshes.remove(m)
        for mat in list(bpy.data.materials):
            if mat.users == 0:
                bpy.data.materials.remove(mat)

        # Resetar armature para rest pose antes de qualquer vínculo
        bpy.context.view_layer.objects.active = armature
        bpy.ops.object.mode_set(mode='POSE')
        bpy.ops.pose.select_all(action='SELECT')
        bpy.ops.pose.transforms_clear()
        bpy.ops.object.mode_set(mode='OBJECT')

        # Importar peças canônicas de armadura elite
        armor_objs = []
        unique_parts = set(cfg['elite_set'].values())
        for part in unique_parts:
            p_objs = import_obj(c_folder / part)
            armor_objs.extend(p_objs)

        # Vincular armadura com ARMATURE_AUTO
        bpy.ops.object.select_all(action='DESELECT')
        for o in armor_objs:
            o.select_set(True)
        armature.select_set(True)
        bpy.context.view_layer.objects.active = armature
        try:
            bpy.ops.object.parent_set(type='ARMATURE_AUTO')
        except Exception as e:
            print(f"  Aviso no parent_set: {e}")

        # Importar e parentear asas nas costas (spine_03)
        if cfg.get('wings'):
            wings_objs = import_obj(c_folder / cfg['wings'])
            if len(wings_objs) > 1:
                bpy.ops.object.select_all(action='DESELECT')
                for o in wings_objs:
                    o.select_set(True)
                bpy.context.view_layer.objects.active = wings_objs[0]
                bpy.ops.object.join()
                wings_objs = [bpy.context.view_layer.objects.active]

            spine_bone = armature.data.bones.get('spine_03')
            for w in wings_objs:
                w.name = f"{cfg['lower']}_wings"
                # Posiciona no espaço mundial de rest pose na altura da espinha
                w.location = Vector((0.0, cfg['wings_y'], cfg['wings_z']))
                bpy.context.view_layer.objects.active = w
                bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
                
                w.parent = armature
                w.parent_type = 'BONE'
                w.parent_bone = 'spine_03'
                if spine_bone:
                    w.matrix_parent_inverse = (armature.matrix_world @ spine_bone.matrix_local).inverted()

        # Importar e parentear arma na mão
        main_wep_key = cfg['weapon_main']
        main_wep_file = cfg['weapons'][main_wep_key]
        wep_objs = import_obj(c_folder / main_wep_file)
        if len(wep_objs) > 1:
            bpy.ops.object.select_all(action='DESELECT')
            for o in wep_objs:
                o.select_set(True)
            bpy.context.view_layer.objects.active = wep_objs[0]
            bpy.ops.object.join()
            wep_objs = [bpy.context.view_layer.objects.active]

        wep_bone_name = cfg['weapon_bone']
        for w in wep_objs:
            w.name = f"{cfg['lower']}_weapon"
            w.parent = armature
            w.parent_type = 'BONE'
            w.parent_bone = wep_bone_name
            w.matrix_parent_inverse = Matrix.Identity(4)
            w.location = Vector(cfg['weapon_loc'])
            w.rotation_euler = Euler(cfg['weapon_rot'], 'XYZ')

        # Configurar materiais PBR com canais alfa
        setup_materials()

        # Configurar ação ativa para 'Idle' no frame 0
        idle_action = bpy.data.actions.get('Idle') or bpy.data.actions.get('Idle_Loop')
        if idle_action and armature.animation_data:
            armature.animation_data.action = idle_action
            bpy.context.scene.frame_set(0)

        bpy.ops.export_scene.gltf(
            filepath=str(target_anim_path),
            export_format='GLB',
            export_animations=True,
            export_skins=True
        )
        print(f"  OK: {target_anim_path.name} ({target_anim_path.stat().st_size} bytes)")

# ==============================================================================
# 3. HERÓIS MODULARES, 60 MÓDULOS DE ARMADURA E 12 ARMAS OFICIAIS
# ==============================================================================
def build_modular_heroes():
    print("\n" + "="*60)
    print(">>> 3. COMPILANDO HERÓIS MODULARES, 60 MÓDULOS DE ARMADURA E 12 ARMAS")
    print("="*60)

    for class_id, cfg in HERO_CONFIG.items():
        lower = cfg['lower']
        c_folder = CLASSES_DIR / lower
        print(f"\n[MODULAR] Processando classe {class_id}")

        # A. 12 Módulos de armadura para esta classe (6 slots x 2 variantes)
        for slot in ARMOR_SLOTS:
            anchor_pos = ANCHORS[slot]
            for variant in ARMOR_VARIANTS:
                out_name = f"{lower}_{slot}_{variant}.glb"
                out_path = MODULAR_DIR / out_name
                bpy.ops.wm.read_factory_settings(use_empty=True)

                root_name = f"module_{class_id}_{slot}_{variant}"
                root = bpy.data.objects.new(root_name, None)
                root["heroClass"] = class_id
                root["slot"] = slot
                root["variant"] = variant
                root["formatVersion"] = 1
                bpy.context.scene.collection.objects.link(root)

                # Escolhe arquivo OBJ canônico
                obj_file = cfg['elite_set'][slot] if variant == 'elite' else cfg['base_set'][slot]
                p_objs = import_obj(c_folder / obj_file)

                # Ajusta centro da geometria relativo ao slot anchor
                for o in p_objs:
                    o.location = Vector((0.0, 0.0, -anchor_pos[1]))
                    bpy.context.view_layer.objects.active = o
                    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
                    o.parent = root

                setup_materials()

                bpy.ops.export_scene.gltf(
                    filepath=str(out_path),
                    export_format='GLB',
                    export_extras=True,
                    export_apply=True
                )

        print(f"  OK: 12 módulos de armadura exportados para {class_id}")

        # B. Módulos de armas para esta classe
        for wep_id, wep_file in cfg['weapons'].items():
            wep_out_name = f"{lower}_weapon_{wep_id.lower()}.glb"
            wep_out_path = MODULAR_DIR / wep_out_name
            bpy.ops.wm.read_factory_settings(use_empty=True)

            wep_root_name = f"module_{class_id}_weapon_{wep_id.lower()}"
            wep_root = bpy.data.objects.new(wep_root_name, None)
            wep_root["heroClass"] = class_id
            wep_root["weaponId"] = wep_id
            wep_root["formatVersion"] = 1
            bpy.context.scene.collection.objects.link(wep_root)

            p_objs = import_obj(c_folder / wep_file)

            # Para DUAL_ELEMENTAL (MG), duplica lâmina no lado esquerdo
            if wep_id == 'DUAL_ELEMENTAL':
                for o in list(p_objs):
                    dupe = o.copy()
                    dupe.data = o.data.copy()
                    dupe.name = o.name + "_dual_left"
                    dupe.location = Vector((-1.32, 0.0, 0.0))
                    bpy.context.scene.collection.objects.link(dupe)
                    dupe.parent = wep_root
                    p_objs.append(dupe)

            for o in p_objs:
                o.parent = wep_root

            setup_materials()

            bpy.ops.export_scene.gltf(
                filepath=str(wep_out_path),
                export_format='GLB',
                export_extras=True,
                export_apply=True
            )

        print(f"  OK: {len(cfg['weapons'])} armas exportadas para {class_id}")

        # C. Herói Modular Assembled: hero_${lower}_modular.glb
        bpy.ops.wm.read_factory_settings(use_empty=True)

        hero_root_name = f"hero_{class_id}_modular"
        hero_root = bpy.data.objects.new(hero_root_name, None)
        hero_root["heroClass"] = class_id
        hero_root["formatVersion"] = 1
        bpy.context.scene.collection.objects.link(hero_root)

        # 1. Corpo anatômico base
        body_group = bpy.data.objects.new("body_blockout", None)
        bpy.context.scene.collection.objects.link(body_group)
        body_group.parent = hero_root
        for b_part in cfg['body_base']:
            b_objs = import_obj(c_folder / b_part)
            for o in b_objs:
                o.parent = body_group

        # 2. Asas translúcidas
        if cfg.get('wings'):
            wings_group = bpy.data.objects.new(f"wings_blockout_{class_id}", None)
            bpy.context.scene.collection.objects.link(wings_group)
            wings_group.parent = hero_root
            w_objs = import_obj(c_folder / cfg['wings'])
            if len(w_objs) > 1:
                bpy.ops.object.select_all(action='DESELECT')
                for o in w_objs:
                    o.select_set(True)
                bpy.context.view_layer.objects.active = w_objs[0]
                bpy.ops.object.join()
                w_objs = [bpy.context.view_layer.objects.active]

            for o in w_objs:
                o.name = f"{lower}_wings"
                o.location = Vector((0.0, cfg['wings_y'], cfg['wings_z']))
                bpy.context.view_layer.objects.active = o
                bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
                o.parent = wings_group

        # 3. Âncoras e módulos base (slot_helmet, slot_chest, etc.)
        for slot in ARMOR_SLOTS:
            anchor_pos = ANCHORS[slot]
            anchor = bpy.data.objects.new(f"slot_{slot}", None)
            anchor.location = Vector((anchor_pos[0], -anchor_pos[2], anchor_pos[1]))
            bpy.context.scene.collection.objects.link(anchor)
            anchor.parent = hero_root

            module_root = bpy.data.objects.new(f"module_{class_id}_{slot}_base", None)
            module_root["heroClass"] = class_id
            module_root["slot"] = slot
            module_root["variant"] = "base"
            module_root["formatVersion"] = 1
            bpy.context.scene.collection.objects.link(module_root)
            module_root.parent = anchor

            # Carrega malha base para este slot
            base_file = cfg['base_set'][slot]
            p_objs = import_obj(c_folder / base_file)
            for o in p_objs:
                o.location = Vector((0.0, 0.0, -anchor_pos[1]))
                bpy.context.view_layer.objects.active = o
                bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
                o.parent = module_root

        # 4. Âncora da arma: slot_weapon com weapon_blockout_${id}
        weapon_anchor = bpy.data.objects.new("slot_weapon", None)
        weapon_anchor.location = Vector((0.66, 0.1, 1.02))
        bpy.context.scene.collection.objects.link(weapon_anchor)
        weapon_anchor.parent = hero_root

        weapon_group = bpy.data.objects.new(f"weapon_blockout_{class_id}", None)
        bpy.context.scene.collection.objects.link(weapon_group)
        weapon_group.parent = weapon_anchor

        main_wep_key = cfg['weapon_main']
        main_wep_file = cfg['weapons'][main_wep_key]
        wep_objs = import_obj(c_folder / main_wep_file)
        if len(wep_objs) > 1:
            bpy.ops.object.select_all(action='DESELECT')
            for o in wep_objs:
                o.select_set(True)
            bpy.context.view_layer.objects.active = wep_objs[0]
            bpy.ops.object.join()
            wep_objs = [bpy.context.view_layer.objects.active]

        for o in wep_objs:
            o.name = f"{lower}_weapon"
            o.parent = weapon_group

        setup_materials()

        modular_hero_path = MODULAR_DIR / f"hero_{lower}_modular.glb"
        bpy.ops.export_scene.gltf(
            filepath=str(modular_hero_path),
            export_format='GLB',
            export_extras=True,
            export_apply=False
        )
        print(f"  OK: {modular_hero_path.name} ({modular_hero_path.stat().st_size} bytes)")

def main():
    print("="*60)
    print("DASI MMORPG - COMPILAÇÃO DE ASSETS CANÔNICOS OFICIAIS (BLENDER 5.2)")
    print("="*60)
    build_static_heroes()
    build_animated_heroes()
    build_modular_heroes()
    print("\n" + "="*60)
    print("PIPELINE CONCLUÍDO COM 100% DE SUCESSO!")
    print("="*60)

if __name__ == '__main__':
    main()
