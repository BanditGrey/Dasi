import json, struct

buf = open('src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb', 'rb').read()
l = struct.unpack('<I', buf[12:16])[0]
gltf = json.loads(buf[20:20+l].decode('utf-8'))

nodes = gltf['nodes']
skin = gltf['skins'][0]
joints = skin['joints']

print(f"Total joints in skin: {len(joints)}")
for i, j in enumerate(joints):
    n = nodes[j]
    parent_id = None
    for pi, p in enumerate(nodes):
        if 'children' in p and j in p['children']:
            parent_id = pi
            break
    pname = nodes[parent_id]['name'] if parent_id is not None else "ROOT"
    print(f"[{i:02d}] Node {j:02d}: '{n.get('name')}' (parent: {pname})")
