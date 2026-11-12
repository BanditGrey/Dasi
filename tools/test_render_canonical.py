import os
import math
import shutil
import bpy
from mathutils import Vector
from pathlib import Path

OUTPUT_DIR = r"C:\Users\Daniel\.gemini\antigravity\brain\75557842-b49e-4fe1-b191-df1ca4ecde6f"
REPO_PREVIEW_DIR = r"D:\Dasi\docs\art_previews"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(REPO_PREVIEW_DIR, exist_ok=True)

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
        return Vector((0, 0, 0)), 1.8

    center = (min_co + max_co) / 2.0
    size = max_co - min_co
    height = max(size.x, size.y, size.z, 1.0)
    return center, height, size

def render_canonical_dk():
    clear_scene()
    dk_dir = Path("D:/Dasi/conversions/output/classes/dk")
    parts = [
        "dk_dragon_helm.obj",
        "dk_dragon_chest.obj",
        "dk_dragon_legs.obj",
        "dk_dragon_gloves.obj",
        "dk_dragon_boots.obj",
        "dk_weapon_dragon_blade.obj"
    ]
    for p in parts:
        f = dk_dir / p
        if f.is_file():
            bpy.ops.wm.obj_import(filepath=str(f))

    center, height, size = get_character_bounds()
    print(f"DK Center: {center}, Height: {height:.2f}, Size: {size}")

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.studio_light = 'Default'
    scene.display.shading.color_type = 'TEXTURE'
    scene.display.shading.show_shadows = True
    scene.display.shading.shadow_intensity = 0.5
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = 'BOTH'

    scene.render.resolution_x = 900
    scene.render.resolution_y = 1100
    scene.render.film_transparent = True

    # Camera em ângulo heróico 3/4
    cam_data = bpy.data.cameras.new("HeroCam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("HeroCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    dist = height * 1.8
    # MU models: Z is up, Y is front/back or depth
    cam_obj.location = (center.x + dist * 0.45, center.y - dist * 1.1, center.z + height * 0.15)
    
    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    out_brain = os.path.join(OUTPUT_DIR, "canonical_dk_dragon_preview.png")
    out_repo = os.path.join(REPO_PREVIEW_DIR, "canonical_dk_dragon_preview.png")

    scene.render.filepath = out_brain
    bpy.ops.render.render(write_still=True)
    shutil.copyfile(out_brain, out_repo)
    print(f"DK Renderizado: {out_brain}")

if __name__ == '__main__':
    render_canonical_dk()
