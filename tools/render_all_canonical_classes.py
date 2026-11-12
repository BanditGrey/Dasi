#!/usr/bin/env python3
"""
Renderizador Automatizado das 5 Classes Canônicas
Dasi MMORPG - Visual Studio 3D (Blender 5.2 LTS)
"""
import os
import math
import shutil
import bpy
from mathutils import Vector
from pathlib import Path

OUTPUT_DIR = r"C:\Users\Daniel\.gemini\antigravity\brain\75557842-b49e-4fe1-b191-df1ca4ecde6f"
REPO_PREVIEW_DIR = r"D:\Dasi\docs\art_previews"
CLASSES_BASE = Path(r"D:\Dasi\conversions\output\classes")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(REPO_PREVIEW_DIR, exist_ok=True)

CLASS_SETS = [
    {
        "id": "dk_dragon",
        "name": "Cavaleiro do Sangue - Set Dragon + Dragon Blade",
        "dir": CLASSES_BASE / "dk",
        "parts": [
            "dk_dragon_helm.obj",
            "dk_dragon_chest.obj",
            "dk_dragon_legs.obj",
            "dk_dragon_gloves.obj",
            "dk_dragon_boots.obj",
            "dk_weapon_dragon_blade.obj"
        ],
        "cam_pitch": 82,
        "dist_factor": 1.7
    },
    {
        "id": "dw_legendary",
        "name": "Arquimago do Caos - Set Legendary + Kundun Staff",
        "dir": CLASSES_BASE / "dw",
        "parts": [
            "dw_legendary_helm.obj",
            "dw_legendary_chest.obj",
            "dw_legendary_legs.obj",
            "dw_legendary_gloves.obj",
            "dw_legendary_boots.obj",
            "dw_weapon_staff_of_kundun.obj"
        ],
        "cam_pitch": 82,
        "dist_factor": 1.7
    },
    {
        "id": "elf_guardian",
        "name": "Vigia da Floresta - Set Guardian + Celestial Bow",
        "dir": CLASSES_BASE / "elf",
        "parts": [
            "elf_guardian_helm.obj",
            "elf_guardian_chest.obj",
            "elf_guardian_legs.obj",
            "elf_guardian_gloves.obj",
            "elf_guardian_boots.obj",
            "elf_weapon_celestial_bow.obj"
        ],
        "cam_pitch": 82,
        "dist_factor": 1.7
    },
    {
        "id": "mg_stormcrow",
        "name": "Gladiador Rúnico - Set Storm Crow + Rune Blade",
        "dir": CLASSES_BASE / "mg",
        "parts": [
            "mg_storm_crow_chest.obj",
            "mg_storm_crow_legs.obj",
            "mg_storm_crow_gloves.obj",
            "mg_storm_crow_boots.obj",
            "mg_weapon_rune_blade.obj"
        ],
        "cam_pitch": 82,
        "dist_factor": 1.7
    },
    {
        "id": "dl_darksteel",
        "name": "Soberano Imperial - Set Dark Steel + Great Lord Scepter",
        "dir": CLASSES_BASE / "dl",
        "parts": [
            "dl_dark_steel_chest.obj",
            "dl_dark_steel_legs.obj",
            "dl_dark_steel_gloves.obj",
            "dl_dark_steel_boots.obj",
            "dl_weapon_great_lord_scepter.obj",
            "dl_cape_mantle_of_monarch.obj"
        ],
        "cam_pitch": 82,
        "dist_factor": 1.7
    }
]

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def get_character_bounds():
    min_co = Vector((float('inf'), float('inf'), float('inf')))
    max_co = Vector((float('-inf'), float('-inf'), float('-inf')))
    found = False

    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            found = True
            for corner in obj.bound_box:
                world_co = obj.matrix_world @ Vector(corner)
                min_co.x = min(min_co.x, world_co.x)
                min_co.y = min(min_co.y, world_co.y)
                min_co.z = min(min_co.z, world_co.z)
                max_co.x = max(max_co.x, world_co.x)
                max_co.y = max(max_co.y, world_co.y)
                max_co.z = max(max_co.z, world_co.z)

    if not found:
        return Vector((0, 0, 0)), 1.8, Vector((1, 1, 1))

    center = (min_co + max_co) / 2.0
    size = max_co - min_co
    height = max(size.x, size.y, size.z, 1.0)
    return center, height, size

def render_class_set(c_info):
    print(f"\n==========================================")
    print(f"Renderizando {c_info['name']}...")
    print(f"==========================================")
    clear_scene()

    for p in c_info["parts"]:
        f = c_info["dir"] / p
        if f.is_file():
            bpy.ops.wm.obj_import(filepath=str(f))

    center, height, size = get_character_bounds()
    print(f"Centro: {center}, Altura: {height:.2f}, Dimensões: {size}")

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.studio_light = 'Default'
    scene.display.shading.color_type = 'TEXTURE'
    scene.display.shading.show_shadows = True
    scene.display.shading.shadow_intensity = 0.55
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = 'BOTH'

    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1200
    scene.render.film_transparent = True

    # Camera em ângulo 3/4 heróico
    cam_data = bpy.data.cameras.new("HeroCam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("HeroCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    dist = height * c_info["dist_factor"]
    cam_obj.location = (center.x + dist * 0.45, center.y - dist * 1.05, center.z + height * 0.15)
    
    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    out_brain = os.path.join(OUTPUT_DIR, f"canonical_{c_info['id']}_preview.png")
    out_repo = os.path.join(REPO_PREVIEW_DIR, f"canonical_{c_info['id']}_preview.png")

    scene.render.filepath = out_brain
    bpy.ops.render.render(write_still=True)
    shutil.copyfile(out_brain, out_repo)
    print(f"✅ Render salvo: {out_brain}")

if __name__ == '__main__':
    for c in CLASS_SETS:
        render_class_set(c)
    print("\nTODAS AS 5 CLASSES CANÔNICAS FORAM RENDERIZADAS COM SUCESSO!")
