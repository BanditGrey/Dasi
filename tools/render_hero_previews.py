"""
Dasi MMORPG - Render 3D Hero Previews via Blender 5.2 LTS
Calcula o bounding box exato de cada herói, remove envoltórios de colisão e renderiza PNGs nítidos e centralizados.
"""

import os
import math
import bpy
from mathutils import Vector

OUTPUT_DIR = r"C:\Users\Daniel\.gemini\antigravity\brain\a2a9e655-e877-45f3-b31e-97b5e8380893"
REPO_PREVIEW_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "art_previews"))
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(REPO_PREVIEW_DIR, exist_ok=True)

HEROES = [
    {
        "id": "dk",
        "name": "Dark Knight (Cavaleiro Negro)",
        "file": os.path.abspath("src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"),
        "cam_pitch": 86,
        "cam_dist_factor": 2.2
    },
    {
        "id": "dw",
        "name": "Dark Wizard (Mago Negro)",
        "file": os.path.abspath("src/client/dev_viewer/models/animated_heroes/hero_dw_animated.glb"),
        "cam_pitch": 86,
        "cam_dist_factor": 2.2
    },
    {
        "id": "elf",
        "name": "Fairy Elf (Elfa Feiticeira)",
        "file": os.path.abspath("src/client/dev_viewer/models/animated_heroes/hero_elf_animated.glb"),
        "cam_pitch": 86,
        "cam_dist_factor": 2.2
    },
    {
        "id": "mg",
        "name": "Magic Gladiator (Gladiador Mágico)",
        "file": os.path.abspath("src/client/dev_viewer/models/animated_heroes/hero_mg_animated.glb"),
        "cam_pitch": 86,
        "cam_dist_factor": 2.2
    },
    {
        "id": "dl",
        "name": "Dark Lord (Lorde da Escuridão)",
        "file": os.path.abspath("src/client/dev_viewer/models/animated_heroes/hero_dl_animated.glb"),
        "cam_pitch": 86,
        "cam_dist_factor": 2.2
    }
]

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)

def get_character_bounds():
    """Calcula o centro e dimensões do personagem a partir de suas malhas visíveis."""
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
        return Vector((0, 0, 1.0)), 1.8

    center = (min_co + max_co) / 2.0
    size = max_co - min_co
    height = max(size.x, size.y, size.z, 1.5)
    return center, height

def render_hero(hero):
    glb_path = hero["file"]
    if not os.path.exists(glb_path):
        print(f"File not found: {glb_path}")
        return

    print(f"\n==========================================")
    print(f"Renderizando {hero['name']}...")
    print(f"==========================================")
    clear_scene()

    # Import GLB
    bpy.ops.import_scene.gltf(filepath=glb_path)

    # Remove enclosing collision spheres and non-character artifacts
    for obj in list(bpy.data.objects):
        n = obj.name.lower()
        if "icosphere" in n or "collision" in n or "bounding" in n or "plane.002" in n:
            print(f"Removendo objeto externo/colisão: {obj.name}")
            bpy.data.objects.remove(obj)

    # Frame 1 pose
    bpy.context.scene.frame_set(1)

    # Calculate bounding box
    center, height = get_character_bounds()
    print(f"Centro do personagem: {center}, Altura/Escala: {height:.2f}")

    # Configura Workbench Render com textura completa e iluminação Studio nítida
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.studio_light = 'Default'
    scene.display.shading.color_type = 'TEXTURE'
    scene.display.shading.show_shadows = True
    scene.display.shading.shadow_intensity = 0.4
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = 'BOTH'
    
    scene.render.resolution_x = 800
    scene.render.resolution_y = 1000
    scene.render.film_transparent = True

    # Camera setup: Enquadra da cabeça aos pés perfeitamente centralizado
    dist = height * hero["cam_dist_factor"]
    cam_data = bpy.data.cameras.new("HeroCamera")
    cam_data.lens = 52.0
    cam_obj = bpy.data.objects.new("HeroCamera", cam_data)
    
    # Câmera posicionada levemente à frente do centro do personagem
    cam_obj.location = (center.x, center.y - dist, center.z + 0.05)
    pitch_rad = math.radians(hero["cam_pitch"])
    cam_obj.rotation_euler = (pitch_rad, 0, 0)
    
    bpy.context.scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Render
    out_brain = os.path.join(OUTPUT_DIR, f"hero_preview_{hero['id']}.png")
    out_repo = os.path.join(REPO_PREVIEW_DIR, f"hero_preview_{hero['id']}.png")

    scene.render.filepath = out_brain
    bpy.ops.render.render(write_still=True)
    print(f"✅ Render salvo no Artifact: {out_brain}")

    import shutil
    shutil.copyfile(out_brain, out_repo)
    print(f"✅ Cópia salva no Repo: {out_repo}")

if __name__ == "__main__":
    for h in HEROES:
        render_hero(h)
    print("\nTodos os 5 heróis foram renderizados com sucesso!")
