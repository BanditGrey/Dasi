# Arquitetura Técnica: Interface do Usuário (UI/HUD) 100% 3D & Diegética no Unreal Engine 5

> **Diretiva Mandatória de Produção:** Toda a interface do projeto **Dasi** é concebida em **tecnologia 3D nativa** (Viewport 3D em tempo real, materiais com simulação volumétrica de fluido, iluminação Lumen e malhas Nanite/Skeletal). As capturas, ícones e layouts clássicos do Continent of Legend (MU Online) atuam **exclusivamente como referências conceituais de proporção e identidade**.

---

## 1. Visão Geral & Filosofia de Design da Interface

No MU Online clássico (anos 2000), a interface era composta por *bitmaps estáticos 2D pré-renderizados* em resolução 800x600 ou 1024x768. Os globos de vida e mana eram sprites 2D com máscaras de corte vertical e o inventário desenhava ícones 2D estáticos sobre uma grade opaca.

No **Dasi**, a interface é transposta para o ecossistema gráfico de nova geração:
1. **Paperdoll 3D Dinâmico em Tempo Real:** Ao abrir a janela de personagem/inventário, o jogador interage com um Viewport 3D renderizado em alta definição (`UTextureRenderTarget2D` ou `SSceneCapture`). O herói aparece em pose de combate/respiro com suas armaduras modulares, asas físicas Chaos Cloth ondulando, armas empunhadas com o shader de refinamento dinâmico (+0 a +15) e rotação orbital de 360° por drag do mouse.
2. **Globos 3D de Vida (HP) e Mana (MP) Volumétricos:** Esferas de vidro lapidado com relevo gótico e ouro envelhecido, contendo líquidos tridimensionais com simulação física de fluido via shader HLSL. Quando o jogador sofre dano ou gasta mana, o fluido sofre turbulência, oscilação de menisco e bolhas volumétricas com refração IOR 1.33 e reflexos de luz Lumen.
3. **Tooltip de Inspeção com Mini-Viewport 3D:** Ao passar o cursor ou selecionar qualquer item (espada, elmo, joia, asa), o card de tooltip projeta uma miniatura 3D giratória em tempo real, permitindo visualizar a lâmina com faíscas elétricas (+11), a aura dourada celestial (+15) ou as facetas da *Jewel of Blessing*.
4. **Placas de Alvo 3D & Barra de Chefes (World Boss HUD):** Placas tridimensionais ancoradas na tela ou no espaço do mundo sobre os inimigos, com indicação de fraqueza elemental, postura (*Poise/Stagger*) e barras segmentadas de chefes mundiais (Invasões Douradas, Kundun, Gorgon).
5. **Action Bar & Atalhos Modernos:** Transição do antigo clique de botão direito para um esquema moderno de *Action RPG* (teclas `Q`, `W`, `E`, `R`, `Space` para esquiva tática, `LMB` para ataque primário, `RMB` para habilidade canalizada de arma).

---

## 2. Decisões Arquiteturais Homologadas (Especificação Final)

Após alinhamento técnico e de game design, a interface de **Dasi** adota os três pilares definitivos:
1. **HUD em Centro Unificado em Arco:**
   - Ao contrário do MU legado que espalhava os globos de HP e Mana nos cantos distantes da tela (pensado para monitores CRT 4:3 dos anos 2000), no Dasi os globos volumétricos 3D de Vida e Mana **flanqueiam diretamente a barra de ação central em um arco integrado e coeso**.
   - Arcos superiores curvos exibem o *Shield Defense* (SD para PvP) e a *Estamina/Postura* (para esquivas táticas).
   - O campo de visão panorâmico do jogador (16:9 e 21:9 UltraWide) fica 100% limpo e imersivo, mantendo a telemetria vital na visão periférica imediata.
2. **Action RPG Dinâmico:**
   - Controle de combate moderno sem necessidade de cliques em menus de magias:
     - `Q`: Poção de Vida Instantânea com cooldown tático.
     - `W`: Poção de Mana Instantânea.
     - `E`: Habilidade de Área Primária (*Twisting Slash / Cyclone*).
     - `R`: Habilidade Perfurante / Letal (*Death Stab / Penetration*).
     - `Space`: Esquiva Física Tática (Rolamento com I-Frames e consumo de Estamina).
     - `LMB`: Ataque Primário com arma equipada (colisões físicas 3D e sweep trace).
     - `RMB`: Habilidade Rúnica de Arma com buffer de combos.
     - `F`: Coleta de drops físicos no solo (*Pickup* ao som celestial).
3. **Janela Dupla Lado a Lado (Paperdoll 3D + Bolsa 8x8):**
   - Ao pressionar `I` ou `V`, abre-se a janela gótica de inventário dividida em dois painéis harmoniosos:
     - **Painel Esquerdo (Viewport 3D do Herói):** Manequim 3D em tempo real com iluminação de estúdio de 3 pontos, Chaos Cloth em capas e asas, shaders dinâmicos de refinamento (+0 a +15) e rotação 360° por drag do mouse, circundado pelos 11 slots físicos de equipamento.
     - **Painel Direito (Grade 8x8 de Itens):** Bolsa com células de relevo chanfrado em pedra e ouro, suporte a rotação de itens (`R`), forja interativa arrastando joias e tooltips 3D com miniatura giratória.

---

## 3. Diagrama de Arquitetura UMG / Slate no UE5

```
+-----------------------------------------------------------------------------------+
|                            ADasiIsometricPlayerController                         |
|                     (Gerencia Input, Raycasts e Viewport HUD)                     |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                 UDasiHUDWidget                                    |
|   (Master UMG Widget: orquestra camadas de HUD, orbes 3D, hotbars e notificações) |
+-----------------------------------------------------------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
|   UDasi3DOrbsWidget   |     | UDasi3DInventoryWidget|     |UDasiTargetPlateWidget |
| (HP/MP 3D Fluids, SD, |     | (Grade 8x8, Paperdoll |     | (Placas de Alvo 3D,   |
|   Stamina / Poise)    |     |  3D RT, Slots Físicos)|     |  Boss HP Multi-Camadas|
+-----------------------+     +-----------------------+     +-----------------------+
                                          |
                                          v
                              +-----------------------+
                              |UDasi3DItemInspector   |
                              | (Tooltip 3D rotativo, |
                              |  Auras +0..+15 PBR)   |
                              +-----------------------+
```

---

## 3. Especificação das Classes C++

### 3.1 `UDasiHUDWidget` (`Source/DasiClient/UI/DasiHUDWidget.h`)
- **Papel:** Controla os componentes primários do HUD em jogo.
- **Campos Principais:**
  - `OrbsContainer`: Container dos globos 3D de Vida e Mana.
  - `ActionBarContainer`: Grade de habilidades ativas (`Q`, `W`, `E`, `R`, `1`, `2`, `3`).
  - `ExperienceProgressBar`: Barra tridimensional no rodapé com entalhes dourados marcando cada 10% de XP.
  - `StaminaPoiseGauge`: Barra horizontal de estamina e postura tática para esquivas.
  - `ShieldDefenseGauge`: Barra de proteção SD (Shield Defense) absorvendo 90% do dano PvP.
  - `MinimapWidget`: Radar topográfico 3D de Lorencia com projeção cônica de visão.

### 3.2 `UDasi3DInventoryWidget` (`Source/DasiClient/UI/Dasi3DInventoryWidget.h`)
- **Papel:** Interface principal de inventário e equipamentos com Render Target 3D.
- **Componentes:**
  - `CharacterPaperdollCapture`: Instância de `USceneCaptureComponent2D` focando um ator manequim 3D (`ADasiCharacterBase`) em um estúdio de iluminação isolado com 3 pontos de luz (Key Light, Fill Light, Rim Light).
  - `PaperdollRenderTarget`: `UTextureRenderTarget2D` (formato `RTF_RGBA8_SRGB`, resolução 512x768).
  - `EquipSlots`: 11 slots físicos de equipamento (Elmo, Armadura, Calças, Luvas, Botas, Arma Dir, Arma Esq/Escudo, Asas, Helper/Pet, Anel Esq, Anel Dir, Pingente).
  - `Grid8x8Container`: Grade com células de 48x48 pixels com suporte a drag-and-drop de itens multi-célula (1x1 até 2x4).

### 3.3 `UDasi3DItemInspectorWidget` (`Source/DasiClient/UI/Dasi3DItemInspectorWidget.h`)
- **Papel:** Tooltip dinâmico de alta fidelidade para armas, armaduras e consumíveis.
- **Recursos 3D:**
  - Miniatura rotativa gerada por `USceneCaptureComponent2D` secundário ou malha com shader translúcido e iluminação direta.
  - Textos coloridos por raridade:
    - Branco: Item comum (+0 a +6).
    - Amarelo/Dourado: Item refinado (+7 a +15) com indicação de bônus de dano.
    - Verde Neon: Item Excelente (*Excellent Item*) com até 6 opções ativas.
    - Ciano/Roxo: Item Antigo (*Ancient Item*) com bônus de conjunto (*Set Bonus*).
    - Amarelo Ouro: Opções da Joia da Harmonia (*Harmony Option*).

### 3.4 `UDasiTargetPlateWidget` (`Source/DasiClient/UI/DasiTargetPlateWidget.h`)
- **Papel:** Exibe informações detalhadas do alvo selecionado com o mouse.
- **Recursos:**
  - Barra de HP suave com barra de atraso fantasma (*Ghost Health Bar*).
  - Medidor de Postura / Stagger: quando esvaziado, o monstro entra em estado de vulnerabilidade com efeito visual dourado na barra.
  - Barra de Chefe Mundial: barra colossal no topo da tela com ícone da criatura e divisores de fase (Fase 1, 2 e 3).

---

## 4. Shaders de Interface Tridimensional (HLSL / Material Expressions)

### 4.1 Shader do Globo de Fluido 3D (`M_UI_FluidOrb_Master.ush`)
- **Geometria:** Uma semiesfera ou calota esférica com profundidade em Z.
- **Simulação de Menisco:** Vetor normal da superfície líquida modulado pela função seno/cosseno com base na inércia de movimento do jogador.
- **Turbulência por Dano:** Quando `OnTakeDamage` é disparado, a variável `TurbulenceIntensity` salta para 1.0 e decai exponencialmente ($t_{decay} = 0.8\text{ s}$), criando ondas turbulentas no topo do líquido.
- **Camada de Vidro Externo:** Reflexo especular com fresnel acentuado (vidro temperado com acabamento dourado chanfrado).

---

## 5. Vetores de Modernização vs. Referência Clássica

| Elemento | Referência Clássica (MU Online) | Implementação Moderna no Dasi (100% 3D) |
| :--- | :--- | :--- |
| **Globos de Vida e Mana** | 2 Sprites 2D estáticos nos cantos inferiores | Esferas de vidro 3D lapidadas com fluidos dinâmicos, turbulência de impacto e iluminação Lumen |
| **Paperdoll (Equipamentos)** | Silhueta 2D preta com ícones estáticos sobrepostos | Viewport 3D em tempo real com iluminação de estúdio, rotação 360°, tecidos Chaos Cloth e shaders +0..+15 |
| **Grade de Itens 8x8** | Ícones 2D planos em grade cinza | Grade com chanfros de pedra e ouro, itens com elevação de relevo (*Depth Offset*) e brilho luminoso |
| **Tooltip de Itens** | Caixa preta com linhas de texto coloridas | Card gótico com mini-viewport 3D da arma/joia giratória no topo, auras pulsantes e comparador de atributos |
| **Atalhos de Magia** | Teclas numéricas selecionavam magia no RMB | Action Bar moderna com atalhos diretos (`Q, W, E, R, Space`), cooldown radial e suporte a combos |
| **Barra de Chefes** | Não existia (apenas target plate minúsculo) | Barra monumental estilo Raid Boss no topo com medidor de Postura/Stagger e fases da batalha |
