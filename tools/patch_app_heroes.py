"""
Patch app.js com:
1. Import de Dasi3DAvatarRenderer, DasiHeroClassModal e CLASS_DEFINITIONS
2. Chamada de init3DAvatarSystem no construtor
3. Implementação de init3DAvatarSystem e switchHeroClass
4. Atualização de updateCharacterUI com avatar3DRenderer e avatar-class-tag
5. Atualização de updateAnimButtons com MG e DL
"""
from pathlib import Path

path = Path("src/client/dev_viewer/app.js")
text = path.read_text(encoding="utf-8")

# 1. Import
old_import = "import { Dasi3DFeatureViewer } from './dasi3dViewer.js';"
new_import = """import { Dasi3DFeatureViewer } from './dasi3dViewer.js';
import { Dasi3DAvatarRenderer, DasiHeroClassModal, CLASS_DEFINITIONS } from './dasi3dAvatar.js';"""

if old_import in text:
    text = text.replace(old_import, new_import, 1)
    print("[1] Import adicionado em app.js!")

# 2. Construtor: chamada de init3DAvatarSystem
old_ctor = """    this.initCombatArena();
    this.bindEvents();
    this.connect();"""

new_ctor = """    this.initCombatArena();
    this.bindEvents();
    this.init3DAvatarSystem();
    this.connect();"""

if old_ctor in text:
    text = text.replace(old_ctor, new_ctor, 1)
    print("[2] init3DAvatarSystem adicionado no construtor!")
else:
    idx = text.find('this.initCombatArena();')
    if idx != -1:
        text = text[:idx] + "this.initCombatArena();\n    this.bindEvents();\n    this.init3DAvatarSystem();\n    this.connect();\n" + text[text.find('this.connect();', idx) + len('this.connect();'):]
        print("[2] init3DAvatarSystem adicionado no construtor (posicional)!")

# 3. Adiciona init3DAvatarSystem e switchHeroClass
methods_code = """
  // ==========================================================================
  // SISTEMA DE AVATARES 3D & SALÃO DOS HERÓIS (AS 5 CLASSES CANÔNICAS)
  // ==========================================================================
  init3DAvatarSystem() {
    const avatarCanvas = document.getElementById('char-avatar-canvas');
    if (avatarCanvas) {
      this.avatar3DRenderer = new Dasi3DAvatarRenderer('char-avatar-canvas', this.charClass || 'DK');
    }
    this.heroClassModal = new DasiHeroClassModal(this);
  }

  switchHeroClass(newClass) {
    const classDef = CLASS_DEFINITIONS[newClass];
    if (!classDef) return;

    this.charClass = newClass;

    const nameEl = document.getElementById('char-name');
    const classEl = document.getElementById('char-class');
    const avatarTagEl = document.getElementById('avatar-class-tag');

    if (nameEl) nameEl.textContent = classDef.title;
    if (classEl) classEl.textContent = classDef.id;
    if (avatarTagEl) avatarTagEl.textContent = classDef.id;

    if (this.character) {
      this.character.characterClass = newClass;
      this.character.name = classDef.title;
      this.character.strength = classDef.baseStats.str;
      this.character.agility = classDef.baseStats.agi;
      this.character.vitality = classDef.baseStats.vit;
      this.character.energy = classDef.baseStats.ene;
      this.updateCharacterUI(this.character);
    }

    if (this.avatar3DRenderer) {
      this.avatar3DRenderer.setClass(newClass);
    }

    // Atualiza Habilidades na Barra Idle do HUD
    const slot1 = document.getElementById('slot-skill-cyclone');
    const slot2 = document.getElementById('slot-skill-deathstab');
    if (classDef.skills.length >= 2) {
      if (slot1) {
        slot1.title = `Auto-Skill: ${classDef.skills[0].name} (${classDef.skills[0].desc})`;
        const iconEl = slot1.querySelector('.idle-skill-icon');
        const lblEl = slot1.querySelector('.idle-skill-label');
        if (iconEl) iconEl.textContent = classDef.skills[0].icon;
        if (lblEl) lblEl.textContent = classDef.skills[0].name;
      }
      if (slot2) {
        slot2.title = `Auto-Skill: ${classDef.skills[1].name} (${classDef.skills[1].desc})`;
        const iconEl = slot2.querySelector('.idle-skill-icon');
        const lblEl = slot2.querySelector('.idle-skill-label');
        if (iconEl) iconEl.textContent = classDef.skills[1].icon;
        if (lblEl) lblEl.textContent = classDef.skills[1].name;
      }
    }

    // Atualiza a malha do Herói na Arena 3D
    if (this.arena3D && typeof this.arena3D.updatePlayerHeroClass === 'function') {
      this.arena3D.updatePlayerHeroClass(newClass);
    }

    // Se estiver no Painel 3D e visualizando Herói, atualiza também
    if (this.viewer3DInstance && this.viewer3DInstance.currentCategory === 'HERO') {
      const tierMap = { DK: 'DRAGON', DW: 'GRAND_SOUL', ELF: 'SPIRIT', MG: 'HURRICANE', DL: 'DARK_MASTER' };
      this.viewer3DInstance.selectEntity('HERO', newClass, { setTier: tierMap[newClass] || 'DRAGON' });
    }

    if (typeof sfx !== 'undefined' && sfx) {
      sfx.playLevelUpSound();
    }

    this.log(`⚔️👑 [SALÃO DOS HERÓIS] Você assumiu a classe ${classDef.name} (${classDef.title})!`, 'success');
  }
"""

marker_update_ui = "  updateCharacterUI(char) {"
idx_ui = text.find(marker_update_ui)
if idx_ui != -1:
    text = text[:idx_ui] + methods_code + "\n" + text[idx_ui:]
    print("[3] init3DAvatarSystem e switchHeroClass inseridos antes de updateCharacterUI!")

# 4. Atualizar updateCharacterUI para refletir avatarTag e avatar3DRenderer
old_ui_block = """    document.getElementById('char-name').textContent = char.name;
    document.getElementById('char-class').textContent = char.characterClass;"""

new_ui_block = """    document.getElementById('char-name').textContent = char.name;
    document.getElementById('char-class').textContent = char.characterClass;
    const avatarTagEl = document.getElementById('avatar-class-tag');
    if (avatarTagEl) avatarTagEl.textContent = char.characterClass;
    if (this.avatar3DRenderer && this.avatar3DRenderer.currentClass !== char.characterClass) {
      this.avatar3DRenderer.setClass(char.characterClass);
    }"""

if old_ui_block in text:
    text = text.replace(old_ui_block, new_ui_block, 1)
    print("[4] updateCharacterUI atualizado com avatarTag e avatar3DRenderer!")

# 5. Atualizar updateAnimButtons para MG e DL
old_anim_branch = """        } else if (id === 'ELF') {
          if (btnSkill1) { btnSkill1.textContent = '🏹 Triple Shot [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '💚 Blessing / Heal [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        }"""

new_anim_branch = """        } else if (id === 'ELF') {
          if (btnSkill1) { btnSkill1.textContent = '🏹 Triple Shot [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '💚 Blessing / Heal [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        } else if (id === 'MG') {
          if (btnSkill1) { btnSkill1.textContent = '🔥 Fire Slash [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '⚡ Power Slash [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        } else if (id === 'DL') {
          if (btnSkill1) { btnSkill1.textContent = '💥 Fireburst [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '🌋 Earthquake [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        }"""

if old_anim_branch in text:
    text = text.replace(old_anim_branch, new_anim_branch, 1)
    print("[5] updateAnimButtons atualizado com MG e DL!")

path.write_text(text, encoding="utf-8")
print("[OK] app.js atualizado com sucesso!")
