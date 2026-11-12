import bpy

WORKSPACE = "D:/Dasi"
p = f"{WORKSPACE}/src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=p)

for o in bpy.data.objects:
    if o.type == 'MESH' and o.vertex_groups:
        # Check which vertex groups have non-zero weights
        used_groups = set()
        for v in o.data.vertices:
            for g in v.groups:
                if g.weight > 0.05:
                    used_groups.add(o.vertex_groups[g.group].name)
        print(f"\nMesh: {o.name} ({len(o.data.vertices)} verts, bounds Z=[{min(v.co.z for v in o.data.vertices):.2f}, {max(v.co.z for v in o.data.vertices):.2f}]):")
        print(f"  Active bones with weight > 0.05: {sorted(list(used_groups))}")
