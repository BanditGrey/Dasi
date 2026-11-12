#!/usr/bin/env python3
import os
import re
from pathlib import Path

BASE_DIR = Path("D:/Dasi/reference/mu_roxgaming_5.2/server/Data")
CLIENT_DIR = Path("D:/Dasi/reference/mu_roxgaming_5.2/client/Data")

def analyze_all_npcs_and_mobs():
    monster_file = BASE_DIR / "Monster/Monster.txt"
    monsters = {}
    with open(monster_file, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("//") or line.startswith("end"):
                continue
            m = re.match(r'^(\d+)\s+(\d+)\s+"([^"]+)"\s+(.*)', line)
            if m:
                idx = int(m.group(1))
                rate = int(m.group(2))
                name = m.group(3)
                rest = m.group(4).split()
                monsters[idx] = {
                    'index': idx,
                    'name': name,
                    'level': int(rest[0]) if len(rest) > 0 else 0,
                    'hp': int(rest[1]) if len(rest) > 1 else 0,
                    'mp': int(rest[2]) if len(rest) > 2 else 0,
                    'dam_min': int(rest[3]) if len(rest) > 3 else 0,
                    'dam_max': int(rest[4]) if len(rest) > 4 else 0,
                    'defense': int(rest[5]) if len(rest) > 5 else 0,
                    'mag_def': int(rest[6]) if len(rest) > 6 else 0,
                    'atk_rate': int(rest[7]) if len(rest) > 7 else 0,
                    'def_rate': int(rest[8]) if len(rest) > 8 else 0,
                    'move_range': int(rest[9]) if len(rest) > 9 else 0,
                    'atk_type': int(rest[10]) if len(rest) > 10 else 0,
                    'atk_range': int(rest[11]) if len(rest) > 11 else 0,
                    'view_range': int(rest[12]) if len(rest) > 12 else 0,
                    'move_speed': int(rest[13]) if len(rest) > 13 else 0,
                    'atk_speed': int(rest[14]) if len(rest) > 14 else 0,
                    'regen_time': int(rest[15]) if len(rest) > 15 else 0,
                }

    # Agora verifica MonsterSetBase.txt para descobrir onde cada mob dá spawn
    spawns = {}
    msb_file = BASE_DIR / "Monster/MonsterSetBase.txt"
    current_sec = 0
    with open(msb_file, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            if re.match(r'^\d+$', line):
                current_sec = int(line)
                continue
            if line.lower() == "end":
                continue
            
            parts = line.split()
            if len(parts) >= 5:
                try:
                    m_idx = int(parts[0])
                    map_id = int(parts[1])
                    x = int(parts[3]) if current_sec == 0 else int(parts[3])
                    y = int(parts[4]) if current_sec == 0 else int(parts[4])
                    if m_idx not in spawns:
                        spawns[m_idx] = []
                    if map_id not in [s['map'] for s in spawns[m_idx]]:
                        spawns[m_idx].append({'map': map_id, 'x': x, 'y': y})
                except:
                    pass
                    
    # Mapeia nomes dos mapas
    map_names = {
        0: "Lorencia", 1: "Dungeon", 2: "Devias", 3: "Noria", 4: "Lost Tower",
        6: "Arena / Stadium", 7: "Atlans", 8: "Tarkan", 9: "Devil Square",
        10: "Icarus", 11: "Blood Castle 1", 12: "Blood Castle 2", 13: "Blood Castle 3",
        14: "Blood Castle 4", 15: "Blood Castle 5", 16: "Blood Castle 6", 17: "Blood Castle 7",
        18: "Chaos Castle 1", 19: "Chaos Castle 2", 20: "Chaos Castle 3", 21: "Chaos Castle 4",
        22: "Chaos Castle 5", 23: "Chaos Castle 6", 24: "Kalima 1", 25: "Kalima 2",
        26: "Kalima 3", 27: "Kalima 4", 28: "Kalima 5", 29: "Kalima 6", 30: "Valley of Loren",
        31: "Land of Trials", 33: "Aida", 34: "Crywolf", 36: "Kalima 7", 37: "Kanturu 1",
        38: "Kanturu 2", 39: "Kanturu 3 (Core)", 40: "Silent Map", 41: "Barracks of Balgass",
        42: "Refuge of Balgass", 45: "Illusion Temple 1", 51: "Elbeland", 52: "Blood Castle 8",
        53: "Chaos Castle 7", 56: "Calmness", 57: "Raklion", 58: "Hatchery (Selupan)",
        62: "Santa Village", 63: "Vulcanus (Gens Duel)"
    }
    
    return monsters, spawns, map_names

def analyze_armor_sets():
    item_file = BASE_DIR / "Item/Item.txt"
    sets = {}
    
    # Helmes (7), Armors (8), Pants (9), Gloves (10), Boots (11)
    with open(item_file, "r", encoding="utf-8", errors="ignore") as f:
        current_cat = None
        for line in f:
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            if re.match(r'^\d+$', line):
                current_cat = int(line)
                continue
            if line.lower() == "end":
                current_cat = None
                continue
            if current_cat in [7, 8, 9, 10, 11]:
                m = re.search(r'"([^"]+)"', line)
                if m:
                    item_name = m.group(1)
                    parts = line.split('"')
                    pre = parts[0].strip().split()
                    post = parts[1].strip().split() if len(parts) > 1 else []
                    full_post = line[line.find('"'+item_name+'"') + len(item_name) + 2:].strip().split()
                    
                    # Nome base do set: remove Helm, Armor, Pants, Gloves, Boots
                    set_stem = item_name
                    for token in ["Helm", "Armor", "Pants", "Gloves", "Boots", "Mask"]:
                        set_stem = set_stem.replace(token, "").strip()
                    
                    if set_stem not in sets:
                        sets[set_stem] = {
                            'stem': set_stem,
                            'pieces': {},
                            'classes': [],
                            'req_level': 0,
                            'req_str': 0,
                            'req_agi': 0,
                        }
                    
                    idx = int(pre[0])
                    piece_type = {7: 'helm', 8: 'armor', 9: 'pants', 10: 'gloves', 11: 'boots'}[current_cat]
                    sets[set_stem]['pieces'][piece_type] = {
                        'id': idx,
                        'name': item_name,
                        'cat': current_cat,
                    }
                    if full_post and len(full_post) >= 10:
                        try:
                            # Level req costuma estar nos atributos
                            sets[set_stem]['req_level'] = max(sets[set_stem]['req_level'], int(full_post[4]))
                        except:
                            pass
    return sets

def analyze_ancient_sets():
    ancient_file = BASE_DIR / "Item/SetItemOption.txt"
    ancients = []
    if ancient_file.exists():
        with open(ancient_file, "r", encoding="utf-8", errors="ignore") as f:
            current_sec = None
            for line in f:
                line = line.strip()
                if not line or line.startswith("//"):
                    continue
                if re.match(r'^\d+$', line):
                    current_sec = int(line)
                    continue
                if line.lower() == "end":
                    current_sec = None
                    continue
                if current_sec == 0:
                    m = re.search(r'"([^"]+)"', line)
                    if m:
                        anc_name = m.group(1)
                        parts = line.split('"')[0].strip().split()
                        if parts:
                            ancients.append({'id': int(parts[0]), 'name': anc_name})
    return ancients

def analyze_all_shops():
    shop_dir = BASE_DIR / "Shop"
    shops = []
    for f in sorted(shop_dir.glob("*.txt")):
        shop_name = f.stem
        item_count = 0
        with open(f, "r", encoding="utf-8", errors="ignore") as sf:
            for l in sf:
                l = l.strip()
                if l and not l.startswith("//") and not l.startswith("end") and not re.match(r'^\d+$', l):
                    item_count += 1
        shops.append({'file': f.name, 'name': shop_name, 'items_count': item_count})
    return shops

if __name__ == "__main__":
    monsters, spawns, map_names = analyze_all_npcs_and_mobs()
    sets = analyze_armor_sets()
    ancients = analyze_ancient_sets()
    shops = analyze_all_shops()
    
    print(f"Total Sets de Armadura Mapeados: {len(sets)}")
    print(f"Total Sets Ancient Mapeados: {len(ancients)}")
    print(f"Total NPCs de Loja Mapeados: {len(shops)}")
    
    # Exemplo dos 10 primeiros sets
    print("\nExemplo dos primeiros sets:")
    for i, (k, v) in enumerate(list(sets.items())[:15]):
        pieces_str = ", ".join(f"{pk}: {pv['name']}" for pk, pv in v['pieces'].items())
        print(f"  [{i+1}] {k}: {len(v['pieces'])} peças ({pieces_str})")
        
    print(f"\nExemplo dos primeiros Sets Ancient:")
    for a in ancients[:15]:
        print(f"  [{a['id']}] {a['name']}")
        
    print(f"\nExemplo de Lojas:")
    for s in shops[:10]:
        print(f"  {s['name']}: {s['items_count']} itens à venda")
