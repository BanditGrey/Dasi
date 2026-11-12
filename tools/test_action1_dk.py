import sys
import os
import math
from pathlib import Path

WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
sys.path.append(str(WORKSPACE / 'conversions/converters/texture_decoder'))

import bpy
from mathutils import Vector, Matrix, Euler
from bmd_parser import BMDParser, transform_pos, map_file_decrypt, angle_quaternion, quat_matrix, concat_transforms

DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"
PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

# 1. Carrega player.bmd e extrai especificamente a AÇÃO 1 (PLAYER_STOP_MALE)
player_path = DATA_DIR / "Player/player.bmd"
with open(player_path, 'rb') as f:
    raw_data = f.read()

import struct
l_size = struct.unpack('<I', raw_data[4:8])[0]
data = map_file_decrypt(raw_data[8:8+l_size])

ptr = 32
num_meshs, num_bones, num_actions = struct.unpack('<HHH', data[ptr:ptr+6])
ptr += 6

actions_num_keys = []
for _ in range(num_actions):
    num_keys, lock_pos = struct.unpack('<h?', data[ptr:ptr+3])
    ptr += 3
    if lock_pos:
        ptr += num_keys * 12
    actions_num_keys.append(num_keys)

# Lê ossos para a ação desejada
TARGET_ACTION = 1 # PLAYER_STOP_MALE
TARGET_FRAME = 0  # Primeiro frame do idle ereto

bones = []
for i in range(num_bones):
    dummy = (data[ptr] != 0)
    ptr += 1
    if not dummy:
        b_name = data[ptr:ptr+32].decode('latin-1', errors='ignore').rstrip('\x00')
        ptr += 32
        parent = struct.unpack('<h', data[ptr:ptr+2])[0]
        ptr += 2
        
        target_pos = (0.0, 0.0, 0.0)
        target_rot = (0.0, 0.0, 0.0)
        for j in range(num_actions):
            keys = actions_num_keys[j]
            pos_list = [struct.unpack('<3f', data[ptr+k*12:ptr+(k+1)*12]) for k in range(keys)]
            ptr += keys * 12
            rot_list = [struct.unpack('<3f', data[ptr+k*12:ptr+(k+1)*12]) for k in range(keys)]
            ptr += keys * 12
            if j == TARGET_ACTION and keys > 0:
                frame_idx = min(TARGET_FRAME, keys - 1)
                target_pos = pos_list[frame_idx]
                target_rot = rot_list[frame_idx]
        bones.append({'dummy': False, 'name': b_name, 'parent': parent, 'pos': target_pos, 'rot': target_rot})
    else:
        bones.append({'dummy': True, 'name': '', 'parent': -1, 'pos': (0,0,0), 'rot': (0,0,0)})

# Calcula matrizes afins mundiais dos ossos
bone_matrices = [None] * len(bones)
for i, b in enumerate(bones):
    if b['dummy']:
        continue
    q = angle_quaternion(b['rot'])
    mat = quat_matrix(q, b['pos'])
    if b['parent'] == -1 or b['parent'] >= len(bone_matrices) or bone_matrices[b['parent']] is None:
        bone_matrices[i] = mat
    else:
        bone_matrices[i] = concat_transforms(bone_matrices[b['parent']], mat)

print(f"Matrizes calculadas para Ação {TARGET_ACTION} (PLAYER_STOP_MALE): {len(bone_matrices)} ossos")

# 2. Limpa cena do Blender
bpy.ops.wm.read_factory_settings(use_empty=True)

# Helper para decodificar textura
def get_material(tex_name, is_alpha=False):
    stem = Path(tex_name).stem.lower()
    mat_key = f"Mat_{stem}"
    if mat_key in bpy.data.materials:
        return bpy.data.materials[mat_key]
    mat = bpy.data.materials.new(name=mat_key)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    
    # Procura imagem correspondente
    tex_file = None
    search_dirs = [
        WORKSPACE / "src/client/dev_viewer/models/textures",
        WORKSPACE / "conversions/output/classes/dk",
        DATA_DIR / "Player",
        DATA_DIR / "Item"
    ]
    for d in search_dirs:
        for ext in ['.jpg', '.png', '.tga', '.OZJ', '.OZT']:
            cand = d / f"{stem}{ext}"
            if cand.exists():
                tex_file = cand
                break
        if tex_file:
            break
            
    if tex_file and tex_file.exists():
        try:
            img = bpy.data.images.load(str(tex_file))
            tex_node = mat.node_tree.nodes.new(type="ShaderNodeTexImage")
            tex_node.image = img
            mat.node_tree.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
            if is_alpha or tex_file.suffix.lower() == '.tga' or 'wing' in stem or 'ndw' in stem:
                if hasattr(mat, 'blend_method'):
                    mat.blend_method = 'BLEND'
                mat.node_tree.links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])
        except Exception as e:
            print("Erro ao carregar textura:", tex_file, e)
            
    if 'Roughness' in bsdf.inputs:
        bsdf.inputs['Roughness'].default_value = 0.35
    if 'Metallic' in bsdf.inputs:
        bsdf.inputs['Metallic'].default_value = 0.20
    return mat

def load_part(bmd_rel_path, obj_name):
    fpath = DATA_DIR / bmd_rel_path
    if not fpath.exists():
        print(f"Não encontrado: {bmd_rel_path}")
        return []
    parser = BMDParser(fpath)
    parser.parse(apply_bones=False)
    
    objs = []
    for idx, m in enumerate(parser.meshes):
        m_name = f"{obj_name}_{idx}"
        mesh_data = bpy.data.meshes.new(m_name)
        
        verts = []
        for node, pos in m['raw_verts']:
            mat = bone_matrices[node] if node < len(bone_matrices) else None
            if mat is not None:
                tp = transform_pos(pos, mat)
                verts.append(Vector((tp[0] * 0.01, tp[1] * 0.01, tp[2] * 0.01)))
            else:
                verts.append(Vector((pos[0] * 0.01, pos[1] * 0.01, pos[2] * 0.01)))
                
        faces = []
        face_uvs = []
        for tri in m['triangles']:
            poly = tri['poly']
            v = tri['v']
            t = tri['t']
            faces.append((v[0], v[1], v[2]))
            face_uvs.append((m['uvs'][t[0]], m['uvs'][t[1]], m['uvs'][t[2]]))
            if poly == 4:
                faces.append((v[0], v[2], v[3]))
                face_uvs.append((m['uvs'][t[0]], m['uvs'][t[2]], m['uvs'][t[3]]))
                
        mesh_data.from_pydata(verts, [], faces)
        mesh_data.update()
        
        uv_layer = mesh_data.uv_layers.new(name="UVMap")
        uv_data = uv_layer.data
        loop_idx = 0
        for f_uv in face_uvs:
            for uv in f_uv:
                uv_data[loop_idx].uv = uv
                loop_idx += 1
                
        obj = bpy.data.objects.new(m_name, mesh_data)
        bpy.context.collection.objects.link(obj)
        mat = get_material(m['texture_name'])
        obj.data.materials.append(mat)
        objs.append(obj)
    return objs

# 3. Carrega partes de armadura Dragon do Dark Knight
load_part("Player/HelmMale02.bmd", "Armor_Helm")
load_part("Player/ArmorMale02.bmd", "Armor_Chest")
load_part("Player/PantMale02.bmd", "Armor_Legs")
load_part("Player/GloveMale02.bmd", "Armor_Gloves")
load_part("Player/BootMale02.bmd", "Armor_Boots")

# Asas de Dragão (Wing06.bmd) - ligadas ao osso 47 da espinha
spine_mat = bone_matrices[47] if 47 < len(bone_matrices) else None
spine_pos = Vector((spine_mat[0][3] * 0.01, spine_mat[1][3] * 0.01, spine_mat[2][3] * 0.01)) if spine_mat else Vector((0, 0.09, 1.42))
print("Spine position for wings:", spine_pos)

wing_parser = BMDParser(DATA_DIR / "Item/Wing06.bmd")
wing_parser.parse(apply_bones=True)
for idx, m in enumerate(wing_parser.meshes):
    w_name = f"Wings_Dragon_{idx}"
    mesh_data = bpy.data.meshes.new(w_name)
    verts = [Vector((v[0] * 0.01, v[1] * 0.01, v[2] * 0.01)) + spine_pos for v in m['vertices']]
    faces = []
    face_uvs = []
    for tri in m['triangles']:
        poly = tri['poly']
        v = tri['v']
        t = tri['t']
        faces.append((v[0], v[1], v[2]))
        face_uvs.append((m['uvs'][t[0]], m['uvs'][t[1]], m['uvs'][t[2]]))
        if poly == 4:
            faces.append((v[0], v[2], v[3]))
            face_uvs.append((m['uvs'][t[0]], m['uvs'][t[2]], m['uvs'][t[3]]))
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    uv_layer = mesh_data.uv_layers.new(name="UVMap")
    uv_data = uv_layer.data
    loop_idx = 0
    for f_uv in face_uvs:
        for uv in f_uv:
            uv_data[loop_idx].uv = uv
            loop_idx += 1
    obj = bpy.data.objects.new(w_name, mesh_data)
    bpy.context.collection.objects.link(obj)
    mat = get_material(m['texture_name'], is_alpha=True)
    obj.data.materials.append(mat)

# 4. Configura Renderizador
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

# Centraliza câmera no personagem
cam_obj.location = (0.0, -2.8, 1.1)
cam_obj.rotation_euler = (math.radians(90), 0, 0)

out_render = "D:/Dasi/docs/art_previews/test_dk_action1.png"
scene.render.filepath = out_render
bpy.ops.render.render(write_still=True)
print("Renderizado com sucesso:", out_render)
