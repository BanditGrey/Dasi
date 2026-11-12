#!/usr/bin/env python3
"""
Dasi MMORPG - Golden Master Base Builder: Dark Knight (Blade Knight)
Blender 5.2 LTS Automation Script

Monta o modelo de estudo heroico unificado, limpo e modular:
- Anatomia base humana completa (Body_*)
- Armadura Dragon completa (Armor_*)
- Asas de Dragão canônicas (Wings_Dragon)
- Armas de mão direita e esquerda (Weapon_Right, Weapon_Left)
- Rigging esquelético oficial com 21 animações e postura nobre Idle
- Renderização de 4 câmeras de inspeção em docs/art_previews/
"""

import os
import math
import shutil
import bpy
from pathlib import Path
from mathutils import Vector, Euler, Matrix

WORKSPACE = Path("D:/Dasi")
DK_DIR = WORKSPACE / "conversions/output/classes/dk"
MODELS_ANIM_DIR = WORKSPACE / "src/client/dev_viewer/models/animated_heroes"
MODELS_STATIC_DIR = WORKSPACE / "src/client/dev_viewer/models"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"

PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_ANIM_DIR.mkdir(parents=True, exist_ok=True)
MODELS_STATIC_DIR.mkdir(parents=True, exist_ok=True)

BODY_PARTS = [
    ("Body_Head", "dk_base_head.obj"),
    ("Body_Chest", "dk_base_chest.obj"),
    ("Body_Legs", "dk_base_legs.obj"),
    ("Body_Gloves", "dk_base_gloves.obj"),
    ("Body_Boots", "dk_base_boots.obj"),
]

ARMOR_PARTS = [
    ("Armor_Helm", "dk_dragon_helm.obj"),
    ("Armor_Chest", "dk_dragon_chest.obj"),
    ("Armor_Legs", "dk_dragon_legs.obj"),
    ("Armor_Gloves", "dk_dragon_gloves.obj"),
    ("Armor_Boots", "dk_dragon_boots.obj"),
]

def import_clean_obj(filepath, name, scale=0.01):
    """Importa OBJ, unifica submalhas se existirem, aplica escala e renomeia."""
    before = set(bpy.data.objects)
    bpy.ops.wm.obj_import(filepath=str(filepath))
    new_objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    
    if not new_objs:
        raise RuntimeError(f"Nenhuma malha importada de {filepath}")

    bpy.ops.object.select_all(action='DESELECT')
    for o in new_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = new_objs[0]

    if len(new_objs) > 1:
        bpy.ops.object.join()
        merged = bpy.context.view_layer.objects.active
    else:
        merged = new_objs[0]

    merged.name = name
    merged.scale = (scale, scale, scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return merged

def setup_all_materials():
    """Configura materiais PBR para Principled BSDF com suporte a transparência e texturas."""
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        tex_node = next((n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE'), None)
        if bsdf and tex_node and tex_node.image:
            img_path = tex_node.image.filepath.lower()
            if any(k in img_path for k in ['wing', '.tga', 'angel', 'satan', 'neww']):
                if hasattr(mat, 'blend_method'):
                    mat.blend_method = 'BLEND'
                mat.node_tree.links.new(tex_node.outputs['Alpha'], bsdf.inputs['Alpha'])
            if 'Roughness' in bsdf.inputs:
                bsdf.inputs['Roughness'].default_value = 0.35
            if 'Metallic' in bsdf.inputs:
                bsdf.inputs['Metallic'].default_value = 0.25

def build_golden_master_dk():
    print("=" * 60)
    print(">>> CONSTRUINDO GOLDEN MASTER BASE: DARK KNIGHT (BLENDER 5.2)")
    print("=" * 60)

    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 1. Carregar Rig e 21 animações de hero_dk_animated.glb
    source_rig_path = MODELS_ANIM_DIR / "hero_dk_animated.glb"
    bpy.ops.import_scene.gltf(filepath=str(source_rig_path))
    armature = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    armature.name = "Armature"

    # Purga total de qualquer malha pré-existente
    for o in list(bpy.data.objects):
        if o != armature:
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        if m.users == 0:
            bpy.data.meshes.remove(m)

    # Resetar pose para Rest Pose perfeita
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.transforms_clear()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 2. Importar Anatomia Base (Body_*)
    body_meshes = []
    for node_name, obj_file in BODY_PARTS:
        fpath = DK_DIR / obj_file
        mesh_obj = import_clean_obj(fpath, node_name)
        body_meshes.append(mesh_obj)

    # Vincular Anatomia Base com ARMATURE_AUTO
    bpy.ops.object.select_all(action='DESELECT')
    for m in body_meshes:
        m.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # 3. Importar Armadura Dragon (Armor_*)
    armor_meshes = []
    for node_name, obj_file in ARMOR_PARTS:
        fpath = DK_DIR / obj_file
        mesh_obj = import_clean_obj(fpath, node_name)
        armor_meshes.append(mesh_obj)

    # Vincular Armadura com ARMATURE_AUTO
    bpy.ops.object.select_all(action='DESELECT')
    for m in armor_meshes:
        m.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # 4. Importar Asas de Dragão (Wings_Dragon)
    wings_obj = import_clean_obj(DK_DIR / "dk_wings_of_dragon.obj", "Wings_Dragon")
    # Posição dorsal canônica na escápula: Y = 0.10 (atrás do peito), Z = 1.30 (altura da espinha)
    wings_obj.location = Vector((0.0, 0.10, 1.30))
    bpy.ops.object.select_all(action='DESELECT')
    wings_obj.select_set(True)
    bpy.context.view_layer.objects.active = wings_obj
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    spine_bone = armature.data.bones.get('spine_03')
    wings_obj.parent = armature
    wings_obj.parent_type = 'BONE'
    wings_obj.parent_bone = 'spine_03'
    if spine_bone:
        wings_obj.matrix_parent_inverse = (armature.matrix_world @ spine_bone.matrix_local).inverted()

    # 5. Importar Arma Principal (Mão Direita): Dragon Blade
    wep_r = import_clean_obj(DK_DIR / "dk_weapon_dragon_blade.obj", "Weapon_Right")
    wep_r.parent = armature
    wep_r.parent_type = 'BONE'
    wep_r.parent_bone = 'hand_r'
    wep_r.matrix_parent_inverse = Matrix.Identity(4)
    wep_r.location = Vector((0.0, 0.04, 0.0))
    wep_r.rotation_euler = Euler((math.radians(45), math.radians(10), 0), 'XYZ')

    # 6. Importar Arma Secundária (Mão Esquerda): Archangel Sword
    wep_l = import_clean_obj(DK_DIR / "dk_weapon_archangel_sword.obj", "Weapon_Left")
    wep_l.parent = armature
    wep_l.parent_type = 'BONE'
    wep_l.parent_bone = 'hand_l'
    wep_l.matrix_parent_inverse = Matrix.Identity(4)
    wep_l.location = Vector((0.0, 0.04, 0.0))
    wep_l.rotation_euler = Euler((math.radians(45), math.radians(-10), 0), 'XYZ')

    # 7. Configurar Materiais PBR
    setup_all_materials()

    # 8. Exportar GLBs Canônicos
    target_anim = MODELS_ANIM_DIR / "hero_dk_master_base.glb"
    target_static = MODELS_STATIC_DIR / "hero_dk_master_base.glb"

    bpy.ops.export_scene.gltf(
        filepath=str(target_anim),
        export_format='GLB',
        export_animations=True,
        export_skins=True
    )
    print(f"  OK: {target_anim.name} ({target_anim.stat().st_size} bytes)")

    shutil.copyfile(str(target_anim), str(target_static))
    print(f"  OK: {target_static.name} sincronizado")

    # 9. Renderização das 4 vistas de inspeção de QA
    render_master_previews(armature, body_meshes, armor_meshes, wings_obj, [wep_r, wep_l])

def setup_studio_lighting_and_cam():
    """Configura iluminação de estúdio 360º (four-point studio lighting) e câmera calibrada."""
    # Luz Principal Frontal Direita (Key Light)
    key_light = bpy.data.lights.new(name="KeyLight", type='SUN')
    key_light.energy = 4.5
    key_obj = bpy.data.objects.new("KeyLight", key_light)
    key_obj.location = (3.0, -3.5, 4.0)
    key_obj.rotation_euler = (math.radians(55), 0, math.radians(35))
    bpy.context.scene.collection.objects.link(key_obj)

    # Luz de Preenchimento Frontal Esquerda (Fill Light)
    fill_light = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_light.energy = 2.5
    fill_obj = bpy.data.objects.new("FillLight", fill_light)
    fill_obj.location = (-3.5, -3.0, 3.5)
    fill_obj.rotation_euler = (math.radians(50), 0, math.radians(-40))
    bpy.context.scene.collection.objects.link(fill_obj)

    # Luz Traseira de Inspeção Dorsal (Back Key Light)
    back_light = bpy.data.lights.new(name="BackKeyLight", type='SUN')
    back_light.energy = 4.0
    back_obj = bpy.data.objects.new("BackKeyLight", back_light)
    back_obj.location = (0.0, 4.5, 3.5)
    back_obj.rotation_euler = (math.radians(-50), 0, math.radians(180))
    bpy.context.scene.collection.objects.link(back_obj)

    # Luz Superior de Contorno (Top Rim Light)
    rim_light = bpy.data.lights.new(name="TopRimLight", type='SUN')
    rim_light.energy = 3.0
    rim_obj = bpy.data.objects.new("TopRimLight", rim_light)
    rim_obj.location = (0.0, 0.0, 5.0)
    rim_obj.rotation_euler = (0, 0, 0)
    bpy.context.scene.collection.objects.link(rim_obj)

    # Câmera com FOV e distância ergonômicos
    cam_data = bpy.data.cameras.new("QACam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("QACam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Configurações de Render
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    bpy.context.scene.render.resolution_x = 1280
    bpy.context.scene.render.resolution_y = 1080
    bpy.context.scene.render.film_transparent = True
    return cam_obj

def render_master_previews(armature, body_meshes, armor_meshes, wings_obj, wep_objs):
    print("\n--- Renderizando 4 Visualizações de QA da Golden Master Base ---")
    cam_obj = setup_studio_lighting_and_cam()

    # Seleciona postura de repouso nobre (Idle frame 0)
    idle_action = bpy.data.actions.get('Idle') or bpy.data.actions.get('Sword_Idle')
    if idle_action and armature.animation_data:
        armature.animation_data.action = idle_action
        bpy.context.scene.frame_set(0)

    # Vista 1: Completa Frontal 3/4 (Full Master com Armadura, Asas e Armas em postura Idle)
    armature.data.pose_position = 'POSE'
    cam_obj.location = (2.0, -4.5, 1.15)
    cam_obj.rotation_euler = (math.radians(78), 0, math.radians(24))
    bpy.context.scene.render.filepath = str(PREVIEWS_DIR / "dk_master_base_full.png")
    bpy.ops.render.render(write_still=True)
    print(f"  OK: dk_master_base_full.png")

    # Para as vistas anatômicas e de armadura pura, usa Rest Pose (postura ereta estática de alfaiataria)
    armature.data.pose_position = 'REST'

    # Vista 2: Apenas Anatomia Base Humana (Body_*)
    for a in armor_meshes: a.hide_render = True
    wings_obj.hide_render = True
    for w in wep_objs: w.hide_render = True
    cam_obj.location = (1.2, -3.8, 1.05)
    cam_obj.rotation_euler = (math.radians(82), 0, math.radians(18))
    bpy.context.scene.render.filepath = str(PREVIEWS_DIR / "dk_master_base_body.png")
    bpy.ops.render.render(write_still=True)
    print(f"  OK: dk_master_base_body.png")

    # Vista 3: Armadura Dragon Vestindo a Anatomia Base
    for a in armor_meshes: a.hide_render = False
    bpy.context.scene.render.filepath = str(PREVIEWS_DIR / "dk_master_base_armor.png")
    bpy.ops.render.render(write_still=True)
    print(f"  OK: dk_master_base_armor.png")

    # Vista 4: Vista Traseira com Asas (Back Wings Inspection mostrando fixação dorsal na escápula)
    wings_obj.hide_render = False
    for w in wep_objs: w.hide_render = False
    cam_obj.location = (0.0, 4.6, 1.25)
    cam_obj.rotation_euler = (math.radians(80), 0, math.radians(180))
    bpy.context.scene.render.filepath = str(PREVIEWS_DIR / "dk_master_base_back_wings.png")
    bpy.ops.render.render(write_still=True)
    print(f"  OK: dk_master_base_back_wings.png")

if __name__ == '__main__':
    build_golden_master_dk()
