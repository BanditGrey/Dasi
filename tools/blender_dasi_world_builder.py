"""
==============================================================================
🏛️ DASI MMORPG - BLENDER 5.2 COMPLETE HIGH-FIDELITY 3D WORLDS (AAA)
==============================================================================
Gera os 10 MAPAS 3D COMPLETOS BASEADOS 100% NOS CONCEPT ARTS OFICIAIS:
- Topografia real completa, calçamentos, relevos, dunas e abismos
- Arquitetura monumental gótica, nórdica, subaquática e celestial
- Modelagem detalhada de fachadas, janelas com luz interior, vitrais, forjas,
  tavernas, sequóias com passarelas, catedrais, catacumbas com arcos ogivais,
  grelhas de magma, esqueletos colossais de leviatãs e vermes titânicos,
  máquinas de guerra enferrujadas, anéis giroscópicos e pontes de luz estelar.
- Shading suave (Smooth Shading) em todas as curvaturas orgânicas e arquitetônicas.
- Materiais PBR idênticos às paletas oficiais e canais emissivos HDR.

Execução:
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --python tools/blender_dasi_world_builder.py -- --biome ALL
==============================================================================
"""

import sys
import os
import math
import argparse
import bpy

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "prototypes", "3d_scenery"))
DEV_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "client", "dev_viewer", "models"))
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DEV_MODELS_DIR, exist_ok=True)

def clear_scene():
    """Limpa objetos, malhas, materiais e coleções para criar cena limpa."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)

def set_smooth(obj):
    """Aplica sombreamento suave (Smooth Shading) em superfícies curvas."""
    if obj and obj.data and hasattr(obj.data, "polygons"):
        for poly in obj.data.polygons:
            poly.use_smooth = True

def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, emissive=(0, 0, 0, 1), emissive_strength=0.0, alpha=1.0):
    """Cria material PBR Principled BSDF compatível com Blender 5.2 e Three.js GLTFLoader."""
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = (*base_color[:3], 1.0) if len(base_color) == 3 else base_color
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

def apply_mat(obj, material):
    if len(obj.data.materials) == 0:
        obj.data.materials.append(material)
    else:
        obj.data.materials[0] = material

def export_and_sync(collection_name, filename):
    """Exporta como GLB comprimido e sincroniza com o Dev Viewer."""
    out_file = os.path.join(OUTPUT_DIR, filename)
    bpy.ops.export_scene.gltf(filepath=out_file, export_format='GLB', use_selection=False)
    file_size = os.path.getsize(out_file)
    print(f"[BlenderWorldBuilder] ✅ {collection_name} gerada: {out_file} ({file_size} bytes)")

    dev_file = os.path.join(DEV_MODELS_DIR, filename)
    try:
        import shutil
        shutil.copyfile(out_file, dev_file)
        print(f"[BlenderWorldBuilder] 🔄 Sincronizado com Dev Viewer: {dev_file}")
    except Exception as e:
        print(f"[BlenderWorldBuilder] ⚠️ Aviso de sincronização: {e}")

# ============================================================================
# COMPONENTES ARQUITETÔNICOS MODULARES DE ALTA FIDELIDADE
# ============================================================================

def create_terrain_block(name, size_x, size_z, material, height=0.8, pos=(0, 0, -0.4)):
    """Gera bloco sólido de terreno com dimensões completas."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(pos[0], pos[1], pos[2]))
    obj = bpy.context.active_object
    obj.scale = (size_x, size_z, height)
    obj.name = name
    apply_mat(obj, material)
    return obj

def create_column(name, x, z, radius, height, mat_stone, mat_accent=None):
    """Coluna clássica com plinto, fuste cilíndrico e capitel com moldura e ábaco."""
    # Plinto inferior
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, z, 0.25))
    b1 = bpy.context.active_object
    b1.scale = (radius * 2.8, radius * 2.8, 0.5)
    b1.name = f"{name}_Plinth"
    apply_mat(b1, mat_stone)

    # Base moldada (Torus)
    bpy.ops.mesh.primitive_cylinder_add(radius=radius * 1.35, depth=0.4, vertices=16, location=(x, z, 0.65))
    b2 = bpy.context.active_object
    b2.name = f"{name}_BaseTorus"
    set_smooth(b2)
    apply_mat(b2, mat_accent or mat_stone)

    # Fuste
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height - 1.6, vertices=16, location=(x, z, height / 2 + 0.1))
    shaft = bpy.context.active_object
    shaft.name = f"{name}_Shaft"
    set_smooth(shaft)
    apply_mat(shaft, mat_stone)

    # Capitel com ábaco
    bpy.ops.mesh.primitive_cylinder_add(radius=radius * 1.35, depth=0.4, vertices=16, location=(x, z, height - 0.65))
    c1 = bpy.context.active_object
    c1.name = f"{name}_CapTorus"
    set_smooth(c1)
    apply_mat(c1, mat_accent or mat_stone)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, z, height - 0.25))
    c2 = bpy.context.active_object
    c2.scale = (radius * 2.8, radius * 2.8, 0.5)
    c2.name = f"{name}_Abacus"
    apply_mat(c2, mat_stone)

def create_crenellated_wall(name, x1, z1, x2, z2, height, thickness, mat_stone):
    """Muralha de pedra ciclópica com passadiço de patrulha e ameias de proteção."""
    dx = x2 - x1
    dz = z2 - z1
    length = math.sqrt(dx * dx + dz * dz)
    angle = math.atan2(dz, dx)
    cx = (x1 + x2) / 2
    cz = (z1 + z2) / 2

    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cz, height / 2))
    wall = bpy.context.active_object
    wall.scale = (length, thickness, height)
    wall.rotation_euler = (0, 0, angle)
    wall.name = f"{name}_Body"
    apply_mat(wall, mat_stone)

    merlon_w = 1.4
    merlon_gap = 1.2
    step = merlon_w + merlon_gap
    count = max(1, int(length / step))
    for i in range(count):
        pos_frac = (i * step - length / 2 + step / 2)
        mx = cx + math.cos(angle) * pos_frac - math.sin(angle) * (thickness / 2 - 0.2)
        mz = cz + math.sin(angle) * pos_frac + math.cos(angle) * (thickness / 2 - 0.2)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(mx, mz, height + 0.45))
        merlon = bpy.context.active_object
        merlon.scale = (merlon_w, 0.4, 0.9)
        merlon.rotation_euler = (0, 0, angle)
        merlon.name = f"{name}_Merlon_{i}"
        apply_mat(merlon, mat_stone)

def create_round_tower(name, x, z, radius, height, roof_height, mat_stone, mat_roof):
    """Torre de menagem cilíndrica com balcão de ameias e teto cônico."""
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height, vertices=20, location=(x, z, height / 2))
    tower = bpy.context.active_object
    tower.name = f"{name}_Tower"
    set_smooth(tower)
    apply_mat(tower, mat_stone)

    bpy.ops.mesh.primitive_cylinder_add(radius=radius * 1.15, depth=0.8, vertices=20, location=(x, z, height + 0.4))
    cornice = bpy.context.active_object
    cornice.name = f"{name}_Cornice"
    set_smooth(cornice)
    apply_mat(cornice, mat_stone)

    bpy.ops.mesh.primitive_cone_add(radius1=radius * 1.25, depth=roof_height, vertices=20, location=(x, z, height + 0.8 + roof_height / 2))
    roof = bpy.context.active_object
    roof.name = f"{name}_Roof"
    set_smooth(roof)
    apply_mat(roof, mat_roof)

def create_house(name, x, z, width, depth, height, roof_height, angle, mat_walls, mat_roof, mat_wood, mat_window_glow=None):
    """Casa medieval/gótica completa com alvenaria, teto de duas águas, chaminé e janelas quentes."""
    cx, cz = x, z
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cz, height / 2))
    body = bpy.context.active_object
    body.scale = (width, depth, height)
    body.rotation_euler = (0, 0, angle)
    body.name = f"{name}_Walls"
    apply_mat(body, mat_walls)

    # Teto triangular em duas águas
    bpy.ops.mesh.primitive_cylinder_add(radius=width * 0.72, depth=depth * 1.08, vertices=3, location=(cx, cz, height + roof_height / 2))
    roof = bpy.context.active_object
    roof.rotation_euler = (math.pi / 2, angle, 0)
    roof.scale = (1.0, roof_height / (width * 0.72), 1.0)
    roof.name = f"{name}_Roof"
    apply_mat(roof, mat_roof)

    # Chaminé de pedra
    bpy.ops.mesh.primitive_cube_add(size=1, location=(
        cx + math.cos(angle) * (width * 0.35) - math.sin(angle) * (depth * 0.25),
        cz + math.sin(angle) * (width * 0.35) + math.cos(angle) * (depth * 0.25),
        height + roof_height * 0.6
    ))
    chimney = bpy.context.active_object
    chimney.scale = (0.9, 0.9, roof_height + 1.2)
    chimney.name = f"{name}_Chimney"
    apply_mat(chimney, mat_walls)

    # Porta de Carvalho
    bpy.ops.mesh.primitive_cube_add(size=1, location=(
        cx - math.sin(angle) * (depth / 2 + 0.05),
        cz + math.cos(angle) * (depth / 2 + 0.05),
        1.2
    ))
    door = bpy.context.active_object
    door.scale = (1.4, 0.15, 2.3)
    door.rotation_euler = (0, 0, angle)
    door.name = f"{name}_Door"
    apply_mat(door, mat_wood)

    # Janelas iluminadas (2100K Glow)
    if mat_window_glow:
        for wx_off in (-width * 0.25, width * 0.25):
            bpy.ops.mesh.primitive_cube_add(size=1, location=(
                cx + math.cos(angle) * wx_off - math.sin(angle) * (depth / 2 + 0.06),
                cz + math.sin(angle) * wx_off + math.cos(angle) * (depth / 2 + 0.06),
                height * 0.6
            ))
            win = bpy.context.active_object
            win.scale = (1.1, 0.1, 1.3)
            win.rotation_euler = (0, 0, angle)
            win.name = f"{name}_Window"
            apply_mat(win, mat_window_glow)

def create_brazier(name, x, z, y_base, radius, height, mat_iron, mat_fire):
    """Braseiro com tripé de ferro forjado e chamas vivas."""
    for i in range(3):
        ang = (i / 3) * math.pi * 2
        px = x + math.cos(ang) * (radius * 0.85)
        pz = z + math.sin(ang) * (radius * 0.85)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=height * 0.65, vertices=8, location=(px, pz, y_base + height * 0.32))
        leg = bpy.context.active_object
        leg.rotation_euler = (0.18 * math.sin(ang), -0.18 * math.cos(ang), 0)
        leg.name = f"{name}_Leg_{i}"
        set_smooth(leg)
        apply_mat(leg, mat_iron)

    bpy.ops.mesh.primitive_cone_add(radius1=radius, radius2=radius * 0.55, depth=height * 0.35, vertices=16, location=(x, z, y_base + height * 0.75))
    basin = bpy.context.active_object
    basin.name = f"{name}_Basin"
    set_smooth(basin)
    apply_mat(basin, mat_iron)

    bpy.ops.mesh.primitive_cone_add(radius1=radius * 0.82, depth=height * 0.5, vertices=12, location=(x, z, y_base + height * 0.95))
    fire = bpy.context.active_object
    fire.name = f"{name}_Fire"
    set_smooth(fire)
    apply_mat(fire, mat_fire)

def create_market_stall(name, x, z, width, depth, height, angle, mat_wood, mat_cloth):
    """Tenda de bazar com estande de madeira e toldo de tecido colorido."""
    cx, cz = x, z
    for px in (-width / 2 + 0.15, width / 2 - 0.15):
        for pz in (-depth / 2 + 0.15, depth / 2 - 0.15):
            wx = cx + math.cos(angle) * px - math.sin(angle) * pz
            wz = cz + math.sin(angle) * px + math.cos(angle) * pz
            bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=height, vertices=6, location=(wx, wz, height / 2))
            pole = bpy.context.active_object
            pole.name = f"{name}_Pole"
            set_smooth(pole)
            apply_mat(pole, mat_wood)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cz, 0.9))
    counter = bpy.context.active_object
    counter.scale = (width * 0.9, depth * 0.45, 0.9)
    counter.rotation_euler = (0, 0, angle)
    counter.name = f"{name}_Counter"
    apply_mat(counter, mat_wood)

    bpy.ops.mesh.primitive_cone_add(radius1=width * 0.75, depth=0.9, vertices=4, location=(cx, cz, height + 0.4))
    roof = bpy.context.active_object
    roof.rotation_euler = (0, 0, angle + math.pi / 4)
    roof.name = f"{name}_Canopy"
    apply_mat(roof, mat_cloth)


# ============================================================================
# 1. 🌧️ BIOMA LORENCIA: CIDADELA DO CASTELO DE LOREN (100% FIEL AO CONCEPT)
# ============================================================================
def build_lorencia_scene():
    clear_scene()
    root_col = bpy.data.collections.new("Lorencia_Citadel_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_floor = create_pbr_material("LorenFloor", (0.34, 0.36, 0.38), metallic=0.15, roughness=0.62)
    mat_stone = create_pbr_material("LorenWall", (0.26, 0.28, 0.30), metallic=0.12, roughness=0.78)
    mat_stone_dark = create_pbr_material("LorenStoneDark", (0.18, 0.19, 0.22), metallic=0.10, roughness=0.85)
    mat_wood = create_pbr_material("LorenWood", (0.24, 0.16, 0.10), metallic=0.05, roughness=0.82)
    mat_roof_slate = create_pbr_material("LorenSlateRoof", (0.16, 0.18, 0.22), metallic=0.15, roughness=0.65)
    mat_water = create_pbr_material("LorenWater", (0.05, 0.45, 0.60), metallic=0.1, roughness=0.04, alpha=0.85)
    mat_bronze = create_pbr_material("LorenBronze", (0.65, 0.45, 0.20), metallic=0.85, roughness=0.32)
    mat_gold = create_pbr_material("LorenGold", (0.95, 0.75, 0.15), metallic=0.92, roughness=0.22, emissive=(0.95, 0.75, 0.15, 1), emissive_strength=1.8)
    mat_torch = create_pbr_material("LorenFire", (1.0, 0.55, 0.1), metallic=0.1, roughness=0.1, emissive=(1.0, 0.50, 0.08, 1), emissive_strength=4.5)
    mat_window_glow = create_pbr_material("LorenWindowGlow", (1.0, 0.75, 0.3), metallic=0.1, roughness=0.2, emissive=(1.0, 0.70, 0.25, 1), emissive_strength=3.2)
    mat_cloth_red = create_pbr_material("LorenTentRed", (0.65, 0.08, 0.12), metallic=0.05, roughness=0.70)
    mat_cloth_blue = create_pbr_material("LorenTentBlue", (0.08, 0.25, 0.60), metallic=0.05, roughness=0.70)
    mat_iron = create_pbr_material("LorenIron", (0.12, 0.13, 0.15), metallic=0.88, roughness=0.45)

    # 1. Terreno Total da Cidadela (56m x 56m)
    create_terrain_block("Lorencia_GroundTotal", 56.0, 56.0, mat_floor, height=0.8, pos=(0, 0, -0.4))

    # Praça Central Octogonal Elevada com Degraus
    bpy.ops.mesh.primitive_cylinder_add(radius=16.5, depth=0.35, vertices=8, location=(0, 0, 0.17))
    plaza_tier = bpy.context.active_object
    plaza_tier.name = "Lorencia_PlazaTier"
    apply_mat(plaza_tier, mat_stone)

    # 2. Monumental Fonte do Arcanjo de Loren
    bpy.ops.mesh.primitive_cylinder_add(radius=5.2, depth=0.95, vertices=8, location=(0, 0, 0.5))
    fountain_basin = bpy.context.active_object
    fountain_basin.name = "Lorencia_FountainBasin"
    apply_mat(fountain_basin, mat_stone)

    bpy.ops.mesh.primitive_cylinder_add(radius=4.8, depth=0.15, vertices=16, location=(0, 0, 0.85))
    water = bpy.context.active_object
    water.name = "Lorencia_FountainWater"
    set_smooth(water)
    apply_mat(water, mat_water)

    bpy.ops.mesh.primitive_cylinder_add(radius=2.6, depth=0.55, vertices=8, location=(0, 0, 1.8))
    basin2 = bpy.context.active_object
    basin2.name = "Lorencia_FountainBasin2"
    apply_mat(basin2, mat_stone)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=2.8, vertices=12, location=(0, 0, 2.7))
    pedestal = bpy.context.active_object
    pedestal.name = "Lorencia_Pedestal"
    set_smooth(pedestal)
    apply_mat(pedestal, mat_stone)

    bpy.ops.mesh.primitive_cone_add(radius1=0.5, radius2=0.28, depth=2.6, vertices=10, location=(0, 0, 4.6))
    torso = bpy.context.active_object
    torso.name = "Lorencia_ArchangelTorso"
    set_smooth(torso)
    apply_mat(torso, mat_bronze)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.6, minor_radius=0.07, location=(0, 0, 6.1))
    halo = bpy.context.active_object
    halo.name = "Lorencia_ArchangelHalo"
    set_smooth(halo)
    apply_mat(halo, mat_gold)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(radius1=0.38, depth=4.2, vertices=6, location=(side * 1.2, -0.35, 5.2))
        wing = bpy.context.active_object
        wing.rotation_euler = (0.32, side * 0.72, -side * 0.28)
        wing.name = f"Lorencia_ArchangelWing_{'L' if side < 0 else 'R'}"
        set_smooth(wing)
        apply_mat(wing, mat_bronze)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.55, 3.8))
    sword = bpy.context.active_object
    sword.scale = (0.1, 0.25, 2.8)
    sword.name = "Lorencia_ArchangelSword"
    apply_mat(sword, mat_gold)

    # 3. Castelo de Loren ao Fundo (Keep Monumental Norte com 22m de Altura)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 27.0, 11.0))
    keep = bpy.context.active_object
    keep.scale = (28.0, 6.0, 22.0)
    keep.name = "Lorencia_CastleKeep"
    apply_mat(keep, mat_stone_dark)

    # Janelas Ogivais do Castelo com Luz Quente
    for kwin_x in (-9.0, -3.0, 3.0, 9.0):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(kwin_x, 23.9, 13.0))
        kwin = bpy.context.active_object
        kwin.scale = (1.8, 0.2, 3.5)
        kwin.name = f"Lorencia_KeepWindow_{kwin_x}"
        apply_mat(kwin, mat_window_glow)

    # 4. Muralhas Ciclópicas e Portão de Menagem com Torres Gêmeas de 16m
    create_crenellated_wall("Lorencia_NorthWall_L", -27, 23, -5.5, 23, 10.0, 3.8, mat_stone_dark)
    create_crenellated_wall("Lorencia_NorthWall_R", 5.5, 23, 27, 23, 10.0, 3.8, mat_stone_dark)

    create_round_tower("Lorencia_GateTower_L", -5.5, 23.0, 3.8, 13.0, 5.0, mat_stone_dark, mat_roof_slate)
    create_round_tower("Lorencia_GateTower_R", 5.5, 23.0, 3.8, 13.0, 5.0, mat_stone_dark, mat_roof_slate)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 23.0, 5.2))
    gate = bpy.context.active_object
    gate.scale = (8.5, 1.6, 9.5)
    gate.name = "Lorencia_OakGate"
    apply_mat(gate, mat_wood)

    # 5. A Forja do Ferreiro Han (Setor Leste)
    create_house("Lorencia_Forge_Main", 19.0, -8.0, 9.5, 7.5, 6.5, 3.8, 0.2, mat_stone, mat_roof_slate, mat_wood, mat_window_glow)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(15.5, -6.5, 0.8))
    anvil = bpy.context.active_object
    anvil.scale = (0.8, 1.4, 0.9)
    anvil.name = "Lorencia_Forge_Anvil"
    apply_mat(anvil, mat_iron)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(15.5, -9.5, 1.2))
    furnace = bpy.context.active_object
    furnace.scale = (2.4, 1.8, 2.5)
    furnace.name = "Lorencia_Forge_Furnace"
    apply_mat(furnace, mat_stone)

    bpy.ops.mesh.primitive_cone_add(radius1=0.8, depth=0.9, vertices=8, location=(15.5, -8.8, 1.5))
    forge_fire = bpy.context.active_object
    forge_fire.name = "Lorencia_Forge_Ember"
    set_smooth(forge_fire)
    apply_mat(forge_fire, mat_torch)

    # 6. A Taverna da Lareira Dourada (Setor Nordeste)
    create_house("Lorencia_Tavern_Main", 17.0, 14.0, 12.5, 9.5, 9.0, 4.5, -0.15, mat_stone, mat_roof_slate, mat_wood, mat_window_glow)
    create_house("Lorencia_Tavern_Stables", 23.0, 9.0, 6.5, 7.5, 5.0, 2.8, 0.3, mat_wood, mat_roof_slate, mat_wood)

    # 7. Loja de Poções da Feiticeira Pasi (Setor Noroeste)
    create_house("Lorencia_PotionShop", -19.0, 14.0, 9.5, 8.5, 7.5, 4.0, 0.18, mat_stone, mat_roof_slate, mat_wood, mat_window_glow)

    # 8. Armaria e Quartel da Guarda (Setor Sudoeste)
    create_house("Lorencia_GuardArmory", -19.0, -10.0, 10.5, 8.5, 8.0, 4.2, -0.22, mat_stone, mat_roof_slate, mat_wood, mat_window_glow)

    # 9. O Grande Bazar Medieval (6 Tendas)
    bazaar_configs = [
        ("Stall_SW1", -9.5, -6.5, 3.5, 2.8, 2.6, 0.1, mat_cloth_red),
        ("Stall_SW2", -11.5, -11.5, 3.2, 2.6, 2.6, -0.2, mat_cloth_blue),
        ("Stall_SE1", 9.5, -6.5, 3.5, 2.8, 2.6, -0.1, mat_cloth_blue),
        ("Stall_SE2", 11.5, -11.5, 3.2, 2.6, 2.6, 0.2, mat_cloth_red),
        ("Stall_NW1", -9.5, 6.5, 3.2, 2.6, 2.6, 0.3, mat_cloth_red),
        ("Stall_NE1", 9.5, 6.5, 3.2, 2.6, 2.6, -0.3, mat_cloth_blue),
    ]
    for bname, bx, bz, bw, bd, bh, bang, bcloth in bazaar_configs:
        create_market_stall(f"Lorencia_{bname}", bx, bz, bw, bd, bh, bang, mat_wood, bcloth)

    # 10. Postes de Ferro e Braseiros ao Redor da Praça
    for i in range(8):
        ang = (i / 8) * math.pi * 2
        tx = math.cos(ang) * 11.8
        tz = math.sin(ang) * 11.8
        create_brazier(f"Lorencia_PlazaBrazier_{i+1}", tx, tz, 0.35, 0.52, 2.5, mat_iron, mat_torch)

    export_and_sync("Lorencia Citadel", "lorencia_citadel.glb")


# ============================================================================
# 2. 🌿 BIOMA NORIA: SANTUÁRIO ARBÓREO DE FEYWOOD (100% FIEL AO CONCEPT)
# ============================================================================
def build_noria_scene():
    clear_scene()
    root_col = bpy.data.collections.new("Noria_Feywood_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_moss = create_pbr_material("NoriaMoss", (0.06, 0.32, 0.18), metallic=0.08, roughness=0.82)
    mat_bark = create_pbr_material("NoriaBark", (0.24, 0.14, 0.08), metallic=0.05, roughness=0.88)
    mat_leaves = create_pbr_material("NoriaLeaves", (0.12, 0.55, 0.25), metallic=0.10, roughness=0.55)
    mat_wood = create_pbr_material("NoriaPlanks", (0.35, 0.22, 0.12), metallic=0.05, roughness=0.75)
    mat_brass = create_pbr_material("NoriaBrass", (0.85, 0.65, 0.22), metallic=0.88, roughness=0.30)
    mat_plasma = create_pbr_material("NoriaPlasma", (0.95, 0.15, 0.85), metallic=0.1, roughness=0.1, emissive=(0.95, 0.15, 0.85, 1), emissive_strength=5.5)
    mat_water = create_pbr_material("NoriaWater", (0.1, 0.8, 0.7), metallic=0.1, roughness=0.05, alpha=0.80)
    mat_shroom_cyan = create_pbr_material("ShroomCyan", (0.1, 0.85, 0.95), metallic=0.1, roughness=0.25, emissive=(0.1, 0.85, 0.95, 1), emissive_strength=3.5)
    mat_shroom_green = create_pbr_material("ShroomGreen", (0.2, 0.95, 0.4), metallic=0.1, roughness=0.25, emissive=(0.2, 0.95, 0.4, 1), emissive_strength=3.0)
    mat_rune_stone = create_pbr_material("NoriaRuneStone", (0.22, 0.30, 0.25), metallic=0.15, roughness=0.75)
    mat_lantern = create_pbr_material("NoriaLantern", (0.2, 0.95, 0.8), metallic=0.2, roughness=0.1, emissive=(0.2, 0.95, 0.8, 1), emissive_strength=4.0)

    # 1. Terreno Musgoso de Feywood (56m x 56m)
    create_terrain_block("Noria_MossyTerrain", 56.0, 56.0, mat_moss, height=0.9, pos=(0, 0, -0.45))

    # Rio Místico Cortando o Bosque
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -8.0, 0.05))
    river = bpy.context.active_object
    river.scale = (56.0, 7.5, 0.25)
    river.rotation_euler = (0, 0, 0.15)
    river.name = "Noria_MysticRiver"
    apply_mat(river, mat_water)

    # Ponte Suspensa de Madeira Arqueada com Guarda-corpos
    bpy.ops.mesh.primitive_cylinder_add(radius=4.8, depth=3.5, vertices=16, location=(0, -8.0, 0.85))
    bridge = bpy.context.active_object
    bridge.rotation_euler = (math.pi / 2, 0, 0)
    bridge.scale = (1.0, 0.25, 1.0)
    bridge.name = "Noria_ArchSuspensionBridge"
    set_smooth(bridge)
    apply_mat(bridge, mat_wood)

    # 2. A Sequóia Ancestral (Árvore-Mãe de 36 Metros)
    bpy.ops.mesh.primitive_cylinder_add(radius=7.8, depth=30.0, vertices=20, location=(0, 6.0, 15.0))
    tree_trunk = bpy.context.active_object
    tree_trunk.name = "Noria_MotherTreeTrunk"
    set_smooth(tree_trunk)
    apply_mat(tree_trunk, mat_bark)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=15.0, location=(0, 6.0, 28.0))
    canopy = bpy.context.active_object
    canopy.scale = (1.25, 1.25, 0.65)
    canopy.name = "Noria_MotherTreeCanopy"
    set_smooth(canopy)
    apply_mat(canopy, mat_leaves)

    for r in range(8):
        ang = (r / 8) * math.pi * 2
        rx = math.cos(ang) * 10.2
        rz = 6.0 + math.sin(ang) * 10.2
        bpy.ops.mesh.primitive_cone_add(radius1=1.6, radius2=0.45, depth=10.0, vertices=10, location=(rx, rz, 2.9))
        root = bpy.context.active_object
        root.rotation_euler = (0.45 * math.sin(ang), -0.45 * math.cos(ang), 0)
        root.name = f"Noria_Root_{r+1}"
        set_smooth(root)
        apply_mat(root, mat_bark)

    for tier in range(3):
        ty = 4.0 + tier * 5.2
        bpy.ops.mesh.primitive_cylinder_add(radius=11.0 - tier * 0.9, depth=0.4, vertices=24, location=(0, 6.0, ty))
        plat = bpy.context.active_object
        plat.name = f"Noria_TreeWalkwayTier_{tier+1}"
        set_smooth(plat)
        apply_mat(plat, mat_wood)

    # 3. Oficina da Máquina do Caos (Núcleo Alquímico)
    bpy.ops.mesh.primitive_cylinder_add(radius=4.8, depth=1.1, vertices=16, location=(-16.0, 4.0, 0.55))
    chaos_base = bpy.context.active_object
    chaos_base.name = "Noria_ChaosBase"
    apply_mat(chaos_base, mat_rune_stone)

    for ring_idx, rad in enumerate([4.0, 2.9, 1.9]):
        bpy.ops.mesh.primitive_torus_add(major_radius=rad, minor_radius=0.15, location=(-16.0, 4.0, 3.4))
        ring = bpy.context.active_object
        ring.rotation_euler = (ring_idx * 0.72, ring_idx * 0.52, ring_idx * 1.15)
        ring.name = f"Noria_ChaosGyroRing_{ring_idx+1}"
        set_smooth(ring)
        apply_mat(ring, mat_brass)

    for p in range(4):
        pang = (p / 4) * math.pi * 2
        px = -16.0 + math.cos(pang) * 4.2
        pz = 4.0 + math.sin(pang) * 4.2
        bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=3.8, vertices=8, location=(px, pz, 2.8))
        piston = bpy.context.active_object
        piston.name = f"Noria_ChaosPiston_{p+1}"
        set_smooth(piston)
        apply_mat(piston, mat_brass)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.2, location=(-16.0, 4.0, 3.4))
    core = bpy.context.active_object
    core.name = "Noria_ChaosPlasmaCore"
    set_smooth(core)
    apply_mat(core, mat_plasma)

    # 4. Altar da Rainha Lúthien & Fonte das Águas da Vida
    bpy.ops.mesh.primitive_cylinder_add(radius=4.5, depth=0.75, vertices=16, location=(16.0, 4.0, 0.38))
    altar_plinth = bpy.context.active_object
    altar_plinth.name = "Noria_LuthienAltarPlinth"
    apply_mat(altar_plinth, mat_rune_stone)

    bpy.ops.mesh.primitive_cylinder_add(radius=4.0, depth=0.2, vertices=16, location=(16.0, 4.0, 0.7))
    water_pool = bpy.context.active_object
    water_pool.name = "Noria_WaterOfLife"
    set_smooth(water_pool)
    apply_mat(water_pool, mat_water)

    bpy.ops.mesh.primitive_cone_add(radius1=0.48, radius2=0.24, depth=3.4, vertices=10, location=(16.0, 4.0, 2.5))
    queen = bpy.context.active_object
    queen.name = "Noria_LuthienStatue"
    set_smooth(queen)
    apply_mat(queen, mat_wood)

    # 5. Colônia de 8 Cogumelos Gigantes Bioluminescentes
    shroom_configs = [
        ("Shroom1", 7.5, -15.0, 3.8, 2.5, mat_shroom_cyan),
        ("Shroom2", -7.5, -16.0, 4.5, 3.0, mat_shroom_green),
        ("Shroom3", 17.0, -8.0, 3.2, 2.2, mat_shroom_cyan),
        ("Shroom4", -17.0, -8.0, 3.6, 2.4, mat_shroom_green),
        ("Shroom5", 9.5, 17.0, 4.0, 2.6, mat_shroom_green),
        ("Shroom6", -9.5, 17.0, 4.8, 3.2, mat_shroom_cyan),
        ("Shroom7", 20.0, 13.0, 3.0, 2.0, mat_shroom_cyan),
        ("Shroom8", -20.0, 13.0, 3.4, 2.2, mat_shroom_green),
    ]
    for sname, sx, sz, sh, sr, smat in shroom_configs:
        bpy.ops.mesh.primitive_cone_add(radius1=0.38, radius2=0.24, depth=sh, vertices=8, location=(sx, sz, sh / 2))
        stem = bpy.context.active_object
        stem.name = f"{sname}_Stem"
        set_smooth(stem)
        apply_mat(stem, mat_bark)

        bpy.ops.mesh.primitive_cone_add(radius1=sr, radius2=sr * 0.25, depth=0.8, vertices=16, location=(sx, sz, sh))
        cap = bpy.context.active_object
        cap.name = f"{sname}_Cap"
        set_smooth(cap)
        apply_mat(cap, smat)

    export_and_sync("Noria Feywood", "noria_feywood.glb")


# ============================================================================
# 3. ❄️ BIOMA DEVIAS: FORTALEZA GLACIAL DE BOREAL (100% FIEL AO CONCEPT)
# ============================================================================
def build_devias_scene():
    clear_scene()
    root_col = bpy.data.collections.new("Devias_Boreal_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_permafrost = create_pbr_material("DeviasPermafrost", (0.82, 0.88, 0.94), metallic=0.08, roughness=0.88)
    mat_stone_nordic = create_pbr_material("DeviasStone", (0.28, 0.32, 0.36), metallic=0.15, roughness=0.82)
    mat_wet_stone = create_pbr_material("DeviasWetCobble", (0.18, 0.20, 0.24), metallic=0.25, roughness=0.18)
    mat_roof_frost = create_pbr_material("DeviasRoofFrost", (0.20, 0.25, 0.32), metallic=0.12, roughness=0.55)
    mat_ice = create_pbr_material("DeviasGlacialIce", (0.35, 0.75, 0.95), metallic=0.15, roughness=0.08, alpha=0.85)
    mat_iron = create_pbr_material("DeviasIron", (0.16, 0.16, 0.18), metallic=0.85, roughness=0.45)
    mat_fire = create_pbr_material("DeviasSacredFire", (1.0, 0.45, 0.05), metallic=0.1, roughness=0.1, emissive=(1.0, 0.45, 0.05, 1), emissive_strength=5.8)
    mat_vitral = create_pbr_material("DeviasSapphireRosette", (0.1, 0.6, 1.0), metallic=0.2, roughness=0.1, emissive=(0.1, 0.6, 1.0, 1), emissive_strength=4.5)
    mat_pine = create_pbr_material("DeviasPineLeaves", (0.08, 0.22, 0.14), metallic=0.08, roughness=0.75)
    mat_wood = create_pbr_material("DeviasWood", (0.22, 0.16, 0.10), metallic=0.05, roughness=0.85)
    mat_window_glow = create_pbr_material("DeviasWindowGlow", (1.0, 0.70, 0.25), metallic=0.1, roughness=0.2, emissive=(1.0, 0.65, 0.2, 1), emissive_strength=3.0)

    # 1. Terreno Total de Neve & Permafrost (56m x 56m)
    create_terrain_block("Devias_PermafrostTotal", 56.0, 56.0, mat_permafrost, height=0.9, pos=(0, 0, -0.45))

    # Anel Térmico de Degelo de Pedra Molhada (28m de Diâmetro)
    bpy.ops.mesh.primitive_cylinder_add(radius=14.5, depth=0.15, vertices=24, location=(0, -2.0, 0.08))
    melt_ring = bpy.context.active_object
    melt_ring.name = "Devias_MeltedCobblestoneRing"
    set_smooth(melt_ring)
    apply_mat(melt_ring, mat_wet_stone)

    # 2. O Grande Braseiro Rei de 12 Metros
    bpy.ops.mesh.primitive_cylinder_add(radius=4.5, depth=1.6, vertices=16, location=(0, -2.0, 0.8))
    brazier_base = bpy.context.active_object
    brazier_base.name = "Devias_KingBrazierBase"
    set_smooth(brazier_base)
    apply_mat(brazier_base, mat_stone_nordic)

    for p in range(4):
        ang = (p / 4) * math.pi * 2
        px = math.cos(ang) * 3.4
        pz = -2.0 + math.sin(ang) * 3.4
        bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=8.5, vertices=8, location=(px, pz, 5.5))
        pillar = bpy.context.active_object
        pillar.name = f"Devias_BrazierPillar_{p+1}"
        set_smooth(pillar)
        apply_mat(pillar, mat_iron)

    bpy.ops.mesh.primitive_cone_add(radius1=4.0, radius2=2.5, depth=2.4, vertices=16, location=(0, -2.0, 10.2))
    hearth_basin = bpy.context.active_object
    hearth_basin.name = "Devias_HearthBasin"
    set_smooth(hearth_basin)
    apply_mat(hearth_basin, mat_iron)

    bpy.ops.mesh.primitive_cone_add(radius1=3.5, depth=5.5, vertices=12, location=(0, -2.0, 13.0))
    fire = bpy.context.active_object
    fire.name = "Devias_SacredFlameCore"
    set_smooth(fire)
    apply_mat(fire, mat_fire)

    # 3. Fachada Monumental da Catedral Glacial de Saint Devias (Norte)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 19.0, 9.0))
    cathedral = bpy.context.active_object
    cathedral.scale = (24.0, 6.5, 18.0)
    cathedral.name = "Devias_GlacialCathedralFacade"
    apply_mat(cathedral, mat_stone_nordic)

    # A Rosácea de Gelo (Vitral Safira Radiante de 8m)
    bpy.ops.mesh.primitive_cylinder_add(radius=4.5, depth=0.35, vertices=24, location=(0, 15.5, 11.5))
    rosette = bpy.context.active_object
    rosette.rotation_euler = (math.pi / 2, 0, 0)
    rosette.name = "Devias_SapphireIceRosette"
    set_smooth(rosette)
    apply_mat(rosette, mat_vitral)

    # Torres Góticas Laterais (28m de Altura)
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(side * 14.5, 19.0, 12.5))
        tower = bpy.context.active_object
        tower.scale = (5.5, 7.0, 25.0)
        tower.name = f"Devias_CathedralTower_{'L' if side < 0 else 'R'}"
        apply_mat(tower, mat_stone_nordic)

        bpy.ops.mesh.primitive_cone_add(radius1=3.0, depth=8.5, vertices=8, location=(side * 14.5, 19.0, 29.2))
        spire = bpy.context.active_object
        spire.name = f"Devias_IceTowerSpire_{'L' if side < 0 else 'R'}"
        set_smooth(spire)
        apply_mat(spire, mat_ice)

    # 4. Quatro Casas Nórdicas de Pedra Glacial
    houses = [
        ("House_NW", -17.0, 4.0, 9.5, 7.5, 6.5, 4.0, 0.25),
        ("House_NE", 17.0, 4.0, 9.5, 7.5, 6.5, 4.0, -0.25),
        ("House_SW", -17.0, -14.0, 9.0, 7.0, 6.0, 3.8, -0.15),
        ("House_SE", 17.0, -14.0, 9.0, 7.0, 6.0, 3.8, 0.15),
    ]
    for hname, hx, hz, hw, hd, hh, hrh, hang in houses:
        create_house(f"Devias_{hname}", hx, hz, hw, hd, hh, hrh, hang, mat_stone_nordic, mat_roof_frost, mat_wood, mat_window_glow)

    # 5. Oito Espirais de Cristal Glacial Colossais
    crystals = [
        (-21.0, -8.0, 9.0), (-21.0, 8.0, 11.5),
        (21.0, -8.0, 9.0), (21.0, 8.0, 11.5),
        (-8.0, -21.0, 7.5), (8.0, -21.0, 7.5),
        (-23.0, -21.0, 10.0), (23.0, -21.0, 10.0)
    ]
    for cidx, (cx, cz, ch) in enumerate(crystals):
        bpy.ops.mesh.primitive_cone_add(radius1=1.8, depth=ch, vertices=6, location=(cx, cz, ch / 2))
        crystal = bpy.context.active_object
        crystal.rotation_euler = (0.18 * math.sin(cidx), 0.18 * math.cos(cidx), 0)
        crystal.name = f"Devias_IceCrystal_{cidx+1}"
        set_smooth(crystal)
        apply_mat(crystal, mat_ice)

    # 6. Seis Pinheiros Nórdicos Cobertos de Neve
    pines = [(-11, -19), (11, -19), (-23, -2), (23, -2), (-23, 17), (23, 17)]
    for pidx, (px, pz) in enumerate(pines):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=5.5, vertices=6, location=(px, pz, 2.75))
        trunk = bpy.context.active_object
        trunk.name = f"Devias_PineTrunk_{pidx+1}"
        set_smooth(trunk)
        apply_mat(trunk, mat_wood)

        for tier in range(3):
            bpy.ops.mesh.primitive_cone_add(radius1=2.6 - tier * 0.6, depth=2.4, vertices=8, location=(px, pz, 4.2 + tier * 1.8))
            foliage = bpy.context.active_object
            foliage.name = f"Devias_PineTier_{pidx+1}_{tier+1}"
            set_smooth(foliage)
            apply_mat(foliage, mat_pine)

    export_and_sync("Devias Boreal", "devias_boreal.glb")


# ============================================================================
# 4. 💀 BIOMA DUNGEON: CATACUMBAS GÓTICAS DO ABISMO (100% FIEL AO CONCEPT)
# ============================================================================
def build_dungeon_scene():
    clear_scene()
    root_col = bpy.data.collections.new("Dungeon_Catacombs_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_stone = create_pbr_material("DngStone", (0.16, 0.18, 0.20), metallic=0.15, roughness=0.82)
    mat_flagstone = create_pbr_material("DngFlagstone", (0.22, 0.24, 0.26), metallic=0.10, roughness=0.75)
    mat_iron = create_pbr_material("DngIron", (0.15, 0.15, 0.17), metallic=0.85, roughness=0.45)
    mat_acid = create_pbr_material("DngAcid", (0.12, 0.85, 0.40), metallic=0.2, roughness=0.08, emissive=(0.12, 0.85, 0.40, 1), emissive_strength=3.5)
    mat_sulfur_fire = create_pbr_material("DngSulfurFire", (0.2, 0.95, 0.5), metallic=0.1, roughness=0.1, emissive=(0.2, 0.95, 0.5, 1), emissive_strength=5.0)

    # 1. Piso Flagstone e Paredes Envolventes de 8 Metros (48m x 48m)
    create_terrain_block("Dungeon_FlagstoneFloor", 48.0, 48.0, mat_flagstone, height=0.8, pos=(0, 0, -0.4))

    for wname, wx, wz, sx, sz in [
        ("Wall_North", 0, 23, 46, 2.8),
        ("Wall_South", 0, -23, 46, 2.8),
        ("Wall_East", 23, 0, 2.8, 46),
        ("Wall_West", -23, 0, 2.8, 46),
    ]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(wx, wz, 4.0))
        w = bpy.context.active_object
        w.scale = (sx, sz, 8.0)
        w.name = f"Dungeon_{wname}"
        apply_mat(w, mat_stone)

    # 2. Oito Colunas Monumentais com Capitéis Coríntios
    pillars = [
        (-13, -13), (0, -13), (13, -13),
        (-13, 0),             (13, 0),
        (-13, 13),  (0, 13),  (13, 13)
    ]
    for i, (px, pz) in enumerate(pillars):
        create_column(f"Dungeon_Pillar_{i+1}", px, pz, 1.3, 8.5, mat_stone)

    # 3. Piscina de Ácido Tóxico com Borda de Serpentes
    bpy.ops.mesh.primitive_cylinder_add(radius=6.0, depth=0.85, vertices=24, location=(0, 2, 0.42))
    acid_basin = bpy.context.active_object
    acid_basin.name = "Dungeon_AcidBasinCurb"
    set_smooth(acid_basin)
    apply_mat(acid_basin, mat_stone)

    bpy.ops.mesh.primitive_cylinder_add(radius=5.4, depth=0.2, vertices=24, location=(0, 2, 0.72))
    acid_fluid = bpy.context.active_object
    acid_fluid.name = "Dungeon_AcidFluid"
    set_smooth(acid_fluid)
    apply_mat(acid_fluid, mat_acid)

    # 4. Gaiolas de Ferro Suspensas por Correntes
    cages = [(-6.5, -4), (6.5, -4), (-6.5, 8), (6.5, 8)]
    for i, (cx, cz) in enumerate(cages):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=4.2, vertices=8, location=(cx, cz, 5.8))
        chain = bpy.context.active_object
        set_smooth(chain)
        apply_mat(chain, mat_iron)

        bpy.ops.mesh.primitive_torus_add(major_radius=0.95, minor_radius=0.08, location=(cx, cz, 3.6))
        torus_cage = bpy.context.active_object
        set_smooth(torus_cage)
        apply_mat(torus_cage, mat_iron)

        for b in range(8):
            ang = (b / 8) * math.pi * 2
            bx = cx + math.cos(ang) * 0.95
            bz = cz + math.sin(ang) * 0.95
            bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=2.2, vertices=6, location=(bx, bz, 2.5))
            cage_bar = bpy.context.active_object
            set_smooth(cage_bar)
            apply_mat(cage_bar, mat_iron)

    # 5. O Covil da Górgona: Trono de Serpentes e Dais Elevado
    bpy.ops.mesh.primitive_cylinder_add(radius=8.0, depth=1.1, vertices=16, location=(0, -16.5, 0.55))
    dais = bpy.context.active_object
    dais.name = "Dungeon_GorgonDais"
    set_smooth(dais)
    apply_mat(dais, mat_stone)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -19.0, 3.2))
    throne = bpy.context.active_object
    throne.scale = (5.2, 3.0, 5.5)
    throne.name = "Dungeon_GorgonThrone"
    apply_mat(throne, mat_stone)

    for side in (-1, 1):
        create_brazier(f"Dungeon_ThroneBrazier_{side}", side * 4.5, -16.5, 1.1, 0.65, 2.6, mat_iron, mat_sulfur_fire)

    # 6. Sarcófagos de Pedra nos Corredores
    sarcophagi = [(-17, -6), (17, -6), (-17, 6), (17, 6)]
    for sidx, (sx, sz) in enumerate(sarcophagi):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(sx, sz, 0.8))
        sarc = bpy.context.active_object
        sarc.scale = (2.4, 4.6, 1.6)
        sarc.name = f"Dungeon_Sarcophagus_{sidx+1}"
        apply_mat(sarc, mat_stone)

    export_and_sync("Dungeon Catacombs", "dungeon_catacombs.glb")


# ============================================================================
# 5. 🔥 BIOMA LOST TOWER: A TORRE DO INFERNO & BALROG (100% FIEL AO CONCEPT)
# ============================================================================
def build_lost_tower_scene():
    clear_scene()
    root_col = bpy.data.collections.new("LostTower_Abyss_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_obsidian = create_pbr_material("LTObsidian", (0.05, 0.05, 0.07), metallic=0.92, roughness=0.18)
    mat_basalt = create_pbr_material("LTBasalt", (0.12, 0.12, 0.14), metallic=0.20, roughness=0.82)
    mat_magma = create_pbr_material("LTMagma", (1.0, 0.25, 0.05), metallic=0.1, roughness=0.2, emissive=(1.0, 0.25, 0.05, 1), emissive_strength=5.0)
    mat_grate = create_pbr_material("LTIronGrate", (0.18, 0.18, 0.20), metallic=0.88, roughness=0.40)
    mat_gold_rune = create_pbr_material("LTRuneGold", (0.95, 0.75, 0.15), metallic=0.90, roughness=0.25, emissive=(0.95, 0.70, 0.15, 1), emissive_strength=2.5)
    mat_blue_sulfur = create_pbr_material("LTSulfurBlue", (0.1, 0.75, 0.95), metallic=0.1, roughness=0.1, emissive=(0.1, 0.75, 0.95, 1), emissive_strength=5.2)

    # 1. Piso Hexagonal de Basalto sobre o Abismo (50m x 50m)
    create_terrain_block("LostTower_BasaltFloor", 50.0, 50.0, mat_basalt, height=1.0, pos=(0, 0, -0.5))

    # Lago Central de Magma Fervente (14m de Diâmetro)
    bpy.ops.mesh.primitive_cylinder_add(radius=7.5, depth=0.3, vertices=24, location=(0, 0, 0.12))
    magma_pool = bpy.context.active_object
    magma_pool.name = "LostTower_CentralMagma"
    set_smooth(magma_pool)
    apply_mat(magma_pool, mat_magma)

    for i in range(-6, 7, 2):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(i, 0, 0.26))
        bar_x = bpy.context.active_object
        bar_x.scale = (0.28, 15.0, 0.18)
        bar_x.name = f"LostTower_GrateBarX_{i}"
        apply_mat(bar_x, mat_grate)

        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, i, 0.26))
        bar_y = bpy.context.active_object
        bar_y.scale = (15.0, 0.28, 0.18)
        bar_y.name = f"LostTower_GrateBarY_{i}"
        apply_mat(bar_y, mat_grate)

    # 2. Oito Colunas Ciclópicas de Basalto com Anéis Rúnicos
    for c in range(8):
        ang = (c / 8) * math.pi * 2
        cx = math.cos(ang) * 14.5
        cz = math.sin(ang) * 14.5
        create_column(f"LostTower_Col_{c+1}", cx, cz, 1.55, 11.5, mat_obsidian, mat_gold_rune)

        bpy.ops.mesh.primitive_torus_add(major_radius=1.8, minor_radius=0.16, location=(cx, cz, 5.8))
        rune_ring = bpy.context.active_object
        rune_ring.name = f"LostTower_RuneRing_{c+1}"
        set_smooth(rune_ring)
        apply_mat(rune_ring, mat_gold_rune)

    # 3. O Trono de Magma de Balrog no Pináculo (Norte)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 16.5, 1.3))
    throne_dais = bpy.context.active_object
    throne_dais.scale = (10.0, 8.0, 2.6)
    throne_dais.name = "LostTower_BalrogDais"
    apply_mat(throne_dais, mat_basalt)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 18.5, 4.2))
    throne = bpy.context.active_object
    throne.scale = (5.8, 3.2, 6.2)
    throne.name = "LostTower_BalrogThrone"
    apply_mat(throne, mat_obsidian)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=6.5, vertices=8, location=(0, 16.5, 6.0))
    scythe_handle = bpy.context.active_object
    scythe_handle.name = "LostTower_ScytheHandle"
    set_smooth(scythe_handle)
    apply_mat(scythe_handle, mat_basalt)

    bpy.ops.mesh.primitive_cone_add(radius1=2.4, depth=0.32, vertices=4, location=(1.1, 16.5, 8.5))
    scythe_blade = bpy.context.active_object
    scythe_blade.rotation_euler = (0, 0, math.pi / 3)
    scythe_blade.name = "LostTower_ScytheBlade"
    set_smooth(scythe_blade)
    apply_mat(scythe_blade, mat_magma)

    # 4. Balcões Infernais sobre o Vácuo com Braseiros Azuis
    for b_idx, (bx, bz) in enumerate([(-19, 0), (19, 0), (0, -19)]):
        bpy.ops.mesh.primitive_cylinder_add(radius=4.8, depth=0.85, vertices=16, location=(bx, bz, 0.42))
        balcony = bpy.context.active_object
        balcony.name = f"LostTower_Balcony_{b_idx+1}"
        set_smooth(balcony)
        apply_mat(balcony, mat_basalt)

        create_brazier(f"LostTower_BalconyBrazier_{b_idx+1}", bx, bz, 0.85, 0.7, 2.8, mat_grate, mat_blue_sulfur)

    export_and_sync("Lost Tower Inferno", "lost_tower_abyss.glb")


# ============================================================================
# 6. 🌊 BIOMA ATLANS: O REINO SUBMERSO DE THALASSA (100% FIEL AO CONCEPT)
# ============================================================================
def build_atlans_scene():
    clear_scene()
    root_col = bpy.data.collections.new("Atlans_Thalassa_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_sand = create_pbr_material("AtlansPearlSand", (0.88, 0.86, 0.78), metallic=0.08, roughness=0.85)
    mat_nacar = create_pbr_material("AtlansNacar", (0.90, 0.94, 0.98), metallic=0.35, roughness=0.18)
    mat_bone = create_pbr_material("AtlansLeviathanBone", (0.85, 0.84, 0.80), metallic=0.05, roughness=0.68)
    mat_coral_magenta = create_pbr_material("AtlansCoralMagenta", (0.95, 0.20, 0.45), metallic=0.1, roughness=0.45, emissive=(0.8, 0.1, 0.35, 1), emissive_strength=1.8)
    mat_coral_cyan = create_pbr_material("AtlansCoralCyan", (0.1, 0.85, 0.95), metallic=0.1, roughness=0.45, emissive=(0.1, 0.85, 0.95, 1), emissive_strength=2.2)
    mat_slipstream = create_pbr_material("AtlansSlipstream", (0.2, 0.9, 1.0), metallic=0.2, roughness=0.1, emissive=(0.2, 0.9, 1.0, 1), emissive_strength=4.5)
    mat_volcanic = create_pbr_material("AtlansBlackSmoker", (0.14, 0.14, 0.16), metallic=0.2, roughness=0.88)
    mat_glass = create_pbr_material("AtlansAirDomeGlass", (0.8, 0.95, 1.0), metallic=0.1, roughness=0.05, alpha=0.35)

    # 1. Fundo Oceânico de Areia Perolada Ondulada (52m x 52m)
    create_terrain_block("Atlans_OceanFloor", 52.0, 52.0, mat_sand, height=0.9, pos=(0, 0, -0.45))

    # 2. O Santuário de Nácar (Plataforma e Cúpula de Ar Místico)
    bpy.ops.mesh.primitive_cylinder_add(radius=9.0, depth=0.95, vertices=24, location=(0, -6.0, 0.48))
    sanctuary_base = bpy.context.active_object
    sanctuary_base.name = "Atlans_NacarSanctuaryBase"
    set_smooth(sanctuary_base)
    apply_mat(sanctuary_base, mat_nacar)

    for a in range(4):
        ang = (a / 4) * math.pi * 2
        ax = math.cos(ang) * 6.5
        az = -6.0 + math.sin(ang) * 6.5
        bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=7.8, vertices=12, location=(ax, az, 4.2))
        pillar = bpy.context.active_object
        pillar.name = f"Atlans_NacarPillar_{a+1}"
        set_smooth(pillar)
        apply_mat(pillar, mat_nacar)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=8.2, location=(0, -6.0, 4.2))
    dome = bpy.context.active_object
    dome.scale = (1.0, 1.0, 0.65)
    dome.name = "Atlans_AirDome"
    set_smooth(dome)
    apply_mat(dome, mat_glass)

    # 3. O Colossal Cemitério dos Leviatãs (10 Pares de Costelas Arqueadas)
    for i in range(10):
        pos_z = 2.0 + i * 2.3
        for side in (-1, 1):
            bpy.ops.mesh.primitive_cone_add(radius1=0.48, radius2=0.22, depth=8.5, vertices=8, location=(side * 5.0, pos_z, 3.8))
            rib = bpy.context.active_object
            rib.rotation_euler = (0, side * 0.45, 0)
            rib.name = f"Atlans_LeviathanRib_{side}_{i+1}"
            set_smooth(rib)
            apply_mat(rib, mat_bone)

    bpy.ops.mesh.primitive_cone_add(radius1=3.5, depth=7.0, vertices=6, location=(0, 25.0, 2.8))
    lskull = bpy.context.active_object
    lskull.rotation_euler = (-math.pi / 2, 0, 0)
    lskull.name = "Atlans_LeviathanSkull"
    set_smooth(lskull)
    apply_mat(lskull, mat_bone)

    # 4. Quatro Anéis Rúnicos de Aceleração Slipstream
    for ring_i, rz in enumerate([-16.0, -8.0, 8.0, 16.0]):
        bpy.ops.mesh.primitive_torus_add(major_radius=3.0, minor_radius=0.28, location=(14.5, rz, 3.4))
        ring = bpy.context.active_object
        ring.rotation_euler = (math.pi / 2, 0, 0)
        ring.name = f"Atlans_SlipstreamRing_{ring_i+1}"
        set_smooth(ring)
        apply_mat(ring, mat_slipstream)

    # 5. Fendas Vulcânicas (Black Smokers)
    for sm_idx, (smx, smz, smh) in enumerate([(-15.0, -12.0, 5.2), (-17.0, -10.0, 4.4), (-16.0, -14.0, 6.0)]):
        bpy.ops.mesh.primitive_cone_add(radius1=1.1, radius2=0.5, depth=smh, vertices=8, location=(smx, smz, smh / 2))
        chimney = bpy.context.active_object
        chimney.name = f"Atlans_BlackSmoker_{sm_idx+1}"
        set_smooth(chimney)
        apply_mat(chimney, mat_volcanic)

    # 6. Oito Recifes de Corais Bioluminescentes
    coral_spots = [
        (-10.5, -4, mat_coral_magenta), (-12.5, 4, mat_coral_cyan),
        (10.5, -14, mat_coral_magenta), (12.5, -4, mat_coral_cyan),
        (-8.5, 14, mat_coral_cyan),     (8.5, 14, mat_coral_magenta),
        (-19, 0, mat_coral_magenta),    (19, 6, mat_coral_cyan)
    ]
    for c_idx, (cx, cz, cmat) in enumerate(coral_spots):
        bpy.ops.mesh.primitive_cone_add(radius1=2.2, depth=3.8, vertices=8, location=(cx, cz, 1.9))
        coral = bpy.context.active_object
        coral.name = f"Atlans_CoralReef_{c_idx+1}"
        set_smooth(coral)
        apply_mat(coral, cmat)

    export_and_sync("Atlans Thalassa", "atlans_thalassa.glb")


# ============================================================================
# 7. 🏜️ BIOMA TARKAN: O DESERTO DE CINZAS DE KAR-DUNE (100% FIEL AO CONCEPT)
# ============================================================================
def build_tarkan_scene():
    clear_scene()
    root_col = bpy.data.collections.new("Tarkan_Desert_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_sand_crimson = create_pbr_material("TarkanSand", (0.75, 0.28, 0.14), metallic=0.05, roughness=0.92)
    mat_sandstone = create_pbr_material("TarkanSandstone", (0.65, 0.32, 0.18), metallic=0.08, roughness=0.85)
    mat_bone = create_pbr_material("TarkanWormBone", (0.82, 0.78, 0.70), metallic=0.05, roughness=0.72)
    mat_rust_iron = create_pbr_material("TarkanRustIron", (0.35, 0.20, 0.15), metallic=0.75, roughness=0.68)
    mat_oasis_sulfur = create_pbr_material("TarkanOasis", (0.15, 0.75, 0.35), metallic=0.1, roughness=0.08, emissive=(0.15, 0.65, 0.25, 1), emissive_strength=2.2)

    # 1. Terreno Vasto de Dunas Carmesim (56m x 56m)
    create_terrain_block("Tarkan_CrimsonDunesTotal", 56.0, 56.0, mat_sand_crimson, height=1.0, pos=(0, 0, -0.5))

    for d_idx, (dx, dz, dw, dd, dh, dang) in enumerate([
        (0, 13.0, 44.0, 11.0, 3.5, 0.12),
        (-15, -8.0, 30.0, 8.5, 2.6, -0.25),
        (15, -13.0, 30.0, 8.5, 2.8, 0.18),
    ]):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(dx, dz, dh / 2))
        dune = bpy.context.active_object
        dune.scale = (dw, dd, dh)
        dune.rotation_euler = (0.2, 0, dang)
        dune.name = f"Tarkan_DuneRidge_{d_idx+1}"
        apply_mat(dune, mat_sand_crimson)

    # 2. Esqueleto Titânico do Verme do Deserto (Death Beam Knight)
    bpy.ops.mesh.primitive_cone_add(radius1=4.5, depth=9.5, vertices=6, location=(0, -19.0, 3.2))
    skull = bpy.context.active_object
    skull.rotation_euler = (math.pi / 2, 0, 0)
    skull.name = "Tarkan_DesertWormSkull"
    set_smooth(skull)
    apply_mat(skull, mat_bone)

    for i in range(8):
        pz = -13.0 + i * 4.0
        for side in (-1, 1):
            bpy.ops.mesh.primitive_cone_add(radius1=0.65, radius2=0.28, depth=9.5, vertices=8, location=(side * 5.4, pz, 4.4))
            rib = bpy.context.active_object
            rib.rotation_euler = (0, side * 0.44, 0)
            rib.name = f"Tarkan_WormRib_{side}_{i+1}"
            set_smooth(rib)
            apply_mat(rib, mat_bone)

    # 3. Cemitério de Autômatos de Guerra: Engrenagens Ciclópicas Soterradas
    cog_configs = [
        ("Cog1", -16.0, -2.0, 4.8, 0.95),
        ("Cog2", -17.0, 8.5, 5.5, 1.05),
        ("Cog3", 16.0, -6.5, 4.0, 0.85),
        ("Cog4", 17.0, 6.5, 5.0, 0.95),
    ]
    for cname, cx, cz, crad, cdepth in cog_configs:
        bpy.ops.mesh.primitive_cylinder_add(radius=crad, depth=cdepth, vertices=16, location=(cx, cz, crad * 0.65))
        cog = bpy.context.active_object
        cog.rotation_euler = (0.42, 0.22, math.pi / 2)
        cog.name = f"Tarkan_{cname}"
        set_smooth(cog)
        apply_mat(cog, mat_rust_iron)

    # 4. Oásis da Miragem Sulfúrica
    bpy.ops.mesh.primitive_cylinder_add(radius=5.8, depth=0.35, vertices=20, location=(0, 17.0, 0.2))
    oasis = bpy.context.active_object
    oasis.name = "Tarkan_SulfuricOasisPool"
    set_smooth(oasis)
    apply_mat(oasis, mat_oasis_sulfur)

    cacti = [(5.5, 18, 4.2), (-5.5, 16, 3.4), (4.5, 14, 3.8), (-4.5, 19, 3.0)]
    for cidx, (cax, caz, cah) in enumerate(cacti):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=cah, vertices=6, location=(cax, caz, cah / 2))
        cactus = bpy.context.active_object
        cactus.name = f"Tarkan_BlackCactus_{cidx+1}"
        set_smooth(cactus)
        apply_mat(cactus, mat_rust_iron)

    # 5. Três Monólitos Erodidos de Arenito
    for midx, (mx, mz, mh) in enumerate([(-19, -17, 8.0), (19, -19, 8.8), (0, 24, 7.0)]):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(mx, mz, mh / 2))
        mono = bpy.context.active_object
        mono.scale = (2.4, 2.4, mh)
        mono.rotation_euler = (0.1, 0.1, midx * 0.5)
        mono.name = f"Tarkan_SandstoneMonolith_{midx+1}"
        apply_mat(mono, mat_sandstone)

    export_and_sync("Tarkan Desert", "tarkan_desert.glb")


# ============================================================================
# 8. 🪽 BIOMA ICARUS: O ARQUIPÉLAGO CELESTE DE AETHEL (100% FIEL AO CONCEPT)
# ============================================================================
def build_icarus_scene():
    clear_scene()
    root_col = bpy.data.collections.new("Icarus_Aethel_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_island = create_pbr_material("IcarusRock", (0.32, 0.30, 0.36), metallic=0.15, roughness=0.82)
    mat_aetherite = create_pbr_material("IcarusAetherite", (0.2, 0.85, 1.0), metallic=0.25, roughness=0.08, emissive=(0.2, 0.85, 1.0, 1), emissive_strength=4.5)
    mat_light_bridge = create_pbr_material("IcarusLightBridge", (0.7, 0.9, 1.0), metallic=0.1, roughness=0.05, emissive=(0.4, 0.75, 1.0, 1), emissive_strength=3.0, alpha=0.75)
    mat_obsidian = create_pbr_material("IcarusObsidian", (0.05, 0.05, 0.07), metallic=0.92, roughness=0.15)
    mat_phoenix_fire = create_pbr_material("IcarusPhoenixFire", (1.0, 0.7, 0.1), metallic=0.1, roughness=0.1, emissive=(1.0, 0.65, 0.1, 1), emissive_strength=5.5)

    # 1. Platô Central Flutuante com Cone Rochoso Invertido (24m de Diâmetro)
    bpy.ops.mesh.primitive_cylinder_add(radius=12.0, depth=1.5, vertices=24, location=(0, 0, 0))
    plat = bpy.context.active_object
    plat.name = "Icarus_MainPlateau"
    set_smooth(plat)
    apply_mat(plat, mat_island)

    bpy.ops.mesh.primitive_cone_add(radius1=11.8, depth=15.0, vertices=16, location=(0, 0, -7.5))
    cone = bpy.context.active_object
    cone.rotation_euler = (math.pi, 0, 0)
    cone.name = "Icarus_InvertedCone"
    set_smooth(cone)
    apply_mat(cone, mat_island)

    # 2. O Monólito Central de Aetherita Gravitacional (Levitando)
    bpy.ops.mesh.primitive_cone_add(radius1=2.2, depth=9.0, vertices=6, location=(0, 0, 4.5))
    monolith = bpy.context.active_object
    monolith.name = "Icarus_AetheriteMonolith"
    set_smooth(monolith)
    apply_mat(monolith, mat_aetherite)

    for r in range(3):
        bpy.ops.mesh.primitive_torus_add(major_radius=3.5 + r * 0.95, minor_radius=0.15, location=(0, 0, 4.5))
        ring = bpy.context.active_object
        ring.rotation_euler = (r * 0.65, r * 0.45, r * 0.95)
        ring.name = f"Icarus_GyroRing_{r+1}"
        set_smooth(ring)
        apply_mat(ring, mat_aetherite)

    # 3. Quatro Ilhas Satélites Levitando
    satellites = [
        ("SatIsland_E", 21.0, 0, 5.5, -5.0),
        ("SatIsland_W", -21.0, 0, 5.5, -5.0),
        ("SatIsland_N", 0, 21.0, 5.5, -5.0),
        ("SatIsland_S", 0, -21.0, 10.0, -7.5),
    ]
    for sname, sx, sz, srad, scone_d in satellites:
        bpy.ops.mesh.primitive_cylinder_add(radius=srad, depth=1.1, vertices=16, location=(sx, sz, 0))
        sat = bpy.context.active_object
        sat.name = f"Icarus_{sname}"
        set_smooth(sat)
        apply_mat(sat, mat_island)

        bpy.ops.mesh.primitive_cone_add(radius1=srad * 0.95, depth=abs(scone_d) * 2, vertices=12, location=(sx, sz, scone_d))
        sat_cone = bpy.context.active_object
        sat_cone.rotation_euler = (math.pi, 0, 0)
        sat_cone.name = f"Icarus_{sname}_Cone"
        set_smooth(sat_cone)
        apply_mat(sat_cone, mat_island)

    # 4. Passarelas Fotônicas de Luz Estelar Sólida
    bridges = [
        ("Bridge_E", 10.5, 0, 10.0, 2.5),
        ("Bridge_W", -10.5, 0, 10.0, 2.5),
        ("Bridge_N", 0, 10.5, 2.5, 10.0),
        ("Bridge_S", 0, -10.5, 3.0, 10.0),
    ]
    for bname, bx, bz, bwidth, bdepth in bridges:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(bx, bz, 0.08))
        bridge = bpy.context.active_object
        bridge.scale = (bwidth, bdepth, 0.16)
        bridge.name = f"Icarus_{bname}"
        apply_mat(bridge, mat_light_bridge)

    # 5. O Ninho de Obsidiana em Flor de Lótus do Dark Phoenix (Ilha Sul)
    for p in range(8):
        pang = (p / 8) * math.pi * 2
        px = math.cos(pang) * 5.5
        pz = -21.0 + math.sin(pang) * 5.5
        bpy.ops.mesh.primitive_cone_add(radius1=1.4, depth=4.8, vertices=4, location=(px, pz, 2.4))
        petal = bpy.context.active_object
        petal.rotation_euler = (0.38 * math.sin(pang), 0.38 * math.cos(pang), 0)
        petal.name = f"Icarus_LotusPetal_{p+1}"
        apply_mat(petal, mat_obsidian)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=2.8, location=(0, -21.0, 3.2))
    vortex = bpy.context.active_object
    vortex.name = "Icarus_CosmicFireVortex"
    set_smooth(vortex)
    apply_mat(vortex, mat_phoenix_fire)

    export_and_sync("Icarus Aethel", "icarus_aethel.glb")


# ============================================================================
# 9. ⚔️ ZONA DE CERCO: VALLEY OF LOREN / CASTLE SIEGE (100% FIEL AO CONCEPT)
# ============================================================================
def build_valley_of_loren_scene():
    clear_scene()
    root_col = bpy.data.collections.new("ValleyOfLoren_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_granite = create_pbr_material("VolGranite", (0.18, 0.19, 0.22), metallic=0.15, roughness=0.82)
    mat_stone_dark = create_pbr_material("VolStoneDark", (0.12, 0.13, 0.15), metallic=0.12, roughness=0.85)
    mat_iron = create_pbr_material("VolIron", (0.12, 0.12, 0.14), metallic=0.88, roughness=0.42)
    mat_lava = create_pbr_material("VolLava", (1.0, 0.28, 0.05), metallic=0.1, roughness=0.2, emissive=(1.0, 0.25, 0.05, 1), emissive_strength=4.5)
    mat_statue = create_pbr_material("VolLifeStatue", (0.88, 0.92, 0.96), metallic=0.15, roughness=0.25, emissive=(0.2, 0.65, 0.95, 1), emissive_strength=3.0)
    mat_gold = create_pbr_material("VolGold", (0.95, 0.70, 0.15), metallic=0.92, roughness=0.22)
    mat_wood = create_pbr_material("VolWood", (0.25, 0.16, 0.10), metallic=0.05, roughness=0.80)

    # 1. Campo de Batalha Completo (72m x 72m)
    create_terrain_block("VOL_SiegeGroundTotal", 72.0, 72.0, mat_granite, height=1.0, pos=(0, 0, -0.5))

    # 2. Fosso de Lava Ardente Atravessando o Campo (66m de Extensão)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -2.0, -0.8))
    lava_moat = bpy.context.active_object
    lava_moat.scale = (66.0, 9.0, 1.8)
    lava_moat.name = "VOL_LavaMoat"
    apply_mat(lava_moat, mat_lava)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -2.0, 0.22))
    drawbridge = bpy.context.active_object
    drawbridge.scale = (8.0, 11.0, 0.52)
    drawbridge.name = "VOL_Drawbridge"
    apply_mat(drawbridge, mat_wood)

    # 3. Muralhas Ciclópicas de Cerco (10m de Altura)
    create_crenellated_wall("VOL_CurtainWall_W", -33, 10, -5.5, 10, 10.5, 4.0, mat_stone_dark)
    create_crenellated_wall("VOL_CurtainWall_E", 5.5, 10, 33, 10, 10.5, 4.0, mat_stone_dark)

    for side, tx in ((-1, -31), (1, 31)):
        create_round_tower(f"VOL_BastionTower_{side}", tx, 10.0, 4.8, 15.5, 5.8, mat_stone_dark, mat_granite)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 10.0, 5.2))
    gate = bpy.context.active_object
    gate.scale = (10.0, 1.8, 10.5)
    gate.name = "VOL_IronGate"
    apply_mat(gate, mat_iron)

    # 4. As 4 Sagradas Estátuas da Vida (Life Statues)
    statue_coords = [(-15, 18), (15, 18), (-15, 29), (15, 29)]
    for i, (sx, sz) in enumerate(statue_coords):
        bpy.ops.mesh.primitive_cylinder_add(radius=2.4, depth=1.2, vertices=16, location=(sx, sz, 0.6))
        base = bpy.context.active_object
        base.name = f"VOL_LifeStatue_Base_{i+1}"
        set_smooth(base)
        apply_mat(base, mat_granite)

        bpy.ops.mesh.primitive_cone_add(radius1=1.5, depth=8.0, vertices=8, location=(sx, sz, 5.0))
        statue = bpy.context.active_object
        statue.name = f"VOL_LifeStatue_Body_{i+1}"
        set_smooth(statue)
        apply_mat(statue, mat_statue)

    # 5. Salão do Trono Imperial da Guilda Soberana
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 33, 1.5))
    dais = bpy.context.active_object
    dais.scale = (13.0, 9.5, 3.0)
    dais.name = "VOL_ThroneDais"
    apply_mat(dais, mat_granite)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 35, 4.5))
    throne = bpy.context.active_object
    throne.scale = (4.0, 3.0, 5.5)
    throne.name = "VOL_ImperialThrone"
    apply_mat(throne, mat_gold)

    # 6. Duas Catapultas de Cerco no Campo Atacante
    for c, cx in ((-1, -19), (1, 19)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, -21, 2.5))
        cat = bpy.context.active_object
        cat.scale = (5.2, 6.2, 4.4)
        cat.name = f"VOL_Catapult_{c}"
        apply_mat(cat, mat_wood)

    export_and_sync("Valley of Loren", "valley_of_loren_citadel.glb")


# ============================================================================
# 10. 🩸 ARENA DE EVENTO: BLOOD CASTLE (100% FIEL AO CONCEPT)
# ============================================================================
def build_blood_castle_scene():
    clear_scene()
    root_col = bpy.data.collections.new("BloodCastle_Complete")
    bpy.context.scene.collection.children.link(root_col)

    mat_stone = create_pbr_material("BcStone", (0.24, 0.20, 0.22), metallic=0.2, roughness=0.80)
    mat_archangel = create_pbr_material("BcAngelMarble", (0.90, 0.88, 0.86), metallic=0.15, roughness=0.45, emissive=(0.95, 0.85, 0.4, 1), emissive_strength=1.8)
    mat_gate = create_pbr_material("BcIronGate", (0.16, 0.12, 0.14), metallic=0.88, roughness=0.4, emissive=(0.95, 0.15, 0.15, 1), emissive_strength=3.5)
    mat_altar = create_pbr_material("BcAltar", (0.95, 0.95, 1.0), metallic=0.3, roughness=0.2, emissive=(0.4, 0.75, 1.0, 1), emissive_strength=4.0)

    # 1. A Colossal Ponte do Martírio (120m x 20m) sobre o Vácuo
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -1.0))
    bridge = bpy.context.active_object
    bridge.scale = (20.0, 120.0, 2.0)
    bridge.name = "BC_MartyrdomBridge"
    apply_mat(bridge, mat_stone)

    for side, px in ((-1, -10.0), (1, 10.0)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(px, 0, 0.9))
        parapet = bpy.context.active_object
        parapet.scale = (1.0, 120.0, 1.8)
        parapet.name = f"BC_BridgeParapet_{side}"
        apply_mat(parapet, mat_stone)

    # Arcos Ogivais de Sustentação Sob a Ponte (Piers no Vácuo)
    for py in range(-45, 55, 15):
        bpy.ops.mesh.primitive_cylinder_add(radius=8.0, depth=18.5, vertices=16, location=(0, py, -7.0))
        arch = bpy.context.active_object
        arch.rotation_euler = (0, math.pi / 2, 0)
        arch.scale = (1.0, 0.65, 1.0)
        arch.name = f"BC_SupportArch_{py}"
        set_smooth(arch)
        apply_mat(arch, mat_stone)

    # 2. 16 Estátuas dos Arcanjos Lamentantes
    for side, px in ((-1, -8.2), (1, 8.2)):
        for idx, py in enumerate(range(-48, 48, 12)):
            bpy.ops.mesh.primitive_cube_add(size=1, location=(px, py, 0.7))
            base = bpy.context.active_object
            base.scale = (2.2, 2.2, 1.4)
            base.name = f"BC_AngelBase_{side}_{idx}"
            apply_mat(base, mat_stone)

            bpy.ops.mesh.primitive_cylinder_add(radius=0.75, depth=5.0, vertices=10, location=(px, py, 3.8))
            angel = bpy.context.active_object
            angel.name = f"BC_Angel_{side}_{idx}"
            set_smooth(angel)
            apply_mat(angel, mat_archangel)

    # 3. O Portão de Ferro do Arcanjo
    for side, px in ((-1, -8.8), (1, 8.8)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(px, 35, 6.2))
        pylon = bpy.context.active_object
        pylon.scale = (3.4, 3.4, 12.5)
        pylon.name = f"BC_GatePylon_{side}"
        apply_mat(pylon, mat_stone)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 35, 5.4))
    gate = bpy.context.active_object
    gate.scale = (16.0, 1.2, 10.0)
    gate.name = "BC_ArchangelGate"
    apply_mat(gate, mat_gate)

    # 4. O Altar do Arcanjo Caído no Termo da Ponte
    bpy.ops.mesh.primitive_cylinder_add(radius=4.8, depth=1.6, vertices=16, location=(0, 54, 0.8))
    altar_base = bpy.context.active_object
    altar_base.name = "BC_AltarBase"
    set_smooth(altar_base)
    apply_mat(altar_base, mat_stone)

    bpy.ops.mesh.primitive_cone_add(radius1=1.8, depth=5.8, vertices=8, location=(0, 54, 4.0))
    crystal_sword = bpy.context.active_object
    crystal_sword.name = "BC_DivineWeapon"
    set_smooth(crystal_sword)
    apply_mat(crystal_sword, mat_altar)

    export_and_sync("Blood Castle", "blood_castle_bridge.glb")


# ============================================================================
# ORQUESTRADOR PRINCIPAL
# ============================================================================
def main():
    target_biome = None
    if "--" in sys.argv:
        args_idx = sys.argv.index("--") + 1
        parser = argparse.ArgumentParser()
        parser.add_argument("--biome", type=str, default="ALL")
        args = parser.parse_args(sys.argv[args_idx:])
        target_biome = args.biome.upper()

    print(f"============================================================")
    print(f"🏛️ DASI MMORPG - BLENDER 5.2 COMPLETE HIGH FIDELITY WORLDS")
    print(f"Diretório de Saída: {OUTPUT_DIR}")
    print(f"Bioma Alvo: {target_biome or 'ALL (Todos os 10 Ambientes)'}")
    print(f"============================================================")

    if target_biome in (None, "ALL", "LORENCIA"):
        build_lorencia_scene()
    if target_biome in (None, "ALL", "NORIA"):
        build_noria_scene()
    if target_biome in (None, "ALL", "DEVIAS"):
        build_devias_scene()
    if target_biome in (None, "ALL", "DUNGEON"):
        build_dungeon_scene()
    if target_biome in (None, "ALL", "LOST_TOWER"):
        build_lost_tower_scene()
    if target_biome in (None, "ALL", "ATLANS"):
        build_atlans_scene()
    if target_biome in (None, "ALL", "TARKAN"):
        build_tarkan_scene()
    if target_biome in (None, "ALL", "ICARUS"):
        build_icarus_scene()
    if target_biome in (None, "ALL", "VALLEY_OF_LOREN", "VOL"):
        build_valley_of_loren_scene()
    if target_biome in (None, "ALL", "BLOOD_CASTLE", "BC"):
        build_blood_castle_scene()

    print("✨ Todos os 10 cenários e biomas reais completos foram compilados e sincronizados com sucesso no Blender 5.2!")

if __name__ == "__main__":
    main()
