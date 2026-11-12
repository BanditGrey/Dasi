import sys
import math
from pathlib import Path
WORKSPACE = Path("D:/Dasi")
sys.path.append(str(WORKSPACE / 'conversions/converters/bmd_to_glb'))
sys.path.append(str(WORKSPACE / 'conversions/converters/texture_decoder'))
import bpy
from mathutils import Vector, Matrix, Euler
from bmd_parser import BMDParser, transform_pos, map_file_decrypt, angle_quaternion, quat_matrix, concat_transforms
import struct

DATA_DIR = WORKSPACE / "reference/mu_roxgaming_5.2/client/Data"
PREVIEWS_DIR = WORKSPACE / "docs/art_previews"

# Run build_canonical_fixed_heroes for ELF with identity vs other rots and render
