#!/usr/bin/env python3
import os
import re
from pathlib import Path

BASE_DIR = Path("D:/Dasi/reference/mu_roxgaming_5.2/server/Data")
CLIENT_DIR = Path("D:/Dasi/reference/mu_roxgaming_5.2/client/Data")

def parse_monster_txt():
    monster_file = BASE_DIR / "Monster/Monster.txt"
    if not monster_file.exists():
        print(f"[-] Arquivo não encontrado: {monster_file}")
        return []
    
    monsters = []
    with open(monster_file, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("//") or line.startswith("end"):
                continue
            
            # Formato típico: Index Rate "Name" Level HP MP DamMin DamMax Def MagDef AtkRate DefRate MoveRange AtkType AtkRange ViewRange MoveSpeed AtkSpeed RegTime ItemRate MoneyRate MaxItemLevel
            # Ex: 0 1 "Bull Fighter" 6 100 0 16 20 6 0 28 3 2 1 1 5 400 1400 10 10 20 0
            # Alguns nomes têm aspas
            m = re.match(r'^(\d+)\s+(\d+)\s+"([^"]+)"\s+(.*)', line)
            if m:
                idx = int(m.group(1))
                rate = int(m.group(2))
                name = m.group(3)
                rest = m.group(4).split()
                monsters.append({
                    'index': idx,
                    'rate': rate,
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
                })
    return monsters

def parse_item_txt():
    item_file = BASE_DIR / "Item/Item.txt"
    if not item_file.exists():
        print(f"[-] Arquivo não encontrado: {item_file}")
        return {}
    
    categories = {}
    current_cat = None
    with open(item_file, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith("//") or line.startswith(";"):
                continue
            
            # Checa início de seção: número único (0 a 15)
            if re.match(r'^\d+$', line):
                current_cat = int(line)
                if current_cat not in categories:
                    categories[current_cat] = []
                continue
            if line.lower() == "end":
                current_cat = None
                continue
            
            if current_cat is not None:
                # Linha de item: Index Slot SkillX SkillY ... "Name" ...
                # ou com nome entre aspas
                m = re.search(r'"([^"]+)"', line)
                if m:
                    parts = line.split('"')
                    pre = parts[0].strip().split()
                    name = parts[1]
                    post = parts[2].strip().split() if len(parts) > 2 else []
                    if pre:
                        try:
                            idx = int(pre[0])
                            categories[current_cat].append({
                                'index': idx,
                                'name': name,
                                'full_id': current_cat * 512 + idx,
                                'cat': current_cat,
                                'raw_pre': pre,
                                'raw_post': post
                            })
                        except:
                            pass
    return categories

def check_client_models():
    # Mapeia BMDs em Monster, NPC, Item, Player
    models = {
        'monster_bmd': list((CLIENT_DIR / "Monster").glob("*.bmd")),
        'npc_bmd': list((CLIENT_DIR / "NPC").glob("*.bmd")),
        'item_bmd': list((CLIENT_DIR / "Item").glob("*.bmd")),
        'player_bmd': list((CLIENT_DIR / "Player").glob("*.bmd")),
    }
    return models

if __name__ == "__main__":
    monsters = parse_monster_txt()
    print(f"Total Monstros e NPCs em Monster.txt: {len(monsters)}")
    
    # Separa NPCs e Mobs
    # Geralmente NPCs são level 0 ou index >= 200 / HP 0
    npcs = [m for m in monsters if m['level'] == 0 or m['hp'] == 0 or m['index'] >= 229 and m['index'] <= 259]
    mobs = [m for m in monsters if m not in npcs]
    print(f"  -> Mobs de Combate / Chefes / Eventos: {len(mobs)}")
    print(f"  -> NPCs de Diálogo / Lojas / Quests / Estátuas: {len(npcs)}")
    
    categories = parse_item_txt()
    total_items = sum(len(items) for items in categories.values())
    print(f"\nTotal Itens em Item.txt: {total_items} em {len(categories)} categorias:")
    cat_names = {
        0: "Swords (Espadas)",
        1: "Axes (Machados)",
        2: "Maces & Scepters (Maças e Cetros)",
        3: "Spears (Lanças)",
        4: "Bows & Crossbows (Arcos e Bestas)",
        5: "Staffs & Books (Cajados e Livros)",
        6: "Shields (Escudos)",
        7: "Helms (Elmos)",
        8: "Armors (Peitorais)",
        9: "Pants (Calças)",
        10: "Gloves (Luvas)",
        11: "Boots (Botas)",
        12: "Wings, Orbs, Seeds (Asas, Orbes e Sementes)",
        13: "Pets, Rings, Pendants, Capes (Mascotes, Joias e Capas)",
        14: "Potions, Jewels, Quest Items (Poções, Joias e Quests)",
        15: "Scrolls of Skill (Pergaminhos de Habilidade)",
    }
    for c_idx in sorted(categories.keys()):
        print(f"  Categoria {c_idx:2d} ({cat_names.get(c_idx, 'Outros')}): {len(categories[c_idx])} itens")
        
    models = check_client_models()
    print(f"\nArquivos BMD Oficiais no Cliente:")
    for k, v in models.items():
        print(f"  {k}: {len(v)} arquivos")
