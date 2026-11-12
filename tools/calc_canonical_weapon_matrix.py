import math
import numpy as np
from mathutils import Matrix, Vector, Euler

def angle_matrix(angles, translation=(0.0, 0.0, 0.0)):
    # Webzen AngleMatrix:
    # angles[0] = roll/X, angles[1] = pitch/Y, angles[2] = yaw/Z (degrees)
    # matrix = (Z * Y) * X
    ay = math.radians(angles[2])
    sy = math.sin(ay)
    cy = math.cos(ay)
    
    ap = math.radians(angles[1])
    sp = math.sin(ap)
    cp = math.cos(ap)
    
    ar = math.radians(angles[0])
    sr = math.sin(ar)
    cr = math.cos(ar)
    
    m = np.zeros((4, 4))
    m[0][0] = cp * cy
    m[1][0] = cp * sy
    m[2][0] = -sp
    
    m[0][1] = sr * sp * cy + cr * -sy
    m[1][1] = sr * sp * sy + cr * cy
    m[2][1] = sr * cp
    
    m[0][2] = (cr * sp * cy + -sr * -sy)
    m[1][2] = (cr * sp * sy + -sr * cy)
    m[2][2] = cr * cp
    
    m[0][3] = translation[0]
    m[1][3] = translation[1]
    m[2][3] = translation[2]
    m[3][3] = 1.0
    return m

def concat_transforms(in1, in2):
    return in1 @ in2

# 1. Right Hand Sword/Staff:
m_sword = angle_matrix((70.0, 0.0, 90.0), (-20.0, 5.0, 40.0))
print("Right Hand Sword Matrix (Bone 33 knife_gdf space):")
print(m_sword)
mat4_sword = Matrix(m_sword.tolist())
euler_sword = mat4_sword.to_euler('XYZ')
print(f"  Euler XYZ (deg): {math.degrees(euler_sword.x):.2f}, {math.degrees(euler_sword.y):.2f}, {math.degrees(euler_sword.z):.2f}")
print(f"  Translation (m): {mat4_sword.translation * 0.01}")

# 2. Left Hand Bow (Bone 42 hand_bofdgne01 space):
# Base matrix for bow:
m_bow_base = angle_matrix((70.0, 0.0, 90.0), (-10.0, 5.0, 10.0))
# Left hand extra transform:
m_left_extra = angle_matrix((145.0, 0.0, 275.0), (0.0, 10.0, -30.0))
m_bow_final = concat_transforms(m_bow_base, m_left_extra)
print("\nLeft Hand Bow Matrix (Bone 42 hand_bofdgne01 space):")
print(m_bow_final)
mat4_bow = Matrix(m_bow_final.tolist())
euler_bow = mat4_bow.to_euler('XYZ')
print(f"  Euler XYZ (deg): {math.degrees(euler_bow.x):.2f}, {math.degrees(euler_bow.y):.2f}, {math.degrees(euler_bow.z):.2f}")
print(f"  Translation (m): {mat4_bow.translation * 0.01}")

# 3. Left Hand Sword (Dual Wield) (Bone 42 hand_bofdgne01 space):
m_sword_l_base = angle_matrix((70.0, 0.0, 90.0), (-20.0, 5.0, 40.0))
m_sword_l_final = concat_transforms(m_sword_l_base, m_left_extra)
print("\nLeft Hand Sword (Dual Wield) Matrix (Bone 42 hand_bofdgne01 space):")
print(m_sword_l_final)
mat4_sword_l = Matrix(m_sword_l_final.tolist())
euler_sword_l = mat4_sword_l.to_euler('XYZ')
print(f"  Euler XYZ (deg): {math.degrees(euler_sword_l.x):.2f}, {math.degrees(euler_sword_l.y):.2f}, {math.degrees(euler_sword_l.z):.2f}")
print(f"  Translation (m): {mat4_sword_l.translation * 0.01}")
