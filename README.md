# DASI — Continent of Legend Reimagined

Protótipo de MMORPG / ARPG inspirado na atmosfera clássica de **MU Online**, com identidade própria, visualizador WebGL e sistemas de jogo em desenvolvimento. Não é um produto pronto para produção.

---

## Estado atual e documentação

- **Cenários:** 56 concepts individuais e 56 GLBs procedurais de blockout. O editor experimental permite alterações visuais em todos os cenários e exportação individual ou em lote; isso não atualiza colisões ou o servidor. As bordas circulares ainda têm áreas não editáveis.
- **Arenas de evento:** GLBs estáticos dedicados para Devil Square (`EVT_02`), Chaos Castle (`EVT_03`) e Coliseu de Duelos (`EVT_04`), além dos 56 blockouts. Os GLBs são visuais e não contêm colisões, animações nem VFX de runtime.
- **Bestiário:** 12 protótipos GLB estáticos para seis chefes e seis criaturas da Invasão Dourada; integrados ao Dev Viewer, mas não são assets finais nem contêm colisões ou VFX de runtime.
- **Bestiário articulado:** os mesmos 12 protótipos em uma segunda família de GLBs com puppet de partes rígidas (pivôs), 5 clips cada (IDLE, locomocão do arquétipo, ATTACK, HURT e DEATH) e 3 texturas PBR procedurais por criatura (baseColor, metallicRoughness, normal). A geometria e a pose de repouso são idênticas às estáticas, sem skins nem ossos; colisão, dano e VFX continuam no runtime. Detalhes em [bestiário articulado](docs/art/Bestiario_Animado.md).
- **Personagens:** cinco concepts iniciais e cinco blockouts GLB modulares, com 60 peças experimentais de armadura. São formas procedurais simples, sem rig esquelético, skinning ou animações GLTF; não são modelos finais.
- **Servidor:** protótipo sem autenticação real, persistência completa ou autoridade integral de movimento. Não exponha a redes não confiáveis.
- **Validação:** execute `npm run typecheck` e `npm test`; os testes automatizados não substituem revisão visual, testes em navegador nem medição de desempenho.

Guias e planos: [pisos e exportação](docs/level_design/Pisos_Modulares.md), [pendências dos mapas](docs/level_design/Plano_Mapas_Modulares.md), [personagens e slots de armadura](docs/art/Personagens_Modulares.md), [plano de personagens](docs/art/Plano_Personagens.md) e [bestiário articulado](docs/art/Bestiario_Animado.md).

Estrutura geral (alguns arquivos históricos são apenas referências ou protótipos):

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
│   │   ├── Scenery_Art_Gallery.md        # Galeria histórica de referências
│   │   └── scenery/                      # Referências de cenários
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
├── prototypes/3d_scenery/                # Modelos GLB de referência existentes
│   ├── lorencia_citadel.glb              # Cidadela de Lorencia (56m x 56m)
│   ├── noria_feywood.glb                 # Santuário de Noria (Sequóia 36m, Máquina do Caos)
│   ├── devias_boreal.glb                 # Fortaleza de Devias (Braseiro Rei 12m, Catedral)
│   ├── dungeon_catacombs.glb             # Catacumbas do Abismo (Colunas, Ácido, Gaiolas)
│   ├── lost_tower_abyss.glb              # Torre Infernal (Basalto, Magma, Trono de Balrog)
│   ├── atlans_thalassa.glb               # Reino Oceânico (Domo de Ar, 10 Costelas Leviatã)
│   ├── tarkan_desert.glb                 # Deserto de Cinzas (Dunas, Verme 9,5m, Engrenagens)
│   ├── icarus_aethel.glb                 # Ilhas Flutuantes (Aetherita, Pontes de Luz)
│   ├── valley_of_loren_citadel.glb       # Batalha de Cerco (Catapultas, Fosso de Lava, Trono)
│   ├── blood_castle_bridge.glb           # Ponte do Martírio (120m, 16 Arcanjos, Altar Divino)
│   ├── devil_square.glb                  # Arena circular, pentagrama, totens e grades (EVT_02)
│   ├── chaos_castle.glb                  # 36 lajes sobre o abismo e ruínas (EVT_03)
│   └── duel_coliseum.glb                  # Coliseu octogonal, arquibancadas e placar (EVT_04)
├── prototypes/3d_bestiary_animated/      # Mesmos 12 protótipos com pivôs + 5 clips GLTF
├── prototypes/3d_bestiary/               # Protótipos visuais estáticos de chefes/invasão
│   ├── ice_queen.glb                     # Rainha de Gelo
│   ├── gorgon.glb                        # Gorgon
│   ├── hydra.glb                         # Hydra de três cabeças
│   ├── balrog.glb                        # Balrog com membros e asas
│   ├── zaikan.glb                        # Quimera biomecânica do deserto
│   ├── kundun.glb                        # Lorde do Caos
│   ├── golden_titan.glb                  # Campeão da Invasão Dourada
│   ├── golden_budge_dragon.glb           # Wyrmling dourado
│   ├── golden_soldier.glb                # Cavaleiro esqueleto dourado
│   ├── golden_lizard_king.glb            # Monarca anfíbio
│   ├── golden_tantalos.glb               # Titã solar do deserto
│   └── golden_dragon.glb                 # Dragão Dourado colossal
│
├── src/                                  # Código-Fonte do Jogo
│   ├── client/
│   │   ├── dev_viewer/                   # Interface Web Interativa (WebGL Three.js PBR)
│   │   │   ├── index.html                # Visualizador 3D, Split-Screen Concept Art vs 3D
│   │   │   ├── style.css                 # Interface Sombria e Dourada
│   │   │   ├── app.js                    # WebSocket Client, Alternância de Cenários
│   │   │   ├── dasi3dRealtimeArena.js    # Motor 3D Three.js com Câmera e Partículas GPU
│   │   │   ├── dasi3dContent.js          # Geradores procedurais e carregamento de GLB
│   │   │   ├── dasiCollisionEngine.js    # Motor de Colisão Física com Deslizamento
│   │   │   ├── models/                   # GLBs existentes, blockouts e módulos experimentais
│   │   │   └── art/                      # Referências e concepts
│   │   └── gameplay/                     # Sistemas de Combate Client-Side (TypeScript)
│   │
│   ├── server/                           # Protótipo de servidor Node.js / TypeScript
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
    ├── blender_dasi_world_builder.py     # Gerador de biomas e Valley/Blood Castle (Blender 5.2 LTS)
    ├── event_arena_models.mjs            # Cenas PBR estáticas dedicadas de EVT_02..EVT_04
    ├── export_event_arenas.mjs           # Exportação/sincronização dos GLBs de evento
    ├── bestiary_models.mjs               # Construtores estáticos dos protótipos de chefes
    ├── golden_invasion_models.mjs        # Geometria estática das criaturas douradas
    ├── export_bestiary_glbs.mjs          # Exportação/sincronização dos GLBs estáticos do bestiário
    ├── export_bestiary_animated.mjs      # Rig rígido + clips GLTF do bestiário articulado
    ├── procedural_textures.mjs           # Mapas PBR procedurais (ruído periódico) + codec PNG
    └── glb_texture_injector.mjs          # Injeta as texturas no contêiner GLB e completa UVs
```

---

## 🚀 Como Iniciar o Servidor e Visualizar os Mundos 3D

```bash
# Requer Node.js 22.18+ e npm
npm ci
# Iniciar o Servidor de Jogo e Dev Viewer Web (somente localhost)
npm start
```

Para regenerar os GLBs de arenas e bestiário (Node.js/Three.js):

```bash
npm run build:event-glb
npm run build:bestiary-glb           # família estática
npm run build:bestiary-animated-glb  # família articulada (pivôs + 5 clips + PBR)
```

No Dev Viewer, a categoria **Monstros** permite inspecionar os 12 protótipos. Com os GLBs articulados presentes, o painel **Clips do Bestiário Articulado** reproduz IDLE, locomocão, ATTACK, HURT e DEATH; sem eles, o visualizador recai para o protótipo estático. Combate, colisão e efeitos permanecem fora dos GLBs.

Abra no navegador:
👉 **`http://localhost:8080`**

- **Cenários:** escolha um dos 56 cenários no visualizador; o editor de tiles e os botões de exportação são experimentais.
- **Comparador:** clique em **"Comparar com Concept Art"** para ver a referência ao lado da prévia 3D.
- **Heróis modulares:** na categoria Heróis, ative **Visualizar blockout modular** para experimentar a troca visual de peças; as mudanças não são salvas nem afetam o jogo.
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
npm start          # Servidor protótipo + Dev Viewer em http://localhost:8080
npm test           # todos os arquivos src/**/*.test.ts
npm run typecheck  # tsc --noEmit (strict)
npm run test:parity # paridade do catálogo servidor ⇄ cliente
```
