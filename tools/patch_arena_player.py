"""
Adiciona updatePlayerHeroClass em src/client/dev_viewer/dasi3dRealtimeArena.js
"""
from pathlib import Path

path = Path("src/client/dev_viewer/dasi3dRealtimeArena.js")
text = path.read_text(encoding="utf-8")

old_code = """    this.scene.add(this.playerGroup);
  }

  // ==========================================================================
  // EVENTOS DE INTERAÇÃO"""

new_code = """    this.scene.add(this.playerGroup);
  }

  /**
   * Atualiza dinamicamente a malha 3D e armadura do herói na Arena ao trocar de classe
   */
  updatePlayerHeroClass(newClass) {
    if (!this.playerGroup) return;
    if (this.playerHero && this.playerHero.group) {
      this.playerGroup.remove(this.playerHero.group);
    }
    const setTierMap = {
      DK: 'DRAGON',
      DW: 'GRAND_SOUL',
      ELF: 'SPIRIT',
      MG: 'HURRICANE',
      DL: 'DARK_MASTER'
    };
    this.playerHero = createHero(newClass, { setTier: setTierMap[newClass] || 'DRAGON' }, THREE);
    this.playerGroup.add(this.playerHero.group);
    console.log(`[Dasi3DArena] Malha do jogador 3D atualizada para: ${newClass}`);
  }

  // ==========================================================================
  // EVENTOS DE INTERAÇÃO"""

if old_code in text:
    text = text.replace(old_code, new_code)
    path.write_text(text, encoding="utf-8")
    print("[OK] dasi3dRealtimeArena.js atualizado com updatePlayerHeroClass!")
else:
    # Caso haja pequenas variações de espaço ou quebras
    idx = text.find('this.scene.add(this.playerGroup);')
    if idx != -1:
        end_brace = text.find('}', idx)
        text = text[:end_brace+1] + "\n\n  updatePlayerHeroClass(newClass) {\n    if (!this.playerGroup) return;\n    if (this.playerHero && this.playerHero.group) {\n      this.playerGroup.remove(this.playerHero.group);\n    }\n    const setTierMap = { DK: 'DRAGON', DW: 'GRAND_SOUL', ELF: 'SPIRIT', MG: 'HURRICANE', DL: 'DARK_MASTER' };\n    this.playerHero = createHero(newClass, { setTier: setTierMap[newClass] || 'DRAGON' }, THREE);\n    this.playerGroup.add(this.playerHero.group);\n    console.log(`[Dasi3DArena] Malha do jogador 3D atualizada para: ${newClass}`);\n  }\n" + text[end_brace+1:]
        path.write_text(text, encoding="utf-8")
        print("[OK] dasi3dRealtimeArena.js atualizado via fallback posicional!")
    else:
        print("[ERRO] Ponto de inserção não encontrado!")
