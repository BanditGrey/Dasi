#!/usr/bin/env python3
import sys
import os
import math
import struct
from pathlib import Path

WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
sys.path.append(str(WORKSPACE / 'conversions/converters/texture_decoder'))

import bpy
from mathutils import Vector, Matrix, Euler
from bmd_parser import BMDParser, transform_pos, map_file_decrypt, angle_quaternion, quat_matrix, concat_transforms
from texture_decoder import decode_ozj_to_jpg, decode_ozt_to_tga

DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"
TEX_OUT = WORKSPACE / "src/client/dev_viewer/models/textures"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"

with open(DATA_DIR / "Player/player.bmd", 'rb') as f:
    raw = f.read()
l_size = struct.unpack('<I', raw[4:8])[0]
data = map_file_decrypt(raw[8:8+l_size])
ptr = 32
num_meshs, num_bones, num_actions = struct.unpack('<HHH', data[ptr:ptr+6])
ptr += 6
actions_num_keys = []
for _ in range(num_actions):
    num_keys, lock_pos = struct.unpack('<h?', data[ptr:ptr+3])
    ptr += 3
    if lock_pos: ptr += num_keys * 12
    actions_num_keys.append(num_keys)

def get_bone_transforms(action_idx, frame_idx=0):
    p = 38
    for _ in range(num_actions):
        nk, lp = struct.unpack('<h?', data[p:p+3])
        p += 3
        if lp: p += nk * 12
    bones_info = []
    for i in range(num_bones):
        dummy = (data[p] != 0); p += 1
        if not dummy:
            b_name = data[p:p+32].decode('latin-1', errors='ignore').rstrip('\x00'); p += 32
            parent = struct.unpack('<h', data[p:p+2])[0]; p += 2
            pos = (0,0,0); rot = (0,0,0)
            for j in range(num_actions):
                keys = actions_num_keys[j]
                pos_list = [struct.unpack('<3f', data[p+k*12:p+(k+1)*12]) for k in range(keys)]
                p += keys * 12
                rot_list = [struct.unpack('<3f', data[p+k*12:p+(k+1)*12]) for k in range(keys)]
                p += keys * 12
                if j == action_idx and keys > 0:
                    f = min(frame_idx, keys - 1)
                    pos = pos_list[f]; rot = rot_list[f]
            bones_info.append({'dummy': False, 'name': b_name, 'parent': parent, 'pos': pos, 'rot': rot})
        else:
            bones_info.append({'dummy': True, 'name': '', 'parent': -1, 'pos': (0,0,0), 'rot': (0,0,0)})
    bone_matrices = [None] * len(bones_info)
    for i, b in enumerate(bones_info):
        if b['dummy']: continue
        q = angle_quaternion(b['rot'])
        mat = quat_matrix(q, b['pos'])
        if b['parent'] == -1 or bone_matrices[b['parent']] is None:
            bone_matrices[i] = mat
        else:
            bone_matrices[i] = concat_transforms(bone_matrices[b['parent']], mat)
    return bones_info, bone_matrices

def ensure_texture(tex_name):
    clean_stem = Path(tex_name).stem.lower()
    search_dirs = [TEX_OUT, DATA_DIR / "Player", DATA_DIR / "Item"]
    for d in search_dirs:
        for ext in ['.jpg', '.png', '.tga']:
            f = d / f"{clean_stem}{ext}"
            if f.exists() and f.stat().st_size > 0: return f
    for d in search_dirs:
        for ext in ['.OZJ', '.ozj', '.OZT', '.ozt']:
            f = d / f"{clean_stem}{ext}"
            if f.exists() and f.stat().st_size > 0:
                if ext.lower() == '.ozj':
                    dst = TEX_OUT / f"{clean_stem}.jpg"
                    decode_ozj_to_jpg(f, dst)
                    return dst
                elif ext.lower() == '.ozt':
                    dst = TEX_OUT / f"{clean_stem}.tga"
                    decode_ozt_to_tga(f, dst)
                    return dst
    return None

def create_pbr_material(tex_name, is_alpha=False):
    stem = Path(tex_name).stem.lower()
    mat_key = f"Mat_{stem}"
    if mat_key in bpy.data.materials: return bpy.data.materials[mat_key]
    mat = bpy.data.materials.new(name=mat_key)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    tex_path = ensure_texture(tex_name)
    if tex_path and tex_path.exists():
        try:
            img = bpy.data.images.load(str(tex_path))
            tex_node = mat.node_tree.nodes.new(type="ShaderNodeTexImage")
            tex_node.image = img
            mat.node_tree.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
            if is_alpha or 'wing' in stem or 'ndw' in stem:
                mat.blend_method = 'CLIP'
                mat.alpha_threshold = 0.3
                mat.node_tree.links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])
            else:
                mat.blend_method = 'OPAQUE'
        except: pass
    return mat

def build_armature(bones_info, bone_matrices):
    arm_data = bpy.data.armatures.new("Armature")
    arm_obj = bpy.data.objects.new("Armature", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    bone_name_map = {}
    edit_bones = arm_data.edit_bones
    for i, b in enumerate(bones_info):
        clean_name = b['name'].split('\x00')[0].strip().replace(' ', '_')
        b_name = f"Bone_{i:02d}_{clean_name}" if clean_name else f"Bone_{i:02d}"
        bone_name_map[i] = b_name
        eb = edit_bones.new(b_name)
        mat = bone_matrices[i]
        head_pos = Vector((mat[0][3] * 0.01, mat[1][3] * 0.01, mat[2][3] * 0.01)) if mat else Vector((0,0,0))
        eb.head = head_pos
        eb.tail = head_pos + Vector((0.0, 0.0, 0.04))
    for i, b in enumerate(bones_info):
        p_idx = b['parent']
        if 0 <= p_idx < len(bones_info) and not bones_info[p_idx]['dummy']:
            edit_bones[bone_name_map[i]].parent = edit_bones[bone_name_map[p_idx]]
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj, bone_name_map

def import_bmd_part(bmd_rel_path, obj_name, arm_obj, bone_name_map, bone_matrices):
    fpath = DATA_DIR / bmd_rel_path
    if not fpath.exists(): return None
    parser = BMDParser(fpath)
    parser.parse(apply_bones=False)
    valid_meshes = [m for m in parser.meshes if not m['texture_name'].lower().startswith('hid')]
    if not valid_meshes: return None
    all_verts = []; all_faces = []; face_uvs = []; face_mat_indices = []; materials = []; vert_bone_indices = []
    vert_offset = 0
    for m in valid_meshes:
        mat = create_pbr_material(m['texture_name'])
        if mat not in materials: materials.append(mat)
        mat_idx = materials.index(mat)
        for node, pos in m['raw_verts']:
            mat_b = bone_matrices[node] if node < len(bone_matrices) else None
            tp = transform_pos(pos, mat_b) if mat_b else pos
            all_verts.append(Vector((tp[0] * 0.01, tp[1] * 0.01, tp[2] * 0.01)))
            vert_bone_indices.append(node)
        for tri in m['triangles']:
            v = tri['v']; t = tri['t']
            all_faces.append((v[0] + vert_offset, v[1] + vert_offset, v[2] + vert_offset))
            face_uvs.append((m['uvs'][t[0]], m['uvs'][t[1]], m['uvs'][t[2]]))
            face_mat_indices.append(mat_idx)
            if tri['poly'] == 4:
                all_faces.append((v[0] + vert_offset, v[2] + vert_offset, v[3] + vert_offset))
                face_uvs.append((m['uvs'][t[0]], m['uvs'][t[2]], m['uvs'][t[3]]))
                face_mat_indices.append(mat_idx)
        vert_offset += len(m['raw_verts'])
    mesh_data = bpy.data.meshes.new(obj_name)
    mesh_data.from_pydata(all_verts, [], all_faces)
    mesh_data.update()
    for mat in materials: mesh_data.materials.append(mat)
    for p_idx, p in enumerate(mesh_data.polygons):
        if p_idx < len(face_mat_indices): p.material_index = face_mat_indices[p_idx]
    uv_layer = mesh_data.uv_layers.new(name="UVMap")
    for loop_idx, f_uv in enumerate(face_uvs):
        for sub_i, uv in enumerate(f_uv):
            uv_layer.data[loop_idx*3 + sub_i].uv = uv
    obj = bpy.data.objects.new(obj_name, mesh_data)
    bpy.context.collection.objects.link(obj)
    for j, node in enumerate(vert_bone_indices):
        if node in bone_name_map:
            bg_name = bone_name_map[node]
            vg = obj.vertex_groups.get(bg_name) or obj.vertex_groups.new(name=bg_name)
            vg.add([j], 1.0, 'REPLACE')
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj; obj.parent = arm_obj
    return obj

def import_weapon(wep_rel_path, obj_name, arm_obj, bone_name_map, bone_matrices, target_bone_idx, rot_matrix=Matrix.Identity(4), loc_offset=Vector((0,0,0))):
    fpath = DATA_DIR / wep_rel_path
    if not fpath.exists(): return None
    parser = BMDParser(fpath)
    parser.parse(apply_bones=False)
    valid_meshes = [m for m in parser.meshes if not m['texture_name'].lower().startswith('hid')]
    if not valid_meshes: return None
    bone_mat = bone_matrices[target_bone_idx]
    bone_pos = Vector((bone_mat[0][3] * 0.01, bone_mat[1][3] * 0.01, bone_mat[2][3] * 0.01))
    m = bone_mat
    mat_bone = Matrix([
        [m[0][0], m[0][1], m[0][2], bone_pos.x],
        [m[1][0], m[1][1], m[1][2], bone_pos.y],
        [m[2][0], m[2][1], m[2][2], bone_pos.z],
        [0.0, 0.0, 0.0, 1.0]
    ])
    mat_loc = Matrix.Translation(loc_offset)
    mat_final = mat_bone @ mat_loc @ rot_matrix
    all_verts = []; all_faces = []; face_uvs = []; face_mat_indices = []; materials = []
    vert_offset = 0
    for m in valid_meshes:
        mat = create_pbr_material(m['texture_name'])
        if mat not in materials: materials.append(mat)
        mat_idx = materials.index(mat)
        for v in m['raw_verts']:
            tv = mat_final @ Vector((v[1][0] * 0.01, v[1][1] * 0.01, v[1][2] * 0.01, 1.0))
            all_verts.append(tv.to_3d())
        for tri in m['triangles']:
            v = tri['v']; t = tri['t']
            all_faces.append((v[0] + vert_offset, v[1] + vert_offset, v[2] + vert_offset))
            face_uvs.append((m['uvs'][t[0]], m['uvs'][t[1]], m['uvs'][t[2]]))
            face_mat_indices.append(mat_idx)
            if tri['poly'] == 4:
                all_faces.append((v[0] + vert_offset, v[2] + vert_offset, v[3] + vert_offset))
                face_uvs.append((m['uvs'][t[0]], m['uvs'][t[2]], m['uvs'][t[3]]))
                face_mat_indices.append(mat_idx)
        vert_offset += len(m['raw_verts'])
    mesh_data = bpy.data.meshes.new(obj_name)
    mesh_data.from_pydata(all_verts, [], all_faces)
    mesh_data.update()
    for mat in materials: mesh_data.materials.append(mat)
    for p_idx, p in enumerate(mesh_data.polygons):
        if p_idx < len(face_mat_indices): p.material_index = face_mat_indices[p_idx]
    uv_layer = mesh_data.uv_layers.new(name="UVMap")
    for loop_idx, f_uv in enumerate(face_uvs):
        for sub_i, uv in enumerate(f_uv):
            uv_layer.data[loop_idx*3 + sub_i].uv = uv
    obj = bpy.data.objects.new(obj_name, mesh_data)
    bpy.context.collection.objects.link(obj)
    b_name = bone_name_map[target_bone_idx]
    vg = obj.vertex_groups.new(name=b_name)
    vg.add(list(range(len(all_verts))), 1.0, 'REPLACE')
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj; obj.parent = arm_obj
    return obj

def render_scene(out_png):
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
    cam_obj.location = (0.0, -2.85, 1.1)
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and obj.name.startswith('Body_'): obj.hide_render = True
    scene.render.filepath = str(out_png)
    bpy.ops.render.render(write_still=True)
    print(f"Renderizado: {out_png.name}")

# TEST DW with Staff05
bones_male, mat_male = get_bone_transforms(1)
bpy.ops.wm.read_factory_settings(use_empty=True)
arm, bmap = build_armature(bones_male, mat_male)
dw_armor = [
    ("Player/HelmMale04.bmd", "Armor_Helm"),
    ("Player/ArmorMale04.bmd", "Armor_Chest"),
    ("Player/PantMale04.bmd", "Armor_Legs"),
    ("Player/GloveMale04.bmd", "Armor_Gloves"),
    ("Player/BootMale04.bmd", "Armor_Boots"),
]
for p, n in dw_armor: import_bmd_part(p, n, arm, bmap, mat_male)
import_weapon("Item/Staff05.bmd", "Weapon_Right", arm, bmap, mat_male, 33, Matrix.Identity(4))
render_scene(PREVIEWS_DIR / "test_dw_staff_identity.png")

# TEST ELF with Bow04
bones_female, mat_female = get_bone_transforms(2)
bpy.ops.wm.read_factory_settings(use_empty=True)
arm, bmap = build_armature(bones_female, mat_female)
elf_armor = [
    ("Player/HelmElf05.bmd", "Armor_Helm"),
    ("Player/ArmorElf05.bmd", "Armor_Chest"),
    ("Player/PantElf05.bmd", "Armor_Legs"),
    ("Player/GloveElf05.bmd", "Armor_Gloves"),
    ("Player/BootElf05.bmd", "Armor_Boots"),
]
for p, n in elf_armor: import_bmd_part(p, n, arm, bmap, mat_female)
import_weapon("Item/Bow04.bmd", "Weapon_Left", arm, bmap, mat_female, 42, Matrix.Identity(4))
render_scene(PREVIEWS_DIR / "test_elf_bow_identity.png")
