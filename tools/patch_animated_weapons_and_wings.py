#!/usr/bin/env python3
"""
Dasi MMORPG - Canonical Animated Heroes Weapons & Rig Patcher
Blender 5.2.2 LTS Automation Script

Aplica com precisão cirúrgica a rotação, escala e sockets das armas nos 5 heróis animados:
- DK: Dragon Blade (hand_r) -> rot=(0, 90°, 0), loc=(0.0, 0.08, 0.0)
- DW: Kundun Staff (hand_r) -> rot=(0, 90°, 0), loc=(0.0, 0.08, 0.0)
- ELF: Celestial Bow (hand_l) -> rot=(180°, 0, 90°), loc=(0.0, 0.08, 0.0)
- MG: Rune Blade (hand_r) -> rot=(0, 90°, 0), loc=(0.0, 0.08, 0.0)
- DL: Lord Scepter (hand_r) -> rot=(0, 90°, 0), loc=(0.0, 0.08, 0.0)
- Golden Master Base DK: Weapon_Right (hand_r, +90° Y) e Weapon_Left (hand_l, -90° Y)

Remove resíduos, purga Icospheres de teste e reexporta mantendo todas as 21 animações.
"""

import bpy
import math
import shutil
from pathlib import Path
from mathutils import Vector, Euler, Matrix

WORKSPACE = Path("D:/Dasi")
MODELS_ANIM_DIR = WORKSPACE / "src/client/dev_viewer/models/animated_heroes"
MODELS_STATIC_DIR = WORKSPACE / "src/client/dev_viewer/models"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"

PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

HERO_PATCH_CONFIG = [
    {
        'id': 'DK',
        'file': 'hero_dk_animated.glb',
        'weapons': [
            {
                'name': 'dk_weapon',
                'bone': 'hand_r',
                'rot': Euler((0, math.radians(90), 0), 'XYZ'),
                'loc': Vector((0.0, 0.08, 0.0)),
            }
        ],
        'action_test': '1H_Melee_Attack_Chop',
        'action_frame': 10,
    },
    {
        'id': 'DW',
        'file': 'hero_dw_animated.glb',
        'weapons': [
            {
                'name': 'dw_weapon',
                'bone': 'hand_r',
                'rot': Euler((0, math.radians(90), 0), 'XYZ'),
                'loc': Vector((0.0, 0.08, 0.0)),
            }
        ],
        'action_test': 'Spellcast_Shoot',
        'action_frame': 10,
    },
    {
        'id': 'ELF',
        'file': 'hero_elf_animated.glb',
        'weapons': [
            {
                'name': 'elf_weapon',
                'bone': 'hand_l',
                'rot': Euler((math.radians(180), 0, math.radians(90)), 'XYZ'),
                'loc': Vector((0.0, 0.08, 0.0)),
            }
        ],
        'action_test': '2H_Ranged_Shoot',
        'action_frame': 10,
    },
    {
        'id': 'MG',
        'file': 'hero_mg_animated.glb',
        'weapons': [
            {
                'name': 'mg_weapon',
                'bone': 'hand_r',
                'rot': Euler((0, math.radians(90), 0), 'XYZ'),
                'loc': Vector((0.0, 0.08, 0.0)),
            }
        ],
        'action_test': '2H_Melee_Attack_Spin',
        'action_frame': 10,
    },
    {
        'id': 'DL',
        'file': 'hero_dl_animated.glb',
        'weapons': [
            {
                'name': 'dl_weapon',
                'bone': 'hand_r',
                'rot': Euler((0, math.radians(90), 0), 'XYZ'),
                'loc': Vector((0.0, 0.08, 0.0)),
            }
        ],
        'action_test': '1H_Melee_Attack_Slice_Horizontal',
        'action_frame': 10,
    },
    {
        'id': 'DK_MASTER',
        'file': 'hero_dk_master_base.glb',
        'weapons': [
            {
                'name': 'Weapon_Right',
                'bone': 'hand_r',
                'rot': Euler((0, math.radians(90), 0), 'XYZ'),
                'loc': Vector((0.0, 0.08, 0.0)),
            },
            {
                'name': 'Weapon_Left',
                'bone': 'hand_l',
                'rot': Euler((0, math.radians(-90), 0), 'XYZ'),
                'loc': Vector((0.0, 0.08, 0.0)),
            }
        ],
        'action_test': 'Sword_Idle',
        'action_frame': 0,
    },
]

def patch_and_reexport_all():
    print("=" * 65)
    print(">>> INICIANDO CALIBRAÇÃO DEFINITIVA DE ARMAS E RIGS ANIMADOS <<<")
    print("=" * 65)

    for cfg in HERO_PATCH_CONFIG:
        hero_id = cfg['id']
        filename = cfg['file']
        glb_path = MODELS_ANIM_DIR / filename
        print(f"\n[*] Processando {hero_id} ({filename})...")

        if not glb_path.exists():
            print(f"  [-] Arquivo não encontrado: {glb_path}")
            continue

        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(glb_path))

        armature = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        if not armature:
            print(f"  [-] Nenhum armature encontrado em {filename}")
            continue

        # Purga nós residuais proibidos (Icosphere, etc.)
        for o in list(bpy.data.objects):
            if 'icosphere' in o.name.lower():
                print(f"  [x] Removendo nó proibido: {o.name}")
                bpy.data.objects.remove(o, do_unlink=True)

        # Atualiza armas
        for w_cfg in cfg['weapons']:
            w_name = w_cfg['name']
            w_bone = w_cfg['bone']
            w_rot = w_cfg['rot']
            w_loc = w_cfg['loc']

            w_obj = bpy.data.objects.get(w_name)
            if not w_obj:
                print(f"  [-] Arma {w_name} não encontrada!")
                continue

            # Garante parentesco ao osso correto
            w_obj.parent = armature
            w_obj.parent_type = 'BONE'
            w_obj.parent_bone = w_bone
            w_obj.matrix_parent_inverse = Matrix.Identity(4)

            # Define rotação e translação local
            w_obj.rotation_mode = 'XYZ'
            w_obj.rotation_euler = w_rot
            w_obj.location = w_loc

            print(f"  [+] Arma {w_name} calibrada em {w_bone}: rot={w_rot}, loc={w_loc}")

        # Configura ação de Idle no frame 0
        act_idle = bpy.data.actions.get('Idle') or bpy.data.actions.get('Idle_Loop') or bpy.data.actions.get('Sword_Idle')
        if act_idle and armature.animation_data:
            armature.animation_data.action = act_idle
            bpy.context.scene.frame_set(0)

        # Exporta GLB com animações e skins preservadas
        bpy.ops.export_scene.gltf(
            filepath=str(glb_path),
            export_format='GLB',
            export_animations=True,
            export_skins=True
        )
        print(f"  [OK] Exportado: {glb_path.name} ({glb_path.stat().st_size / 1024:.1f} KB)")

        # Se for o master base, sincroniza com o static path
        if filename == 'hero_dk_master_base.glb':
            static_master = MODELS_STATIC_DIR / filename
            shutil.copyfile(str(glb_path), str(static_master))
            print(f"  [OK] Sincronizado estático: {static_master.name}")

        # Renderiza Prévia Oficial de Ação
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
        cam_obj.location = (0.0, -3.2, 1.2)
        cam_obj.rotation_euler = (math.radians(90), 0, 0)

        act_test = bpy.data.actions.get(cfg['action_test']) or act_idle
        if act_test and armature.animation_data:
            armature.animation_data.action = act_test
            scene.frame_set(cfg['action_frame'])
            bpy.context.view_layer.update()

            out_png = PREVIEWS_DIR / f"final_calibrated_{hero_id.lower()}_{cfg['action_test'].lower()}.png"
            scene.render.filepath = str(out_png)
            bpy.ops.render.render(write_still=True)
            print(f"  [+] Preview de combate renderizado: {out_png.name}")

    print("\n" + "=" * 65)
    print("⚔️ TODAS AS ARMAS E RIGS ANIMADOS FORAM CALIBRADOS COM SUCESSO! ⚔️")
    print("=" * 65)

if __name__ == '__main__':
    patch_and_reexport_all()
