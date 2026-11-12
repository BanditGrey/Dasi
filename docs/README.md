# 📚 DOCUMENTAÇÃO MESTRE & ÍNDICE GERAL — DASI MMORPG (CONTINENT OF LEGEND)
> **Versão:** 1.0.0 — Paradigma 100% Idle RPG / 3D Auto-Battler  
> **Servidor Autoritativo:** Node.js / TypeScript (`ws://localhost:8080` & `http://localhost:8080`)  
> **Cliente WebGL 3D:** Three.js PBR (`src/client/dev_viewer/`)  
> **Cliente Desktop AAA:** Unreal Engine 5.5 C++ (`src/client/ue5_project/`)  
> **Status dos Testes:** 🟢 **432 / 432 testes aprovados em 99 suítes (100% green)** + `npm run typecheck` sem erros

---

## 🗺️ 1. ÍNDICE DE DOCUMENTAÇÃO DO PROJETO

### 1.1 Game Design & Mecânicas Canônicas
- [`GDD_Dasi.md`](file:///d:/Dasi/docs/GDD_Dasi.md): Documento de Game Design Geral (Lore, Pilares, Paradigma 100% Idle, Progressão e Loop Central).
- [`Classes_and_Skills.md`](file:///d:/Dasi/docs/Classes_and_Skills.md): As 5 classes canônicas (Dark Knight, Dark Wizard, Fairy Elf, Magic Gladiator, Dark Lord) e suas árvores de habilidades.
- [`Combat_and_Stats.md`](file:///d:/Dasi/docs/Combat_and_Stats.md): Sistema de atributos (FOR, AGI, VIT, ENE), fórmulas de escalonamento, vitais e cálculos autoritativos de dano.
- [`Economy_and_Crafting.md`](file:///d:/Dasi/docs/Economy_and_Crafting.md): Economia de Zen, Joias Sagradas (Bless, Soul, Chaos, Life), taxas de aprimoramento (+0..+15) e Máquina do Caos.
- [`Bestiary_and_Bosses.md`](file:///d:/Dasi/docs/Bestiary_and_Bosses.md): Bestiário, chefes e invasões; inclui doze protótipos GLB estáticos em `prototypes/3d_bestiary/` (sem rig, animações, colisões ou VFX de runtime).
- [`Bestiary_and_World_Vitality_Systems.md`](file:///d:/Dasi/docs/art/Bestiary_and_World_Vitality_Systems.md): Arquitetura completa de animações esqueléticas PBR reais dos monstros, FSM autoritativa do servidor, ecossistema de vida ambiental dinâmica (aves, raposas, morcegos, peixes), tochas com flicker e cidadãos 3D interativos (Han, Pupa, Sentinela, Duende do Caos).
- [`PVP_and_Castle_Siege.md`](file:///d:/Dasi/docs/PVP_and_Castle_Siege.md): Regras de PK, duelo de arenas, batalhas de guildas e o lendário cerco ao castelo (*Castle Siege*).

### 1.2 Level Design & Os 56 Cenários Canônicos (8 Biomas + Cerco + Eventos)
- [`All_56_Scenarios_Master_Index.md`](file:///d:/Dasi/docs/level_design/All_56_Scenarios_Master_Index.md): Catálogo mestre dos **56 cenários canônicos** (47 dos 8 biomas + 5 de Valley of Loren/Castle Siege + 4 Event Arenas) com caixas AABB, cilindros, bounds, spawn points e HP de estruturas destrutíveis.
- **Fonte de verdade em código:** [`CollisionSystem.ts`](file:///d:/Dasi/src/server/world/CollisionSystem.ts) → `SCENARIO_CATALOG` (consumido também pelo Dev Viewer via import map `#dasi/server/`, validado por `scenario_parity.test.ts`).
- [`Lorencia_Level_Design.md`](file:///d:/Dasi/docs/level_design/Lorencia_Level_Design.md): Planícies escuras, cidade murada gótica, tochas e paralelepípedos.
- [`Noria_Feywood_Level_Design.md`](file:///d:/Dasi/docs/level_design/Noria_Feywood_Level_Design.md): Santuário élfico florestal, bioluminescência vegetal e santuário da Máquina do Caos.
- [`Devias_Boreal_Level_Design.md`](file:///d:/Dasi/docs/level_design/Devias_Boreal_Level_Design.md): Fortaleza glacial ártica, tempestades de neve e monstros de gelo.
- [`Atlans_Thalassa_Level_Design.md`](file:///d:/Dasi/docs/level_design/Atlans_Thalassa_Level_Design.md): Cidade submersa abissal, física subaquática e reflexos cáusticos.
- [`Icarus_Aethel_Level_Design.md`](file:///d:/Dasi/docs/level_design/Icarus_Aethel_Level_Design.md): Reino celeste nas nuvens, aerodinâmica de asas e pontes etéreas.
- [`Canonical_Classes_Asset_Extraction_Protocol.md`](file:///d:/Dasi/docs/technical/Canonical_Classes_Asset_Extraction_Protocol.md): Protocolo de extração de assets e engenharia reversa das classes e terrenos canônicos a partir de `reference/mu_roxgaming_5.2/`.
- [`Modelos 3D (.glb) em models/`](file:///d:/Dasi/src/client/dev_viewer/models/): Biomas principais, GLBs estáticos de arenas de evento (`models/events/`) e doze protótipos de bestiário (`models/bestiary/`), exportados com Three.js. Os arquivos estáticos não incluem colisões, rig, animações nem efeitos dinâmicos; esses pertencem ao `CollisionSystem` e ao runtime.

### 1.3 Arquitetura Técnica & Engenharia de Sistemas
- [`Server_Master_Orchestration_and_Functions_Bible.md`](file:///d:/Dasi/docs/technical/Server_Master_Orchestration_and_Functions_Bible.md): Bíblia de Orquestração Máxima e Especificação de Funções do GameServer, detalhando os 16 subsistemas autoritativos, composições de classes, FSMs de evolução (Classes, Quests Sebina/Marlon/Devin, Resets e Master Skill Tree), matriz de protocolo (Opcodes `0x01` a `0xB2`) e integração autoritativa zero-trust.
- [`Network_Protocol.md`](file:///d:/Dasi/docs/technical/Network_Protocol.md): Especificação completa do protocolo de rede binário multiplexado (Opcodes `0x01` a `0x75`).
- [`CollisionSystem.ts`](file:///d:/Dasi/src/server/world/CollisionSystem.ts) & [`dasiCollisionEngine.js`](file:///d:/Dasi/src/client/dev_viewer/dasiCollisionEngine.js): Motor físico de colisão elástica com deslizamento contínuo, limites externos e wireframes de debug.
- [`dasi3dScenarios.js`](file:///d:/Dasi/src/client/dev_viewer/dasi3dScenarios.js): Modelagem 3D procedural e partículas GPU dinâmicas a 60 FPS para os **56 cenários** (8 biomas + Castle Siege + Event Arenas).
- [`HarmonicAudioSynthesizer.ts`](file:///d:/Dasi/src/client/gameplay/HarmonicAudioSynthesizer.ts): Síntese sonora harmônica procedural para 8 superfícies de passos e 8 vórtices de portais.
- [`Chaos_Machine_and_Economy_Architecture.md`](file:///d:/Dasi/docs/technical/Chaos_Machine_and_Economy_Architecture.md): Arquitetura de forja alquímica, lojas de NPCs autoritativas e zero-trust.
- [`Combat_and_Physics_Architecture.md`](file:///d:/Dasi/docs/technical/Combat_and_Physics_Architecture.md): Motor de combate autoritativo, Poise/Stagger, Knockback e IA de monstros.
- [`Action_Gameplay_Mechanics.md`](file:///d:/Dasi/docs/technical/Action_Gameplay_Mechanics.md): Cinemática de herói, portais 3D e áudio harmônico sintetizado via Web Audio API.
- [`Chaos_Machine_and_Economy_Architecture.md`](file:///d:/Dasi/docs/technical/Chaos_Machine_and_Economy_Architecture.md): Arquitetura de forja alquímica, lojas de NPCs autoritativas e zero-trust.
- [`Combat_and_Physics_Architecture.md`](file:///d:/Dasi/docs/technical/Combat_and_Physics_Architecture.md): Motor de combate autoritativo, Poise/Stagger, Knockback e IA de monstros.
- [`Action_Gameplay_Mechanics.md`](file:///d:/Dasi/docs/technical/Action_Gameplay_Mechanics.md): Cinemática de herói, portais 3D e áudio harmônico sintetizado via Web Audio API.
- [`Advanced_Classes_Physics.md`](file:///d:/Dasi/docs/technical/Advanced_Classes_Physics.md): Física avançada por arquétipo (Inércia, atrito, i-frames e rotações).
- [`Skills_Physics_Simulation.md`](file:///d:/Dasi/docs/technical/Skills_Physics_Simulation.md): Simulação física volumétrica de habilidades (Twisting Slash, Hellfire, etc.).
- [`Master_Asset_Production_Manifest.md`](file:///d:/Dasi/docs/technical/Master_Asset_Production_Manifest.md): Manifesto exaustivo de 71 KB detalhando todos os assets a serem produzidos (Rigs, Sockets, Texturas PBR, Malhas Modulares, Efeitos Niagara e MetaSounds).

### 1.4 Arquitetura do Cliente Unreal Engine 5.5
- [`UE5_Client_Architecture.md`](file:///d:/Dasi/docs/technical/UE5_Client_Architecture.md): Visão geral do pipeline C++ para Unreal Engine 5.5.
- [`UE5_Rendering_Architecture.md`](file:///d:/Dasi/docs/technical/UE5_Rendering_Architecture.md): Lumen, Nanite, Virtual Shadow Maps e pipeline HLSL SM 6.0+.
- [`UE5_Combat_and_Character_Architecture.md`](file:///d:/Dasi/docs/technical/UE5_Combat_and_Character_Architecture.md): Motion Warping, Gameplay Ability System (GAS) e sincronização de combate.
- [`UE5_UI_and_3D_HUD_Architecture.md`](file:///d:/Dasi/docs/technical/UE5_UI_and_3D_HUD_Architecture.md): Orbes 3D fluidos no espaço de tela, Slate/UMG e console tático AFK.
- [`UE5_World_Entities_and_Lorencia_Sync.md`](file:///d:/Dasi/docs/technical/UE5_World_Entities_and_Lorencia_Sync.md): Sincronização de entidades do mundo, World Partition e replicação de NPCs.

---

## 💻 2. ESTRUTURA DO CÓDIGO FONTE

```
d:\Dasi\
├── docs/                               # Documentação oficial, GDD, Level Design e Specs Técnicas
│   ├── art/                            # Artes conceituais e galeria visual dos biomas
│   ├── level_design/                   # Especificações dos 56 cenários (8 biomas + Cerco + Eventos)
│   └── technical/                      # Especificações de rede, física, UE5 e manifesto de assets
├── src/
│   ├── client/
│   │   ├── dev_viewer/                 # Cliente WebGL Three.js PBR em tempo real
│   │   │   ├── index.html              # Interface do jogo com HUD 3D, console tático e modais
│   │   │   ├── app.js                  # Orquestrador do cliente (WebSocket, HUD, Modais, Drops)
│   │   │   ├── dasi3dRealtimeArena.js  # Arena Three.js com monstros, herói, portais e iluminação
│   │   │   ├── dasi3dViewer.js         # Inspecionador 3D orbital 360° para heróis, monstros e sets
│   │   │   ├── dasi3dContent.js        # Modeladores procedurais 3D de armaduras, armas e monstros
│   │   │   ├── dasi3dScenarios.js      # Geradores 3D dos 5 biomas canônicos
│   │   │   ├── dasiActionGameplay.js   # Módulos de áudio procedural, portais, level up e motor idle
│   │   │   └── style.css               # Folha de estilo dark fantasy com efeitos de neon e orbes
│   │   ├── gameplay/                   # Módulos TypeScript puros e testes do cliente
│   │   │   ├── IdleAutoCombatEngine.ts # Motor 100% Idle (Target, Approach, Attack, Potion, Loot, AFK)
│   │   │   ├── HarmonicAudioSynthesizer.ts # Síntese procedural Web Audio API
│   │   │   ├── LevelUpSystem.ts        # Auréola de level up, colunas de luz e atributos
│   │   │   ├── ChaosMachineVFX.ts      # Sequência cinemática de 4 fases da Chaos Machine
│   │   │   ├── PortalSystem.ts         # Portais 3D e detecção de proximidade
│   │   │   └── tests/                  # Testes unitários do gameplay e combate idle
│   │   └── ue5_project/                # Código C++ nativo para Unreal Engine 5.5
│   ├── server/
│   │   ├── combat/                     # Motor de combate autoritativo, spawner e monstros
│   │   ├── economy/                    # Lojas de NPCs (Han e Pupa) e economia de Zen
│   │   ├── inventory/                  # Grid 8x8, Joias (+0..+15) e Máquina do Caos
│   │   ├── network/                    # GameServer WebSocket/REST e SessionManager
│   │   └── world/                      # Motor de colisão espacial
│   └── shaders/                        # Shaders HLSL SM 6.0+ para Unreal Engine e WebGPU
```

---

## ⚡ 3. COMO INICIALIZAR E TESTAR

### 3.1 Executar a Suíte de Testes Automatizados (432 testes em 99 suítes)
```powershell
npm test
npm run typecheck   # tsc -p tsconfig.json — 0 erros
```
*Executa testes de inventário, economia, forja do caos, servidor de rede, motor de combate, gameplay de ação, caça 100% idle, catálogo e colisão dos 56 cenários, **paridade servidor ⇄ cliente**, arenas de evento, carregamento e animação dos GLBs do bestiário, vida ambiental viva (aves, raposas, morcegos, peixes, tochas, NPCs 3D) e persistência autoritativa SQLite.*

### 3.2 Iniciar o Servidor de Jogo Autoritativo
```powershell
npm start
```
*Inicializa o GameServer em `http://localhost:8080` (HTTP REST) e `ws://localhost:8080` (WebSocket).*

Os controles administrativos do Dev Viewer (spawn manual de chefes, invasões e caixas) ficam desligados por padrão. Para habilitá-los somente em desenvolvimento, inicie com `DASI_DEV_CONTROLS=1 npm start`.

### 3.3 Acessar o Cliente 3D no Navegador
Abra o navegador em `http://localhost:8080/index.html` para testar:
- **Arena de Combate 3D 100% Idle:** O herói adquire alvos, se aproxima, executa rotação de habilidades, usa poções e recolhe drops de forma autônoma.
- **Console Tático AFK:** Métricas de Uptime, Mobs Derrotados, Zen, Joias e DPS em tempo real.
- **Alocação de Atributos (+5 pontos por nível):** Botões `[+]` no banner do herói para FOR, AGI, VIT e ENE.
- **Relatório de Caça AFK Offline:** Simulação de 1h a 12h de caça com resgate de recompensas.
- **Máquina do Caos:** Forja interativa de armas, asas e refino +10..+15 com cinemática 3D.
- **Lojas de Mercadores:** Compras de equipamentos e elixires com Han the Blacksmith e Pupa the Potion Girl.
- **Visualizador 3D 360°:** Inspeção completa de heróis com auras +0 a +15, monstros clássicos e biomas.
