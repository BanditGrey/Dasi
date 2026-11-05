"""
Atualiza src/client/dev_viewer/index.html com:
1. Avatar 3D interativo no Header Banner
2. Botão de Trocar Classe (Salão dos Heróis)
3. Sub-seletores de Heróis com as 5 Classes (DK, DW, ELF, MG, DL)
4. Modal do Salão dos Heróis com grade de Avatares 3D
"""

from pathlib import Path

path = Path("src/client/dev_viewer/index.html")
text = path.read_text(encoding="utf-8")

# 1. Atualiza Character Banner
old_banner = '''    <!-- Character Banner -->
    <div class="char-banner">
      <div class="char-avatar">🛡️</div>
      <div class="char-info">
        <div class="char-name-row">
          <span class="char-name" id="char-name">Blade Knight</span>
          <span class="char-class-badge" id="char-class">DK</span>
          <span class="char-level-badge">Nível <strong id="char-level">250</strong></span>
        </div>'''

new_banner = '''    <!-- Character Banner com Avatar 3D WebGL Interativo -->
    <div class="char-banner">
      <div class="char-avatar-container" id="char-avatar-container" title="Clique para trocar de classe ou inspecionar o Avatar 3D">
        <canvas id="char-avatar-canvas" class="char-avatar-canvas" width="68" height="68"></canvas>
        <span class="avatar-class-tag" id="avatar-class-tag">DK</span>
        <div class="avatar-glow-ring"></div>
      </div>
      <div class="char-info">
        <div class="char-name-row">
          <span class="char-name" id="char-name">Blade Knight</span>
          <span class="char-class-badge" id="char-class">DK</span>
          <span class="char-level-badge">Nível <strong id="char-level">250</strong></span>
          <button class="btn-switch-class-modal" id="btn-switch-class-modal" title="Abrir Salão dos Heróis e Selecionar Classe">⚔️ Trocar Classe (Avatares 3D)</button>
        </div>'''

if old_banner in text:
    text = text.replace(old_banner, new_banner)
    print("[1] Banner atualizado com Avatar 3D!")
else:
    print("[1] Alerta: old_banner não encontrado exatamente, tentando busca flexível...")
    idx1 = text.find('<!-- Character Banner -->')
    idx2 = text.find('<div class="char-stats-strip">', idx1)
    if idx1 != -1 and idx2 != -1:
        text = text[:idx1] + new_banner + "\n" + text[idx2:]
        print("[1] Banner substituído por bloco posicional!")

# 2. Atualiza Sub-seletores de Heróis (sub-group-heroes)
old_sub = '''          <!-- Sub-seletores de Heróis -->
          <div class="control-group" id="sub-group-heroes" style="display: none;">
            <label class="control-label">CLASSE HEROICA & ARMAS:</label>
            <div class="sub-buttons-grid">
              <button class="btn-sub-entity active" data-cat="HERO" data-id="DK">⚔️ Dark Knight</button>
              <button class="btn-sub-entity" data-cat="HERO" data-id="DW">🔮 Dark Wizard</button>
              <button class="btn-sub-entity" data-cat="HERO" data-id="ELF">🪽 Fairy Elf</button>
            </div>
            <label class="control-label" style="margin-top: 6px;">SET DE ARMADURA:</label>
            <div class="tier-buttons-row">
              <button class="btn-set-tier active" data-tier="DRAGON">Dragon</button>
              <button class="btn-set-tier" data-tier="PHOENIX">Phoenix</button>
              <button class="btn-set-tier" data-tier="GRAND_SOUL">Grand Soul</button>
              <button class="btn-set-tier" data-tier="SPIRIT">Spirit</button>
            </div>
          </div>'''

new_sub = '''          <!-- Sub-seletores de Heróis (As 5 Classes Canônicas de Continent of Legend) -->
          <div class="control-group" id="sub-group-heroes" style="display: none;">
            <label class="control-label">CLASSE HEROICA & ARMAS:</label>
            <div class="sub-buttons-grid">
              <button class="btn-sub-entity active" data-cat="HERO" data-id="DK">⚔️ Dark Knight</button>
              <button class="btn-sub-entity" data-cat="HERO" data-id="DW">🔮 Dark Wizard</button>
              <button class="btn-sub-entity" data-cat="HERO" data-id="ELF">🪽 Fairy Elf</button>
              <button class="btn-sub-entity" data-cat="HERO" data-id="MG">⚡ Magic Gladiator</button>
              <button class="btn-sub-entity" data-cat="HERO" data-id="DL">👑 Dark Lord</button>
            </div>
            <label class="control-label" style="margin-top: 6px;">SET DE ARMADURA:</label>
            <div class="tier-buttons-row">
              <button class="btn-set-tier active" data-tier="DRAGON">Dragon</button>
              <button class="btn-set-tier" data-tier="PHOENIX">Phoenix</button>
              <button class="btn-set-tier" data-tier="GRAND_SOUL">Grand Soul</button>
              <button class="btn-set-tier" data-tier="SPIRIT">Spirit</button>
              <button class="btn-set-tier" data-tier="HURRICANE">Hurricane</button>
              <button class="btn-set-tier" data-tier="DARK_MASTER">Dark Master</button>
            </div>
          </div>'''

if old_sub in text:
    text = text.replace(old_sub, new_sub)
    print("[2] Sub-grupo de heróis atualizado com MG e DL!")
else:
    print("[2] Alerta: old_sub não encontrado exatamente, buscando posicional...")
    idx_s1 = text.find('id="sub-group-heroes"')
    if idx_s1 != -1:
        cg_start = text.rfind('<div class="control-group"', 0, idx_s1)
        cg_end = text.find('<!-- Sub-seletores de Monstros -->', idx_s1)
        text = text[:cg_start] + new_sub + "\n\n          " + text[cg_end:]
        print("[2] Sub-grupo de heróis substituído por bloco posicional!")

# 3. Adiciona Modal do Salão dos Heróis antes de <script type="module" src="app.js"></script>
modal_code = '''  <!-- 5. Modal do Salão dos Heróis & Avatares 3D (As 5 Classes Canônicas) -->
  <div class="dasi-modal-overlay" id="modal-hero-classes" style="display: none;">
    <div class="dasi-modal-card hero-classes-modal-card" style="max-width: 1120px; width: 95%;">
      <div class="dasi-modal-header">
        <div class="modal-title-wrap">
          <span class="modal-icon">🏛️</span>
          <h3>SALÃO DOS HERÓIS — SELEÇÃO DE CLASSES & AVATARES 3D</h3>
        </div>
        <button class="btn-close-modal" id="btn-close-class-modal">&times;</button>
      </div>
      <div class="dasi-modal-body" style="padding: 18px;">
        <p class="modal-subtitle" style="margin-top: 0; margin-bottom: 16px; color: #94a3b8; font-size: 0.95rem;">
          Selecione uma das <strong>5 Classes Canônicas Originais de Continent of Legend</strong>. Cada arquétipo possui anatomia 3D única, armas forjadas, asas lendárias e árvore de progressão física.
        </p>
        <div class="hero-classes-grid" id="hero-classes-grid">
          <!-- Gerado dinamicamente via dasi3dAvatar.js -->
        </div>
      </div>
      <div class="dasi-modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 12px; color: #64748b;">
          ⚡ <em>Modelos compilados nativamente em GLB PBR via Blender 5.2 LTS com suporte a shader glow (+0 a +15).</em>
        </div>
        <button class="btn-close-modal-footer" id="btn-close-class-modal-footer" onclick="document.getElementById('modal-hero-classes').style.display='none'">Fechar Salão</button>
      </div>
    </div>
  </div>

'''

script_tag = '<script type="module" src="app.js"></script>'
if modal_code not in text:
    text = text.replace(script_tag, modal_code + script_tag)
    print("[3] Modal do Salão dos Heróis injetado antes do app.js!")

path.write_text(text, encoding="utf-8")
print("[OK] src/client/dev_viewer/index.html atualizado com sucesso!")
