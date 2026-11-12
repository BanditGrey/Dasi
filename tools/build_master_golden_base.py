#!/usr/bin/env python3
"""
Dasi MMORPG - Golden Master Base (Dark Knight / Blade Knight)
Script de Compilação Canônica Definitiva no Blender 5.2 LTS

Gera o modelo hero_dk_master_base.glb com arquitetura semântica limpa:
- Armature: Rig canônico com 21 ações, postura padrão Idle no frame 0
- Camada 1: Anatomia Base (Body_Head, Body_Chest, Body_Gloves, Body_Legs, Body_Boots)
- Camada 2: Armadura Dragon Set (Armor_Helm, Armor_Chest, Armor_Gloves, Armor_Legs, Armor_Boots)
- Camada 3: Asas (Wings_Dragon - NEWWW.jpg / NEWW_R.jpg)
- Camada 4: Armas Duplas (Weapon_Right - Dragon Blade, Weapon_Left - Archangel Sword)
- Zero nós órfãos, zero geometrias fantasmas, zero nós Icosphere
"""

import bpy
import os
import shutil
import math
from pathlib import Path
from mathutils import Vector, Euler, Matrix

WORKSPACE = Path("D:/Dasi")
DK_FOLDER = WORKSPACE / "conversions/output/classes/dk"
MODELS_DIR = WORKSPACE / "src/client/dev_viewer/models"
ANIM_DIR = MODELS_DIR / "animated_heroes"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"

PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
ANIM_DIR.mkdir(parents=True, exist_ok=True)

MASTER_GLB_PATH = MODELS_DIR / "hero_dk_master_base.glb"
ANIM_GLB_PATH = ANIM_DIR / "hero_dk_animated.glb"

print("="*60)
print("INICIANDO COMPILAÇÃO DO GOLDEN MASTER BASE (DK)")
print("="*60)

# 1. Carregar o rig base oficial com as 21 animações
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ANIM_GLB_PATH))

armature = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
armature.name = "Armature"

# 2. Purga total: remove tudo exceto o Armature
for o in list(bpy.data.objects):
    if o != armature:
        bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes):
    if m.users == 0:
        bpy.data.meshes.remove(m)
for mat in list(bpy.data.materials):
    if mat.users == 0:
        bpy.data.materials.remove(mat)

# 3. Resetar Armature para Rest Pose
bpy.context.view_layer.objects.active = armature
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.select_all(action='SELECT')
bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='OBJECT')

def import_obj_mesh(filepath, scale=0.01):
    before = set(bpy.data.objects)
    bpy.ops.wm.obj_import(filepath=str(filepath))
    new_objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    for o in new_objs:
        o.scale = (scale, scale, scale)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return new_objs

def setup_materials():
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

# ==============================================================================
# CAMADA 1: ANATOMIA BASE (CORPO NU)
# ==============================================================================
print("\n[CAMADA 1] Importando Anatomia Base (Corpo Nu)...")
body_mapping = [
    ("dk_base_head.obj", "Body_Head"),
    ("dk_base_chest.obj", "Body_Chest"),
    ("dk_base_gloves.obj", "Body_Gloves"),
    ("dk_base_legs.obj", "Body_Legs"),
    ("dk_base_boots.obj", "Body_Boots"),
]
body_objs = []
for fname, sname in body_mapping:
    objs = import_obj_mesh(DK_FOLDER / fname)
    if len(objs) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
    else:
        obj = objs[0]
    obj.name = sname
    body_objs.append(obj)
    print(f"  + {sname} ({len(obj.data.vertices)} vértices)")

# Skinning da anatomia base no Armature
bpy.ops.object.select_all(action='DESELECT')
for o in body_objs:
    o.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print("  Anatomia base vinculada com sucesso ao Armature.")

# ==============================================================================
# CAMADA 2: ARMADURA CANÔNICA (DRAGON SET)
# ==============================================================================
print("\n[CAMADA 2] Importando Armadura Canônica (Dragon Set)...")
armor_mapping = [
    ("dk_dragon_helm.obj", "Armor_Helm"),
    ("dk_dragon_chest.obj", "Armor_Chest"),
    ("dk_dragon_gloves.obj", "Armor_Gloves"),
    ("dk_dragon_legs.obj", "Armor_Legs"),
    ("dk_dragon_boots.obj", "Armor_Boots"),
]
armor_objs = []
for fname, sname in armor_mapping:
    objs = import_obj_mesh(DK_FOLDER / fname)
    if len(objs) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
    else:
        obj = objs[0]
    obj.name = sname
    armor_objs.append(obj)
    print(f"  + {sname} ({len(obj.data.vertices)} vértices)")

# Skinning da armadura Dragon no Armature
bpy.ops.object.select_all(action='DESELECT')
for o in armor_objs:
    o.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print("  Dragon Set vinculado com sucesso ao Armature.")

# ==============================================================================
# CAMADA 3: ASAS (WINGS OF DRAGON)
# ==============================================================================
print("\n[CAMADA 3] Importando Asas Canônicas (Wings of Dragon)...")
wings_objs = import_obj_mesh(DK_FOLDER / "dk_wings_of_dragon.obj")
if len(wings_objs) > 1:
    bpy.ops.object.select_all(action='DESELECT')
    for o in wings_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = wings_objs[0]
    bpy.ops.object.join()
    wings = bpy.context.view_layer.objects.active
else:
    wings = wings_objs[0]
wings.name = "Wings_Dragon"

# Posicionamento canônico dorsal milimétrico: Z = 1.30m, Y = +0.02m (atrás da couraça)
wings.location = Vector((0.0, 0.02, 1.30))
bpy.context.view_layer.objects.active = wings
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

spine_bone = armature.data.bones.get('spine_03')
wings.parent = armature
wings.parent_type = 'BONE'
wings.parent_bone = 'spine_03'
wings.matrix_parent_inverse = (armature.matrix_world @ spine_bone.matrix_local).inverted()
print(f"  + Wings_Dragon ({len(wings.data.vertices)} vértices) ancorada em spine_03.")

# ==============================================================================
# CAMADA 4: ARMAS CANÔNICAS (DUAL SWORDS: DRAGON BLADE & ARCHANGEL SWORD)
# ==============================================================================
print("\n[CAMADA 4] Importando Armas Canônicas (Dual Wield)...")

# 1. Mão Direita (hand_r): Dragon Blade
wep_r_objs = import_obj_mesh(DK_FOLDER / "dk_weapon_dragon_blade.obj")
if len(wep_r_objs) > 1:
    bpy.ops.object.select_all(action='DESELECT')
    for o in wep_r_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = wep_r_objs[0]
    bpy.ops.object.join()
    wep_r = bpy.context.view_layer.objects.active
else:
    wep_r = wep_r_objs[0]
wep_r.name = "Weapon_Right"

wep_r.parent = armature
wep_r.parent_type = 'BONE'
wep_r.parent_bone = 'hand_r'
wep_r.matrix_parent_inverse = Matrix.Identity(4)
wep_r.location = Vector((0.0, 0.04, 0.0))
wep_r.rotation_euler = Euler((math.radians(50.0), math.radians(-18.0), math.radians(-10.0)), 'XYZ')
print(f"  + Weapon_Right (Dragon Blade, {len(wep_r.data.vertices)} vértices) empunhada em hand_r.")

# 2. Mão Esquerda (hand_l): Archangel Sword
wep_l_objs = import_obj_mesh(DK_FOLDER / "dk_weapon_archangel_sword.obj")
if len(wep_l_objs) > 1:
    bpy.ops.object.select_all(action='DESELECT')
    for o in wep_l_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = wep_l_objs[0]
    bpy.ops.object.join()
    wep_l = bpy.context.view_layer.objects.active
else:
    wep_l = wep_l_objs[0]
wep_l.name = "Weapon_Left"

wep_l.parent = armature
wep_l.parent_type = 'BONE'
wep_l.parent_bone = 'hand_l'
wep_l.matrix_parent_inverse = Matrix.Identity(4)
wep_l.location = Vector((0.0, 0.04, 0.0))
wep_l.rotation_euler = Euler((math.radians(55.41), math.radians(-18.80), math.radians(-9.94)), 'XYZ')
print(f"  + Weapon_Left (Archangel Sword, {len(wep_l.data.vertices)} vértices) empunhada em hand_l.")

# 5. Configurar Materiais PBR
setup_materials()

# 6. Definir Postura Nobre Padrão: Ação 'Idle' no Frame 0
idle_action = bpy.data.actions.get('Idle') or bpy.data.actions.get('Idle_Loop')
if idle_action and armature.animation_data:
    armature.animation_data.action = idle_action
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

# Purga final de dados de malhas ou materiais sem uso antes de exportar
for m in list(bpy.data.meshes):
    if m.users == 0:
        bpy.data.meshes.remove(m)
for mat in list(bpy.data.materials):
    if mat.users == 0:
        bpy.data.materials.remove(mat)

print(f"\nArmature ativo: Ação={armature.animation_data.action.name if armature.animation_data and armature.animation_data.action else 'None'} no frame 0.")

# 7. Exportar Golden Master Base GLB
print(f"\n[EXPORT] Exportando Golden Master Base para {MASTER_GLB_PATH}...")
bpy.ops.export_scene.gltf(
    filepath=str(MASTER_GLB_PATH),
    export_format='GLB',
    export_animations=True,
    export_skins=True,
    export_extras=True
)
print(f"  OK: {MASTER_GLB_PATH.name} ({MASTER_GLB_PATH.stat().st_size} bytes)")

# 8. Atualizar hero_dk_animated.glb para manter paridade no Dev Viewer
print(f"[EXPORT] Sincronizando com {ANIM_GLB_PATH}...")
shutil.copyfile(str(MASTER_GLB_PATH), str(ANIM_GLB_PATH))
print(f"  OK: Paridade sincronizada ({ANIM_GLB_PATH.stat().st_size} bytes)")

# ==============================================================================
# 9. GERAÇÃO DE RENDERS DE ALTA DEFINIÇÃO DE QA
# ==============================================================================
print("\n" + "="*60)
print("GERANDO RENDERS DE AUDITORIA VISUAL DE QA")
print("="*60)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024

# Configurar World com Iluminação Ambiente de Estúdio Neutro
world = bpy.data.worlds.new("StudioWorld")
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.12, 0.13, 0.15, 1.0)
    bg.inputs["Strength"].default_value = 1.2
scene.world = world

for o in list(scene.collection.objects):
    if o.type in ['LIGHT', 'CAMERA']:
        bpy.data.objects.remove(o, do_unlink=True)

target = Vector((0.0, 0.0, 1.05))

def add_sun(name, loc, energy, rot_target):
    light_data = bpy.data.lights.new(name=name, type='SUN')
    light_data.energy = energy
    light_obj = bpy.data.objects.new(name=name, object_data=light_data)
    light_obj.location = loc
    direction = rot_target - Vector(loc)
    light_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(light_obj)
    return light_obj

# Rig de 4 Luzes de Estúdio PBR Focadas no Herói
add_sun("KeyLight", (2.0, -3.0, 2.5), 3.5, target)
add_sun("FillLight", (-2.5, -2.5, 2.0), 2.0, target)
add_sun("RimLight", (0.0, 3.0, 2.5), 3.0, target)
add_sun("FrontLight", (0.0, -3.5, 1.2), 1.5, target)

# Câmera Enquadramento Front-3/4 Nobre de Estúdio
cam_data = bpy.data.cameras.new(name="PreviewCam")
cam_obj = bpy.data.objects.new(name="PreviewCam", object_data=cam_data)
cam_obj.location = (0.9, -3.2, 1.25)
cam_dir = target - cam_obj.location
cam_obj.rotation_euler = cam_dir.to_track_quat('-Z', 'Y').to_euler()
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

def set_visibility(bodies=True, armors=True, wings_vis=True, weapons=True):
    for o in body_objs:
        o.hide_render = not bodies
    for o in armor_objs:
        o.hide_render = not armors
    wings.hide_render = not wings_vis
    wep_r.hide_render = not weapons
    wep_l.hide_render = not weapons

# 1. Render Nude Base (Anatomia Base)
set_visibility(bodies=True, armors=False, wings_vis=False, weapons=False)
scene.render.filepath = str(PREVIEWS_DIR / "dk_master_base_nude.png")
bpy.ops.render.render(write_still=True)
print(f"  Rendered: {scene.render.filepath}")

# 2. Render Armor Set (Dragon Set Completo sobre o corpo)
set_visibility(bodies=True, armors=True, wings_vis=False, weapons=False)
scene.render.filepath = str(PREVIEWS_DIR / "dk_master_base_armor.png")
bpy.ops.render.render(write_still=True)
print(f"  Rendered: {scene.render.filepath}")

# 3. Render Armor + Wings (Dragon Set + Wings of Dragon)
set_visibility(bodies=True, armors=True, wings_vis=True, weapons=False)
scene.render.filepath = str(PREVIEWS_DIR / "dk_master_base_wings.png")
bpy.ops.render.render(write_still=True)
print(f"  Rendered: {scene.render.filepath}")

# 4. Render Full Master Setup (Armor + Wings + Dual Weapons)
set_visibility(bodies=True, armors=True, wings_vis=True, weapons=True)
scene.render.filepath = str(PREVIEWS_DIR / "dk_master_base_full.png")
bpy.ops.render.render(write_still=True)
print(f"  Rendered: {scene.render.filepath}")

print("\n" + "="*60)
print("GOLDEN MASTER BASE DO DARK KNIGHT CONCLUÍDA COM 100% DE SUCESSO!")
print("="*60)
