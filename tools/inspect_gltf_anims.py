#!/usr/bin/env python3
import json
import struct
from pathlib import Path

def inspect_glb(glb_path):
    print("=" * 60)
    print(f"Inspecting: {glb_path}")
    print("=" * 60)
    buf = open(glb_path, 'rb').read()
    jlen = struct.unpack('<I', buf[12:16])[0]
    gltf = json.loads(buf[20:20+jlen].decode('utf-8'))
    
    nodes = gltf.get('nodes', [])
    print(f"Total nodes: {len(nodes)}")
    
    # Check skins / armature
    skins = gltf.get('skins', [])
    print(f"Total skins: {len(skins)}")
    for si, s in enumerate(skins):
        joints = s.get('joints', [])
        print(f"  Skin {si}: {len(joints)} joints")
        joint_names = [nodes[j].get('name', f'node_{j}') for j in joints]
        print(f"  First 10 joints: {joint_names[:10]}")
        print(f"  Hand/Weapon joints: {[name for name in joint_names if any(k in name.lower() for k in ['hand', 'weapon', 'sword', 'knife', 'r_', 'l_'])]}")

    # Check animations
    anims = gltf.get('animations', [])
    print(f"\nTotal animations: {len(anims)}")
    for ai, a in enumerate(anims):
        name = a.get('name')
        chans = len(a.get('channels', []))
        samplers = len(a.get('samplers', []))
        print(f"  [{ai:02d}] '{name}' (channels: {chans}, samplers: {samplers})")

    # Check meshes and nodes
    mesh_nodes = [n for n in nodes if 'mesh' in n]
    print(f"\nMesh nodes ({len(mesh_nodes)}):")
    for n in mesh_nodes:
        print(f"  - Node '{n.get('name')}' (mesh {n.get('mesh')}, parent_idx={[i for i, parent in enumerate(nodes) if 'children' in parent and nodes.index(n) in parent['children']]})")

if __name__ == '__main__':
    inspect_glb("src/client/dev_viewer/models/animated_heroes/hero_dk_animated.glb")
