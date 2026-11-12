import bpy
import math
from mathutils import Vector, Euler, Matrix

WORKSPACE = "D:/Dasi"

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_elf_animated.glb"
bpy.ops.import_scene.gltf(filepath=glb_path)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
wep = bpy.data.objects.get('elf_weapon')

# In Idle, we want the bow limbs to point vertically (world Z)
act_idle = bpy.data.actions.get('Idle')
arm.animation_data.action = act_idle
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

# Let's inspect hand_l world matrix in Idle frame 0
b_l = arm.pose.bones.get('hand_l')
mat_hand_world = arm.matrix_world @ b_l.matrix
print(f"hand_l matrix_world at Idle f0:\n{mat_hand_world}")

# If we want the bow's local Z axis (0, 0, 1) to map to world Z (0, 0, 1):
# mat_hand_world.to_3x3() @ R @ (0, 0, 1) = (0, 0, 1)
# So R @ (0, 0, 1) = mat_hand_world.to_3x3().inverted() @ (0, 0, 1)
target_world_z = Vector((0, 0, 1))
desired_local_dir = mat_hand_world.to_3x3().inverted() @ target_world_z
print(f"Desired local direction in hand_l for bow Z: {desired_local_dir.normalized()}")

# Also what about the arrow direction (local Y: [0, 1, 0])?
# When facing forward (-Y in world), we want arrow to point towards world -Y:
target_world_arrow = Vector((0, -1, 0))
desired_local_arrow = mat_hand_world.to_3x3().inverted() @ target_world_arrow
print(f"Desired local direction in hand_l for bow Y (arrow): {desired_local_arrow.normalized()}")

# Let's build the exact 3x3 rotation matrix in hand_l:
# Column 0: X = Y x Z
# Column 1: Y (arrow)
# Column 2: Z (bow limbs)
z_col = desired_local_dir.normalized()
y_col = desired_local_arrow.normalized()
# Gram-Schmidt to orthogonalize
y_col = (y_col - y_col.dot(z_col) * z_col).normalized()
x_col = y_col.cross(z_col).normalized()

mat_rot = Matrix([
    [x_col.x, y_col.x, z_col.x],
    [x_col.y, y_col.y, z_col.y],
    [x_col.z, y_col.z, z_col.z]
])
euler_idle = mat_rot.to_euler('XYZ')
print(f"\nExact Euler for Idle vertical bow:")
print(f"  Radians: ({euler_idle.x:.4f}, {euler_idle.y:.4f}, {euler_idle.z:.4f})")
print(f"  Degrees: ({math.degrees(euler_idle.x):.1f}, {math.degrees(euler_idle.y):.1f}, {math.degrees(euler_idle.z):.1f})")

# Now check in 2H_Ranged_Shoot frame 10:
act_shoot = bpy.data.actions.get('2H_Ranged_Shoot')
if act_shoot:
    arm.animation_data.action = act_shoot
    bpy.context.scene.frame_set(10)
    bpy.context.view_layer.update()
    mat_hand_shoot = arm.matrix_world @ b_l.matrix
    
    # In shoot pose, what world direction does bow Z become with this rotation?
    bow_z_world = mat_hand_shoot.to_3x3() @ z_col
    bow_y_world = mat_hand_shoot.to_3x3() @ y_col
    print(f"\nIn 2H_Ranged_Shoot f10:")
    print(f"  Bow limbs world dir (Z): {bow_z_world.normalized()}")
    print(f"  Bow arrow world dir (Y): {bow_y_world.normalized()}")
