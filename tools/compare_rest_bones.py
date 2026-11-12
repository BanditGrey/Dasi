import bpy
import struct
from pathlib import Path
from mathutils import Vector, Matrix

WORKSPACE = Path("D:/Dasi")
DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"

# Load hero_dk_animated armature
bpy.ops.wm.read_factory_settings(use_empty=True)
glb_src = WORKSPACE / "src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"
bpy.ops.import_scene.gltf(filepath=str(glb_src))
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')

for b_name in ['Head', 'neck_01', 'spine_03', 'spine_02', 'spine_01', 'pelvis', 'thigh_l', 'calf_l', 'foot_l', 'thigh_r', 'calf_r', 'foot_r', 'upperarm_l', 'lowerarm_l', 'hand_l', 'upperarm_r', 'lowerarm_r', 'hand_r']:
    b = arm.data.bones.get(b_name)
    if b:
        print(f"Armature {b_name:12s}: head=({b.head.x:.2f}, {b.head.y:.2f}, {b.head.z:.2f})")
