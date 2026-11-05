"""
DASI MMORPG - BLENDER 5.2 PROCEDURAL HERO 3D MODEL BUILDER
Gera os modelos 3D completos em formato GLB/PBR das 5 Classes Canônicas Originais:
1. Dark Knight (Cavaleiro do Sangue / Blade Knight):
   - Armadura Dragon completa, Elmo com chifres curvados, Dragon Blade de duas mãos, Escudo Torre e Asas de Dragão (Wings of Dragon).
2. Dark Wizard (Arquimago do Caos / Soul Master):
   - Túnica Grand Soul com runas celestes, Chapéu/Coroa Mística, Cajado de Kundun com Núcleo Flutuante e Asas da Alma (Wings of Soul).
3. Fairy Elf (Vigia da Floresta / Muse Elf):
   - Armadura Spirit esmeralda, Diadema de folhas, Cabelos longos, Arco Celestial com corda de fótons, Aljava e Asas de Fada (Wings of Spirits).
4. Magic Gladiator (Gladiador Rúnico / Duel Master):
   - Armadura Hurricane sem elmo, Cabelos rúnicos, Espadas Rúnicas Duplas (Fogo e Trovão) e Asas das Trevas (Wings of Darkness).
5. Dark Lord (Soberano Imperial / Lord Emperor):
   - Armadura Imperial com Cetro Real Dourado, Escudo Nobre, Capa Majestosa de Veludo, Corvo de Guerra (Dark Raven) no ombro e Manto da Monarquia.

Execução:
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --python tools/blender_dasi_hero_builder.py -- --hero ALL
"""

import sys
import os
import math
import argparse
import bpy
import bmesh
import numpy as np

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "client", "dev_viewer", "models"))
PROTOTYPE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "prototypes", "3d_scenery"))
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PROTOTYPE_DIR, exist_ok=True)

def clear_scene():
    """Limpa objetos, malhas, materiais e imagens anteriores."""
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

# ============================================================================
# GERADORES DE TEXTURAS PROCEDURAIS PBR VIA NUMPY EMBUTIDAS NO GLB
# ============================================================================

def create_numpy_image(name, width, height, arr):
    """Converte array numpy float32 RGBA em imagem do Blender e empacota no GLB."""
    img = bpy.data.images.new(name, width=width, height=height, alpha=True, float_buffer=False)
    img.pixels.foreach_set(arr.flatten())
    img.pack()
    return img

def generate_dragon_scale_texture(width=256, height=256):
    """Escamas carmesim com placas quitinosas e bordas de metal dourado."""
    arr = np.zeros((height, width, 4), dtype=np.float32)
    y, x = np.mgrid[0:height, 0:width]
    scale_y = (y % 32) / 32.0
    scale_x = (x % 32) / 32.0
    dist = np.sqrt((scale_x - 0.5)**2 + (scale_y - 0.5)**2)
    ring = np.sin(dist * math.pi * 3.0)
    
    rng = np.random.default_rng(101)
    noise = rng.uniform(-0.04, 0.04, (height, width))
    arr[:, :, 0] = 0.72 + ring * 0.15 + noise # Vermelho Carmesim
    arr[:, :, 1] = 0.08 + ring * 0.04
    arr[:, :, 2] = 0.12 + ring * 0.05
    arr[:, :, 3] = 1.0
    return np.clip(arr, 0.0, 1.0)

def generate_arcane_cloth_texture(width=256, height=256):
    """Tecido azul celestial profundo com runas arcanas entrelaçadas."""
    arr = np.zeros((height, width, 4), dtype=np.float32)
    y, x = np.mgrid[0:height, 0:width]
    wave = np.sin(x * 0.15) * np.cos(y * 0.15)
    
    rng = np.random.default_rng(202)
    noise = rng.uniform(-0.03, 0.03, (height, width))
    arr[:, :, 0] = 0.06 + wave * 0.04 + noise
    arr[:, :, 1] = 0.22 + wave * 0.08 + noise # Azul Safira
    arr[:, :, 2] = 0.65 + wave * 0.15 + noise
    arr[:, :, 3] = 1.0
    return np.clip(arr, 0.0, 1.0)

def generate_elven_leaf_texture(width=256, height=256):
    """Couro élfico tingido de esmeralda com veios de folhas douradas."""
    arr = np.zeros((height, width, 4), dtype=np.float32)
    y, x = np.mgrid[0:height, 0:width]
    veins = np.sin(x * 0.1 + y * 0.08) * np.sin(y * 0.15 - x * 0.05)
    
    arr[:, :, 0] = 0.08 + np.abs(veins) * 0.12 # Toques dourados nos veios
    arr[:, :, 1] = 0.45 + np.abs(veins) * 0.20 # Verde Esmeralda
    arr[:, :, 2] = 0.25 + np.abs(veins) * 0.08
    arr[:, :, 3] = 1.0
    return np.clip(arr, 0.0, 1.0)

def generate_runic_steel_texture(width=256, height=256):
    """Aço obsidiano escuro com circuitos rúnicos ciano fluorescentes."""
    arr = np.zeros((height, width, 4), dtype=np.float32)
    y, x = np.mgrid[0:height, 0:width]
    grid_x = ((x % 32) < 2)
    grid_y = ((y % 32) < 2)
    circuit = grid_x | grid_y
    
    arr[:, :, 0] = 0.08
    arr[:, :, 1] = 0.09
    arr[:, :, 2] = 0.12
    # Circuitos neon ciano
    arr[circuit, 0] = 0.10
    arr[circuit, 1] = 0.75
    arr[circuit, 2] = 0.95
    arr[:, :, 3] = 1.0
    return np.clip(arr, 0.0, 1.0)

def generate_imperial_velvet_texture(width=256, height=256):
    """Veludo escarlate imperial com bordas adamascadas em ouro 24k."""
    arr = np.zeros((height, width, 4), dtype=np.float32)
    y, x = np.mgrid[0:height, 0:width]
    damask = (np.sin(x * 0.2) * np.cos(y * 0.2)) > 0.4
    
    arr[:, :, 0] = 0.55 # Escarlate Imperial
    arr[:, :, 1] = 0.03
    arr[:, :, 2] = 0.07
    # Brocado de ouro
    arr[damask, 0] = 0.92
    arr[damask, 1] = 0.72
    arr[damask, 2] = 0.18
    arr[:, :, 3] = 1.0
    return np.clip(arr, 0.0, 1.0)

# ============================================================================
# CRIAÇÃO DE MATERIAIS PRINCIPLED BSDF
# ============================================================================

def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, emissive=(0, 0, 0, 1), emissive_strength=0.0, alpha=1.0, texture_arr=None):
    """Cria material PBR com suporte a nós de textura e emissão."""
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")

    if texture_arr is not None:
        h, w, _ = texture_arr.shape
        img = create_numpy_image(f"Tex_{name}", w, h, texture_arr)
        tex_node = nodes.new('ShaderNodeTexImage')
        tex_node.image = img
        if bsdf and "Base Color" in bsdf.inputs:
            links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
    elif bsdf and "Base Color" in bsdf.inputs:
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
    """Aplica material ao objeto ativo."""
    if len(obj.data.materials) == 0:
        obj.data.materials.append(material)
    else:
        obj.data.materials[0] = material

def create_pedestal(root_col, ring_color=(0.95, 0.60, 0.10)):
    """Cria o pedestal de mármore obsidiano e anel rúnico onde o herói se posiciona."""
    mat_pedestal = create_pbr_material("Pedestal_Marble", (0.05, 0.06, 0.08), metallic=0.7, roughness=0.25)
    mat_ring = create_pbr_material("Pedestal_RuneRing", ring_color, metallic=0.2, roughness=0.2, emissive=ring_color, emissive_strength=3.0)

    # Base cilíndrica de mármore
    bpy.ops.mesh.primitive_cylinder_add(radius=1.5, depth=0.20, vertices=32, location=(0, 0, 0.10))
    base = bpy.context.active_object
    base.name = "Pedestal_Base"
    apply_material(base, mat_pedestal)
    root_col.objects.link(base)

    # Anel rúnico dourado
    bpy.ops.mesh.primitive_torus_add(major_radius=1.25, minor_radius=0.03, major_segments=48, minor_segments=12, location=(0, 0, 0.205))
    ring = bpy.context.active_object
    ring.name = "Pedestal_RuneRing"
    apply_material(ring, mat_ring)
    root_col.objects.link(ring)

# ============================================================================
# 1. DARK KNIGHT (CAVALEIRO DO SANGUE / BLADE KNIGHT)
# ============================================================================
def build_dark_knight_scene():
    clear_scene()
    root_col = bpy.data.collections.new("DarkKnight_Hero")
    bpy.context.scene.collection.children.link(root_col)

    # Materiais
    tex_scale = generate_dragon_scale_texture()
    mat_armor = create_pbr_material("DK_DragonArmor", (0.75, 0.10, 0.12), metallic=0.88, roughness=0.22, texture_arr=tex_scale)
    mat_gold = create_pbr_material("DK_GoldTrim", (0.95, 0.75, 0.15), metallic=0.92, roughness=0.20)
    mat_skin = create_pbr_material("DK_Skin", (0.80, 0.62, 0.52), metallic=0.05, roughness=0.60)
    mat_steel = create_pbr_material("DK_DamascusSteel", (0.85, 0.88, 0.92), metallic=0.95, roughness=0.12)
    mat_gem = create_pbr_material("DK_RubyCore", (1.0, 0.08, 0.08), metallic=0.1, roughness=0.05, emissive=(1.0, 0.05, 0.05), emissive_strength=4.5)
    mat_membrane = create_pbr_material("DK_WingMembrane", (0.65, 0.08, 0.10), metallic=0.3, roughness=0.35, alpha=0.88)

    create_pedestal(root_col, ring_color=(0.95, 0.20, 0.15))

    # Pernas e Grevas (Z: 0.20 a 1.05)
    for side in (-1, 1):
        x = side * 0.22
        # Coxa
        bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.42, vertices=12, location=(x, 0, 0.90))
        thigh = bpy.context.active_object
        thigh.name = f"DK_Thigh_{'L' if side < 0 else 'R'}"
        apply_material(thigh, mat_armor)
        root_col.objects.link(thigh)
        # Greva / Canela com esporão
        bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.45, vertices=12, location=(x, 0, 0.48))
        shin = bpy.context.active_object
        shin.name = f"DK_Shin_{'L' if side < 0 else 'R'}"
        apply_material(shin, mat_armor)
        root_col.objects.link(shin)
        # Escudo de joelho (Genouillère)
        bpy.ops.mesh.primitive_cone_add(radius1=0.09, depth=0.14, vertices=4, location=(x, 0.10, 0.70))
        knee = bpy.context.active_object
        knee.rotation_euler = (math.pi/2, 0, 0)
        knee.name = f"DK_KneeSpur_{'L' if side < 0 else 'R'}"
        apply_material(knee, mat_gold)
        root_col.objects.link(knee)
        # Bota
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0.05, 0.26))
        boot = bpy.context.active_object
        boot.scale = (0.16, 0.32, 0.14)
        boot.name = f"DK_Boot_{'L' if side < 0 else 'R'}"
        apply_material(boot, mat_armor)
        root_col.objects.link(boot)

    # Cintura e Cinturão de Ouro
    bpy.ops.mesh.primitive_cylinder_add(radius=0.26, depth=0.18, vertices=16, location=(0, 0, 1.15))
    belt = bpy.context.active_object
    belt.name = "DK_Belt"
    apply_material(belt, mat_gold)
    root_col.objects.link(belt)

    # Peitoral Dragon (Z: 1.25 a 1.70)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.45))
    chest = bpy.context.active_object
    chest.scale = (0.58, 0.34, 0.48)
    chest.name = "DK_Cuirass"
    apply_material(chest, mat_armor)
    root_col.objects.link(chest)

    # Ruby Core no Peito
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.09, subdivisions=1, location=(0, 0.18, 1.48))
    ruby = bpy.context.active_object
    ruby.rotation_euler = (0, 0, math.pi/4)
    ruby.name = "DK_RubyHeart"
    apply_material(ruby, mat_gem)
    root_col.objects.link(ruby)

    # Ombreiras Góticas Spiked Pauldrons
    for side in (-1, 1):
        x = side * 0.42
        bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.38, vertices=6, location=(x, 0, 1.70))
        pauldron = bpy.context.active_object
        pauldron.rotation_euler = (0, side * 0.45, 0)
        pauldron.name = f"DK_Pauldron_{'L' if side < 0 else 'R'}"
        apply_material(pauldron, mat_armor)
        root_col.objects.link(pauldron)

        # Pontas de Ouro nas Ombreiras
        bpy.ops.mesh.primitive_cone_add(radius1=0.06, depth=0.35, vertices=4, location=(x + side*0.12, 0, 1.88))
        spike = bpy.context.active_object
        spike.rotation_euler = (0, side * 0.3, 0)
        spike.name = f"DK_PauldronSpike_{'L' if side < 0 else 'R'}"
        apply_material(spike, mat_gold)
        root_col.objects.link(spike)

    # Braços e Manoplas
    for side in (-1, 1):
        x = side * 0.38
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.55, vertices=10, location=(x, 0, 1.35))
        arm = bpy.context.active_object
        arm.name = f"DK_Arm_{'L' if side < 0 else 'R'}"
        apply_material(arm, mat_armor)
        root_col.objects.link(arm)

    # Elmo Dragão Fechado com Chifres (Z: 1.82 a 2.15)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.95))
    helm = bpy.context.active_object
    helm.scale = (0.32, 0.34, 0.34)
    helm.name = "DK_DragonHelm"
    apply_material(helm, mat_armor)
    root_col.objects.link(helm)

    # Visor Luminoso Carmesim
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.175, 1.96))
    visor = bpy.context.active_object
    visor.scale = (0.24, 0.04, 0.06)
    visor.name = "DK_VisorGlow"
    apply_material(visor, mat_gem)
    root_col.objects.link(visor)

    # Chifres de Dragão Laterais
    for side in (-1, 1):
        x = side * 0.20
        bpy.ops.mesh.primitive_cone_add(radius1=0.07, depth=0.48, vertices=6, location=(x, -0.05, 2.15))
        horn = bpy.context.active_object
        horn.rotation_euler = (-0.3, side * 0.6, side * 0.5)
        horn.name = f"DK_Horn_{'L' if side < 0 else 'R'}"
        apply_material(horn, mat_gold)
        root_col.objects.link(horn)

    # ARMA: Dragon Blade / Archangel Greatsword (Mão Direita)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.45, vertices=8, location=(0.42, 0.22, 1.05))
    hilt = bpy.context.active_object
    hilt.name = "DK_SwordHilt"
    apply_material(hilt, mat_gold)
    root_col.objects.link(hilt)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.42, 0.22, 1.25))
    guard = bpy.context.active_object
    guard.scale = (0.38, 0.08, 0.06)
    guard.name = "DK_SwordGuard"
    apply_material(guard, mat_gold)
    root_col.objects.link(guard)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.42, 0.22, 2.05))
    blade = bpy.context.active_object
    blade.scale = (0.16, 0.04, 1.55)
    blade.name = "DK_SwordBlade"
    apply_material(blade, mat_steel)
    root_col.objects.link(blade)

    bpy.ops.mesh.primitive_cone_add(radius1=0.09, depth=0.30, vertices=4, location=(0.42, 0.22, 2.95))
    tip = bpy.context.active_object
    tip.rotation_euler = (0, 0, math.pi/4)
    tip.name = "DK_SwordTip"
    apply_material(tip, mat_steel)
    root_col.objects.link(tip)

    # ESCUDO: Dragon Tower Shield (Mão Esquerda)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.45, 0.15, 1.35))
    shield = bpy.context.active_object
    shield.scale = (0.10, 0.42, 0.85)
    shield.name = "DK_DragonShield"
    apply_material(shield, mat_armor)
    root_col.objects.link(shield)

    bpy.ops.mesh.primitive_cone_add(radius1=0.10, depth=0.25, vertices=4, location=(-0.45, 0.25, 1.35))
    sh_boss = bpy.context.active_object
    sh_boss.rotation_euler = (math.pi/2, 0, 0)
    sh_boss.name = "DK_ShieldSpike"
    apply_material(sh_boss, mat_gold)
    root_col.objects.link(sh_boss)

    # ASAS: Wings of Dragon (Costas)
    for side in (-1, 1):
        x = side * 0.25
        # Osso Principal da Asa
        bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=1.2, vertices=8, location=(x + side*0.45, -0.25, 1.95))
        wbone = bpy.context.active_object
        wbone.rotation_euler = (0.3, side * 0.9, 0)
        wbone.name = f"DK_WingBone_{'L' if side < 0 else 'R'}"
        apply_material(wbone, mat_gold)
        root_col.objects.link(wbone)

        # Garra Óssea na ponta da Asa
        bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.35, vertices=4, location=(side * 1.15, -0.28, 2.35))
        wclaw = bpy.context.active_object
        wclaw.rotation_euler = (0, side * 0.6, 0)
        wclaw.name = f"DK_WingClaw_{'L' if side < 0 else 'R'}"
        apply_material(wclaw, mat_gold)
        root_col.objects.link(wclaw)

        # Membrana Carnosa da Asa de Dragão
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.85, -0.22, 1.70))
        wmem = bpy.context.active_object
        wmem.scale = (0.75, 0.03, 0.65)
        wmem.rotation_euler = (0.2, side * 0.25, 0)
        wmem.name = f"DK_WingMembrane_{'L' if side < 0 else 'R'}"
        apply_material(wmem, mat_membrane)
        root_col.objects.link(wmem)

    # Exporta para GLB
    out_file = os.path.join(OUTPUT_DIR, "hero_dark_knight.glb")
    proto_file = os.path.join(PROTOTYPE_DIR, "hero_dark_knight.glb")
    bpy.ops.export_scene.gltf(filepath=out_file, export_format='GLB', use_selection=False)
    if os.path.exists(out_file):
        import shutil
        shutil.copyfile(out_file, proto_file)
    print(f"[OK] Modelo 3D exportado com sucesso: {out_file}")

# ============================================================================
# 2. DARK WIZARD (ARQUIMAGO DO CAOS / SOUL MASTER)
# ============================================================================
def build_dark_wizard_scene():
    clear_scene()
    root_col = bpy.data.collections.new("DarkWizard_Hero")
    bpy.context.scene.collection.children.link(root_col)

    # Materiais
    tex_cloth = generate_arcane_cloth_texture()
    mat_robe = create_pbr_material("DW_GrandSoulRobe", (0.08, 0.22, 0.65), metallic=0.25, roughness=0.45, texture_arr=tex_cloth)
    mat_gold = create_pbr_material("DW_GoldTrim", (0.95, 0.80, 0.20), metallic=0.90, roughness=0.25)
    mat_skin = create_pbr_material("DW_Skin", (0.84, 0.68, 0.58), metallic=0.05, roughness=0.55)
    mat_wood = create_pbr_material("DW_ArcaneStaffWood", (0.28, 0.16, 0.08), metallic=0.2, roughness=0.55)
    mat_mana = create_pbr_material("DW_ManaCore", (0.20, 0.80, 1.0), metallic=0.1, roughness=0.05, emissive=(0.1, 0.75, 1.0), emissive_strength=5.5)
    mat_wings = create_pbr_material("DW_WingsSoul", (0.65, 0.85, 1.0), metallic=0.15, roughness=0.25, emissive=(0.3, 0.7, 1.0), emissive_strength=2.2, alpha=0.85)

    create_pedestal(root_col, ring_color=(0.15, 0.75, 1.0))

    # Túnica Longa Fluida de Mago (Cilindro cônico que toca o chão)
    bpy.ops.mesh.primitive_cone_add(radius1=0.48, radius2=0.22, depth=1.10, vertices=16, location=(0, 0, 0.75))
    skirt = bpy.context.active_object
    skirt.name = "DW_RobeSkirt"
    apply_material(skirt, mat_robe)
    root_col.objects.link(skirt)

    # Barra Dourada da Túnica
    bpy.ops.mesh.primitive_torus_add(major_radius=0.48, minor_radius=0.03, major_segments=24, minor_segments=8, location=(0, 0, 0.22))
    skirt_rim = bpy.context.active_object
    skirt_rim.name = "DW_RobeRim"
    apply_material(skirt_rim, mat_gold)
    root_col.objects.link(skirt_rim)

    # Tronco Superior / Peitoral Arcano
    bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=0.48, vertices=14, location=(0, 0, 1.42))
    chest = bpy.context.active_object
    chest.name = "DW_ChestRobe"
    apply_material(chest, mat_robe)
    root_col.objects.link(chest)

    # Faixa / Amuleto Central com Mana Jewel
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.04, vertices=12, location=(0, 0.24, 1.45))
    amulet = bpy.context.active_object
    amulet.rotation_euler = (math.pi/2, 0, 0)
    amulet.name = "DW_ManaAmulet"
    apply_material(amulet, mat_mana)
    root_col.objects.link(amulet)

    # Gola Alta Mística de Feiticeiro (Curved Collar)
    bpy.ops.mesh.primitive_cone_add(radius1=0.32, radius2=0.22, depth=0.32, vertices=12, location=(0, -0.04, 1.76))
    collar = bpy.context.active_object
    collar.name = "DW_ArcaneCollar"
    apply_material(collar, mat_gold)
    root_col.objects.link(collar)

    # Braços com Mangas Longas de Feiticeiro
    for side in (-1, 1):
        x = side * 0.36
        bpy.ops.mesh.primitive_cone_add(radius1=0.14, radius2=0.07, depth=0.55, vertices=10, location=(x, 0, 1.30))
        arm = bpy.context.active_object
        arm.name = f"DW_Sleeve_{'L' if side < 0 else 'R'}"
        apply_material(arm, mat_robe)
        root_col.objects.link(arm)

        # Mão de Pele
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.065, location=(x, 0.12, 1.02))
        hand = bpy.context.active_object
        hand.name = f"DW_Hand_{'L' if side < 0 else 'R'}"
        apply_material(hand, mat_skin)
        root_col.objects.link(hand)

    # Cabeça e Rosto
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(0, 0, 1.88))
    head = bpy.context.active_object
    head.name = "DW_Head"
    apply_material(head, mat_skin)
    root_col.objects.link(head)

    # Chapéu Pontiagudo Místico de Arquimago (Grand Soul Wizard Hat)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.04, vertices=20, location=(0, 0, 1.98))
    brim = bpy.context.active_object
    brim.name = "DW_HatBrim"
    apply_material(brim, mat_robe)
    root_col.objects.link(brim)

    bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.62, vertices=12, location=(0, -0.06, 2.28))
    cone = bpy.context.active_object
    cone.rotation_euler = (-0.20, 0, 0)
    cone.name = "DW_HatCone"
    apply_material(cone, mat_robe)
    root_col.objects.link(cone)

    # Gema Mística no Chapéu
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.05, subdivisions=1, location=(0, 0.20, 2.05))
    hat_gem = bpy.context.active_object
    hat_gem.name = "DW_HatGem"
    apply_material(hat_gem, mat_mana)
    root_col.objects.link(hat_gem)

    # ARMA: Cajado de Kundun (Mão Direita)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=1.95, vertices=12, location=(0.42, 0.22, 1.15))
    shaft = bpy.context.active_object
    shaft.name = "DW_KundunStaffShaft"
    apply_material(shaft, mat_wood)
    root_col.objects.link(shaft)

    # Cabeça Dupla do Cajado em Ouro
    bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.04, major_segments=16, minor_segments=8, location=(0.42, 0.22, 2.15))
    staff_head = bpy.context.active_object
    staff_head.name = "DW_StaffRing"
    apply_material(staff_head, mat_gold)
    root_col.objects.link(staff_head)

    # Núcleo de Mana Flutuante (Kundun Core)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.12, subdivisions=2, location=(0.42, 0.22, 2.15))
    core = bpy.context.active_object
    core.name = "DW_ManaOrb"
    apply_material(core, mat_mana)
    root_col.objects.link(core)

    # Orbe Flutuante na Mão Esquerda (Casting Focus)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.08, subdivisions=2, location=(-0.36, 0.22, 1.25))
    left_orb = bpy.context.active_object
    left_orb.name = "DW_LeftHandOrb"
    apply_material(left_orb, mat_mana)
    root_col.objects.link(left_orb)

    # ASAS: Wings of Soul (Plumas Celestes Azuis e Alvas)
    for side in (-1, 1):
        x = side * 0.20
        # Camada de Penas Superiores
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.75, -0.25, 2.05))
        feather_top = bpy.context.active_object
        feather_top.scale = (0.75, 0.04, 0.45)
        feather_top.rotation_euler = (0.2, side * 0.45, side * 0.2)
        feather_top.name = f"DW_WingTop_{'L' if side < 0 else 'R'}"
        apply_material(feather_top, mat_wings)
        root_col.objects.link(feather_top)

        # Camada de Penas Inferiores
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.65, -0.22, 1.55))
        feather_bot = bpy.context.active_object
        feather_bot.scale = (0.60, 0.03, 0.55)
        feather_bot.rotation_euler = (0.1, side * 0.35, -side * 0.2)
        feather_bot.name = f"DW_WingBot_{'L' if side < 0 else 'R'}"
        apply_material(feather_bot, mat_wings)
        root_col.objects.link(feather_bot)

    # Exporta para GLB
    out_file = os.path.join(OUTPUT_DIR, "hero_dark_wizard.glb")
    proto_file = os.path.join(PROTOTYPE_DIR, "hero_dark_wizard.glb")
    bpy.ops.export_scene.gltf(filepath=out_file, export_format='GLB', use_selection=False)
    if os.path.exists(out_file):
        import shutil
        shutil.copyfile(out_file, proto_file)
    print(f"[OK] Modelo 3D exportado com sucesso: {out_file}")

# ============================================================================
# 3. FAIRY ELF (VIGIA DA FLORESTA / MUSE ELF)
# ============================================================================
def build_fairy_elf_scene():
    clear_scene()
    root_col = bpy.data.collections.new("FairyElf_Hero")
    bpy.context.scene.collection.children.link(root_col)

    # Materiais
    tex_leaf = generate_elven_leaf_texture()
    mat_armor = create_pbr_material("ELF_SpiritArmor", (0.08, 0.55, 0.32), metallic=0.55, roughness=0.30, texture_arr=tex_leaf)
    mat_gold = create_pbr_material("ELF_GoldFiligree", (0.95, 0.82, 0.25), metallic=0.90, roughness=0.20)
    mat_skin = create_pbr_material("ELF_SkinPale", (0.92, 0.80, 0.72), metallic=0.03, roughness=0.55)
    mat_hair = create_pbr_material("ELF_GoldenHair", (0.96, 0.85, 0.35), metallic=0.10, roughness=0.35)
    mat_wood = create_pbr_material("ELF_ElvenYewBow", (0.42, 0.28, 0.14), metallic=0.20, roughness=0.45)
    mat_string = create_pbr_material("ELF_PhotonString", (0.40, 1.0, 0.75), metallic=0.1, roughness=0.05, emissive=(0.3, 1.0, 0.6), emissive_strength=5.0)
    mat_wings = create_pbr_material("ELF_WingsSpirits", (0.25, 0.95, 0.65), metallic=0.15, roughness=0.15, emissive=(0.2, 0.8, 0.5), emissive_strength=2.8, alpha=0.72)

    create_pedestal(root_col, ring_color=(0.15, 0.95, 0.55))

    # Pernas e Botas de Caçadora Silvestre
    for side in (-1, 1):
        x = side * 0.16
        # Coxa
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.45, vertices=12, location=(x, 0, 0.92))
        thigh = bpy.context.active_object
        thigh.name = f"ELF_Thigh_{'L' if side < 0 else 'R'}"
        apply_material(thigh, mat_skin)
        root_col.objects.link(thigh)

        # Grevas de Couro Esmeralda
        bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.48, vertices=12, location=(x, 0, 0.48))
        shin = bpy.context.active_object
        shin.name = f"ELF_Greave_{'L' if side < 0 else 'R'}"
        apply_material(shin, mat_armor)
        root_col.objects.link(shin)

        # Bota Esbelta
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0.04, 0.24))
        boot = bpy.context.active_object
        boot.scale = (0.12, 0.26, 0.12)
        boot.name = f"ELF_Boot_{'L' if side < 0 else 'R'}"
        apply_material(boot, mat_gold)
        root_col.objects.link(boot)

    # Corset / Armadura Espiritual (Cintura e Busto)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.19, depth=0.48, vertices=14, location=(0, 0, 1.40))
    corset = bpy.context.active_object
    corset.name = "ELF_Corset"
    apply_material(corset, mat_armor)
    root_col.objects.link(corset)

    # Filigranas Douradas no Peitoral
    bpy.ops.mesh.primitive_torus_add(major_radius=0.19, minor_radius=0.02, major_segments=20, minor_segments=8, location=(0, 0, 1.52))
    trim_chest = bpy.context.active_object
    trim_chest.name = "ELF_ChestTrim"
    apply_material(trim_chest, mat_gold)
    root_col.objects.link(trim_chest)

    # Braços Ágeis
    for side in (-1, 1):
        x = side * 0.28
        bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=0.52, vertices=10, location=(x, 0, 1.34))
        arm = bpy.context.active_object
        arm.name = f"ELF_Arm_{'L' if side < 0 else 'R'}"
        apply_material(arm, mat_skin)
        root_col.objects.link(arm)

        # Braçadeiras de Ouro
        bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.18, vertices=10, location=(x, 0, 1.20))
        bracer = bpy.context.active_object
        bracer.name = f"ELF_Bracer_{'L' if side < 0 else 'R'}"
        apply_material(bracer, mat_gold)
        root_col.objects.link(bracer)

    # Cabeça e Rosto Nobre Élfico
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, location=(0, 0, 1.84))
    head = bpy.context.active_object
    head.name = "ELF_Head"
    apply_material(head, mat_skin)
    root_col.objects.link(head)

    # Orelhas Pontiagudas Élficas
    for side in (-1, 1):
        x = side * 0.15
        bpy.ops.mesh.primitive_cone_add(radius1=0.04, depth=0.24, vertices=4, location=(x, -0.04, 1.88))
        ear = bpy.context.active_object
        ear.rotation_euler = (-0.35, side * 0.8, side * 0.9)
        ear.name = f"ELF_Ear_{'L' if side < 0 else 'R'}"
        apply_material(ear, mat_skin)
        root_col.objects.link(ear)

    # Diadema de Folhas Douradas
    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.015, major_segments=24, minor_segments=8, location=(0, 0.02, 1.90))
    diadem = bpy.context.active_object
    diadem.rotation_euler = (0.2, 0, 0)
    diadem.name = "ELF_Diadem"
    apply_material(diadem, mat_gold)
    root_col.objects.link(diadem)

    # Cabelos Longos Dourados
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.75, vertices=8, location=(0, -0.12, 1.60))
    hair = bpy.context.active_object
    hair.rotation_euler = (0.25, 0, 0)
    hair.name = "ELF_LongHair"
    apply_material(hair, mat_hair)
    root_col.objects.link(hair)

    # Aljava de Flechas nas Costas
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.68, vertices=10, location=(0.14, -0.20, 1.45))
    quiver = bpy.context.active_object
    quiver.rotation_euler = (0, 0, -0.45)
    quiver.name = "ELF_Quiver"
    apply_material(quiver, mat_armor)
    root_col.objects.link(quiver)

    # ARMA: Arco Celestial (Mão Esquerda)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.65, minor_radius=0.03, major_segments=24, minor_segments=8, location=(-0.35, 0.25, 1.35))
    bow = bpy.context.active_object
    bow.rotation_euler = (0, math.pi/2, 0)
    bow.name = "ELF_CelestialBow"
    apply_material(bow, mat_wood)
    root_col.objects.link(bow)

    # Corda de Fótons do Arco
    bpy.ops.mesh.primitive_cylinder_add(radius=0.008, depth=1.28, vertices=6, location=(-0.35, 0.45, 1.35))
    bstring = bpy.context.active_object
    bstring.name = "ELF_BowString"
    apply_material(bstring, mat_string)
    root_col.objects.link(bstring)

    # ASAS: Wings of Spirits (Asas de Fada Translúcidas Iridescentes)
    for side in (-1, 1):
        x = side * 0.18
        # Asa Superior Longa
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.80, -0.25, 1.95))
        w_top = bpy.context.active_object
        w_top.scale = (0.75, 0.02, 0.45)
        w_top.rotation_euler = (0.15, side * 0.35, side * 0.35)
        w_top.name = f"ELF_WingSpiritTop_{'L' if side < 0 else 'R'}"
        apply_material(w_top, mat_wings)
        root_col.objects.link(w_top)

        # Asa Inferior Curta
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.55, -0.22, 1.45))
        w_bot = bpy.context.active_object
        w_bot.scale = (0.50, 0.02, 0.35)
        w_bot.rotation_euler = (0.10, side * 0.25, -side * 0.20)
        w_bot.name = f"ELF_WingSpiritBot_{'L' if side < 0 else 'R'}"
        apply_material(w_bot, mat_wings)
        root_col.objects.link(w_bot)

    # Exporta para GLB
    out_file = os.path.join(OUTPUT_DIR, "hero_fairy_elf.glb")
    proto_file = os.path.join(PROTOTYPE_DIR, "hero_fairy_elf.glb")
    bpy.ops.export_scene.gltf(filepath=out_file, export_format='GLB', use_selection=False)
    if os.path.exists(out_file):
        import shutil
        shutil.copyfile(out_file, proto_file)
    print(f"[OK] Modelo 3D exportado com sucesso: {out_file}")

# ============================================================================
# 4. MAGIC GLADIATOR (GLADIADOR RÚNICO / DUEL MASTER)
# ============================================================================
def build_magic_gladiator_scene():
    clear_scene()
    root_col = bpy.data.collections.new("MagicGladiator_Hero")
    bpy.context.scene.collection.children.link(root_col)

    # Materiais
    tex_steel = generate_runic_steel_texture()
    mat_armor = create_pbr_material("MG_HurricaneArmor", (0.10, 0.12, 0.18), metallic=0.90, roughness=0.18, texture_arr=tex_steel)
    mat_gold = create_pbr_material("MG_RunicGold", (0.95, 0.72, 0.18), metallic=0.92, roughness=0.22)
    mat_skin = create_pbr_material("MG_Skin", (0.82, 0.64, 0.54), metallic=0.05, roughness=0.55)
    mat_hair = create_pbr_material("MG_SilverHair", (0.85, 0.88, 0.95), metallic=0.25, roughness=0.30)
    mat_fire_edge = create_pbr_material("MG_FireBladeEdge", (1.0, 0.35, 0.05), metallic=0.2, roughness=0.1, emissive=(1.0, 0.25, 0.0), emissive_strength=5.5)
    mat_thunder_edge = create_pbr_material("MG_ThunderBladeEdge", (0.15, 0.85, 1.0), metallic=0.2, roughness=0.1, emissive=(0.1, 0.8, 1.0), emissive_strength=5.5)
    mat_steel = create_pbr_material("MG_DarkSteel", (0.35, 0.38, 0.42), metallic=0.92, roughness=0.15)
    mat_wings = create_pbr_material("MG_WingsDarkness", (0.10, 0.12, 0.16), metallic=0.85, roughness=0.25, emissive=(0.3, 0.1, 0.4), emissive_strength=1.8)

    create_pedestal(root_col, ring_color=(0.10, 0.85, 1.0))

    # Pernas e Grevas Rápidas
    for side in (-1, 1):
        x = side * 0.22
        bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.45, vertices=12, location=(x, 0, 0.90))
        thigh = bpy.context.active_object
        thigh.name = f"MG_Thigh_{'L' if side < 0 else 'R'}"
        apply_material(thigh, mat_armor)
        root_col.objects.link(thigh)

        bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.48, vertices=12, location=(x, 0, 0.48))
        shin = bpy.context.active_object
        shin.name = f"MG_Shin_{'L' if side < 0 else 'R'}"
        apply_material(shin, mat_armor)
        root_col.objects.link(shin)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0.05, 0.25))
        boot = bpy.context.active_object
        boot.scale = (0.16, 0.30, 0.14)
        boot.name = f"MG_Boot_{'L' if side < 0 else 'R'}"
        apply_material(boot, mat_steel)
        root_col.objects.link(boot)

    # Peitoral Aberto com Tatuagens Rúnicas (MG não usa armadura pesada no pescoço)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.45))
    chest = bpy.context.active_object
    chest.scale = (0.55, 0.32, 0.48)
    chest.name = "MG_Chestplate"
    apply_material(chest, mat_armor)
    root_col.objects.link(chest)

    # Ombreiras Angulares em Navalha
    for side in (-1, 1):
        x = side * 0.40
        bpy.ops.mesh.primitive_cone_add(radius1=0.18, depth=0.35, vertices=4, location=(x, 0, 1.70))
        pauldron = bpy.context.active_object
        pauldron.rotation_euler = (0, side * 0.5, side * 0.2)
        pauldron.name = f"MG_BladePauldron_{'L' if side < 0 else 'R'}"
        apply_material(pauldron, mat_steel)
        root_col.objects.link(pauldron)

    # Braços Ágeis com Manoplas Rúnicas
    for side in (-1, 1):
        x = side * 0.36
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.52, vertices=10, location=(x, 0, 1.34))
        arm = bpy.context.active_object
        arm.name = f"MG_Arm_{'L' if side < 0 else 'R'}"
        apply_material(arm, mat_armor)
        root_col.objects.link(arm)

    # Cabeça sem Elmo (Identidade visual de MG: Cabelos prateados longos e tiara rúnica)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(0, 0, 1.90))
    head = bpy.context.active_object
    head.name = "MG_Head"
    apply_material(head, mat_skin)
    root_col.objects.link(head)

    # Tiara Rúnica na Testa
    bpy.ops.mesh.primitive_torus_add(major_radius=0.145, minor_radius=0.015, major_segments=20, minor_segments=8, location=(0, 0.02, 1.95))
    circlet = bpy.context.active_object
    circlet.name = "MG_RunicHeadband"
    apply_material(circlet, mat_gold)
    root_col.objects.link(circlet)

    # Cabelos Prateados Selvagens
    bpy.ops.mesh.primitive_cone_add(radius1=0.18, depth=0.55, vertices=8, location=(0, -0.08, 1.95))
    hair = bpy.context.active_object
    hair.rotation_euler = (0.45, 0, 0)
    hair.name = "MG_SpikyHair"
    apply_material(hair, mat_hair)
    root_col.objects.link(hair)

    # ARMA 1: Espada Rúnica de Fogo (Mão Direita)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.42, 0.20, 1.60))
    fblade = bpy.context.active_object
    fblade.scale = (0.12, 0.03, 1.35)
    fblade.name = "MG_FireBlade"
    apply_material(fblade, mat_steel)
    root_col.objects.link(fblade)

    # Fio Flamejante da Lâmina
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.48, 0.20, 1.60))
    fedge = bpy.context.active_object
    fedge.scale = (0.02, 0.032, 1.32)
    fedge.name = "MG_FireEdgeGlow"
    apply_material(fedge, mat_fire_edge)
    root_col.objects.link(fedge)

    # ARMA 2: Espada Rúnica de Trovão (Mão Esquerda)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.42, 0.20, 1.60))
    tblade = bpy.context.active_object
    tblade.scale = (0.12, 0.03, 1.35)
    tblade.name = "MG_ThunderBlade"
    apply_material(tblade, mat_steel)
    root_col.objects.link(tblade)

    # Fio Eletro-Ciano da Lâmina
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.48, 0.20, 1.60))
    tedge = bpy.context.active_object
    tedge.scale = (0.02, 0.032, 1.32)
    tedge.name = "MG_ThunderEdgeGlow"
    apply_material(tedge, mat_thunder_edge)
    root_col.objects.link(tedge)

    # ASAS: Wings of Darkness (Asas das Trevas com Lâminas Metálicas)
    for side in (-1, 1):
        x = side * 0.22
        # Lâmina Principal da Asa
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.85, -0.25, 1.95))
        wblade = bpy.context.active_object
        wblade.scale = (0.85, 0.03, 0.40)
        wblade.rotation_euler = (0.2, side * 0.4, side * 0.15)
        wblade.name = f"MG_WingBlade_{'L' if side < 0 else 'R'}"
        apply_material(wblade, mat_wings)
        root_col.objects.link(wblade)

        # Lâmina Secundária Inferior
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.65, -0.22, 1.50))
        wblade2 = bpy.context.active_object
        wblade2.scale = (0.65, 0.03, 0.35)
        wblade2.rotation_euler = (0.1, side * 0.25, -side * 0.25)
        wblade2.name = f"MG_WingBladeSub_{'L' if side < 0 else 'R'}"
        apply_material(wblade2, mat_wings)
        root_col.objects.link(wblade2)

    # Exporta para GLB
    out_file = os.path.join(OUTPUT_DIR, "hero_magic_gladiator.glb")
    proto_file = os.path.join(PROTOTYPE_DIR, "hero_magic_gladiator.glb")
    bpy.ops.export_scene.gltf(filepath=out_file, export_format='GLB', use_selection=False)
    if os.path.exists(out_file):
        import shutil
        shutil.copyfile(out_file, proto_file)
    print(f"[OK] Modelo 3D exportado com sucesso: {out_file}")

# ============================================================================
# 5. DARK LORD (SOBERANO IMPERIAL / LORD EMPEROR)
# ============================================================================
def build_dark_lord_scene():
    clear_scene()
    root_col = bpy.data.collections.new("DarkLord_Hero")
    bpy.context.scene.collection.children.link(root_col)

    # Materiais
    tex_velvet = generate_imperial_velvet_texture()
    mat_armor = create_pbr_material("DL_ImperialPlate", (0.10, 0.10, 0.12), metallic=0.92, roughness=0.18)
    mat_gold = create_pbr_material("DL_RoyalGold", (0.95, 0.78, 0.18), metallic=0.95, roughness=0.20)
    mat_skin = create_pbr_material("DL_Skin", (0.82, 0.65, 0.55), metallic=0.04, roughness=0.55)
    mat_cape = create_pbr_material("DL_RoyalVelvetCape", (0.65, 0.04, 0.08), metallic=0.20, roughness=0.55, texture_arr=tex_velvet)
    mat_raven = create_pbr_material("DL_DarkRavenFeathers", (0.05, 0.05, 0.07), metallic=0.50, roughness=0.30)
    mat_gem = create_pbr_material("DL_CrownRuby", (1.0, 0.08, 0.08), metallic=0.1, roughness=0.05, emissive=(1.0, 0.05, 0.05), emissive_strength=4.5)
    mat_scepter = create_pbr_material("DL_ShiningScepter", (0.95, 0.85, 0.25), metallic=0.92, roughness=0.15, emissive=(0.8, 0.6, 0.1), emissive_strength=2.2)

    create_pedestal(root_col, ring_color=(0.95, 0.75, 0.15))

    # Pernas e Botas Nobres Blindadas
    for side in (-1, 1):
        x = side * 0.22
        bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.45, vertices=12, location=(x, 0, 0.90))
        thigh = bpy.context.active_object
        thigh.name = f"DL_Thigh_{'L' if side < 0 else 'R'}"
        apply_material(thigh, mat_armor)
        root_col.objects.link(thigh)

        bpy.ops.mesh.primitive_cylinder_add(radius=0.105, depth=0.48, vertices=12, location=(x, 0, 0.48))
        shin = bpy.context.active_object
        shin.name = f"DL_Shin_{'L' if side < 0 else 'R'}"
        apply_material(shin, mat_armor)
        root_col.objects.link(shin)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0.05, 0.25))
        boot = bpy.context.active_object
        boot.scale = (0.16, 0.32, 0.14)
        boot.name = f"DL_Boot_{'L' if side < 0 else 'R'}"
        apply_material(boot, mat_gold)
        root_col.objects.link(boot)

    # Peitoral Imperial com Águia Solar Dourada
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.45))
    chest = bpy.context.active_object
    chest.scale = (0.58, 0.34, 0.48)
    chest.name = "DL_ImperialCuirass"
    apply_material(chest, mat_armor)
    root_col.objects.link(chest)

    # Brasão Dourado no Peito
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.04, vertices=8, location=(0, 0.18, 1.48))
    crest = bpy.context.active_object
    crest.rotation_euler = (math.pi/2, 0, 0)
    crest.name = "DL_ImperialCrest"
    apply_material(crest, mat_gold)
    root_col.objects.link(crest)

    # Ombreiras Majestosas de Lorde (Ombreira Esquerda com Poleiro para o Dark Raven)
    for side in (-1, 1):
        x = side * 0.42
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.25, vertices=12, location=(x, 0, 1.68))
        pauldron = bpy.context.active_object
        pauldron.name = f"DL_Pauldron_{'L' if side < 0 else 'R'}"
        apply_material(pauldron, mat_gold)
        root_col.objects.link(pauldron)

    # Braços Fortes
    for side in (-1, 1):
        x = side * 0.38
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.52, vertices=10, location=(x, 0, 1.34))
        arm = bpy.context.active_object
        arm.name = f"DL_Arm_{'L' if side < 0 else 'R'}"
        apply_material(arm, mat_armor)
        root_col.objects.link(arm)

    # Cabeça e Coroa Imperial
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(0, 0, 1.90))
    head = bpy.context.active_object
    head.name = "DL_Head"
    apply_material(head, mat_skin)
    root_col.objects.link(head)

    # Coroa Real Spiked Sunburst Crown
    bpy.ops.mesh.primitive_cylinder_add(radius=0.16, depth=0.08, vertices=16, location=(0, 0, 2.02))
    crown = bpy.context.active_object
    crown.name = "DL_ImperialCrown"
    apply_material(crown, mat_gold)
    root_col.objects.link(crown)

    # Pontas da Coroa
    for i in range(5):
        ang = (i - 2) * 0.35
        px = math.sin(ang) * 0.15
        py = math.cos(ang) * 0.15
        bpy.ops.mesh.primitive_cone_add(radius1=0.03, depth=0.16, vertices=4, location=(px, py, 2.12))
        cp = bpy.context.active_object
        cp.name = f"DL_CrownSpike_{i}"
        apply_material(cp, mat_gold)
        root_col.objects.link(cp)

    # Rubi Central da Coroa
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.045, subdivisions=1, location=(0, 0.16, 2.06))
    crubi = bpy.context.active_object
    crubi.name = "DL_CrownRuby"
    apply_material(crubi, mat_gem)
    root_col.objects.link(crubi)

    # CAPA REAL MAJESTOSA (Mantle of Monarch)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.26, 1.10))
    cape = bpy.context.active_object
    cape.scale = (0.78, 0.04, 1.35)
    cape.rotation_euler = (0.15, 0, 0)
    cape.name = "DL_RoyalVelvetCape"
    apply_material(cape, mat_cape)
    root_col.objects.link(cape)

    # COMPANHEIRO: Dark Raven (Corvo pousado no ombro esquerdo)
    raven_x, raven_y, raven_z = -0.42, 0.05, 1.86
    # Corpo do corvo
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.22, vertices=8, location=(raven_x, raven_y, raven_z))
    rcorpo = bpy.context.active_object
    rcorpo.rotation_euler = (0.4, 0, 0)
    rcorpo.name = "DL_DarkRavenBody"
    apply_material(rcorpo, mat_raven)
    root_col.objects.link(rcorpo)

    # Cabeça e bico do corvo
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, location=(raven_x, raven_y + 0.08, raven_z + 0.12))
    rcab = bpy.context.active_object
    rcab.name = "DL_DarkRavenHead"
    apply_material(rcab, mat_raven)
    root_col.objects.link(rcab)

    bpy.ops.mesh.primitive_cone_add(radius1=0.02, depth=0.08, vertices=4, location=(raven_x, raven_y + 0.14, raven_z + 0.11))
    rbico = bpy.context.active_object
    rbico.rotation_euler = (math.pi/2, 0, 0)
    rbico.name = "DL_DarkRavenBeak"
    apply_material(rbico, mat_gold)
    root_col.objects.link(rbico)

    # Asas dobradas do corvo
    for rside in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(raven_x + rside * 0.06, raven_y - 0.02, raven_z + 0.02))
        rw = bpy.context.active_object
        rw.scale = (0.02, 0.12, 0.18)
        rw.rotation_euler = (0.3, 0, 0)
        rw.name = f"DL_DarkRavenWing_{'L' if rside < 0 else 'R'}"
        apply_material(rw, mat_raven)
        root_col.objects.link(rw)

    # ARMA: Great Lord Scepter (Mão Direita)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=1.65, vertices=12, location=(0.42, 0.22, 1.15))
    scepter_shaft = bpy.context.active_object
    scepter_shaft.name = "DL_ScepterShaft"
    apply_material(scepter_shaft, mat_gold)
    root_col.objects.link(scepter_shaft)

    # Esfera Solar no Topo do Cetro
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.13, subdivisions=2, location=(0.42, 0.22, 2.05))
    scepter_orb = bpy.context.active_object
    scepter_orb.name = "DL_ScepterSunCore"
    apply_material(scepter_orb, mat_scepter)
    root_col.objects.link(scepter_orb)

    # Coroa Sunburst ao redor da esfera
    bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.025, major_segments=16, minor_segments=8, location=(0.42, 0.22, 2.05))
    scepter_ring = bpy.context.active_object
    scepter_ring.name = "DL_ScepterRing"
    apply_material(scepter_ring, mat_gold)
    root_col.objects.link(scepter_ring)

    # ESCUDO: Imperial Shield (Mão Esquerda)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.06, vertices=16, location=(-0.45, 0.22, 1.25))
    shield = bpy.context.active_object
    shield.rotation_euler = (0, math.pi/2, 0)
    shield.name = "DL_ImperialShield"
    apply_material(shield, mat_gold)
    root_col.objects.link(shield)

    # Exporta para GLB
    out_file = os.path.join(OUTPUT_DIR, "hero_dark_lord.glb")
    proto_file = os.path.join(PROTOTYPE_DIR, "hero_dark_lord.glb")
    bpy.ops.export_scene.gltf(filepath=out_file, export_format='GLB', use_selection=False)
    if os.path.exists(out_file):
        import shutil
        shutil.copyfile(out_file, proto_file)
    print(f"[OK] Modelo 3D exportado com sucesso: {out_file}")

# ============================================================================
# DISPATCHER PRINCIPAL VIA LINHA DE COMANDO
# ============================================================================
def main():
    parser = argparse.ArgumentParser(description="Dasi MMORPG - Blender 5.2 Hero 3D Builder")
    parser.add_argument("--hero", choices=["DK", "DW", "ELF", "MG", "DL", "ALL"], default="ALL", help="Classe a gerar")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])

    print(f"\n=======================================================")
    print(f" DASI 3D - COMPILADOR PROCEDURAL DE CLASSES HEROICAS")
    print(f" Blender Engine: {bpy.app.version_string}")
    print(f" Saída GLB: {OUTPUT_DIR}")
    print(f" Alvo Selecionado: {args.hero}")
    print(f"=======================================================\n")

    if args.hero in ["DK", "ALL"]:
        build_dark_knight_scene()
    if args.hero in ["DW", "ALL"]:
        build_dark_wizard_scene()
    if args.hero in ["ELF", "ALL"]:
        build_fairy_elf_scene()
    if args.hero in ["MG", "ALL"]:
        build_magic_gladiator_scene()
    if args.hero in ["DL", "ALL"]:
        build_dark_lord_scene()

    print("\n[DASI 3D] Todos os modelos solicitados foram compilados e exportados em GLB com sucesso!")

if __name__ == "__main__":
    main()
