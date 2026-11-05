# DASI — Continent of Legend Reimagined

Projeto de jogo MMORPG / ARPG de nova geração inspirado no clássico **Continent of Legend** (MU Online), combinando a lendária progressão por joias, asas majestosas, eventos épicos e combate visceral com **modelos 3D reais (`.glb`) compilados no Blender 5.2.2 LTS**, renderizados em WebGL com PBR, iluminação dinâmica e sistemas de partículas GPU a 60 FPS.

---

## 🏛️ Status do Projeto: 56 Cenários Canônicos Implementados, Concept Arts AAA & Modelos 3D GLB Reais

O projeto conta com arquitetura autoritativa completa, **100% de testes automatizados aprovados (133 testes em 41 suítes)**, **type-check limpo (`tsc --noEmit`)** e modelos 3D compilados em alta fidelidade:

```text
Dasi/
├── docs/                                 # Documentação de Design e Engenharia
│   ├── GDD_Dasi.md                       # Game Design Document Central
│   ├── Combat_and_Stats.md               # Sistema de 5 Atributos e Fórmulas de Dano
│   ├── Classes_and_Skills.md             # As 5 Classes e Árvores de Evolução
│   ├── Bestiary_and_Bosses.md            # Chefes de Múltiplas Fases e Invasões Douradas
│   ├── Economy_and_Crafting.md           # Economia das Joias e Máquina do Caos
│   ├── PVP_and_Castle_Siege.md           # Sistema Moral de PK e Batalha pelo Castelo
│   ├── art/                              # Galeria de Arte Conceitual Oficial
│   │   ├── Scenery_Art_Gallery.md        # Catálogo Completo das 10 Concept Arts AAA
│   │   └── scenery/                      # Imagens Panorâmicas 16:9 em Ultra-HD
│   ├── level_design/
│   │   ├── All_56_Scenarios_Master_Index.md  # Índice Geral dos 56 Cenários Canônicos
│   │   ├── Lorencia_Level_Design.md      # Castelo de Loren & Cidadela de Lorencia
│   │   ├── Noria_Feywood_Level_Design.md # Santuário Arbóreo de Feywood & Máquina do Caos
│   │   ├── Devias_Boreal_Level_Design.md # Fortaleza Gélida & O Grande Braseiro Rei
│   │   ├── Dungeon_Catacombs_Level_Design.md # Catacumbas Subterrâneas & Covil da Górgona
│   │   ├── Lost_Tower_Inferno_Level_Design.md # A Torre de Basalto & Trono de Balrog
│   │   ├── Atlans_Thalassa_Level_Design.md # Reino Subaquático & Cemitério dos Leviatãs
│   │   ├── Tarkan_Desert_Level_Design.md # Deserto de Kar-Dune & Fóssil do Verme Titânico
│   │   ├── Icarus_Aethel_Level_Design.md # Arquipélago Celeste dos Aethel & Ninho da Fênix
│   │   ├── Valley_of_Loren_Castle_Siege_Level_Design.md # Cerco ao Castelo & Estátuas da Vida
│   │   └── Event_Arenas_Level_Design.md  # Blood Castle, Devil Square, Chaos Castle e Coliseu
│   └── development_logs/                 # Registros e Histórico Técnico de Sessões
│
├── prototypes/3d_scenery/                # Modelos 3D Reais Compilados (.glb PBR)
│   ├── lorencia_citadel.glb              # Cidadela de Lorencia (56m x 56m)
│   ├── noria_feywood.glb                 # Santuário de Noria (Sequóia 36m, Máquina do Caos)
│   ├── devias_boreal.glb                 # Fortaleza de Devias (Braseiro Rei 12m, Catedral)
│   ├── dungeon_catacombs.glb             # Catacumbas do Abismo (Colunas, Ácido, Gaiolas)
│   ├── lost_tower_abyss.glb              # Torre Infernal (Basalto, Magma, Trono de Balrog)
│   ├── atlans_thalassa.glb               # Reino Oceânico (Domo de Ar, 10 Costelas Leviatã)
│   ├── tarkan_desert.glb                 # Deserto de Cinzas (Dunas, Verme 9,5m, Engrenagens)
│   ├── icarus_aethel.glb                 # Ilhas Flutuantes (Aetherita, Pontes de Luz)
│   ├── valley_of_loren_citadel.glb       # Batalha de Cerco (Catapultas, Fosso de Lava, Trono)
│   └── blood_castle_bridge.glb           # Ponte do Martírio (120m, 16 Arcanjos, Altar Divino)
│
├── src/                                  # Código-Fonte do Jogo
│   ├── client/
│   │   ├── dev_viewer/                   # Interface Web Interativa (WebGL Three.js PBR)
│   │   │   ├── index.html                # Visualizador 3D, Split-Screen Concept Art vs 3D
│   │   │   ├── style.css                 # Interface Sombria e Dourada
│   │   │   ├── app.js                    # WebSocket Client, Alternância de Cenários
│   │   │   ├── dasi3dRealtimeArena.js    # Motor 3D Three.js com Câmera e Partículas GPU
│   │   │   ├── dasi3dContent.js          # Pipeline de Carregamento GLB e Remoção de Mocks
│   │   │   ├── dasiCollisionEngine.js    # Motor de Colisão Física com Deslizamento
│   │   │   ├── models/                   # Modelos 3D Reais GLB Sincronizados
│   │   │   └── art/                      # 10 Concept Arts Oficiais AAA (16:9)
│   │   └── gameplay/                     # Sistemas de Combate Client-Side (TypeScript)
│   │
│   ├── server/                           # Servidor Autoritativo Node.js / TypeScript
│   │   ├── network/                      # GameServer WebSocket (Porta 8299)
│   │   ├── world/                        # CollisionSystem (Catálogo dos Cenários Canônicos)
│   │   ├── combat/                       # Motor de Combate Autoritativo & Spawner
│   │   ├── bosses/                       # Chefes Mundiais e Invasões Douradas
│   │   ├── events/                       # Blood Castle, Devil Square, Chaos Castle e Duelos
│   │   ├── dungeons/                     # Masmorras de 3 Andares com Avaliação de Ranque
│   │   └── inventory/                    # Grade 8x8, Joias e Máquina do Caos
│   │
│   └── shaders/                          # Shaders HLSL e GLSL
│
└── tools/
    └── blender_dasi_world_builder.py     # Gerador Procedural Automatizado (Blender 5.2 LTS)
```

---

## 🚀 Como Iniciar o Servidor e Visualizar os Mundos 3D

```bash
# Requer Node.js 22.18+ e npm
npm ci
# Iniciar o Servidor de Jogo e Dev Viewer Web (somente localhost)
npm start
```

Abra no navegador:
👉 **`http://localhost:8080`**

- **Navegação pelos 10 Cenários Mestre:** Selecione qualquer um dos reinos no menu superior para carregar instantaneamente o modelo 3D real correspondente com partículas dinâmicas e iluminação PBR.
- **Comparador Split-Screen:** Clique em **"Comparar com Concept Art"** para visualizar a tela dividida lado a lado (3D ao vivo vs Concept Art original).
- **Inspeção de Colisão:** Ative o botão de colisão para visualizar os colisores físicos em tempo real.

### Limitações de segurança e persistência

Este servidor é um **protótipo local**, não um servidor de produção. O login aceita
qualquer nome, não verifica credenciais e não emite um JWT real. Personagens,
inventários, guildas e eventos vivem em memória; desconectar ou reiniciar pode
perder dados. Não exponha o servidor a redes não confiáveis: posição, cadência e
autorização de várias ações ainda precisam de validação autoritativa, além de
autenticação real, TLS, limites de taxa e armazenamento persistente.

O padrão é `127.0.0.1:8080`. `PORT=...` e `HOST=...` alteram endereço e porta.
Para testar recursos destrutivos de desenvolvimento **somente localmente**, use
`DASI_DEV_CONTROLS=1 npm start`. Isso habilita comandos de criação de itens e
chefes e rotas de controle, sem autenticação administrativa; nunca combine essa
opção com exposição pública. Sem ela, esses comandos estão desativados.

---

## 🧭 Catálogo Único de Cenários (Servidor ⇄ Cliente)

Os **56 cenários canônicos** vivem em uma **única fonte de verdade**:
`src/server/world/CollisionSystem.ts` → `SCENARIO_CATALOG`.

| Camada | Como consome |
| :--- | :--- |
| Servidor autoritativo | `CollisionSystem.resolveMovement()` usa o catálogo direto |
| Dev Viewer (Three.js) | `dasiCollisionEngine.js` importa `#dasi/server/world/CollisionSystem.ts` (import map `#dasi/server/` → `/src/server/`) e registra o mesmo catálogo |
| Geometria 3D | `dasi3dScenarios.js` constrói a cena procedural de cada um dos 56 IDs |

- `scenario_parity.test.ts` falha o build se cliente e servidor divergirem em **ID, bounds, spawn point, quantidade de colisores ou resultado físico**.
- Zonas de perigo (`HAZARD`: lava, ácido, areia movediça) são atravessáveis e reportadas em `hazardsHit`, sem bloquear o movimento.
- Estruturas destrutíveis (`destructibleHp`): Portão Ciclópico 25M HP (`VOL_02`), 4 Estátuas da Vida 8M HP (`VOL_03`) e Portão do Arcanjo 5M HP (`EVT_01`).
- Cenários de Castle Siege (`VOL_*`) e Event Arenas (`EVT_*`) são marcados com `instanced: true` (instâncias isoladas do mundo aberto).

### Comandos principais

```bash
npm start          # Servidor autoritativo + Dev Viewer em http://localhost:8080
npm test           # todos os arquivos src/**/*.test.ts
npm run typecheck  # tsc --noEmit (strict)
npm run test:parity # paridade do catálogo servidor ⇄ cliente
```
