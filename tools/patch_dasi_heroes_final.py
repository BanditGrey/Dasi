import os
import sys

def patch_app_js():
    path = r'd:\Dasi\src\client\dev_viewer\app.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add hero classes to artData
    target_art_entry = "      BLOOD_CASTLE: {"
    if target_art_entry not in content:
        print("[app.js] BLOOD_CASTLE entry not found!")
        return False

    # Check if already patched
    if "HERO_DK:" in content:
        print("[app.js] artData HERO_DK already present.")
    else:
        # We find end of BLOOD_CASTLE
        idx = content.find("      BLOOD_CASTLE: {")
        end_idx = content.find("      }\n    };", idx)
        if end_idx == -1:
            end_idx = content.find("      }\r\n    };", idx)

        if end_idx != -1:
            hero_art_entries = """      },
      HERO_DK: {
        title: 'Dark Knight (Blade Knight / Cavaleiro do Sangue)',
        desc: 'Guerreiro de combate brutal corpo a corpo revestido na armadura Dragon Set escarlate com espinhos nas ombreiras e alto-relevo draconiano. Empunha a colossal Dragon Blade runada de fogo sagrado e desdobra as imponentes Wings of Dragon.',
        src: 'art/dark_knight_concept_art.jpg',
        color: '#ef4444',
        border: '#b91c1c',
        features: [
          'Dragon Set PBR: Placas carmesins com alto-relevo draconiano e ombreiras duplas espinhadas.',
          'Dragon Blade: Lâmina pesada de 1.8m com runas flamejantes e gema rubi pulsante.',
          'Wings of Dragon: Asas dracônicas com membranas coriáceas e chamas místicas.',
          'Modelo 3D Real GLB: 266 KB otimizado via Blender 5.2 LTS com mapas PBR de metal e escamas.'
        ]
      },
      HERO_DW: {
        title: 'Dark Wizard (Soul Master / Arquimago do Caos)',
        desc: 'Feiticeiro místico e mestre da canalização arcana levitando no Grand Soul Set safira e violeta com filigranas de ouro. Empunha o lendário Cajado de Kundun com orbe giratória de mana e desdobra as Wings of Soul estelares.',
        src: 'art/dark_wizard_concept_art.jpg',
        color: '#38bdf8',
        border: '#0284c7',
        features: [
          'Grand Soul Set PBR: Túnica e placas safiras reluzentes com forro de veludo arcano.',
          'Cajado de Kundun: Haste espiral dourada coroada por anéis giroscópicos e orbe giratória.',
          'Wings of Soul: Asas celestes luminescentes com partículas astrais azuis.',
          'Modelo 3D Real GLB: 519 KB gerado no Blender 5.2 LTS com shader emissivo arcano.'
        ]
      },
      HERO_ELF: {
        title: 'Fairy Elf (Muse Elf / Vigia da Floresta)',
        desc: 'Nobre arqueira da floresta de Noria em armadura Spirit Set esmeralda e dourada com diadema de louros. Empunha o Celestial Bow com flechas de fótons e sustenta as etéreas Wings of Spirits com transludicência feérica.',
        src: 'art/fairy_elf_concept_art.jpg',
        color: '#34d399',
        border: '#059669',
        features: [
          'Spirit Set PBR: Malha esmeralda leve com protetores e filigranas orgânicas da árvore.',
          'Celestial Bow: Arco recurvo de madeira viva pulsante e corda de luz celestial.',
          'Wings of Spirits: Asas de fada com gradiente translúcido e poeira feérica.',
          'Modelo 3D Real GLB: 365 KB com alinhamento esbelto e materiais PBR de folhagem/ouro.'
        ]
      },
      HERO_MG: {
        title: 'Magic Gladiator (Duel Master / Gladiador Rúnico)',
        desc: 'Híbrido lendário combinando esgrima pesada e feitiçaria destrutiva. Revestido no Hurricane Set de obsidiana com circuitos rúnicos cianos, Wings of Darkness com bordas de lâminas afiadas, empunhando a Fire Blade flamejante e a Thunder Blade relampejante.',
        src: 'art/magic_gladiator_concept_art.jpg',
        color: '#06b6d4',
        border: '#0891b2',
        features: [
          'Hurricane Set PBR: Armadura de obsidiana com circuitos rúnicos cianos e peitoral aberto.',
          'Dual Blades: Espada do Fogo Carmesim (Mão Direita) e Espada do Trovão Ciano (Mão Esquerda).',
          'Wings of Darkness: Asas mecânico-arcanas com bordas de navalha e penas de aço.',
          'Modelo 3D Real GLB: 228 KB com suporte a dual-wielding e emissão rúnica sincronizada.'
        ]
      },
      HERO_DL: {
        title: 'Dark Lord (Lord Emperor / Soberano Imperial)',
        desc: 'Imperador supremo das terras de Lorencia. Traja o opulento Dark Master Set de aço negro e ouro 24k com capa escarlate imperial. Empunha o Cetro Real Imperial com cabeça solar e comanda o corvo espectral Dark Raven.',
        src: 'art/dark_lord_concept_art.jpg',
        color: '#fbbf24',
        border: '#d97706',
        features: [
          'Dark Master Set PBR: Armadura de aço negro temperado com adornos em ouro puro 24k.',
          'Cetro Real & Dark Raven: Cetro solar imperial e Corvo Espectral pousado no ombro.',
          'Capa Imperial de Veludo: Manto escarlate damascado com forro dourado.',
          'Modelo 3D Real GLB: 326 KB com hierarquia completa de cetro, coroa e mascote Dark Raven.'
        ]
      }"""
            content = content[:end_idx] + hero_art_entries + content[end_idx+7:]
            print("[app.js] Hero classes added to artData.")

    # 2. Add aliases in artData
    if "artData.DK = artData.HERO_DK;" not in content:
        insert_marker = "const updateArtDisplay = (biome) => {"
        if insert_marker in content:
            alias_code = """    artData.DK = artData.HERO_DK;
    artData.DW = artData.HERO_DW;
    artData.ELF = artData.HERO_ELF;
    artData.MG = artData.HERO_MG;
    artData.DL = artData.HERO_DL;

    """
            content = content.replace(insert_marker, alias_code + insert_marker)
            print("[app.js] Aliases artData.DK added.")

    # 3. Patch updateSplitArtDisplay resolution
    old_canonical = """      const canonicalBiome = biome && biome.includes('_') ? {
        LOR: 'LORENCIA', NOR: 'NORIA', DEV: 'DEVIAS', DNG: 'DUNGEON',
        LT: 'LOST_TOWER', ATL: 'ATLANS', TAR: 'TARKAN', ICA: 'ICARUS'
      }[biome.split('_')[0]] || biome : (biome || 'LORENCIA');"""

    new_canonical = """      const canonicalBiome = artData[biome] ? biome : (biome && biome.includes('_') ? {
        LOR: 'LORENCIA', NOR: 'NORIA', DEV: 'DEVIAS', DNG: 'DUNGEON',
        LT: 'LOST_TOWER', ATL: 'ATLANS', TAR: 'TARKAN', ICA: 'ICARUS',
        HERO: biome
      }[biome.split('_')[0]] || biome : (biome || 'LORENCIA'));"""

    if old_canonical in content:
        content = content.replace(old_canonical, new_canonical)
        print("[app.js] updateSplitArtDisplay canonicalBiome patched.")

    # 4. Patch btnToggleSplit to support HERO category
    old_toggle = """        if (!isShown) {
          const activeSubBtn = document.querySelector('.btn-sub-entity.active[data-cat="ENVIRONMENT"]');
          const currentBiome = (activeSubBtn && activeSubBtn.getAttribute('data-id')) || 'LORENCIA';
          this.updateSplitArtDisplay(currentBiome);
        }"""

    new_toggle = """        if (!isShown) {
          if (currentCategory === 'HERO') {
            this.updateSplitArtDisplay('HERO_' + currentHero);
          } else {
            const activeSubBtn = document.querySelector('.btn-sub-entity.active[data-cat="ENVIRONMENT"]');
            const currentBiome = (activeSubBtn && activeSubBtn.getAttribute('data-id')) || 'LORENCIA';
            this.updateSplitArtDisplay(currentBiome);
          }
        }"""

    if old_toggle in content:
        content = content.replace(old_toggle, new_toggle)
        print("[app.js] btnToggleSplit patched for HERO category.")

    # 5. Patch subEntityButtons HERO click to trigger updateSplitArtDisplay
    old_hero_click = """        if (cat === 'HERO') {
          currentHero = id;
          this.viewer3DInstance.selectEntity('HERO', currentHero, { setTier: currentSetTier });
          if (badgeMode) badgeMode.textContent = `MODO: HERÓI (${currentHero})`;
          updateAnimButtons('HERO', currentHero);
        }"""

    new_hero_click = """        if (cat === 'HERO') {
          currentHero = id;
          this.viewer3DInstance.selectEntity('HERO', currentHero, { setTier: currentSetTier });
          if (badgeMode) badgeMode.textContent = `MODO: HERÓI (${currentHero})`;
          updateAnimButtons('HERO', currentHero);
          if (this.updateSplitArtDisplay) this.updateSplitArtDisplay('HERO_' + currentHero);
        }"""

    if old_hero_click in content:
        content = content.replace(old_hero_click, new_hero_click)
        print("[app.js] subEntityButtons HERO click patched.")

    # 6. Patch switchHeroClass to trigger updateSplitArtDisplay if active
    old_switch_class = """    if (this.viewer3DInstance && this.viewer3DInstance.currentCategory === 'HERO') {
      const tierMap = { DK: 'DRAGON', DW: 'GRAND_SOUL', ELF: 'SPIRIT', MG: 'HURRICANE', DL: 'DARK_MASTER' };
      this.viewer3DInstance.selectEntity('HERO', newClass, { setTier: tierMap[newClass] || 'DRAGON' });
    }"""

    new_switch_class = """    if (this.viewer3DInstance && this.viewer3DInstance.currentCategory === 'HERO') {
      const tierMap = { DK: 'DRAGON', DW: 'GRAND_SOUL', ELF: 'SPIRIT', MG: 'HURRICANE', DL: 'DARK_MASTER' };
      this.viewer3DInstance.selectEntity('HERO', newClass, { setTier: tierMap[newClass] || 'DRAGON' });
    }
    if (this.updateSplitArtDisplay && this.viewer3DInstance && this.viewer3DInstance.currentCategory === 'HERO') {
      this.updateSplitArtDisplay('HERO_' + newClass);
    }"""

    if old_switch_class in content:
        content = content.replace(old_switch_class, new_switch_class)
        print("[app.js] switchHeroClass patched for updateSplitArtDisplay.")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("[app.js] Successfully patched.")
    return True

def patch_index_html():
    path = r'd:\Dasi\src\client\dev_viewer\index.html'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update modal title
    content = content.replace(
        '<h3>GALERIA OFICIAL DE CONCEPT ART (10 CENÁRIOS AAA)</h3>',
        '<h3>GALERIA OFICIAL DE CONCEPT ART (10 CENÁRIOS & 5 CLASSES AAA)</h3>'
    )

    # 2. Add hero buttons to art-tabs-row
    hero_tabs = """          <!-- 5 Classes Canônicas de Heróis -->
          <button class="btn-art-tab" data-biome="HERO_DK" style="padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #fca5a5; cursor: pointer; font-weight: bold; font-family: 'Rajdhani', sans-serif;">🛡️ Dark Knight</button>
          <button class="btn-art-tab" data-biome="HERO_DW" style="padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.15); color: #7dd3fc; cursor: pointer; font-weight: bold; font-family: 'Rajdhani', sans-serif;">🔮 Dark Wizard</button>
          <button class="btn-art-tab" data-biome="HERO_ELF" style="padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.15); color: #6ee7b7; cursor: pointer; font-weight: bold; font-family: 'Rajdhani', sans-serif;">🏹 Fairy Elf</button>
          <button class="btn-art-tab" data-biome="HERO_MG" style="padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.4); background: rgba(6, 182, 212, 0.15); color: #67e8f9; cursor: pointer; font-weight: bold; font-family: 'Rajdhani', sans-serif;">⚡ Magic Gladiator</button>
          <button class="btn-art-tab" data-biome="HERO_DL" style="padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.15); color: #fcd34d; cursor: pointer; font-weight: bold; font-family: 'Rajdhani', sans-serif;">👑 Dark Lord</button>"""

    target_button = '<button class="btn-art-tab" data-biome="BLOOD_CASTLE" style="padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(185, 28, 28, 0.15); color: #cbd5e1; cursor: pointer; font-weight: bold; font-family: \'Rajdhani\', sans-serif;">🩸 Blood Castle</button>'
    
    if target_button in content and 'data-biome="HERO_DK"' not in content:
        content = content.replace(target_button, target_button + '\n' + hero_tabs)
        print("[index.html] Hero tabs added.")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("[index.html] Successfully patched.")
    return True

def patch_dasi3d_content_js():
    path = r'd:\Dasi\src\client\dev_viewer\dasi3dContent.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Hide procedural torsoGroup when real GLB loads
    old_load = """  // Carregamento Assíncrono do Modelo GLB Oficial (Blender 5.2) se disponível
  if (options.useRealGLB !== false && typeof GLTFLoader !== 'undefined') {
    loadRealHeroGLTF(heroClass, heroRoot, THREE, (glbModel) => {
      // Ajusta escala e posição para casar com o pedestal
      glbModel.position.set(0, 0, 0);
      parts.realGLB = glbModel;
    });
  }"""

    new_load = """  // Carregamento Assíncrono do Modelo GLB Oficial (Blender 5.2) se disponível
  if (options.useRealGLB !== false && typeof GLTFLoader !== 'undefined') {
    loadRealHeroGLTF(heroClass, heroRoot, THREE, (glbModel) => {
      // Ajusta escala e posição para casar com o pedestal
      glbModel.position.set(0, 0, 0);
      parts.realGLB = glbModel;
      if (torsoGroup) {
        torsoGroup.visible = false;
      }
      const statusBadge = document.getElementById('lbl-real-scenery-status');
      if (statusBadge) {
        statusBadge.textContent = '🎮 Modelo 3D: Real GLB (Blender 5.2 PBR)';
        statusBadge.style.color = '#34d399';
      }
    });
  }"""

    if old_load in content:
        content = content.replace(old_load, new_load)
        print("[dasi3dContent.js] Real GLB loading hook patched.")

    # 2. Update realGLB idle animation in updateAnim
    old_anim = """  const updateAnim = (animName, time, delta) => {
    // 1. Rotação do Anel Rúnico
    if (parts.pedestalRing) {
      parts.pedestalRing.rotation.z = time * 0.25;
    }"""

    new_anim = """  const updateAnim = (animName, time, delta) => {
    // 0. Animação Sutil do Modelo Real GLB se ativo
    if (parts.realGLB) {
      parts.realGLB.position.y = Math.sin(time * 2.2) * 0.015;
      parts.realGLB.traverse((c) => {
        if (c.name && c.name.includes('Wing_L')) {
          c.rotation.y = Math.sin(time * 3.0) * 0.12;
        } else if (c.name && c.name.includes('Wing_R')) {
          c.rotation.y = -Math.sin(time * 3.0) * 0.12;
        } else if (c.name && c.name.includes('Raven')) {
          c.position.y = Math.sin(time * 4.0) * 0.02;
        }
      });
    }

    // 1. Rotação do Anel Rúnico
    if (parts.pedestalRing) {
      parts.pedestalRing.rotation.z = time * 0.25;
    }"""

    if old_anim in content:
        content = content.replace(old_anim, new_anim)
        print("[dasi3dContent.js] updateAnim patched for realGLB.")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("[dasi3dContent.js] Successfully patched.")
    return True

if __name__ == '__main__':
    patch_app_js()
    patch_index_html()
    patch_dasi3d_content_js()
