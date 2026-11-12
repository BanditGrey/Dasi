import re
from pathlib import Path

BASE_DIR = Path('D:/Dasi/reference/mu_roxgaming_5.2/server/Data')
monsters = {}
with open(BASE_DIR / 'Monster/Monster.txt', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('end'):
            continue
        m = re.match(r'^(\d+)\s+(\d+)\s+"([^"]+)"\s+(.*)', line)
        if m:
            idx = int(m.group(1))
            name = m.group(3)
            rest = m.group(4).split()
            hp = int(rest[1]) if len(rest) > 1 else 0
            lvl = int(rest[0]) if len(rest) > 0 else 0
            monsters[idx] = {'name': name, 'hp': hp, 'level': lvl}

# Procura todos os NPCs no MonsterSetBase para ver coordenadas e mapas
msb = BASE_DIR / 'Monster/MonsterSetBase.txt'
npc_spawns = {}
with open(msb, 'r', encoding='utf-8', errors='ignore') as f:
    current_sec = 0
    for line in f:
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        if re.match(r'^\d+$', line):
            current_sec = int(line)
            continue
        if line.lower() == 'end':
            continue
        parts = line.split()
        if len(parts) >= 5 and current_sec == 0:  # Seção 0 são NPCs fixos!
            try:
                m_idx = int(parts[0])
                map_id = int(parts[1])
                x = int(parts[3])
                y = int(parts[4])
                dir_rot = int(parts[5]) if len(parts) > 5 else 0
                if m_idx not in npc_spawns:
                    npc_spawns[m_idx] = []
                npc_spawns[m_idx].append({'map': map_id, 'x': x, 'y': y, 'dir': dir_rot})
            except:
                pass

print(f"Total de NPCs únicos com spawn fixo (Seção 0 de MonsterSetBase): {len(npc_spawns)}")

map_names = {
    0: "Lorencia", 1: "Dungeon", 2: "Devias", 3: "Noria", 4: "Lost Tower",
    6: "Arena / Stadium", 7: "Atlans", 8: "Tarkan", 9: "Devil Square",
    10: "Icarus", 24: "Kalima", 30: "Valley of Loren", 31: "Land of Trials",
    33: "Aida", 34: "Crywolf", 37: "Kanturu", 39: "Kanturu Core",
    40: "Silent Map", 41: "Barracks", 42: "Refuge", 51: "Elbeland",
    56: "Calmness", 57: "Raklion", 62: "Santa Village", 63: "Vulcanus"
}

for idx in sorted(npc_spawns.keys()):
    m_info = monsters.get(idx, {'name': 'Desconhecido', 'level': 0})
    sp_list = npc_spawns[idx]
    locs = []
    for s in sp_list:
        m_name = map_names.get(s['map'], f"Map {s['map']}")
        locs.append(f"{m_name} ({s['x']}, {s['y']})")
    print(f"NPC [{idx:3d}] {m_info['name']} -> {', '.join(locs)}")
