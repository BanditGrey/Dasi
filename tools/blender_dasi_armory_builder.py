"""
DASI MMORPG - BLENDER 5.2 PROCEDURAL 3D ARMORY & WEAPON BUILDER
Gera os Modelos 3D Canônicos de Armas, Escudos e Conjuntos de Armadura em formato GLB/PBR:
- Armas Clássicas: Dragon Blade, Archangel Sword, Chaos Dragon Axe, Sword of Destruction,
  Kundun Staff, Chaos Lightning Staff, Celestial Bow, Great Reign Crossbow, Rune Blade, Lord Scepter.
- Escudos Clássicos: Dragon Shield, Tower Shield, Skull Shield.
- Conjuntos de Armaduras (em Manequim de Museu): Dragon Set, Dark Phoenix Set, Legendary Set,
  Grand Soul Set, Spirit Set, Divine Set.

Execução:
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --python tools/blender_dasi_armory_builder.py
"""

import sys
import os
import math
import argparse
import shutil
import bpy
import bmesh

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "prototypes", "3d_armory"))
CLIENT_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "client", "dev_viewer", "models", "armory"))
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CLIENT_MODELS_DIR, exist_ok=True)

def clear_scene():
    """Limpa objetos, malhas, materiais, imagens e luzes para criar cena virgem."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)

def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, emissive=(0, 0, 0, 1), emissive_strength=0.0, alpha=1.0):
    """Cria material Principled BSDF PBR de alta fidelidade."""
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")

    if bsdf and "Base Color" in bsdf.inputs:
        bsdf.inputs["Base Color"].default_value = (*base_color[:3], 1.0) if len(base_color) == 3 else base_color

    if bsdf:
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emissive[:3], 1.0) if len(emissive) == 3 else emissive
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = (*emissive[:3], 1.0) if len(emissive) == 3 else emissive
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emissive_strength
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha

    if alpha < 0.99:
        mat.blend_method = 'BLEND'
    return mat

def apply_material(obj, material):
    if len(obj.data.materials) == 0:
        obj.data.materials.append(material)
    else:
        obj.data.materials[0] = material

def export_model(filename):
    """Exporta para a pasta de protótipos e sincroniza diretamente com dev_viewer."""
    out_file = os.path.join(OUTPUT_DIR, filename)
    bpy.ops.export_scene.gltf(filepath=out_file, export_format='GLB', use_selection=False)
    client_dest = os.path.join(CLIENT_MODELS_DIR, filename)
    try:
        shutil.copyfile(out_file, client_dest)
        print(f"[ArmoryBuilder] Exportado e Sincronizado: {filename}")
    except Exception as e:
        print(f"[ArmoryBuilder] Aviso na cópia para dev_viewer: {e}")

# ============================================================================
# MATERIAIS CANÔNICOS DE ARMAS & ARMADURAS
# ============================================================================
def get_shared_materials():
    return {
        "gold": create_pbr_material("Mat_GoldTrim", (0.95, 0.78, 0.22), metallic=0.92, roughness=0.18),
        "steel": create_pbr_material("Mat_ForgedSteel", (0.85, 0.88, 0.92), metallic=0.95, roughness=0.12),
        "dark_steel": create_pbr_material("Mat_DarkSteel", (0.22, 0.24, 0.28), metallic=0.90, roughness=0.25),
        "leather": create_pbr_material("Mat_BrownLeather", (0.28, 0.16, 0.08), metallic=0.05, roughness=0.75),
        "ruby_glow": create_pbr_material("Mat_RubyGem", (0.9, 0.1, 0.15), metallic=0.3, roughness=0.1, emissive=(1.0, 0.15, 0.2), emissive_strength=3.0),
        "cyan_arcane": create_pbr_material("Mat_CyanArcane", (0.15, 0.75, 1.0), metallic=0.2, roughness=0.08, emissive=(0.2, 0.8, 1.0), emissive_strength=3.5),
        "emerald_leaf": create_pbr_material("Mat_EmeraldGlow", (0.1, 0.85, 0.4), metallic=0.3, roughness=0.15, emissive=(0.15, 0.9, 0.45), emissive_strength=2.8),
        "dragon_crimson": create_pbr_material("Mat_DragonCrimson", (0.58, 0.08, 0.10), metallic=0.88, roughness=0.20),
        "phoenix_obsidian": create_pbr_material("Mat_PhoenixObsidian", (0.12, 0.13, 0.16), metallic=0.92, roughness=0.15),
        "legendary_sapphire": create_pbr_material("Mat_LegendarySapphire", (0.10, 0.25, 0.65), metallic=0.45, roughness=0.35),
        "grand_soul_violet": create_pbr_material("Mat_GrandSoulViolet", (0.22, 0.12, 0.48), metallic=0.55, roughness=0.30),
        "spirit_green": create_pbr_material("Mat_SpiritGreen", (0.12, 0.55, 0.28), metallic=0.60, roughness=0.25),
        "divine_pearl": create_pbr_material("Mat_DivinePearl", (0.92, 0.90, 0.84), metallic=0.75, roughness=0.15),
    }

# ============================================================================
# 1. ARMAS CLÁSSICAS 3D (BLENDER MODELING)
# ============================================================================

def build_dragon_blade():
    clear_scene()
    col = bpy.data.collections.new("DragonBlade")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # 1. Empunhadura de Couro e Ouro
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.45, vertices=16, location=(0, 0, 0.22))
    handle = bpy.context.active_object
    apply_material(handle, mats["leather"])
    col.objects.link(handle)

    # Pomo de Dragão
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(0, 0, 0.02))
    pommel = bpy.context.active_object
    apply_material(pommel, mats["gold"])
    col.objects.link(pommel)

    # 2. Guarda Alada em Chifres de Dragão
    bpy.ops.mesh.primitive_cube_add(size=0.12, location=(0, 0, 0.46))
    guard_center = bpy.context.active_object
    guard_center.scale = (1.8, 0.8, 0.5)
    apply_material(guard_center, mats["gold"])
    col.objects.link(guard_center)

    # Gema Escarlate Central
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.055, subdivisions=1, location=(0, 0.06, 0.46))
    gem = bpy.context.active_object
    apply_material(gem, mats["ruby_glow"])
    col.objects.link(gem)

    # Chifres Curvados na Guarda
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(radius1=0.04, depth=0.28, vertices=8, location=(side * 0.22, 0, 0.52))
        horn = bpy.context.active_object
        horn.rotation_euler = (0, side * 0.45, 0)
        apply_material(horn, mats["dragon_crimson"])
        col.objects.link(horn)

    # 3. Lâmina Colossal Dupla de Aço Biselado
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.25))
    blade = bpy.context.active_object
    blade.scale = (0.16, 0.035, 1.55)
    apply_material(blade, mats["steel"])
    col.objects.link(blade)

    # Espinha Dorsal Serrilhada Carmesim
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.15))
    spine = bpy.context.active_object
    spine.scale = (0.06, 0.045, 1.25)
    apply_material(spine, mats["dragon_crimson"])
    col.objects.link(spine)

    # Ponta Pontiaguda
    bpy.ops.mesh.primitive_cone_add(radius1=0.16, depth=0.45, vertices=4, location=(0, 0, 2.18))
    tip = bpy.context.active_object
    tip.scale = (1.0, 0.22, 1.0)
    tip.rotation_euler = (0, 0, math.pi / 4)
    apply_material(tip, mats["steel"])
    col.objects.link(tip)

    export_model("dragon_blade.glb")

def build_archangel_sword():
    clear_scene()
    col = bpy.data.collections.new("ArchangelSword")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Cabo e Pomo Celestial
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.42, vertices=16, location=(0, 0, 0.21))
    handle = bpy.context.active_object
    apply_material(handle, mats["gold"])
    col.objects.link(handle)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.065, subdivisions=2, location=(0, 0, 0.02))
    pommel = bpy.context.active_object
    apply_material(pommel, mats["cyan_arcane"])
    col.objects.link(pommel)

    # Guarda com Asas Angélicas Abertas
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.35, vertices=8, location=(side * 0.18, 0, 0.44))
        wing = bpy.context.active_object
        wing.rotation_euler = (0, side * 0.5, 0)
        apply_material(wing, mats["gold"])
        col.objects.link(wing)

    # Lâmina Sagrada com Runa de Luz
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.22))
    blade = bpy.context.active_object
    blade.scale = (0.13, 0.03, 1.50)
    apply_material(blade, mats["steel"])
    col.objects.link(blade)

    # Sulco Central com Luz Arcana Azul
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.20))
    fuller = bpy.context.active_object
    fuller.scale = (0.03, 0.035, 1.25)
    apply_material(fuller, mats["cyan_arcane"])
    col.objects.link(fuller)

    # Ponta Perfurante
    bpy.ops.mesh.primitive_cone_add(radius1=0.13, depth=0.40, vertices=4, location=(0, 0, 2.12))
    tip = bpy.context.active_object
    tip.scale = (1.0, 0.25, 1.0)
    tip.rotation_euler = (0, 0, math.pi / 4)
    apply_material(tip, mats["steel"])
    col.objects.link(tip)

    export_model("archangel_sword.glb")

def build_chaos_dragon_axe():
    clear_scene()
    col = bpy.data.collections.new("ChaosDragonAxe")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Cabo Robusto de Madeira e Aço Negro
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=1.65, vertices=16, location=(0, 0, 0.82))
    shaft = bpy.context.active_object
    apply_material(shaft, mats["dark_steel"])
    col.objects.link(shaft)

    # Lâmina Dupla em Crescente (Duplo Machadão)
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.035, vertices=16, location=(side * 0.32, 0, 1.35))
        crescent = bpy.context.active_object
        crescent.rotation_euler = (math.pi / 2, 0, 0)
        crescent.scale = (1.0, 0.8, 1.0)
        apply_material(crescent, mats["steel"])
        col.objects.link(crescent)

        # Espinhos Pontiagudos nas Extremidades
        bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.22, vertices=6, location=(side * 0.58, 0, 1.45))
        spike = bpy.context.active_object
        spike.rotation_euler = (0, side * 0.7, 0)
        apply_material(spike, mats["dragon_crimson"])
        col.objects.link(spike)

    # Núcleo Central de Caos
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.11, subdivisions=1, location=(0, 0, 1.35))
    core = bpy.context.active_object
    apply_material(core, mats["ruby_glow"])
    col.objects.link(core)

    export_model("chaos_dragon_axe.glb")

def build_sword_of_destruction():
    clear_scene()
    col = bpy.data.collections.new("SwordOfDestruction")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Cabo com Espinhos Demoníacos
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.45, vertices=12, location=(0, 0, 0.22))
    handle = bpy.context.active_object
    apply_material(handle, mats["dark_steel"])
    col.objects.link(handle)

    # Lâmina Serrilhada de Magma
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.25))
    blade = bpy.context.active_object
    blade.scale = (0.15, 0.04, 1.60)
    apply_material(blade, mats["dark_steel"])
    col.objects.link(blade)

    # Dentes Serrilhados ao longo da Lâmina
    for i in range(5):
        y_pos = 0.65 + i * 0.25
        for side in (-1, 1):
            bpy.ops.mesh.primitive_cone_add(radius1=0.04, depth=0.15, vertices=4, location=(side * 0.14, 0, y_pos))
            tooth = bpy.context.active_object
            tooth.rotation_euler = (0, side * 0.6, 0)
            apply_material(tooth, mats["steel"])
            col.objects.link(tooth)

    # Fenda Incandescente de Magma
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.25))
    magma_fissure = bpy.context.active_object
    magma_fissure.scale = (0.04, 0.045, 1.40)
    apply_material(magma_fissure, mats["ruby_glow"])
    col.objects.link(magma_fissure)

    export_model("sword_of_destruction.glb")

def build_kundun_staff():
    clear_scene()
    col = bpy.data.collections.new("KundunStaff")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Haste Longa de Madeira Nobre & Ouro
    bpy.ops.mesh.primitive_cylinder_add(radius=0.032, depth=1.95, vertices=16, location=(0, 0, 0.98))
    shaft = bpy.context.active_object
    apply_material(shaft, mats["gold"])
    col.objects.link(shaft)

    # Serpentes Entrelaçadas no Topo
    for angle in (0, math.pi):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.025, location=(0, 0, 1.80))
        serpent = bpy.context.active_object
        serpent.rotation_euler = (0.3, angle, 0)
        apply_material(serpent, mats["gold"])
        col.objects.link(serpent)

    # Orbe Cósmico de Mana Flutuante
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, location=(0, 0, 2.05))
    orb = bpy.context.active_object
    apply_material(orb, mats["cyan_arcane"])
    col.objects.link(orb)

    # Anel Celestial de Kundun
    bpy.ops.mesh.primitive_torus_add(major_radius=0.24, minor_radius=0.02, location=(0, 0, 2.05))
    ring = bpy.context.active_object
    apply_material(ring, mats["gold"])
    col.objects.link(ring)

    export_model("kundun_staff.glb")

def build_chaos_lightning_staff():
    clear_scene()
    col = bpy.data.collections.new("ChaosLightningStaff")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Haste de Ferro Rúnico
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=1.85, vertices=12, location=(0, 0, 0.92))
    shaft = bpy.context.active_object
    apply_material(shaft, mats["dark_steel"])
    col.objects.link(shaft)

    # Pontas em Tridente para Arcos de Relâmpago
    for offset_x in (-0.16, 0.0, 0.16):
        height_mult = 1.2 if offset_x == 0 else 1.0
        bpy.ops.mesh.primitive_cone_add(radius1=0.03, depth=0.35 * height_mult, vertices=6, location=(offset_x, 0, 1.95))
        prong = bpy.context.active_object
        apply_material(prong, mats["cyan_arcane"])
        col.objects.link(prong)

    export_model("chaos_lightning_staff.glb")

def build_celestial_bow():
    clear_scene()
    col = bpy.data.collections.new("CelestialBow")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Membros Curvados em Asas de Fênix
    bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.035, location=(0, 0, 0.85))
    limbs = bpy.context.active_object
    limbs.rotation_euler = (0, math.pi / 2, 0)
    limbs.scale = (1.0, 0.35, 1.4)
    apply_material(limbs, mats["gold"])
    col.objects.link(limbs)

    # Empunhadura Central com Gema Esmeralda
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.08, subdivisions=1, location=(0.32, 0, 0.85))
    nexus = bpy.context.active_object
    apply_material(nexus, mats["emerald_leaf"])
    col.objects.link(nexus)

    # Corda de Luz Holográfica
    bpy.ops.mesh.primitive_cylinder_add(radius=0.007, depth=1.55, vertices=8, location=(0.02, 0, 0.85))
    string = bpy.context.active_object
    apply_material(string, mats["cyan_arcane"])
    col.objects.link(string)

    export_model("celestial_bow.glb")

def build_great_reign_crossbow():
    clear_scene()
    col = bpy.data.collections.new("GreatReignCrossbow")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Coronha de Madeira e Latão
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.45))
    stock = bpy.context.active_object
    stock.scale = (0.08, 0.90, 0.12)
    apply_material(stock, mats["leather"])
    col.objects.link(stock)

    # Arco Frontal Perpendicular
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.40, 0.48))
    bow_limbs = bpy.context.active_object
    bow_limbs.scale = (0.95, 0.05, 0.08)
    apply_material(bow_limbs, mats["steel"])
    col.objects.link(bow_limbs)

    # Tambor Giratório de Dardos
    bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.22, vertices=16, location=(0, 0.05, 0.52))
    drum = bpy.context.active_object
    drum.rotation_euler = (math.pi / 2, 0, 0)
    apply_material(drum, mats["gold"])
    col.objects.link(drum)

    export_model("great_reign_crossbow.glb")

def build_rune_blade():
    clear_scene()
    col = bpy.data.collections.new("RuneBlade")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Cabo de Aço Negro e Ouro
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.40, vertices=16, location=(0, 0, 0.20))
    handle = bpy.context.active_object
    apply_material(handle, mats["gold"])
    col.objects.link(handle)

    # Lâmina Dupla Bifurcada
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.15))
    blade = bpy.context.active_object
    blade.scale = (0.18, 0.035, 1.50)
    apply_material(blade, mats["steel"])
    col.objects.link(blade)

    # Inscrições Rúnicas Neon
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.15))
    runes = bpy.context.active_object
    runes.scale = (0.05, 0.04, 1.20)
    apply_material(runes, mats["cyan_arcane"])
    col.objects.link(runes)

    export_model("rune_blade.glb")

def build_lord_scepter():
    clear_scene()
    col = bpy.data.collections.new("LordScepter")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Cetro Real Dourado com Frisos
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=1.45, vertices=16, location=(0, 0, 0.72))
    shaft = bpy.context.active_object
    apply_material(shaft, mats["gold"])
    col.objects.link(shaft)

    # Coroa Imperial no Topo
    bpy.ops.mesh.primitive_cone_add(radius1=0.18, depth=0.25, vertices=8, location=(0, 0, 1.48))
    crown = bpy.context.active_object
    crown.rotation_euler = (math.pi, 0, 0)
    apply_material(crown, mats["gold"])
    col.objects.link(crown)

    # Selo Imperial de Rubi
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.10, subdivisions=1, location=(0, 0, 1.56))
    ruby = bpy.context.active_object
    apply_material(ruby, mats["ruby_glow"])
    col.objects.link(ruby)

    export_model("lord_scepter.glb")

# ============================================================================
# 2. ESCUDOS CLÁSSICOS 3D (BLENDER MODELING)
# ============================================================================

def build_dragon_shield():
    clear_scene()
    col = bpy.data.collections.new("DragonShield")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Corpo Curvado do Escudo
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.06, vertices=24, location=(0, 0, 0.85))
    body = bpy.context.active_object
    body.scale = (0.85, 1.35, 1.0)
    body.rotation_euler = (math.pi / 2, 0, 0)
    apply_material(body, mats["dragon_crimson"])
    col.objects.link(body)

    # Moldura Reforçada Dourada
    bpy.ops.mesh.primitive_torus_add(major_radius=0.48, minor_radius=0.035, location=(0, 0.03, 0.85))
    trim = bpy.context.active_object
    trim.scale = (0.85, 1.35, 1.0)
    trim.rotation_euler = (math.pi / 2, 0, 0)
    apply_material(trim, mats["gold"])
    col.objects.link(trim)

    # Olhos Flamejantes do Dragão
    for side in (-1, 1):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.045, subdivisions=1, location=(side * 0.14, 0.06, 0.95))
        eye = bpy.context.active_object
        apply_material(eye, mats["ruby_glow"])
        col.objects.link(eye)

    export_model("dragon_shield.glb")

def build_tower_shield():
    clear_scene()
    col = bpy.data.collections.new("TowerShield")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Placa Retangular Maciça de Aço
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.90))
    plate = bpy.context.active_object
    plate.scale = (0.70, 0.05, 1.55)
    apply_material(plate, mats["dark_steel"])
    col.objects.link(plate)

    # Cruz Gótica de Reforço em Ouro
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.035, 0.90))
    cross_v = bpy.context.active_object
    cross_v.scale = (0.12, 0.03, 1.45)
    apply_material(cross_v, mats["gold"])
    col.objects.link(cross_v)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.035, 1.05))
    cross_h = bpy.context.active_object
    cross_h.scale = (0.60, 0.03, 0.12)
    apply_material(cross_h, mats["gold"])
    col.objects.link(cross_h)

    export_model("tower_shield.glb")

def build_skull_shield():
    clear_scene()
    col = bpy.data.collections.new("SkullShield")
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()

    # Broquel Circular de Osso
    bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=0.05, vertices=24, location=(0, 0, 0.85))
    body = bpy.context.active_object
    body.rotation_euler = (math.pi / 2, 0, 0)
    apply_material(body, mats["dark_steel"])
    col.objects.link(body)

    # Crânio Demoníaco Central
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.18, subdivisions=2, location=(0, 0.06, 0.85))
    skull = bpy.context.active_object
    apply_material(skull, mats["divine_pearl"])
    col.objects.link(skull)

    # Chifres Demoníacos no Escudo
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(radius1=0.045, depth=0.28, vertices=8, location=(side * 0.22, 0.06, 0.98))
        horn = bpy.context.active_object
        horn.rotation_euler = (0, side * 0.5, 0)
        apply_material(horn, mats["steel"])
        col.objects.link(horn)

    export_model("skull_shield.glb")

# ============================================================================
# 3. CONJUNTOS DE ARMADURA 3D (EM MANEQUIM DE EXPOSIÇÃO)
# ============================================================================

def build_armor_set_stand(name, primary_mat_key, trim_mat_key, filename):
    """Cria um manequim anatômico completo vestindo elmo, peitoral, ombreiras, calças e botas."""
    clear_scene()
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    mats = get_shared_materials()
    mat_primary = mats[primary_mat_key]
    mat_trim = mats[trim_mat_key]

    # Pedestal de Museu
    bpy.ops.mesh.primitive_cylinder_add(radius=0.85, depth=0.15, vertices=24, location=(0, 0, 0.075))
    pedestal = bpy.context.active_object
    apply_material(pedestal, mats["dark_steel"])
    col.objects.link(pedestal)

    # Botas Góticas
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.18, 0, 0.22))
        boot = bpy.context.active_object
        boot.scale = (0.14, 0.25, 0.26)
        apply_material(boot, mat_primary)
        col.objects.link(boot)

    # Grevas / Calças Articuladas
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.55, vertices=12, location=(side * 0.18, 0, 0.65))
        pants = bpy.context.active_object
        apply_material(pants, mat_primary)
        col.objects.link(pants)

    # Cinturão / Faixa de Ouro
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.12, vertices=16, location=(0, 0, 0.96))
    belt = bpy.context.active_object
    apply_material(belt, mat_trim)
    col.objects.link(belt)

    # Peitoral / Armadura Torácica Musculada
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.28))
    chest = bpy.context.active_object
    chest.scale = (0.54, 0.30, 0.52)
    apply_material(chest, mat_primary)
    col.objects.link(chest)

    # Ombreiras Imponentes com Pontas
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(radius1=0.18, depth=0.35, vertices=6, location=(side * 0.38, 0, 1.48))
        pauldron = bpy.context.active_object
        pauldron.rotation_euler = (0, side * 0.5, 0)
        apply_material(pauldron, mat_trim)
        col.objects.link(pauldron)

    # Manoplas / Braçadeiras
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.50, vertices=12, location=(side * 0.38, 0, 1.10))
        gloves = bpy.context.active_object
        apply_material(gloves, mat_primary)
        col.objects.link(gloves)

    # Elmo Completo
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.72))
    helm = bpy.context.active_object
    helm.scale = (0.32, 0.32, 0.34)
    apply_material(helm, mat_primary)
    col.objects.link(helm)

    # Visor Rúnico Luminoso
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.16, 1.72))
    visor = bpy.context.active_object
    visor.scale = (0.22, 0.04, 0.06)
    apply_material(visor, mats["ruby_glow"] if "crimson" in primary_mat_key or "phoenix" in primary_mat_key else mats["cyan_arcane"])
    col.objects.link(visor)

    export_model(filename)

# ============================================================================
# ORQUESTRADOR PRINCIPAL DO ARMORY BUILDER
# ============================================================================
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--item", type=str, default="ALL")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    target = args.item.upper()

    print("============================================================")
    print("⚔️ DASI MMORPG - BLENDER 5.2 PROCEDURAL ARMORY BUILDER")
    print(f"Diretório de Saída: {OUTPUT_DIR}")
    print(f"Alvo: {target}")
    print("============================================================")

    # 1. Armas
    if target in ("ALL", "DRAGON_BLADE"): build_dragon_blade()
    if target in ("ALL", "ARCHANGEL_SWORD"): build_archangel_sword()
    if target in ("ALL", "CHAOS_DRAGON_AXE"): build_chaos_dragon_axe()
    if target in ("ALL", "SWORD_OF_DESTRUCTION"): build_sword_of_destruction()
    if target in ("ALL", "KUNDUN_STAFF"): build_kundun_staff()
    if target in ("ALL", "CHAOS_LIGHTNING_STAFF"): build_chaos_lightning_staff()
    if target in ("ALL", "CELESTIAL_BOW"): build_celestial_bow()
    if target in ("ALL", "GREAT_REIGN_CROSSBOW"): build_great_reign_crossbow()
    if target in ("ALL", "RUNE_BLADE"): build_rune_blade()
    if target in ("ALL", "LORD_SCEPTER"): build_lord_scepter()

    # 2. Escudos
    if target in ("ALL", "DRAGON_SHIELD"): build_dragon_shield()
    if target in ("ALL", "TOWER_SHIELD"): build_tower_shield()
    if target in ("ALL", "SKULL_SHIELD"): build_skull_shield()

    # 3. Conjuntos de Armaduras
    if target in ("ALL", "SET_DRAGON"): build_armor_set_stand("Set_Dragon", "dragon_crimson", "gold", "armor_set_dragon.glb")
    if target in ("ALL", "SET_DARK_PHOENIX"): build_armor_set_stand("Set_DarkPhoenix", "phoenix_obsidian", "gold", "armor_set_dark_phoenix.glb")
    if target in ("ALL", "SET_LEGENDARY"): build_armor_set_stand("Set_Legendary", "legendary_sapphire", "gold", "armor_set_legendary.glb")
    if target in ("ALL", "SET_GRAND_SOUL"): build_armor_set_stand("Set_GrandSoul", "grand_soul_violet", "cyan_arcane", "armor_set_grand_soul.glb")
    if target in ("ALL", "SET_SPIRIT"): build_armor_set_stand("Set_Spirit", "spirit_green", "gold", "armor_set_spirit.glb")
    if target in ("ALL", "SET_DIVINE"): build_armor_set_stand("Set_Divine", "divine_pearl", "gold", "armor_set_divine.glb")

    print("✅ Todos os modelos 3D de armas, escudos e armaduras foram gerados no Blender 5.2!")

if __name__ == "__main__":
    main()
