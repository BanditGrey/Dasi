#!/usr/bin/env python3
"""
Compilador Oficial do Dark Knight Golden Master Base
Gera `src/client/dev_viewer/models/hero_dk_master_base.glb` com estrutura modular
hierárquica limpa e nós nomeados especificamente para inspeção de camadas:
- Body_Head, Body_Chest, Body_Gloves, Body_Legs, Body_Boots
- Armor_Helm, Armor_Chest, Armor_Gloves, Armor_Legs, Armor_Boots
- Wings_Dragon
- Weapon_Right, Weapon_Left
"""

import bpy
import os
import math
from pathlib import Path
from mathutils import Vector, Euler

WORKSPACE = Path("D:/Dasi")
DK_DIR = WORKSPACE / "conversions/output/classes/dk"
OUT_FILE = WORKSPACE / "src/client/dev_viewer/models/hero_dk_master_base.glb"

PARTS = [
    # Anatomia Corporal Base
    ("Body_Head", DK_DIR / "dk_base_head.obj", None, None),
    ("Body_Chest", DK_DIR / "dk_base_chest.obj", None, None),
    ("Body_Gloves", DK_DIR / "dk_base_gloves.obj", None, None),
    ("Body_Legs", DK_DIR / "dk_base_legs.obj", None, None),
    ("Body_Boots", DK_DIR / "dk_base_boots.obj", None, None),

    # Armadura de Placas Dragon Set
    ("Armor_Helm", DK_DIR / "dk_dragon_helm.obj", None, None),
    ("Armor_Chest", DK_DIR / "dk_dragon_chest.obj", None, None),
    ("Armor_Gloves", DK_DIR / "dk_dragon_gloves.obj", None, None),
    ("Armor_Legs", DK_DIR / "dk_dragon_legs.obj", None, None),
    ("Armor_Boots", DK_DIR / "dk_dragon_boots.obj", None, None),

    # Asas de Dragão (Asas Nv 2 Canônicas)
    ("Wings_Dragon", DK_DIR / "dk_wings_of_dragon.obj", (0.0, 0.10, 1.30), None),

    # Armas Canônicas (Dragon Blade na direita e Archangel Sword na esquerda)
    ("Weapon_Right", DK_DIR / "dk_weapon_dragon_blade.obj", (-0.68, 0.06, 1.45), (math.radians(70), 0, math.radians(90))),
    ("Weapon_Left", DK_DIR / "dk_weapon_archangel_sword.obj", (0.68, 0.06, 1.45), (math.radians(70), 0, math.radians(-90))),
]

def setup_materials():
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            mat.use_nodes = True
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

def import_part(name, filepath, pos, rot, scale=0.01):
    if not filepath.exists():
        print(f"AVISO: Arquivo {filepath} não encontrado!")
        return None

    before = set(bpy.data.objects)
    bpy.ops.wm.obj_import(filepath=str(filepath))
    new_objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    if not new_objs:
        return None

    if len(new_objs) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in new_objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = new_objs[0]
        bpy.ops.object.join()
        main_obj = bpy.context.view_layer.objects.active
    else:
        main_obj = new_objs[0]

    main_obj.name = name
    main_obj.scale = (scale, scale, scale)
    bpy.context.view_layer.objects.active = main_obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    if pos:
        main_obj.location = Vector(pos)
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    if rot:
        main_obj.rotation_euler = Euler(rot, 'XYZ')
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    return main_obj

def build():
    print("=" * 60)
    print(">>> COMPILANDO HERO_DK_MASTER_BASE.GLB VIA BLENDER 5.2")
    print("=" * 60)

    bpy.ops.wm.read_factory_settings(use_empty=True)

    for name, path, pos, rot in PARTS:
        print(f"Importando camada: {name} de {path.name}...")
        import_part(name, path, pos, rot)

    setup_materials()

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_FILE),
        export_format='GLB',
        export_apply=True
    )
    print(f"GLB Gerado com Sucesso: {OUT_FILE} ({OUT_FILE.stat().st_size} bytes)")

if __name__ == '__main__':
    build()
