import json, struct
buf = open('src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb', 'rb').read()
l = struct.unpack('<I', buf[12:16])[0]
gltf = json.loads(buf[20:20+l].decode('utf-8'))
nodes = gltf['nodes']
for n in nodes:
    name = n.get('name', '')
    if any(k in name for k in ['index_01_r', 'middle_01_r', 'thumb_01_r', 'dk_weapon']):
        print(f"{name}: trans={n.get('translation')}, rot={n.get('rotation')}")
