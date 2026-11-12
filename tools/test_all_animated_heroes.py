import bpy
import os
import math
from mathutils import Vector, Euler

WORKSPACE = "D:/Dasi"
PREVIEWS_DIR = f"{WORKSPACE}/docs/art_previews"

classes = [
    {
        'id': 'DK',
        'file': 'hero_dk_animated.glb',
        'wep_node': 'dk_weapon',
        'wep_rot': Euler((0, math.radians(90), 0), 'XYZ'),
        'wep_loc': Vector((0.0, 0.08, 0.0)),
        'anim': '1H_Melee_Attack_Chop',
        'frame': 10,
    },
    {
        'id': 'DW',
        'file': 'hero_dw_animated.glb',
        'wep_node': 'dw_weapon',
        'wep_rot': Euler((0, math.radians(90), 0), 'XYZ'),
        'wep_loc': Vector((0.0, 0.08, 0.0)),
        'anim': 'Spellcast_Shoot',
        'frame': 10,
    },
    {
        'id': 'ELF',
        'file': 'hero_elf_animated.glb',
        'wep_node': 'elf_weapon',
        'wep_rot': Euler((math.radians(180), 0, math.radians(90)), 'XYZ'),
        'wep_loc': Vector((0.0, 0.08, 0.0)),
        'anim': '2H_Ranged_Shoot',
        'frame': 10,
    },
    {
        'id': 'MG',
        'file': 'hero_mg_animated.glb',
        'wep_node': 'mg_weapon',
        'wep_rot': Euler((0, math.radians(90), 0), 'XYZ'),
        'wep_loc': Vector((0.0, 0.08, 0.0)),
        'anim': '2H_Melee_Attack_Spin',
        'frame': 10,
    },
    {
        'id': 'DL',
        'file': 'hero_dl_animated.glb',
        'wep_node': 'dl_weapon',
        'wep_rot': Euler((0, 0, 0), 'XYZ'), # test identity for scepter
        'wep_loc': Vector((0.0, 0.08, 0.0)),
        'anim': '1H_Melee_Attack_Slice_Horizontal',
        'frame': 10,
    },
]

for cfg in classes:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/{cfg['file']}"
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    wep = bpy.data.objects.get(cfg['wep_node'])
    if wep:
        wep.rotation_mode = 'XYZ'
        wep.rotation_euler = cfg['wep_rot']
        wep.location = cfg['wep_loc']
        
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'TEXTURE'
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1100
    scene.render.film_transparent = True
    
    cam_data = bpy.data.cameras.new("HeroCam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("HeroCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.location = (0.0, -3.2, 1.2)
    cam_obj.rotation_euler = (1.5708, 0, 0)
    
    # Render Idle frame 0
    act_idle = bpy.data.actions.get('Idle')
    if act_idle:
        arm.animation_data.action = act_idle
        scene.frame_set(0)
        bpy.context.view_layer.update()
        out_png = f"{PREVIEWS_DIR}/anim_test_{cfg['id'].lower()}_idle.png"
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
        print(f"Rendered: {out_png}")
        
    # Render Skill animation
    act_skill = bpy.data.actions.get(cfg['anim'])
    if act_skill:
        arm.animation_data.action = act_skill
        scene.frame_set(cfg['frame'])
        bpy.context.view_layer.update()
        out_png = f"{PREVIEWS_DIR}/anim_test_{cfg['id'].lower()}_action.png"
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
        print(f"Rendered: {out_png}")
